/**
 * GuidedTour — Spotlight overlay tutorial for first visit
 * Shows tooltips highlighting key UI elements in TodayView
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

interface TourStep {
  /** CSS selector or data-tour attribute to highlight */
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="calorie-ring"]',
    title: 'Seu consumo do dia 🔥',
    description: 'Este anel mostra quantas calorias você já consumiu hoje em relação à sua meta.',
    position: 'bottom',
  },
  {
    target: '[data-tour="macros"]',
    title: 'Seus macronutrientes',
    description: 'Proteínas, carboidratos e gorduras — acompanhe o equilíbrio da sua alimentação.',
    position: 'bottom',
  },
  {
    target: '[data-tour="meals"]',
    title: 'Suas refeições 🍽️',
    description: 'Cada refeição registrada no WhatsApp aparece aqui com os detalhes nutricionais.',
    position: 'top',
  },
  {
    target: '[data-tour="streak"]',
    title: 'Sua sequência 🔥',
    description: 'Quantos dias seguidos você registrou. Consistência é o segredo!',
    position: 'top',
  },
  {
    target: '[data-tour="bottom-nav"]',
    title: 'Navegação',
    description: 'Use as abas para ver: Hoje, Evolução (gráficos), Atividades (treinos/peso) e seu Perfil.',
    position: 'top',
  },
];

interface GuidedTourProps {
  onComplete: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;

  const findTarget = useCallback(() => {
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [step.target]);

  useEffect(() => {
    // Small delay to let scroll settle
    const timer = setTimeout(findTarget, 300);
    window.addEventListener('resize', findTarget);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findTarget);
    };
  }, [findTarget]);

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const skip = () => onComplete();

  // Spotlight cutout dimensions
  const padding = 8;
  const radius = 16;
  const spotX = targetRect ? targetRect.left - padding : 0;
  const spotY = targetRect ? targetRect.top - padding : 0;
  const spotW = targetRect ? targetRect.width + padding * 2 : 0;
  const spotH = targetRect ? targetRect.height + padding * 2 : 0;

  // Tooltip position
  const tooltipStyle: React.CSSProperties = {};
  if (targetRect) {
    tooltipStyle.left = Math.max(16, Math.min(window.innerWidth - 320, targetRect.left));
    if (step.position === 'bottom') {
      tooltipStyle.top = targetRect.bottom + padding + 12;
    } else {
      tooltipStyle.bottom = window.innerHeight - targetRect.top + padding + 12;
    }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={spotX} y={spotY}
                width={spotW} height={spotH}
                rx={radius} ry={radius}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={next}
        />
      </svg>

      {/* Spotlight border glow */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute rounded-2xl border-2 border-emerald-400 shadow-lg shadow-emerald-400/30"
          style={{
            left: spotX, top: spotY,
            width: spotW, height: spotH,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: step.position === 'bottom' ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute z-10 w-[calc(100%-32px)] max-w-sm bg-white rounded-2xl shadow-2xl p-5"
          style={{ ...tooltipStyle, pointerEvents: 'auto' }}
        >
          {/* Skip button */}
          <button
            onClick={skip}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-base font-bold text-slate-800 mb-1">{step.title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">{step.description}</p>

          <div className="flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex items-center gap-1 text-sm font-semibold text-white bg-emerald-500 rounded-xl px-4 py-2"
            >
              {isLast ? 'Entendi!' : 'Próximo'}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GuidedTour;
