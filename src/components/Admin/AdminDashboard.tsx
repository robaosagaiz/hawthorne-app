import React, { useState } from 'react';
import PatientList from './PatientList';
import RegisterPatient from './RegisterPatient';
import Dashboard from '../Dashboard/Dashboard';
import { fetchUserProfile } from '../../services/dataService';
import { fetchPatientFromApi, checkApiHealth } from '../../services/apiService';
import { Users, ArrowLeft } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [view, setView] = useState<'list' | 'register' | 'details'>('list');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [patientName, setPatientName] = useState<string>('');
    const [patientGoal, setPatientGoal] = useState<string>('');

    const handleSelectPatient = async (uid: string) => {
        setSelectedPatientId(uid);
        
        // Try API first, then Firestore
        const apiAvailable = await checkApiHealth();
        if (apiAvailable) {
            const patient = await fetchPatientFromApi(uid);
            if (patient) {
                setPatientName(patient.name);
                setPatientGoal(patient.goal || '');
                setView('details');
                return;
            }
        }
        
        // Fallback to Firestore
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {view === 'details' ? (
                        <button 
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                    ) : (
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <Users className="w-5 h-5 text-teal-600" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {view === 'details' ? 'Painel do Paciente' : 'Painel do Nutricionista'}
                        </h2>
                        {view === 'details' && patientName && (
                            <p className="text-sm text-gray-500">
                                Visualizando: <span className="font-medium text-teal-600">{patientName}</span>
                                {patientGoal && <span className="ml-2 text-gray-400">• {patientGoal}</span>}
                            </p>
                        )}
                    </div>
                </div>
                
                {view === 'details' && (
                    <button 
                        onClick={handleBack} 
                        className="text-teal-600 hover:text-teal-800 font-medium text-sm flex items-center gap-1 hover:bg-teal-50 px-3 py-2 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Voltar para Lista
                    </button>
                )}
            </div>

            {/* Content */}
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Patient Header Banner */}
                    <div className="p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                                {patientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{patientName}</h3>
                                {patientGoal && (
                                    <p className="text-teal-100 text-sm mt-1">
                                        Objetivo: {patientGoal}
                                    </p>
                                )}
                                <p className="text-teal-200 text-xs mt-1 font-mono opacity-75">
                                    ID: {selectedPatientId.substring(0, 20)}...
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Dashboard Content */}
                    <div className="p-6">
                        <Dashboard userId={selectedPatientId} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
