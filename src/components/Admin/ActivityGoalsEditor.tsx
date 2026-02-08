import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, X, Dumbbell, Timer, Footprints } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface ActivityTargets {
  workoutsPerWeek: number;
  cardioMinutes: number;
  stepsPerDay: number;
}

interface ActivityGoalsEditorProps {
  grupoId: string;
  currentTargets: ActivityTargets;
  onSaved: (targets: ActivityTargets) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const ActivityGoalsEditor: React.FC<ActivityGoalsEditorProps> = ({ grupoId, currentTargets, onSaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workouts, setWorkouts] = useState(currentTargets.workoutsPerWeek);
  const [cardio, setCardio] = useState(currentTargets.cardioMinutes);
  const [steps, setSteps] = useState(currentTargets.stepsPerDay);

  useEffect(() => {
    setWorkouts(currentTargets.workoutsPerWeek);
    setCardio(currentTargets.cardioMinutes);
    setSteps(currentTargets.stepsPerDay);
  }, [currentTargets]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(grupoId)}/activity-targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutsPerWeek: workouts,
          cardioMinutes: cardio,
          stepsPerDay: steps,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved({ workoutsPerWeek: workouts, cardioMinutes: cardio, stepsPerDay: steps });
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Error saving activity targets:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
      >
        <Settings className="w-3.5 h-3.5" />
        Ajustar metas de atividade
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mt-2 border border-emerald-100 shadow-sm">
              <CardContent className="py-4 px-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Metas de Atividade</h4>
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Workouts per week */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Dumbbell className="w-3.5 h-3.5 text-orange-500" />
                    Treinos por semana
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1} max={7} step={1}
                      value={workouts}
                      onChange={(e) => setWorkouts(parseInt(e.target.value))}
                      className="flex-1 accent-orange-500"
                    />
                    <span className="text-sm font-bold text-slate-700 tabular-nums w-8 text-center">{workouts}x</span>
                  </div>
                </div>

                {/* Cardio minutes */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Timer className="w-3.5 h-3.5 text-blue-500" />
                    Tempo de cardio (minutos/sessão)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10} max={90} step={5}
                      value={cardio}
                      onChange={(e) => setCardio(parseInt(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-700 tabular-nums w-12 text-center">{cardio} min</span>
                  </div>
                </div>

                {/* Steps per day */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Footprints className="w-3.5 h-3.5 text-teal-500" />
                    Passos por dia
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2000} max={15000} step={500}
                      value={steps}
                      onChange={(e) => setSteps(parseInt(e.target.value))}
                      className="flex-1 accent-teal-500"
                    />
                    <span className="text-sm font-bold text-slate-700 tabular-nums w-16 text-center">
                      {steps.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Metas'}
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityGoalsEditor;
