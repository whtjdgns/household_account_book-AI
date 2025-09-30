// src/App.js
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ReportPage from './components/ReportPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './Login/LoginPage';
import RegisterPage from './Login/RegisterPage';
import TransactionModal from './components/TransactionModal';
import MyPage from './components/MyPage';
import axios from 'axios';
import './App.css';

function App() {
    // --- 1. 모든 state와 함수를 맨 위에 정의합니다. ---
    
    // 페이지 및 상태 관리
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [authPage, setAuthPage] = useState('login');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactions, setTransactions] = useState([]); 

    // 서버에서 거래내역 불러오기 
    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('http://localhost:5000/api/transactions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTransactions(response.data);
        } catch (error) {
            console.error("거래 내역 로딩 실패:", error);
        }
    };



    // 로그인 했을 때 거래 내역을 한 번 불러옴
    useEffect(() => {
        if (isLoggedIn) {
            fetchTransactions();
        }
    }, [isLoggedIn]);


    // 헬퍼 함수
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
    const showPage = (page) => setCurrentPage(page);

    // 로그인 성공 시 호출될 함수
    const onLoginSuccess = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const decodedUser = jwtDecode(token);
            setUser(decodedUser);
            setIsLoggedIn(true);
        }
    };

    // 로그아웃 함수
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setIsLoggedIn(false);
    };

    // --- 2. 모든 useEffect를 이어서 정의합니다. ---

    // 다크 모드 적용 Effect
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    // 앱 첫 로드 시 자동 로그인 처리 Effect
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const decodedUser = jwtDecode(token);
            setUser(decodedUser);
            setIsLoggedIn(true);
        }
    }, []);


    // --- 3. 마지막에 return 로직을 한 번만 사용합니다. ---

    // 로그인 상태가 아니라면, 로그인 또는 회원가입 페이지를 보여줌
    if (!isLoggedIn) {
        if (authPage === 'login') {
            return <LoginPage 
                        onLoginSuccess={onLoginSuccess} 
                        onSwitchToRegister={() => setAuthPage('register')} 
                    />;
        } else {
            return <RegisterPage 
                        onSwitchToLogin={() => setAuthPage('login')} 
                    />;
        }
    }
    
    // 로그인 상태라면, 메인 가계부 앱을 보여줌
    return (
        <div className={`min-h-screen flex flex-col p-4 md:p-8 ${isDarkMode ? 'dark-mode' : ''}`}>
            <Header
                user={user}
                handleLogout={handleLogout}
                showPage={showPage}
                toggleDarkMode={toggleDarkMode}
                currentPage={currentPage}
                onOpenModal={openModal}
            />

              {/* Dashboard에 transactions 데이터 전달 */}
            {currentPage === 'dashboard' && <Dashboard isDarkMode={isDarkMode} transactions={transactions} />}
            
            {currentPage === 'report' && <ReportPage />}
            {currentPage === 'settings' && <SettingsPage />}
            {currentPage === 'mypage' && <MyPage user={user} />}

             <TransactionModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                onSaveSuccess={fetchTransactions} 
            />
            
            
        </div>
    );
}

export default App;