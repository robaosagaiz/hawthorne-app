/**
 * OnboardingScreen — Full-screen swipeable welcome slides
 * Shown on first login. Explains the app, WhatsApp rules, and how to register food/activities.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import {
  Utensils, Activity, MessageCircle, ChevronRight,
  ChevronLeft, Sparkles, Target, Camera, AtSign, TrendingUp
} from 'lucide-react';

interface OnboardingSlide {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  bgGradient: string;
  iconBg: string;
}

interface OnboardingScreenProps {
  patientName?: string;
  onComplete: () => void;
}

const slides: OnboardingSlide[] = [
  {
    title: 'Bem-vindo ao Hawthorne! 🎉',
    subtitle: 'Seu acompanhamento nutricional inteligente',
    icon: <Sparkles className="w-12 h-12 text-emerald-600" />,
    bgGradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100',
    content: (
      <div className="space-y-4 text-center">
        <p className="text-slate-600 text-lg leading-relaxed">
          Aqui você acompanha <strong>tudo</strong> sobre seu protocolo nutricional: calorias, macros, treinos, peso e muito mais.
        </p>
        <p className="text-slate-500">
          Vamos te mostrar como funciona em poucos passos!
        </p>
      </div>
    ),
  },
  {
    title: 'Registre suas refeições',
    subtitle: 'Direto pelo WhatsApp — sem complicação',
    icon: <Utensils className="w-12 h-12 text-orange-600" />,
    bgGradient: 'from-orange-500 to-amber-600',
    iconBg: 'bg-orange-100',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed text-center">
          Para registrar o que comeu, basta enviar no <strong>grupo do WhatsApp</strong>:
        </p>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-slate-600 text-sm">
              <strong>✏️ Texto (preferencial)</strong> — descreva o que comeu com quantidades: <em>"Almoço: 150g arroz, 100g feijão, 200g frango grelhado e salada"</em>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-slate-600 text-sm">
              <strong>📸 Foto</strong> — também pode enviar uma foto com legenda descrevendo a refeição
            </p>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-orange-700 text-sm text-center">
            💡 Quanto mais detalhes (gramas, porções), mais preciso o cálculo!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Registre treinos e peso',
    subtitle: 'Use o @bot para atividades físicas',
    icon: <Activity className="w-12 h-12 text-sky-600" />,
    bgGradient: 'from-sky-500 to-blue-600',
    iconBg: 'bg-sky-100',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed text-center">
          Para registrar <strong>treinos, passos ou peso</strong>, mencione o bot no grupo:
        </p>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-start gap-3">
            <AtSign className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-600">
              <p className="font-semibold">Mencione o @bot + sua mensagem:</p>
              <p className="text-slate-500 mt-1 italic">"@bot Hoje fiz 45min de musculação"</p>
              <p className="text-slate-500 italic">"@bot Peso hoje: 87.5kg"</p>
              <p className="text-slate-500 italic">"@bot 8500 passos hoje"</p>
            </div>
          </div>
        </div>
        <div className="bg-sky-50 rounded-xl p-3">
          <p className="text-sky-700 text-sm text-center">
            📸 Você também pode enviar <strong>foto do relógio/app</strong> com @bot que a IA extrai os dados!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Regras do grupo WhatsApp',
    subtitle: 'Para tudo funcionar direitinho',
    icon: <MessageCircle className="w-12 h-12 text-violet-600" />,
    bgGradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100',
    content: (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">🍽️</span>
            <p className="text-slate-600 text-sm">
              <strong>Refeições:</strong> envie direto no grupo (texto ou foto) — sem @bot
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🏋️</span>
            <p className="text-slate-600 text-sm">
              <strong>Atividades/peso:</strong> sempre com <strong>@bot</strong> antes da mensagem
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📊</span>
            <p className="text-slate-600 text-sm">
              <strong>Este app:</strong> mostra tudo organizado — suas calorias, evolução, treinos
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">⏰</span>
            <p className="text-slate-600 text-sm">
              <strong>Registre no dia:</strong> quanto mais perto da refeição, melhor a precisão
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Seu gasto energético real',
    subtitle: 'Quanto mais preciso o registro, melhor o resultado',
    icon: <TrendingUp className="w-12 h-12 text-teal-600" />,
    bgGradient: 'from-teal-500 to-emerald-600',
    iconBg: 'bg-teal-100',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed text-center">
          Com base nos seus registros de <strong>alimentação</strong> e <strong>peso</strong>, calculamos seu <strong>gasto energético real</strong> — quantas calorias seu corpo gasta por dia.
        </p>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">🍽️</span>
            <p className="text-slate-600 text-sm">
              <strong>Food log preciso</strong> — descreva com detalhes (gramas, porções) para um cálculo confiável
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">⚖️</span>
            <p className="text-slate-600 text-sm">
              <strong>Peso regular</strong> — registre seu peso pelo menos 2-3x por semana para acompanhar a evolução
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📈</span>
            <p className="text-slate-600 text-sm">
              <strong>Resultado</strong> — um gasto energético preciso para decisões clínicas mais assertivas no seu acompanhamento
            </p>
          </div>
        </div>
        <div className="bg-teal-50 rounded-xl p-3">
          <p className="text-teal-700 text-sm text-center">
            💡 Quanto mais consistente seus registros, mais preciso o cálculo — e melhor o resultado do seu tratamento!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Tudo pronto! 🚀',
    subtitle: 'Vamos juntos nessa jornada',
    icon: <Target className="w-12 h-12 text-emerald-600" />,
    bgGradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100',
    content: (
      <div className="space-y-4 text-center">
        <p className="text-slate-600 text-lg leading-relaxed">
          Seu acompanhamento começa agora. Cada registro conta!
        </p>
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-emerald-700 font-medium">
            💪 Consistência é o segredo. Registre suas refeições todos os dias e acompanhe sua evolução aqui.
          </p>
        </div>
      </div>
    ),
  },
];

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ patientName, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const isLast = currentSlide === slides.length - 1;
  const isFirst = currentSlide === 0;

  const paginate = (newDirection: number) => {
    if (newDirection > 0 && isLast) return;
    if (newDirection < 0 && isFirst) return;
    setDirection(newDirection);
    setCurrentSlide(prev => prev + newDirection);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipe = swipePower(info.offset.x, info.velocity.x);
    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };

  const slide = slides[currentSlide];
  const displayTitle = currentSlide === 0 && patientName
    ? `Bem-vindo, ${patientName}! 🎉`
    : slide.title;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header gradient */}
      <div className={`bg-gradient-to-br ${slide.bgGradient} pt-12 pb-16 px-6 relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Skip button */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 text-white/80 text-sm font-medium py-1.5 px-3 rounded-full bg-white/20 backdrop-blur-sm"
          >
            Pular
          </button>
        )}

        <div className="relative z-10 text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${slide.iconBg} shadow-lg mb-4`}>
            {slide.icon}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{displayTitle}</h1>
          <p className="text-white/80 text-sm">{slide.subtitle}</p>
        </div>
      </div>

      {/* Content area with swipe */}
      <div className="flex-1 overflow-hidden relative -mt-6">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 bg-slate-50 rounded-t-3xl px-6 pt-8 pb-4 overflow-y-auto"
          >
            {slide.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="bg-slate-50 px-6 pb-8 pt-4">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {!isFirst && (
            <button
              onClick={() => paginate(-1)}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-200 text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={isLast ? onComplete : () => paginate(1)}
            className={`flex-1 h-12 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all
              ${isLast 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200' 
                : 'bg-emerald-500'
              }`}
          >
            {isLast ? 'Começar a usar!' : 'Próximo'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
