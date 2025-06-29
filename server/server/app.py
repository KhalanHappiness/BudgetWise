from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, make_response, request, g
from flask_cors import CORS
from flask_restful import Api, Resource
from flask_migrate import Migrate
from datetime import datetime, date, timedelta
from sqlalchemy import func
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity,
    set_access_cookies, unset_jwt_cookies
)
import bcrypt
import os
import logging

from functools import wraps

from models import db, User, Budget, Bill, BillPayment, Expense, Reminder, Category

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_TOKEN_LOCATION = ['headers']  # Just use headers - much simpler!
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

# Validate required environment variables
if not Config.JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")

# Apply configuration
app.config.from_object(Config)
app.json.compact = False

# Initialize extensions
CORS(app)
migrate = Migrate(app, db)
db.init_app(app)
jwt = JWTManager(app)
api = Api(app)

# --- Utility Functions ---
def create_response(data=None, message=None, error=None, status=200):
    """Create consistent API response format"""
    response = {}
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
    if error:
        response['error'] = error
    return make_response(response, status)

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present and not empty"""
    if not data:
        return "No data provided"
    
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return f"{field} is required"
    return None

def sanitize_input(text):
    """Basic input sanitization"""
    if isinstance(text, str):
        return text.strip()
    return text

def get_current_user():
    """Helper function to get current user from JWT token"""
    try:
        current_user_email = get_jwt_identity()
        if not current_user_email:
            return None
        user = User.query.filter_by(email=current_user_email).first()
        return user
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        return None



# --- JWT Error Handlers ---
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return create_response(error='Token has expired', status=401)

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return create_response(error='Invalid token', status=401)

@jwt.unauthorized_loader
def missing_token_callback(error):
    return create_response(error='Authentication required', status=401)

# --- Request Handlers ---
@app.before_request
def before_request_load_user():
    """Skip authentication for public endpoints"""
    public_endpoints = ['register', 'login', 'hello']
    if request.endpoint in public_endpoints:
        return

# --- Routes ---
@app.route('/')
def hello():
    return "Budget App API - v1.0"

# --- Authentication Resources ---
class Register(Resource):
    def post(self):
        try:
            data = request.get_json()
            
            # Validate input
            validation_error = validate_required_fields(data, ['username', 'password', 'email'])
            if validation_error:
                return create_response(error=validation_error, status=400)
            
            username = sanitize_input(data["username"])
            password = data["password"]
            email = sanitize_input(data['email'])

            # Check if user already exists
            if User.query.filter_by(email=email).first():
                return create_response(error='User with this email already exists', status=400)
            
            if User.query.filter_by(username=username).first():
                return create_response(error='Username already taken', status=400)

            # Create user
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            new_user = User(email=email, username=username, password_hash=hashed)
            db.session.add(new_user)
            db.session.commit()

            logger.info(f"New user registered: {username}")
            return create_response(message='User created successfully', status=201)
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            db.session.rollback()
            return create_response(error='Failed to create user', status=500)

class Login(Resource):
    def post(self):
        try:
            data = request.get_json()
            
            validation_error = validate_required_fields(data, ['email', 'password'])
            if validation_error:
                return create_response(error=validation_error, status=400)
            
            password = data["password"]
            email = sanitize_input(data["email"])

            user = User.query.filter_by(email=email).first()
            if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash):
                access_token = create_access_token(identity=email)
                
                logger.info(f"User logged in: {user.username}")
                return create_response(
                    data={
                        'user_id': user.id, 
                        'username': user.username,
                        'access_token': access_token  # Return token to client
                    },
                    message=f'Welcome {user.username}',
                    status=200
                )
            
            logger.warning(f"Failed login attempt for email: {email}")
            return create_response(error='Invalid credentials', status=401)
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return create_response(error='Login failed', status=500)

class Logout(Resource):
    @jwt_required()
    def post(self):
        try:
            current_user = get_current_user()
            response = create_response(message='Successfully logged out')
            unset_jwt_cookies(response)
            if current_user:
                logger.info(f"User logged out: {current_user.username}")
            return response
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return create_response(error='Logout failed', status=500)

class ReadCookies(Resource):
    def get(self):
        cookie_value = request.cookies.get("username")

        return make_response(f"cookie: {cookie_value}")

# --- Categories Resource ---
class Categories(Resource):
    
    def get(self):
        try:
            categories = Category.query.order_by(Category.name).all()
            categories_data = [cat.to_dict() for cat in categories]
            return create_response(data={'categories': categories_data})
        except Exception as e:
            logger.error(f"Error fetching categories: {str(e)}")
            return create_response(error='Failed to fetch categories', status=500)

    def post(self):
        try:
            data = request.get_json()

            validation_error = validate_required_fields(data, ['name'])
            if validation_error:
                return create_response(error=validation_error, status=400)

            category = Category(
                name=sanitize_input(data['name']), 
                description=sanitize_input(data.get('description', '')) or None
            )
            db.session.add(category)
            db.session.commit()

            logger.info(f"Category created: {category.name}")
            return create_response(data=category.to_dict(), status=201)
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating category: {str(e)}")
            
            if "UNIQUE constraint failed" in str(e):
                return create_response(error='Category name already exists', status=400)
            return create_response(error='Failed to create category', status=500)

# --- Budgets Resource ---
class Budgets(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
            
            budgets = Budget.query.filter_by(user_id=current_user.id).all()
            budgets_data = [budget.to_dict() for budget in budgets]
            return create_response(data={'budgets': budgets_data})
        except Exception as e:
            logger.error(f"Error fetching budgets: {str(e)}")
            return create_response(error='Failed to fetch budgets', status=500)
    
    @jwt_required()
    def post(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            data = request.get_json()
            
            validation_error = validate_required_fields(data, ['category_id', 'budgeted_amount'])
            if validation_error:
                return create_response(error=validation_error, status=400)
            
            # Validate data types
            try:
                category_id = int(data['category_id'])
                budgeted_amount = float(data['budgeted_amount'])
                
                if budgeted_amount <= 0:
                    return create_response(error='Budgeted amount must be positive', status=400)
                    
            except (ValueError, TypeError):
                return create_response(error='Invalid data format', status=400)
            
            # Check if category exists
            category = Category.query.get(category_id)
            if not category:
                return create_response(error='Category not found', status=404)
            
            # Check for existing budget
            existing_budget = Budget.query.filter_by(
                user_id=current_user.id, 
                category_id=category_id
            ).first()
            
            if existing_budget:
                return create_response(error='Budget already exists for this category', status=409)
            
            # Create new budget
            budget = Budget(
                user_id=current_user.id,
                category_id=category_id,
                budgeted_amount=budgeted_amount
            )
            
            db.session.add(budget)
            db.session.commit()
            
            logger.info(f"Budget created for user {current_user.username}, category {category.name}")
            return create_response(data=budget.to_dict(), status=201)
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating budget: {str(e)}")
            return create_response(error='Failed to create budget', status=500)

# --- Expenses Resource ---
class Expenses(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            category_id = request.args.get('category_id', type=int)
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            limit = request.args.get('limit', type=int)

            query = Expense.query.filter_by(user_id=current_user.id)

            if category_id:
                query = query.filter_by(category_id=category_id)

            if start_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m-%d').date()
                    query = query.filter(Expense.expense_date >= start)
                except ValueError:
                    return create_response(error='Invalid start_date format. Use YYYY-MM-DD', status=400)

            if end_date:
                try:
                    end = datetime.strptime(end_date, '%Y-%m-%d').date()
                    query = query.filter(Expense.expense_date <= end)
                except ValueError:
                    return create_response(error='Invalid end_date format. Use YYYY-MM-DD', status=400)

            query = query.order_by(Expense.expense_date.desc())

            if limit and limit > 0:
                query = query.limit(limit)

            expenses = query.all()
            total_amount = sum(float(exp.amount) for exp in expenses)

            data = {
                'expenses': [exp.to_dict() for exp in expenses],
                'count': len(expenses),
                'total_amount': total_amount
            }

            return create_response(data=data)
        except Exception as e:
            logger.error(f"Error fetching expenses: {str(e)}")
            return create_response(error='Failed to fetch expenses', status=500)
    
    @jwt_required()
    def post(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            data = request.get_json()

            validation_error = validate_required_fields(data, ['category_id', 'description', 'amount', 'expense_date'])
            if validation_error:
                return create_response(error=validation_error, status=400)
            
            # Validate amount
            try:
                amount = float(data['amount'])
                if amount <= 0:
                    return create_response(error='Amount must be positive', status=400)
            except (ValueError, TypeError):
                return create_response(error='Invalid amount format', status=400)
            
            # Validate date
            try:
                expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d').date()
            except ValueError:
                return create_response(error='Invalid date format. Use YYYY-MM-DD', status=400)
            
            # Validate category
            category = Category.query.get(data['category_id'])
            if not category:
                return create_response(error='Category not found', status=404)

            expense = Expense(
                user_id=current_user.id, 
                category_id=data['category_id'],
                description=sanitize_input(data['description']),
                amount=amount,
                expense_date=expense_date
            )
            
            db.session.add(expense)
            db.session.commit()

            logger.info(f"Expense created for user {current_user.username}: {expense.description}")
            return create_response(data=expense.to_dict(), status=201)
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating expense: {str(e)}")
            return create_response(error='Failed to create expense', status=500)

# --- Bills Resource ---
class Bills(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                 
            status = request.args.get('status')
            category = request.args.get('category')
            
            query = Bill.query.filter_by(user_id=current_user.id)
            
            if category:
                query = query.filter_by(category=category)
            
            bills = query.order_by(Bill.due_date.asc()).all()
            
            # Filter by status if specified
            if status:
                bills = [bill for bill in bills if bill.status == status]
            
            data = {
                'bills': [bill.to_dict() for bill in bills],
                'count': len(bills)
            }

            return create_response(data=data)
        except Exception as e:
            logger.error(f"Error fetching bills: {str(e)}")
            return create_response(error='Failed to fetch bills', status=500)

    @jwt_required()
    def post(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            data = request.get_json()

            validation_error = validate_required_fields(data, ['name', 'amount', 'category', 'due_date'])
            if validation_error:
                return create_response(error=validation_error, status=400)
            
            # Validate amount
            try:
                amount = float(data['amount'])
                if amount <= 0:
                    return create_response(error='Amount must be positive', status=400)
            except (ValueError, TypeError):
                return create_response(error='Invalid amount format', status=400)
            
            # Validate date
            try:
                due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            except ValueError:
                return create_response(error='Invalid date format. Use YYYY-MM-DD', status=400)

            bill = Bill(
                user_id=current_user.id,
                name=sanitize_input(data['name']),
                amount=amount,
                category=sanitize_input(data['category']),
                due_date=due_date,
                recurring_type=data.get('recurring_type', 'monthly')
            )

            db.session.add(bill)
            db.session.commit()

            logger.info(f"Bill created for user {current_user.username}: {bill.name}")
            return create_response(data=bill.to_dict(), status=201)

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating bill: {str(e)}")
            return create_response(error='Failed to create bill', status=500)

# --- Bills By ID Resource ---
class BillsById(Resource):
    @jwt_required()
    def get(self, bill_id):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()
            if not bill:
                return create_response(error='Bill not found', status=404)
            return create_response(data=bill.to_dict())
        except Exception as e:
            logger.error(f"Error fetching bill: {str(e)}")
            return create_response(error='Failed to fetch bill', status=500)

    @jwt_required()
    def put(self, bill_id):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()
            if not bill:
                return create_response(error='Bill not found', status=404)
            
            data = request.get_json()
            if not data:
                return create_response(error='No data provided', status=400)
            
            # Update fields if provided
            if 'name' in data:
                bill.name = sanitize_input(data['name'])
            if 'amount' in data:
                try:
                    amount = float(data['amount'])
                    if amount <= 0:
                        return create_response(error='Amount must be positive', status=400)
                    bill.amount = amount
                except (ValueError, TypeError):
                    return create_response(error='Invalid amount format', status=400)
            if 'category' in data:
                bill.category = sanitize_input(data['category'])
            if 'due_date' in data:
                try:
                    bill.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
                except ValueError:
                    return create_response(error='Invalid date format. Use YYYY-MM-DD', status=400)
            if 'recurring_type' in data:
                bill.recurring_type = data['recurring_type']
            
            db.session.commit()
            logger.info(f"Bill updated for user {current_user.username}: {bill.name}")
            return create_response(data=bill.to_dict())
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating bill: {str(e)}")
            return create_response(error='Failed to update bill', status=500)

    @jwt_required()
    def delete(self, bill_id):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()
            if not bill:
                return create_response(error='Bill not found', status=404)

            bill_name = bill.name
            db.session.delete(bill)
            db.session.commit()
            
            logger.info(f"Bill deleted for user {current_user.username}: {bill_name}")
            return create_response(message='Bill deleted successfully')
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting bill: {str(e)}")
            return create_response(error='Failed to delete bill', status=500)

# --- Pay Bills Resource ---
class PayBills(Resource):
    @jwt_required()
    def post(self, bill_id):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()

            if not bill:
                return create_response(error='Bill not found', status=404)
            
            if bill.status == 'paid':
                return create_response(error='Bill already paid', status=400)
            
            data = request.get_json() or {}
            paid_date = None

            if 'paid_date' in data:
                try:
                    paid_date = datetime.strptime(data['paid_date'], '%Y-%m-%d').date()
                except ValueError:
                    return create_response(error='Invalid date format. Use YYYY-MM-DD', status=400)
            
            # Mark as paid and create next bill
            payment, next_bill = bill.mark_paid_and_create_next(paid_date)
            
            db.session.commit()
            
            response_data = {
                'paid_bill': bill.to_dict(),
                'payment_record': payment.to_dict()
            }
            
            message = 'Bill paid successfully'
            if next_bill:
                response_data['next_bill'] = next_bill.to_dict()
                message += f' and next {bill.recurring_type} bill created'
            
            logger.info(f"Bill paid for user {current_user.username}: {bill.name}")
            return create_response(data=response_data, message=message)
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Payment error: {str(e)}")
            return create_response(error=f'Payment failed: {str(e)}', status=500)

# --- Bill Payments Resource ---
class BillPayments(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            payments = BillPayment.query.filter_by(user_id=current_user.id).order_by(BillPayment.paid_date.desc()).all()

            total_amount = sum(float(payment.amount) for payment in payments)
            late_payments = [p for p in payments if p.was_paid_late]

            data = {
                'payments': [payment.to_dict() for payment in payments],
                'summary': {
                    'count': len(payments),
                    'total_amount': total_amount,
                    'late_payments': len(late_payments),
                    'average_amount': round(total_amount / len(payments), 2) if payments else 0
                }
            }
            
            return create_response(data=data)
        except Exception as e:
            logger.error(f"Error fetching bill payments: {str(e)}")
            return create_response(error='Failed to fetch bill payments', status=500)

# --- Dashboard Resource ---
class Dashboards(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            today = date.today()
            thirty_days_ago = today - timedelta(days=30)
            start_of_month = today.replace(day=1)

            budgets = Budget.query.filter_by(user_id=current_user.id).all()

            recent_expenses = Expense.query.filter(
                Expense.user_id == current_user.id,
                Expense.expense_date >= thirty_days_ago
            ).order_by(Expense.expense_date.desc()).limit(10).all()

            month_expenses = Expense.query.filter(
                Expense.user_id == current_user.id,
                Expense.expense_date >= start_of_month
            ).all()

            upcoming_bills = Bill.query.filter(
                Bill.user_id == current_user.id,
                Bill.paid_date.is_(None),
                Bill.due_date >= today,
                Bill.due_date <= today + timedelta(days=7)
            ).all()

            overdue_bills = Bill.query.filter(
                Bill.user_id == current_user.id,
                Bill.paid_date.is_(None),
                Bill.due_date < today
            ).all()

            # Calculate totals
            total_budgeted = sum(float(budget.budgeted_amount) for budget in budgets)
            total_spent_budgets = sum(float(budget.spent_amount) for budget in budgets)
            month_expense_total = sum(float(expense.amount) for expense in month_expenses)

            data = {
                'user': current_user.to_dict(),
                'summary': {
                    'total_budgeted': total_budgeted,
                    'total_spent_budgets': total_spent_budgets,
                    'budget_utilization': (total_spent_budgets / total_budgeted * 100) if total_budgeted > 0 else 0,
                    'month_expenses_total': month_expense_total,
                    'overdue_bills_count': len(overdue_bills),
                    'overdue_bills_amount': sum(float(bill.amount) for bill in overdue_bills),
                    'upcoming_bills_count': len(upcoming_bills),
                },
                'budgets': [budget.to_dict() for budget in budgets],
                'recent_expenses': [expense.to_dict() for expense in recent_expenses],
                'overdue_bills': [bill.to_dict() for bill in overdue_bills],
                'upcoming_bills': [bill.to_dict() for bill in upcoming_bills],
            }

            return create_response(data=data)

        except Exception as e:
            logger.error(f"Error fetching dashboard data: {str(e)}")
            return create_response(error='Failed to fetch dashboard data', status=500)

# --- Insights Resource ---
class Insights(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user = get_current_user()
            if not current_user:
                return create_response(error='User not found', status=404)
                
            today = date.today()
            start_of_month = today.replace(day=1)
            start_of_last_month = (start_of_month - timedelta(days=1)).replace(day=1)
            end_of_last_month = start_of_month - timedelta(days=1)
            last_30_days = today - timedelta(days=30)

            # Budget Utilization
            total_budgeted = db.session.query(func.sum(Budget.budgeted_amount)).filter(Budget.user_id == current_user.id).scalar() or 0
            total_spent_budgets = db.session.query(func.sum(Expense.amount)).filter(
                Expense.user_id == current_user.id,
                Expense.expense_date >= start_of_month

            ).scalar() or 0
            budget_utilization = (total_spent_budgets / total_budgeted * 100) if total_budgeted > 0 else 0

            # Spending by Category
            category_spending = db.session.query(
                Category.name,
                func.sum(Expense.amount)
            ).join(Expense).filter(
                Expense.user_id == current_user.id
            ).group_by(Category.name).all()
            category_spending_data = [
                {"category": name, "total_spent": float(total)} for name, total in category_spending
            ]

            # Spending Over Time (last 30 days)
            daily_spending = db.session.query(
                Expense.expense_date,
                func.sum(Expense.amount)
            ).filter(
                Expense.user_id == current_user.id,
                Expense.expense_date >= last_30_days
            ).group_by(Expense.expense_date).order_by(Expense.expense_date).all()
            spending_timeline = [
                {"date": str(date), "amount": float(amount)} for date, amount in daily_spending
            ]

            
            # Bills Summary
            upcoming_bills_count = Bill.query.filter(
                Bill.user_id == current_user.id,
                Bill.paid_date.is_(None),
                Bill.due_date >= today
            ).count()
            overdue_bills = Bill.query.filter(
                Bill.user_id == current_user.id,
                Bill.due_date < today
            ).all()
            overdue_bills_count = len(overdue_bills)
            overdue_bills_amount = sum(float(bill.amount) for bill in overdue_bills)


             # Monthly Comparison
            this_month_spending = db.session.query(func.sum(Expense.amount)).filter(
                Expense.user_id == current_user.id,
                Expense.expense_date >= start_of_month
            ).scalar() or 0
            last_month_spending = db.session.query(func.sum(Expense.amount)).filter(
                Expense.user_id == current_user.id,
                Expense.expense_date >= start_of_last_month,
                Expense.expense_date <= end_of_last_month
            ).scalar() or 0

            
            insights_data = {
                "budget_utilization": {
                    "total_budgeted": float(total_budgeted),
                    "total_spent": float(total_spent_budgets),
                    "utilization_percent": round(budget_utilization, 2)
                },
                "category_spending": category_spending_data,
                "spending_timeline": spending_timeline,
                "bills_summary": {
                    "upcoming_bills_count": upcoming_bills_count,
                    "overdue_bills_count": overdue_bills_count,
                    "overdue_bills_amount": round(overdue_bills_amount, 2)
                },
                "monthly_comparison": {
                    "this_month_spending": float(this_month_spending),
                    "last_month_spending": float(last_month_spending)
                }
            }

            return create_response(data=insights_data, status=200)


        except Exception as e:
            return create_response(error=str(e), status=500)






# Add resources to API
api.add_resource(Register, '/register')
api.add_resource(Login, '/login')
api.add_resource(Logout, '/logout')
api.add_resource(ReadCookies, '/read-cookie')
api.add_resource(Categories, '/categories')
api.add_resource(Budgets, '/budgets')
api.add_resource(Expenses, '/expenses')
api.add_resource(Bills, '/bills')
api.add_resource(PayBills, '/bills/<int:bill_id>/pay')
api.add_resource(BillsById, '/bills/<int:bill_id>')
api.add_resource(BillPayments, '/billpayments')
api.add_resource(Dashboards, '/dashboard')
api.add_resource(Insights, '/insights')


if __name__ == '__main__':
    app.run(debug=True)