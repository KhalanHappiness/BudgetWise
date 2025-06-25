from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData, func
from datetime import datetime, date
from sqlalchemy import UniqueConstraint, Index
import re

# Define naming convention
metadata = MetaData(naming_convention={
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
})

# Initialize db with metadata
db = SQLAlchemy(metadata=metadata)

class User(db.Model): 

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)  
    email = db.Column(db.String(120), unique=True, nullable=False) 
    password_hash = db.Column(db.String(255), nullable=False)  
    is_demo_user = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    budgets = db.relationship('Budget', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    expenses = db.relationship('Expense', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    bills = db.relationship('Bill', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    bill_payments = db.relationship('BillPayment', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    reminders = db.relationship('Reminder', backref='user', cascade='all, delete-orphan', lazy='dynamic') 

    def __repr__(self):
        return f'<User {self.username}>'
    
    def validate_email(self):
        #Basic email validation
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, self.email))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_demo_user': self.is_demo_user,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Budget(db.Model):

    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    budgeted_amount = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship('Category', back_populates='budgets')

    __table_args__ = (
        UniqueConstraint('user_id', 'category_id', name='unique_budget_category_user'),
    )

    def __repr__(self):
        return f'<Budget {self.category.name if self.category else "Unknown"}: ${self.budgeted_amount}>'

    @property
    def spent_amount(self):
        #Calculate total spent amount for this budget's category
        if not self.category:
            return 0
        
        # Sum all expenses for this user and category
        total = db.session.query(func.sum(Expense.amount)).filter(
            Expense.user_id == self.user_id,
            Expense.category_id == self.category_id
        ).scalar()
        
        return total or 0

    @property
    def variance(self):
        return float(self.spent_amount) - float(self.budgeted_amount)

    @property
    def percentage_used(self):
        if self.budgeted_amount == 0:
            return 0
        return float(self.spent_amount / self.budgeted_amount * 100)

    @property
    def is_over_budget(self):
        return self.spent_amount > self.budgeted_amount

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category.to_dict() if self.category else None,
            'budgeted_amount': float(self.budgeted_amount),
            'spent_amount': float(self.spent_amount),
            'variance': round(self.variance, 2),
            'percentage_used': round(self.percentage_used, 2),
            'is_over_budget': self.is_over_budget,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship('Category', back_populates='expenses')

    __table_args__ = (
        db.Index('idx_user_date', 'user_id', 'expense_date'),
        db.Index('idx_user_category', 'user_id', 'category_id'),
    )

    def __repr__(self):
        return f'<Expense {self.description}: ${self.amount}>'

    def validate_amount(self):
        #Ensure amount is positive
        return self.amount > 0

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category.to_dict() if self.category else None,
            'description': self.description,
            'amount': float(self.amount),
            'expense_date': self.expense_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  

    budgets = db.relationship('Budget', back_populates='category', cascade='all, delete-orphan')
    expenses = db.relationship('Expense', back_populates='category', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Category {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Bill(db.Model):
    __tablename__ = 'bills'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    recurring_type = db.Column(
        db.Enum('weekly', 'monthly', 'yearly', 'one-time', name='recurring_types'),
        default='monthly'
    )
    paid_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments = db.relationship('BillPayment', backref='bill', cascade='all, delete-orphan', lazy='dynamic')

    __table_args__ = (
        Index('idx_user_due_date', 'user_id', 'due_date'),
    )

    def __repr__(self):
        return f'<Bill {self.name}: ${self.amount} due {self.due_date}>'

    @property
    def status(self):
        if self.paid_date:
            return 'paid'
        elif self.due_date < date.today():
            return 'overdue'
        else:
            return 'upcoming'

    @property
    def is_overdue(self):
        #True if bill is overdue and unpaid
        return self.status == 'overdue'

    @property
    def days_until_due(self):
        #Days until due date (negative if overdue)
        return (self.due_date - date.today()).days

    def mark_paid(self, paid_date=None):
        #Mark bill as paid and create payment record
        payment_date = paid_date or date.today()
        self.paid_date = payment_date
        
        # Create payment record
        payment = BillPayment(
            user_id=self.user_id,
            bill_id=self.id,
            bill_name=self.name,
            amount=self.amount,
            category=self.category,
            original_due_date=self.due_date,
            paid_date=payment_date
        )
        db.session.add(payment)

    def validate_amount(self):
        #Ensure amount is positive
        return self.amount > 0

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'amount': float(self.amount),
            'category': self.category,
            'due_date': self.due_date.isoformat(),
            'recurring_type': self.recurring_type,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'status': self.status,
            'is_overdue': self.is_overdue,
            'days_until_due': self.days_until_due,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
class BillPayment(db.Model):
    __tablename__ = 'bill_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id', ondelete='SET NULL'), nullable=True)
    bill_name = db.Column(db.String(255), nullable=False)  # Stored for history even if bill is deleted
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    original_due_date = db.Column(db.Date, nullable=False)
    paid_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Index for better query performance
    __table_args__ = (
        Index('idx_user_paid_date', 'user_id', 'paid_date'),
    )

    def __repr__(self):
        return f'<BillPayment {self.bill_name}: ${self.amount} paid {self.paid_date}>'

    @property
    def was_paid_late(self):
        #Check if bill was paid after due date
        return self.paid_date > self.original_due_date

    @property
    def days_late(self):
        #Number of days late (0 if paid on time)
        if self.was_paid_late:
            return (self.paid_date - self.original_due_date).days
        return 0

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bill_id': self.bill_id,
            'bill_name': self.bill_name,
            'amount': float(self.amount),
            'category': self.category,
            'original_due_date': self.original_due_date.isoformat(),  # Fixed: was self.due_date
            'paid_date': self.paid_date.isoformat(),
            'was_paid_late': self.was_paid_late,
            'days_late': self.days_late,
            'created_at': self.created_at.isoformat(),
        }

class Reminder(db.Model):
    #Store custom reminders and alerts for users
    __tablename__ = 'reminders'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    reminder_type = db.Column(db.Enum('budget_alert', 'bill_due', 'custom', name='reminder_types'), 
                             nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    dismissed_at = db.Column(db.DateTime, nullable=True)
    
    # Index for better query performance
    __table_args__ = (
        Index('idx_user_active', 'user_id', 'is_active'),
    )

    def __repr__(self):
        return f'<Reminder {self.reminder_type}: {self.message[:50]}...>'
    
    def dismiss(self):
        #Dismiss the reminder
        self.is_active = False
        self.dismissed_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'message': self.message,
            'reminder_type': self.reminder_type,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'dismissed_at': self.dismissed_at.isoformat() if self.dismissed_at else None  # Fixed: handle None case
        }