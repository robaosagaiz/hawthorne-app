import React from 'react';
import { Line } from 'react-chartjs-2';
import type { DailyLog } from '../../types';

interface WeightChartProps {
    data: DailyLog[];
    initialWeight?: number;
    targetWeight?: number;
}

const WeightChart: React.FC<WeightChartProps> = ({ data, initialWeight, targetWeight }) => {
    // Filter only entries with weight data
    const weightEntries = data.filter(d => d.weight && d.weight > 0);
    
    if (weightEntries.length < 2) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <div className="text-center">
                    <p className="font-medium">Dados insuficientes</p>
                    <p className="text-xs mt-1">Mínimo de 2 registros de peso necessários</p>
                </div>
            </div>
        );
    }

    const weights = weightEntries.map(d => d.weight!);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight;
    const totalChange = weights[weights.length - 1] - weights[0];

    const datasets: any[] = [
        {
            label: 'Peso (kg)',
            data: weights,
            borderColor: '#8b5cf6', // Purple-500
            backgroundColor: totalChange <= 0 
                ? 'rgba(34, 197, 94, 0.08)' // Green tint if losing
                : 'rgba(239, 68, 68, 0.08)', // Red tint if gaining
            fill: true,
            tension: 0.35,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 2.5
        }
    ];

    // Add initial weight reference line
    if (initialWeight && initialWeight > 0) {
        datasets.push({
            label: `Peso Inicial (${initialWeight} kg)`,
            data: Array(weightEntries.length).fill(initialWeight),
            borderColor: '#94a3b8', // Gray-400
            borderDash: [8, 4],
            pointRadius: 0,
            borderWidth: 1.5,
            fill: false
        });
    }

    // Add target weight reference line
    if (targetWeight && targetWeight > 0) {
        datasets.push({
            label: `Meta (${targetWeight} kg)`,
            data: Array(weightEntries.length).fill(targetWeight),
            borderColor: '#22c55e', // Green-500
            borderDash: [5, 5],
            pointRadius: 0,
            borderWidth: 2,
            fill: false
        });
    }

    const chartData = {
        labels: weightEntries.map(d => d.date.split('-').slice(1).reverse().join('/')),
        datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'top' as const,
                labels: { 
                    usePointStyle: true,
                    padding: 16,
                    font: { size: 11 }
                }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: (context: any) => {
                        const value = context.parsed.y;
                        return `${context.dataset.label}: ${value.toFixed(1)} kg`;
                    },
                    afterBody: (items: any[]) => {
                        if (items.length > 0 && items[0].dataIndex > 0) {
                            const currentIdx = items[0].dataIndex;
                            const current = weights[currentIdx];
                            const previous = weights[currentIdx - 1];
                            const diff = current - previous;
                            const totalDiff = current - weights[0];
                            return [
                                `Variação: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} kg`,
                                `Total: ${totalDiff >= 0 ? '+' : ''}${totalDiff.toFixed(1)} kg`
                            ];
                        }
                        return [];
                    }
                }
            }
        },
        scales: {
            y: {
                min: Math.floor(minWeight - Math.max(weightRange * 0.2, 1)),
                max: Math.ceil(maxWeight + Math.max(weightRange * 0.2, 1)),
                grid: { color: '#f3f4f6' },
                ticks: {
                    callback: (value: any) => `${value} kg`
                }
            },
            x: {
                grid: { display: false }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    return <Line data={chartData} options={options} />;
};

export default WeightChart;
