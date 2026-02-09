import React, { useState, useCallback, Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import PatientList from './PatientList';
import RegisterPatient from './RegisterPatient';
import Dashboard from '../Dashboard/Dashboard';
import ReportsView from '../Dashboard/ReportsView';
import ActivitySection from '../Dashboard/ActivitySection';
import ProtocolSelector, { type ProtocolPeriod } from '../Dashboard/ProtocolSelector';
import GoalsManager from './GoalsManager';
import { fetchPatientFromApi, checkApiHealth } from '../../services/apiService';
import { fetchUserProfile } from '../../services/dataService';
import { Users, ArrowLeft, BarChart3, FileText, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

// Error Boundary to prevent tab crashes from taking down the whole admin
class TabErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Tab render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">Erro ao renderizar</p>
          <p className="text-sm text-gray-400 mb-4">
            {this.state.error?.message || 'Erro inesperado'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type TabType = 'dashboard' | 'activities' | 'reports';

const AdminDashboard: React.FC = () => {
  const [view, setView] = useState<'list' | 'register' | 'details'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientGoal, setPatientGoal] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [patientTargets, setPatientTargets] = useState({ energy: 0, protein: 0, carbs: 0, fats: 0 });
  const [patientStartDate, setPatientStartDate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<ProtocolPeriod | null>(null);
  const handlePeriodChange = useCallback((period: ProtocolPeriod) => setSelectedPeriod(period), []);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectPatient = async (uid: string) => {
    setSelectedPatientId(uid);
    setActiveTab('dashboard');
    const apiAvailable = await checkApiHealth();
    if (apiAvailable) {
      const patient = await fetchPatientFromApi(uid);
      if (patient) {
        setPatientName(patient.name);
        setPatientGoal(patient.goal || '');
        setPatientTargets(patient.targets || { energy: 0, protein: 0, carbs: 0, fats: 0 });
        setPatientStartDate(patient.startDate || '');
        setView('details');
        return;
      }
    }
    const profile = await fetchUserProfile(uid);
    setPatientName(profile?.name || uid);
    setPatientGoal('');
    setView('details');
  };

  const handleBack = () => {
    setSelectedPatientId(null);
    setPatientName('');
    setPatientGoal('');
    setView('list');
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'activities' as TabType, label: 'Atividades', icon: Activity },
    { id: 'reports' as TabType, label: 'Relatórios', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            {view === 'details' ? (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm bg-white/80"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            ) : (
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {view === 'details' ? patientName : 'Painel do Nutricionista'}
              </h1>
              {view === 'details' && patientGoal && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {patientGoal}
                </p>
              )}
            </div>
          </div>

          {view === 'details' && (
            <button
              onClick={handleBack}
              className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
        </motion.div>

        {/* Views */}
        {view === 'list' && (
          <PatientList
            onSelectPatient={handleSelectPatient}
            onAddNew={() => setView('register')}
          />
        )}

        {view === 'register' && (
          <RegisterPatient
            onCancel={() => setView('list')}
            onSuccess={() => setView('list')}
          />
        )}

        {view === 'details' && selectedPatientId && (
          <div className="space-y-4">
            {/* Patient Banner + Goals */}
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold">
                  {patientName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{patientName}</h2>
                  {patientGoal && <p className="text-emerald-100 text-sm">{patientGoal}</p>}
                  <p className="text-emerald-200 text-[10px] mt-1 font-mono opacity-60">
                    {selectedPatientId.substring(0, 24)}...
                  </p>
                </div>
                {/* Targets summary */}
                {patientTargets.energy > 0 && (
                  <div className="hidden sm:flex gap-2">
                    {[
                      { label: 'kcal', value: patientTargets.energy, color: 'bg-white/20' },
                      { label: 'P', value: `${patientTargets.protein}g`, color: 'bg-white/15' },
                      { label: 'C', value: `${patientTargets.carbs}g`, color: 'bg-white/15' },
                      { label: 'G', value: `${patientTargets.fats}g`, color: 'bg-white/15' },
                    ].map(t => (
                      <div key={t.label} className={cn('rounded-lg px-2.5 py-1.5 text-center', t.color)}>
                        <p className="text-xs font-bold tabular-nums">{t.value}</p>
                        <p className="text-[9px] text-white/70">{t.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Goals Manager */}
              <div className="mt-4">
                <GoalsManager
                  grupoId={selectedPatientId}
                  patientName={patientName}
                  currentTargets={patientTargets}
                  onGoalsUpdated={() => {
                    setRefreshKey(k => k + 1);
                    fetchPatientFromApi(selectedPatientId!).then(p => {
                      if (p) {
                        setPatientTargets(p.targets);
                        setPatientGoal(p.goal || '');
                      }
                    });
                  }}
                />
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all',
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Protocol Selector */}
            <div className="mb-3">
              <ProtocolSelector grupoId={selectedPatientId} onPeriodChange={handlePeriodChange} />
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TabErrorBoundary key={`${activeTab}-${selectedPatientId}`} onReset={() => setRefreshKey(k => k + 1)}>
                {activeTab === 'dashboard' && (
                  <Dashboard key={refreshKey} userId={selectedPatientId} isAdmin={true} protocolSince={selectedPeriod !== null ? (selectedPeriod.since !== undefined ? selectedPeriod.since : patientStartDate) : patientStartDate} protocolUntil={selectedPeriod?.until} />
                )}
                {activeTab === 'activities' && (
                  <ActivitySection grupoId={selectedPatientId} isAdmin={true} protocolStartDate={selectedPeriod !== null ? (selectedPeriod.since !== undefined ? selectedPeriod.since : patientStartDate) : patientStartDate} protocolUntilDate={selectedPeriod?.until} />
                )}
                {activeTab === 'reports' && (
                  <ReportsView grupoId={selectedPatientId} />
                )}
              </TabErrorBoundary>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
