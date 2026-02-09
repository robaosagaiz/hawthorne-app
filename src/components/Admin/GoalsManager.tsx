import React, { useState, useEffect } from 'react';
import { Target, Plus, History, Save, X, Scale, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { fetchGoalHistory, updateGoals, startNewProtocol, type Patient } from '../../services/apiService';

interface GoalsManagerProps {
  grupoId: string;
  patientName: string;
  currentTargets: {
    energy: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  onGoalsUpdated: () => void;
}

type ModalType = 'none' | 'adjust' | 'newProtocol' | 'history';

const GoalsManager: React.FC<GoalsManagerProps> = ({ grupoId, patientName, currentTargets, onGoalsUpdated }) => {
  const [modal, setModal] = useState<ModalType>('none');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<Patient[]>([]);

  // Form state for adjust goals
  const [energy, setEnergy] = useState(currentTargets.energy);
  const [protein, setProtein] = useState(currentTargets.protein);
  const [carbs, setCarbs] = useState(currentTargets.carbs);
  const [fats, setFats] = useState(currentTargets.fats);

  // Extra fields for new protocol
  const [initialWeight, setInitialWeight] = useState(0);
  const [goal, setGoal] = useState('Emagrecimento');
  const [medication, setMedication] = useState('');

  useEffect(() => {
    setEnergy(currentTargets.energy);
    setProtein(currentTargets.protein);
    setCarbs(currentTargets.carbs);
    setFats(currentTargets.fats);
  }, [currentTargets]);

  const loadHistory = async () => {
    const data = await fetchGoalHistory(grupoId);
    setHistory(data);
  };

  const openModal = (type: ModalType) => {
    setMessage(null);
    if (type === 'history') loadHistory();
    if (type === 'adjust') {
      setEnergy(currentTargets.energy);
      setProtein(currentTargets.protein);
      setCarbs(currentTargets.carbs);
      setFats(currentTargets.fats);
    }
    if (type === 'newProtocol') {
      setEnergy(currentTargets.energy);
      setProtein(currentTargets.protein);
      setCarbs(currentTargets.carbs);
      setFats(currentTargets.fats);
      setInitialWeight(0);
      setGoal('Emagrecimento');
      setMedication('');
    }
    setModal(type);
  };

  const handleAdjustGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateGoals(grupoId, { energy, protein, carbs, fats });
    setLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Metas atualizadas com sucesso!' });
      setTimeout(() => { setModal('none'); onGoalsUpdated(); }, 1500);
    } else {
      setMessage({ type: 'error', text: result.message || 'Erro ao atualizar metas' });
    }
  };

  const handleNewProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialWeight) {
      setMessage({ type: 'error', text: 'Peso inicial é obrigatório' });
      return;
    }
    setLoading(true);
    const result = await startNewProtocol(grupoId, { energy, protein, carbs, fats, initialWeight, goal, medication });
    setLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Novo protocolo iniciado!' });
      setTimeout(() => { setModal('none'); onGoalsUpdated(); }, 1500);
    } else {
      setMessage({ type: 'error', text: result.message || 'Erro ao iniciar protocolo' });
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => openModal('adjust')} className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium">
          <Target size={16} /> Ajustar Metas
        </button>
        <button onClick={() => openModal('newProtocol')} className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium">
          <Plus size={16} /> Novo Protocolo
        </button>
        <button onClick={() => openModal('history')} className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
          <History size={16} /> Histórico
        </button>
      </div>

      {/* Modal Overlay */}
      {modal !== 'none' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal('none')}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                {modal === 'adjust' && '🎯 Ajustar Metas'}
                {modal === 'newProtocol' && '🆕 Novo Protocolo'}
                {modal === 'history' && '📊 Histórico de Metas'}
              </h3>
              <button onClick={() => setModal('none')} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            {/* Adjust Goals Form */}
            {modal === 'adjust' && (
              <form onSubmit={handleAdjustGoals} className="p-6 space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Alterar as metas nutricionais de <strong>{patientName}</strong>. As metas anteriores ficam no histórico.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Flame size={14} className="text-orange-500" /> Calorias (kcal)
                    </label>
                    <input type="number" value={energy} onChange={e => setEnergy(Number(e.target.value))} required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Beef size={14} className="text-red-500" /> Proteína (g)
                    </label>
                    <input type="number" value={protein} onChange={e => setProtein(Number(e.target.value))} required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Wheat size={14} className="text-amber-500" /> Carboidrato (g)
                    </label>
                    <input type="number" value={carbs} onChange={e => setCarbs(Number(e.target.value))} required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Droplets size={14} className="text-yellow-500" /> Gordura (g)
                    </label>
                    <input type="number" value={fats} onChange={e => setFats(Number(e.target.value))} required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={18} />
                  {loading ? 'Salvando...' : 'Salvar Novas Metas'}
                </button>
              </form>
            )}

            {/* New Protocol Form */}
            {modal === 'newProtocol' && (
              <form onSubmit={handleNewProtocol} className="p-6 space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Iniciar novo protocolo para <strong>{patientName}</strong>. O protocolo anterior será encerrado automaticamente.
                </p>
                
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <Scale size={14} className="text-blue-500" /> Peso Inicial (kg) *
                  </label>
                  <input type="number" step="0.1" value={initialWeight || ''} onChange={e => setInitialWeight(Number(e.target.value))} required placeholder="Ex: 85.5"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white placeholder:text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Flame size={14} className="text-orange-500" /> Calorias (kcal)
                    </label>
                    <input type="number" value={energy} onChange={e => setEnergy(Number(e.target.value))} required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Beef size={14} className="text-red-500" /> Proteína (g)
                    </label>
                    <input type="number" value={protein} onChange={e => setProtein(Number(e.target.value))} required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Wheat size={14} className="text-amber-500" /> Carboidrato (g)
                    </label>
                    <input type="number" value={carbs} onChange={e => setCarbs(Number(e.target.value))} required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Droplets size={14} className="text-yellow-500" /> Gordura (g)
                    </label>
                    <input type="number" value={fats} onChange={e => setFats(Number(e.target.value))} required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Objetivo</label>
                    <select value={goal} onChange={e => setGoal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none text-gray-900 bg-white">
                      <option value="Emagrecimento">Emagrecimento</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Ganho de massa">Ganho de massa</option>
                      <option value="Saúde geral">Saúde geral</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Medicação</label>
                    <input type="text" value={medication} onChange={e => setMedication(e.target.value)} placeholder="Ex: Tirzepatida"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 bg-white placeholder:text-gray-400" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Plus size={18} />
                  {loading ? 'Iniciando...' : 'Iniciar Novo Protocolo'}
                </button>
              </form>
            )}

            {/* History View */}
            {modal === 'history' && (
              <div className="p-6">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Carregando...</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((h, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${i === 0 ? 'border-teal-200 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${i === 0 ? 'bg-teal-200 text-teal-800' : 'bg-gray-200 text-gray-600'}`}>
                            {i === 0 ? '● ATUAL' : `Protocolo ${history.length - i}`}
                          </span>
                          <span className="text-xs text-gray-600">
                            {h.startDate}{h.endDate ? ` → ${h.endDate}` : ' → presente'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm text-gray-800">
                          <div><span className="text-gray-500">Cal:</span> <strong>{h.targets.energy}</strong></div>
                          <div><span className="text-gray-500">Prot:</span> <strong>{h.targets.protein}g</strong></div>
                          <div><span className="text-gray-500">Carb:</span> <strong>{h.targets.carbs}g</strong></div>
                          <div><span className="text-gray-500">Gord:</span> <strong>{h.targets.fats}g</strong></div>
                        </div>
                        {h.initialWeight > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            Peso inicial: {h.initialWeight}kg {h.goal && `• ${h.goal}`} {h.medication && `• ${h.medication}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GoalsManager;
