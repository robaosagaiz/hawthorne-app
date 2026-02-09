import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchDailyLogs, fetchUserProfile } from '../../services/dataService';
import { fetchDailyLogsFromApi, fetchPatientFromApi, checkApiHealth, patientToUserProfile } from '../../services/apiService';
import type { DailyLog, UserProfile } from '../../types';
import StatCard from '../ui/StatCard';
import EnergyChart from './EnergyChart';
import MacroChart from './MacroChart';
import WeightChart from './WeightChart';
import DailyLogTable from './DailyLogTable';
import TDEECardV2 from './TDEECardV2';
import '../../utils/chartSetup';
import { Cloud, Database, AlertCircle, TrendingDown, TrendingUp, Scale, ChevronDown, ChevronUp } from 'lucide-react';

interface DashboardProps {
    userId?: string;
    isAdmin?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ userId, isAdmin = false }) => {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'api' | 'firestore' | 'none'>('none');
    const [error, setError] = useState<string | null>(null);
    const [showDetailedLog, setShowDetailedLog] = useState(false);
    const [latestActivityWeight, setLatestActivityWeight] = useState<number | null>(null);

    // Priority: Prop userId -> Current Auth UID
    const targetId = userId || currentUser?.uid;

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Default targets (Fallback)
    const defaultTargets = {
        energy: 2000,
        protein: 150,
        carbs: 200,
        fats: 60,
        weight: 0
    };

    const targets = userProfile?.targets || defaultTargets;

    // Normalize date to YYYY-MM-DD (handles DD-MM-YYYY from Activities)
    const normalizeDate = (d: string): string => {
        if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
            const [dd, mm, yyyy] = d.split('-');
            return `${yyyy}-${mm}-${dd}`;
        }
        return d; // Already YYYY-MM-DD
    };

    // Fetch weight records from Activities and merge into daily logs
    const fetchAndMergeWeights = async (dailyLogs: DailyLog[], grupoId: string, protocolStartDate?: string): Promise<DailyLog[]> => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const sinceParam = protocolStartDate ? `?since=${encodeURIComponent(protocolStartDate)}` : '';
            const res = await fetch(`${API_BASE}/api/activities/${encodeURIComponent(grupoId)}${sinceParam}`);
            if (!res.ok) return dailyLogs;
            const activities: Array<{ type: string; date: string; value: number | null }> = await res.json();

            // Get weight records from Activities, build a map of normalized date -> latest weight
            const weightByDate = new Map<string, number>();
            let lastWeight: number | null = null;
            for (const a of activities) {
                if (a.type === 'peso' && a.value && a.value > 0) {
                    const normDate = normalizeDate(a.date);
                    weightByDate.set(normDate, a.value);
                    lastWeight = a.value;
                }
            }

            // Store latest activity weight for the "Peso Atual" stat card
            setLatestActivityWeight(lastWeight);

            if (weightByDate.size === 0) return dailyLogs;

            // Merge: for each daily log, if Activities has a weight for that date, use it (priority)
            const merged = dailyLogs.map(log => {
                const normLogDate = normalizeDate(log.date);
                const actWeight = weightByDate.get(normLogDate);
                if (actWeight) {
                    return { ...log, weight: actWeight };
                }
                return log;
            });

            // Also add weight-only entries for dates that exist in Activities but not in daily logs
            const existingDates = new Set(dailyLogs.map(l => normalizeDate(l.date)));
            const weightOnlyEntries: DailyLog[] = [];
            for (const [date, weight] of weightByDate.entries()) {
                if (!existingDates.has(date)) {
                    weightOnlyEntries.push({
                        id: `activity-${date}`,
                        date,
                        energy: 0,
                        protein: 0,
                        carbs: 0,
                        fats: 0,
                        weight
                    });
                }
            }

            return [...merged, ...weightOnlyEntries].sort((a, b) => a.date.localeCompare(b.date));
        } catch (err) {
            console.error('Error fetching activities for weight merge:', err);
            return dailyLogs;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!targetId) {
                setError('Nenhum usuário selecionado');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Try API first (Google Sheets)
                const apiAvailable = await checkApiHealth();
                
                if (apiAvailable) {
                    // Fetch patient profile from API
                    const patient = await fetchPatientFromApi(targetId);
                    if (patient) {
                        setUserProfile(patientToUserProfile(patient));
                    }
                    
                    // Fetch daily logs from API (filtered by protocol start date)
                    const apiLogs = await fetchDailyLogsFromApi(targetId, patient?.startDate);
                    if (apiLogs.length > 0) {
                        // Merge weight data from Activities
                        const mergedLogs = await fetchAndMergeWeights(apiLogs, targetId, patient?.startDate);
                        setLogs(mergedLogs);
                        setDataSource('api');
                        setLoading(false);
                        return;
                    } else {
                        // Even without food logs, try to get activity weights (for weight chart + TDEE)
                        await fetchAndMergeWeights([], targetId, patient?.startDate);
                    }
                }

                // Fallback to Firestore
                const profile = await fetchUserProfile(targetId);
                if (profile) {
                    setUserProfile(profile);
                }

                const firestoreLogs = await fetchDailyLogs(profile?.uid || targetId);
                if (firestoreLogs.length > 0) {
                    setLogs(firestoreLogs);
                    setDataSource('firestore');
                } else {
                    setDataSource('none');
                    if (!apiAvailable) {
                        setError('API indisponível e Firestore sem dados');
                    }
                }
            } catch (err) {
                console.error('Error loading dashboard data:', err);
                setError('Erro ao carregar dados');
            }

            setLoading(false);
        };

        loadData();
    }, [targetId]);

    // Calculate averages (exclude weight-only entries with zero calories)
    const foodLogs = logs.filter(l => l.energy > 0);
    const averages = foodLogs.length > 0 ? foodLogs.reduce((acc, curr) => ({
        energy: acc.energy + curr.energy,
        protein: acc.protein + curr.protein,
        carbs: acc.carbs + curr.carbs,
        fats: acc.fats + curr.fats
    }), { energy: 0, protein: 0, carbs: 0, fats: 0 }) : { energy: 0, protein: 0, carbs: 0, fats: 0 };

    if (foodLogs.length > 0) {
        averages.energy = Math.round(averages.energy / foodLogs.length);
        averages.protein = Math.round(averages.protein / foodLogs.length);
        averages.carbs = Math.round(averages.carbs / foodLogs.length);
        averages.fats = Math.round(averages.fats / foodLogs.length);
    }

    // Weight tracking — merge food log weights + Activities weights
    const logsWithWeight = logs.filter(l => l.weight && l.weight > 0);
    // Use latest activity weight if available, otherwise fall back to food log weight
    const currentWeight = latestActivityWeight || (logsWithWeight.length > 0 ? logsWithWeight[logsWithWeight.length - 1].weight : null);
    const firstWeight = logsWithWeight.length > 0 ? logsWithWeight[0].weight : null;
    const weightChange = (currentWeight && firstWeight) ? currentWeight - firstWeight : null;
    const hasWeightData = logsWithWeight.length >= 2;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-teal-600">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (error && logs.length === 0) {
        return (
            <div className="flex h-full items-center justify-center min-h-[50vh]">
                <div className="text-center p-8 bg-red-50 rounded-xl">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <p className="text-red-400 text-sm mt-2">Verifique se o servidor da API está rodando.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Data Source Indicator */}
            <div className="flex justify-end">
                <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                    dataSource === 'api' 
                        ? 'bg-green-100 text-green-700' 
                        : dataSource === 'firestore'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                }`}>
                    {dataSource === 'api' ? (
                        <><Cloud size={12} /> Dados da Planilha (Google Sheets)</>
                    ) : dataSource === 'firestore' ? (
                        <><Database size={12} /> Dados do Firestore</>
                    ) : (
                        'Sem dados'
                    )}
                </span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Média Calórica"
                    value={averages.energy}
                    unit="kcal"
                    color="teal"
                    trend={targets.energy > 0 ? `${Math.round((averages.energy / targets.energy) * 100)}% da Meta` : undefined}
                    subtext={`Meta: ${targets.energy}`}
                />
                <StatCard
                    title="Média Proteínas"
                    value={averages.protein}
                    unit="g/dia"
                    color="blue"
                    subtext={`Meta: ${targets.protein}g`}
                />
                <StatCard
                    title="Média Carboidratos"
                    value={averages.carbs}
                    unit="g/dia"
                    color="orange"
                    subtext={`Meta: ${targets.carbs}g`}
                />
                <StatCard
                    title="Peso Atual"
                    value={currentWeight ? currentWeight.toFixed(1) : (userProfile?.currentWeight || 'N/A')}
                    unit="kg"
                    color="purple"
                    trend={weightChange !== null ? `${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} kg no período` : undefined}
                    subtext={userProfile?.currentWeight ? `Inicial: ${userProfile.currentWeight}kg` : (logsWithWeight.length > 0 ? `${logsWithWeight.length} registros` : "Sem dados de peso")}
                />
            </div>

            {/* Charts */}
            {(foodLogs.length > 0 || hasWeightData) ? (
                <>
                    {foodLogs.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Consumo de Energia vs. Meta</h3>
                        <div className="relative h-72">
                            <EnergyChart data={foodLogs} target={targets.energy} />
                        </div>
                    </div>
                    )}

                    {foodLogs.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Evolução Diária de Macronutrientes</h3>
                        <div className="relative h-80">
                            <MacroChart data={foodLogs} />
                        </div>
                    </div>
                    )}

                    {/* Weight Evolution Chart */}
                    {hasWeightData && (
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-purple-500" />
                                    <h3 className="text-lg font-bold text-gray-700">Evolução de Peso</h3>
                                </div>
                                {weightChange !== null && (
                                    <div className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
                                        weightChange <= 0 
                                            ? 'bg-green-50 text-green-700' 
                                            : 'bg-red-50 text-red-600'
                                    }`}>
                                        {weightChange <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                        {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                                    </div>
                                )}
                            </div>
                            <div className="relative h-72">
                                <WeightChart 
                                    data={logs}
                                    initialWeight={userProfile?.currentWeight}
                                    targetWeight={targets.weight}
                                />
                            </div>
                        </div>
                    )}

                    {/* Modelo Energético v2 (Paper Linearizado) */}
                    {targetId && (
                    <TDEECardV2
                        grupoId={targetId}
                        targetCalories={targets.energy}
                        patientGoal="loss"
                        isAdmin={isAdmin}
                    />
                    )}

                    {foodLogs.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <button
                            onClick={() => setShowDetailedLog(!showDetailedLog)}
                            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="text-left">
                                <h3 className="text-lg font-bold text-gray-700">Registro Diário Detalhado</h3>
                                <p className="text-sm text-gray-400 mt-1">{foodLogs.length} registros encontrados</p>
                            </div>
                            <div className={`p-2 rounded-full ${showDetailedLog ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'} transition-colors`}>
                                {showDetailedLog ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </button>
                        {showDetailedLog && (
                            <DailyLogTable data={foodLogs} targetEnergy={targets.energy} />
                        )}
                    </div>
                    )}
                </>
            ) : (
                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <div className="text-gray-400 mb-4">
                        <Database className="w-16 h-16 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum registro encontrado</h3>
                    <p className="text-gray-400">Os dados deste paciente aparecerão aqui quando houver registros na planilha.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
