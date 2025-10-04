// src/components/TermsModal.js
import React from 'react';

// props에 children을 추가합니다.
function TermsModal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">
                    &times;
                </button>
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <div className="prose max-w-none h-96 overflow-y-auto border-t border-b py-4">
                    {/* 👇 고정된 텍스트 대신 children을 렌더링합니다. */}
                    {children}

                    {/* 여기서 내용 넣는거 아님  */}
                </div>
                <div className="text-right mt-6">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TermsModal;