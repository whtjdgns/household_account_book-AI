import React from 'react';

function MonthlyListDialog({ isOpen, onClose, monthlyExpenses, onMonthSelect }) {
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
                    <h1 className="text-3xl font-bold text-gray-800">월별 요약</h1>
                    <p className="mt-2 text-gray-600">확인하고 싶은 월을 선택하세요.</p>
                </div>
                
                <div className="space-y-4 max-h-60 overflow-y-auto">
                    {monthlyExpenses.length > 0 ? (
                        monthlyExpenses.map(item => (
                            <div 
                                key={`${item.year}-${item.month}`}
                                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                                onClick={() => onMonthSelect(item)}
                            >
                                <div>
                                    <span className="text-lg font-medium text-gray-800">{item.year}년 {item.month}월</span>
                                    <div className="text-sm text-gray-500">
                                        <span>수입: {item.totalIncome.toLocaleString()}원</span>
                                        <span className="ml-4">지출: {item.totalExpense.toLocaleString()}원</span>
                                    </div>
                                </div>
                                <span className="text-xl font-bold text-gray-800">{(item.totalIncome - item.totalExpense).toLocaleString()} 원</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">표시할 내역이 없습니다.</p>
                    )}
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

export default MonthlyListDialog;