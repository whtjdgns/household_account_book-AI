// src/components/Dashboard.js

import React, { useState, useCallback } from 'react';
import Card from './Card';
import ExpenseChart from './Chart';
import axios from 'axios';

function Dashboard({ isDarkMode, transactions }) {

    const [savingTips, setSavingTips] = useState([]);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [loadingTip, setLoadingTip] = useState(false);

    const fetchSavingTip = useCallback(async () => {
        if (!transactions || transactions.length === 0) {
            setSavingTips(['지출 내역이 없어 분석할 데이터가 없습니다.']);
            return;
        }

        setLoadingTip(true);
        setSavingTips([]);
        setCurrentTipIndex(0);

        try {
            // 백엔드 API에 절약 팁 생성을 요청합니다.
            const response = await axios.post('http://localhost:5000/api/gemini/generate-tips', {
                transactions: transactions
            });

            if (response.data && response.data.tips && response.data.tips.length > 0) {
                setSavingTips(response.data.tips);
            } else {
                setSavingTips(['AI가 팁을 생성하지 못했습니다.']);
            }

        } catch (error) {
            console.error("절약 팁 로딩 실패:", error);
            setSavingTips(['AI 팁을 불러오는 중 서버에서 오류가 발생했습니다.']);
        } finally {
            setLoadingTip(false);
        }
    }, [transactions]);

    const showNextTip = () => {
        setCurrentTipIndex(prevIndex => (prevIndex + 1) % savingTips.length);
    };

    // 1. 월별 수입 및 지출 계산
    const monthlyIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const monthlyExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // 2. 수입 대비 지출 비율 계산
    const expensePercentage = monthlyIncome > 0 ? Math.round((monthlyExpense / monthlyIncome) * 100) : 0;

    // 3. 차트 데이터 가공
    const expenses = transactions.filter(t => t.type === 'expense');
    const spendingByCategory = expenses.reduce((acc, transaction) => {
        const { category, amount } = transaction;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += parseFloat(amount);
        return acc;
    }, {});

    const sortedSpending = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a);

    const chartData = {
        labels: sortedSpending.map(([category]) => category),
        datasets: [{
            label: '지출',
            data: sortedSpending.map(([, amount]) => amount),
            backgroundColor: [
                'rgba(75, 192, 192, 0.8)', 
                'rgba(255, 159, 64, 0.8)',
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(153, 102, 255, 0.8)',
            ],
            borderWidth: 1
        }]
    };

    return (
        <main className="w-full max-w-7xl mx-auto">
            
            
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <p className="text-sm text-gray-500 mb-2">현재 잔액</p>
                    <h3 className="text-3xl font-bold text-gray-800">{new Intl.NumberFormat('ko-KR').format(monthlyIncome - monthlyExpense)}원</h3>
                </Card>
                <Card>
                    <p className="text-sm text-gray-500 mb-2">이번 달 수입</p>
                    <h3 className="text-3xl font-bold text-green-500">+{new Intl.NumberFormat('ko-KR').format(monthlyIncome)}원</h3>
                </Card>
                <Card>
                    <p className="text-sm text-gray-500 mb-2">이번 달 지출</p>
                    <h3 className="text-3xl font-bold text-red-500">-{new Intl.NumberFormat('ko-KR').format(monthlyExpense)}원</h3>
                </Card>
                <Card>
                    <p className="text-sm text-gray-500 mb-2">수입 대비 지출</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-indigo-600 h-3 rounded-full" style={{width: `${expensePercentage}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">수입의 {expensePercentage}%를 사용했어요.</p>
                </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">AI 소비 패턴 분석</h3>
                    <ExpenseChart isDarkMode={isDarkMode} data={chartData} /> 
                </Card>

                <div className="lg:col-span-1 flex flex-col space-y-6">
                    <Card>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">AI 추천 절약 팁</h3>
                        <div className="bg-indigo-50 p-4 rounded-lg min-h-[120px]">
                            {loadingTip ? (
                                <p className="text-sm text-gray-600">AI가 당신의 소비 패턴을 분석 중입니다...</p>
                            ) : savingTips.length > 0 ? (
                                <p className="text-gray-800 font-medium">💡 {savingTips[currentTipIndex]}</p>
                            ) : (
                                <>
                                    <p className="text-gray-800 font-medium mb-1">💡 지출 내역을 기록하고 맞춤 절약 팁을 받아보세요!</p>
                                    <p className="text-sm text-gray-600">AI가 당신의 소비 패턴을 분석하여 효과적인 절약 방법을 제안해 드립니다.</p>
                                </>
                            )}
                        </div>
                        <div className="flex space-x-2 mt-4">
                            <button onClick={fetchSavingTip} disabled={loadingTip} className="w-full btn bg-indigo-500 text-white hover:bg-indigo-600 p-2 rounded-md flex items-center justify-center">
                                <span className="mr-2">✨ {savingTips.length > 0 ? '새로운 팁 생성' : 'AI 절약 팁 생성'}</span>
                                {loadingTip && <div className="spinner"></div>}
                            </button>
                            {savingTips.length > 1 && (
                                <button onClick={showNextTip} disabled={loadingTip} className="w-full btn bg-gray-500 text-white hover:bg-gray-600 p-2 rounded-md flex items-center justify-center">
                                    다른 팁 보기
                                </button>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">최근 거래 내역</h3>
                        <ul className="space-y-3 text-sm">
                            {transactions.length > 0 ? (
                                transactions.slice(0, 3).map(t => (
                                    <li key={t.id} className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-700">{t.description}</p>
                                            <p className="text-gray-500">{new Date(t.transaction_date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={t.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                                            {t.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('ko-KR').format(t.amount)}원
                                        </span>
                                    </li>
                                )) 
                            ) : (
                                <p className="text-gray-500">최근 거래 내역이 없습니다.</p>
                            )}
                        </ul>
                    </Card>
                </div>
            </section>

            <footer className="text-center p-4 text-gray-500 text-sm mt-8">
                © 2025 Fin Log. All Rights Reserved.
            </footer>
        </main>
    );
}

export default Dashboard;
