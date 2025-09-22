import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function ExpenseChart({ isDarkMode }) {
  // <canvas> DOM 요소를 가리키기 위해 useRef 사용
  const chartRef = useRef(null);
  
  // 생성된 차트 인스턴스를 저장하기 위해 useRef 사용
  // 이렇게 해야 리렌더링 시에도 차트가 중복 생성되는 것을 막을 수 있음
  const chartInstance = useRef(null);

  useEffect(() => {
    // useEffect는 컴포넌트가 화면에 렌더링된 '이후'에 실행됨
    // 따라서 이 시점에는 chartRef.current가 <canvas> 요소를 가리키고 있음

    // 기존에 차트가 그려져 있었다면 파괴(destroy)하여 메모리 누수 방지
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // chartRef.current에서 캔버스 컨텍스트를 가져옴
    const ctx = chartRef.current.getContext('2d');
    
    // 새 차트 생성
    chartInstance.current = new Chart(ctx, {
      type: 'pie', // 차트 타입
      data: {      // 차트 데이터
        labels: ['식비', '교통비', '쇼핑', '외식', '기타'],
        datasets: [{
          label: '지출',
          data: [300000, 150000, 100000, 80000, 50000],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          borderWidth: 1
        }]
      },
      options: { // 차트 옵션
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: isDarkMode ? '#f3f4f6' : '#1f2937'
            }
          }
        }
      }
    });

    // 컴포넌트가 사라질 때(unmount) 실행될 클린업 함수
    // 차트 인스턴스를 파괴하여 메모리 누수를 방지
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
    
  }, [isDarkMode]); // isDarkMode가 바뀔 때마다 차트를 다시 그리도록 설정

  // 렌더링할 JSX
  return (
    <div className="chart-container">
        {/* ref 속성을 통해 위에서 생성한 chartRef를 <canvas> 요소와 연결 */}
        <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default ExpenseChart;