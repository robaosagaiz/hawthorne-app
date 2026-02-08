import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Coffee, Sun, Sunset, Moon, UtensilsCrossed } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MealItem {
  time?: string;
  description: string;
  energy?: number;
}

interface MealCardsProps {
  items: MealItem[];
}

const periodConfig = [
  { key: 'morning', label: 'Café da Manhã', icon: Coffee, hours: [5, 10], color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'lunch', label: 'Almoço', icon: Sun, hours: [10, 14], color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'afternoon', label: 'Lanche', icon: Sunset, hours: [14, 18], color: 'text-teal-500', bg: 'bg-teal-50' },
  { key: 'dinner', label: 'Jantar', icon: Moon, hours: [18, 24], color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const classifyMeal = (item: MealItem, index: number, total: number): string => {
  // First: try to classify by food name keywords
  const desc = (item.description || '').toLowerCase();
  if (/café da manhã|café manhã|desjejum|breakfast/.test(desc)) return 'morning';
  if (/almoço|almoco|lunch/.test(desc)) return 'lunch';
  if (/lanche|café da tarde|snack/.test(desc)) return 'afternoon';
  if (/jantar|janta|dinner|ceia/.test(desc)) return 'dinner';

  // Second: try by time
  if (item.time) {
    const hour = parseInt(item.time.split(':')[0], 10);
    if (!isNaN(hour)) {
      for (const p of periodConfig) {
        if (hour >= p.hours[0] && hour < p.hours[1]) return p.key;
      }
    }
  }
  // Fallback: distribute evenly across periods based on index
  const periodIndex = Math.min(Math.floor((index / Math.max(total, 1)) * 4), 3);
  return periodConfig[periodIndex].key;
};

const MealCards: React.FC<MealCardsProps> = ({ items }) => {
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
        <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Nenhuma refeição registrada hoje</p>
        <p className="text-xs text-slate-400 mt-1">Envie uma foto pelo WhatsApp! 📸</p>
      </div>
    );
  }

  // Group meals by period
  const grouped: Record<string, MealItem[]> = {};
  items.forEach((item, i) => {
    const period = classifyMeal(item, i, items.length);
    if (!grouped[period]) grouped[period] = [];
    grouped[period].push(item);
  });

  return (
    <div className="space-y-2">
      {periodConfig.map((period) => {
        const meals = grouped[period.key];
        if (!meals || meals.length === 0) return null;
        const Icon = period.icon;
        const isExpanded = expandedPeriod === period.key;
        const totalEnergy = meals.reduce((sum, m) => sum + (m.energy || 0), 0);

        return (
          <motion.div
            key={period.key}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => setExpandedPeriod(isExpanded ? null : period.key)}
              className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
            >
              <div className={cn('p-2 rounded-xl', period.bg)}>
                <Icon className={cn('w-4 h-4', period.color)} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-700">{period.label}</p>
                <p className="text-xs text-slate-400">{meals.length} {meals.length === 1 ? 'item' : 'itens'}</p>
              </div>
              {totalEnergy > 0 && (
                <span className="text-sm font-semibold text-slate-600 tabular-nums">
                  {Math.round(totalEnergy)} kcal
                </span>
              )}
              <ChevronDown className={cn(
                'w-4 h-4 text-slate-400 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {meals.map((meal, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {meal.description}
                        </p>
                        {meal.energy && meal.energy > 0 && (
                          <p className="text-xs text-slate-400 mt-1">
                            ~{Math.round(meal.energy)} kcal
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MealCards;
