import React, { useState, useEffect, useRef } from 'react';
import DocumentExportDialog from './DocumentExportDialog'; // 문서 내보내기 다이얼로그 import

// 챗봇 응답 로직 (변경 없음)
const getBotResponse = (page, message) => {
    const lowerCaseMessage = message.toLowerCase();
    switch (page) {
        case 'dashboard':
            if (lowerCaseMessage.includes('수입') || lowerCaseMessage.includes('지출')) {
                return '대시보드에서는 총 수입과 총 지출을 확인할 수 있습니다. 상단의 거래내역 추가 버튼으로 새로운 내역을 기록해보세요.';
            }
            return '대시보드에 대해 궁금한 점을 질문해주세요. (예: 수입 확인)';
        case 'report':
            if (lowerCaseMessage.includes('리포트') || lowerCaseMessage.includes('레포트')) {
                return '리포트 페이지에서는 월별, 카테고리별 소비 패턴을 시각적인 차트로 확인할 수 있습니다.';
            }
            return '리포트 페이지에 대해 궁금한 점을 질문해주세요. (예: 리포트 기능)';
        case 'settings':
            if (lowerCaseMessage.includes('설정') || lowerCaseMessage.includes('다크 모드')) {
                return '설정 페이지에서는 프로필 정보 확인 및 다크 모드 전환 등의 기능을 이용할 수 있습니다.';
            }
            return '설정 페이지에 대해 궁금한 점을 질문해주세요. (예: 다크 모드)';
        default:
            return '안녕하세요! AI 가계부 챗봇입니다. 무엇을 도와드릴까요?';
    }
};

// props로 transactions와 onOpenMonthlySummary 추가
function ChatbotWidget({ currentPage, transactions, onOpenMonthlySummary }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isDocOpen, setIsDocOpen] = useState(false); // 문서 다이얼로그 상태 추가
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const chatContainerRef = useRef(null);

    // 챗봇 다이얼로그가 열릴 때 첫 메시지 설정
    useEffect(() => {
        if (isChatOpen) {
            let initialMessage = '';
            switch (currentPage) {
                case 'dashboard': initialMessage = '안녕하세요! 대시보드 관련 질문을 해주세요.'; break;
                case 'report': initialMessage = '리포트 페이지 관련 질문을 해주세요.'; break;
                case 'settings': initialMessage = '설정 페이지 관련 질문을 해주세요.'; break;
                default: initialMessage = '무엇을 도와드릴까요?';
            }
            setMessages([{ sender: 'bot', text: initialMessage }]);
        }
    }, [isChatOpen, currentPage]);

    // 메시지 목록이 업데이트될 때 맨 아래로 스크롤
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;
        const newMessages = [...messages, { sender: 'user', text: inputValue }];
        setMessages(newMessages);
        const botResponse = getBotResponse(currentPage, inputValue);
        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        }, 500);
        setInputValue('');
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);
    
    const openChatDialog = () => {
        setIsChatOpen(true);
        setIsExpanded(false);
    };
    const closeChatDialog = () => setIsChatOpen(false);

    const openDocDialog = () => {
        setIsDocOpen(true);
        setIsExpanded(false);
    };
    const closeDocDialog = () => setIsDocOpen(false);

    const openMonthlySummaryDialog = () => {
        onOpenMonthlySummary();
        setIsExpanded(false);
    };

    return (
        <>
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-3">
                {/* 확장 메뉴 버튼들 */}
                {isExpanded && (
                    <div className="flex flex-col items-center gap-3">
                        {/* 월별 요약 버튼 */}
                        <button 
                            onClick={openMonthlySummaryDialog}
                            className="bg-white text-green-600 font-semibold py-2 px-5 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                            월별 요약
                        </button>
                        {/* 문서 버튼 */}
                        <button 
                            onClick={openDocDialog}
                            className="bg-white text-blue-600 font-semibold py-2 px-5 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            문서
                        </button>
                        {/* 챗봇 버튼 */}
                        <button 
                            onClick={openChatDialog}
                            className="bg-white text-violet-600 font-semibold py-2 px-5 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.837 8.837 0 01-4.41-1.162l-2.474.825a.5.5 0 01-.637-.637l.825-2.474A8.837 8.837 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.41 14.84l1.88-.627a.5.5 0 01.47.134A6.985 6.985 0 0010 16c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6c0 1.57.61 3.023 1.628 4.123a.5.5 0 01.134.47l-.627 1.88z" clipRule="evenodd" /></svg>
                            AI 챗봇
                        </button>
                    </div>
                )}

                {/* 메인 위젯 버튼 */}
                <button 
                    onClick={toggleExpand}
                    className="bg-violet-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-violet-700 transition-all duration-300 transform hover:scale-110"
                    aria-label="Toggle widget menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* 챗봇 다이얼로그 */}
            {isChatOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-[60]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" style={{ height: '70vh' }}>
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-bold">AI 챗봇</h3>
                            <button onClick={closeChatDialog} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                        </div>
                        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.sender === 'user' ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t">
                            <div className="flex">
                                <input 
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="flex-1 border rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="메시지를 입력하세요..."
                                    autoFocus
                                />
                                <button type="submit" className="bg-violet-600 text-white px-4 rounded-r-md hover:bg-violet-700">전송</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 문서 다이얼로그 */}
            <DocumentExportDialog isOpen={isDocOpen} onClose={closeDocDialog} transactions={transactions} />
        </>
    );
}

export default ChatbotWidget;
