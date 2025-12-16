import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { DailyLog } from '../../types';

interface MacroChartProps {
    data: DailyLog[];
}

const MacroChart: React.FC<MacroChartProps> = ({ data }) => {
    const chartData = {
        labels: data.map(d => d.date.split('-').slice(1).reverse().join('/')),
        datasets: [
            { label: 'Proteína (g)', data: data.map(d => d.protein), backgroundColor: '#3b82f6', borderRadius: 4 }, // Blue
            { label: 'Carbo (g)', data: data.map(d => d.carbs), backgroundColor: '#f97316', borderRadius: 4 }, // Orange
            { label: 'Gordura (g)', data: data.map(d => d.fats), backgroundColor: '#eab308', borderRadius: 4 }  // Yellow
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                grid: { display: false }
            },
            y: {
                stacked: true,
                grid: { color: '#f3f4f6' }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    footer: (tooltipItems: any) => {
                        let total = 0;
                        tooltipItems.forEach((item: any) => {
                            total += item.raw;
                        });
                        return 'Total: ' + total + 'g';
                    }
                }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};

export default MacroChart;
