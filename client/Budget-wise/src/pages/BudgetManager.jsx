import React, { useState } from 'react';
import Sidebar from '../components/Layout/Menubar';


const BudgetManager = () => {
  // Hardcoded initial budget data
  const [budgets, setBudgets] = useState([
    {
      id: 1,
      category: 'Groceries',
      budgeted: 500,
      spent: 350,
    },
    {
      id: 2,
      category: 'Utilities',
      budgeted: 200,
      spent: 220, 
    },
    {
      id: 3,
      category: 'Entertainment',
      budgeted: 150,
      spent: 80,
    },
    {
      id: 4,
      category: 'Transportation',
      budgeted: 300,
      spent: 290,
    },
  ]);

  const [showAddBudget, setShowAddBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: '', budgeted: '' });

  const addBudget = () => {
    if (newBudget.category && newBudget.budgeted) {
      setBudgets([
        ...budgets,
        {
          id: Date.now(),
          category: newBudget.category,
          budgeted: parseFloat(newBudget.budgeted),
          spent: 0, 
        },
      ]);
      setNewBudget({ category: '', budgeted: '' });
      setShowAddBudget(false);
    }
  };

  return (
    <div className="container my-5">
      {/* Page Header and Add Budget Button */}
      <Sidebar/>
      <div className="d-flex justify-content-between align-items-center mb-5 mt-5">
        <h4 className="mb-0">Budget Manager</h4>
        <button
          onClick={() => setShowAddBudget(true)}
          className="btn btn-primary d-flex align-items-center">
          
          <i className="bi bi-plus-circle me-2"></i>
          Add Budget
        </button>
      </div>

      {/* Add New Budget Form */}
      {showAddBudget && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Set New Budget</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Category name"
                  value={newBudget.category}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, category: e.target.value })
                  }
                />
              </div>
              <div className="col-md-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Budget amount"
                  value={newBudget.budgeted}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, budgeted: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button
                onClick={addBudget}
                className="btn btn-success"
              >
                Set Budget
              </button>
              <button
                onClick={() => setShowAddBudget(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      <div className="row row-cols-1 row-cols g-4">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.budgeted) * 100;
          const isOverBudget = percentage > 100;

          return (
            <div className="col" key={budget.id}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">{budget.category}</h5>
                    <span
                      className={`badge ${
                        isOverBudget ? 'bg-danger' : 'bg-secondary'
                      }`}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>Spent: ${budget.spent.toFixed(2)}</span>
                      <span>Budget: ${budget.budgeted.toFixed(2)}</span>
                    </div>
                    <div className="progress" style={{ height: '0.75rem' }}>
                      <div
                        className={`progress-bar ${
                          isOverBudget ? 'bg-danger' : 'bg-success'
                        }`}
                        role="progressbar"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                        aria-valuenow={percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p
                      className={`card-text fs-5 fw-bold ${
                        isOverBudget ? 'text-danger' : 'text-success'
                      }`}
                    >
                      ${(budget.budgeted - budget.spent).toFixed(2)} remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetManager;