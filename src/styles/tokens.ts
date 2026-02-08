// Design tokens for Hawthorne v2.0 redesign
export const colors = {
  primary: '#10B981',     // emerald-500 (saúde, progresso)
  primaryLight: '#D1FAE5', // emerald-100
  primaryDark: '#065F46',  // emerald-800
  secondary: '#0EA5E9',   // sky-500 (informação, TDEE)
  secondaryLight: '#E0F2FE', // sky-100
  warning: '#F59E0B',     // amber-500 (atenção)
  warningLight: '#FEF3C7', // amber-100
  danger: '#EF4444',      // red-500 (alerta)
  dangerLight: '#FEE2E2',  // red-100
  surface: '#FFFFFF',
  background: '#F8FAFC',  // slate-50
  text: '#1E293B',        // slate-800
  textMuted: '#64748B',   // slate-500
  textLight: '#94A3B8',   // slate-400
  border: '#E2E8F0',      // slate-200
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Macro colors
export const macroColors = {
  protein: { bg: 'bg-red-50', text: 'text-red-600', bar: '#EF4444', icon: 'text-red-500' },
  carbs: { bg: 'bg-amber-50', text: 'text-amber-600', bar: '#F59E0B', icon: 'text-amber-500' },
  fats: { bg: 'bg-blue-50', text: 'text-blue-600', bar: '#3B82F6', icon: 'text-blue-500' },
  energy: { bg: 'bg-orange-50', text: 'text-orange-600', bar: '#F97316', icon: 'text-orange-500' },
};
