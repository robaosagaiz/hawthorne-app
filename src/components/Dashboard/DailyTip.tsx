import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface DailyTipProps {
  consumed: number;
  target: number;
  protein: number;
  proteinTarget: number;
  hasLogsToday: boolean;
  weightTrend?: 'down' | 'up' | 'stable';
}

const DailyTip: React.FC<DailyTipProps> = ({
  consumed,
  target,
  protein,
  proteinTarget,
  hasLogsToday,
  weightTrend,
}) => {
  const getTip = (): { text: string; emoji: string } => {
    if (!hasLogsToday) {
      return { text: 'Não esqueça de fotografar suas refeições! Uma foto rápida pelo WhatsApp é suficiente.', emoji: '📸' };
    }
    if (protein < proteinTarget * 0.6) {
      return { text: 'Sua proteína está baixa hoje. Que tal incluir frango, peixe ou ovos na próxima refeição?', emoji: '🥩' };
    }
    if (consumed > target * 1.1) {
      return { text: 'Você passou um pouco da meta hoje. Sem estresse — amanhã é um novo dia!', emoji: '💚' };
    }
    if (consumed > 0 && consumed < target * 0.5) {
      return { text: 'Ainda tem bastante da meta para hoje. Lembre-se: comer pouco demais também atrapalha o progresso.', emoji: '⚡' };
    }
    if (weightTrend === 'down') {
      return { text: 'Seu peso está numa tendência de queda. Continue assim, o progresso está aparecendo!', emoji: '📉' };
    }
    if (protein >= proteinTarget * 0.9 && consumed <= target) {
      return { text: 'Excelente! Proteína em dia e dentro da meta calórica. Dia perfeito! 💪', emoji: '🌟' };
    }
    return { text: 'Manter o registro diário é o passo mais importante. Você está no caminho certo!', emoji: '🎯' };
  };

  const tip = getTip();

  return (
    <motion.div
      className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex-shrink-0 p-2 bg-emerald-100 rounded-xl h-fit">
        <Lightbulb className="w-4 h-4 text-emerald-600" />
      </div>
      <div>
        <p className="text-xs font-semibold text-emerald-700 mb-1">Dica do dia {tip.emoji}</p>
        <p className="text-sm text-emerald-600 leading-relaxed">{tip.text}</p>
      </div>
    </motion.div>
  );
};

export default DailyTip;
