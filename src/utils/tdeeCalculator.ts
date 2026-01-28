/**
 * TDEE Calculator - Adaptive Total Daily Energy Expenditure
 * 
 * Calculates real TDEE based on:
 * - Daily caloric intake (CI)
 * - Serial weight measurements
 * 
 * Formula: TDEE = Avg(CI) - (WeightChangeRate × ρ)
 * Where ρ (rho) = energy density of weight change (kcal/kg)
 */

export interface DailyDataPoint {
  date: string;
  calories: number;
  weight: number;
}

export interface TDEEResult {
  tdee: number;                    // Estimated TDEE in kcal/day
  confidence: number;              // 0-1 confidence score
  method: string;                  // Calculation method used
  avgCalories: number;             // Average caloric intake
  weightChange: number;            // Total weight change (kg)
  weightChangeRate: number;        // Daily weight change rate (kg/day)
  periodDays: number;              // Number of days analyzed
  deficit: number;                 // Estimated daily deficit/surplus
  projectedWeeklyChange: number;   // Projected weight change per week
  interpretation: string;          // Human-readable interpretation
}

export interface TDEEConfig {
  rho: number;                     // Energy density (kcal/kg), default 7000
  minDays: number;                 // Minimum days for calculation, default 7
  idealDays: number;               // Ideal days for accuracy, default 14
  minCalories: number;             // Min valid calories, default 500
  maxCalories: number;             // Max valid calories, default 5000
  weightSmoothingDays: number;     // Days for weight smoothing, default 3
}

const DEFAULT_CONFIG: TDEEConfig = {
  rho: 7000,
  minDays: 7,
  idealDays: 14,
  minCalories: 500,
  maxCalories: 5000,
  weightSmoothingDays: 3
};

/**
 * Calculate mean of an array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Linear regression slope (least squares)
 * Returns the rate of change per unit (e.g., kg per day)
 */
function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  
  // x = 0, 1, 2, ..., n-1 (days)
  // y = weights
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Apply simple moving average smoothing to weights
 */
function smoothWeights(weights: number[], windowSize: number): number[] {
  if (weights.length <= windowSize) return weights;
  
  const smoothed: number[] = [];
  for (let i = 0; i < weights.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(weights.length, i + Math.ceil(windowSize / 2));
    const window = weights.slice(start, end);
    smoothed.push(mean(window));
  }
  return smoothed;
}

/**
 * Generate interpretation text based on results
 */
function generateInterpretation(result: Partial<TDEEResult>): string {
  const { tdee, deficit, confidence, weightChangeRate } = result;
  
  if (!tdee || confidence === 0) {
    return "Dados insuficientes para calcular o TDEE. Necessário mínimo de 7 dias com dados de peso e calorias.";
  }
  
  const absDeficit = Math.abs(deficit || 0);
  const weeklyChange = (weightChangeRate || 0) * 7;
  
  let text = `TDEE estimado: ${tdee} kcal/dia. `;
  
  if (deficit && deficit < -100) {
    text += `Paciente está em déficit calórico de ~${absDeficit} kcal/dia, `;
    text += `perdendo aproximadamente ${Math.abs(weeklyChange).toFixed(2)} kg/semana. `;
  } else if (deficit && deficit > 100) {
    text += `Paciente está em superávit calórico de ~${absDeficit} kcal/dia, `;
    text += `ganhando aproximadamente ${weeklyChange.toFixed(2)} kg/semana. `;
  } else {
    text += `Paciente está próximo do equilíbrio energético. `;
  }
  
  if (confidence && confidence < 0.5) {
    text += "⚠️ Confiança baixa - mais dados necessários.";
  } else if (confidence && confidence < 0.75) {
    text += "Confiança moderada.";
  } else {
    text += "✅ Confiança alta.";
  }
  
  return text;
}

/**
 * Main TDEE calculation function
 */
export function calculateAdaptiveTDEE(
  dailyData: DailyDataPoint[],
  config: Partial<TDEEConfig> = {}
): TDEEResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Sort by date
  const sorted = [...dailyData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Filter valid data points
  const validData = sorted.filter(d => 
    d.calories >= cfg.minCalories && 
    d.calories <= cfg.maxCalories && 
    d.weight > 0
  );
  
  // Check minimum data requirement
  if (validData.length < cfg.minDays) {
    return {
      tdee: 0,
      confidence: 0,
      method: 'insufficient_data',
      avgCalories: validData.length > 0 ? Math.round(mean(validData.map(d => d.calories))) : 0,
      weightChange: 0,
      weightChangeRate: 0,
      periodDays: validData.length,
      deficit: 0,
      projectedWeeklyChange: 0,
      interpretation: generateInterpretation({ confidence: 0 })
    };
  }
  
  // Extract and smooth weights
  const rawWeights = validData.map(d => d.weight);
  const smoothedWeights = smoothWeights(rawWeights, cfg.weightSmoothingDays);
  
  // Calculate averages
  const avgCalories = mean(validData.map(d => d.calories));
  
  // Calculate weight change using linear regression
  const weightChangeRate = linearRegressionSlope(smoothedWeights); // kg/day
  const totalWeightChange = smoothedWeights[smoothedWeights.length - 1] - smoothedWeights[0];
  
  // Calculate TDEE
  // TDEE = Avg(CI) - (rate × ρ)
  // If losing weight (rate < 0): TDEE > CI
  // If gaining weight (rate > 0): TDEE < CI
  const tdee = avgCalories - (weightChangeRate * cfg.rho);
  
  // Calculate deficit/surplus
  const deficit = avgCalories - tdee; // negative = deficit, positive = surplus
  
  // Calculate confidence
  const dataConfidence = Math.min(1, validData.length / cfg.idealDays);
  const calorieCV = stdDev(validData.map(d => d.calories)) / avgCalories;
  const weightCV = stdDev(rawWeights) / mean(rawWeights);
  const variabilityPenalty = Math.max(0, 1 - (calorieCV + weightCV) / 2);
  const confidence = dataConfidence * 0.6 + variabilityPenalty * 0.4;
  
  const result: TDEEResult = {
    tdee: Math.round(tdee),
    confidence: Math.round(confidence * 100) / 100,
    method: 'linear_regression',
    avgCalories: Math.round(avgCalories),
    weightChange: Math.round(totalWeightChange * 100) / 100,
    weightChangeRate: Math.round(weightChangeRate * 1000) / 1000,
    periodDays: validData.length,
    deficit: Math.round(deficit),
    projectedWeeklyChange: Math.round(weightChangeRate * 7 * 100) / 100,
    interpretation: ''
  };
  
  result.interpretation = generateInterpretation(result);
  
  return result;
}

/**
 * Calculate TDEE from separate calorie and weight arrays
 * (Alternative interface for different data structures)
 */
export function calculateTDEEFromArrays(
  calories: number[],
  weights: number[],
  config: Partial<TDEEConfig> = {}
): TDEEResult {
  // Create daily data points assuming sequential days
  const dailyData: DailyDataPoint[] = calories.map((cal, i) => ({
    date: new Date(Date.now() - (calories.length - i - 1) * 86400000).toISOString().split('T')[0],
    calories: cal,
    weight: weights[i] || 0
  }));
  
  return calculateAdaptiveTDEE(dailyData, config);
}

/**
 * Get recommended calorie adjustment based on TDEE and goal
 */
export function getCalorieRecommendation(
  tdee: number,
  currentIntake: number,
  goalWeightChangePerWeek: number, // kg/week (negative for loss)
  config: Partial<TDEEConfig> = {}
): { 
  recommendedIntake: number; 
  adjustment: number; 
  explanation: string 
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Calculate required deficit/surplus
  // Weekly weight change = weekly deficit / rho
  // Daily deficit = weekly deficit / 7 = (goalWeightChangePerWeek * rho) / 7
  const requiredDailyDeficit = (goalWeightChangePerWeek * cfg.rho) / 7;
  const recommendedIntake = tdee - requiredDailyDeficit;
  const adjustment = recommendedIntake - currentIntake;
  
  let explanation = '';
  if (goalWeightChangePerWeek < 0) {
    explanation = `Para perder ${Math.abs(goalWeightChangePerWeek)} kg/semana, `;
    explanation += `recomendado consumir ${Math.round(recommendedIntake)} kcal/dia `;
    explanation += `(${adjustment > 0 ? 'aumentar' : 'reduzir'} ${Math.abs(Math.round(adjustment))} kcal do atual).`;
  } else if (goalWeightChangePerWeek > 0) {
    explanation = `Para ganhar ${goalWeightChangePerWeek} kg/semana, `;
    explanation += `recomendado consumir ${Math.round(recommendedIntake)} kcal/dia `;
    explanation += `(${adjustment > 0 ? 'aumentar' : 'reduzir'} ${Math.abs(Math.round(adjustment))} kcal do atual).`;
  } else {
    explanation = `Para manter o peso, consumir ${Math.round(tdee)} kcal/dia.`;
  }
  
  return {
    recommendedIntake: Math.round(recommendedIntake),
    adjustment: Math.round(adjustment),
    explanation
  };
}
