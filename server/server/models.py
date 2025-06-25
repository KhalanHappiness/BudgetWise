from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from datetime import datetime, date

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

 

