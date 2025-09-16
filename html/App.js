// App.js
import React, { useState, useEffect, useRef } from "react";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import "./App.css"; // 기존 CSS 유지
import "tailwindcss/tailwind.css";

Chart.register(ArcElement, Tooltip, Legend);

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [description, setDescription] = useState("");
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const chartRef = useRef(null);
  const user = { name: "사용자" };

  const expenseData = [300000, 150000, 100000, 80000, 50000];

  // 차트 렌더링
  useEffect(() => {
    if (chartRef.current) {
      const existingChart = Chart.getChart(chartRef.current);
      if (existingChart) existingChart.destroy();

      new Chart(chartRef.current, {
        type: "pie",
        data: {
          labels: ["식비", "교통비", "쇼핑", "외식", "기타"],
          datasets: [
            {
              label: "지출",
              data: expenseData,
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
              position: "top",
              labels: {
                color: isDarkMode ? "#f3f4f6" : "#1f2937",
              },
            },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  let label = tooltipItem.label || "";
                  if (label) label += ": ";
                  label += new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(tooltipItem.raw);
                  return label;
                },
              },
            },
          },
        },
      });
    }
  }, [expenseData, isDarkMode]);

  // AI 추천 표시
  useEffect(() => {
    if (description.includes("커피") || description.includes("카페") || description.includes("스타벅스")) {
      setShowAIRecommendation(true);
    } else {
      setShowAIRecommendation(false);
    }
  }, [description]);

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    const category = e.target.category.value;
    alert("거래가 기록되었습니다!");
    console.log(`금액: ${amount}, 내용: ${description}, 카테고리: ${category}`);
    e.target.reset();
    setDescription("");
    setShowAIRecommendation(false);
  };

  return (
    <div className={`min-h-screen flex flex-col p-4 md:p-8 ${isDarkMode ? "dark-mode" : ""}`}>
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center py-4 px-6 mb-6 card">
        <h1 className="text-2xl font-bold text-indigo-600 mb-4 md:mb-0">스마트 가계부</h1>
        <nav className="flex-grow flex justify-center space-x-4 md:space-x-8">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`nav-link ${currentPage === "dashboard" ? "active" : ""}`}
          >
            <i className="fas fa-chart-line mr-2"></i>대시보드
          </button>
          <button
            onClick={() => setCurrentPage("transaction")}
            className={`nav-link ${currentPage === "transaction" ? "active" : ""}`}
          >
            <i className="fas fa-exchange-alt mr-2"></i>거래 내역
          </button>
          <button className="nav-link">
            <i className="fas fa-chart-pie mr-2"></i>보고서
          </button>
          <button className="nav-link">
            <i className="fas fa-cog mr-2"></i>설정
          </button>
        </nav>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <span className="text-gray-600 text-sm">환영합니다, {user.name}님!</span>
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">U</div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 6.343l.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Dashboard Page */}
      {currentPage === "dashboard" && (
        <div id="dashboard-page">
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
                  <canvas ref={chartRef}></canvas>
                </div>
              </div>

              <div className="lg:col-span-1 flex flex-col space-y-6">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">AI 추천 절약 팁</h3>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-gray-800 font-medium mb-1">💡 외식비가 평균보다 높아요.</p>
                    <p className="text-sm text-gray-600">
                      이번 달은 외식을 줄이고 집에서 요리해보는 건 어떨까요? 절약 목표 달성에 도움이 될 거예요.
                    </p>
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
        </div>
      )}

      {/* Transaction Page */}
      {currentPage === "transaction" && (
        <div id="transaction-page">
          <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-lg bg-white card p-8 space-y-6">
              <h1 className="text-3xl font-bold text-center text-gray-800">거래 기록하기</h1>
              <p className="text-center text-gray-600">AI가 당신의 기록을 스마트하게 분류해 드려요.</p>

              <div className="flex rounded-full bg-gray-200 p-1">
                <button
                  onClick={() => setTransactionType("expense")}
                  className={`flex-1 py-2 px-4 rounded-full font-bold ${transactionType === "expense" ? "bg-white shadow-md text-gray-800" : "text-gray-600"}`}
                >
                  지출
                </button>
                <button
                  onClick={() => setTransactionType("income")}
                  className={`flex-1 py-2 px-4 rounded-full font-bold ${transactionType === "income" ? "bg-white shadow-md text-gray-800" : "text-gray-600"}`}
                >
                  수입
                </button>
              </div>

              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">금액</label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <input
                      type="number"
                      name="amount"
                      required
                      className="block w-full rounded-lg border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 text-3xl font-bold text-gray-800 text-right"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">원</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">내용</label>
                  <input
                    type="text"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {showAIRecommendation && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-gray-800 font-medium mb-1">💡 AI가 추천하는 카테고리</p>
                    <div className="flex space-x-2">
                      <button type="button" className="btn text-xs bg-indigo-200 text-indigo-800 px-3 py-1">
                        식비
                      </button>
                      <button type="button" className="btn text-xs bg-gray-200 text-gray-700 px-3 py-1">
                        카페
                      </button>
                      <button type="button" className="btn text-xs bg-gray-200 text-gray-700 px-3 py-1">
                        외식
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">카테고리</label>
                  <select
                    name="category"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="식비">식비</option>
                    <option value="교통비">교통비</option>
                    <option value="쇼핑">쇼핑</option>
                    <option value="문화생활">문화생활</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <button type="submit" className="w-full btn bg-indigo-600 text-white hover:bg-indigo-700">
                  기록하기
                </button>
              </form>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
