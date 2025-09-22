import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionPage from './components/TransactionPage';
import ReportPage from './components/ReportPage';
import SettingsPage from './components/SettingsPage';
import './App.css'; // TailwindCSS를 포함한 CSS 파일

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const showPage = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
     {/* 대쉬보드로 현제 페이지가 무엇인지 설정값 넘기는 부분  */}
      <Header
        showPage={showPage}
        toggleDarkMode={toggleDarkMode}
        currentPage={currentPage}
      />
      {currentPage === 'dashboard' && <Dashboard isDarkMode={isDarkMode} />}
      {currentPage === 'transaction' && <TransactionPage />}
      {currentPage === 'report' && <ReportPage />}
      {currentPage === 'settings' && <SettingsPage />}
    </div>
  );
}

export default App;