from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime
from models import db, Region, District, Group, User, Station

app = Flask(__name__)
app.secret_key = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/systeam_support'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
print(app.config['SQLALCHEMY_DATABASE_URI'])

def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'user_id' in session:
            return f(*args, **kwargs)
        flash('Please login first.', 'danger')
        return redirect(url_for('login'))
    return wrap

def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrap(*args, **kwargs):
            if session.get('role') == role or session.get('role') == 'Administrator':
                return f(*args, **kwargs)
            flash('You do not have permission to access this.', 'danger')
            return redirect(url_for('dashboard'))
        return wrap
    return decorator

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        phone = request.form['phone_number']
        password = request.form['password']
        user = User.query.filter_by(phone_number=phone).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['role'] = db.session.get(Group, user.role_id).group_name
            flash('Login successful.', 'success')
            return redirect(url_for('dashboard'))
        flash("Invalid credentials", "danger")
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    station_count = Station.query.count()
    user_count = User.query.count()

    region_station_counts = db.session.query(
        Region.region_name, db.func.count(Station.id).label('station_count')
    ).join(District, District.region_id == Region.id)\
     .join(Station, Station.location == District.id)\
     .group_by(Region.region_name)\
     .order_by(db.desc('station_count')).all()

    top_region = region_station_counts[0][0] if region_station_counts else 'N/A'
    top_regions = region_station_counts[:10]

    return render_template('dashboard.html',
                           station_count=station_count,
                           user_count=user_count,
                           top_region=top_region,
                           top_regions=top_regions)

@app.route('/create_admin', methods=['GET', 'POST'])
@login_required
@role_required('Admin')
def create_admin():
    if request.method == 'POST':
        existing_admin = User.query.filter_by(phone_number='0756953308').first()
        if existing_admin:
            flash("⚠️ Admin user already exists.", "warning")
        else:
            administrator = User(
                first_name='dickson',
                last_name='deus',
                phone_number='0756953308',
                location=1,
                role_id=1,
                password=generate_password_hash('admin123'),
                created_time=datetime.utcnow()
            )
            db.session.add(administrator)
            db.session.commit()
            flash("✅ Admin user created successfully.", "success")
        return redirect(url_for('dashboard'))

    return render_template('create_admin.html')

@app.route('/stations')
@login_required
def view_stations():
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)

    query = Station.query
    if search:
        query = query.filter(
            Station.station_name.ilike(f'%{search}%') |
            Station.station_code.ilike(f'%{search}%') |
            Station.contact_name.ilike(f'%{search}%')
        )

    stations = query.paginate(page=page, per_page=10)
    regions = Region.query.all()
    districts = District.query.all()
    groups = Group.query.all()
    district_map = {
        s.id: District.query.get(s.location).district_name if District.query.get(s.location) else "N/A"
        for s in stations.items
    }
    return render_template('stations.html', stations=stations, regions=regions, search=search, districts=districts, groups=groups, district_map=district_map)

@app.route('/stations/add', methods=['GET', 'POST'])
@login_required
@role_required('Admin')
def add_station():
    if request.method == 'POST':
        station = Station(
            station_code=request.form['station_code'],
            station_name=request.form['station_name'],
            group_id=request.form['group_id'],
            location=request.form['location'],
            contact_name=request.form['contact_name'],
            contact_number=request.form['contact_number'],
            connect_IP_Address=request.form['connect_IP_Address'],
            created_by=session.get('user_id')
        )
        db.session.add(station)
        db.session.commit()
        flash("Station added successfully", "success")
        return redirect(url_for('view_stations'))

    groups = Group.query.all()
    districts = District.query.all()
    return render_template('station_add.html', groups=groups, districts=districts)

@app.route('/stations/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@role_required('Admin')
def edit_station(id):
    station = Station.query.get_or_404(id)

    if request.method == 'POST':
        station.station_code = request.form['station_code']
        station.station_name = request.form['station_name']
        station.group_id = request.form['group_id']
        station.location = request.form['location']
        station.contact_name = request.form['contact_name']
        station.contact_number = request.form['contact_number']
        station.connect_IP_Address = request.form['connect_IP_Address']
        db.session.commit()
        flash("Station updated", "success")
        return redirect(url_for('view_stations'))

    groups = Group.query.all()
    districts = District.query.all()
    return render_template('station_edit.html', station=station, groups=groups, districts=districts)

@app.route('/users', methods=['GET', 'POST'])
@login_required
@role_required('Admin')
def manage_users():
    if request.method == 'POST':
        user = User(
            first_name=request.form['first_name'],
            last_name=request.form['last_name'],
            phone_number=request.form['phone_number'],
            password=generate_password_hash(request.form['password']),
            location=request.form['location'],
            role_id=request.form['role_id'],
            created_by=session.get('user_id')
        )
        db.session.add(user)
        db.session.commit()
        flash("User registered", "success")
        return redirect(url_for('manage_users'))

    users = User.query.all()
    roles = Group.query.all()
    districts = District.query.all()
    return render_template('users.html', users=users, roles=roles, districts=districts)

@app.route('/datasetup', methods=['GET', 'POST'])
@login_required
@role_required('Admin')
def datasetup():
    if request.method == 'POST':
        dtype = request.form['type']
        name = request.form['name']
        if dtype == 'region':
            item = Region(region_name=name, created_by=session.get('user_id'))
        elif dtype == 'group':
            item = Group(group_name=name, created_by=session.get('user_id'))
        elif dtype == 'district':
            item = District(district_name=name, region_id=request.form['region_id'], created_by=session.get('user_id'))
        db.session.add(item)
        db.session.commit()
        flash(f"{dtype.capitalize()} added", "success")
        return redirect(url_for('datasetup'))

    regions = Region.query.all()
    districts = District.query.all()
    groups = Group.query.all()
    return render_template('datasetup.html', regions=regions, districts=districts, groups=groups)

def auto_create_admin():
    """One-time admin setup during first app run with two default admins."""
    admins = [
        {
            'first_name': 'Dickson',
            'last_name': 'Deus',
            'phone_number': '0756953308',
            'password': 'admin123'
        },
        {
            'first_name': 'Jane',
            'last_name': 'Doe',
            'phone_number': '0712345678',
            'password': 'admin456'
        }
    ]

    for admin_data in admins:
        existing_admin = User.query.filter_by(phone_number=admin_data['phone_number']).first()
        if not existing_admin:
            new_admin = User(
                first_name=admin_data['first_name'],
                last_name=admin_data['last_name'],
                phone_number=admin_data['phone_number'],
                location=1,
                role_id=1,
                password=generate_password_hash(admin_data['password']),
                created_time=datetime.utcnow()
            )
            db.session.add(new_admin)
            print(f"✅ Created admin: {admin_data['phone_number']}")
        else:
            print(f"⚠️ Admin already exists: {admin_data['phone_number']}")

    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Insert reference data if not exists
        if not Group.query.first():
            db.session.add(Group(group_name='Admin'))
            db.session.commit()
        if not Region.query.first():
            db.session.add(Region(region_name='Default Region'))
            db.session.commit()
        if not District.query.first():
            db.session.add(District(region_id=1, district_name='Default District'))
            db.session.commit()
        auto_create_admin()
    app.run(debug=True)
