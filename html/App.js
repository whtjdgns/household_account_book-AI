import logo from './logo.svg';
import './App.css';
import './index.css';
import React, { useState, useEffect } from "react";
import { Chart } from "chart.js/auto";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    renderCharts();
  }, [isDarkMode, activePage]);

  const renderCharts = () => {
    const existingChart = Chart.getChart("expenseChart");
    if (existingChart) existingChart.destroy();

    const ctx = document.getElementById("expenseChart").getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["식비", "교통비", "쇼핑", "외식", "기타"],
        datasets: [
          {
            label: "지출",
            data: [300000, 150000, 100000, 80000, 50000],
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: isDarkMode ? "#f3f4f6" : "#1f2937",
            },
          },
        },
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`금액: ${amount}, 내용: ${description}, 카테고리: ${category}`);
    alert("거래가 기록되었습니다!");
    setAmount("");
    setDescription("");
    setCategory("");
  };

  return (
    <div className={`min-h-screen flex flex-col p-4 md:p-8 ${isDarkMode ? "dark" : ""}`}>
      {/* 상단 네비게이션 */}
      <header className="flex flex-col md:flex-row justify-between items-center py-4 px-6 mb-6 card">
        <h1 className="text-2xl font-bold text-indigo-600 mb-4 md:mb-0">스마트 가계부</h1>
        <nav className="flex-grow flex justify-center space-x-4 md:space-x-8">
          <button onClick={() => setActivePage("dashboard")} className="nav-link">대시보드</button>
          <button onClick={() => setActivePage("transaction")} className="nav-link">거래 내역</button>
          <button className="nav-link">보고서</button>
          <button className="nav-link">설정</button>
        </nav>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <span className="text-gray-600 text-sm">환영합니다, 사용자님!</span>
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">U</div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            🌙
          </button>
        </div>
      </header>

      {activePage === "dashboard" && (
        <main className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">환영합니다, 사용자님!</h2>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6 flex flex-col justify-between">
              <p className="text-sm text-gray-500 mb-2">현재 잔액</p>
              <h3 className="text-3xl font-bold text-gray-800">$1,500,000</h3>
            </div>
            <div className="card p-6 flex flex-col justify-between">
              <p className="text-sm text-gray-500 mb-2">이번 달 수입</p>
              <h3 className="text-3xl font-bold text-green-500">+$2,000,000</h3>
            </div>
            <div className="card p-6 flex flex-col justify-between">
              <p className="text-sm text-gray-500 mb-2">이번 달 지출</p>
              <h3 className="text-3xl font-bold text-red-500">-$500,000</h3>
            </div>
            <div className="card p-6 flex flex-col justify-between">
              <p className="text-sm text-gray-500 mb-2">예산 대비</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-indigo-600 h-3 rounded-full" style={{ width: "75%" }}></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">75% 사용됨</p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">AI 소비 패턴 분석</h3>
              <div className="chart-container">
                <canvas id="expenseChart"></canvas>
              </div>
            </div>

            <div className="lg:col-span-1 flex flex-col space-y-6">
              <div className="card p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">AI 추천 절약 팁</h3>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-gray-800 font-medium mb-1">💡 외식비가 평균보다 높아요.</p>
                  <p className="text-sm text-gray-600">이번 달은 외식을 줄이고 집에서 요리해보는 건 어떨까요?</p>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">최근 거래 내역</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between items-center">
                    <span className="text-gray-600">2023.10.26 / 식비</span>
                    <span className="text-red-500 font-semibold">-$25,000</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-600">2023.10.25 / 쇼핑</span>
                    <span className="text-red-500 font-semibold">-$80,000</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-600">2023.10.25 / 월급</span>
                    <span className="text-green-500 font-semibold">+$2,000,000</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      )}

      {activePage === "transaction" && (
        <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-lg bg-white card p-8 space-y-6">
            <h1 className="text-3xl font-bold text-center text-gray-800">거래 기록하기</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">금액</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="block w-full rounded-lg border-gray-300 pr-12 text-3xl font-bold text-gray-800 text-right" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">내용</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" required />
              </div>
              {description.includes("커피") && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-gray-800 font-medium mb-1">💡 AI가 추천하는 카테고리</p>
                  <div className="flex space-x-2">
                    <button type="button" className="btn text-xs bg-indigo-200 text-indigo-800 px-3 py-1">식비</button>
                    <button type="button" className="btn text-xs bg-gray-200 text-gray-700 px-3 py-1">카페</button>
                    <button type="button" className="btn text-xs bg-gray-200 text-gray-700 px-3 py-1">외식</button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">카테고리</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm">
                  <option value="">카테고리 선택</option>
                  <option value="식비">식비</option>
                  <option value="교통비">교통비</option>
                  <option value="쇼핑">쇼핑</option>
                  <option value="문화생활">문화생활</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <button type="submit" className="w-full btn bg-indigo-600 text-white hover:bg-indigo-700">기록하기</button>
            </form>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
