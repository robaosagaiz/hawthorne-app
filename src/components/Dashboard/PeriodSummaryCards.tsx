import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Flame, Target, Scale } from 'lucide-react';
import type { DailyLog } from '../../types';

interface PeriodSummaryCardsProps {
  logs: DailyLog[];
  energyTarget: number;
}

const PeriodSummaryCards: React.FC<PeriodSummaryCardsProps> = ({ logs, energyTarget }) => {
  const foodLogs = logs.filter(l => l.energy > 0);

  // Weight change
  const weightsInPeriod = logs.filter(l => l.weight && l.weight > 0).sort((a, b) => a.date.localeCompare(b.date));
  const firstWeight = weightsInPeriod.length > 0 ? weightsInPeriod[0].weight! : null;
  const lastWeight = weightsInPeriod.length > 0 ? weightsInPeriod[weightsInPeriod.length - 1].weight! : null;
  const weightChange = firstWeight && lastWeight ? lastWeight - firstWeight : null;

  // Avg daily calories
  const avgCalories = foodLogs.length > 0
    ? Math.round(foodLogs.reduce((sum, l) => sum + l.energy, 0) / foodLogs.length)
    : 0;

  // Adherence (% of days within ±15% of target)
  const withinTarget = foodLogs.filter(l => {
    const ratio = l.energy / energyTarget;
    return ratio >= 0.85 && ratio <= 1.15;
  }).length;
  const adherence = foodLogs.length > 0 ? Math.round((withinTarget / foodLogs.length) * 100) : 0;

  // Avg protein
  const avgProtein = foodLogs.length > 0
    ? Math.round(foodLogs.reduce((sum, l) => sum + l.protein, 0) / foodLogs.length)
    : 0;

  const cards = [
    {
      icon: Scale,
      label: 'Peso',
      value: weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '—',
      color: weightChange !== null && weightChange <= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: weightChange !== null && weightChange <= 0 ? 'bg-emerald-50' : 'bg-red-50',
      iconColor: weightChange !== null && weightChange <= 0 ? 'text-emerald-500' : 'text-red-500',
    },
    {
      icon: Flame,
      label: 'Média kcal',
      value: avgCalories > 0 ? avgCalories.toLocaleString('pt-BR') : '—',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      icon: Target,
      label: 'Aderência',
      value: foodLogs.length > 0 ? `${adherence}%` : '—',
      color: adherence >= 70 ? 'text-emerald-600' : 'text-amber-600',
      bg: adherence >= 70 ? 'bg-emerald-50' : 'bg-amber-50',
      iconColor: adherence >= 70 ? 'text-emerald-500' : 'text-amber-500',
    },
    {
      icon: TrendingUp,
      label: 'Proteína/dia',
      value: avgProtein > 0 ? `${avgProtein}g` : '—',
      color: 'text-red-600',
      bg: 'bg-red-50',
      iconColor: 'text-red-500',
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            className={`flex-shrink-0 w-28 rounded-2xl p-3 ${card.bg}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Icon className={`w-4 h-4 ${card.iconColor} mb-2`} />
            <p className={`text-lg font-bold tabular-nums ${card.color}`}>{card.value}</p>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{card.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PeriodSummaryCards;
