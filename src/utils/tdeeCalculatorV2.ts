/**
 * TDEE Calculator V2 — Linearized Paper Model (MVP)
 * 
 * Based on validated linearized energy balance equation:
 *   ΔEI(t) = ε·(BW_s(t) - BW_0) + ρ·(dBW/dt)(t)
 *   EI_model(t) = EI_0 + ΔEI(t)
 *   EE_model(t) = EE_0 + ε·(BW_s(t) - BW_0)
 *   bias(t) = EI_rep(t) - EI_model(t)
 *   adherence(t) = EI_rep(t) / EI_model(t)
 * 
 * Where:
 *   ε = metabolic adaptation rate (kcal/kg/day) — EE drops as weight drops
 *   ρ = energy density of weight change (kcal/kg)
 *   BW_s = smoothed body weight (EMA or MA)
 *   EI_0 = baseline intake (Mifflin-St Jeor × PAL)
 *   EE_0 = baseline expenditure (= EI_0 at maintenance)
 */

// ==================== TYPES ====================

export interface ProfileInput {
  sex: 'M' | 'F';
  age: number;           // years
  height_cm: number;
  PAL0?: number;         // Physical Activity Level (default 1.6)
  bf0?: number;          // Body fat % (optional, improves estimates)
}

export interface SeriesPoint {
  date: string;          // YYYY-MM-DD
  weight_kg: number | null;
  EI_rep_kcal: number | null;  // reported energy intake
  steps?: number | null;
  activity?: string | null;
}

export interface ModelSettings {
  smoothing: 'MA7' | 'EMA';
  ema_alpha: number;       // EMA decay factor (default 0.25)
  window_days: number;     // 7 or 14 (default 14)
  min_EI_per_window: number;  // min food log days per window (default 7)
  min_weights_per_window: number; // min weight records per window (default 4)
  PAL0_default: number;    // default 1.6
  rho_default: number;     // kcal/kg (default 8500)
  eps_default: number;     // kcal/kg/day (default 22)
  min_calories: number;    // filter outlier days (default 500)
  max_calories: number;    // filter outlier days (default 5000)
}

export interface DailyEstimate {
  date: string;
  BW_s: number | null;        // smoothed weight
  dBWdt: number | null;       // weight derivative (kg/day)
  EI_model: number | null;    // model-compatible intake
  EE_model: number | null;    // model expenditure (TDEE)
  EI_rep: number | null;      // reported intake
  bias: number | null;        // EI_rep - EI_model
  adherence: number | null;   // EI_rep / EI_model
}

export interface WindowSummary {
  start: string;
  end: string;
  bias_median: number | null;
  adherence_median: number | null;
  EI_model_mean: number | null;
  EE_model_mean: number | null;
  confidence: number;        // 0-1
  flags: string[];
}

export interface EnergyModelResult {
  daily: DailyEstimate[];
  window_summary: WindowSummary[];
  overall: {
    baseline: {
      BW0: number;
      EI0: number;
      EE0: number;
      BMR0: number;
      PAL0: number;
    };
    params: {
      rho: number;
      eps: number;
    };
    notes: string[];
  };
}

// ==================== DEFAULTS ====================

export const DEFAULT_SETTINGS: ModelSettings = {
  smoothing: 'EMA',
  ema_alpha: 0.25,
  window_days: 14,
  min_EI_per_window: 7,
  min_weights_per_window: 4,
  PAL0_default: 1.6,
  rho_default: 8500,
  eps_default: 22,
  min_calories: 500,
  max_calories: 5000,
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Mifflin-St Jeor BMR estimation
 */
export function mifflinStJeor(sex: 'M' | 'F', age: number, height_cm: number, weight_kg: number): number {
  if (sex === 'M') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age - 5;
  } else {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
}

/**
 * Calculate median of an array (ignoring NaN/null)
 */
function median(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate mean of an array (ignoring NaN/null)
 */
function mean(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/**
 * Calculate standard deviation (ignoring NaN/null)
 */
function stdDev(values: (number | null)[]): number {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v));
  if (valid.length < 2) return 0;
  const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
  const sqDiffs = valid.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(sqDiffs.reduce((s, v) => s + v, 0) / valid.length);
}

/**
 * Days between two YYYY-MM-DD dates
 */
function daysBetween(d1: string, d2: string): number {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  return (t2 - t1) / (1000 * 60 * 60 * 24);
}

/**
 * Normalize date DD-MM-YYYY → YYYY-MM-DD
 */
function normalizeDate(d: string): string {
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  return d;
}

// ==================== SMOOTHING ====================

/**
 * Exponential Moving Average for sparse weight data
 * Handles gaps by adjusting alpha based on time delta
 */
function smoothEMA(
  dates: string[],
  weights: (number | null)[],
  alpha: number
): (number | null)[] {
  const result: (number | null)[] = new Array(weights.length).fill(null);
  let lastSmoothed: number | null = null;
  let lastDate: string | null = null;

  for (let i = 0; i < weights.length; i++) {
    if (weights[i] === null) {
      // Carry forward the last smoothed value
      result[i] = lastSmoothed;
      continue;
    }

    if (lastSmoothed === null) {
      // First valid weight — initialize
      result[i] = weights[i]!;
      lastSmoothed = weights[i]!;
      lastDate = dates[i];
      continue;
    }

    // Adjust alpha for time gap (more gap → less weight on old data)
    const gap = lastDate ? daysBetween(lastDate, dates[i]) : 1;
    const effectiveAlpha = 1 - Math.pow(1 - alpha, gap);
    
    lastSmoothed = effectiveAlpha * weights[i]! + (1 - effectiveAlpha) * lastSmoothed;
    result[i] = lastSmoothed;
    lastDate = dates[i];
  }

  return result;
}

/**
 * Simple Moving Average (7-day) for weight data
 * For sparse data, averages available points in the window
 */
function smoothMA7(
  dates: string[],
  weights: (number | null)[]
): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < weights.length; i++) {
    if (weights[i] === null) {
      result.push(null);
      continue;
    }

    // Collect weights within 7 days before this point
    const windowWeights: number[] = [];
    for (let j = i; j >= 0; j--) {
      if (weights[j] === null) continue;
      const gap = daysBetween(dates[j], dates[i]);
      if (gap > 7) break;
      windowWeights.push(weights[j]!);
    }

    result.push(windowWeights.length > 0
      ? windowWeights.reduce((s, v) => s + v, 0) / windowWeights.length
      : null
    );
  }

  return result;
}

// ==================== MAIN FUNCTION ====================

/**
 * MVP Energy Model — fixed ρ and ε
 */
export function estimateEnergyMVP(
  profile: ProfileInput,
  series: SeriesPoint[],
  settings: Partial<ModelSettings> = {}
): EnergyModelResult {
  const cfg = { ...DEFAULT_SETTINGS, ...settings };
  const notes: string[] = [];

  // 0) Sort and normalize dates
  const sorted = [...series]
    .map(s => ({ ...s, date: normalizeDate(s.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 1) Extract arrays
  const dates = sorted.map(s => s.date);
  const rawWeights = sorted.map(s => s.weight_kg);
  const rawEI = sorted.map(s => {
    if (s.EI_rep_kcal === null) return null;
    if (s.EI_rep_kcal < cfg.min_calories || s.EI_rep_kcal > cfg.max_calories) return null;
    return s.EI_rep_kcal;
  });

  // 2) Smooth weight
  const BW_s = cfg.smoothing === 'EMA'
    ? smoothEMA(dates, rawWeights, cfg.ema_alpha)
    : smoothMA7(dates, rawWeights);

  // 3) Find first valid smoothed weight (baseline)
  const firstValidIdx = BW_s.findIndex(w => w !== null);
  if (firstValidIdx === -1) {
    return {
      daily: [],
      window_summary: [],
      overall: {
        baseline: { BW0: 0, EI0: 0, EE0: 0, BMR0: 0, PAL0: cfg.PAL0_default },
        params: { rho: cfg.rho_default, eps: cfg.eps_default },
        notes: ['Sem dados de peso válidos']
      }
    };
  }

  const BW0 = BW_s[firstValidIdx]!;
  const PAL0 = profile.PAL0 || cfg.PAL0_default;
  const BMR0 = mifflinStJeor(profile.sex, profile.age, profile.height_cm, BW0);
  const EE0 = BMR0 * PAL0;
  const EI0 = EE0; // MVP assumption: baseline = maintenance

  notes.push(`BMR₀ = ${Math.round(BMR0)} kcal (Mifflin-St Jeor)`);
  notes.push(`EE₀ = EI₀ = ${Math.round(EE0)} kcal (PAL ${PAL0})`);
  notes.push(`BW₀ = ${BW0.toFixed(1)} kg`);

  const rho = cfg.rho_default;
  const eps = cfg.eps_default;

  // 4) Compute derivative of smoothed weight
  const dBWdt: (number | null)[] = new Array(sorted.length).fill(null);
  let lastValidBW: { idx: number; date: string; value: number } | null = null;

  for (let i = 0; i < sorted.length; i++) {
    if (BW_s[i] === null) continue;

    if (lastValidBW !== null) {
      const deltaDays = daysBetween(lastValidBW.date, dates[i]);
      if (deltaDays > 0) {
        dBWdt[i] = (BW_s[i]! - lastValidBW.value) / deltaDays;
      }
    }

    lastValidBW = { idx: i, date: dates[i], value: BW_s[i]! };
  }

  // 5) Daily estimates
  const daily: DailyEstimate[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const bw = BW_s[i];
    const deriv = dBWdt[i];
    const eiRep = rawEI[i];

    let EI_model: number | null = null;
    let EE_model: number | null = null;
    let bias: number | null = null;
    let adherence: number | null = null;

    if (bw !== null && deriv !== null) {
      const dBW = bw - BW0;
      const deltaEI = eps * dBW + rho * deriv;
      EI_model = EI0 + deltaEI;
      EE_model = EE0 + eps * dBW;

      if (eiRep !== null) {
        bias = eiRep - EI_model;
        adherence = EI_model !== 0 ? eiRep / EI_model : null;
      }
    }

    daily.push({
      date: dates[i],
      BW_s: bw !== null ? Math.round(bw * 10) / 10 : null,
      dBWdt: deriv !== null ? Math.round(deriv * 1000) / 1000 : null,
      EI_model: EI_model !== null ? Math.round(EI_model) : null,
      EE_model: EE_model !== null ? Math.round(EE_model) : null,
      EI_rep: eiRep !== null ? Math.round(eiRep) : null,
      bias: bias !== null ? Math.round(bias) : null,
      adherence: adherence !== null ? Math.round(adherence * 100) / 100 : null,
    });
  }

  // 6) Window summaries
  const window_summary = computeWindowSummaries(daily, cfg);

  return {
    daily,
    window_summary,
    overall: {
      baseline: { BW0, EI0: Math.round(EI0), EE0: Math.round(EE0), BMR0: Math.round(BMR0), PAL0 },
      params: { rho, eps },
      notes
    }
  };
}

// ==================== WINDOW SUMMARIES ====================

function computeWindowSummaries(
  daily: DailyEstimate[],
  cfg: ModelSettings
): WindowSummary[] {
  const summaries: WindowSummary[] = [];
  
  if (daily.length === 0) return summaries;

  // Create rolling windows
  const firstDate = daily[0].date;
  const lastDate = daily[daily.length - 1].date;
  const totalDays = daysBetween(firstDate, lastDate);

  // Slide by half-window for overlap
  const step = Math.floor(cfg.window_days / 2);

  for (let offset = 0; offset <= totalDays; offset += step) {
    const windowStart = new Date(new Date(firstDate).getTime() + offset * 86400000)
      .toISOString().split('T')[0];
    const windowEnd = new Date(new Date(firstDate).getTime() + (offset + cfg.window_days) * 86400000)
      .toISOString().split('T')[0];

    // Get daily estimates in this window
    const windowDaily = daily.filter(d => d.date >= windowStart && d.date < windowEnd);
    if (windowDaily.length === 0) continue;

    const biasValues = windowDaily.map(d => d.bias);
    const adhValues = windowDaily.map(d => d.adherence);
    const eiModelValues = windowDaily.map(d => d.EI_model);
    const eeModelValues = windowDaily.map(d => d.EE_model);

    // Count valid data points
    const eiCount = windowDaily.filter(d => d.EI_rep !== null).length;
    const weightCount = windowDaily.filter(d => d.BW_s !== null).length;

    // Confidence score
    let confidence = 0;
    const flags: string[] = [];

    if (eiCount < cfg.min_EI_per_window) {
      flags.push('Poucos registros alimentares');
      confidence = Math.max(0, eiCount / cfg.min_EI_per_window * 0.5);
    } else if (weightCount < cfg.min_weights_per_window) {
      flags.push('Poucas pesagens');
      confidence = Math.max(0.3, weightCount / cfg.min_weights_per_window * 0.6);
    } else {
      // Base confidence from data quantity
      confidence = 0.6 + Math.min(0.4,
        (eiCount / (cfg.window_days * 0.8)) * 0.2 +
        (weightCount / (cfg.window_days * 0.5)) * 0.2
      );
    }

    // Weight noise flag
    const bwValues = windowDaily.map(d => d.BW_s);
    const bwStd = stdDev(bwValues);
    const bwMean = mean(bwValues);
    if (bwMean && bwStd > 0.02 * bwMean) {
      flags.push('Flutuação hídrica provável');
      confidence *= 0.8;
    }

    // Sub-reporting flag
    const biasMed = median(biasValues);
    if (biasMed !== null && biasMed < -300) {
      flags.push('Sub-relato provável');
    } else if (biasMed !== null && biasMed > 300) {
      flags.push('Super-relato provável');
    }

    // EI coverage flag
    const eiCoverage = eiCount / cfg.window_days;
    if (eiCoverage < 0.6) {
      flags.push('Registros alimentares em < 60% dos dias');
    }

    confidence = Math.round(confidence * 100) / 100;

    summaries.push({
      start: windowStart,
      end: windowEnd,
      bias_median: biasMed !== null ? Math.round(biasMed) : null,
      adherence_median: median(adhValues) !== null ? Math.round(median(adhValues)! * 100) / 100 : null,
      EI_model_mean: mean(eiModelValues) !== null ? Math.round(mean(eiModelValues)!) : null,
      EE_model_mean: mean(eeModelValues) !== null ? Math.round(mean(eeModelValues)!) : null,
      confidence,
      flags
    });
  }

  return summaries;
}
