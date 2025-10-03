// src/components/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage({ onSwitchToLogin }) {
    // --- State 변수 정의 ---
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationEmail, setVerificationEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    
    // UI 및 상태 관리를 위한 state
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // 새로운 약관 동의 state
    const [agreedToServiceTerms, setAgreedToServiceTerms] = useState(false);
    const [agreedToPrivacyPolicy, setAgreedToPrivacyPolicy] = useState(false);

    // --- 유효성 검사 ---
    // 모든 필수 필드와 동의가 완료되었는지 확인
    const isFormValid = name && email && password && confirmPassword && isVerified && agreedToServiceTerms && agreedToPrivacyPolicy;

    // --- API 호출 함수들 ---
    const handleSendCode = async () => { /* ... 이전 코드와 동일 ... */ };
    const handleVerifyCode = async () => { /* ... 이전 코드와 동일 ... */ };
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (!isFormValid) {
            return setError('모든 필수 항목을 입력하고 약관에 동의해주세요.');
        }
        if (password !== confirmPassword) {
            return setError('비밀번호가 일치하지 않습니다.');
        }
        // ... (이하 회원가입 API 호출 로직은 이전과 동일)
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
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
                    
                    {/* --- 이메일 인증 --- */}
                    <div className="border-t pt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">이메일 인증</label>
                            <div className="mt-1 flex space-x-2">
                                <input type="email" value={verificationEmail} onChange={(e) => setVerificationEmail(e.target.value)} placeholder="인증용 이메일 주소" disabled={isCodeSent} className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md disabled:bg-gray-200" />
                                <button type="button" onClick={handleSendCode} disabled={isCodeSent || isLoading} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300 whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed">
                                    {isLoading ? '전송중...' : '인증번호 전송'}
                                </button>
                            </div>
                        </div>

                        {isCodeSent && !isVerified && (
                            <div className="flex space-x-2">
                                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="인증번호 6자리" className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                                <button type="button" onClick={handleVerifyCode} disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 whitespace-nowrap disabled:bg-indigo-400">
                                    {isLoading ? '확인중...' : '인증 확인'}
                                </button>
                                <button type="button" onClick={() => setIsCodeSent(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300 whitespace-nowrap">
                                    재전송
                                </button>
                            </div>
                        )}
                         {isVerified && <p className="text-green-600 text-sm text-center">✅ 이메일 인증이 완료되었습니다.</p>}
                    </div>
                    
                    {/* --- 약관 동의 섹션 (새로운 UI) --- */}
                    <div className="pt-2 space-y-2">
                        <div className="flex items-center">
                            <input id="terms-service" type="checkbox" checked={agreedToServiceTerms} onChange={(e) => setAgreedToServiceTerms(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="terms-service" className="ml-2 block text-sm text-gray-900">[필수] 이용약관에 동의합니다.</label>
                        </div>
                        <div className="flex items-center">
                            <input id="terms-privacy" type="checkbox" checked={agreedToPrivacyPolicy} onChange={(e) => setAgreedToPrivacyPolicy(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="terms-privacy" className="ml-2 block text-sm text-gray-900">[필수] 개인정보 수집 및 이용에 동의합니다.</label>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={!isFormValid}
                        className={`w-full py-3 px-4 text-white font-bold rounded-md transition-colors ${isFormValid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                        회원가입
                    </button>
                </form>
                
                {/* --- 소셜 로그인 섹션 (새로운 UI) --- */}
                <div className="my-6 flex items-center justify-center">
                    <div className="border-t border-gray-300 flex-grow"></div>
                    <span className="px-4 text-gray-500 text-sm">또는</span>
                    <div className="border-t border-gray-300 flex-grow"></div>
                </div>

                <div className="space-y-4">
                    <button className="w-full py-3 px-4 flex justify-center items-center bg-[#EA4335] text-white font-bold rounded-md hover:bg-[#d93025]">
                        <svg className="w-5 h-5 mr-3" /* ... Google Icon ... */ >...</svg>
                        구글로 회원가입
                    </button>
                    <button className="w-full py-3 px-4 flex justify-center items-center bg-[#03C75A] text-white font-bold rounded-md hover:bg-[#02b350]">
                         <svg className="w-5 h-5 mr-3" /* ... Naver Icon ... */ >...</svg>
                        네이버로 회원가입
                    </button>
                </div>
                
                 <p className="mt-8 text-center text-sm text-gray-600">
                    이미 계정이 있으신가요? <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">로그인</button>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;