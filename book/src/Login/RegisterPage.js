// src/components/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';

// props로 login 페이지로 전환하는 함수를 받음
function RegisterPage({ onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지
        setError(''); // 이전 에러 메시지 초기화

        // 클라이언트 단에서 비밀번호 확인
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            // 백엔드의 회원가입 API 호출
            const response = await axios.post('http://localhost:5000/api/users/register', {
                username: username,
                password: password
            });

            alert(response.data.message); // "회원가입이 성공적으로 완료되었습니다."
            onSwitchToLogin(); // 성공 시 로그인 페이지로 전환

        } catch (err) {
            // 서버에서 보낸 에러 메시지 표시
            if (err.response && err.response.data) {
                setError(err.response.data.message);
            } else {
                setError('회원가입 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">회원가입</h1>
                </div>
                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label /* ... */ >아이디</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="block w-full text-lg rounded-lg border-transparent bg-gray-100 p-3" />
                    </div>
                    <div>
                        <label /* ... */ >비밀번호</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full text-lg rounded-lg border-transparent bg-gray-100 p-3" />
                    </div>
                    <div>
                        <label /* ... */ >비밀번호 확인</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="block w-full text-lg rounded-lg border-transparent bg-gray-100 p-3" />
                    </div>

                    {error && <p className="text-red-500 text-center">{error}</p>}

                    <button type="submit" className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">
                        가입하기
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600">
                    이미 계정이 있으신가요? <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">로그인</button>
                </p>
            </div>
        </main>
    );
}

export default RegisterPage;