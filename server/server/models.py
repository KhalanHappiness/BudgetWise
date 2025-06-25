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

    budgets = db.relationship('Budget', back_populates = 'user', cascade='all, delete-orphan')
    expenses = db.relationship('Expense', back_populates = 'user', cascade ='all, delete-orphan')
    bills = db.relationship('Bill', back_populates = 'user', cascade ='all, delete-orphan')
    bill_payments = db.relationship('BillPayment', back_populates = 'user', cascade ='all, delete-orphan')
    reminders = db.relationship('Reminder', back_populates = 'user', cascade ='all, delete-orphan')

    


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
    user = db.relationship('User', back_populates='budgets')

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



 

