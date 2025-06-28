from flask import Flask, jsonify, make_response, request, g
from flask_cors import CORS
from flask_restful import Api, Resource  # Enforcing RESTful principles
from flask_migrate import Migrate
from datetime import datetime, date
from datetime import date, timedelta
from sqlalchemy import func

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
api = Api(app)  # Link our Flask app to Flask-RESTful


# --- Demo User Handling ---

# Define demo user credentials (for creating if it doesn't exist)
DEMO_USERNAME = "demo_budget_user"
DEMO_EMAIL = "demo@budgetapp.com"
DEMO_PASSWORD_HASH = "hashed_demo_password"  # In a real app, this should be a properly hashed password


def get_or_create_demo_user():
    """
    Retrieves a suitable demo user from the database.
    Prioritizes an existing user marked as a demo user.
    If no such user exists, it tries to find any existing user.
    If no users exist at all, it creates a new demo user.
    This function should be called within an application context.
    """
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
        return make_response(categories_dict, 200)

    def post(self):
        data = request.get_json()

        # Validation
        if not data or 'name' not in data:
            return {'error': 'name is required'}, 400

        try:
            category = Category(
                name=data['name'], 
                description=data.get('description')
            )
            db.session.add(category)
            db.session.commit()

            return make_response(category.to_dict(), 201)
        
        except Exception as e:
            db.session.rollback()

            if "UNIQUE constraint failed" in str(e):
                return {'error': 'Category name already exists'}, 400
            return {'error': str(e)}, 500


class Budgets(Resource):
    def get(self):
        user_id = g.user_id
        budgets = Budget.query.filter_by(user_id=user_id).all()
        budget_dict = [budget.to_dict() for budget in budgets]
        return make_response(budget_dict, 200)
    
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
        # Get all expenses for the current user with optional filtering
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
        # Create a new expense for the current user
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

            return make_response(expense.to_dict(), 201)
            
        except ValueError:
            return make_response({'error': 'Invalid date format'}, 400)
        except Exception as e:
            db.session.rollback()
            return make_response({'error': str(e)}, 500)


class Bills(Resource):
    def get(self):
        # Get all bills for the current user with optional filtering
        user_id = g.user_id 
        status = request.args.get('status')  # paid, overdue, upcoming
        category = request.args.get('category')
        
        query = Bill.query.filter_by(user_id=user_id)
        
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

        return make_response(data, 200)

    def post(self):

        #Create a new bill for the current user

        data = request.get_json()

        required_fields = ['name', 'amount', 'category', 'due_date']

        for field in required_fields:

            if field not in data:

                return make_response({'error': f'{field} is required'}, 400)
        try:
            due_date =  datetime.strptime(data['due_date'], '%Y-%m-%d').date()

            bill = Bill(
                user_id=g.user_id, # Use user_id from g object
                name=data['name'],
                amount=float(data['amount']),
                category=data['category'],
                due_date=due_date,
                recurring_type=data.get('recurring_type', 'monthly')
           )

            if not bill.validate_amount():
                return make_response({'error': 'Amount must be positive'}, 400)
            
            db.session.add(bill)
            db.session.commit()

            return make_response(
                bill.to_dict(),
                201
            )

        except ValueError as e:
             return make_response(
                {'error': 'Invalid date format.'},
                400)
        except Exception as e:
             db.session.rollback()
             return make_response(
                {'error': str(e)},
                500)





class PayBills(Resource):
    def post(self, bill_id):
        # Pay a bill and create next recurring bill
        user_id = g.user_id

        # Get the bill
        bill = Bill.query.filter_by(id=bill_id, user_id=user_id).first()

        if not bill:
            return make_response({'error': 'Bill not found'}, 404)
        
        if bill.status == 'paid':
            return make_response({'error': 'Bill already paid'}, 400)
        
        # Get optional paid_date from request
        data = request.get_json() or {}
        paid_date = None

        if 'paid_date' in data:  # Fixed variable name check
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
            
            return make_response(response, 200)
        
        except Exception as e:
            db.session.rollback()
            return make_response({'error': f'Payment failed: {str(e)}'}, 500)


class BillPayments(Resource):
    def get(self):
        # Get all the bill payment history for the current user
        user_id = g.user_id

        payments = BillPayment.query.filter_by(user_id=user_id).order_by(BillPayment.paid_date.desc()).all()

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
        
        return make_response(data, 200)

class Dashboards(Resource):
    def get(self):
        #Get comprehensive dashboard data for current user
        user_id = g.user_id

        try:
            #Get date ranges
            today = date.today()
            thirty_days_ago = today - timedelta(days=30)
            start_of_month = today.replace(day=1)

            #Get user
            user = User.query.get_or_404(user_id)

            #Get budgets with spending
            budgets = Budget.query.filter_by(user_id=user_id).all()

            #Get recent expenses
            recent_expenses = Expense.query.filter(
                Expense.user_id == user_id,
                Expense.expense_date >= thirty_days_ago
            ).order_by(Expense.expense_date.desc()).limit(10).all()

            # Get this month's expenses
            month_expenses = Expense.query.filter(
                Expense.user_id == user_id,
                Expense.expense_date >= start_of_month
            ).all()

            # Get upcoming bills (next 7 days)
            upcoming_bills = Bill.query.filter(
                Bill.user_id == user_id,
                Bill.paid_date.is_(None),
                Bill.due_date >= today,
                Bill.due_date <= today + timedelta(days=7)
            ).all()

            # Get overdue bills
            overdue_bills = Bill.query.filter(
                Bill.user_id == user_id,
                Bill.paid_date.is_(None),
                Bill.due_date < today
            ).all()

            

            # Get active reminders (you'll need to adjust this based on your Reminder model)
            # active_reminders = Reminder.query.filter_by(
            #     user_id=user_id,
            #     is_active=True  # Adjust field name as needed
            # ).all()

            # Calculate totals
            total_budgeted = sum(float(budget.budgeted_amount) for budget in budgets)
            total_spent_budgets = sum(float(budget.spent_amount) for budget in budgets)
            month_expense_total = sum(float(expense.amount) for expense in month_expenses)

            data = {
                'user': user.to_dict(),
                'summary': {
                    'total_budgeted': total_budgeted,
                    'total_spent_budgets': total_spent_budgets,
                    'budget_utilization': (total_spent_budgets / total_budgeted * 100) if total_budgeted > 0 else 0,
                    'month_expenses_total': month_expense_total,
                    'overdue_bills_count': len(overdue_bills),
                    'overdue_bills_amount': sum(float(bill.amount) for bill in overdue_bills),
                    'upcoming_bills_count': len(upcoming_bills),
                    # 'active_reminders_count': len(active_reminders)
                },
                'budgets': [budget.to_dict() for budget in budgets],
                'recent_expenses': [expense.to_dict() for expense in recent_expenses],
                'overdue_bills': [bill.to_dict() for bill in overdue_bills],
                'upcoming_bills': [bill.to_dict() for bill in upcoming_bills],
                # 'active_reminders': [reminder.to_dict() for reminder in active_reminders]
            }

            return make_response(data, 200)

        except Exception as e:
            # error handling
            return {'error': str(e)}, 500

class Insights(Resource):
    def get(self):
        user_id = g.user_id
        today = date.today()
        start_of_month = today.replace(day=1)
        start_of_last_month = (start_of_month - timedelta(days=1)).replace(day=1)
        end_of_last_month = start_of_month - timedelta(days=1)
        last_30_days = today - timedelta(days=30)

        try:
            # Budget Utilization
            total_budgeted = db.session.query(func.sum(Budget.budgeted_amount)).filter(Budget.user_id == user_id).scalar() or 0
            total_spent_budgets = db.session.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= start_of_month
            ).scalar() or 0
            budget_utilization = (total_spent_budgets / total_budgeted * 100) if total_budgeted > 0 else 0

            # Spending by Category
            category_spending = db.session.query(
                Category.name,
                func.sum(Expense.amount)
            ).join(Expense).filter(
                Expense.user_id == user_id
            ).group_by(Category.name).all()
            category_spending_data = [
                {"category": name, "total_spent": float(total)} for name, total in category_spending
            ]

            # Spending Over Time (last 30 days)
            daily_spending = db.session.query(
                Expense.expense_date,
                func.sum(Expense.amount)
            ).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= last_30_days
            ).group_by(Expense.expense_date).order_by(Expense.expense_date).all()
            spending_timeline = [
                {"date": str(date), "amount": float(amount)} for date, amount in daily_spending
            ]

            # Bills Summary
            upcoming_bills_count = Bill.query.filter(
                Bill.user_id == user_id,
                Bill.due_date >= today
            ).count()
            overdue_bills = Bill.query.filter(
                Bill.user_id == user_id,
                Bill.due_date < today
            ).all()
            overdue_bills_count = len(overdue_bills)
            overdue_bills_amount = sum(float(bill.amount_due) for bill in overdue_bills)

            # Monthly Comparison
            this_month_spending = db.session.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= start_of_month
            ).scalar() or 0
            last_month_spending = db.session.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
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

            return make_response(insights_data, 200)

        except Exception as e:
            return {'error': str(e)}, 500
            






# Add resources to API
api.add_resource(Categories, '/categories')
api.add_resource(Budgets, '/budgets')
api.add_resource(Expenses, '/expenses')
api.add_resource(Bills, '/bills')
api.add_resource(PayBills, '/bills/<int:bill_id>/pay')
api.add_resource(BillPayments, '/billpayments')
api.add_resource(Dashboards, '/dashboard')
api.add_resource(Insights, '/insights')


if __name__ == '__main__':
    app.run(debug=True)