import React from 'react';

function Header({ showPage, toggleDarkMode, currentPage }) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center py-4 px-6 mb-6 card">
      <h1 className="text-2xl font-bold text-indigo-600 mb-4 md:mb-0">스마트 가계부</h1>
      <nav className="flex-grow flex justify-center space-x-4 md:space-x-8">

        {/* 대쉬 보드 */}
         <a 
          href="#" 
          onClick={() => showPage('dashboard')} 
          className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
        >
          <i className="fas fa-chart-line mr-2"></i>대시보드</a>

        {/* 거래 내역 */}
        <a 
          href="#" 
          onClick={() => showPage('transaction')} 
          className={`nav-link ${currentPage === 'transaction' ? 'active' : ''}`}
        >
          <i className="fas fa-exchange-alt mr-2"></i>거래 내역</a>

        {/* 보고서 */}
          <a 
          href="#" 
          onClick={() => showPage('report')} 
          className={`nav-link ${currentPage === 'report' ? 'active' : ''}`}
        >
          <i className="fas fa-chart-line mr-2"></i>보고서</a>

        {/* 설정 */}
         <a 
          href="#" 
          onClick={() => showPage('settings')} 
          className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
        >
          <i className="fas fa-exchange-alt mr-2"></i>설정</a>

         {/* ... (기타 네비게이션 링크) ... */}
      </nav>
      <div className="flex items-center space-x-4 mt-4 md:mt-0">
        <span className="text-gray-600 text-sm">환영합니다, 사용자님!</span>
        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">U</div>
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