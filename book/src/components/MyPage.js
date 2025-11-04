// src/components/MyPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card';

// App.js로부터 handleLogout 함수를 props로 받아옵니다.
function MyPage({ user, handleLogout, categories = [], onCategoryUpdate }) {
    // --- State 변수 선언 ---
    // 비밀번호 변경
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    
    // 카테고리 관리
    //const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');

    // 회원 탈퇴
    const [isDeleteCodeSent, setIsDeleteCodeSent] = useState(false);
    const [deleteCode, setDeleteCode] = useState('');

    //비밀번호 성공 에러 표시용 
    const [message, setMessage] = useState(''); // 성공 메시지
    const [error, setError] = useState('');     // 에러 메시지


    // --- 데이터 로딩 ---
    // 컴포넌트가 처음 렌더링될 때 카테고리 목록을 불러옵니다.
    // useEffect(() => {
    //     const fetchCategories = async () => {
    //         try {
    //             const token = localStorage.getItem('authToken');
    //             const response = await axios.get('/api/categories', {
    //                 headers: { 'Authorization': `Bearer ${token}` }
    //             });
    //             setCategories(response.data);
    //         } catch (err) {
    //             setError('카테고리를 불러오는 데 실패했습니다.');
    //         }
    //     };
    //     fetchCategories();
    // }, []);

    // --- 이벤트 핸들러 함수 ---
   const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');   // 이전 메시지 초기화
        setMessage(''); // 이전 메시지 초기화

        if (newPassword !== confirmNewPassword) {
            return setError('새 비밀번호가 일치하지 않습니다.');
        }
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post('/api/users/change-password', 
                { currentPassword, newPassword },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // 👇 성공 메시지를 state에 저장
            setMessage(response.data.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            // 👇 실패 메시지를 state에 저장
            setError(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
        }
    };

    const handleAddCategory = async () => {
        setError('');
        setMessage('');
        try {
            const token = localStorage.getItem('authToken');
            await axios.post('/api/categories', 
                { name: newCategory },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            // 카테고리 목록 다시 불러오기
            const response = await axios.get('/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            //setCategories(response.data);
            setNewCategory(''); // 입력 필드 초기화
            onCategoryUpdate();
        } catch (err) {
            setError('카테고리 추가에 실패했습니다.');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        setError('');
        setMessage('');
        if (window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(`/api/categories/${categoryId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // 화면에서 삭제된 카테고리 제거
                //setCategories(categories.filter(cat => cat.id !== categoryId));
                onCategoryUpdate();
            } catch (err) {
                setError('카테고리 삭제에 실패했습니다.');
            }
        }
    };
    
    const handleSendDeleteCode = async () => {
        setError('');
        setMessage('');
        try {
             await axios.post('/api/email/send-delete-verification', { email: user.username });
             //await axios.post('/api/email/send-verification', { email: user.username });
             setMessage('인증번호가 발송되었습니다. 이메일을 확인해주세요.');
             setIsDeleteCodeSent(true);
        } catch(err) {
            setError('인증번호 발송에 실패했습니다.');
        }
    };

  const handleDeleteAccount = async () => {
    setError('');
    setMessage('');
     if (window.confirm('정말로 회원 탈퇴를 진행하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post('/api/users/delete-account', 
                { email: user.username, code: deleteCode },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // 👇 1. alert 창으로 성공 메시지를 띄웁니다.
            //    코드는 이 창이 닫힐 때까지 여기서 멈춥니다.
            alert(response.data.message + " 잠시 후 로그아웃됩니다.");

            // 👇 2. 사용자가 '확인'을 누르면 alert 창이 닫히고, 그 후에 이 코드가 실행됩니다.
            handleLogout();

        } catch(err) {
            setError(err.response?.data?.message || '회원 탈퇴에 실패했습니다.');
        }
     }
};
    


    if (!user) {
        return <div>로딩 중...</div>;
    }

    return (
        <main className="w-full max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">마이페이지</h2>
                <p className="mt-2 text-gray-600">{user.name}님의 정보를 관리하세요.</p>
            </div>

            {/* 성공/에러 메시지 표시 */}
            {message && <p className="text-center text-green-600 bg-green-100 p-2 rounded-md">{message}</p>}
            {error && <p className="text-center text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}

            
            {/* 내 정보 카드 */}
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">내 정보</h3>
                <div className="space-y-3">
                    <div className="flex items-center"><p className="w-24 font-semibold text-gray-600">이름</p><p className="text-gray-800">{user.name}</p></div>
                    <div className="flex items-center"><p className="w-24 font-semibold text-gray-600">아이디</p><p className="text-gray-800">{user.username}</p></div>
                </div>
            </Card>

            {/* 카테고리 관리 카드 */}
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">카테고리 관리</h3>
                <div className="space-y-2">
                    {categories.map(category => (
                        <div key={category.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            <span className={category.is_default ? "text-gray-500" : "text-gray-800"}>
                                 {category.name} {category.is_default ? '(기본)' : ''}
                            </span>
                            {!category.is_default && (
                                <button onClick={() => handleDeleteCategory(category.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">삭제</button>
                            )}
                        </div>
                    ))}
                </div>
                 <div className="mt-4 flex space-x-2">
                    <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="block w-full rounded-md border-gray-300" placeholder="새 카테고리 추가" />
                    <button type="button" onClick={handleAddCategory} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">추가</button>
                </div>
            </Card>

             {/* 비밀번호 변경 카드 */}
            <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">비밀번호 변경</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div><label>현재 비밀번호</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border rounded-md" /></div>
                    <div><label>새 비밀번호</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border rounded-md" /></div>
                    <div><label>새 비밀번호 확인</label><input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border rounded-md" /></div>
                    <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">비밀번호 변경</button>
                </form>
            </Card>
{/* 
             {user.provider === 'local' && (
                <Card>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">비밀번호 변경</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md" />
                        </div>
                        <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            비밀번호 변경
                        </button>
                    </form>
                </Card>
            )} */}
            

            {/* 회원 탈퇴 카드 */}
            
            <Card>
                
                <h3 className="text-xl font-bold text-red-600 mb-4">회원 탈퇴</h3>
                <p className="text-gray-600 mb-4">회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
                {!isDeleteCodeSent ? (
                    <button onClick={handleSendDeleteCode} className="w-full mt-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-md hover:bg-gray-300">
                        탈퇴를 위한 이메일 인증
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <input type="text" value={deleteCode} onChange={(e) => setDeleteCode(e.target.value)} placeholder="인증번호 입력" className="block w-full px-3 py-2 bg-gray-50 border rounded-md" />
                        </div>
                        <button onClick={handleDeleteAccount} className="w-full py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700">
                            회원 탈퇴
                        </button>
                    </div>
                )}
            </Card>
        </main>
    );
}

export default MyPage;
