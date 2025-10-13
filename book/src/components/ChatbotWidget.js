import React, { useState, useEffect, useRef } from 'react';
import DocumentExportDialog from './DocumentExportDialog'; // 문서 내보내기 다이얼로그 import
import ChatDialog from './ChatDialog'; // 재사용 가능한 챗 다이얼로그

// props로 transactions와 onOpenMonthlySummary 추가
function ChatbotWidget({ currentPage, transactions, onOpenMonthlySummary, userRole }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isDocOpen, setIsDocOpen] = useState(false); // 문서 다이얼로그 상태 추가
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
    const chatContainerRef = useRef(null);
        // ★★★ 1. 관리자 챗봇을 위한 별도의 상태를 추가합니다.
    const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);

    // 챗봇 다이얼로그가 열릴 때 첫 메시지 설정
    useEffect(() => {
        if (isChatOpen) {
            const initialMessage = '안녕하세요! AI 핀로그 챗봇입니다';
            setMessages([{ sender: 'bot', text: initialMessage }]);
        }
    }, [isChatOpen]);

    // 관리자 챗봇이 열릴 때의 초기 메시지
    useEffect(() => {
        if (isAdminChatOpen) {
            setMessages([{ sender: 'bot', text: '관리자 모드입니다. 필요한 명령을 입력해주세요.' }]);
        }
    }, [isAdminChatOpen]);

    // 메시지 목록이 업데이트될 때 맨 아래로 스크롤
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (inputValue.trim() === '' || isLoading) return;

        const newMessages = [...messages, { sender: 'user', text: inputValue }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('authToken'); // 로컬 스토리지에서 토큰 가져오기

            const response = await fetch('http://localhost:5000/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 토큰이 있을 경우에만 Authorization 헤더 추가
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    message: inputValue,
                    currentPage: currentPage,
                    chatHistory: newMessages.slice(-10) // 마지막 10개 메시지만 히스토리로 전송
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.text || '서버에서 오류가 발생했습니다.');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { sender: 'bot', text: data.text }]);

        } catch (error) {
            console.error('챗봇 메시지 전송 오류:', error);
            setMessages(prev => [...prev, { sender: 'bot', text: `오류: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);
    
    const openChatDialog = () => {
        setIsChatOpen(true);
        setIsExpanded(false);
    };
    const closeChatDialog = () => setIsChatOpen(false);

 // ★★★ 2. 관리자 챗봇 다이얼로그를 여닫는 함수를 추가합니다.
    const openAdminChatDialog = () => { setIsAdminChatOpen(true); setIsExpanded(false); };
    const closeAdminChatDialog = () => setIsAdminChatOpen(false);


    const openDocDialog = () => {
        setIsDocOpen(true);
        setIsExpanded(false);
    };
    const closeDocDialog = () => setIsDocOpen(false);

    const openMonthlySummaryDialog = () => {
        onOpenMonthlySummary();
        setIsExpanded(false);
    };

    // 로그인하지 않은 사용자(userRole이 null)는 위젯을 보지 못하게 처리
    if (!userRole) {
        return null;
    }

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
                         {/* ★★★ 3. 관리자일 때만 이 버튼이 추가로 보입니다. ★★★ */}
                        {userRole === 'admin' && (
                            <button 
                                onClick={openAdminChatDialog}
                                className="bg-white text-red-600 font-semibold py-2 px-5 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                                관리자 챗봇
                            </button>
                        )}
                    </div>
                )}

                {/* 메인 위젯 버튼 */}
                <button 
                    onClick={toggleExpand}
                    className="bg-violet-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-violet-700 transition-all duration-300 transform hover:scale-110"
                    aria-label="Toggle widget menu"
                    title="챗봇 및 기능 메뉴 열기"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* 사용자 챗봇 다이얼로그 */}
            <ChatDialog
                isOpen={isChatOpen}
                onClose={closeChatDialog}
                title="AI 핀로그 챗봇"
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                inputValue={inputValue}
                setInputValue={setInputValue}
                theme="user"
            />

            {/* 관리자 챗봇 다이얼로그 */}
            <ChatDialog
                isOpen={isAdminChatOpen}
                onClose={closeAdminChatDialog}
                title="관리자 챗봇"
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                inputValue={inputValue}
                setInputValue={setInputValue}
                theme="admin"
            />

            {/* 문서 다이얼로그 */}
            <DocumentExportDialog isOpen={isDocOpen} onClose={closeDocDialog} transactions={transactions} />
        </>
    );
}

export default ChatbotWidget;
