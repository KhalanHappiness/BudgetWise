import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// import { billService } from '../services/billService';
// import { budgetService } from '../services/budgetService';
// import { expenseService } from '../services/expenseService';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [bills, setBills] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load sample data for demo user
  useEffect(() => {
    if (currentUser?.id === 'demo') {
      loadSampleData();
    } else if (currentUser) {
      loadUserData();
    } else {
      clearData();
    }
  }, [currentUser]);

  const loadSampleData = () => {
    setBills([
      { id: 1, name: 'Rent', amount: 1200, category: 'Housing', dueDate: '2025-07-01', recurring: 'monthly', status: 'upcoming' },
      { id: 2, name: 'Electricity', amount: 150, category: 'Utilities', dueDate: '2025-06-28', recurring: 'monthly', status: 'upcoming' },
      { id: 3, name: 'Internet', amount: 60, category: 'Utilities', dueDate: '2025-06-25', recurring: 'monthly', status: 'overdue' }
    ]);
    
    setBudgets([
      { id: 1, category: 'Groceries', budgeted: 400, spent: 320 },
      { id: 2, category: 'Utilities', budgeted: 300, spent: 210 },
      { id: 3, category: 'Entertainment', budgeted: 200, spent: 250 },
      { id: 4, category: 'Transportation', budgeted: 150, spent: 95 }
    ]);

    setExpenses([
      { id: 1, description: 'Grocery Shopping', amount: 85, category: 'Groceries', date: '2025-06-20' },
      { id: 2, description: 'Movie Night', amount: 45, category: 'Entertainment', date: '2025-06-18' },
      { id: 3, description: 'Gas Station', amount: 40, category: 'Transportation', date: '2025-06-17' }
    ]);

    setReminders([
      { id: 1, message: 'Internet bill due in 2 days', type: 'warning', billId: 3 },
      { id: 2, message: 'Entertainment budget exceeded by $50', type: 'alert', category: 'Entertainment' }
    ]);
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [billsData, budgetsData, expensesData] = await Promise.all([
        billService.getUserBills(),
        budgetService.getUserBudgets(),
        expenseService.getUserExpenses()
      ]);
      
      setBills(billsData);
      setBudgets(budgetsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setBills([]);
    setBudgets([]);
    setExpenses([]);
    setReminders([]);
  };

  // Bill operations
  const addBill = async (billData) => {
    try {
      if (currentUser?.id === 'demo') {
        const newBill = {
          id: Date.now(),
          ...billData,
          amount: parseFloat(billData.amount),
          status: new Date(billData.dueDate) < new Date() ? 'overdue' : 'upcoming'
        };
        setBills([...bills, newBill]);
        return newBill;
      } else {
        const newBill = await billService.createBill(billData);
        setBills([...bills, newBill]);
        return newBill;
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteBill = async (billId) => {
    try {
      if (currentUser?.id === 'demo') {
        setBills(bills.filter(bill => bill.id !== billId));
      } else {
        await billService.deleteBill(billId);
        setBills(bills.filter(bill => bill.id !== billId));
      }
    } catch (error) {
      throw error;
    }
  };

  // Budget operations
  const addBudget = async (budgetData) => {
    try {
      if (currentUser?.id === 'demo') {
        const newBudget = {
          id: Date.now(),
          category: budgetData.category,
          budgeted: parseFloat(budgetData.budgeted),
          spent: 0
        };
        setBudgets([...budgets, newBudget]);
        return newBudget;
      } else {
        const newBudget = await budgetService.createBudget(budgetData);
        setBudgets([...budgets, newBudget]);
        return newBudget;
      }
    } catch (error) {
      throw error;
    }
  };

  // Expense operations
  const addExpense = async (expenseData) => {
    try {
      const expense = {
        id: Date.now(),
        ...expenseData,
        amount: parseFloat(expenseData.amount)
      };
      
      if (currentUser?.id === 'demo') {
        setExpenses([...expenses, expense]);
        // Update budget spent amount
        setBudgets(budgets.map(budget => 
          budget.category === expenseData.category 
            ? { ...budget, spent: budget.spent + parseFloat(expenseData.amount) }
            : budget
        ));
      } else {
        const newExpense = await expenseService.createExpense(expenseData);
        setExpenses([...expenses, newExpense]);
        // Reload budgets to reflect updated spent amounts
        const updatedBudgets = await budgetService.getUserBudgets();
        setBudgets(updatedBudgets);
      }
      
      return expense;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    bills,
    budgets,
    expenses,
    reminders,
    loading,
    addBill,
    deleteBill,
    addBudget,
    addExpense
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};