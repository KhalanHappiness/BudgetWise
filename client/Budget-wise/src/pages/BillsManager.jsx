import React, { useState } from 'react';
import Sidebar from '../components/Layout/Menubar';

const BillsManager = () => {
  const [bills, setBills] = useState([
    { id: 1, name: 'Rent', amount: 1200, category: 'Housing', dueDate: '2025-07-01', recurring: 'monthly', status: 'upcoming' },
    { id: 2, name: 'Electricity', amount: 150, category: 'Utilities', dueDate: '2025-06-28', recurring: 'monthly', status: 'upcoming' },
    { id: 3, name: 'Internet', amount: 60, category: 'Utilities', dueDate: '2025-06-25', recurring: 'monthly', status: 'overdue' }
  ]);

  // Add payments state to track payment history
  const [payments, setPayments] = useState([]);

  const [showAddBill, setShowAddBill] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '', amount: '', category: '', dueDate: '', recurring: 'monthly'
  });

  const addBill = () => {
    if (newBill.name && newBill.amount && newBill.dueDate) {
      setBills([...bills, {
        id: Date.now(),
        ...newBill,
        amount: parseFloat(newBill.amount),
        status: new Date(newBill.dueDate) < new Date() ? 'overdue' : 'upcoming'
      }]);
      setNewBill({ name: '', amount: '', category: '', dueDate: '', recurring: 'monthly' });
      setShowAddBill(false);
    }
  };

  const deleteBill = (id) => {
    setBills(bills.filter(bill => bill.id !== id));
  };

  const markAsPaid = (id) => {
    const billToPay = bills.find(bill => bill.id === id);
    if (!billToPay) return;

    // Add payment to payments history
    const payment = {
      id: Date.now(),
      billId: id,
      billName: billToPay.name,
      amount: billToPay.amount,
      category: billToPay.category,
      paidDate: new Date().toISOString().split('T')[0],
      originalDueDate: billToPay.dueDate
    };
    setPayments(prev => [...prev, payment]);

    // If it's a recurring bill, create next occurrence and remove current
    if (billToPay.recurring !== 'one-time') {
      const nextDueDate = getNextDueDate(billToPay.dueDate, billToPay.recurring);
      const nextBill = {
        ...billToPay,
        id: Date.now() + Math.random(), 
        dueDate: nextDueDate,
        status: 'upcoming'
      };
      
      // Remove current bill and add next occurrence
      setBills(prevBills => [
        ...prevBills.filter(bill => bill.id !== id),
        nextBill
      ]);
    } else {
      // For one-time bills, mark as paid
      setBills(prevBills => 
        prevBills.map(bill => 
          bill.id === id 
            ? { ...bill, status: 'paid', paidDate: new Date().toISOString().split('T')[0] }
            : bill
        )
      );
    }
  };

  const getNextDueDate = (currentDueDate, recurring) => {
    const date = new Date(currentDueDate);
    switch (recurring) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return currentDueDate;
    }
    return date.toISOString().split('T')[0];
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
              <button className="btn btn-success" onClick={addBill}>Add Bill</button>
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
                <li key={bill.id} className={`list-group-item d-flex justify-content-between align-items-center ${bill.status === 'overdue' ? 'list-group-item-danger' : bill.status === 'paid' ? 'list-group-item-success' : ''}`}>
                  <div>
                    <strong>{bill.name}</strong>
                    <span className={`badge ms-2 ${
                      bill.status === 'overdue' ? 'bg-danger' : 
                      bill.status === 'paid' ? 'bg-success' : 
                      'bg-warning'
                    }`}>
                      {bill.status.toUpperCase()}
                    </span>
                    <br />
                    <small>{bill.category} • Due: {bill.dueDate} • {bill.recurring}</small>
                    {bill.status === 'paid' && <br />}
                    {bill.status === 'paid' && <small className="text-success"> Paid on {bill.paidDate}</small>}
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
              {payments.slice(-5).reverse().map(payment => (
                <li key={payment.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{payment.billName}</strong><br />
                    <small>{payment.category} • Paid on: {payment.paidDate}</small>
                  </div>
                  <span className="fw-bold text-success">${payment.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsManager;