from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from flask_restful import Api, Resource # Enfocing RESTFul principles
from flask_migrate import Migrate
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



@app.route('/')
def hello():
    return "Hello, World!"

class BudgetsById(Resource):

    def get(self, id):

        user = User.query.filter(User.id == id).first()

        budget_Dict = user.to_dict()

        response = make_response(
            budget_Dict,
            200)
        
        return response
api.add_resource(BudgetsById, '/budgets/<int:id>')