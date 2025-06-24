import React from 'react';
import Sidebar from '../components/Layout/Sidebar';
const Insights = () => {
  const budgets = [
    { id: 1, category: 'Groceries', budgeted: 400, spent: 450 },
    { id: 2, category: 'Rent', budgeted: 1000, spent: 1000 },
    { id: 3, category: 'Entertainment', budgeted: 200, spent: 300 },
    { id: 4, category: 'Utilities', budgeted: 150, spent: 120 },
  ];

  const bills = [
    { id: 1, name: 'Internet', dueDate: '2025-06-20', status: 'paid' },
    { id: 2, name: 'Electricity', dueDate: '2025-06-15', status: 'overdue' },
    { id: 3, name: 'Credit Card', dueDate: '2025-06-10', status: 'overdue' },
  ];

  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const overBudgetCategories = budgets.filter(b => b.spent > b.budgeted);
  const topExpenseCategory = budgets.reduce((max, b) => 
    b.spent > max.spent ? b : max, budgets[0] || { category: 'None', spent: 0 });

  return (
    <div className="container ">

      <div className="row mb-4 ">
              <h4 className="mb-4">Financial Insights</h4>

        <div className="col-md-12">
          <div className="card border-primary shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-primary">Spending Analysis</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between">
                  <span>Total Monthly Spending:</span>
                  <strong>${totalSpent}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>Top Expense Category:</span>
                  <strong>{topExpenseCategory.category}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>Categories Over Budget:</span>
                  <strong className={overBudgetCategories.length > 0 ? 'text-danger' : 'text-success'}>
                    {overBudgetCategories.length}
                  </strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md mt-4">
          <div className="card border-success shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-success">Budget Performance</h5>
              <ul className="list-group list-group-flush">
                {budgets.map(budget => {
                  const variance = budget.budgeted - budget.spent;
                  const isOver = variance < 0;
                  return (
                    <li key={budget.id} className="list-group-item d-flex justify-content-between">
                      <span>{budget.category}:</span>
                      <strong className={isOver ? 'text-danger' : 'text-success'}>
                        {isOver ? '+' : ''}${Math.abs(variance).toFixed(2)}
                      </strong>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {overBudgetCategories.length > 0 && (
        <div className="alert alert-warning border border-danger rounded-3">
          <h5 className="text-danger mb-3">⚠️ Budget Alerts</h5>
          {overBudgetCategories.map(cat => (
            <p key={cat.id} className="mb-1">
              <strong>{cat.category}</strong>: Over budget by ${(cat.spent - cat.budgeted).toFixed(2)}
            </p>
          ))}
        </div>
      )}

      <div className="card shadow-sm mt-4">
        <div className="card-body">
          <h5 className="card-title text-purple mb-4 text-primary">Recommendations</h5>
          <div className="d-grid gap-3">
            {overBudgetCategories.length > 0 && (
              <div className="alert alert-warning">
                💡 Consider reducing spending in <strong>{overBudgetCategories[0].category}</strong> or increasing your budget allocation.
              </div>
            )}
            {bills.filter(b => b.status === 'overdue').length > 0 && (
              <div className="alert alert-danger">
                🚨 You have overdue bills. Consider setting up automatic payments to avoid late fees.
              </div>
            )}
            <div className="alert alert-info">
              📊 Your highest spending category is <strong>{topExpenseCategory.category}</strong> (${topExpenseCategory.spent}).
              Look for ways to optimize these expenses.
            </div>
            <div className="alert alert-success">
              ✅ Set up bill reminders 3-5 days before due dates to improve your payment history.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
