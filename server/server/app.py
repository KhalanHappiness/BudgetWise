from flask import Flask, jsonify, make_response, request
from flask_cors import CORS

from flask_migrate import Migrate
import os

from models import db, User, Budget, Bill, BillPayment, Expense, Reminder, Category

app = Flask(__name__)


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.json.compact = False

# Initialize extensions

db.init_app(app)
migrate = Migrate(app, db)

CORS(app)


@app.route('/')
def hello():
    return "Hello, World!"