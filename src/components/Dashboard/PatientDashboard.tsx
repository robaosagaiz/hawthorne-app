/**
 * Patient Dashboard - Shows personalized data for logged-in patients
 * Automatically fetches data from Google Sheets using the patient's grupo ID
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Dashboard from './Dashboard';
import ReportsView from './ReportsView';
import { User, Target, Pill, Calendar, Scale, BarChart3, FileText } from 'lucide-react';

const PatientDashboard: React.FC = () => {
    const { userProfile, sheetsPatient } = useAuth();
    const [activeTab, setActiveTab] = React.useState<'dashboard' | 'reports'>('dashboard');

    // Use sheets patient grupo as the ID, or fall back to userProfile uid
    const patientId = sheetsPatient?.grupo || userProfile?.uid;

    if (!userProfile) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500">Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Olá, {userProfile.name?.split(' ')[0] || 'Paciente'}! 👋
                        </h1>
                        <p className="text-teal-100 mt-1">
                            Acompanhe seu progresso nutricional
                        </p>
                    </div>
                </div>
            </div>

            {/* Patient Info Cards (only if sheets data available) */}
            {sheetsPatient && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Target className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Objetivo</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {sheetsPatient.goal || 'Não definido'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg">
                                <Pill className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Medicação</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {sheetsPatient.medication || 'Nenhuma'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Início</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {sheetsPatient.startDate || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Scale className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Peso Inicial</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {sheetsPatient.initialWeight ? `${sheetsPatient.initialWeight} kg` : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50">
                    <nav className="flex">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'dashboard'
                                    ? 'border-teal-500 text-teal-600 bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <BarChart3 size={16} />
                            Meu Progresso
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'reports'
                                    ? 'border-teal-500 text-teal-600 bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FileText size={16} />
                            Análises Detalhadas
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'dashboard' && patientId && (
                        <Dashboard userId={patientId} />
                    )}
                    {activeTab === 'reports' && patientId && (
                        <ReportsView grupoId={patientId} />
                    )}
                    {!patientId && (
                        <div className="text-center p-8 text-gray-500">
                            <p>Não foi possível encontrar seus dados.</p>
                            <p className="text-sm mt-2">Entre em contato com seu nutricionista.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Goals Summary */}
            {sheetsPatient && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Suas Metas Diárias</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                            <p className="text-2xl font-bold text-orange-600">{sheetsPatient.targets.energy}</p>
                            <p className="text-xs text-orange-700 mt-1">kcal/dia</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                            <p className="text-2xl font-bold text-red-600">{sheetsPatient.targets.protein}g</p>
                            <p className="text-xs text-red-700 mt-1">Proteína</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                            <p className="text-2xl font-bold text-amber-600">{sheetsPatient.targets.carbs}g</p>
                            <p className="text-xs text-amber-700 mt-1">Carboidratos</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                            <p className="text-2xl font-bold text-blue-600">{sheetsPatient.targets.fats}g</p>
                            <p className="text-xs text-blue-700 mt-1">Gorduras</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
