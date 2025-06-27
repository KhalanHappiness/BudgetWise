import React, { useState, useEffect } from 'react';

const ExpenseTracker = () => {
  // State for expenses and loading
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const [expenseCount, setExpenseCount] = useState(0)
  const [error, setError] = useState('')

  // Categories state
  const [categories, setCategories] = useState([])

  // Filter states
  const [filters, setFilters] = useState({
    category_id: '',
    start_date: '',
    end_date: '',
    limit: ''
  })

  //UI states

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false)

  const [newExpense, setNewExpense] = useState({
    description: '', 
    amount: '', 
    category_id: '', 
    date: new Date().toISOString().split('T')[0]
  });

  //fetch categories for drop down

 useEffect(() => {
     fetch('http://127.0.0.1:5000/categories')
       .then((res) => {
         if (!res.ok) {
           throw new Error(`HTTP error! status: ${res.status}`);
         }
         return res.json();
       })
       .then((data) => setCategories(data))
       .catch((err) => {
         console.error('Error fetching categories:', err);
         setError('Failed to load categories');
       });
   }, []);

  // Fetch expenses from API
  useEffect(()=>{
    const 
  })

      // Apply filters to mock data
      let filteredExpenses = mockApiResponse.expenses;
      
      if (filters.category_id) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.category_id.toString() === filters.category_id
        );
      }
      
      if (filters.start_date) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.expense_date >= filters.start_date
        );
      }
      
      if (filters.end_date) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.expense_date <= filters.end_date
        );
      }
      
      if (filters.limit) {
        filteredExpenses = filteredExpenses.slice(0, parseInt(filters.limit));
      }

      const total = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      setExpenses(filteredExpenses);
      setTotalAmount(total);
      setExpenseCount(filteredExpenses.length);

    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load expenses on component mount and when filters change
  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async () => {
    if (newExpense.description && newExpense.amount && newExpense.category) {
      try {
        // In a real app, this would POST to your API
        // const response = await fetch('/api/expenses', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     description: newExpense.description,
        //     amount: parseFloat(newExpense.amount),
        //     category_id: categories.find(c => c.name === newExpense.category)?.id,
        //     expense_date: newExpense.date
        //   })
        // });

        // For demo, just add to local state
        const expense = {
          id: Date.now(),
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          expense_date: newExpense.date,
          category_id: categories.find(c => c.name === newExpense.category)?.id || 6
        };
        
        setExpenses([expense, ...expenses]);
        setTotalAmount(totalAmount + parseFloat(newExpense.amount));
        setExpenseCount(expenseCount + 1);
        
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

      } catch (error) {
        console.error('Error adding expense:', error);
      }
    }
  };

  const applyFilters = () => {
    fetchExpenses();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      category_id: '',
      start_date: '',
      end_date: '',
      limit: ''
    });
    setTimeout(() => fetchExpenses(), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header with Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary">💰 Expense Tracker</h4>
        <div className="d-flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline-primary d-flex align-items-center"
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

      {/* Summary Cards */}
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
      </div>

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
                </select>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button onClick={applyFilters} className="btn btn-primary">
                Apply Filters
              </button>
              <button onClick={clearFilters} className="btn btn-outline-secondary">
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
                <label className="form-label">Description</label>
                <input
                  type="text"
                  placeholder="Enter description"
                  className="form-control"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="form-control"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button onClick={addExpense} className="btn btn-success">
                <i className="bi bi-check-circle me-2"></i>
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

      {/* Expenses List */}
      <div className="card shadow-sm border">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">📋 Recent Expenses</h5>
            {loading && <div className="spinner-border spinner-border-sm" role="status"></div>}
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
              <h6>No expenses found</h6>
              <p className="mb-0">Try adjusting your filters or add some expenses</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {expenses.map(expense => (
                <div key={expense.id} className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h6 className="mb-0 fw-medium">{expense.description}</h6>
                      <span className="badge bg-secondary rounded-pill">{expense.category}</span>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-calendar3 me-1"></i>
                      {new Date(expense.expense_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
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