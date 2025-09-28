// src/components/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';

function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // 백엔드의 로그인 API 호출
            const response = await axios.post('http://localhost:5000/api/users/login', {
                username: email, // 아이디를 이메일로 사용
                password
            });
            localStorage.setItem('authToken', response.data.token);
            onLoginSuccess();
        } catch (err) {
            setError(err.response?.data?.message || '로그인 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">로그인</h1>
                    <p className="mt-2 text-gray-600">스마트 가계부 서비스를 이용해 보세요.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">이메일 주소</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700">
                        로그인
                    </button>
                </form>
                <div className="my-6 flex items-center justify-center">
                    <div className="border-t border-gray-300 flex-grow"></div>
                    <span className="px-4 text-gray-500 text-sm">또는</span>
                    <div className="border-t border-gray-300 flex-grow"></div>
                </div>
                <div className="space-y-4">
                    <button className="w-full py-3 px-4 flex justify-center items-center bg-[#EA4335] text-white font-bold rounded-md hover:bg-[#d93025]">
                        <svg className="w-5 h-5 mr-2" /* ... Google Icon SVG */ > ... </svg>
                        구글로 로그인
                    </button>
                    <button className="w-full py-3 px-4 flex justify-center items-center bg-[#03C75A] text-white font-bold rounded-md hover:bg-[#02b350]">
                         <svg className="w-5 h-5 mr-2" /* ... Naver Icon SVG */ > ... </svg>
                        네이버로 로그인
                    </button>
                </div>
                <p className="mt-8 text-center text-sm text-gray-600">
                    계정이 없으신가요? <button onClick={onSwitchToRegister} className="font-medium text-indigo-600 hover:text-indigo-500">회원가입</button>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;