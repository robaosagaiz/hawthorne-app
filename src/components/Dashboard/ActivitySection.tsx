/**
 * ActivitySection v2.0 — Redesigned activity tracking
 * Hero classification card + weight sparkline + exercise feed + steps chart
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Dumbbell, Footprints, TrendingDown, TrendingUp,
  Minus, Activity, Trophy, AlertTriangle, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface ActivityRecord {
  grupo: string;
  date: string;
  type: string;
  durationMin: number | null;
  value: number | null;
  notes: string;
  source: string;
  dateTime: string;
}

interface ActivitySectionProps {
  grupoId: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const normalizeDate = (d: string): string => {
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  return d;
};

const formatDateShort = (d: string): string => {
  const norm = normalizeDate(d);
  try {
    const date = new Date(norm + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  } catch {
    return d;
  }
};

const ActivitySection: React.FC<ActivitySectionProps> = ({ grupoId }) => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllExercises, setShowAllExercises] = useState(false);

  useEffect(() => {
    if (!grupoId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/activities/${encodeURIComponent(grupoId)}`)
      .then(res => res.json())
      .then(data => { setActivities(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [grupoId]);

  if (loading) {
    return (
      <div className="space-y-4 pb-20 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  // Separate by type
  const weightRecords = activities.filter(a => a.type === 'peso' && a.value && a.value > 0);
  const exerciseRecords = activities.filter(a => a.type === 'forca' || a.type === 'cardio');
  const stepsRecords = activities.filter(a => a.type === 'passos' && a.value && a.value > 0);

  // Weight stats
  const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null;
  const firstWeight = weightRecords.length > 0 ? weightRecords[0] : null;
  const weightDiff = latestWeight?.value && firstWeight?.value ? latestWeight.value - firstWeight.value : null;

  // This week exercises
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const parseDate = (d: string) => {
    const n = normalizeDate(d);
    return new Date(n + 'T12:00:00');
  };
  const weekExercises = exerciseRecords.filter(e => parseDate(e.date) >= weekAgo);
  const weekForca = weekExercises.filter(e => e.type === 'forca').length;
  const weekCardio = weekExercises.filter(e => e.type === 'cardio').length;
  const isActive = weekExercises.length >= 3;

  // Steps — last 7 days
  const last7Steps = stepsRecords
    .filter(s => parseDate(s.date) >= weekAgo)
    .sort((a, b) => normalizeDate(a.date).localeCompare(normalizeDate(b.date)));
  const avgSteps = last7Steps.length > 0
    ? Math.round(last7Steps.reduce((sum, s) => sum + (s.value || 0), 0) / last7Steps.length)
    : null;
  const latestSteps = stepsRecords.length > 0 ? stepsRecords[stepsRecords.length - 1] : null;
  // Use average steps (7 days) for classification; fallback to latest single record
  const isSedentary = avgSteps !== null ? avgSteps < 5000 : (latestSteps?.value ? latestSteps.value < 5000 : null);

  // Classification
  const getClassification = () => {
    if (isActive && isSedentary === false) return {
      label: 'Ativo & Não-Sedentário', emoji: '🏆',
      color: 'from-emerald-500 to-teal-500', textColor: 'text-white',
      desc: 'Excelente! Você treina regularmente e se movimenta bem no dia a dia.',
      icon: Trophy,
    };
    if (isActive && isSedentary === true) return {
      label: 'Ativo & Sedentário', emoji: '⚡',
      color: 'from-amber-400 to-orange-400', textColor: 'text-white',
      desc: 'Treinos em dia, mas tente caminhar mais durante o dia (meta: 5.000+ passos).',
      icon: Zap,
    };
    if (!isActive && isSedentary === false) return {
      label: 'Inativo & Não-Sedentário', emoji: '🚶',
      color: 'from-sky-400 to-blue-400', textColor: 'text-white',
      desc: 'Boa movimentação diária! Adicione treinos regulares (3x/semana) para potencializar.',
      icon: Footprints,
    };
    if (!isActive && isSedentary === true) return {
      label: 'Inativo & Sedentário', emoji: '⚠️',
      color: 'from-red-400 to-rose-400', textColor: 'text-white',
      desc: 'Comece aos poucos: caminhadas curtas e pelo menos 2 treinos na semana.',
      icon: AlertTriangle,
    };
    return {
      label: 'Sem dados suficientes', emoji: '📊',
      color: 'from-slate-400 to-slate-500', textColor: 'text-white',
      desc: 'Registre seus treinos e passos pelo WhatsApp para ver sua classificação.',
      icon: Activity,
    };
  };

  const classification = getClassification();
  const ClassIcon = classification.icon;
  const hasAnyData = activities.length > 0;

  // Weight sparkline (last 8 records)
  const sparkWeights = weightRecords.slice(-8);
  const sparkMin = sparkWeights.length > 0 ? Math.min(...sparkWeights.map(w => w.value!)) - 0.5 : 0;
  const sparkMax = sparkWeights.length > 0 ? Math.max(...sparkWeights.map(w => w.value!)) + 0.5 : 1;
  const sparkRange = sparkMax - sparkMin || 1;

  // Steps bar chart data (last 7 days)
  const stepsMax = last7Steps.length > 0 ? Math.max(...last7Steps.map(s => s.value || 0), 10000) : 10000;

  if (!hasAnyData) {
    return (
      <div className="space-y-4 pb-20">
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">Nenhuma atividade registrada</h3>
            <p className="text-sm text-slate-400">
              Envie pelo WhatsApp seus treinos, peso e passos diários
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Hero Classification Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-2xl p-5 shadow-lg bg-gradient-to-r', classification.color)}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 backdrop-blur rounded-2xl">
            <ClassIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{classification.label}</h2>
              <span className="text-xl">{classification.emoji}</span>
            </div>
            <p className="text-sm text-white/80 mt-1 leading-relaxed">{classification.desc}</p>
            <div className="flex gap-3 mt-3">
              <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-1.5">
                <span className="text-xs text-white/90 font-medium">
                  🏋️ {weekExercises.length} treinos/sem
                </span>
                <span className="text-[10px] text-white/60 block">meta: 3+</span>
              </div>
              {avgSteps !== null ? (
                <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-1.5">
                  <span className="text-xs text-white/90 font-medium">
                    👟 {avgSteps.toLocaleString('pt-BR')} passos/dia
                  </span>
                  <span className="text-[10px] text-white/60 block">média 7 dias • meta: 5.000+</span>
                </div>
              ) : latestSteps?.value ? (
                <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-1.5">
                  <span className="text-xs text-white/90 font-medium">
                    👟 {latestSteps.value.toLocaleString('pt-BR')} passos
                  </span>
                  <span className="text-[10px] text-white/60 block">último registro • meta: 5.000+</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weight Section with Sparkline */}
      {weightRecords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 rounded-lg">
                    <Scale className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Peso</span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800 tabular-nums">
                    {latestWeight!.value!.toFixed(1)} kg
                  </p>
                  {weightDiff !== null && (
                    <div className={cn(
                      'flex items-center gap-1 justify-end text-xs font-semibold',
                      weightDiff < -0.1 ? 'text-emerald-600' : weightDiff > 0.1 ? 'text-red-500' : 'text-slate-400'
                    )}>
                      {weightDiff < -0.1 ? <TrendingDown className="w-3 h-3" /> :
                       weightDiff > 0.1 ? <TrendingUp className="w-3 h-3" /> :
                       <Minus className="w-3 h-3" />}
                      <span className="tabular-nums">{weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg no protocolo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sparkline */}
              {sparkWeights.length >= 2 && (
                <div className="mt-2">
                  <svg viewBox={`0 0 ${sparkWeights.length * 40} 50`} className="w-full h-12" preserveAspectRatio="none">
                    {/* Line */}
                    <polyline
                      fill="none"
                      stroke="#A78BFA"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sparkWeights.map((w, i) => 
                        `${i * 40 + 20},${50 - ((w.value! - sparkMin) / sparkRange) * 44 - 3}`
                      ).join(' ')}
                    />
                    {/* Dots */}
                    {sparkWeights.map((w, i) => (
                      <circle
                        key={i}
                        cx={i * 40 + 20}
                        cy={50 - ((w.value! - sparkMin) / sparkRange) * 44 - 3}
                        r={i === sparkWeights.length - 1 ? 4 : 2.5}
                        fill={i === sparkWeights.length - 1 ? '#7C3AED' : '#C4B5FD'}
                      />
                    ))}
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-2">
                    <span>{formatDateShort(sparkWeights[0].date)}</span>
                    <span>{formatDateShort(sparkWeights[sparkWeights.length - 1].date)}</span>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 mt-2">{weightRecords.length} pesagens registradas</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Exercise Section — Timeline Feed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-50 rounded-lg">
                  <Dumbbell className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Treinos</span>
              </div>
              <div className="flex items-center gap-2">
                {weekForca > 0 && (
                  <span className="text-[10px] bg-orange-50 text-orange-600 font-medium px-2 py-0.5 rounded-full">
                    💪 {weekForca}x força
                  </span>
                )}
                {weekCardio > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                    🏃 {weekCardio}x cardio
                  </span>
                )}
              </div>
            </div>

            {/* Weekly progress bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-500">Meta semanal: 3 treinos</span>
                <span className={cn(
                  'text-[10px] font-semibold',
                  isActive ? 'text-emerald-600' : 'text-amber-600'
                )}>
                  {weekExercises.length}/3 {isActive ? '✅' : ''}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', isActive ? 'bg-emerald-500' : 'bg-amber-400')}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((weekExercises.length / 3) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Exercise timeline */}
            {exerciseRecords.length > 0 ? (
              <div className="space-y-2">
                {(showAllExercises ? exerciseRecords : exerciseRecords.slice(-4)).reverse().map((ex, i) => (
                  <motion.div
                    key={`${ex.date}-${ex.type}-${i}`}
                    className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={cn(
                      'p-2 rounded-xl flex-shrink-0',
                      ex.type === 'forca' ? 'bg-orange-50' : 'bg-blue-50'
                    )}>
                      {ex.type === 'forca'
                        ? <Dumbbell className="w-4 h-4 text-orange-500" />
                        : <Activity className="w-4 h-4 text-blue-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 capitalize">
                        {ex.type === 'forca' ? 'Musculação' : 'Cardio'}
                        {ex.durationMin ? ` — ${ex.durationMin} min` : ''}
                      </p>
                      {ex.notes && (
                        <p className="text-xs text-slate-400 truncate">{ex.notes}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{formatDateShort(ex.date)}</span>
                  </motion.div>
                ))}
                {exerciseRecords.length > 4 && (
                  <button
                    onClick={() => setShowAllExercises(!showAllExercises)}
                    className="w-full text-xs text-emerald-600 font-medium py-2 hover:text-emerald-700 flex items-center justify-center gap-1"
                  >
                    {showAllExercises ? (
                      <>Ver menos <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Ver todos ({exerciseRecords.length}) <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">Nenhum treino registrado</p>
                <p className="text-xs text-slate-300 mt-1">Envie pelo WhatsApp: "fiz musculação 45min"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Steps Section — Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 rounded-lg">
                  <Footprints className="w-4 h-4 text-teal-500" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Passos</span>
              </div>
              {avgSteps !== null && (
                <span className="text-xs text-slate-500">
                  Média: <span className="font-semibold text-slate-700 tabular-nums">{avgSteps.toLocaleString('pt-BR')}</span>/dia
                </span>
              )}
            </div>

            {last7Steps.length > 0 ? (
              <>
                {/* Bar chart */}
                <div className="flex items-end gap-1.5 mb-2" style={{ height: 120 }}>
                  {last7Steps.map((step, i) => {
                    const val = step.value || 0;
                    const barHeight = Math.max((val / stepsMax) * 100, 4);
                    const isAboveGoal = val >= 5000;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[9px] text-slate-400 tabular-nums mb-1">
                          {(val / 1000).toFixed(1)}k
                        </span>
                        <motion.div
                          className={cn(
                            'w-full rounded-t-lg',
                            isAboveGoal ? 'bg-teal-400' : 'bg-slate-200'
                          )}
                          style={{ minHeight: 4 }}
                          initial={{ height: 0 }}
                          animate={{ height: barHeight }}
                          transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                        />
                        <span className="text-[9px] text-slate-400 mt-1">{formatDateShort(step.date)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Goal line label */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-px flex-1 bg-teal-200 border-dashed border-t border-teal-300" />
                  <span className="text-[10px] text-teal-500 font-medium">Meta: 5.000</span>
                  <div className="h-px flex-1 bg-teal-200 border-dashed border-t border-teal-300" />
                </div>
              </>
            ) : stepsRecords.length > 0 ? (
              <div className="text-center py-2">
                <p className="text-2xl font-bold text-teal-600 tabular-nums">
                  {latestSteps!.value!.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Último registro: {formatDateShort(latestSteps!.date)}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">Nenhum passo registrado</p>
                <p className="text-xs text-slate-300 mt-1">Envie pelo WhatsApp: "hoje fiz 8000 passos"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ActivitySection;
