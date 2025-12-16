import React, { useEffect, useState } from 'react';
import { fetchAllPatients } from '../../services/dataService';
import type { UserProfile } from '../../types';
import { User, Phone, Eye } from 'lucide-react';

interface PatientListProps {
    onSelectPatient: (uid: string) => void;
    onAddNew: () => void;
}

const PatientList: React.FC<PatientListProps> = ({ onSelectPatient, onAddNew }) => {
    const [patients, setPatients] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPatients = async () => {
            const data = await fetchAllPatients();
            setPatients(data);
            setLoading(false);
        };
        loadPatients();
    }, []);

    if (loading) return <div className="p-4 text-center text-gray-500">Carregando pacientes...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-700">Pacientes</h3>
                <button
                    onClick={onAddNew}
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                >
                    + Adicionar Paciente
                </button>
            </div>

            {patients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    Nenhum paciente encontrado.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Nome</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Telefone (Bot)</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((patient) => (
                                <tr key={patient.uid} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                                            <User size={16} />
                                        </div>
                                        {patient.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{patient.email}</td>
                                    <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        {patient.phone}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => onSelectPatient(patient.uid)}
                                            className="text-teal-600 hover:text-teal-800 font-medium text-xs border border-teal-200 hover:border-teal-400 px-3 py-1 rounded-full transition-all flex items-center justify-end gap-1 ml-auto"
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
