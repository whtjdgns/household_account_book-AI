import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ReportPage from './components/ReportPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './Login/LoginPage';
import RegisterPage from './Login/RegisterPage';
import TransactionModal from './components/TransactionModal';
import MyPage from './components/MyPage';
import LandingPage from './components/LandingPage';
import ChatbotWidget from './components/ChatbotWidget';
import MonthlyListDialog from './components/MonthlyListDialog';
import MonthlySummaryDialog from './components/MonthlySummaryDialog';
import axios from 'axios';
import './App.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLanding, setShowLanding] = useState(true);
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [authPage, setAuthPage] = useState('login');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMonthlyListOpen, setIsMonthlyListOpen] = useState(false);
    const [isMonthlySummaryOpen, setIsMonthlySummaryOpen] = useState(false);
    const [selectedMonthData, setSelectedMonthData] = useState(null);
    const [transactions, setTransactions] = useState([]);

    const handleLogout = useCallback(() => {
        if (!localStorage.getItem('authToken')) return;
        console.log("자동 로그아웃을 실행합니다.");
        localStorage.removeItem('authToken');
        setUser(null);
        setIsLoggedIn(false);
        setShowLanding(true);
    }, []);

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

    const onLoginSuccess = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const decodedUser = jwtDecode(token);
            setUser(decodedUser);
            setIsLoggedIn(true);
            setShowLanding(false);
            setCurrentPage('dashboard');
        }
    };

    useEffect(() => {
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [handleLogout]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchTransactions();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                if (decodedUser.exp * 1000 < Date.now()) {
                    handleLogout();
                } else {
                    setUser(decodedUser);
                    setIsLoggedIn(true);
                    setShowLanding(false);
                }
            } catch (e) {
                handleLogout();
            }
        }
    }, [handleLogout]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const openMonthlyList = () => setIsMonthlyListOpen(true);
    const closeMonthlyList = () => setIsMonthlyListOpen(false);

    const openMonthlyDetail = (data) => {
        setSelectedMonthData(data);
        setIsMonthlyListOpen(false);
        setIsMonthlySummaryOpen(true);
    };

    const closeMonthlyDetail = () => {
        setIsMonthlySummaryOpen(false);
        setSelectedMonthData(null);
    };

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
    const showPage = (page) => setCurrentPage(page);
    const navigateToAuth = () => setShowLanding(false);

    const showChatbotPages = ['dashboard', 'report', 'settings'];

    if (showLanding && !isLoggedIn) {
        return <LandingPage onNavigateToAuth={navigateToAuth} />;
    }

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

    const monthlyData = transactions.reduce((acc, tx) => {
        const date = new Date(tx.transaction_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        if (!acc[key]) {
            acc[key] = { year, month, totalIncome: 0, totalExpense: 0 };
        }

        if (tx.type === 'income') {
            acc[key].totalIncome += Number(tx.amount);
        } else if (tx.type === 'expense') {
            acc[key].totalExpense += Number(tx.amount);
        }

        return acc;
    }, {});

    const monthlyDataArray = Object.values(monthlyData).sort((a, b) => b.year - a.year || b.month - a.month);
    
    const currentMonthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.transaction_date);
        const today = new Date();
        return txDate.getFullYear() === today.getFullYear() && txDate.getMonth() === today.getMonth();
    });

    const monthlyIncome = currentMonthTransactions
        .filter(tx => tx.type === 'income')
        .reduce((acc, tx) => acc + Number(tx.amount), 0);

    const monthlyExpense = currentMonthTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((acc, tx) => acc + Number(tx.amount), 0);

    return (
        <div className={`min-h-screen flex flex-col p-4 md:p-8 ${isDarkMode ? 'dark-mode' : ''}`}>
            <Header
                user={user}
                handleLogout={handleLogout}
                showPage={showPage}
                toggleDarkMode={toggleDarkMode}
                currentPage={currentPage}
                onOpenModal={openModal}
                darkMode={isDarkMode}
            />

            {currentPage === 'dashboard' && <Dashboard isDarkMode={isDarkMode} transactions={transactions} />}
            {currentPage === 'report' && <ReportPage 
                                            transactions={currentMonthTransactions}
                                            monthlyIncome={monthlyIncome}
                                            monthlyExpense={monthlyExpense}
                                            isDarkMode={isDarkMode}
                                          />}
            {currentPage === 'settings' && <SettingsPage />}
            {currentPage === 'mypage' && <MyPage user={user} />}

             <TransactionModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                onSaveSuccess={fetchTransactions} 
            />

            <MonthlyListDialog
                isOpen={isMonthlyListOpen}
                onClose={closeMonthlyList}
                monthlyExpenses={monthlyDataArray}
                onMonthSelect={openMonthlyDetail}
            />

            {selectedMonthData && (
                <MonthlySummaryDialog
                    isOpen={isMonthlySummaryOpen}
                    onClose={closeMonthlyDetail}
                    monthlyIncome={selectedMonthData.totalIncome}
                    monthlyExpense={selectedMonthData.totalExpense}
                />
            )}

            {showChatbotPages.includes(currentPage) && <ChatbotWidget currentPage={currentPage} transactions={transactions} onOpenMonthlySummary={openMonthlyList} />}
        </div>
    );
}

export default App;
