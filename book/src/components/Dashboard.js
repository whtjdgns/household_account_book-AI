// src/components/Dashboard.js

import React from 'react';
import Card from './Card';
import ExpenseChart from './Chart'; // Mac에서는 Chart.js, Windows에서는 chart.js로 파일명이 다를 수 있으니 확인해주세요.

function Dashboard({ isDarkMode, transactions  }) {

  const monthlyIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const monthlyExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);


  return (
    <main className="w-full max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">환영합니다, 사용자님!</h2>
      
      {/* --- 상단 요약 카드 섹션 --- */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <p className="text-sm text-gray-500 mb-2">현재 잔액</p>
          <h3 className="text-3xl font-bold text-gray-800">+{new Intl.NumberFormat('ko-KR').format(monthlyIncome)}원</h3>
        </Card>
        <Card>
            <p className="text-sm text-gray-500 mb-2">이번 달 수입</p>
            <h3 className="text-3xl font-bold text-green-500">+{new Intl.NumberFormat('ko-KR').format(monthlyIncome)}원</h3>
        </Card>
        <Card>
            <p className="text-sm text-gray-500 mb-2">이번 달 지출</p>
            <h3 className="text-3xl font-bold text-red-500">-{new Intl.NumberFormat('ko-KR').format(monthlyExpense)}원</h3>
        </Card>
      
        {/* 👇 [추가] 예산 대비 카드 */}
        <Card>
          <p className="text-sm text-gray-500 mb-2">예산 대비</p>
          <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-indigo-600 h-3 rounded-full" style={{width: "75%"}}></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">75% 사용됨</p>
        </Card>
      </section>

      {/* --- 차트 및 우측 정보 섹션 --- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI 소비 패턴 분석 차트 */}
        <Card className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-800 mb-4">AI 소비 패턴 분석</h3>
          <ExpenseChart isDarkMode={isDarkMode} /> 
        </Card>

        {/* 우측 컬럼 */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          
          {/* 👇 [추가] AI 추천 절약 팁 카드 */}
          <Card>
            <h3 className="text-xl font-bold text-gray-800 mb-4">AI 추천 절약 팁</h3>
            <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-gray-800 font-medium mb-1">💡 외식비가 평균보다 높아요.</p>
                <p className="text-sm text-gray-600">이번 달은 외식을 줄이고 집에서 요리해보는 건 어떨까요? 절약 목표 달성에 도움이 될 거예요.</p>
            </div>
          </Card>

          {/* 👇 [추가] 최근 거래 내역 카드 */}
          <Card>
            <h3 className="text-xl font-bold text-gray-800 mb-4">최근 거래 내역</h3>
            {/* <ul className="space-y-3 text-sm"> */}

            <ul>
                    {/* transactions 배열을 map으로 돌면서 리스트를 동적으로 생성 */}
                    {transactions.slice(0, 3).map(t => (
                        <li key={t.id} className="flex justify-between">
                            <span>{new Date(t.transaction_date).toLocaleDateString()} / {t.category}</span>
                            <span className={t.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                                {t.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('ko-KR').format(t.amount)}원
                            </span>
                        </li>
                    ))}
                </ul>
          </Card>

        </div>
      </section>
    </main>
  );
}

export default Dashboard;