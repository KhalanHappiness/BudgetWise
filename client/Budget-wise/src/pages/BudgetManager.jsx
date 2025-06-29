import React, { useState, useEffect } from 'react';

const BudgetManager = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({ category_id: '', budgeted_amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

    const token = localStorage.getItem('access_token')

  // Fetch categories for dropdown
  useEffect(() => {
    fetch('http://127.0.0.1:5000/categories', {
          headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const categoriesData = Array.isArray(data?.categories)
          ? data.categories
          : (Array.isArray(data) ? data : []);

        if (!Array.isArray(categoriesData)) {
          throw new Error('Invalid categories format');
        }

        setCategories(categoriesData);
      })
  }, []);

  // Fetch budgets
  useEffect(() => {
    fetch('http://127.0.0.1:5000/budgets',{
      
        headers: {
          'Authorization': `Bearer ${token}`
        }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setBudgets(data.budgets || []))
      .catch((err) => {
        console.error('Error fetching budgets:', err);
        setError('Failed to load budgets');
      });
  }, []);

  const addBudget = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validation
    if (!newBudget.category_id || !newBudget.budgeted_amount) {
      setError('Please fill in all fields');
      return;
    }

    if (parseFloat(newBudget.budgeted_amount) <= 0) {
      setError('Budget amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category_id: parseInt(newBudget.category_id),
          budgeted_amount: parseFloat(newBudget.budgeted_amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Success
      setBudgets([...budgets, data]);
      setNewBudget({ category_id: '', budgeted_amount: '' });
      setShowAddBudget(false);
      setSuccess('Budget created successfully!');
      
    } catch (err) {
      console.error('Failed to add budget:', err);
      setError(err.message || 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="container">
      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={clearMessages}
            aria-label="Close"
          ></button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button 
            type="button" 
            className="btn-close" 
            onClick={clearMessages}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Page Header and Add Budget Button */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h4 className="mb-0">Budget Manager</h4>
        <button
          onClick={() => setShowAddBudget(true)}
          className="btn btn-primary d-flex align-items-center"
          disabled={loading}
        >
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
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newBudget.category_id}
                  onChange={(e) => {
                    setNewBudget({ ...newBudget, category_id: e.target.value });
                    clearMessages();
                  }}
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Budget Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="Enter budget amount"
                  value={newBudget.budgeted_amount}
                  onChange={(e) => {
                    setNewBudget({ ...newBudget, budgeted_amount: e.target.value });
                    clearMessages();
                  }}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button
                onClick={addBudget}
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  'Set Budget'
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddBudget(false);
                  clearMessages();
                }}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {budgets.length === 0 ? (
          <div className="col-12">
            <div className="text-center text-muted py-5">
              <i className="bi bi-wallet2 fs-1"></i>
              <p className="mt-3">No budgets set yet. Create your first budget to get started!</p>
            </div>
          </div>
        ) : (
          budgets.map((budget) => {
            const percentage = (budget.spent_amount / budget.budgeted_amount) * 100;
            const isOverBudget = percentage > 100;

            return (
              <div className="col" key={budget.id}>
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">{budget.category?.name || 'Unknown Category'}</h5>
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
                        <span>Spent: ${budget.spent_amount.toFixed(2)}</span>
                        <span>Budget: ${budget.budgeted_amount.toFixed(2)}</span>
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
                        ${(budget.budgeted_amount - budget.spent_amount).toFixed(2)} 
                        {isOverBudget ? ' over budget' : ' remaining'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BudgetManager;