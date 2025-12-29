import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchDailyLogs, fetchUserProfile } from '../../services/dataService';
import type { DailyLog, UserProfile } from '../../types';
import StatCard from '../ui/StatCard';
import EnergyChart from './EnergyChart';
import MacroChart from './MacroChart';
import DistributionChart from './DistributionChart';
import DailyLogTable from './DailyLogTable';
import '../../utils/chartSetup';

interface DashboardProps {
    userId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Priority: Prop userId -> Profile UID (which might be linked) -> Current Auth UID
    // Actually, we must fetch profile FIRST to know if there is a link.
    const initialTargetUid = userId || currentUser?.uid;

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

    // 1. Fetch Profile First
    useEffect(() => {
        const loadProfile = async () => {
            if (!initialTargetUid) return;
            const profile = await fetchUserProfile(initialTargetUid);
            setUserProfile(profile);
        };
        loadProfile();
    }, [initialTargetUid]);

    // 2. Fetch Logs based on Profile UID (which handles the link)
    useEffect(() => {
        const loadLogs = async () => {
            // If we have a profile, use its UID (which might be the linked one).
            // If not (yet), fall back to initialTarget.
            // But wait, if profile is null, maybe we shouldn't fetch logs yet or we fetch empty?

            const effectiveUid = userProfile?.uid || initialTargetUid;

            if (!effectiveUid) return;

            setLoading(true);
            const logsData = await fetchDailyLogs(effectiveUid);
            setLogs(logsData);
            setLoading(false);
        };

        if (initialTargetUid) {
            loadLogs();
        }
    }, [userProfile, initialTargetUid]);

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
        return <div className="flex h-full items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
    }

    return (
        <div className="space-y-6">
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
                    subtext="Último registro"
                />
            </div>

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
                        Baseado na média do período.
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Evolução Diária de Macronutrientes</h3>
                <div className="relative h-80">
                    <MacroChart data={logs} />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-700">Registro Diário Detalhado</h3>
                </div>
                <DailyLogTable data={logs} targetEnergy={targets.energy} />
            </div>
        </div>
    );
};

export default Dashboard;
