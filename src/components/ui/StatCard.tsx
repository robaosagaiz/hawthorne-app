import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    unit: string;
    subtext?: string;
    color: 'teal' | 'blue' | 'orange' | 'purple';
    trend?: string;
}

const colorStyles = {
    teal: 'border-teal-500 text-teal-600 bg-teal-50',
    blue: 'border-blue-500 text-blue-600 bg-blue-50',
    orange: 'border-orange-500 text-orange-600 bg-orange-50',
    purple: 'border-purple-500 text-purple-600 bg-purple-50',
};

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, subtext, color, trend }) => {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow ${colorStyles[color].split(' ')[0]}`}>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
            <div className="flex items-end gap-2 mt-2">
                <h2 className="text-3xl font-bold text-gray-800">{value}</h2>
                <span className="text-sm text-gray-400 mb-1 font-medium">{unit}</span>
            </div>
            {trend && (
                <div className={`mt-3 text-xs font-medium inline-block px-2 py-1 rounded ${colorStyles[color].split(' ').slice(1).join(' ')}`}>
                    {trend}
                </div>
            )}
            {subtext && (
                <p className="text-xs text-gray-400 mt-3">{subtext}</p>
            )}
        </div>
    );
};

export default StatCard;
