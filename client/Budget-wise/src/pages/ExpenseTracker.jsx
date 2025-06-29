import React, { useState, useEffect } from 'react';

const ExpenseTracker = () => {
  // State for expenses and loading
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [error, setError] = useState('');

  // Categories state
  const [categories, setCategories] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    category_id: '',
    start_date: '',
    end_date: '',
    limit: ''
  });

  // UI states
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    description: '', 
    amount: '', 
    category_id: '', 
    expense_date: new Date().toISOString().split('T')[0]
  })

  const token = localStorage.getItem('access_token')


  // Fetch categories using useEffect with .then format
  useEffect(() => {
    fetch('http://127.0.0.1:5000/categories',{
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
      .then((data) => setCategories(data.data.categories || data || []))
      .catch((err) => {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      });
  }, []);

  // Fetch expenses using useEffect with .then format
  // Fetch expenses using useEffect with .then format
useEffect(() => {
  const fetchExpenses = () => {
    setLoading(true);
    setError('');
    
    // Build query parameters
    const params = new URLSearchParams();
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit);

    fetch(`http://127.0.0.1:5000/expenses?${params}`, {
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
        // Handle both possible response structures
        const receivedData = data.data || data;
        const expensesArray = Array.isArray(receivedData.expenses) 
          ? receivedData.expenses 
          : Array.isArray(receivedData) 
            ? receivedData 
            : [];
            
        setExpenses(expensesArray);
        
        // Handle totals if they exist in response
        if (receivedData.total_amount !== undefined) {
          setTotalAmount(receivedData.total_amount);
        }
        if (receivedData.count !== undefined) {
          setExpenseCount(receivedData.count);
        }
      })
      .catch((err) => {
        console.error('Error fetching expenses:', err);
        setError(`Failed to load expenses: ${err.message}`);
        setExpenses([]);
        setTotalAmount(0);
        setExpenseCount(0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  fetchExpenses();
}, [filters, token]); 

  // Get category name by ID
  const getCategoryName = (categoryData) => {
  // If categoryData is already a category object with a name, return it directly
  if (categoryData && typeof categoryData === 'object' && categoryData.name) {
    return categoryData.name;
  }
  
  // If categoryData is just an ID, look it up in the categories array
  if (categoryData && (typeof categoryData === 'string' || typeof categoryData === 'number')) {
    const category = categories.find(cat => Number(cat.id) === Number(categoryData));
    return category ? category.name : 'Unknown';
  }
  
  // If categoryData is null, undefined, or empty
  return 'Unknown';
};

  // Manual fetch expenses function for filters
  const fetchExpensesManually = () => {
  setLoading(true);
  setError('');
  
  const params = new URLSearchParams();
  if (filters.category_id) params.append('category_id', filters.category_id);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.limit) params.append('limit', filters.limit);

  fetch(`http://127.0.0.1:5000/expenses?${params}`, {
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
      // Same handling as in useEffect
      const receivedData = data.data || data;
      const expensesArray = Array.isArray(receivedData.expenses) 
        ? receivedData.expenses 
        : Array.isArray(receivedData) 
          ? receivedData 
          : [];
          
      setExpenses(expensesArray);
      
      if (receivedData.total_amount !== undefined) {
        setTotalAmount(receivedData.total_amount);
      }
      if (receivedData.count !== undefined) {
        setExpenseCount(receivedData.count);
      }
    })
    .catch((err) => {
      console.error('Error fetching expenses:', err);
      setError(`Failed to load expenses: ${err.message}`);
      setExpenses([]);
      setTotalAmount(0);
      setExpenseCount(0);
    })
    .finally(() => {
      setLoading(false);
    });
};

  // Add expense using .then format
  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category_id) {
      setError('Please fill in all required fields');
      return;
    }

    setAddingExpense(true);
    setError('');

    // Prepare data
    const expenseData = {
      description: newExpense.description.trim(),
      amount: parseFloat(newExpense.amount),
      category_id: parseInt(newExpense.category_id),
      expense_date: newExpense.expense_date
    };

    // Validate amount is positive
    if (expenseData.amount <= 0) {
      setError('Amount must be positive');
      setAddingExpense(false);
      return;
    }

    fetch('http://127.0.0.1:5000/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(expenseData)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((createdExpense) => {
        // Reset form and close modal
        setNewExpense({ 
          description: '', 
          amount: '', 
          category_id: '', 
          expense_date: new Date().toISOString().split('T')[0] 
        });
        setShowAddExpense(false);
        
        // Refresh the expenses list
        fetchExpensesManually();
      })
      .catch((err) => {
        console.error('Error adding expense:', err);
        setError(`Failed to add expense: ${err.message}`);
      })
      .finally(() => {
        setAddingExpense(false);
      });
  };

  const applyFilters = () => {
    fetchExpensesManually();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      category_id: '',
      start_date: '',
      end_date: '',
      limit: ''
    });
    //ensures state is updated before fetching
    setTimeout(() => fetchExpensesManually(), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container-fluid ">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {/* Header with Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Expense Tracker</h4>
        <div className="d-flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center`}
          >
            <i className="bi bi-funnel me-2"></i>
            Filters
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="btn btn-primary d-flex align-items-center"
          >
            <i className="bi bi-plus-circle me-2"></i>            
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title opacity-75">Total Spent</h6>
                  <h3 className="mb-0">{formatCurrency(totalAmount)}</h3>
                </div>
                <i className="bi bi-cash-coin fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title opacity-75">Total Expenses</h6>
                  <h3 className="mb-0">{expenseCount}</h3>
                </div>
                <i className="bi bi-receipt fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-warning text-dark">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title opacity-75">Average Expense</h6>
                  <h3 className="mb-0">
                    {formatCurrency(expenseCount > 0 ? totalAmount / expenseCount : 0)}
                  </h3>
                </div>
                <i className="bi bi-graph-up fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Filters Panel */}
      {showFilters && (
        <div className="card shadow-sm border mb-4">
          <div className="card-body">
            <h5 className="card-title">🔍 Filter Expenses</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={filters.category_id}
                  onChange={(e) => setFilters({...filters, category_id: e.target.value})}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.end_date}
                  onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Limit Results</label>
                <select
                  className="form-select"
                  value={filters.limit}
                  onChange={(e) => setFilters({...filters, limit: e.target.value})}
                >
                  <option value="">No Limit</option>
                  <option value="10">10 items</option>
                  <option value="25">25 items</option>
                  <option value="50">50 items</option>
                  <option value="100">100 items</option>
                </select>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button 
                onClick={applyFilters} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Loading...
                  </>
                ) : (
                  'Apply Filters'
                )}
              </button>
              <button 
                onClick={clearFilters} 
                className="btn btn-outline-secondary"
                disabled={loading}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Form */}
      {showAddExpense && (
        <div className="card shadow-sm border mb-4">
          <div className="card-body">
            <h5 className="card-title">➕ Add New Expense</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Description *</label>
                <input
                  type="text"
                  placeholder="Enter description"
                  className="form-control"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  disabled={addingExpense}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Amount *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="form-control"
                  step="0.01"
                  min="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  disabled={addingExpense}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={newExpense.category_id}
                  onChange={(e) => setNewExpense({...newExpense, category_id: e.target.value})}
                  disabled={addingExpense}
                >
                  <option value="">Select Category</option>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={newExpense.expense_date}
                  onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})}
                  disabled={addingExpense}
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button 
                onClick={addExpense} 
                className="btn btn-success"
                disabled={addingExpense}
              >
                {addingExpense ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Add Expense
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddExpense(false)}
                className="btn btn-secondary"
                disabled={addingExpense}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="card shadow-sm border">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">📋 Recent Expenses</h5>
            {loading && (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
              <h6>No expenses found</h6>
              <p className="mb-0">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters or add some expenses'
                  : 'Add your first expense to get started'
                }
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {expenses.map(expense => (
                <div key={expense.id} className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h6 className="mb-0 fw-medium">{expense.description}</h6>
                      <span className="badge bg-secondary rounded-pill">
                        {getCategoryName(expense.category_id)}
                      </span>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-calendar3 me-1"></i>
                      {formatDate(expense.expense_date)}
                    </small>
                  </div>
                  <div className="text-end">
                    <span className="fs-5 fw-bold text-danger">
                      -{formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;