# Budget Wise

A comprehensive personal finance management application that helps you take control of your spending and financial habits.

## Overview

Budget Wise is designed to simplify your financial management by providing powerful tools to track, analyze, and understand your spending patterns. Whether you're looking to cut expenses, save for a goal, or just get a better handle on where your money goes, Budget Wise has you covered.

## Features

### 📊 Monthly Spending Analysis
- Comprehensive breakdown of your monthly expenses
- Categorized spending reports to identify patterns
- Month-over-month comparison to track financial progress
- Visual charts and graphs for easy understanding

### 💰 Daily Expense Tracking
- Quick and easy daily expense entry
- Real-time tracking of your spending throughout the day
- Category-based expense organization
- Receipt and note attachments for detailed records

### 🧾 Monthly Bills Management
- Track all your recurring monthly bills in one place
- Monitor bill amounts and track changes over time
- Budget allocation for fixed monthly expenses

### 🏠 Interactive Dashboard
- At-a-glance summary of your financial health
- Visual representation of spending distribution
- Quick access to key financial metrics
- Personalized insights

### 🔄 Recurring Bills Setup
- Automated tracking of regular expenses
- Set up recurring bills with custom frequencies
- Historical tracking of recurring expense patterns

## Getting Started

1. **Create Your Account**: Set up your profile with basic financial preferences
2. **Add Your First Expenses**: Start logging daily expenses to build your spending profile
3. **Set Up Recurring Bills**: Input your monthly bills and recurring expenses
4. **Explore Your Dashboard**: Review your personalized financial summary and insights

## Key Benefits

- **Better Financial Awareness**: Understand exactly where your money goes each month
- **Improved Budgeting**: Make informed decisions based on actual spending data
- **Bill Management**: Never miss a payment with automated reminders and tracking
- **Goal Achievement**: Use insights to reduce unnecessary spending and save more
- **Time Saving**: Streamlined expense tracking saves you time and effort

## How It Works

Budget Wise uses a simple three-step process:

1. **Track**: Log your daily expenses and set up recurring bills
2. **Analyze**: Review detailed reports and dashboard insights
3. **Optimize**: Use the data to make better financial decisions

## Privacy & Security

Your financial data is important to us. Budget Wise employs industry-standard security measures to keep your information safe and private. Your data is encrypted and stored securely, and we never share your personal financial information with third parties.

#
## Technology Stack

**Frontend:**
- React.js - Modern JavaScript library for building user interfaces
- Bootstrap - Responsive CSS framework for clean, mobile-first design

**Backend:**
- Flask - Lightweight Python web framework
- Python - Server-side programming language
## Project Structure

```
BUDGET-WISE/
├── client/                   # React frontend application
│   └── Budget-wise/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Dashboard/
│       │   │   │   └── SummaryCards.jsx
│       │   │   └── Layout/
│       │   │       ├── Header.jsx
│       │   │       ├── Layout.jsx
│       │   │       └── Sidebar.jsx
│       │   ├── context/
│       │   │   └── AuthContext.jsx
│       │   ├── pages/
│       │   │   ├── BillsManager.jsx
│       │   │   ├── BudgetManager.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   └── ExpenseTracker.jsx
│       │   ├── routes/
│       │   │   └── AppRoutes.jsx
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── package.json
│       └── index.html
├── server/                   # Flask backend application
│   ├── .venv/               # Python virtual environment
│   ├── server/
│   │   ├── instance/
│   │   ├── migrations/
│   │   ├── app.py           # Main Flask application
│   │   ├── models.py        # Database models
│   │   └── seed.py          # Database seeding
│   ├── .env                 # Environment variables
│   ├── Pipfile              # Pipenv dependencies
│   └── Pipfile.lock
└── readme.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.7 or higher)
- pip (Python package manager)
- npm or yarn

### Backend Setup (Flask)
1. Clone the repository:
   ```bash
   git clone https://github.com/KhalanHappiness/BudgetWise
   cd Budget-wise
   ```

2. Navigate to the server directory:
   ```bash
   cd server
   ```

3. Install dependencies using Pipenv:
   ```bash
   pipenv install
   pipenv shell
   ```

4. Set up environment variables in `.env` file:
   ```bash
   FLASK_APP=server/app.py
   FLASK_ENV=development
   ```

5. Run database migrations :
   ```bash
   flask db upgrade
   ```

6. Seed the database (optional):
   ```bash
   python server/seed.py
   ```

7. Run the Flask server:
   ```bash
   flask run
   ```

### Frontend Setup (React)
1. Navigate to the React application directory:
   ```bash
   cd client/Budget-wise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173` (Vite dev server) with the API running on `http://localhost:5000` (Flask).

## System Requirements

- Node.js v14+
- Python 3.7+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection required for data sync

---

Take control of your finances today with Budget Wise. Start your journey toward better financial health and smarter spending decisions.

#### built by
*Happiness Khalan*