// src/components/ReportPage.js

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import Card from './Card';

function ReportPage() {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['식비', '교통비', '쇼핑', '문화생활', '기타'],
                datasets: [{
                    label: '카테고리별 지출 (원)',
                    data: [350000, 120000, 250000, 80000, 50000],
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // 가로 막대 차트
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // 범례 숨기기
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, []);

    return (
        <main className="w-full max-w-7xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">월별 소비 분석 보고서</h2>
                <p className="mt-2 text-gray-600">2025년 9월, 소비 습관을 확인하고 개선해 보세요.</p>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">이번 달 총 지출 📅</h3>
                    <p className="text-4xl font-bold text-red-500">-₩850,000</p>
                </Card>
                <Card className="md:col-span-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">가장 많이 쓴 카테고리 🛍️</h3>
                    <p className="text-4xl font-bold text-indigo-600">식비</p>
                </Card>
                 <Card className="md:col-span-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">지난달 대비 소비 변화 📈</h3>
                    <p className="text-4xl font-bold text-green-500">-50,000원</p>
                    <p className="text-sm text-gray-500 mt-1">지난달보다 절약하고 있어요!</p>
                </Card>
            </section>
            
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">카테고리별 지출 현황</h3>
                <div className="h-96">
                    <canvas ref={chartRef}></canvas>
                </div>
            </Card>
        </main>
    );
}

export default ReportPage;