import React from 'react';
import { Line } from 'react-chartjs-2';
import type { DailyLog } from '../../types';

interface EnergyChartProps {
    data: DailyLog[];
    target: number;
}

const EnergyChart: React.FC<EnergyChartProps> = ({ data, target }) => {
    const chartData = {
        labels: data.map(d => d.date.split('-').slice(1).reverse().join('/')), // simple formatting
        datasets: [
            {
                label: 'Consumo (kcal)',
                data: data.map(d => d.energy),
                borderColor: '#0d9488', // Teal-600
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: `Meta (${target})`,
                data: Array(data.length).fill(target),
                borderColor: '#ef4444', // Red-500
                borderDash: [5, 5],
                pointRadius: 0,
                borderWidth: 2,
                fill: false
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { color: '#f3f4f6' }
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

export default EnergyChart;
