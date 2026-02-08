/**
 * ActivitySection - Shows physical activity data (weight, exercise, steps)
 * Reads from Activities tab via /api/activities/:grupoId
 */

import React, { useEffect, useState } from 'react';
import { Scale, Dumbbell, Footprints, TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react';

interface ActivityRecord {
  grupo: string;
  date: string;
  type: string; // peso, forca, cardio, passos
  durationMin: number | null;
  value: number | null;
  notes: string;
  source: string;
  dateTime: string;
}

interface ActivitySectionProps {
  grupoId: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const ActivitySection: React.FC<ActivitySectionProps> = ({ grupoId }) => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grupoId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/activities/${encodeURIComponent(grupoId)}`)
      .then(res => res.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching activities:', err);
        setError('Erro ao carregar atividades');
        setLoading(false);
      });
  }, [grupoId]);

  if (loading) {
    return (
      <div className="text-center p-6 text-gray-400">
        <Activity className="w-6 h-6 animate-pulse mx-auto mb-2" />
        <p className="text-sm">Carregando atividades...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 text-red-400 text-sm">{error}</div>;
  }

  // Separate by type
  const weightRecords = activities.filter(a => a.type === 'peso');
  const exerciseRecords = activities.filter(a => a.type === 'forca' || a.type === 'cardio');
  const stepsRecords = activities.filter(a => a.type === 'passos');

  // Latest values — diff from FIRST weight (protocol start) to current
  const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null;
  const firstWeight = weightRecords.length > 1 ? weightRecords[0] : null;
  const weightDiff = latestWeight && firstWeight && latestWeight.value && firstWeight.value
    ? latestWeight.value - firstWeight.value
    : null;

  const latestSteps = stepsRecords.length > 0 ? stepsRecords[stepsRecords.length - 1] : null;

  // This week exercise count (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekExercises = exerciseRecords.filter(e => {
    try {
      const parts = e.date.split('-');
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return d >= weekAgo;
    } catch { return false; }
  });
  const weekForca = weekExercises.filter(e => e.type === 'forca').length;
  const weekCardio = weekExercises.filter(e => e.type === 'cardio').length;

  // Activity classification
  const isActive = weekExercises.length >= 3;
  const isSedentary = latestSteps && latestSteps.value ? latestSteps.value < 5000 : null;

  let badge = '';
  let badgeColor = '';
  if (isActive && isSedentary === false) {
    badge = 'Ativo + Não-Sedentário 🏆';
    badgeColor = 'bg-emerald-100 text-emerald-700';
  } else if (isActive && isSedentary === true) {
    badge = 'Ativo + Sedentário';
    badgeColor = 'bg-yellow-100 text-yellow-700';
  } else if (!isActive && isSedentary === false) {
    badge = 'Inativo + Não-Sedentário';
    badgeColor = 'bg-blue-100 text-blue-700';
  } else if (!isActive && isSedentary === true) {
    badge = 'Inativo + Sedentário ⚠️';
    badgeColor = 'bg-red-100 text-red-700';
  }

  const hasAnyData = activities.length > 0;

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          Atividade Física
        </h3>
        <div className="text-center py-8 text-gray-400">
          <Footprints className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum registro de atividade ainda</p>
          <p className="text-xs mt-1">Envie pelo WhatsApp: peso, treinos e passos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          Atividade Física
        </h3>
        {badge && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weight Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Peso</span>
          </div>
          {latestWeight && latestWeight.value ? (
            <>
              <p className="text-2xl font-bold text-purple-700">
                {latestWeight.value.toFixed(1)} kg
              </p>
              <div className="flex items-center gap-1 mt-1">
                {weightDiff !== null && (
                  <>
                    {weightDiff < 0 ? (
                      <TrendingDown className="w-3 h-3 text-green-600" />
                    ) : weightDiff > 0 ? (
                      <TrendingUp className="w-3 h-3 text-red-500" />
                    ) : (
                      <Minus className="w-3 h-3 text-gray-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      weightDiff < 0 ? 'text-green-600' : weightDiff > 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
                    </span>
                  </>
                )}
                <span className="text-xs text-purple-500 ml-auto">{latestWeight.date}</span>
              </div>
              {weightRecords.length > 1 && (
                <p className="text-xs text-purple-400 mt-2">{weightRecords.length} registros</p>
              )}
            </>
          ) : (
            <p className="text-sm text-purple-400 mt-2">Sem registro</p>
          )}
        </div>

        {/* Exercise Card */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-700">Treinos (7 dias)</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">
            {weekExercises.length}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {weekForca > 0 && (
              <span className="text-xs text-orange-600">
                💪 {weekForca}x força
              </span>
            )}
            {weekCardio > 0 && (
              <span className="text-xs text-orange-600">
                🏃 {weekCardio}x cardio
              </span>
            )}
            {weekExercises.length === 0 && (
              <span className="text-xs text-orange-400">Nenhum treino registrado</span>
            )}
          </div>
          {weekExercises.length >= 3 ? (
            <p className="text-xs text-green-600 font-medium mt-2">✅ Meta ≥3 atingida!</p>
          ) : (
            <p className="text-xs text-orange-400 mt-2">
              Falta{weekExercises.length < 3 ? `m ${3 - weekExercises.length}` : ''} para a meta de 3/semana
            </p>
          )}
        </div>

        {/* Steps Card */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Footprints className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium text-teal-700">Passos</span>
          </div>
          {latestSteps && latestSteps.value ? (
            <>
              <p className="text-2xl font-bold text-teal-700">
                {latestSteps.value.toLocaleString('pt-BR')}
              </p>
              <div className="w-full bg-teal-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    latestSteps.value >= 10000 ? 'bg-emerald-500' :
                    latestSteps.value >= 5000 ? 'bg-teal-500' : 'bg-orange-400'
                  }`}
                  style={{ width: `${Math.min((latestSteps.value / 10000) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-teal-500">{latestSteps.date}</span>
                <span className="text-xs text-teal-400">Meta: 10.000</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-teal-400 mt-2">Sem registro</p>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Últimos registros</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {activities.slice(-5).reverse().map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-16 text-gray-400">{a.date}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  a.type === 'peso' ? 'bg-purple-100 text-purple-600' :
                  a.type === 'forca' ? 'bg-orange-100 text-orange-600' :
                  a.type === 'cardio' ? 'bg-blue-100 text-blue-600' :
                  'bg-teal-100 text-teal-600'
                }`}>
                  {a.type === 'peso' ? '⚖️' : a.type === 'forca' ? '💪' : a.type === 'cardio' ? '🏃' : '👟'}
                  {' '}{a.type}
                </span>
                {a.value && <span>{a.type === 'passos' ? a.value.toLocaleString('pt-BR') : `${a.value}`}{a.type === 'peso' ? ' kg' : a.type === 'passos' ? ' passos' : ''}</span>}
                {a.durationMin && <span>{a.durationMin} min</span>}
                {a.notes && <span className="text-gray-400 truncate max-w-[150px]">{a.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitySection;
