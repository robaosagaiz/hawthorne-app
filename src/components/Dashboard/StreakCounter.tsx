import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { DailyLog } from '../../types';

interface StreakCounterProps {
  logs: DailyLog[];
}

const StreakCounter: React.FC<StreakCounterProps> = ({ logs }) => {
  // Calculate consecutive days with food logs (energy > 0)
  const calculateStreak = (): number => {
    if (!logs || logs.length === 0) return 0;

    const foodLogs = logs.filter(l => l.energy > 0);
    if (foodLogs.length === 0) return 0;

    // Sort by date descending
    const sorted = [...foodLogs].sort((a, b) => b.date.localeCompare(a.date));

    // Check if today or yesterday has a log
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const latestDate = sorted[0].date;
    if (latestDate !== todayStr && latestDate !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const curr = new Date(sorted[i - 1].date);
      const prev = new Date(sorted[i].date);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  const getMessage = () => {
    if (streak === 0) return 'Registre sua primeira refeição! 📸';
    if (streak < 3) return 'Bom começo!';
    if (streak < 7) return 'Mandando bem! 💪';
    if (streak < 14) return 'Impressionante!';
    if (streak < 30) return 'Você é incrível! 🌟';
    return 'Lenda! 🏆';
  };

  if (streak === 0) {
    return (
      <div className="flex items-center gap-2 text-white/90">
        <Flame className="w-4 h-4" />
        <span className="text-xs font-medium">{getMessage()}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur text-white px-3 py-1.5 rounded-full">
        <Flame className="w-4 h-4 text-yellow-300" />
        <span className="text-sm font-bold tabular-nums">{streak}</span>
        <span className="text-xs font-medium">
          {streak === 1 ? 'dia' : 'dias'}
        </span>
      </div>
      <span className="text-xs text-white/80 font-medium">{getMessage()}</span>
    </motion.div>
  );
};

export default StreakCounter;
