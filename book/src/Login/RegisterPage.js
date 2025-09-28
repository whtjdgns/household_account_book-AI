// src/components/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage({ onSwitchToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationEmail, setVerificationEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    
    // UI 상태 관리를 위한 state
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 인증번호 발송 API 호출 함수
    const handleSendCode = async () => {
        if (!verificationEmail) {
            return setError('인증받을 이메일을 입력해주세요.');
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:5000/api/email/send-verification', {
                email: verificationEmail,
            });
            alert(response.data.message);
            setIsCodeSent(true);
        } catch (err) {
            setError(err.response?.data?.message || '인증번호 전송에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 인증번호 확인 API 호출 함수
    const handleVerifyCode = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:5000/api/email/verify-code', {
                email: verificationEmail,
                code: verificationCode,
            });
            alert(response.data.message);
            setIsVerified(true); // 인증 성공
        } catch (err) {
            setError(err.response?.data?.message || '인증에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 최종 회원가입 함수
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            return setError('비밀번호가 일치하지 않습니다.');
        }
        if (!isVerified) {
            return setError('이메일 인증을 완료해주세요.');
        }
        try {
            const response = await axios.post('http://localhost:5000/api/users/register', {
                name: name,
                username: email,
                password: password,
            });
            alert(response.data.message);
            onSwitchToLogin();
        } catch (err) {
            setError(err.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">회원가입</h1>
                    <p className="mt-2 text-gray-600">서비스 이용을 위해 계정을 생성해 주세요.</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* --- 기본 정보 입력 --- */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">이름</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">아이디 (이메일)</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">비밀번호 재확인</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                    </div>
                    
                    <div className="border-t pt-4 space-y-4">
                        {/* --- 이메일 인증 --- */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">이메일 인증</label>
                            <div className="mt-1 flex space-x-2">
                                <input type="email" value={verificationEmail} onChange={(e) => setVerificationEmail(e.target.value)} placeholder="인증용 이메일 주소" disabled={isCodeSent} className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md disabled:bg-gray-200" />
                                <button type="button" onClick={handleSendCode} disabled={isCodeSent || isLoading} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300 whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed">
                                    {isLoading ? '전송중...' : '인증번호 전송'}
                                </button>
                            </div>
                        </div>

                        {/* --- 인증번호 입력 (조건부 렌더링) --- */}
                        {isCodeSent && !isVerified && (
                            <div className="flex space-x-2">
                                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="인증번호 6자리" className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                                <button type="button" onClick={handleVerifyCode} disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 whitespace-nowrap disabled:bg-indigo-400">
                                    {isLoading ? '확인중...' : '인증 확인'}
                                </button>
                            </div>
                        )}
                        {isVerified && <p className="text-green-600 text-sm text-center">✅ 이메일 인증이 완료되었습니다.</p>}
                    </div>

                    {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                    
                    <button type="submit" disabled={!isVerified || !name || !email || !password} className="w-full py-3 px-4 text-white font-bold rounded-md transition-colors bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        회원가입
                    </button>
                </form>
                 <p className="mt-8 text-center text-sm text-gray-600">
                    이미 계정이 있으신가요? <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">로그인</button>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;