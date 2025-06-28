import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:5000/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if you're using JWT tokens
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Dashboard</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">No Data Available</h4>
          <p>Unable to load dashboard data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Safely extract data with defaults
  const summary = dashboardData.summary || {};
  const budgets = dashboardData.budgets || [];
  const upcoming_bills = dashboardData.upcoming_bills || [];
  const overdue_bills = dashboardData.overdue_bills || [];
  const recent_expenses = dashboardData.recent_expenses || [];

  // Helper function to safely convert values to numbers
  const safeNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely convert values to strings
  const safeString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Generate reminders based on backend data
  const generateReminders = () => {
    const reminders = [];
    
    if (summary.overdue_bills_count > 0) {
      reminders.push({
        id: 1,
        message: `You have ${safeNumber(summary.overdue_bills_count)} overdue bill${safeNumber(summary.overdue_bills_count) > 1 ? 's' : ''} totaling ${safeNumber(summary.overdue_bills_amount).toLocaleString()}`
      });
    }

    // Check for over-budget categories
    const overBudgetCategories = budgets.filter(budget => 
      safeNumber(budget.spent_amount) > safeNumber(budget.budgeted_amount)
    );

    overBudgetCategories.forEach((budget, index) => {
      const overspent = safeNumber(budget.spent_amount) - safeNumber(budget.budgeted_amount);
      const categoryName = safeString(budget.category_name || budget.category || 'Unknown Category');
      reminders.push({
        id: reminders.length + 1,
        message: `${categoryName} budget exceeded by ${overspent.toFixed(2)} this month`
      });
    });

    return reminders;
  };

  const reminders = generateReminders();

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <h4 className="text-dark ">Financial Dashboard</h4>
        </div>

        {/* Summary Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Total Budget</p>
                    <h3 className="text-success mb-0">${safeNumber(summary.total_budgeted).toLocaleString()}</h3>
                  </div>
                  <i className="fas fa-dollar-sign text-success" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Budget Spent</p>
                    <h3 className="text-primary mb-0">${safeNumber(summary.total_spent_budgets).toLocaleString()}</h3>
                  </div>
                  <i className="fas fa-chart-line text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Month Expenses</p>
                    <h3 className="text-info mb-0">${safeNumber(summary.month_expenses_total).toLocaleString()}</h3>
                  </div>
                  <i className="fas fa-receipt text-info" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Overdue Bills</p>
                    <h3 className="text-danger mb-0">{safeNumber(summary.overdue_bills_count)}</h3>
                  </div>
                  <i className="fas fa-calendar-times text-danger" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders */}
        {reminders.length > 0 && (
          <div className="alert alert-warning border-start border-warning mb-4">
            <div className="d-flex align-items-center mb-2">
              <i className="fas fa-bell text-warning me-2"></i>
              <h5 className="alert-heading mb-0">Reminders</h5>
            </div>
            {reminders.map(reminder => (
              <p key={reminder.id} className="mb-1 small">{reminder.message}</p>
            ))}
          </div>
        )}

        <div className="row">
          {/* Upcoming Bills */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title mb-3">Upcoming Bills</h5>
                {upcoming_bills.length > 0 ? (
                  <div className="row g-3">
                    {upcoming_bills.slice(0, 3).map(bill => (
                      <div key={bill.id} className="col-12">
                        <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                          <div>
                            <h6 className="mb-1">{safeString(bill.bill_name || bill.name || 'Unnamed Bill')}</h6>
                            <small className="text-muted">Due: {safeString(bill.due_date)}</small>
                          </div>
                          <span className="h5 mb-0">${safeNumber(bill.amount).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No upcoming bills in the next 7 days</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title mb-3">Recent Expenses</h5>
                {recent_expenses.length > 0 ? (
                  <div className="row g-2">
                    {recent_expenses.slice(0, 5).map(expense => (
                      <div key={expense.id} className="col-12">
                        <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                          <div>
                            <h6 className="mb-0 small">{safeString(expense.description || 'No description')}</h6>
                            <small className="text-muted">{safeString(expense.expense_date)}</small>
                          </div>
                          <span className="fw-medium">${safeNumber(expense.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No recent expenses</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Budget Overview</h5>
            {budgets.length > 0 ? (
              <div className="row g-4">
                {budgets.map(budget => {
                  const budgeted = safeNumber(budget.budgeted_amount);
                  const spent = safeNumber(budget.spent_amount);
                  const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
                  const isOverBudget = percentage > 100;
                  const categoryName = safeString(budget.category_name || (budget.category && budget.category.name) || 'Unknown Category');
                  
                  return (
                    <div key={budget.id} className="col-12">
                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-medium">{categoryName}</span>
                          <span className={`small ${isOverBudget ? 'text-danger' : 'text-muted'}`}>
                            ${spent.toFixed(2)} / ${budgeted.toFixed(2)}
                          </span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className={`progress-bar ${isOverBudget ? 'bg-danger' : 'bg-success'}`}
                            role="progressbar"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        {isOverBudget && (
                          <small className="text-danger">
                            Over budget by ${(spent - budgeted).toFixed(2)}
                          </small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted text-center py-3">No budgets set up yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;