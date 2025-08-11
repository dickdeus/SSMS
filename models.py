from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Region(db.Model):
    __tablename__ = 'REGION'
    id = db.Column(db.Integer, primary_key=True)
    region_name = db.Column(db.String(150), nullable=False)
    created_by = db.Column(db.Integer)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)

class District(db.Model):
    __tablename__ = 'DISTRICT'
    id = db.Column(db.Integer, primary_key=True)
    region_id = db.Column(db.Integer, db.ForeignKey('REGION.id'))
    district_name = db.Column(db.String(150), nullable=False)
    created_by = db.Column(db.Integer)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)

class Group(db.Model):
    __tablename__ = 'GROUP'
    id = db.Column(db.Integer, primary_key=True)
    group_name = db.Column(db.String(150), nullable=False)
    created_by = db.Column(db.Integer)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)

class Role(db.Model):
    __tablename__ = 'ROLE'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    created_by = db.Column(db.Integer)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    __tablename__ = 'USERS'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    password = db.Column(db.String(255), nullable=False)
    location = db.Column(db.Integer, db.ForeignKey('DISTRICT.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('ROLE.id'))  # Updated to reference ROLE table
    created_by = db.Column(db.Integer)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)

class Station(db.Model):
    __tablename__ = 'STATION'
    id = db.Column(db.Integer, primary_key=True)
    station_code = db.Column(db.String(50))
    station_name = db.Column(db.String(150))
    group_id = db.Column(db.Integer, db.ForeignKey('GROUP.id'))
    location = db.Column(db.Integer, db.ForeignKey('DISTRICT.id'))
    contact_name = db.Column(db.String(150))
    contact_number = db.Column(db.String(20))
    connect_IP_Address = db.Column(db.String(45))
    created_by = db.Column(db.Integer)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)