import React from 'react';
import { motion } from 'framer-motion';
import { Beef, Wheat, Droplets } from 'lucide-react';

interface MacroProgressBarsProps {
  protein: number;
  carbs: number;
  fats: number;
  targets: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

const macros = [
  { key: 'protein' as const, label: 'Proteína', icon: Beef, color: 'bg-red-500', bgColor: 'bg-red-100', textColor: 'text-red-600' },
  { key: 'carbs' as const, label: 'Carboidratos', icon: Wheat, color: 'bg-amber-500', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
  { key: 'fats' as const, label: 'Gorduras', icon: Droplets, color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
];

const MacroProgressBars: React.FC<MacroProgressBarsProps> = ({ protein, carbs, fats, targets }) => {
  const values = { protein, carbs, fats };

  return (
    <div className="space-y-3">
      {macros.map((macro, i) => {
        const value = values[macro.key];
        const target = targets[macro.key];
        const percent = target > 0 ? Math.min((value / target) * 100, 100) : 0;
        const Icon = macro.icon;

        return (
          <motion.div
            key={macro.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={`p-1.5 rounded-lg ${macro.bgColor}`}>
              <Icon className={`w-4 h-4 ${macro.textColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-slate-600">{macro.label}</span>
                <span className={`text-xs font-semibold tabular-nums ${macro.textColor}`}>
                  {Math.round(value)}g / {target}g
                </span>
              </div>
              <div className={`h-2 rounded-full ${macro.bgColor} overflow-hidden`}>
                <motion.div
                  className={`h-full rounded-full ${macro.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MacroProgressBars;
