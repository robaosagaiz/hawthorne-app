import React from 'react';
import { Doughnut } from 'react-chartjs-2';

interface DistributionChartProps {
    averages: {
        protein: number;
        carbs: number;
        fats: number;
    };
}

const DistributionChart: React.FC<DistributionChartProps> = ({ averages }) => {
    const data = {
        labels: ['Proteína', 'Carbo', 'Gordura'],
        datasets: [{
            data: [averages.protein, averages.carbs, averages.fats],
            backgroundColor: ['#3b82f6', '#f97316', '#eab308'],
            hoverOffset: 4,
            borderWidth: 0
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const }
        },
        cutout: '70%',
    };

    return <Doughnut data={data} options={options} />;
};

export default DistributionChart;
