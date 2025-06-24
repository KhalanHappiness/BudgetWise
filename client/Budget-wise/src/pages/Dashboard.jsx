import React from 'react';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Menubar';

const Dashboard = () => {
  // Hardcoded data
  const budgets = [
    { id: 1, category: 'Food & Dining', budgeted: 800, spent: 650 },
    { id: 2, category: 'Transportation', budgeted: 400, spent: 380 },
    { id: 3, category: 'Entertainment', budgeted: 300, spent: 420 },
    { id: 4, category: 'Shopping', budgeted: 500, spent: 290 },
    { id: 5, category: 'Utilities', budgeted: 250, spent: 245 }
  ];

  const bills = [
    { id: 1, name: 'Electricity Bill', amount: 150, dueDate: '2025-06-28', status: 'upcoming' },
    { id: 2, name: 'Internet Bill', amount: 80, dueDate: '2025-06-30', status: 'upcoming' },
    { id: 3, name: 'Water Bill', amount: 65, dueDate: '2025-07-02', status: 'upcoming' },
    { id: 4, name: 'Credit Card Payment', amount: 850, dueDate: '2025-06-20', status: 'overdue' },
    { id: 5, name: 'Insurance Premium', amount: 200, dueDate: '2025-06-18', status: 'overdue' }
  ];

  const reminders = [
    { id: 1, message: 'You have 2 overdue bills totaling $1,050' },
    { id: 2, message: 'Entertainment budget exceeded by $120 this month' }
  ];

  // Calculations
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgeted, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const upcomingBills = bills.filter(bill => bill.status === 'upcoming').slice(0, 3);
  const overdueBills = bills.filter(bill => bill.status === 'overdue');

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        
      <div className="container">
        <Header/>
        <Sidebar/>
        {/* Reminders */}
        {reminders.length > 0 && (
          <div className="alert alert-warning border-start border-warning mb-4 mt-5">
            <div className="d-flex align-items-center mb-2">
              <i className="fas fa-bell text-warning me-2"></i>
              <h5 className="alert-heading mb-0">Reminders</h5>
            </div>
            {reminders.map(reminder => (
              <p key={reminder.id} className="mb-1 small">{reminder.message}</p>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Total Budget</p>
                    <h3 className="text-success mb-0">${totalBudget.toLocaleString()}</h3>
                  </div>
                  <i className="fas fa-dollar-sign text-success" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Total Spent</p>
                    <h3 className="text-primary mb-0">${totalSpent.toLocaleString()}</h3>
                  </div>
                  <i className="fas fa-chart-line text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">Overdue Bills</p>
                    <h3 className="text-danger mb-0">{overdueBills.length}</h3>
                  </div>
                  <i className="fas fa-calendar-times text-danger" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Upcoming Bills</h5>
            <div className="row g-3">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="col-12">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">{bill.name}</h6>
                      <small className="text-muted">Due: {bill.dueDate}</small>
                    </div>
                    <span className="h5 mb-0">${bill.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Budget Overview</h5>
            <div className="row g-4">
              {budgets.map(budget => {
                const percentage = (budget.spent / budget.budgeted) * 100;
                const isOverBudget = percentage > 100;
                
                return (
                  <div key={budget.id} className="col-12">
                    <div className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-medium">{budget.category}</span>
                        <span className={`small ${isOverBudget ? 'text-danger' : 'text-muted'}`}>
                          ${budget.spent} / ${budget.budgeted}
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
                          Over budget by ${(budget.spent - budget.budgeted).toLocaleString()}
                        </small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;