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
            const response = await axios.post('/api/users/login', {
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
                    <a 
                    href="/api/auth/google" 
                    className="w-full py-3 px-4 flex justify-center items-center 
                    bg-white text-gray-800 font-bold rounded-md 
                    border border-blue-500 
                    hover:bg-gray-100 transition-colors"
                        > 
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.226-11.283-7.662l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C43.021 36.248 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
                    </svg>
                    구글 로그인 및 회원가입
                        </a>
                    
                   <a href="/api/auth/naver"
                         className="w-full py-3 px-4 flex justify-center items-center rounded-md bg-[#03C75A] ..."
                            >
                         <button className="w-full py-0 px-4 flex justify-center items-center bg-[#03C75A] text-white font-bold rounded-full hover:bg-[#02b350]">
                         <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="currentColor" d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"></path></svg>
                        네이버 로그인 및 회원가입 
                    </button>
                        </a>
                  
                </div>
                <p className="mt-8 text-center text-sm text-gray-600">
                    계정이 없으신가요? <button onClick={onSwitchToRegister} className="font-medium text-indigo-600 hover:text-indigo-500">회원가입</button>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
