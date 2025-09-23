// src/components/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';

// props로 로그인 성공 함수와 회원가입 페이지 전환 함수를 받음
function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // 백엔드의 로그인 API 호출 (이 API는 다음 단계에서 만들어야 합니다!)
            const response = await axios.post('http://localhost:5000/api/users/login', {
                username,
                password
            });
            
            // 로그인 성공 시, 서버로부터 받은 토큰을 저장
            localStorage.setItem('authToken', response.data.token);
            onLoginSuccess(); // App.js에 로그인 성공을 알림

        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.message);
            } else {
                setError('로그인 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">로그인</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label /* ... */ >아이디</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="block w-full text-lg rounded-lg border-transparent bg-gray-100 p-3" />
                    </div>
                    <div>
                        <label /* ... */ >비밀번호</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full text-lg rounded-lg border-transparent bg-gray-100 p-3" />
                    </div>

                    {error && <p className="text-red-500 text-center">{error}</p>}

                    <button type="submit" className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">
                        로그인
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600">
                    계정이 없으신가요? <button onClick={onSwitchToRegister} className="font-medium text-indigo-600 hover:text-indigo-500">회원가입</button>
                </p>
            </div>
        </main>
    );
}

export default LoginPage;