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

  interface FoodLogEntry {
    id: string;
    date: string;
    time: string | null;
    food: string | null;
    overview: string | null;
    energy: number;
    protein: number;
    carbs: number;
    fats: number;
    picture: string | null;
    fromImage: boolean;
  }

  const [foodLogEntries, setFoodLogEntries] = useState<FoodLogEntry[]>([]);

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

      // Fetch granular food logs
      const API_BASE = import.meta.env.VITE_API_URL || '';
      try {
        const flRes = await fetch(`${API_BASE}/api/food-logs/${encodeURIComponent(targetId)}`);
        if (flRes.ok) {
          const entries: FoodLogEntry[] = await flRes.json();
          setFoodLogEntries(entries);
        }
      } catch (e) {
        console.error('Error fetching food logs:', e);
      }

      // Fetch weights from Activities
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

  // Today's data — show only today, no fallback to past days
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === todayStr && l.energy > 0);
  const todayFoodLogDirect = foodLogEntries.filter(e => e.date === todayStr);
  const hasLogsToday = todayLogs.length > 0 || todayFoodLogDirect.length > 0;

  // Only show today's data — no fallback
  const displayDate = todayStr;

  // Prefer granular food log totals (more accurate, real-time)
  const displayFoodEntries = todayFoodLogDirect;
  const todayTotals = displayFoodEntries.length > 0
    ? displayFoodEntries.reduce(
        (acc, e) => ({
          energy: Math.round(acc.energy + e.energy),
          protein: Math.round(acc.protein + e.protein),
          carbs: Math.round(acc.carbs + e.carbs),
          fats: Math.round(acc.fats + e.fats),
        }),
        { energy: 0, protein: 0, carbs: 0, fats: 0 }
      )
    : todayLogs.reduce(
        (acc, l) => ({
          energy: Math.round(acc.energy + l.energy),
          protein: Math.round(acc.protein + l.protein),
          carbs: Math.round(acc.carbs + l.carbs),
          fats: Math.round(acc.fats + l.fats),
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

  // Use granular food log entries for meal cards when available
  const todayFoodEntries = foodLogEntries.filter(e => e.date === displayDate);
  const mealItems = todayFoodEntries.length > 0
    ? todayFoodEntries.map(e => ({
        time: e.time || undefined,
        description: e.food || e.overview || 'Refeição registrada',
        energy: Math.round(e.energy),
      }))
    : todayLogs.map((log, i) => ({
        description: `Refeição ${i + 1} — ${Math.round(log.energy)} kcal (P: ${Math.round(log.protein)}g, C: ${Math.round(log.carbs)}g, G: ${Math.round(log.fats)}g)`,
        energy: Math.round(log.energy),
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

      {/* No logs today — encouragement */}
      {!hasLogsToday && !loading && (
        <motion.div
          className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm font-medium text-emerald-700 mb-1">
            📝 Ainda não há registros hoje
          </p>
          <p className="text-xs text-emerald-600">
            Envie sua primeira refeição no grupo do WhatsApp para começar o acompanhamento de hoje!
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
          Refeições de Hoje
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
