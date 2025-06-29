import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

// Register chart components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
);

const Insights = () => {
  const [insights, setInsights] = useState(null)
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    fetch('http://127.0.0.1:5000/insights',{
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => setInsights(data.data))
      .catch(error => {
        console.error('Error fetching insights:', error);
      });
  }, []);

  if (!insights) return <div className="p-4">Loading insights...</div>;

  const budgetData = {
  labels: ['Spent', 'Remaining'],
  datasets: [{
    data: [
      insights?.budget_utilization?.total_spent || 0,
      (insights?.budget_utilization?.total_budgeted || 0) - (insights?.budget_utilization?.total_spent || 0)
    ],
    backgroundColor: ['#ef4444', '#10b981']
  }]
};

  const categoryData = {
    labels: insights.category_spending.map(c => c.category),
    datasets: [{
      label: 'Spending by Category',
      data: insights.category_spending.map(c => c.total_spent),
      backgroundColor: '#6366f1'
    }]
  };

  const timelineData = {
    labels: insights.spending_timeline.map(d => d.date),
    datasets: [{
      label: 'Daily Spending',
      data: insights.spending_timeline.map(d => d.amount),
      fill: false,
      borderColor: '#3b82f6',
      tension: 0.3,
      pointRadius: 3
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      
      {/* Budget Utilization */}
      <div className="bg-white p-4 rounded-2xl shadow h-80">
        <h4 className="text-xl font-semibold mb-2">Budget Utilization</h4>
        <div className="h-64">
          <Doughnut data={budgetData} options={chartOptions} />
        </div>
        <p className="text-sm mt-2">Utilization: {insights.budget_utilization.utilization_percent}%</p>
      </div>

      {/* Category Spending */}
      <div className="bg-white p-4 rounded-2xl shadow col-span-1 md:col-span-2 h-96">
        <h4 className="text-xl font-semibold mb-2">Spending by Category</h4>
        <div className="h-80">
          <Bar data={categoryData} options={chartOptions} />
        </div>
      </div>

      {/* Spending Over Time */}
      <div className="bg-white p-4 rounded-2xl shadow col-span-1 md:col-span-2 h-96">
        <h4 className="text-xl font-semibold mb-2">Spending Timeline</h4>
        <div className="h-80">
          <Line data={timelineData} options={chartOptions} />
        </div>
      </div>

      {/* Bills Summary */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h4 className="text-xl font-semibold mb-2">Bills Summary</h4>
        <p>Upcoming Bills: {insights.bills_summary.upcoming_bills_count}</p>
        <p>Overdue Bills: {insights.bills_summary.overdue_bills_count}</p>
        <p>Total Overdue Amount: ${insights.bills_summary.overdue_bills_amount}</p>
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h4 className="text-xl font-semibold mb-2">Monthly Comparison</h4>
        <p>This Month: ${insights.monthly_comparison.this_month_spending}</p>
        <p>Last Month: ${insights.monthly_comparison.last_month_spending}</p>
      </div>
    </div>
  );
};

export default Insights;
