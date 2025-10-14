// src/components/TransactionModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TransactionModal({ isOpen, onClose, onSaveSuccess, categories = []  }) {
    const [transactionType, setTransactionType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionError, setSuggestionError] = useState(''); // AI 추천용 에러 state

    // AI 카테고리 추천 로직
    useEffect(() => {
        setSuggestionError(''); // 사용자가 다시 타이핑 시작하면 에러 메시지 초기화
        if (!description.trim()) {
            return;
        }

        const debounceTimer = setTimeout(() => {
            const fetchSuggestion = async () => {
                setIsSuggesting(true);
                try {
                    const token = localStorage.getItem('authToken'); // 👈 토큰 가져오기
                    const response = await axios.post('http://localhost:5000/api/gemini/suggest-category', {
                    description: description
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data.suggestedCategory) {
                    setCategory(response.data.suggestedCategory);
                }

                    // const response = await axios.post('http://localhost:5000/api/gemini/suggest-category', {
                    //     description: description
                    // });
                    // if (response.data.suggestedCategory) {
                    //     setCategory(response.data.suggestedCategory);
                    // }
                    
                } catch (err) {
                    console.error("AI 추천 실패:", err);
                    if (err.response) {
                        // 서버가 5xx 오류(서버 과부하 등)로 응답한 경우
                        setSuggestionError("AI 추천 서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.");
                    } else {
                        // 네트워크 오류 등으로 요청 자체가 실패한 경우
                        setSuggestionError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
                    }
                } finally {
                    setIsSuggesting(false);
                }
            };
            fetchSuggestion();
        }, 800);

        return () => clearTimeout(debounceTimer);

    }, [description]);

    // 모달이 닫힐 때 모든 state 초기화
    const handleClose = () => {
        setAmount('');
        setDescription('');
        setCategory('');
        setError('');
        setSuggestionError('');
        onClose();
    }

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            await axios.post('http://localhost:5000/api/transactions', {
                type: transactionType,
                amount: Number(amount),
                description: description,
                category: category,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('거래가 기록되었습니다!');
            onSaveSuccess();
            handleClose(); // 성공 시 모든 state 초기화 및 모달 닫기

        } catch (err) {
            setError(err.response?.data?.message || '거래 기록에 실패했습니다.');
            console.error('거래 기록 실패:', err);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleClose} // 배경 클릭 시에도 초기화되도록 변경
        >
            <div 
                className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 space-y-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">거래 기록하기</h1>
                    <p className="mt-2 text-gray-600">AI가 당신의 기록을 스마트하게 분류해 드려요.</p>
                </div>
                
                <div className="flex rounded-full bg-gray-100 p-1">
                    <button type="button" onClick={() => setTransactionType('expense')} className={`flex-1 py-2 px-4 rounded-full font-bold transition-colors duration-300 ${transactionType === 'expense' ? 'bg-white shadow-md text-gray-800' : 'text-gray-500'}`}>지출</button>
                    <button type="button" onClick={() => setTransactionType('income')} className={`flex-1 py-2 px-4 rounded-full font-bold transition-colors duration-300 ${transactionType === 'income' ? 'bg-white shadow-md text-gray-800' : 'text-gray-500'}`}>수입</button>
                </div>
        
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">금액</label>
                        <div className="relative">
                            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required className="block w-full text-lg rounded-lg border-gray-300 bg-gray-50 p-3 pr-10 focus:border-indigo-500 focus:ring-indigo-500" placeholder="0" />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">원</span>
                        </div>
                    </div>
        
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                        <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="block w-full text-lg rounded-lg border-gray-300 bg-gray-50 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="예: 스타벅스 커피" />
                    </div>

                    {/* AI 추천 에러 메시지 표시 */}
                    {suggestionError && <p className="text-red-500 text-xs text-center -mt-4">{suggestionError}</p>}
        
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            카테고리 {isSuggesting && <span className="text-indigo-600 animate-pulse">(AI 추천 중...)</span>}
                        </label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="block w-full text-lg rounded-lg border-gray-300 bg-gray-50 p-3 focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="">카테고리 선택</option>
                            {/* App.js로부터 받은 categories 배열로 option 태그를 생성 */}
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button type="submit" className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">기록하기</button>
                </form>
            </div>
        </div>
    );
}

export default TransactionModal;