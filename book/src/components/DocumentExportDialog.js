import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Chart from './Chart'; // 소비 패턴 분석 차트 컴포넌트

function DocumentExportDialog({ isOpen, onClose, transactions }) {
    const [paperSize, setPaperSize] = useState('A4'); // 용지 사이즈 상태

    if (!isOpen) return null;

    const handleExcelExport = () => {
        const formattedData = transactions.map(t => ({
            '날짜': new Date(t.date).toLocaleDateString(),
            '유형': t.type === 'income' ? '수입' : '지출',
            '카테고리': t.category,
            '내용': t.description,
            '금액': t.amount
        }));
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '거래내역');
        XLSX.writeFile(workbook, `가계부_거래내역_${paperSize}.xlsx`);
    };

    const paperSizes = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'B5'];

    // 차트 데이터 가공
    const expenses = transactions.filter(t => t.type === 'expense');
    const spendingByCategory = expenses.reduce((acc, transaction) => {
        const { category, amount } = transaction;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += parseFloat(amount);
        return acc;
    }, {});

    const sortedSpending = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a);

    const chartData = {
        labels: sortedSpending.map(([category]) => category),
        datasets: [{
            label: '지출',
            data: sortedSpending.map(([, amount]) => amount),
            backgroundColor: [
                'rgba(75, 192, 192, 0.8)', 
                'rgba(255, 159, 64, 0.8)',
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(153, 102, 255, 0.8)',
            ],
            borderWidth: 1
        }]
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-[70]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl flex flex-col" style={{ height: '85vh' }}>
                {/* 헤더 */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold">문서로 내보내기</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>

                {/* 내용 */}
                <div className="flex flex-1 p-6 overflow-hidden gap-6">
                    {/* 소비 패턴 분석 */}
                    <div className="flex-1 flex flex-col">
                        <h4 className="text-md font-semibold mb-4">소비 패턴 분석</h4>
                        <div className="border rounded-lg flex-1 flex items-center justify-center p-4">
                            <Chart data={chartData} isDarkMode={false} />
                        </div>
                    </div>
                    {/* 거래 내역 */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <h4 className="text-md font-semibold mb-4">거래 내역</h4>
                        <div className="border rounded-lg overflow-y-auto flex-1">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내용</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.length > 0 ? (
                                        transactions.map((t) => (
                                            <tr key={t.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {t.type === 'income' ? '수입' : '지출'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.category}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.description}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{t.amount.toLocaleString()}원</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-10 text-gray-500">거래 내역이 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 푸터 (다운로드 버튼 및 용지 사이즈 선택) */}
                <div className="p-4 border-t flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <label htmlFor="paper-size" className="text-sm text-gray-600">용지 사이즈:</label>
                        <select 
                            id="paper-size"
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value)}
                            className="bg-white border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            {paperSizes.map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-600">다운로드 형식:</p>
                        <button className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-300 cursor-not-allowed" title="준비 중입니다." disabled>HWP</button>
                        <button className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-300 cursor-not-allowed" title="준비 중입니다." disabled>DOCX</button>
                        <button onClick={handleExcelExport} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-green-700">XLSX</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DocumentExportDialog;