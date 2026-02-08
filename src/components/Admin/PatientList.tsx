import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchPatientsFromApi, checkApiHealth } from '../../services/apiService';
import { fetchAllPatients } from '../../services/dataService';
import {
  Pill, Search, Plus, RefreshCw,
  AlertTriangle, Users, Flame, Clock
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface PatientListProps {
  onSelectPatient: (uid: string) => void;
  onAddNew: () => void;
}

interface DisplayPatient {
  id: string;
  name: string;
  email: string;
  goal?: string;
  medication?: string;
  initialWeight?: number;
  targets?: { energy: number; protein: number; carbs: number; fats: number };
  // Live data (fetched separately)
  todayCalories?: number;
  lastLogDate?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const PatientList: React.FC<PatientListProps> = ({ onSelectPatient, onAddNew }) => {
  const [patients, setPatients] = useState<DisplayPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiAvailable = await checkApiHealth();
      if (apiAvailable) {
        const apiPatients = await fetchPatientsFromApi();
        if (apiPatients.length > 0) {
          const displayPatients: DisplayPatient[] = apiPatients.map(p => ({
            id: p.grupo,
            name: p.name,
            email: p.email || '',
            goal: p.goal,
            medication: p.medication,
            initialWeight: p.initialWeight,
            targets: p.targets,
          }));
          setPatients(displayPatients);

          // Fetch live data for each patient (food logs)
          fetchLiveData(displayPatients);
          setLoading(false);
          return;
        }
      }
      // Fallback to Firestore
      const firestorePatients = await fetchAllPatients();
      setPatients(firestorePatients.map(p => ({
        id: p.uid, name: p.name, email: p.email,
      })));
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Erro ao carregar pacientes');
    }
    setLoading(false);
  };

  const fetchLiveData = async (pts: DisplayPatient[]) => {
    // Fetch daily logs for each patient — use daily-logs (aggregated, 1 call each)
    // Batch in groups of 3 with delay to avoid rate limits
    const todayStr = new Date().toISOString().split('T')[0];
    const batchSize = 3;

    for (let i = 0; i < pts.length; i += batchSize) {
      const batch = pts.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (p) => {
          try {
            const res = await fetch(`${API_BASE}/api/daily-logs/${encodeURIComponent(p.id)}`);
            if (!res.ok) return { id: p.id, todayCalories: 0, lastLogDate: undefined };
            const logs: Array<{ date: string; energy: number }> = await res.json();
            const foodLogs = logs.filter(l => l.energy > 0);
            const todayLogs = foodLogs.filter(l => l.date === todayStr);
            const todayCal = todayLogs.reduce((sum, l) => sum + l.energy, 0);
            const lastDate = foodLogs.length > 0 ? foodLogs[foodLogs.length - 1].date : undefined;
            return { id: p.id, todayCalories: Math.round(todayCal), lastLogDate: lastDate };
          } catch {
            return { id: p.id, todayCalories: 0, lastLogDate: undefined };
          }
        })
      );

      setPatients(prev => prev.map(p => {
        const result = results.find(u => u.status === 'fulfilled' && (u as PromiseFulfilledResult<any>).value.id === p.id);
        if (result && result.status === 'fulfilled') {
          const data = result.value;
          return { ...p, todayCalories: data.todayCalories, lastLogDate: data.lastLogDate };
        }
        return p;
      }));

      // Delay between batches to respect rate limits
      if (i + batchSize < pts.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  };

  useEffect(() => { loadPatients(); }, []);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.goal?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const activeToday = patients.filter(p => p.todayCalories && p.todayCalories > 0).length;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error && patients.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">{error}</p>
          <button onClick={loadPatients} className="mt-4 text-sm text-emerald-600 font-semibold hover:underline flex items-center gap-1 mx-auto">
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <motion.div
          className="flex-shrink-0 bg-emerald-50 rounded-2xl px-4 py-3"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-lg font-bold text-emerald-700 tabular-nums">{patients.length}</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Pacientes</p>
        </motion.div>
        <motion.div
          className="flex-shrink-0 bg-orange-50 rounded-2xl px-4 py-3"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-lg font-bold text-orange-700 tabular-nums">{activeToday}</span>
          </div>
          <p className="text-[10px] text-orange-600 font-medium mt-0.5">Ativos hoje</p>
        </motion.div>
        <motion.div
          className="flex-shrink-0 bg-red-50 rounded-2xl px-4 py-3"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-lg font-bold text-red-600 tabular-nums">{patients.length - activeToday}</span>
          </div>
          <p className="text-[10px] text-red-500 font-medium mt-0.5">Sem registro hoje</p>
        </motion.div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </button>
      </div>

      {/* Patient Cards */}
      <div className="space-y-2">
        {filteredPatients.map((patient, i) => {
          const hasLogToday = patient.todayCalories !== undefined && patient.todayCalories > 0;
          const calPercent = patient.targets?.energy && patient.todayCalories
            ? Math.min((patient.todayCalories / patient.targets.energy) * 100, 100)
            : 0;
          const daysSinceLog = patient.lastLogDate
            ? Math.floor((new Date(todayStr).getTime() - new Date(patient.lastLogDate).getTime()) / (1000*60*60*24))
            : null;

          return (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => onSelectPatient(patient.id)}
                className="w-full text-left"
              >
                <Card className={cn(
                  'border-0 shadow-sm hover:shadow-md transition-all',
                  !hasLogToday && daysSinceLog !== null && daysSinceLog > 2 && 'border-l-4 border-l-red-300'
                )}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{patient.name}</p>
                          {hasLogToday && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Registrou hoje" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {patient.goal && (
                            <span className={cn(
                              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                              patient.goal.toLowerCase().includes('emagrecimento')
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-purple-50 text-purple-600'
                            )}>
                              {patient.goal}
                            </span>
                          )}
                          {patient.medication && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Pill className="w-2.5 h-2.5" /> {patient.medication}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side: today's stats */}
                      <div className="flex-shrink-0 text-right">
                        {hasLogToday ? (
                          <div>
                            <p className="text-sm font-bold text-slate-700 tabular-nums">
                              {patient.todayCalories?.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-[10px] text-slate-400">kcal hoje</p>
                            {/* Mini progress */}
                            {patient.targets?.energy && (
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 ml-auto overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    calPercent >= 85 ? 'bg-emerald-400' : calPercent >= 50 ? 'bg-amber-400' : 'bg-slate-300'
                                  )}
                                  style={{ width: `${calPercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px]">
                              {daysSinceLog !== null && daysSinceLog > 0
                                ? `${daysSinceLog}d atrás`
                                : 'Sem registro'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          );
        })}
      </div>

      {filteredPatients.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-slate-500">
              {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientList;
