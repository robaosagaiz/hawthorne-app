import React from 'react';
import type { DailyLog } from '../../types';

interface DailyLogTableProps {
    data: DailyLog[];
    targetEnergy: number;
}

const DailyLogTable: React.FC<DailyLogTableProps> = ({ data, targetEnergy }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-gray-600">Data</th>
                        <th className="px-6 py-4 font-semibold text-gray-600">Energia (kcal)</th>
                        <th className="px-6 py-4 font-semibold text-gray-600">Carboidratos (g)</th>
                        <th className="px-6 py-4 font-semibold text-gray-600">Proteínas (g)</th>
                        <th className="px-6 py-4 font-semibold text-gray-600">Gorduras (g)</th>
                        <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((log) => {
                        const diff = log.energy - targetEnergy;
                        let statusBadge;

                        if (diff > 100) {
                            statusBadge = <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-200">Excesso</span>;
                        } else if (diff < -200) {
                            statusBadge = <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-yellow-200">Déficit Alto</span>;
                        } else {
                            statusBadge = <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">Na Meta</span>;
                        }

                        return (
                            <tr key={log.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {log.date.split('-').slice(1).reverse().join('/')}
                                </td>
                                <td className="px-6 py-4">{log.energy}</td>
                                <td className="px-6 py-4 text-orange-600 font-medium">{log.carbs}</td>
                                <td className="px-6 py-4 text-blue-600 font-medium">{log.protein}</td>
                                <td className="px-6 py-4 text-yellow-600 font-medium">{log.fats}</td>
                                <td className="px-6 py-4">{statusBadge}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default DailyLogTable;
