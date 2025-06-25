import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';

const ExpenseTracker = () => {
  // Hardcoded expenses data
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      description: 'Grocery Shopping',
      amount: 85.50,
      category: 'Groceries',
      date: '2024-06-20'
    },
    {
      id: 2,
      description: 'Electric Bill',
      amount: 120.00,
      category: 'Utilities',
      date: '2024-06-19'
    },
    {
      id: 3,
      description: 'Movie Tickets',
      amount: 24.99,
      category: 'Entertainment',
      date: '2024-06-18'
    }
  ]);

  // Hardcoded budgets data
  const [budgets, setBudgets] = useState([
    { category: 'Groceries', budget: 300, spent: 85.50 },
    { category: 'Utilities', budget: 200, spent: 120.00 },
    { category: 'Entertainment', budget: 100, spent: 24.99 },
    { category: 'Transportation', budget: 150, spent: 0 },
    { category: 'Healthcare', budget: 200, spent: 0 },
    { category: 'Other', budget: 100, spent: 0 }
  ]);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '', 
    amount: '', 
    category: '', 
    date: new Date().toISOString().split('T')[0]
  });

  const addExpense = () => {
    if (newExpense.description && newExpense.amount && newExpense.category) {
      const expense = {
        id: Date.now(),
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      };
      
      setExpenses([...expenses, expense]);
      
      setBudgets(budgets.map(budget => 
        budget.category === newExpense.category 
          ? { ...budget, spent: budget.spent + parseFloat(newExpense.amount) }
          : budget
      ));
      
      setNewExpense({ 
        description: '', 
        amount: '', 
        category: '', 
        date: new Date().toISOString().split('T')[0] 
      });
      setShowAddExpense(false);
    }
  };

  return (
    <div>
      
      
      <div className="container ">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold">Expense Tracker</h4>
          <button
            onClick={() => setShowAddExpense(true)}
            className="btn btn-primary d-flex align-items-center"
          >
              <i className="bi bi-plus-circle me-2"></i>            
              Add Expense
          </button>
        </div>

        {showAddExpense && (
          <div className="card shadow-sm border mb-4">
            <div className="card-body">
              <h3 className="card-title h5 mb-3">Add New Expense</h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    placeholder="Description"
                    className="form-control"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="form-control"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <input
                    type="date"
                    className="form-control"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button
                  onClick={addExpense}
                  className="btn btn-success"
                >
                  Add Expense
                </button>
                <button
                  onClick={() => setShowAddExpense(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card shadow-sm border">
          <div className="card-body">
            <h3 className="card-title h5 mb-3">Recent Expenses</h3>
            <div className="d-flex flex-column gap-3">
              {expenses.map(expense => (
                <div key={expense.id} className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                  <div>
                    <p className="fw-medium mb-1">{expense.description}</p>
                    <p className="text-muted small mb-0">{expense.category} • {expense.date}</p>
                  </div>
                  <span className="fs-5 fw-semibold text-danger">-${expense.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;