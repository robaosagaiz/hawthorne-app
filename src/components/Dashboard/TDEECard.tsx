/**
 * TDEE Card - Displays calculated Total Daily Energy Expenditure
 * 
 * Shows:
 * - Estimated TDEE
 * - Confidence level
 * - Current deficit/surplus
 * - Projected weight change
 * - Interpretation and recommendations
 */

import React, { useMemo, useState } from 'react';
import { calculateAdaptiveTDEE, getCalorieRecommendation, type TDEEResult, type DailyDataPoint } from '../../utils/tdeeCalculator';
import { 
  Flame, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  AlertCircle, 
  CheckCircle, 
  Info,
  ChevronDown,
  ChevronUp,
  Calculator,
  Target,
  Zap
} from 'lucide-react';

interface TDEECardProps {
  dailyLogs: Array<{
    date: string;
    energy: number;
    weight?: number;
  }>;
  targetCalories?: number;
  patientGoal?: 'loss' | 'gain' | 'maintain';
}

const TDEECard: React.FC<TDEECardProps> = ({ 
  dailyLogs, 
  targetCalories = 0,
  patientGoal = 'loss' 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [goalWeeklyChange, setGoalWeeklyChange] = useState(
    patientGoal === 'loss' ? -0.5 : patientGoal === 'gain' ? 0.3 : 0
  );

  // Transform logs to TDEE calculator format
  const tdeeData: DailyDataPoint[] = useMemo(() => {
    return dailyLogs
      .filter(log => log.weight && log.weight > 0)
      .map(log => ({
        date: log.date,
        calories: log.energy,
        weight: log.weight || 0
      }));
  }, [dailyLogs]);

  // Calculate TDEE
  const tdeeResult: TDEEResult = useMemo(() => {
    return calculateAdaptiveTDEE(tdeeData);
  }, [tdeeData]);

  // Get recommendation
  const recommendation = useMemo(() => {
    if (tdeeResult.tdee > 0) {
      return getCalorieRecommendation(
        tdeeResult.tdee,
        tdeeResult.avgCalories,
        goalWeeklyChange
      );
    }
    return null;
  }, [tdeeResult, goalWeeklyChange]);

  // Determine status color and icon
  const getStatusConfig = () => {
    if (tdeeResult.confidence === 0) {
      return { color: 'gray', icon: AlertCircle, label: 'Dados Insuficientes' };
    }
    if (tdeeResult.confidence < 0.5) {
      return { color: 'yellow', icon: AlertCircle, label: 'Confiança Baixa' };
    }
    if (tdeeResult.confidence < 0.75) {
      return { color: 'blue', icon: Info, label: 'Confiança Moderada' };
    }
    return { color: 'green', icon: CheckCircle, label: 'Confiança Alta' };
  };

  const status = getStatusConfig();

  // Trend icon based on deficit
  const getTrendIcon = () => {
    if (tdeeResult.deficit < -100) return <TrendingDown className="w-5 h-5 text-green-500" />;
    if (tdeeResult.deficit > 100) return <TrendingUp className="w-5 h-5 text-orange-500" />;
    return <Minus className="w-5 h-5 text-blue-500" />;
  };

  // If no valid data with weights
  if (tdeeData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calculator className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-800">TDEE Adaptativo</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Dados de peso não disponíveis</p>
          <p className="text-sm mt-1">
            Para calcular o TDEE adaptativo, são necessárias medições de peso junto com as calorias diárias.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">TDEE Adaptativo</h3>
              <p className="text-xs text-gray-500">Gasto Energético Real Calculado</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            status.color === 'green' ? 'bg-green-100 text-green-700' :
            status.color === 'blue' ? 'bg-blue-100 text-blue-700' :
            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            <status.icon size={12} />
            <span>{status.label}</span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-6">
        {tdeeResult.confidence > 0 ? (
          <>
            {/* TDEE Value */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-800">
                {tdeeResult.tdee.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">kcal/dia estimado</div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">
                  {tdeeResult.avgCalories}
                </div>
                <div className="text-xs text-gray-500">Consumo Médio</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1">
                  {getTrendIcon()}
                  <span className={`text-lg font-semibold ${
                    tdeeResult.deficit < -100 ? 'text-green-600' :
                    tdeeResult.deficit > 100 ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {Math.abs(tdeeResult.deficit)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {tdeeResult.deficit < 0 ? 'Déficit' : tdeeResult.deficit > 0 ? 'Superávit' : 'Equilíbrio'}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`text-lg font-semibold ${
                  tdeeResult.weightChange < 0 ? 'text-green-600' : 
                  tdeeResult.weightChange > 0 ? 'text-orange-600' : 
                  'text-gray-600'
                }`}>
                  {tdeeResult.weightChange > 0 ? '+' : ''}{tdeeResult.weightChange} kg
                </div>
                <div className="text-xs text-gray-500">Δ Peso ({tdeeResult.periodDays} dias)</div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-purple-800">{tdeeResult.interpretation}</p>
            </div>

            {/* Expandable Details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              {showDetails ? 'Ocultar detalhes' : 'Ver detalhes e recomendações'}
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                {/* Detailed Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-500">Período analisado:</span>
                    <span className="font-medium">{tdeeResult.periodDays} dias</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-500">Confiança:</span>
                    <span className="font-medium">{Math.round(tdeeResult.confidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-500">Taxa de mudança:</span>
                    <span className="font-medium">{tdeeResult.weightChangeRate} kg/dia</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-500">Projeção semanal:</span>
                    <span className="font-medium">{tdeeResult.projectedWeeklyChange} kg/sem</span>
                  </div>
                </div>

                {/* Recommendation Calculator */}
                {recommendation && (
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold text-teal-800">Calculadora de Meta</span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-sm text-teal-700">Meta semanal:</label>
                      <select 
                        value={goalWeeklyChange}
                        onChange={(e) => setGoalWeeklyChange(parseFloat(e.target.value))}
                        className="text-sm border border-teal-200 rounded px-2 py-1 bg-white"
                      >
                        <option value={-0.75}>Perder 0.75 kg/sem</option>
                        <option value={-0.5}>Perder 0.5 kg/sem</option>
                        <option value={-0.25}>Perder 0.25 kg/sem</option>
                        <option value={0}>Manter peso</option>
                        <option value={0.25}>Ganhar 0.25 kg/sem</option>
                        <option value={0.5}>Ganhar 0.5 kg/sem</option>
                      </select>
                    </div>

                    <div className="text-sm text-teal-800">
                      <p className="mb-2">{recommendation.explanation}</p>
                      <div className="flex items-center gap-2 mt-3 p-2 bg-white rounded">
                        <span>Recomendação:</span>
                        <span className="font-bold text-lg text-teal-600">
                          {recommendation.recommendedIntake} kcal/dia
                        </span>
                        {recommendation.adjustment !== 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            recommendation.adjustment > 0 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {recommendation.adjustment > 0 ? '+' : ''}{recommendation.adjustment} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Method Info */}
                <div className="text-xs text-gray-400 text-center">
                  Método: {tdeeResult.method} • ρ = 7000 kcal/kg
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="font-medium">Dados insuficientes</p>
            <p className="text-sm mt-1">
              Necessário mínimo de 7 dias com dados de peso e calorias para calcular o TDEE.
            </p>
            <p className="text-sm mt-2">
              Dados disponíveis: {tdeeData.length} dias
            </p>
          </div>
        )}
      </div>

      {/* Comparison with Target (if available) */}
      {targetCalories > 0 && tdeeResult.tdee > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Meta atual:</span>
              <span className="font-medium">{targetCalories} kcal/dia</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600">TDEE calculado:</span>
              <span className="font-medium">{tdeeResult.tdee} kcal/dia</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1 pt-1 border-t border-gray-200">
              <span className="text-gray-600">Déficit planejado:</span>
              <span className={`font-semibold ${
                tdeeResult.tdee - targetCalories > 0 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {tdeeResult.tdee - targetCalories} kcal/dia
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TDEECard;
