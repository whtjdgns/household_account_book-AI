import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function ExpenseChart({ isDarkMode, data, type = 'pie' }) { // 'data', 'type' prop 추가
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 데이터가 없거나, 데이터셋이 비어있으면 차트를 그리지 않음
    if (!data || !data.datasets || data.datasets.every(ds => ds.data.length === 0)) {
        return;
    }

    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new Chart(ctx, {
      type: type, // props로 받은 차트 타입 사용
      data: data, // props로 받은 데이터 사용
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom', // 범례를 아래쪽으로 이동
            labels: {
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              padding: 20, // 범례 간격 추가
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
    
  }, [isDarkMode, data, type]); // data 또는 type이 바뀔 때마다 차트를 다시 그리도록 설정

  return (
    <div className="chart-container" style={{ height: '350px' }}>
        <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default ExpenseChart;