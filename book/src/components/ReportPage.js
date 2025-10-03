import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

// 다이얼로그를 위한 별도의 컴포넌트
const ComparisonDialog = ({ isOpen, onClose, category, userAmount, isDarkMode }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (isOpen && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [category],
                    datasets: [
                        {
                            label: '나의 지출',
                            data: [userAmount],
                            backgroundColor: 'rgba(79, 70, 229, 0.8)',
                            borderColor: 'rgba(79, 70, 229, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: isDarkMode ? '#e5e7eb' : '#4b5563' }
                        },
                        x: {
                            ticks: { color: isDarkMode ? '#e5e7eb' : '#4b5563' }
                        }
                    },
                    plugins: {
                        legend: { display: false }, // Hide legend as there's only one dataset
                        tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${item.raw.toLocaleString()}원` } }
                    }
                }
            });
        }
    }, [isOpen, category, userAmount, isDarkMode]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">{category} 지출 상세</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="h-64">
                        <canvas ref={chartRef}></canvas>
                    </div>
                    <div className="p-4 rounded-lg text-center bg-gray-50 text-gray-700">
                        <p className="font-medium">
                            이 카테고리에서 총 <span className="font-bold">${userAmount.toLocaleString()}원</span>을 사용했습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};


function ReportPage({ transactions = [], monthlyIncome = 0, monthlyExpense = 0, isDarkMode = false }) {
    const barChartRef = useRef(null);
    const barChartInstance = useRef(null);
    const [comparisonData, setComparisonData] = useState(null);

    useEffect(() => {
        if (barChartInstance.current) {
            barChartInstance.current.destroy();
        }
        const ctx = barChartRef.current.getContext('2d');
        barChartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['월간'],
                datasets: [
                    {
                        label: '총 수입',
                        data: [monthlyIncome],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '총 지출',
                        data: [monthlyExpense],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: isDarkMode ? '#e5e7eb' : '#4b5563' }
                    },
                    x: {
                         ticks: { color: isDarkMode ? '#e5e7eb' : '#4b5563' }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: isDarkMode ? '#e5e7eb' : '#4b5563' } },
                    tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${item.raw.toLocaleString()}원` } }
                }
            }
        });

        return () => {
            if (barChartInstance.current) {
                barChartInstance.current.destroy();
            }
        };
    }, [monthlyIncome, monthlyExpense, isDarkMode]);

    const expenseCategories = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((acc, tx) => {
            acc[tx.category] = (acc[tx.category] || 0) + Number(tx.amount);
            return acc;
        }, {});

    const sortedCategories = Object.entries(expenseCategories).sort(([, a], [, b]) => b - a);

    return (
        <>
            <main className="w-full max-w-7xl mx-auto space-y-6 p-4">
                <div>
                    <h2 className="text-3xl font-bold">월간 금융 보고서</h2>
                    <p className="mt-2 text-gray-600">이번 달의 소비 습관을 확인하고 개선해 보세요.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-xl font-bold mb-4">수입 vs 지출 비교</h3>
                        <div className="h-96">
                            <canvas ref={barChartRef}></canvas>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-xl font-bold mb-4">카테고리별 상세 지출</h3>
                        <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
                            {sortedCategories.length > 0 ? sortedCategories.map(([category, amount]) => {
                                const percentage = monthlyExpense > 0 ? (amount / monthlyExpense * 100).toFixed(1) : 0;
                                return (
                                    <div 
                                        key={category} 
                                        className="flex justify-between items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100"
                                        onClick={() => setComparisonData({ category, amount })}
                                    >
                                        <span className="font-semibold">{category}</span>
                                        <div>
                                            <span className="font-bold">{amount.toLocaleString()}원</span>
                                            <span className="text-gray-500 text-xs ml-2">({percentage}%)</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-center text-gray-500 py-10">지출 내역이 없습니다.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <ComparisonDialog
                isOpen={!!comparisonData}
                onClose={() => setComparisonData(null)}
                category={comparisonData?.category}
                userAmount={comparisonData?.amount}
                isDarkMode={isDarkMode}
            />

            <footer className="text-center p-4 text-gray-500 text-sm mt-8">
                <p>© 2025 AI 머니플래너. All Rights Reserved.</p>
            </footer>
        </>
    );
}

export default ReportPage;

