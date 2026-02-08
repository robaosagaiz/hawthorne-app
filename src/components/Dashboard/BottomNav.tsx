import React from 'react';
import { Home, TrendingUp, Activity, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export type PatientTab = 'today' | 'progress' | 'activities' | 'profile';

interface BottomNavProps {
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  hasUnloggedToday?: boolean;
}

const tabs: { id: PatientTab; label: string; icon: React.ElementType }[] = [
  { id: 'today', label: 'Hoje', icon: Home },
  { id: 'progress', label: 'Evolução', icon: TrendingUp },
  { id: 'activities', label: 'Atividades', icon: Activity },
  { id: 'profile', label: 'Perfil', icon: User },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, hasUnloggedToday }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors relative',
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {tab.label}
              </span>
              {tab.id === 'today' && hasUnloggedToday && (
                <span className="absolute top-1 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
