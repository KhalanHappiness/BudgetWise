import React, { useState, useEffect } from 'react';


const BudgetManager = () => {
  const [budgets, setBudgets] =useState([])
  const [categories, setCategories] = useState([])
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [newBudget, setNewBudget] = useState({ category_id: '', budgeted_amount: '' })

  //Fetch categories for dropdown

  useEffect(()=>{
    fetch('http://127.0.0.1:5000/categories')
    .then((res)=> res.json())
    .then((data) => setCategories(data))
    .catch((err) => console.error('Error fetching categories:', err))
  }, [])

  useEffect(()=>{
    fetch('http://127.0.0.1:5000/budgets')
    .then((res) => res.json())
    .then((data)=> setBudgets(data))
    .catch((err) => console.error('Error fetching categories:', err))
  },[])
  
  
  const addBudget = () => {
    if (!newBudget.category_id || ! newBudget.budgeted_amount) return;

    fetch('http://127.0.0.1:5000/budgets', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        category_id: parseInt(newBudget.category_id),
        budgeted_amount: parseFloat(newBudget.budgeted_amount)
      })
    })
      .then((res) => res.json())
      .then((added) =>{
        setBudgets([...budgets, added])
        setNewBudget({category_id:'', budgeted_amount: ''})
        setShowAddBudget(false)
      })
      .catch((err) => console.error('Failed to add budget:', err))
   }

  return (
    <div className="container ">
      {/* Page Header and Add Budget Button */}
    
      <div className="d-flex justify-content-between align-items-center mb-5">
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
                <select
                  className="form-select"
                  value={newBudget.category_id}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, category_id: e.target.value })
                  }
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
                <input
                  type="number"
                  className="form-control"
                  placeholder="Budgeted amount"
                  value={newBudget.budgeted_amount}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, budgeted_amount: e.target.value })
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
          const percentage = (budget.spent_amount / budget.budgeted_amount) * 100;
          const isOverBudget = percentage > 100;

          return (
            <div className="col" key={budget.id}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">{budget.category?.name}</h5>
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
                      ${(budget.budgeted_amount - budget.spent_amount).toFixed(2)} remaining
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