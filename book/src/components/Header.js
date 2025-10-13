import React, { useState } from 'react';
import { FaChartLine, FaExchangeAlt, FaChartPie, FaCog, FaUserCircle, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';

function Header({ user, handleLogout, showPage, currentPage, toggleDarkMode, onOpenModal, darkMode }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const userName = user?.name || '사용자';

    return (
        <header className="relative flex flex-col md:flex-row justify-between items-center py-4 px-6 mb-6 card">
            <h1 className="text-2xl font-bold text-indigo-600 mb-4 md:mb-0">핀로그</h1>
            <nav className="absolute left-1/2 -translate-x-1/2 flex justify-center space-x-4 md:space-x-8">
                <button type="button" onClick={() => showPage('dashboard')} className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}>
                    <FaChartLine className="mr-2" />대시보드
                </button>
                <button onClick={onOpenModal} className="nav-link text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    <FaExchangeAlt className="mr-2" />거래 기록
                </button>
                <button type="button" onClick={() => showPage('report')} className={`nav-link ${currentPage === 'report' ? 'active' : ''}`}>
                    <FaChartPie className="mr-2" />보고서
                </button>
                {/* <button type="button" onClick={() => showPage('settings')} className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}>
                    <FaCog className="mr-2" />설정
                </button> */}
            </nav>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-gray-600 text-sm hidden md:block">환영합니다, {userName}님!</span>  
                <div className="relative">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg"
                    >
                        {userName.charAt(0)}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                            <button type="button" className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={() => {showPage('mypage'); setIsDropdownOpen(false); }} >
                                <FaUserCircle className="mr-2" /> 마이페이지 및 설정
                            </button>
                            <button 
                                onClick={handleLogout} 
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                                <FaSignOutAlt className="mr-2" /> 로그아웃
                            </button>
                        </div>
                    )}
                </div>
                <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    {darkMode ? <FaSun className="w-6 h-6 text-yellow-500" /> : <FaMoon className="w-6 h-6 text-gray-600" />}
                </button>
            </div>
        </header>
    );
}

export default Header;