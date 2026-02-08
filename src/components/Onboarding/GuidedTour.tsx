/**
 * GuidedTour — Spotlight overlay tutorial for first visit
 * Robust: recalculates position after scroll, skips missing elements, always dismissable
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
}

const allSteps: TourStep[] = [
  {
    target: '[data-tour="calorie-ring"]',
    title: 'Seu consumo do dia 🔥',
    description: 'Este anel mostra quantas calorias você já consumiu hoje em relação à sua meta diária.',
  },
  {
    target: '[data-tour="macros"]',
    title: 'Seus macronutrientes',
    description: 'Proteínas, carboidratos e gorduras — acompanhe o equilíbrio da sua alimentação.',
  },
  {
    target: '[data-tour="meals"]',
    title: 'Suas refeições 🍽️',
    description: 'Cada refeição que você registra no WhatsApp aparece aqui, com os detalhes nutricionais.',
  },
  {
    target: '[data-tour="streak"]',
    title: 'Sua sequência 🔥',
    description: 'Quantos dias seguidos você registrou. Consistência é o segredo!',
  },
];

interface GuidedTourProps {
  onComplete: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  // Filter steps to only those whose target element exists in the DOM
  const [availableSteps, setAvailableSteps] = useState<TourStep[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // On mount, determine which steps have valid targets
  useEffect(() => {
    const valid = allSteps.filter(s => document.querySelector(s.target) !== null);
    setAvailableSteps(valid.length > 0 ? valid : []);
    if (valid.length === 0) {
      // No valid targets — skip tour entirely
      onComplete();
    }
  }, [onComplete]);

  const step = availableSteps[currentIdx];
  const isLast = currentIdx === availableSteps.length - 1;

  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // getBoundingClientRect is relative to viewport — that's what we need for fixed overlay
    setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, [step]);

  // Scroll target into view, then measure
  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Measure after scroll settles
    const t1 = setTimeout(measureTarget, 400);
    const t2 = setTimeout(measureTarget, 800); // re-measure for slow scrolls
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step, measureTarget]);

  // Re-measure on scroll/resize
  useEffect(() => {
    const handler = () => requestAnimationFrame(measureTarget);
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [measureTarget]);

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setRect(null);
      setCurrentIdx(prev => prev + 1);
    }
  };

  if (!step || availableSteps.length === 0) return null;

  const pad = 12;
  const hasRect = !!rect;
  const sx = hasRect ? rect!.x - pad : 0;
  const sy = hasRect ? rect!.y - pad : 0;
  const sw = hasRect ? rect!.w + pad * 2 : 0;
  const sh = hasRect ? rect!.h + pad * 2 : 0;

  // Tooltip: try below target, flip above if no room
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tw = Math.min(vw - 32, 340);
  const tooltipLeft = hasRect
    ? Math.max(16, Math.min(vw - tw - 16, rect!.x + rect!.w / 2 - tw / 2))
    : 16;

  const spaceBelow = hasRect ? vh - (rect!.y + rect!.h + pad) : vh / 2;
  const spaceAbove = hasRect ? rect!.y - pad : vh / 2;
  const tooltipAbove = spaceBelow < 200 && spaceAbove > spaceBelow;

  const tooltipStyle: React.CSSProperties = {
    left: tooltipLeft,
    width: tw,
    position: 'fixed',
  };

  if (hasRect) {
    if (tooltipAbove) {
      tooltipStyle.bottom = vh - sy + 8;
    } else {
      tooltipStyle.top = sy + sh + 8;
    }
  } else {
    tooltipStyle.top = vh / 2 - 60;
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[60]" style={{ touchAction: 'none' }}>
      {/* Overlay with cutout */}
      <svg className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} onClick={next}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {hasRect && (
              <rect x={sx} y={sy} width={sw} height={sh} rx={14} ry={14} fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" />
      </svg>

      {/* Glow border around target */}
      {hasRect && (
        <motion.div
          key={`glow-${currentIdx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="fixed rounded-2xl border-2 border-emerald-400/70 pointer-events-none"
          style={{ left: sx, top: sy, width: sw, height: sh, zIndex: 1 }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl p-5"
          style={{ ...tooltipStyle, zIndex: 2 }}
        >
          <button
            onClick={onComplete}
            className="absolute top-3 right-3 text-slate-400 active:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-base font-bold text-slate-800 mb-1 pr-6">{step.title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">{step.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {availableSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIdx ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-200'
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
