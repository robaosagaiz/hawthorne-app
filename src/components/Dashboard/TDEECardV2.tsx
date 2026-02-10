/**
 * TDEECardV2 — Patient-friendly energy model display
 * Main view: simple and motivational for patients
 * Expandable: technical details for clinicians
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Flame, AlertCircle, CheckCircle, Info,
  ChevronDown, ChevronUp, Zap, AlertTriangle, BarChart3
} from 'lucide-react';
import { estimateEnergyMVP, type EnergyModelResult, type ProfileInput, type SeriesPoint } from '../../utils/tdeeCalculatorV2';

interface TDEECardV2Props {
  grupoId: string;
  targetCalories?: number;
  patientGoal?: 'loss' | 'gain' | 'maintain';
  isAdmin?: boolean;
  protocolSince?: string;
  protocolUntil?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const TDEECardV2: React.FC<TDEECardV2Props> = ({
  grupoId,
  targetCalories = 0,
  isAdmin = false,
  protocolSince,
  protocolUntil,
}) => {
  const [result, setResult] = useState<EnergyModelResult | null>(null);
  const [rawSeries, setRawSeries] = useState<SeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!grupoId) return;
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const loadModel = (attempt = 1) => {
      if (cancelled) return;
      setLoading(true);
      setError(null);

      const qp = new URLSearchParams();
      // protocolSince === '' means "all protocols" → send ?since= (empty) to skip backend default
      if (protocolSince !== undefined && protocolSince !== null) qp.set('since', protocolSince);
      if (protocolUntil) qp.set('until', protocolUntil);
      const qStr = qp.toString() ? `?${qp.toString()}` : '';
      fetch(`${API_BASE}/api/energy-model/${encodeURIComponent(grupoId)}${qStr}`)
        .then(res => {
          if (res.status === 429 && attempt < 3) {
            // Rate limited — retry after delay
            const delay = attempt * 3000;
            retryTimeout = setTimeout(() => loadModel(attempt + 1), delay);
            return null;
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (!data || cancelled) return;
          const profile: ProfileInput = {
            sex: data.profile.sex,
            age: data.profile.age,
            height_cm: data.profile.height_cm,
            PAL0: data.profile.PAL0
          };
          const series: SeriesPoint[] = data.series.map((s: any) => ({
            date: s.date,
            weight_kg: s.weight_kg,
            EI_rep_kcal: s.EI_rep_kcal
          }));
          
          const modelResult = estimateEnergyMVP(profile, series);
          setRawSeries(series);
          setResult(modelResult);
          setLoading(false);
        })
        .catch(err => {
          if (cancelled) return;
          console.error('Error loading energy model:', err);
          setError('Erro ao carregar dados');
          setLoading(false);
        });
    };

    loadModel();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [grupoId, protocolSince, protocolUntil]);

  const latestWindow = useMemo(() => {
    if (!result || result.window_summary.length === 0) return null;
    return result.window_summary[result.window_summary.length - 1];
  }, [result]);

  const latestEE = useMemo(() => {
    if (!result) return null;
    const withEE = result.daily.filter(d => d.EE_model !== null);
    return withEE.length > 0 ? withEE[withEE.length - 1] : null;
  }, [result]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Flame className="w-5 h-5 text-purple-600 animate-pulse" />
          </div>
          <h3 className="font-bold text-gray-800">Gasto Energético</h3>
        </div>
        <div className="text-center py-6 text-gray-400 text-sm">Calculando...</div>
      </div>
    );
  }

  // --- Error state ---
  if (error || !result) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-bold text-gray-800">Gasto Energético</h3>
        </div>
        <p className="text-sm text-red-500 mt-3">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  // --- No data / insufficient data state ---
  // Need at least 2 real weight readings and 7 days of data for meaningful TDEE
  const uniqueWeightDays = new Set(
    rawSeries.filter(s => s.weight_kg !== null && s.weight_kg > 0).map(s => s.date)
  ).size;
  const totalDays = result.daily.length;
  const insufficientData = uniqueWeightDays < 2 || totalDays < 7;

  if (result.daily.length === 0 || !latestEE || insufficientData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Flame className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-800">Gasto Energético</h3>
        </div>
        <div className="text-center py-6 text-gray-500">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {uniqueWeightDays < 2 
              ? `Precisamos de pelo menos 2 pesagens para calcular. Você tem ${uniqueWeightDays}.`
              : totalDays < 7
                ? `Precisamos de pelo menos 7 dias de dados (${totalDays} até agora).`
                : 'Registre seu peso e alimentação para ver o cálculo.'}
          </p>
        </div>
      </div>
    );
  }

  const { baseline, params } = result.overall;
  const confidence = latestWindow?.confidence || 0;
  const flags = latestWindow?.flags || [];
  const biasMed = latestWindow?.bias_median;
  const adhMed = latestWindow?.adherence_median;

  // Adherence score and color
  const getAdherenceDisplay = () => {
    if (adhMed === null || adhMed === undefined) return { text: '—', color: 'text-gray-400', bg: 'bg-gray-50', label: 'Sem dados' };
    const pct = Math.round(adhMed * 100);
    if (pct >= 90 && pct <= 110) return { text: `${pct}%`, color: 'text-green-600', bg: 'bg-green-50', label: 'Excelente' };
    if (pct >= 80 && pct <= 120) return { text: `${pct}%`, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Bom' };
    return { text: `${pct}%`, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Ajustar' };
  };
  const adh = getAdherenceDisplay();

  // Confidence indicator
  const getConfLabel = () => {
    if (confidence >= 0.7) return { icon: CheckCircle, color: 'text-green-600' };
    if (confidence >= 0.4) return { icon: Info, color: 'text-yellow-600' };
    return { icon: AlertCircle, color: 'text-gray-400' };
  };
  const conf = getConfLabel();

  // Deficit message for patient
  const getDeficitMessage = () => {
    if (!latestEE.EE_model || !targetCalories) return null;
    const deficit = latestEE.EE_model - targetCalories;
    if (deficit > 100) return { text: `Sua meta cria um déficit de ~${deficit.toLocaleString('pt-BR')} kcal/dia`, color: 'text-green-700', bg: 'bg-green-50' };
    if (deficit < -100) return { text: `Sua meta está acima do gasto — superávit de ~${Math.abs(deficit).toLocaleString('pt-BR')} kcal/dia`, color: 'text-orange-700', bg: 'bg-orange-50' };
    return { text: 'Sua meta está próxima do equilíbrio energético', color: 'text-blue-700', bg: 'bg-blue-50' };
  };
  const deficit = getDeficitMessage();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-tour="tdee">
      {/* Header — clean, patient-friendly */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Seu Gasto Energético</h3>
              <p className="text-xs text-gray-400">Estimativa baseada no seu progresso</p>
            </div>
          </div>
          <conf.icon size={18} className={conf.color} />
        </div>
      </div>

      {/* Main content */}
      <div className="p-5">
        {/* Big number — TDEE */}
        <div className="text-center mb-5">
          <div className="text-4xl font-bold text-gray-800">
            {latestEE.EE_model?.toLocaleString('pt-BR')}
          </div>
          <div className="text-sm text-gray-500 mt-1">calorias gastas por dia</div>
        </div>

        {/* Two cards: Precisão do Registro + Meta */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Adherence card */}
          <div className={`rounded-xl p-4 text-center ${adh.bg}`}>
            <div className={`text-2xl font-bold ${adh.color}`}>{adh.text}</div>
            <div className="text-xs text-gray-600 mt-1">Precisão do Registro</div>
            <div className={`text-xs font-medium mt-0.5 ${adh.color}`}>{adh.label}</div>
          </div>

          {/* Target comparison */}
          {targetCalories > 0 ? (
            <div className="rounded-xl p-4 text-center bg-purple-50">
              <div className="text-2xl font-bold text-purple-700">
                {targetCalories.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-gray-600 mt-1">Sua Meta</div>
              <div className="text-xs font-medium text-purple-600 mt-0.5">kcal/dia</div>
            </div>
          ) : (
            <div className="rounded-xl p-4 text-center bg-gray-50">
              <div className="text-2xl font-bold text-gray-400">—</div>
              <div className="text-xs text-gray-500 mt-1">Meta não definida</div>
            </div>
          )}
        </div>

        {/* Patient-friendly interpretation */}
        {biasMed !== null && biasMed !== undefined && (
          <div className={`p-4 rounded-xl mb-4 ${
            Math.abs(biasMed) <= 150 ? 'bg-green-50' :
            biasMed < -150 ? 'bg-orange-50' : 'bg-blue-50'
          }`}>
            <p className={`text-sm leading-relaxed ${
              Math.abs(biasMed) <= 150 ? 'text-green-800' :
              biasMed < -150 ? 'text-orange-800' : 'text-blue-800'
            }`}>
              {Math.abs(biasMed) <= 150 && '✅ Seus registros alimentares batem com a variação de peso. Continue assim!'}
              {biasMed < -150 && '📝 Sua variação de peso sugere um consumo maior do que o registrado. Tente anotar todas as refeições e lanches!'}
              {biasMed > 150 && '💡 Seu peso está caindo mais rápido do que o esperado para o que registrou. Pode estar gastando mais energia do que pensamos!'}
            </p>
          </div>
        )}

        {/* Deficit message */}
        {deficit && (
          <div className={`p-3 rounded-lg text-sm ${deficit.bg} ${deficit.color}`}>
            {deficit.text}
          </div>
        )}

        {/* Flags — simplified for patient */}
        {flags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {flags.map((flag, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 flex items-center gap-1">
                <AlertTriangle size={10} />
                {flag === 'Sub-relato provável' ? 'Registro incompleto' :
                 flag === 'Super-relato provável' ? 'Registro acima do esperado' :
                 flag === 'Flutuação hídrica provável' ? 'Variação de líquidos' :
                 flag === 'Poucos registros alimentares' ? 'Registre mais refeições' :
                 flag === 'Poucas pesagens' ? 'Pese-se mais vezes' :
                 flag}
              </span>
            ))}
          </div>
        )}

        {/* Expandable technical details (admin only) */}
        {isAdmin && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-3 mt-3"
        >
          {showDetails ? 'Ocultar detalhes técnicos' : 'Detalhes técnicos'}
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        )}

        {isAdmin && showDetails && (
          <div className="space-y-3 border-t border-gray-100 pt-4 text-xs">
            {/* Baseline */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="font-semibold text-purple-700 mb-2">Baseline</p>
              <div className="grid grid-cols-2 gap-1 text-purple-600">
                <div>BW₀: <strong>{baseline.BW0.toFixed(1)} kg</strong></div>
                <div>BMR₀: <strong>{baseline.BMR0} kcal</strong></div>
                <div>PAL: <strong>{baseline.PAL0}</strong></div>
                <div>EE₀: <strong>{baseline.EE0} kcal</strong></div>
              </div>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-gray-50 rounded text-gray-600">
                ρ: <strong>{params.rho}</strong> kcal/kg
              </div>
              <div className="p-2 bg-gray-50 rounded text-gray-600">
                ε: <strong>{params.eps}</strong> kcal/kg/d
              </div>
            </div>

            {/* Current estimates */}
            {latestEE && (
              <div className="p-2 bg-gray-50 rounded text-gray-600">
                Último ponto: EI_model={latestEE.EI_model} • EE_model={latestEE.EE_model} • 
                bias={latestEE.bias ?? '—'} • aderência={latestEE.adherence ? `${Math.round(latestEE.adherence * 100)}%` : '—'}
              </div>
            )}

            {/* Window summaries */}
            {result.window_summary.length > 0 && (
              <div>
                <p className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <BarChart3 size={12} />
                  Janelas ({result.window_summary.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.window_summary.map((w, i) => (
                    <div key={i} className={`p-2 rounded border ${
                      i === result.window_summary.length - 1 ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-gray-700">
                          {w.start.split('-').reverse().slice(0, 2).join('/')} → {w.end.split('-').reverse().slice(0, 2).join('/')}
                        </span>
                        <span className={`font-medium ${
                          w.confidence >= 0.7 ? 'text-green-600' : w.confidence >= 0.4 ? 'text-yellow-600' : 'text-gray-400'
                        }`}>{Math.round(w.confidence * 100)}%</span>
                      </div>
                      <div className="text-gray-500">
                        TDEE: <strong>{w.EE_model_mean?.toLocaleString('pt-BR') ?? '—'}</strong> •
                        Bias: <strong>{w.bias_median ?? '—'}</strong> •
                        Ader.: <strong>{w.adherence_median ? `${Math.round(w.adherence_median * 100)}%` : '—'}</strong>
                      </div>
                      {w.flags.length > 0 && (
                        <div className="text-yellow-600 mt-0.5">⚠ {w.flags.join(' • ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-gray-400 pt-1">
              Modelo: Equação Linearizada MVP • ρ={params.rho} • ε={params.eps} • EMA α=0.25
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TDEECardV2;
