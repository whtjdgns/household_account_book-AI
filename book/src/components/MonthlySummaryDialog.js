
import React from 'react';

function MonthlySummaryDialog({ isOpen, onClose, monthlyIncome, monthlyExpense }) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">월별 수입 및 지출 요약</h1>
                    <p className="mt-2 text-gray-600">이번 달의 재정 상황을 한눈에 파악하세요.</p>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                        <span className="text-lg font-medium text-blue-800">총 수입</span>
                        <span className="text-xl font-bold text-blue-600">{monthlyIncome.toLocaleString()} 원</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                        <span className="text-lg font-medium text-red-800">총 지출</span>
                        <span className="text-xl font-bold text-red-600">{monthlyExpense.toLocaleString()} 원</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                        <span className="text-lg font-medium text-gray-800">합계</span>
                        <span className="text-xl font-bold text-gray-900">{(monthlyIncome - monthlyExpense).toLocaleString()} 원</span>
                    </div>
                </div>

                <div className="text-center pt-4">
                    <button 
                        onClick={onClose} 
                        className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MonthlySummaryDialog;
