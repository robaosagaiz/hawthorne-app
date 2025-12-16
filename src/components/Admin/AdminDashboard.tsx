import React, { useState } from 'react';
import PatientList from './PatientList';
import RegisterPatient from './RegisterPatient';
import Dashboard from '../Dashboard/Dashboard';
import { fetchUserProfile } from '../../services/dataService';

const AdminDashboard: React.FC = () => {
    const [view, setView] = useState<'list' | 'register' | 'details'>('list');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [patientName, setPatientName] = useState<string>('');

    const handleSelectPatient = async (uid: string) => {
        setSelectedPatientId(uid);
        // Fetch user name for display
        const profile = await fetchUserProfile(uid);
        setPatientName(profile?.name || uid);
        setView('details');
    };

    const handleBack = () => {
        setSelectedPatientId(null);
        setView('list');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Painel do Nutricionista</h2>
                {view === 'details' && (
                    <button onClick={handleBack} className="text-teal-600 hover:text-teal-800 font-medium text-sm">
                        ← Voltar para Lista
                    </button>
                )}
            </div>

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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                    {/* Reusing the Patient Dashboard but passing the patient ID */}
                    <div className="p-4 bg-teal-50 border-b border-teal-100 mb-4 rounded-t-lg">
                        <p className="text-sm text-teal-800">Visualizando paciente: <span className="font-bold text-lg">{patientName}</span> <span className="text-xs text-teal-600 font-mono">({selectedPatientId})</span></p>
                    </div>
                    <div className="p-4">
                        <Dashboard userId={selectedPatientId} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
