// src/components/MyPage.js
import React from 'react';
import Card from './Card'; // 기존에 만든 Card 컴포넌트 재사용

function MyPage({ user }) {
    if (!user) {
        return <div>로딩 중...</div>;
    }

    return (
        <main className="w-full max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">마이페이지</h2>
                <p className="mt-2 text-gray-600">{user.name}님의 정보를 관리하세요.</p>
            </div>

            {/* 내 정보 카드 */}
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">내 정보</h3>
                <div className="space-y-3">
                    <div className="flex">
                        <p className="w-24 font-semibold text-gray-600">이름</p>
                        <p className="text-gray-800">{user.name}</p>
                    </div>
                    <div className="flex">
                        <p className="w-24 font-semibold text-gray-600">아이디</p>
                        <p className="text-gray-800">{user.username}</p>
                    </div>
                </div>
            </Card>

            {/* 비밀번호 변경 카드 */}
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">비밀번호 변경</h3>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
                        <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                        <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
                        <input type="password" required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                    </div>
                    <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        비밀번호 변경
                    </button>
                </form>
            </Card>
        </main>
    );
}

export default MyPage;