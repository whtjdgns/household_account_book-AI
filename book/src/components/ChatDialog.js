import React, { useRef, useEffect } from 'react';

const ChatDialog = ({
    isOpen,
    onClose,
    title,
    messages,
    isLoading,
    onSendMessage,
    inputValue,
    setInputValue,
    theme, // 'user' or 'admin'
}) => {
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    if (!isOpen) return null;

    const themeClasses = {
        user: {
            title: 'text-lg font-bold',
            bgColor: 'bg-violet-500',
            ringColor: 'focus:ring-violet-500',
            buttonColor: 'bg-violet-600 hover:bg-violet-700',
            userMessageBg: 'bg-violet-500 text-white',
        },
        admin: {
            title: 'text-lg font-bold text-red-600',
            bgColor: 'bg-red-500',
            ringColor: 'focus:ring-red-500',
            buttonColor: 'bg-red-600 hover:bg-red-700',
            userMessageBg: 'bg-red-500 text-white',
        },
    };

    const currentTheme = themeClasses[theme] || themeClasses.user;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" style={{ height: '70vh' }}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className={currentTheme.title}>{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.sender === 'user' ? currentTheme.userMessageBg : 'bg-gray-200 text-gray-800'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="rounded-lg px-4 py-2 max-w-xs bg-gray-200 text-gray-800">
                                AI가 답변을 생성 중입니다...
                            </div>
                        </div>
                    )}
                </div>
                <form onSubmit={onSendMessage} className="p-4 border-t">
                    <div className="flex">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className={`flex-1 border rounded-l-md p-2 focus:outline-none focus:ring-2 ${currentTheme.ringColor}`}
                            placeholder={theme === 'admin' ? "관리자 명령을 입력하세요..." : "메시지를 입력하세요..."}
                            autoFocus
                            disabled={isLoading}
                        />
                        <button type="submit" className={`${currentTheme.buttonColor} text-white px-4 rounded-r-md disabled:bg-gray-400`} disabled={isLoading}>전송</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatDialog;
