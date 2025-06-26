import os
import sys
from datetime import datetime, date, timedelta
from decimal import Decimal
from werkzeug.security import generate_password_hash
import random

# Add the parent directory to the path to import models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User, Category, Budget, Expense, Bill, BillPayment, Reminder

def clear_database():
    """Clear all existing data from the database"""
    print("Clearing existing data...")
    
    # Delete in reverse order of dependencies
    db.session.query(Reminder).delete()
    db.session.query(BillPayment).delete()
    db.session.query(Bill).delete()
    db.session.query(Expense).delete()
    db.session.query(Budget).delete()
    db.session.query(Category).delete()
    db.session.query(User).delete()
    
    db.session.commit()
    print("Database cleared successfully!")

def seed_categories():
    """Create essential categories"""
    print("Seeding categories...")
    
    categories_data = [
        {'name': 'Food & Dining', 'description': 'Restaurants, groceries, takeout'},
        {'name': 'Transportation', 'description': 'Gas, public transport, car maintenance'},
        {'name': 'Bills & Utilities', 'description': 'Electricity, water, internet, phone'},
        {'name': 'Entertainment', 'description': 'Movies, games, subscriptions'},
        {'name': 'Shopping', 'description': 'Clothing, electronics, general shopping'},
        {'name': 'Healthcare', 'description': 'Medical expenses, insurance, pharmacy'},
        {'name': 'Other', 'description': 'Miscellaneous expenses'}
    ]
    
    categories = []
    for cat_data in categories_data:
        category = Category(**cat_data)
        categories.append(category)
        db.session.add(category)
    
    db.session.commit()
    print(f"Created {len(categories)} categories")
    return categories

def seed_users():
    """Create sample users"""
    print("Seeding users...")
    
    users_data = [
        {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'password123',
            'is_demo_user': False
        },
        {
            'username': 'demo_user',
            'email': 'demo@example.com',
            'password': 'demo123',
            'is_demo_user': True
        }
    ]
    
    users = []
    for user_data in users_data:
        user = User(
            username=user_data['username'],
            email=user_data['email'],
            password_hash=generate_password_hash(user_data['password']),
            is_demo_user=user_data['is_demo_user']
        )
        users.append(user)
        db.session.add(user)
    
    db.session.commit()
    print(f"Created {len(users)} users")
    return users

def seed_budgets(users, categories):
    """Create sample budgets"""
    print("Seeding budgets...")
    
    # Simplified budget templates
    budget_templates = {
        'john_doe': [
            ('Food & Dining', 500),
            ('Transportation', 250),
            ('Bills & Utilities', 350),
            ('Entertainment', 150),
            ('Shopping', 200)
        ],
        'demo_user': [
            ('Food & Dining', 300),
            ('Transportation', 150),
            ('Bills & Utilities', 250),
            ('Entertainment', 100)
        ]
    }
    
    budgets = []
    category_dict = {cat.name: cat for cat in categories}
    
    for user in users:
        if user.username in budget_templates:
            for cat_name, amount in budget_templates[user.username]:
                if cat_name in category_dict:
                    budget = Budget(
                        user_id=user.id,
                        category_id=category_dict[cat_name].id,
                        budgeted_amount=Decimal(str(amount))
                    )
                    budgets.append(budget)
                    db.session.add(budget)
    
    db.session.commit()
    print(f"Created {len(budgets)} budgets")
    return budgets

def seed_expenses(users, categories):
    """Create sample expenses for the last month"""
    print("Seeding expenses...")
    
    category_dict = {cat.name: cat for cat in categories}
    
    # Reduced expense templates
    expense_templates = {
        'Food & Dining': [
            ('Grocery shopping', 40, 80),
            ('Restaurant dinner', 20, 50),
            ('Coffee shop', 3, 6),
            ('Takeout order', 12, 25)
        ],
        'Transportation': [
            ('Gas station', 30, 60),
            ('Bus ticket', 2, 5),
            ('Uber ride', 8, 20)
        ],
        'Bills & Utilities': [
            ('Electricity bill', 80, 120),
            ('Internet bill', 50, 70),
            ('Phone bill', 40, 60)
        ],
        'Entertainment': [
            ('Movie tickets', 12, 20),
            ('Netflix subscription', 15, 15),
            ('Video game', 30, 60)
        ],
        'Shopping': [
            ('Clothing', 25, 80),
            ('Electronics', 50, 200),
            ('Online purchase', 15, 40)
        ],
        'Healthcare': [
            ('Pharmacy', 15, 40),
            ('Doctor visit', 100, 150)
        ],
        'Other': [
            ('Miscellaneous', 10, 50)
        ]
    }
    
    expenses = []
    
    # Generate expenses for the last 30 days only
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    for user in users:
        # Generate 15-25 expenses per user over 1 month (reduced from 50-100)
        num_expenses = random.randint(15, 25)
        
        for _ in range(num_expenses):
            # Random date in the last 30 days
            random_days = random.randint(0, 29)
            expense_date = end_date - timedelta(days=random_days)
            
            # Random category
            category_name = random.choice(list(expense_templates.keys()))
            category = category_dict[category_name]
            
            # Random expense from template
            description, min_amount, max_amount = random.choice(expense_templates[category_name])
            amount = round(random.uniform(min_amount, max_amount), 2)
            
            expense = Expense(
                user_id=user.id,
                category_id=category.id,
                description=description,
                amount=Decimal(str(amount)),
                expense_date=expense_date
            )
            expenses.append(expense)
            db.session.add(expense)
    
    db.session.commit()
    print(f"Created {len(expenses)} expenses")
    return expenses

def seed_bills(users):
    """Create sample bills"""
    print("Seeding bills...")
    
    # Reduced bill templates
    bill_templates = [
        ('Electricity Bill', 80, 120, 'Bills & Utilities', 'monthly'),
        ('Internet Bill', 50, 70, 'Bills & Utilities', 'monthly'),
        ('Phone Bill', 40, 60, 'Bills & Utilities', 'monthly'),
        ('Netflix Subscription', 15, 15, 'Entertainment', 'monthly'),
        ('Car Insurance', 100, 150, 'Transportation', 'monthly'),
        ('Rent', 800, 1200, 'Bills & Utilities', 'monthly')
    ]
    
    bills = []
    
    for user in users:
        # Each user gets 3-4 bills (reduced from 5-8)
        selected_bills = random.sample(bill_templates, random.randint(3, 4))
        
        for name, min_amount, max_amount, category, recurring_type in selected_bills:
            amount = round(random.uniform(min_amount, max_amount), 2)
            
            # Generate due dates for the next 30 days
            due_date = date.today() + timedelta(days=random.randint(1, 30))
            
            # 20% chance the bill is already paid
            paid_date = None
            if random.random() < 0.2:
                paid_date = due_date - timedelta(days=random.randint(1, 5))
            
            bill = Bill(
                user_id=user.id,
                name=name,
                amount=Decimal(str(amount)),
                category=category,
                due_date=due_date,
                recurring_type=recurring_type,
                paid_date=paid_date
            )
            bills.append(bill)
            db.session.add(bill)
    
    db.session.commit()
    print(f"Created {len(bills)} bills")
    return bills

def seed_bill_payments(users, bills):
    """Create sample bill payment history"""
    print("Seeding bill payments...")
    
    payments = []
    
    # Create payment history for the last 2 months (reduced from 6 months)
    end_date = date.today()
    start_date = end_date - timedelta(days=60)
    
    for user in users:
        user_bills = [bill for bill in bills if bill.user_id == user.id]
        
        # Generate 8-12 payment records per user (reduced from 20-40)
        num_payments = random.randint(8, 12)
        
        for _ in range(num_payments):
            bill = random.choice(user_bills)
            
            # Random payment date in the last 2 months
            payment_date = start_date + timedelta(days=random.randint(0, 59))
            
            # Original due date would be a few days before or after payment
            original_due_date = payment_date + timedelta(days=random.randint(-10, 5))
            
            payment = BillPayment(
                user_id=user.id,
                bill_id=bill.id,
                bill_name=bill.name,
                amount=bill.amount,
                category=bill.category,
                original_due_date=original_due_date,
                paid_date=payment_date
            )
            payments.append(payment)
            db.session.add(payment)
    
    db.session.commit()
    print(f"Created {len(payments)} bill payments")
    return payments

def seed_reminders(users):
    """Create sample reminders"""
    print("Seeding reminders...")
    
    # Reduced reminder templates
    reminder_templates = [
        ('Budget Alert: You have exceeded your Food & Dining budget this month', 'budget_alert'),
        ('Bill Due: Electricity bill is due in 3 days', 'bill_due'),
        ('Budget Alert: You are 80% through your Entertainment budget', 'budget_alert'),
        ('Remember to review your monthly expenses', 'custom'),
        ('Bill Due: Internet bill due this week', 'bill_due'),
        ('Consider setting up automatic bill payments', 'custom')
    ]
    
    reminders = []
    
    for user in users:
        # Each user gets 2-3 reminders (reduced from 3-6)
        selected_reminders = random.sample(reminder_templates, random.randint(2, 3))
        
        for message, reminder_type in selected_reminders:
            # 70% chance the reminder is still active
            is_active = random.random() < 0.7
            dismissed_at = None
            
            if not is_active:
                dismissed_at = datetime.utcnow() - timedelta(days=random.randint(1, 15))
            
            reminder = Reminder(
                user_id=user.id,
                message=message,
                reminder_type=reminder_type,
                is_active=is_active,
                dismissed_at=dismissed_at
            )
            reminders.append(reminder)
            db.session.add(reminder)
    
    db.session.commit()
    print(f"Created {len(reminders)} reminders")
    return reminders

def print_summary(users, categories, budgets, expenses, bills, payments, reminders):
    """Print a summary of seeded data"""
    print("\n" + "="*50)
    print("DATABASE SEEDING COMPLETED!")
    print("="*50)
    print(f"Users created: {len(users)}")
    print(f"Categories created: {len(categories)}")
    print(f"Budgets created: {len(budgets)}")
    print(f"Expenses created: {len(expenses)}")
    print(f"Bills created: {len(bills)}")
    print(f"Bill payments created: {len(payments)}")
    print(f"Reminders created: {len(reminders)}")
    print("="*50)
    
    print("\nSample Login Credentials:")
    print("Email: john@example.com | Password: password123")
    print("Email: demo@example.com | Password: demo123")
    print("="*50)

def seed_database():
    """Main function to seed the entire database"""
    print("Starting database seeding...")
    
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        
        # Clear existing data
        clear_database()
        
        # Seed data in order of dependencies
        categories = seed_categories()
        users = seed_users()
        budgets = seed_budgets(users, categories)
        expenses = seed_expenses(users, categories)
        bills = seed_bills(users)
        payments = seed_bill_payments(users, bills)
        reminders = seed_reminders(users)
        
        # Print summary
        print_summary(users, categories, budgets, expenses, bills, payments, reminders)

if __name__ == '__main__':
    seed_database()