import React from 'react';
import type { DailyLog } from '../../types';
import { Scale } from 'lucide-react';

interface DailyLogTableProps {
    data: DailyLog[];
    targetEnergy: number;
}

const DailyLogTable: React.FC<DailyLogTableProps> = ({ data, targetEnergy }) => {
    // Check if any log has weight data
    const hasWeightData = data.some(log => log.weight && log.weight > 0);

    // Calculate weight change between consecutive entries
    const getWeightChange = (index: number): { value: number; direction: 'up' | 'down' | 'same' } | null => {
        if (!hasWeightData) return null;
        const current = data[index]?.weight;
        if (!current || current === 0) return null;
        
        // Find previous entry with weight
        for (let i = index - 1; i >= 0; i--) {
            if (data[i]?.weight && data[i].weight! > 0) {
                const diff = current - data[i].weight!;
                return {
                    value: Math.abs(diff),
                    direction: diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'same'
                };
            }
        }
        return null;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">Data</th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">Energia</th>
                        <th className="hidden sm:table-cell px-4 sm:px-6 py-4 font-semibold text-gray-600">Carbs</th>
                        <th className="hidden sm:table-cell px-4 sm:px-6 py-4 font-semibold text-gray-600">Proteínas</th>
                        <th className="hidden sm:table-cell px-4 sm:px-6 py-4 font-semibold text-gray-600">Gorduras</th>
                        {hasWeightData && (
                            <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">Peso</th>
                        )}
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((log, index) => {
                        const diff = log.energy - targetEnergy;
                        const weightChange = getWeightChange(index);
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
                                <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {log.date.split('-').slice(1).reverse().join('/')}
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <span className="font-medium">{log.energy}</span>
                                    <span className="text-gray-400 text-xs ml-1 hidden sm:inline">kcal</span>
                                </td>
                                <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-orange-600 font-medium">{log.carbs}g</td>
                                <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-blue-600 font-medium">{log.protein}g</td>
                                <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-yellow-600 font-medium">{log.fats}g</td>
                                {hasWeightData && (
                                    <td className="px-4 sm:px-6 py-4">
                                        {log.weight && log.weight > 0 ? (
                                            <div className="flex items-center gap-1.5">
                                                <Scale size={14} className="text-purple-400" />
                                                <span className="font-medium text-purple-700">{log.weight.toFixed(1)}</span>
                                                <span className="text-gray-400 text-xs">kg</span>
                                                {weightChange && weightChange.direction !== 'same' && (
                                                    <span className={`text-xs font-medium ${
                                                        weightChange.direction === 'down' ? 'text-green-600' : 'text-red-500'
                                                    }`}>
                                                        {weightChange.direction === 'down' ? '↓' : '↑'}{weightChange.value.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                )}
                                <td className="px-4 sm:px-6 py-4">{statusBadge}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default DailyLogTable;
