from flask import Flask, jsonify, make_response, request,g
from flask_cors import CORS
from flask_restful import Api, Resource # Enfocing RESTFul principles
from flask_migrate import Migrate
from datetime import datetime

import os

from models import db, User, Budget, Bill, BillPayment, Expense, Reminder, Category

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.json.compact = False

# Initialize extensions

CORS(app)

migrate = Migrate(app, db)

db.init_app(app)

api = Api(app) # we link our flask app to flaks_restful


# --- Demo User Handling ---

# Define demo user credentials (for creating if it doesn't exist)
DEMO_USERNAME = "demo_budget_user"
DEMO_EMAIL = "demo@budgetapp.com"
DEMO_PASSWORD_HASH = "hashed_demo_password" # In a real app, this should be a properly hashed password

# Define demo user credentials (for creating if it doesn't exist)
DEMO_USERNAME = "demo_budget_user"
DEMO_EMAIL = "demo@budgetapp.com"
DEMO_PASSWORD_HASH = "hashed_demo_password" # In a real app, this should be a properly hashed password

def get_or_create_demo_user():
    """
    Retrieves a suitable demo user from the database.
    Prioritizes an existing user marked as a demo user.
    If no such user exists, it tries to find any existing user.
    If no users exist at all, it creates a new demo user.
    This function should be called within an application context.
    """
    with app.app_context(): # Ensure we are in an app context for database operations
        # 1. Try to find a user explicitly marked as a demo user
        demo_user = User.query.filter_by(is_demo_user=True).first()
        if demo_user:
            print(f"Using existing demo user: {demo_user.username} (ID: {demo_user.id})")
            return demo_user

        # 2. If no explicit demo user, try to find any existing user
        any_user = User.query.first()
        if any_user:
            print(f"No explicit demo user found. Using first existing user: {any_user.username} (ID: {any_user.id})")
            return any_user

        # 3. If no users at all, create a new demo user
        print(f"No users found in database. Creating new demo user: {DEMO_USERNAME}")
        new_demo_user = User(
            username=DEMO_USERNAME,
            email=DEMO_EMAIL,
            password_hash=DEMO_PASSWORD_HASH,
            is_demo_user=True
        )
        db.session.add(new_demo_user)
        db.session.commit()
        return new_demo_user

@app.before_request
def before_request_load_user():
    """
    This function runs before every request. It determines the user_id
    for the current request. If no explicit user_id is provided (e.g.,
    from an authentication token/session, which is not yet implemented),
    it defaults to a suitable demo user's ID.
    """
    # In a full authentication system, you would typically get the user_id
    # from a session, a JWT token, or an API key after validation.
    # For this demo, we'll look for 'X-User-Id' in headers or 'user_id' in query params.

    user_id_from_header = request.headers.get('X-User-Id', type=int)
    user_id_from_query = request.args.get('user_id', type=int)

    if user_id_from_header:
        g.user_id = user_id_from_header
    elif user_id_from_query:
        g.user_id = user_id_from_query
    else:
        # If no user ID is explicitly provided, use the demo user.
        # This allows all endpoints to function without explicit login initially.
        demo_user = get_or_create_demo_user()
        g.user_id = demo_user.id
   


@app.route('/')
def hello():
    return "Hello, World!"



class Categories(Resource):
    def get(self):
        categories = Category.query.order_by(Category.name).all()
        
        categories_dict = [cat.to_dict() for cat in categories]

        response = make_response(
            categories_dict,   
            200
        )

        return response

    def post(self):
        data = request.get_json()

        #validation
        if not data or 'name' not in data:
            return {'error': 'name is required'}, 400

        try:
            category = Category(
                name=data['name'], 
                description=data.get('description')
                )
            db.session.add(category)
            db.session.commit()

            return make_response(
                category.to_dict(), 
                201)
        
        except Exception as e:
            db.session.rollback()

            if "UNIQUE constraint failed" in str(e):
                return {'error': 'Category name already exists'}, 400
            return {'error': str(e)}, 500


class Budgets(Resource):

    def get(self):

        user_id = g.user_id

        budgets = Budget.query.filter_by(user_id=user_id).all()

        budget_Dict = [user.to_dict() for user in budgets]

        response = make_response(
            budget_Dict,
            200)
        
        return response
    
    def post(self):
        try:
            data = request.get_json()
            
            # Add debug logging
            print(f"Received data: {data}")
            print(f"User ID from g: {g.user_id}")
            
            # Validation
            if not data:
                return {'error': 'No data provided'}, 400
                
            if 'category_id' not in data or not data['category_id']:
                return {'error': 'category_id is required'}, 400
                
            if 'budgeted_amount' not in data or not data['budgeted_amount']:
                return {'error': 'budgeted_amount is required'}, 400
            
            # Convert and validate data types
            try:
                category_id = int(data['category_id'])
                budgeted_amount = float(data['budgeted_amount'])
            except (ValueError, TypeError) as e:
                return {'error': f'Invalid data format: {str(e)}'}, 400
            
            # Check if category exists
            category = Category.query.get(category_id)
            if not category:
                return {'error': 'Category not found'}, 404
            
            # Check for existing budget for this user/category combination
            existing_budget = Budget.query.filter_by(
                user_id=g.user_id, 
                category_id=category_id
            ).first()
            
            if existing_budget:
                return {'error': 'Budget already exists for this category'}, 409
            
            # Create new budget
            budget = Budget(
                user_id=g.user_id,
                category_id=category_id,
                budgeted_amount=budgeted_amount
            )
            
            db.session.add(budget)
            db.session.commit()
            
            # Return the created budget with all related data
            return make_response(budget.to_dict(), 201)
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating budget: {str(e)}")
            
            # Handle specific database constraint errors
            if "UNIQUE constraint failed" in str(e):
                return {'error': 'Budget already exists for this category'}, 409
            elif "FOREIGN KEY constraint failed" in str(e):
                return {'error': 'Invalid category or user reference'}, 400
            else:
                return {'error': f'Database error: {str(e)}'}, 500
            
class Expenses(Resource):

    def get(self):
        #Get all expenses for the current user with optional filtering
        user_id = g.user_id
        category_id = request.args.get('category_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', type=int)

        query = Expense.query.filter_by(user_id=user_id)

        if category_id:
            query = query.filter_by(category_id=category_id)

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(Expense.expense_date >= start)
            except ValueError:
                return make_response({'error': 'Invalid start_date format. Use YYYY-MM-DD'}, 400)

        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(Expense.expense_date <= end)
            except ValueError:
                return make_response({'error': 'Invalid end_date format. Use YYYY-MM-DD'}, 400)

        query = query.order_by(Expense.expense_date.desc())

        if limit:
            query = query.limit(limit)

        expenses = query.all()
        total_amount = sum(float(exp.amount) for exp in expenses)

        data = {
            'expenses': [exp.to_dict() for exp in expenses],
            'count': len(expenses),
            'total_amount': total_amount
        }

        return make_response(data, 200)
    
    def post(self):
        #Create a new expense for the current user

        data = request.get_json()

        required_fields = ['category_id', 'description', 'amount', 'expense_date']

        for field in required_fields:
            if field not in data:
                return make_response({'error': f'{field} is required'}, 400)
            
        try:
            expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d').date()

            expense = Expense(
            user_id=g.user_id, 
            category_id=data['category_id'],
            description=data['description'],
            amount=float(data['amount']),
            expense_date=expense_date
            )

            
            
            db.session.add(expense)
            db.session.commit()

            return make_response(
                expense.to_dict(),
                201
            )
        except ValueError:
            return make_response(
                {'error':'Invalide date format'},
                400)
        except Exception as e:
            db.session.rollback()
            return make_response(
                {'error':str(e)},
                500)
        
class Bills(Resource):

    def get(self):
         """Get all bills for the current user with optional filtering"""
         user_id = g.user_id # Use user_id from g object
         status = request.args.get('status')  # paid, overdue, upcoming
         category = request.args.get('category')
        
         query = Bill.query.filter_by(user_id=user_id)
        
         if category:
            query = query.filter_by(category=category)
        
         bills = query.order_by(Bill.due_date.asc()).all()
        
        # Filter by status if specified
         if status:
            bills = [bill for bill in bills if bill.status == status]
        
         data ={
            'bills': [bill.to_dict() for bill in bills],
            'count': len(bills)
         }

         return make_response(data, 200)
    
class PayBills(Resource):
    def post (self, bill_id):

        #Pay a bill and create next recurring bill
        user_id = g.user_id

        #Get the bill

        bill = Bill.query.filter_by(id=bill_id, user_id=user_id).first()

        if not bill:
            return make_response({'error':'Bill not found'}, 404)
        
        if bill.status == 'paid':
            return make_response(
                {'error':'Bill already paid'}, 
                400)
        
        #Get optional paid_date from request

        data = request.get_json() or {}
        paid_date =None

        if paid_date in data:
            try:
                paid_date = datetime.strptime(data['paid_date'], '%Y-%m-%d').date()
            except ValueError:
                return make_response({'error': 'Invalid date format. Use YYYY-MM-DD'}, 400)
            
        try:
            # Mark as paid and create next bill
            payment, next_bill = bill.mark_paid_and_create_next(paid_date)
            
            db.session.commit()
            
            response = {
                'message': 'Bill paid successfully',
                'paid_bill': bill.to_dict(),
                'payment_record': payment.to_dict()
            }
            
            if next_bill:
                response['next_bill'] = next_bill.to_dict()
                response['message'] += f' and next {bill.recurring_type} bill created'
            
            return make_response(
                response, 
                200)
        
        except Exception as e:
            db.session.rollback()
            return make_response({'error': f'Payment failed: {str(e)}'}, 500)



            
    







api.add_resource(Categories, '/categories')
   
api.add_resource(Budgets, '/budgets')

api.add_resource(Expenses, '/expenses')

api.add_resource(Bills, '/bills')

api.add_resource(PayBills, '/bills/<int:bill_id>/pay')
