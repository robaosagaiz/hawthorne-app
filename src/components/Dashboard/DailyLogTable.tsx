import React from 'react';
import type { DailyLog } from '../../types';
import { Flame, Beef, Wheat, Droplets } from 'lucide-react';

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
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">Data</th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">
                            <span className="hidden sm:inline">Energia</span>
                            <span className="sm:hidden">kcal</span>
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">
                            <span className="hidden sm:inline">Proteínas</span>
                            <span className="sm:hidden">Prot</span>
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">
                            <span className="hidden sm:inline">Carboidratos</span>
                            <span className="sm:hidden">Carb</span>
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">
                            <span className="hidden sm:inline">Gorduras</span>
                            <span className="sm:hidden">Gord</span>
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-gray-600">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((log) => {
                        const diff = log.energy - targetEnergy;
                        let statusBadge;

                        if (diff > 100) {
                            statusBadge = <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-200">Excesso</span>;
                        } else if (diff < -200) {
                            statusBadge = <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-yellow-200">Déficit</span>;
                        } else {
                            statusBadge = <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">Na Meta</span>;
                        }

                        return (
                            <tr key={log.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {log.date.split('-').slice(1).reverse().join('/')}
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        <Flame size={14} className="text-orange-400 hidden sm:inline" />
                                        <span className="font-medium">{log.energy}</span>
                                        <span className="text-gray-400 text-xs ml-0.5 hidden sm:inline">kcal</span>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        <Beef size={14} className="text-red-400 hidden sm:inline" />
                                        <span className="font-medium text-red-600">{log.protein}g</span>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        <Wheat size={14} className="text-amber-400 hidden sm:inline" />
                                        <span className="font-medium text-amber-600">{log.carbs}g</span>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        <Droplets size={14} className="text-yellow-400 hidden sm:inline" />
                                        <span className="font-medium text-yellow-600">{log.fats}g</span>
                                    </div>
                                </td>
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
