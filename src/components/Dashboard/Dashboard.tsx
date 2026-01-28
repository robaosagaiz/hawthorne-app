import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchDailyLogs, fetchUserProfile } from '../../services/dataService';
import { fetchDailyLogsFromApi, fetchPatientFromApi, checkApiHealth, patientToUserProfile } from '../../services/apiService';
import type { DailyLog, UserProfile } from '../../types';
import StatCard from '../ui/StatCard';
import EnergyChart from './EnergyChart';
import MacroChart from './MacroChart';
import DistributionChart from './DistributionChart';
import DailyLogTable from './DailyLogTable';
import TDEECard from './TDEECard';
import '../../utils/chartSetup';
import { Cloud, Database, AlertCircle } from 'lucide-react';

interface DashboardProps {
    userId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'api' | 'firestore' | 'none'>('none');
    const [error, setError] = useState<string | null>(null);

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
                    
                    // Fetch daily logs from API
                    const apiLogs = await fetchDailyLogsFromApi(targetId);
                    if (apiLogs.length > 0) {
                        setLogs(apiLogs);
                        setDataSource('api');
                        setLoading(false);
                        return;
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

    // Calculate averages
    const averages = logs.length > 0 ? logs.reduce((acc, curr) => ({
        energy: acc.energy + curr.energy,
        protein: acc.protein + curr.protein,
        carbs: acc.carbs + curr.carbs,
        fats: acc.fats + curr.fats
    }), { energy: 0, protein: 0, carbs: 0, fats: 0 }) : { energy: 0, protein: 0, carbs: 0, fats: 0 };

    if (logs.length > 0) {
        averages.energy = Math.round(averages.energy / logs.length);
        averages.protein = Math.round(averages.protein / logs.length);
        averages.carbs = Math.round(averages.carbs / logs.length);
        averages.fats = Math.round(averages.fats / logs.length);
    }

    const currentWeight = logs.length > 0 ? logs[logs.length - 1].weight : 0;

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    value={currentWeight || userProfile?.currentWeight || 'N/A'}
                    unit="kg"
                    color="purple"
                    subtext={userProfile?.currentWeight ? `Inicial: ${userProfile.currentWeight}kg` : "Último registro"}
                />
            </div>

            {/* Charts */}
            {logs.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">Consumo de Energia vs. Meta</h3>
                            <div className="relative h-72">
                                <EnergyChart data={logs} target={targets.energy} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">Distribuição Média</h3>
                            <div className="relative h-64 flex justify-center">
                                <DistributionChart averages={averages} />
                            </div>
                            <div className="text-center mt-4 text-sm text-gray-500">
                                Baseado na média de {logs.length} dias.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Evolução Diária de Macronutrientes</h3>
                        <div className="relative h-80">
                            <MacroChart data={logs} />
                        </div>
                    </div>

                    {/* TDEE Adaptativo Card */}
                    <TDEECard 
                        dailyLogs={logs} 
                        targetCalories={targets.energy}
                        patientGoal="loss"
                    />

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-700">Registro Diário Detalhado</h3>
                            <p className="text-sm text-gray-400 mt-1">{logs.length} registros encontrados</p>
                        </div>
                        <DailyLogTable data={logs} targetEnergy={targets.energy} />
                    </div>
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
