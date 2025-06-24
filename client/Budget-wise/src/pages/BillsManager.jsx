import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';

const BillsManager = () => {
  const [bills, setBills] = useState([
    { id: 1, name: 'Rent', amount: 1200, category: 'Housing', dueDate: '2025-07-01', recurring: 'monthly', status: 'upcoming' },
    { id: 2, name: 'Electricity', amount: 150, category: 'Utilities', dueDate: '2025-06-28', recurring: 'monthly', status: 'upcoming' },
    { id: 3, name: 'Internet', amount: 60, category: 'Utilities', dueDate: '2025-06-25', recurring: 'monthly', status: 'overdue' }
  ]);

  const [showAddBill, setShowAddBill] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '', amount: '', category: '', dueDate: '', recurring: 'monthly'
  });

  const handleAddBill = () => {
    if (newBill.name && newBill.amount && newBill.dueDate) {
      const billWithStatus = {
        ...newBill,
        id: Date.now(),
        amount: parseFloat(newBill.amount),
        status: new Date(newBill.dueDate) < new Date() ? 'overdue' : 'upcoming'
      };
      setBills([...bills, billWithStatus]);
      setNewBill({ name: '', amount: '', category: '', dueDate: '', recurring: 'monthly' });
      setShowAddBill(false);
    }
  };

  const deleteBill = (id) => {
    setBills(bills.filter(bill => bill.id !== id));
  };

  return (
    <div className="container my-5">  
      <Sidebar/>
      <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
        <h2 className="h4">Bills Manager</h2>
        <button className="btn btn-primary" onClick={() => setShowAddBill(true)}>
          <span className="me-1">➕</span> Add Bill

        </button>
      </div>

      {showAddBill && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Add New Bill</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Bill name"
                  value={newBill.name}
                  onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount"
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
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={newBill.recurring}
                  onChange={(e) => setNewBill({ ...newBill, recurring: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-success" onClick={handleAddBill}>Add Bill</button>
              <button className="btn btn-secondary" onClick={() => setShowAddBill(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Your Bills</h5>
          {bills.length === 0 ? (
            <p className="text-muted">No bills to display.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {bills.map(bill => (
                <li key={bill.id} className={`list-group-item d-flex justify-content-between align-items-center ${bill.status === 'overdue' ? 'list-group-item-danger' : ''}`}>
                  <div>
                    <strong>{bill.name}</strong><br />
                    <small>{bill.category} • Due: {bill.dueDate} • {bill.recurring}</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold">${bill.amount}</span>
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
    </div>
  );
};

export default BillsManager;
