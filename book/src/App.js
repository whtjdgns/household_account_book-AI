import React, { useState, useEffect, useCallback, useMemo } from 'react'; // useMemo 추가
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
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
import './App.css';

function App() {
    // --- 1. State 선언 ---
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLanding, setShowLanding] = useState(true);
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [authPage, setAuthPage] = useState('login');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [transactions, setTransactions] = useState([]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMonthlyListOpen, setIsMonthlyListOpen] = useState(false);
    const [isMonthlySummaryOpen, setIsMonthlySummaryOpen] = useState(false);
    const [selectedMonthData, setSelectedMonthData] = useState(null);

    //카테고리 변수 
    const [categories, setCategories] = useState([]); 

    // --- 2. Memoized Values (성능 최적화) ---
    const { monthlyDataArray, currentMonthTransactions, monthlyIncome, monthlyExpense } = useMemo(() => {
        const monthlyData = transactions.reduce((acc, tx) => {
            const key = new Date(tx.transaction_date).toISOString().slice(0, 7); // "YYYY-MM"
            if (!acc[key]) {
                acc[key] = { year: new Date(tx.transaction_date).getFullYear(), month: new Date(tx.transaction_date).getMonth() + 1, totalIncome: 0, totalExpense: 0 };
            }
            if (tx.type === 'income') acc[key].totalIncome += Number(tx.amount);
            else if (tx.type === 'expense') acc[key].totalExpense += Number(tx.amount);
            return acc;
        }, {});

        const dataArray = Object.values(monthlyData).sort((a, b) => b.year - a.year || b.month - a.month);
        
        const currentMonthTxs = transactions.filter(tx => new Date(tx.transaction_date).toISOString().slice(0, 7) === new Date().toISOString().slice(0, 7));
        const income = currentMonthTxs.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + Number(tx.amount), 0);
        const expense = currentMonthTxs.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + Number(tx.amount), 0);
        
        return { monthlyDataArray: dataArray, currentMonthTransactions: currentMonthTxs, monthlyIncome: income, monthlyExpense: expense };
    }, [transactions]); // transactions 데이터가 바뀔 때만 재계산

    // --- 3. 함수 선언 ---
    const handleLogout = useCallback(() => {
        if (!localStorage.getItem('authToken')) return;
        console.log("로그아웃을 실행합니다.");
        localStorage.removeItem('authToken');
        setUser(null);
        setIsLoggedIn(false);
        setShowLanding(true);
    }, []);

    const fetchTransactions = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            const response = await axios.get('http://localhost:5000/api/transactions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTransactions(response.data);
        } catch (error) {
            console.error("거래 내역 로딩 실패:", error);
        }
    }, []);

    const handleDeleteTransaction = useCallback(async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            await axios.delete(`http://localhost:5000/api/transactions/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTransactions(); // 삭제 후 거래 내역 다시 불러오기
        } catch (error) {
            console.error("거래 내역 삭제 실패:", error);
            alert('거래 내역 삭제 중 오류가 발생했습니다.'); // 사용자에게 오류 알림
        }
    }, [fetchTransactions]);

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

    // --- 4. Effect 선언 ---
    useEffect(() => {
        // 소셜 로그인과 일반 자동 로그인을 하나의 Effect에서 처리
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        if (tokenFromUrl) {
            localStorage.setItem('authToken', tokenFromUrl);
            window.history.replaceState({}, document.title, "/"); // URL 정리
        }

        const effectiveToken = tokenFromUrl || localStorage.getItem('authToken');
        
        if (effectiveToken) {
            try {
                const decodedUser = jwtDecode(effectiveToken);
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
        setIsLoading(false);
    }, [handleLogout]);

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
        return () => axios.interceptors.response.eject(responseInterceptor);
    }, [handleLogout]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchTransactions();
        }
    }, [isLoggedIn, fetchTransactions]);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
    }, [isDarkMode]);
    
    //카테고리 넘기는 함수
    const fetchCategories = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            const response = await axios.get('http://localhost:5000/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCategories(response.data);
        } catch (error) {
            console.error("카테고리 로딩 실패:", error);
        }
    }, []);
    
    // 로그인 했을 때 거래 내역과 카테고리를 함께 불러옴
    useEffect(() => {
        if (isLoggedIn) {
            fetchTransactions();
            fetchCategories(); // 👈 카테고리 불러오기 호출 추가
        }
    }, [isLoggedIn, fetchTransactions, fetchCategories]);

    // --- 5. 렌더링 ---
    const showChatbotPages = ['dashboard', 'report', 'settings'];

    if (isLoading) {
        return <div>로딩 중...</div>;
    }

    if (showLanding && !isLoggedIn) {
        return <LandingPage onNavigateToAuth={navigateToAuth} />;
    }

    if (!isLoggedIn) {
        return authPage === 'login' 
            ? <LoginPage onLoginSuccess={onLoginSuccess} onSwitchToRegister={() => setAuthPage('register')} />
            : <RegisterPage onSwitchToLogin={() => setAuthPage('login')} />;
    }

    return (
        <div className={`min-h-screen flex flex-col p-4 md:p-8 ${isDarkMode ? 'dark-mode' : ''}`}>
            <Header user={user} handleLogout={handleLogout} showPage={showPage} toggleDarkMode={toggleDarkMode} currentPage={currentPage} onOpenModal={openModal} darkMode={isDarkMode} />
            
            {currentPage === 'dashboard' && <Dashboard isDarkMode={isDarkMode} transactions={transactions} onDeleteTransaction={handleDeleteTransaction} />}
            {currentPage === 'report' && <ReportPage transactions={transactions} monthlyIncome={monthlyIncome} monthlyExpense={monthlyExpense} isDarkMode={isDarkMode} />}
            {currentPage === 'settings' && <SettingsPage />}
            {currentPage === 'mypage' && <MyPage user={user} handleLogout={handleLogout} categories={categories} onCategoryUpdate={fetchCategories}  />}

            <TransactionModal isOpen={isModalOpen} onClose={closeModal} onSaveSuccess={fetchTransactions}  categories={categories} />
            <MonthlyListDialog isOpen={isMonthlyListOpen} onClose={closeMonthlyList} monthlyExpenses={monthlyDataArray} onMonthSelect={openMonthlyDetail} />
            {selectedMonthData && <MonthlySummaryDialog isOpen={isMonthlySummaryOpen} onClose={closeMonthlyDetail} monthlyIncome={selectedMonthData.totalIncome} monthlyExpense={selectedMonthData.totalExpense} />}
            {showChatbotPages.includes(currentPage) && <ChatbotWidget currentPage={currentPage} transactions={transactions} onOpenMonthlySummary={openMonthlyList} userRole={user?.role} />}
        </div>
    );
}

export default App;