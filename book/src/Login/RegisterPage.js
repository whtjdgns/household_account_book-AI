// src/components/RegisterPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TermsModal from './TermsModal'; // 약관 모달 import

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
    const [timer, setTimer] = useState(0);

    // 약관 동의 state
    const [agreedToServiceTerms, setAgreedToServiceTerms] = useState(false);
    const [agreedToPrivacyPolicy, setAgreedToPrivacyPolicy] = useState(false);

    // 약관 모달 state
    const [isServiceTermsModalOpen, setIsServiceTermsModalOpen] = useState(false);
    const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);

    // --- 유효성 검사 ---
    const isFormValid = name && email && password && confirmPassword && isVerified && agreedToServiceTerms && agreedToPrivacyPolicy;

    // --- 타이머 로직 ---
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // --- API 호출 함수들 ---
    const handleSendCode = async () => {
        if (!verificationEmail) return setError('인증받을 이메일을 입력해주세요.');
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:5000/api/email/send-verification', { email: verificationEmail });
            alert(response.data.message);
            setIsCodeSent(true);
            setTimer(180); // 3분 타이머 시작
        } catch (err) {
            setError(err.response?.data?.message || '인증번호 전송에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:5000/api/email/verify-code', { email: verificationEmail, code: verificationCode });
            alert(response.data.message);
            setIsVerified(true);
            setTimer(0); // 인증 성공 시 타이머 중지
        } catch (err) {
            setError(err.response?.data?.message || '인증에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (!isFormValid) return setError('모든 필수 항목을 입력하고 약관에 동의해주세요.');
        if (password !== confirmPassword) return setError('비밀번호가 일치하지 않습니다.');
        try {
            const response = await axios.post('http://localhost:5000/api/users/register', { name, username: email, password });
            alert(response.data.message);
            onSwitchToLogin();
        } catch (err) {
            setError(err.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
        }
    };
    
    // 타이머 포맷 함수
    const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

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
                                <input type="email" value={verificationEmail} onChange={(e) => setVerificationEmail(e.target.value)} placeholder="인증용 이메일 주소" disabled={isCodeSent && !isVerified} className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md disabled:bg-gray-200" />
                                <button type="button" onClick={handleSendCode} disabled={isLoading || (isCodeSent && !isVerified)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300 whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed">
                                    {isLoading && !isCodeSent ? '전송중...' : '인증번호 전송'}
                                </button>
                            </div>
                        </div>

                        {isCodeSent && !isVerified && (
                            <div className="flex space-x-2">
                                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="인증번호" className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                                <span className="flex items-center text-indigo-600 font-medium text-sm">{formatTime(timer)}</span>
                                <button type="button" onClick={handleVerifyCode} disabled={isLoading || timer === 0} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 whitespace-nowrap disabled:bg-indigo-300 disabled:cursor-not-allowed">
                                    {isLoading && isCodeSent ? '확인중...' : '인증 확인'}
                                </button>
                                 <button // 재전송 버튼 
                                    type="button" 
                                    onClick={handleSendCode} 
                                    disabled={isLoading} // 타이머와 상관없이 로딩 중일 때만 비활성화
                                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300 whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    재전송
                                </button>
                            </div>
                        )}
                         {isVerified && <p className="text-green-600 text-sm text-center">✅ 이메일 인증이 완료되었습니다.</p>}
                    </div>
                    
                    {/* --- 약관 동의 --- */}
                    <div className="pt-2 space-y-2">
                        <div className="flex items-center">
                            <input id="terms-service" type="checkbox" checked={agreedToServiceTerms} onChange={(e) => setAgreedToServiceTerms(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="terms-service" className="ml-2 block text-sm text-gray-900">
                                [필수] <span onClick={() => setIsServiceTermsModalOpen(true)} className="underline cursor-pointer hover:text-indigo-600">이용약관</span>에 동의합니다.
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input id="terms-privacy" type="checkbox" checked={agreedToPrivacyPolicy} onChange={(e) => setAgreedToPrivacyPolicy(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="terms-privacy" className="ml-2 block text-sm text-gray-900">
                                [필수] <span onClick={() => setIsPrivacyPolicyModalOpen(true)} className="underline cursor-pointer hover:text-indigo-600">개인정보 수집 및 이용</span>에 동의합니다.
                            </label>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                    
                    <button type="submit" disabled={!isFormValid} className={`w-full py-3 px-4 text-white font-bold rounded-md transition-colors ${isFormValid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                        회원가입
                    </button>
                </form>
                
                {/* --- 소셜 로그인 --- */}
                <div className="my-6 flex items-center justify-center">
                    <div className="border-t border-gray-300 flex-grow"></div>
                    <span className="px-4 text-gray-500 text-sm">또는</span>
                    <div className="border-t border-gray-300 flex-grow"></div>
                </div>

                
                {/* <div className="space-y-4">
                    <a href="http://localhost:5000/api/auth/google" 
                className="w-full py-3 px-4 flex justify-center items-center bg-[#EA4335] ...">
    
                    <button className="w-full py-3 px-4 flex justify-center items-center bg-[#EA4335] text-white font-bold rounded-md hover:bg-[#d93025]">
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.226-11.283-7.662l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C43.021 36.248 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                        구글로 회원가입
                    </button>
                </a>
                     
                   <a href="http://localhost:5000/api/auth/naver"
                         className="w-full py-3 px-4 flex justify-center items-center bg-[#03C75A] ..."
                            >
                         <button className="w-full py-3 px-4 flex justify-center items-center bg-[#03C75A] text-white font-bold rounded-md hover:bg-[#02b350]">
                         <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="currentColor" d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"></path></svg>
                        네이버로 회원가입
                    </button>
                        </a>
                </div> */}
                
                 <p className="mt-8 text-center text-sm text-gray-600">
                    이미 계정이 있으신가요? <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">로그인</button>
                </p>
            </div>
            
            <TermsModal isOpen={isServiceTermsModalOpen} onClose={() => setIsServiceTermsModalOpen(false)} title="이용약관">
                <h3 className="font-bold">제1조 </h3>
                <p>이용약관 관련 상세 내용이 들어갈 예정</p>
                
            </TermsModal>
            <TermsModal isOpen={isPrivacyPolicyModalOpen} onClose={() => setIsPrivacyPolicyModalOpen(false)} title="개인정보 수집 및 이용">
                <h3 className="font-bold">1. ???</h3>
                <p> 개인정보 수집 관련 내용이 들어갈 예정 </p>
               
            </TermsModal>
        </div>
    );
}

export default RegisterPage;