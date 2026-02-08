import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
}

const CalorieRing: React.FC<CalorieRingProps> = ({ consumed, target, size = 200 }) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const percent = target > 0 ? Math.min((consumed / target) * 100, 150) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(animatedPercent, 100) / 100) * circumference;

  // Color based on percentage
  const getColor = () => {
    if (percent <= 80) return { stroke: '#10B981', bg: 'text-emerald-500', label: 'text-emerald-600' }; // green
    if (percent <= 100) return { stroke: '#F59E0B', bg: 'text-amber-500', label: 'text-amber-600' }; // yellow
    return { stroke: '#EF4444', bg: 'text-red-500', label: 'text-red-600' }; // red
  };

  const color = getColor();
  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="flex flex-col items-center" data-tour="calorie-ring">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Flame className={`w-5 h-5 ${color.bg} mb-1`} />
          <motion.span
            className="text-3xl font-bold text-slate-800 tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {consumed.toLocaleString('pt-BR')}
          </motion.span>
          <span className="text-xs text-slate-500 mt-0.5">
            de {target.toLocaleString('pt-BR')} kcal
          </span>
        </div>
      </div>
      {/* Remaining label */}
      <motion.p
        className={`text-sm font-medium mt-3 ${color.label}`}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {consumed >= target
          ? `${(consumed - target).toLocaleString('pt-BR')} kcal acima da meta`
          : `${remaining.toLocaleString('pt-BR')} kcal restantes`}
      </motion.p>
    </div>
  );
};

export default CalorieRing;
