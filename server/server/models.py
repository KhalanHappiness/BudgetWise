from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from datetime import datetime, date
from sqlalchemy import UniqueConstraint, Index

# Define naming convention
metadata = MetaData(naming_convention={
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
})

# Initialize db with metadata
db = SQLAlchemy(metadata=metadata)

class User(db.model):

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    is_demo_user =db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    #Relationships

    budgets = db.relationship('Budget', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    expenses = db.relationship('Expense', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    bills = db.relationship('Bill', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    bill_payments = db.relationship('BillPayment', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    reminders = db.relationship('Reminder', backref='user', cascade='all, delete-orphan', lazy='dynamic') 

    


    def to_dict(self):
        return {
            'id' : self.id,
            'username': self.username,
            'email': self.email
        
        
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

    

    @property
    def variance(self):
        return self.spent_amount - self.budgeted_amount

    @property
    def percentage_used(self):
        if self.budgeted_amount == 0:
            return 0
        return float(self.spent_amount / self.budgeted_amount * 100)
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category.to_dict() if self.category else None,
            'budgeted_amount': float(self.budgeted_amount),
            'spent_amount': float(self.spent_amount),
            'variance': float(self.variance),
            'percentage_used': round(self.percentage_used, 2),
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

    budgets = db.relationship('Budget', back_populates='category', cascade='all, delete-orphan')
    expenses = db.relationship('Expense', back_populates='category', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
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
        """True if bill is overdue and unpaid"""
        return self.status == 'overdue'

    def mark_paid(self, paid_date=None):
        self.paid_date = paid_date or date.today()

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
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
class BillPayment(db.Model):
    __tablename__ = 'bill_payments'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
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

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bill_id': self.bill_id,
            'bill_name': self.bill_name,
            'amount': float(self.amount),
            'category': self.category,
            'due_date': self.due_date.isoformat(),
            'paid_date': self.paid_date.isoformat(),
            'created_at': self.created_at.isoformat(),
        }
    
    
    

    
   




 

