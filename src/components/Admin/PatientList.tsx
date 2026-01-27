import React, { useEffect, useState } from 'react';
import { fetchAllPatients } from '../../services/dataService';
import { fetchPatientsFromApi, checkApiHealth } from '../../services/apiService';
import { Eye, Target, Pill, TrendingDown, Database, Cloud } from 'lucide-react';

interface PatientListProps {
    onSelectPatient: (uid: string) => void;
    onAddNew: () => void;
}

// Combined patient type for display
interface DisplayPatient {
    id: string;
    name: string;
    email: string;
    phone: string;
    goal?: string;
    medication?: string;
    initialWeight?: number;
    source: 'api' | 'firestore';
}

const PatientList: React.FC<PatientListProps> = ({ onSelectPatient, onAddNew }) => {
    const [patients, setPatients] = useState<DisplayPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'api' | 'firestore' | 'none'>('none');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadPatients = async () => {
            setLoading(true);
            
            // Try API first (Google Sheets - source of truth)
            const apiAvailable = await checkApiHealth();
            
            if (apiAvailable) {
                const apiPatients = await fetchPatientsFromApi();
                if (apiPatients.length > 0) {
                    const displayPatients: DisplayPatient[] = apiPatients.map(p => ({
                        id: p.grupo,
                        name: p.name,
                        email: p.email || '',
                        phone: p.grupo,
                        goal: p.goal,
                        medication: p.medication,
                        initialWeight: p.initialWeight,
                        source: 'api' as const
                    }));
                    setPatients(displayPatients);
                    setDataSource('api');
                    setLoading(false);
                    return;
                }
            }
            
            // Fallback to Firestore
            const firestorePatients = await fetchAllPatients();
            if (firestorePatients.length > 0) {
                const displayPatients: DisplayPatient[] = firestorePatients.map(p => ({
                    id: p.uid,
                    name: p.name,
                    email: p.email,
                    phone: p.phone,
                    source: 'firestore' as const
                }));
                setPatients(displayPatients);
                setDataSource('firestore');
            } else {
                setDataSource('none');
            }
            
            setLoading(false);
        };
        loadPatients();
    }, []);

    // Filter patients by search term
    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.goal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.medication?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando pacientes...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-700">Pacientes</h3>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            dataSource === 'api' 
                                ? 'bg-green-100 text-green-700' 
                                : dataSource === 'firestore'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                            {dataSource === 'api' ? (
                                <><Cloud size={12} /> Google Sheets</>
                            ) : dataSource === 'firestore' ? (
                                <><Database size={12} /> Firestore</>
                            ) : (
                                'Sem dados'
                            )}
                        </span>
                    </div>
                    <button
                        onClick={onAddNew}
                        className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                    >
                        + Adicionar Paciente
                    </button>
                </div>
                
                {/* Search */}
                <input
                    type="text"
                    placeholder="Buscar por nome, objetivo ou medicação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
            </div>

            {/* Stats Bar */}
            <div className="px-6 py-3 bg-teal-50 border-b border-teal-100 flex gap-6 text-sm">
                <span className="text-teal-700">
                    <strong>{filteredPatients.length}</strong> pacientes
                </span>
                <span className="text-teal-600">
                    {filteredPatients.filter(p => p.goal?.toLowerCase().includes('emagrecimento')).length} em emagrecimento
                </span>
                <span className="text-teal-600">
                    {filteredPatients.filter(p => p.medication?.toLowerCase().includes('tirzepatida')).length} com Tirzepatida
                </span>
            </div>

            {/* Patient List */}
            {filteredPatients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    {searchTerm ? 'Nenhum paciente encontrado para a busca.' : 'Nenhum paciente cadastrado.'}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Nome</th>
                                <th className="px-6 py-3">Objetivo</th>
                                <th className="px-6 py-3">Medicação</th>
                                <th className="px-6 py-3">Peso Inicial</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map((patient) => (
                                <tr key={patient.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold">
                                                {patient.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{patient.name}</div>
                                                {patient.email && (
                                                    <div className="text-xs text-gray-400">{patient.email}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {patient.goal ? (
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                patient.goal.toLowerCase().includes('emagrecimento') 
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : patient.goal.toLowerCase().includes('massa')
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                <Target size={12} />
                                                {patient.goal}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {patient.medication ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                                <Pill size={12} className="text-pink-500" />
                                                {patient.medication}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">Sem medicação</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {patient.initialWeight ? (
                                            <span className="inline-flex items-center gap-1 text-gray-700">
                                                <TrendingDown size={14} className="text-teal-500" />
                                                {patient.initialWeight} kg
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => onSelectPatient(patient.id)}
                                            className="text-teal-600 hover:text-teal-800 font-medium text-xs border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-full transition-all flex items-center justify-end gap-1 ml-auto hover:bg-teal-50"
                                        >
                                            <Eye size={14} /> Ver Painel
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PatientList;
