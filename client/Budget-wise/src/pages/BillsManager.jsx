import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar';

// API Configuration and Helper Functions
const API_BASE_URL = 'http://localhost:5000'; // Removed /api since your routes don't use it

// Debug: Log API calls
const logApiCall = (method, url) => {
  console.log(`${method} ${url}`);
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  // Check if response is HTML (error page)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
  }
  
  if (!response.ok) {
    let errorMessage = 'An error occurred'
    try {
      const error = await response.json()
      errorMessage = error.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
    throw new Error(errorMessage);
  }
  return response.json()
};

// Helper function to get auth headers 
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API Functions
const billsApi = {
  // Get all bills with optional filtering
  getBills: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    
    const url = `${API_BASE_URL}/bills${params.toString() ? `?${params.toString()}` : ''}`
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      return handleResponse(response)
    } catch (error) {
      console.error('Network error:', error);
      throw new Error('Unable to connect to server. Please check if the server is running.')
    }
  },

  // Create a new bill
  createBill: async (billData) => {
    const response = await fetch(`${API_BASE_URL}/bills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(billData)
    });
    
    return handleResponse(response);
  },

  // Update a bill
  updateBill: async (billId, billData) => {
    const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(billData)
    });
    
    return handleResponse(response)
  },

  // Delete a bill
  deleteBill: async (billId) => {
    const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response)
  },

  // Pay a bill
  payBill: async (billId, paidDate = null) => {
    const body = paidDate ? { paid_date: paidDate } : {}
    
    const response = await fetch(`${API_BASE_URL}/bills/${billId}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    
    return handleResponse(response)
  },

  // Get payment history
  getPayments: async () => {
    const url = `${API_BASE_URL}/billpayments`
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      return handleResponse(response)
    } catch (error) {
      console.error('Network error:', error)
      throw new Error('Unable to connect to server. Please check if the server is running.')
    }
  }
};

// Main Component
const BillsManager = () => {
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddBill, setShowAddBill] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '', amount: '', category: '', due_date: '', recurring_type: 'monthly'
  });

  // Load bills and payments on component mount
  useEffect(() => {
    loadBillsAndPayments();
  }, []);

  const loadBillsAndPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load bills first
      const billsResponse = await billsApi.getBills();
      setBills(billsResponse.bills || []);
      
      // Try to load payments, but don't fail if endpoint doesn't exist
      try {
        const paymentsResponse = await billsApi.getPayments();
        setPayments(paymentsResponse.payments || []);
      } catch (paymentErr) {
        console.warn('Payments endpoint not available:', paymentErr.message);
        setPayments([]); // Set empty array if payments endpoint doesn't exist
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addBill = async () => {
    if (!newBill.name || !newBill.amount || !newBill.due_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      
      // Convert form data to match API expectations
      const billData = {
        name: newBill.name,
        amount: parseFloat(newBill.amount),
        category: newBill.category,
        due_date: newBill.due_date,
        recurring_type: newBill.recurring_type
      };

      await billsApi.createBill(billData);
      
      // Reset form and reload data
      setNewBill({ name: '', amount: '', category: '', due_date: '', recurring_type: 'monthly' });
      setShowAddBill(false);
      await loadBillsAndPayments();
    } catch (err) {
      setError(err.message);
      console.error('Error adding bill:', err);
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    try {
      setError(null);
      await billsApi.deleteBill(id);
      await loadBillsAndPayments();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting bill:', err);
    }
  };

  const markAsPaid = async (id) => {
    try {
      setError(null);
      await billsApi.payBill(id);
      await loadBillsAndPayments();
    } catch (err) {
      setError(err.message);
      console.error('Error paying bill:', err);
    }
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'overdue': return 'bg-danger';
      case 'paid': return 'bg-success';
      default: return 'bg-warning';
    }
  };

  // Helper function to get list item class
  const getListItemClass = (status) => {
    switch (status) {
      case 'overdue': return 'list-group-item-danger';
      case 'paid': return 'list-group-item-success';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">  
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4">Bills Manager</h2>
        <button className="btn btn-primary" onClick={() => setShowAddBill(true)}>
          <i className="bi bi-plus-circle me-2"></i>Add Bill
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {showAddBill && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Add New Bill</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Bill name *"
                  value={newBill.name}
                  onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount *"
                  step="0.01"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Category"
                  value={newBill.category}
                  onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <input
                  type="date"
                  className="form-control"
                  value={newBill.due_date}
                  onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={newBill.recurring_type}
                  onChange={(e) => setNewBill({ ...newBill, recurring_type: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-success" onClick={addBill}>Add Bill</button>
              <button className="btn btn-secondary" onClick={() => setShowAddBill(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Your Bills ({bills.length})</h5>
          {bills.length === 0 ? (
            <p className="text-muted">No bills to display.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {bills.map(bill => (
                <li key={bill.id} className={`list-group-item d-flex justify-content-between align-items-center ${getListItemClass(bill.status)}`}>
                  <div>
                    <strong>{bill.name}</strong>
                    <span className={`badge ms-2 ${getStatusBadgeClass(bill.status)}`}>
                      {bill.status}
                    </span>
                    <br />
                    <small>{bill.category} • Due: {bill.due_date} • {bill.recurring_type}</small>
                    {bill.status === 'paid' && bill.paid_date && (
                      <>
                        <br />
                        <small className="text-success">Paid on {bill.paid_date}</small>
                      </>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold">${bill.amount}</span>
                    {bill.status !== 'paid' && (
                      <button 
                        className="btn btn-sm btn-success" 
                        onClick={() => markAsPaid(bill.id)}
                        title="Mark as Paid"
                      >
                        ✓
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteBill(bill.id)}>
                      <span>🗑️</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {payments.length > 0 && (
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Recent Payments</h5>
            <ul className="list-group list-group-flush">
              {payments.slice(0, 5).map(payment => (
                <li key={payment.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{payment.bill_name}</strong>
                    {payment.was_paid_late && <span className="badge bg-warning ms-2">Late</span>}
                    <br />
                    <small>Paid on: {payment.paid_date}</small>
                  </div>
                  <span className="fw-bold text-success">${payment.amount}</span>
                </li>
              ))}
            </ul>
            {payments.length > 5 && (
              <div className="text-center mt-2">
                <small className="text-muted">Showing 5 of {payments.length} payments</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsManager;