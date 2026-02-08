import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, TrendingDown, TrendingUp, Minus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchDailyLogsFromApi, fetchPatientFromApi, checkApiHealth, patientToUserProfile } from '../../services/apiService';
import type { DailyLog, UserProfile } from '../../types';
import CalorieRing from './CalorieRing';
import MacroProgressBars from './MacroProgressBars';
import MealCards from './MealCards';
import StreakCounter from './StreakCounter';
import DailyTip from './DailyTip';
import TDEECardV2 from './TDEECardV2';
import { Card, CardContent } from '../ui/card';

interface TodayViewProps {
  userId?: string;
}

const TodayView: React.FC<TodayViewProps> = ({ userId }) => {
  const { currentUser } = useAuth();
  const targetId = userId || currentUser?.uid;

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [previousWeight, setPreviousWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const normalizeDate = (d: string): string => {
    if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split('-');
      return `${yyyy}-${mm}-${dd}`;
    }
    return d;
  };

  const loadData = async (isRefresh = false) => {
    if (!targetId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const apiAvailable = await checkApiHealth();
      if (!apiAvailable) return;

      const patient = await fetchPatientFromApi(targetId);
      if (patient) setUserProfile(patientToUserProfile(patient));

      const apiLogs = await fetchDailyLogsFromApi(targetId);

      // Fetch weights from Activities
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const actRes = await fetch(`${API_BASE}/api/activities/${encodeURIComponent(targetId)}`);
      if (actRes.ok) {
        const activities: Array<{ type: string; date: string; value: number | null }> = await actRes.json();
        const weights = activities
          .filter(a => a.type === 'peso' && a.value && a.value > 0)
          .sort((a, b) => normalizeDate(a.date).localeCompare(normalizeDate(b.date)));

        if (weights.length >= 1) {
          setLatestWeight(weights[weights.length - 1].value);
          if (weights.length >= 2) {
            setPreviousWeight(weights[weights.length - 2].value);
          }
        }
      }

      setLogs(apiLogs);
    } catch (err) {
      console.error('TodayView: error loading data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetId]);

  // Today's data — fallback to most recent day if no logs today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === todayStr && l.energy > 0);
  const hasLogsToday = todayLogs.length > 0;

  // If no logs today, show the most recent day's data
  const foodLogs = logs.filter(l => l.energy > 0);
  const displayLogs = hasLogsToday ? todayLogs : (() => {
    if (foodLogs.length === 0) return [];
    const sortedByDate = [...foodLogs].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = sortedByDate[0].date;
    return foodLogs.filter(l => l.date === lastDate);
  })();
  const displayDate = displayLogs.length > 0 ? displayLogs[0].date : todayStr;
  const isShowingPastData = !hasLogsToday && displayLogs.length > 0;

  const todayTotals = displayLogs.reduce(
    (acc, l) => ({
      energy: acc.energy + l.energy,
      protein: acc.protein + l.protein,
      carbs: acc.carbs + l.carbs,
      fats: acc.fats + l.fats,
    }),
    { energy: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const targets = userProfile?.targets || { energy: 2000, protein: 150, carbs: 200, fats: 60 };

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const firstName = userProfile?.name?.split(' ')[0] || 'Paciente';

  // Weight trend
  const getWeightTrend = (): 'down' | 'up' | 'stable' => {
    if (!latestWeight || !previousWeight) return 'stable';
    const diff = latestWeight - previousWeight;
    if (diff < -0.2) return 'down';
    if (diff > 0.2) return 'up';
    return 'stable';
  };

  const weightDiff = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  // Parse meal items from display logs (each log may be a meal)
  const mealItems = displayLogs.map((log, i) => ({
    description: `Refeição ${i + 1} — ${Math.round(log.energy)} kcal (P: ${Math.round(log.protein)}g, C: ${Math.round(log.carbs)}g, G: ${Math.round(log.fats)}g)`,
    energy: log.energy,
  }));

  if (loading) {
    return (
      <div className="space-y-4 pb-20 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Greeting Header */}
      <motion.div
        className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{getGreeting()}, {firstName}! 👋</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mt-3">
          <StreakCounter logs={logs} />
        </div>
      </motion.div>

      {/* Past data notice */}
      {isShowingPastData && (
        <motion.div
          className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-amber-500 text-sm">📋</span>
          <p className="text-xs text-amber-700">
            Sem registros hoje — mostrando último dia:{' '}
            <span className="font-semibold">
              {new Date(displayDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            </span>
          </p>
        </motion.div>
      )}

      {/* Calorie Ring + Macros */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 pb-6">
            <CalorieRing
              consumed={Math.round(todayTotals.energy)}
              target={targets.energy}
            />
            <div className="mt-6">
              <MacroProgressBars
                protein={todayTotals.protein}
                carbs={todayTotals.carbs}
                fats={todayTotals.fats}
                targets={{
                  protein: targets.protein,
                  carbs: targets.carbs,
                  fats: targets.fats,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weight Card */}
      {latestWeight && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-50 rounded-xl">
                    <Scale className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Peso Atual</p>
                    <p className="text-xl font-bold text-slate-800 tabular-nums">{latestWeight} kg</p>
                  </div>
                </div>
                {weightDiff !== null && (
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    weightDiff < -0.1 ? 'bg-emerald-50 text-emerald-600' :
                    weightDiff > 0.1 ? 'bg-red-50 text-red-600' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {weightDiff < -0.1 ? <TrendingDown className="w-3 h-3" /> :
                     weightDiff > 0.1 ? <TrendingUp className="w-3 h-3" /> :
                     <Minus className="w-3 h-3" />}
                    <span className="tabular-nums">{weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* TDEE Summary (compact) */}
      {targetId && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TDEECardV2 grupoId={targetId} targetCalories={targets.energy} isAdmin={false} />
        </motion.div>
      )}

      {/* Meals */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-slate-600 mb-2 px-1">
          {isShowingPastData
            ? `Refeições de ${new Date(displayDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
            : 'Refeições de Hoje'}
        </h3>
        <MealCards items={mealItems} />
      </motion.div>

      {/* Daily Tip */}
      <DailyTip
        consumed={todayTotals.energy}
        target={targets.energy}
        protein={todayTotals.protein}
        proteinTarget={targets.protein}
        hasLogsToday={hasLogsToday}
        weightTrend={getWeightTrend()}
      />
    </div>
  );
};

export default TodayView;
