import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fetchDailyLogsFromApi, fetchPatientFromApi, checkApiHealth, patientToUserProfile } from '../../services/apiService';
import type { DailyLog, UserProfile } from '../../types';
import { getDaysAgoStr } from '../../utils/dateUtils';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import PeriodSummaryCards from './PeriodSummaryCards';
import WeightChart from './WeightChart';
import EnergyChart from './EnergyChart';
import DailyLogTable from './DailyLogTable';
import TDEECardV2 from './TDEECardV2';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Period = '7d' | '30d' | 'all';

interface ProgressViewProps {
  userId?: string;
}

const ProgressView: React.FC<ProgressViewProps> = ({ userId }) => {
  const { currentUser } = useAuth();
  const targetId = userId || currentUser?.uid;

  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [showDetailedLog, setShowDetailedLog] = useState(false);

  const normalizeDate = (d: string): string => {
    if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split('-');
      return `${yyyy}-${mm}-${dd}`;
    }
    return d;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!targetId) return;
      setLoading(true);
      try {
        const apiAvailable = await checkApiHealth();
        if (!apiAvailable) return;

        const patient = await fetchPatientFromApi(targetId);
        if (patient) setUserProfile(patientToUserProfile(patient));

        const apiLogs = await fetchDailyLogsFromApi(targetId, patient?.startDate);

        // Merge weights from Activities
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const sinceParam = patient?.startDate ? `?since=${encodeURIComponent(patient.startDate)}` : '';
        const actRes = await fetch(`${API_BASE}/api/activities/${encodeURIComponent(targetId)}${sinceParam}`);
        let mergedLogs = apiLogs;
        if (actRes.ok) {
          const activities: Array<{ type: string; date: string; value: number | null }> = await actRes.json();
          const weightByDate = new Map<string, number>();
          for (const a of activities) {
            if (a.type === 'peso' && a.value && a.value > 0) {
              weightByDate.set(normalizeDate(a.date), a.value);
            }
          }
          mergedLogs = apiLogs.map(log => {
            const w = weightByDate.get(normalizeDate(log.date));
            return w ? { ...log, weight: w } : log;
          });
          // Add weight-only entries
          const existingDates = new Set(apiLogs.map(l => normalizeDate(l.date)));
          for (const [date, weight] of weightByDate.entries()) {
            if (!existingDates.has(date)) {
              mergedLogs.push({
                id: `act-${date}`, date, energy: 0, protein: 0, carbs: 0, fats: 0, weight
              });
            }
          }
          mergedLogs.sort((a, b) => a.date.localeCompare(b.date));
        }

        setAllLogs(mergedLogs);
      } catch (err) {
        console.error('ProgressView: error loading data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [targetId]);

  // Filter by period
  const filterByPeriod = (logs: DailyLog[]): DailyLog[] => {
    if (period === 'all') return logs;
    const days = period === '7d' ? 7 : 30;
    const cutoff = getDaysAgoStr(days);
    return logs.filter(l => l.date >= cutoff);
  };

  const filteredLogs = filterByPeriod(allLogs);
  const foodLogs = filteredLogs.filter(l => l.energy > 0);
  const targets = userProfile?.targets || { energy: 2000, protein: 150, carbs: 200, fats: 60 };

  if (loading) {
    return (
      <div className="space-y-4 pb-20 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl w-48" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header + Period Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Sua Evolução</h2>
        <div className="flex bg-slate-100 rounded-xl p-1">
          {(['7d', '30d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                period === p
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <PeriodSummaryCards logs={filteredLogs} energyTarget={targets.energy} />

      {/* Weight Chart */}
      {filteredLogs.some(l => l.weight && l.weight > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">⚖️ Evolução do Peso</CardTitle>
            </CardHeader>
            <CardContent>
              <WeightChart data={filteredLogs.filter(l => l.weight && l.weight > 0)} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Energy Chart */}
      {foodLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">🔥 Energia Diária</CardTitle>
            </CardHeader>
            <CardContent>
              <EnergyChart data={foodLogs} target={targets.energy} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* TDEE Card */}
      {targetId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TDEECardV2 grupoId={targetId} targetCalories={targets.energy} isAdmin={false} />
        </motion.div>
      )}

      {/* Daily Log Table (expandable) */}
      {foodLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <button
              onClick={() => setShowDetailedLog(!showDetailedLog)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-700">📋 Registro Detalhado</span>
              {showDetailedLog
                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                : <ChevronDown className="w-4 h-4 text-slate-400" />
              }
            </button>
            {showDetailedLog && (
              <CardContent className="pt-0">
                <DailyLogTable data={foodLogs} targetEnergy={targets.energy} />
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}

      {/* Empty state */}
      {foodLogs.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 text-sm">Nenhum registro no período selecionado</p>
            <p className="text-slate-400 text-xs mt-1">Envie fotos das refeições pelo WhatsApp para começar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressView;
