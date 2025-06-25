from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData

# Define naming convention
metadata = MetaData(naming_convention={
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
})

# Initialize db with metadata
db = SQLAlchemy(metadata=metadata)