// src/components/SettingsPage.js

import React from 'react';
import Card from './Card';

function SettingsPage() {
    return (
        <main className="w-full max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">설정</h2>
                <p className="mt-2 text-gray-600">가계부를 사용자에 맞게 설정하세요.</p>
            </div>

            {/* 예산 관리 카드 */}
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">예산 관리</h3>
                <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">한 달 예산 설정</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <input type="number" id="budget" className="block w-full rounded-md border-gray-300 pl-4 pr-12 focus:border-indigo-500 focus:ring-indigo-500" placeholder="1000000" />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">원</span>
                        </div>
                    </div>
                    <button className="mt-3 w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        예산 저장
                    </button>
                </div>
            </Card>

            {/* 카테고리 관리 카드 */}
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">카테고리 관리</h3>
                <div className="space-y-2">
                    {['식비', '교통비', '쇼핑', '문화생활', '월급'].map(category => (
                        <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            <span className="text-gray-800">{category}</span>
                            <button className="text-red-500 hover:text-red-700 text-sm">삭제</button>
                        </div>
                    ))}
                </div>
                 <div className="mt-4 flex space-x-2">
                    <input type="text" className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="새 카테고리 추가" />
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                        추가
                    </button>
                </div>
            </Card>

             {/* 알림 설정 카드 */}
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">알림 설정</h3>
                <div className="flex items-center justify-between">
                    <span className="text-gray-800">예산 초과 임박 시 알림 받기</span>
                    <label htmlFor="notification-toggle" className="inline-flex relative items-center cursor-pointer">
                        <input type="checkbox" value="" id="notification-toggle" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </Card>
            <footer className="text-center p-4 text-gray-500 text-sm mt-8">
                © 2025 AI 머니플래너. All Rights Reserved.
            </footer>
        </main>
    );
}

export default SettingsPage;