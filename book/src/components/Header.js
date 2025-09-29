import React, { useState } from 'react';

function Header({ user, handleLogout, showPage, currentPage, toggleDarkMode, onOpenModal }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // user?.name 은 user가 존재하고 user.name이 있을 때만 값을 가져오고, 그렇지 않으면 에러 없이 undefined를 반환합니다.
    // || '사용자' 는 user.name이 없을 경우 대신 보여줄 기본값입니다.
    //이거 안전장치 
    const userName = user?.name || '사용자';

    return (
        <header className="flex flex-col md:flex-row justify-between items-center py-4 px-6 mb-6 card">
            <h1 className="text-2xl font-bold text-indigo-600 mb-4 md:mb-0">스마트 가계부</h1>
            <nav className="flex-grow flex justify-center space-x-4 md:space-x-8">
                <a href="#" onClick={() => showPage('dashboard')} className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}>
                    <i className="fas fa-chart-line mr-2"></i>대시보-드
                </a>
                <button onClick={onOpenModal} className="nav-link text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                    <i className="fas fa-exchange-alt mr-2"></i>거래 기록
                </button>
                <a href="#" onClick={() => showPage('report')} className={`nav-link ${currentPage === 'report' ? 'active' : ''}`}>
                    <i className="fas fa-chart-pie mr-2"></i>보고서
                </a>
                <a href="#" onClick={() => showPage('settings')} className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}>
                    <i className="fas fa-cog mr-2"></i>설정
                </a>
            </nav>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-gray-600 text-sm hidden md:block">환영합니다, {userName}님!</span>  
                <div className="relative">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg"
                    >
                        {/* 이름이 있으면 첫 글자, 없으면 'U'를 표시 */}
                        {userName.charAt(0)}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {showPage('mypage'); // 'mypage'로 페이지 전환
                                       setIsDropdownOpen(false); }}  // 드롭다운 메뉴 닫기 
                                         > 마이페이지</a>
                            <button 
                                onClick={handleLogout} 
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                로그아웃
                            </button>
                        </div>
                    )}
                </div>
                <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 6.343l.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"></path>
                    </svg>
                </button>
            </div>
        </header>
    );
}

export default Header;