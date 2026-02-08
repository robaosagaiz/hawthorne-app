/**
 * GuidedTour — Spotlight overlay tutorial for first visit
 * Shows tooltips highlighting key UI elements in TodayView
 * Robust: skips missing elements, always allows advance/dismiss
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

interface TourStep {
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
    position: 'bottom',
  },
];

interface GuidedTourProps {
  onComplete: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const step = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;

  const findTarget = useCallback(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Wait for scroll to settle
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }, 350);
    } else {
      setTargetRect(null);
    }
  }, [step.target]);

  useEffect(() => {
    const timer = setTimeout(findTarget, 200);
    const handleResize = () => findTarget();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [findTarget]);

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setTargetRect(null);
      setCurrentStep(prev => prev + 1);
    }
  };

  const skip = () => onComplete();

  // Spotlight cutout
  const pad = 10;
  const r = 16;
  const hasTarget = !!targetRect;
  const sx = hasTarget ? targetRect!.left - pad : 0;
  const sy = hasTarget ? targetRect!.top - pad : 0;
  const sw = hasTarget ? targetRect!.width + pad * 2 : 0;
  const sh = hasTarget ? targetRect!.height + pad * 2 : 0;

  // Tooltip position — centered horizontally, above or below target
  const tooltipWidth = Math.min(windowSize.w - 32, 340);
  const tooltipLeft = hasTarget
    ? Math.max(16, Math.min(windowSize.w - tooltipWidth - 16, targetRect!.left + targetRect!.width / 2 - tooltipWidth / 2))
    : 16;

  let tooltipTop: number | undefined;
  let tooltipBottom: number | undefined;

  if (hasTarget) {
    if (step.position === 'bottom') {
      tooltipTop = targetRect!.bottom + pad + 16;
      // If tooltip would go off screen, flip to top
      if (tooltipTop + 160 > windowSize.h) {
        tooltipTop = undefined;
        tooltipBottom = windowSize.h - targetRect!.top + pad + 16;
      }
    } else {
      tooltipBottom = windowSize.h - targetRect!.top + pad + 16;
      // If tooltip would go off screen, flip to bottom
      if (tooltipBottom + 160 > windowSize.h) {
        tooltipBottom = undefined;
        tooltipTop = targetRect!.bottom + pad + 16;
      }
    }
  } else {
    // No target found — show tooltip centered
    tooltipTop = windowSize.h / 2 - 80;
  }

  return (
    <div className="fixed inset-0 z-[60]" style={{ touchAction: 'none' }}>
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" onClick={next}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {hasTarget && (
              <rect x={sx} y={sy} width={sw} height={sh} rx={r} ry={r} fill="black" />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight border */}
      {hasTarget && (
        <motion.div
          key={`border-${currentStep}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute rounded-2xl border-2 border-emerald-400/80 pointer-events-none"
          style={{ left: sx, top: sy, width: sw, height: sh }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: step.position === 'bottom' ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bg-white rounded-2xl shadow-2xl p-5 z-10"
          style={{
            left: tooltipLeft,
            width: tooltipWidth,
            ...(tooltipTop !== undefined ? { top: tooltipTop } : {}),
            ...(tooltipBottom !== undefined ? { bottom: tooltipBottom } : {}),
          }}
        >
          {/* Close */}
          <button onClick={skip} className="absolute top-3 right-3 text-slate-400 active:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-base font-bold text-slate-800 mb-1 pr-6">{step.title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">{step.description}</p>

          <div className="flex items-center justify-between">
            {/* Dots */}
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
              className="flex items-center gap-1 text-sm font-semibold text-white bg-emerald-500 rounded-xl px-4 py-2.5 active:bg-emerald-600 min-h-[44px]"
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
