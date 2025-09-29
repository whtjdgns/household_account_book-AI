// src/components/TransactionModal.js
import React, { useState } from 'react';

function TransactionModal({ isOpen, onClose }) {
    const [transactionType, setTransactionType] = useState('expense');

    // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
    if (!isOpen) return null;

    return (
        // 1. 모달 배경 (Overlay)
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose} // 배경 클릭 시 모달 닫기
        >
            {/* 2. 모달 컨텐츠 */}
            <div 
                className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 space-y-6 relative"
                onClick={(e) => e.stopPropagation()} // 컨텐츠 클릭 시 닫히는 것 방지
            >
                {/* 닫기 버튼 */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">
                    &times;
                </button>
                
                {/* 기존 TransactionPage의 내용 (제목, 토글, 폼) */}
                
                <div className="w-full max-w-lg bg-white  rounded-2xl shadow-xl p-8 space-y-6">
                
                {/* 제목 */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">거래 기록하기</h1>
                    <p className="mt-2 text-gray-900 ">AI가 당신의 기록을 스마트하게 분류해 드려요.</p>
                </div>
        
                {/* 지출/수입 토글 버튼 */}
                <div className="flex rounded-full bg-gray-100 dark:bg-gray-200 p-1">
                    <button 
                        onClick={() => setTransactionType('expense')} 
                        className={`flex-1 py-2 px-4 rounded-full font-bold transition-colors duration-300 ${transactionType === 'expense' ? 'bg-white dark:bg-gray-600 shadow-md text-gray-600 dark:text-white' : 'text-gray-500'}`}
                    >
                        지출
                    </button>
                    <button 
                        onClick={() => setTransactionType('income')} 
                        className={`flex-1 py-2 px-4 rounded-full font-bold transition-colors duration-300 ${transactionType === 'income' ? 'bg-white dark:bg-gray-600 shadow-md text-gray-600 dark:text-white' : 'text-gray-500'}`}
                    >
                        수입
                    </button>
                </div>
        
                {/* 입력 폼 */}
                <form className="space-y-6">
                    {/* 금액 입력 */}
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-900 dark:text-gray-900 mb-1">금액</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                id="amount" 
                                className="block w-full text-lg rounded-lg border-transparent bg-gray-200 dark:bg-gray-200 p-3 pr-10 focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="0"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-900">원</span>
                        </div>
                    </div>
        
                    {/* 내용 입력 */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-gray-900 mb-1">내용</label>
                        <input 
                            type="text" 
                            id="description" 
                            className="block w-full text-lg rounded-lg border-transparent bg-gray-200 dark:bg-gray-200 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="예: 스타벅스 커피"
                        />
                    </div>
        
                    {/* 카테고리 선택 */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-300 dark:text-gray-900 mb-1">카테고리</label>
                        <select 
                            id="category" 
                            className="block w-full text-lg rounded-lg border-transparent bg-gray-100 dark:bg-gray-200 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option>카테고리 선택</option>
                            <option value="식비">식비</option>
                            <option value="교통비">교통비</option>
                            <option value="쇼핑">쇼핑</option>
                            <option value="문화생활">문화생활</option>
                            <option value="기타">기타</option>
                        </select>
                    </div>
                    
                    {/* 기록하기 버튼 */}
                    <button 
                        type="submit" 
                        className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                    >
                        기록하기
                    </button>
                </form>
            </div>
                
            </div>
        </div>
    );
}

export default TransactionModal;