from sqlalchemy.exc import IntegrityError
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime
from flask_migrate import Migrate
from models import db, Region, District, Group, Role, User, Station

app = Flask(__name__)
app.secret_key = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/systeam_support'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)


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

# ------------------------
# DATA SETUP CRUD API
# ------------------------


# -----------------------
# API: ROLES
# -----------------------
@app.route('/api/roles', methods=['GET'])
def get_roles():
    roles = Role.query.all()
    return jsonify([
        {"id": r.id, "name": r.name} for r in roles
    ])

# API: USERS
# -----------------------
@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    roles = Role.query.all()
    districts = District.query.all()
    def safe_date(obj, attr):
        val = getattr(obj, attr, None)
        if val:
            return val.strftime("%Y-%m-%d %H:%M")
        return ""
    return jsonify([
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "phone_number": u.phone_number,
            "location": u.location,
            "role_id": u.role_id,
            "created_by": u.created_by,
            "created_time": safe_date(u, "created_time"),
            "district_name": District.query.get(u.location).district_name if u.location else "",
            "role_name": Role.query.get(u.role_id).name if u.role_id else ""
        } for u in users
    ])

@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.json
    new_user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        phone_number=data['phone_number'],
        password=generate_password_hash(data['password']),
        location=data['location'],
        role_id=data['role_id'],
        created_by=session.get('user_id')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User added successfully"})

@app.route('/api/users/<int:id>', methods=['PUT'])
def update_user(id):
    data = request.json
    user = User.query.get_or_404(id)
    user.first_name = data['first_name']
    user.last_name = data['last_name']
    user.phone_number = data['phone_number']
    if data.get('password'):
        user.password = generate_password_hash(data['password'])
    user.location = data['location']
    user.role_id = data['role_id']
    db.session.commit()
    return jsonify({"message": "User updated successfully"})

@app.route('/api/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"})

# API: REGIONS
# -----------------------
@app.route('/api/regions', methods=['GET'])
def get_regions():
    regions = Region.query.all()
    districts = District.query.all()
    stations = Station.query.all()
    def safe_date(obj, attr):
        val = getattr(obj, attr, None)
        if val:
            return val.strftime("%Y-%m-%d")
        return ""
    region_district_map = {r.id: [d.id for d in districts if d.region_id == r.id] for r in regions}
    return jsonify([
        {
            "id": r.id,
            "region_name": r.region_name,
            "stations": len([s for s in stations if s.location in region_district_map[r.id]]),
            "last_updated": safe_date(r, "updated_time") or safe_date(r, "created_time")
        } for r in regions
    ])

@app.route('/api/regions', methods=['POST'])
def add_region():
    data = request.json
    region_name = data.get('region_name') or data.get('name')
    new_region = Region(region_name=region_name)
    db.session.add(new_region)
    db.session.commit()
    return jsonify({"message": "Region added successfully"})

@app.route('/api/regions/<int:id>', methods=['PUT'])
def update_region(id):
    data = request.json
    region = Region.query.get_or_404(id)
    region_name = data.get('region_name') or data.get('name')
    region.region_name = region_name
    db.session.commit()
    return jsonify({"message": "Region updated successfully"})

#@app.route('/api/regions/<int:id>', methods=['DELETE'])
@app.route('/api/regions/<int:id>', methods=['DELETE'])
def delete_region(id):
    region = Region.query.get_or_404(id)
    try:
        db.session.delete(region)
        db.session.commit()
        return jsonify({"message": "Region deleted successfully"})
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Cannot delete region: districts exist for this region."}), 400

# ========= DISTRICTS =========
@app.route('/api/districts', methods=['GET'])
def get_districts():
    districts = District.query.all()
    def safe_date(obj, attr):
        val = getattr(obj, attr, None)
        if val:
            return val.strftime("%Y-%m-%d")
        return ""
    return jsonify([
        {
            "id": d.id,
            "district_name": d.district_name,
            "region_id": d.region_id,
            "region_name": Region.query.get(d.region_id).region_name if d.region_id else "",
            "stations": 0,
            "last_updated": safe_date(d, "updated_time") or safe_date(d, "created_time")
        } for d in districts
    ])

@app.route('/api/districts', methods=['POST'])
def add_district():
    data = request.json
    district_name = data.get('district_name') or data.get('name')
    new_district = District(
        district_name=district_name,
        region_id=data['region_id']
    )
    db.session.add(new_district)
    db.session.commit()
    return jsonify({"message": "District added successfully"})

@app.route('/api/districts/<int:id>', methods=['PUT'])
def update_district(id):
    data = request.json
    district = District.query.get_or_404(id)
    district_name = data.get('district_name') or data.get('name')
    district.district_name = district_name
    district.region_id = data['region_id']
    db.session.commit()
    return jsonify({"message": "District updated successfully"})

@app.route('/api/districts/<int:id>', methods=['DELETE'])
def delete_district(id):
    district = District.query.get_or_404(id)
    db.session.delete(district)
    db.session.commit()
    return jsonify({"message": "District deleted successfully"})

# ========= GROUPS =========
@app.route('/api/groups', methods=['GET'])
def get_groups():
    groups = Group.query.all()
    def safe_date(obj, attr):
        val = getattr(obj, attr, None)
        if val:
            return val.strftime("%Y-%m-%d")
        return ""
    return jsonify([
        {
            "id": g.id,
            "group_name": g.group_name,
            "last_updated": safe_date(g, "updated_time") or safe_date(g, "created_time")
        } for g in groups
    ])

@app.route('/api/groups', methods=['POST'])
def add_group():
    data = request.json
    group_name = data.get('group_name') or data.get('name')
    new_group = Group(group_name=group_name)
    db.session.add(new_group)
    db.session.commit()
    return jsonify({"message": "Group added successfully"})

@app.route('/api/groups/<int:id>', methods=['PUT'])
def update_group(id):
    data = request.json
    group = Group.query.get_or_404(id)
    group_name = data.get('group_name') or data.get('name')
    group.group_name = group_name
    db.session.commit()
    return jsonify({"message": "Group updated successfully"})

@app.route('/api/groups/<int:id>', methods=['DELETE'])
def delete_group(id):
    group = Group.query.get_or_404(id)
    db.session.delete(group)
    db.session.commit()
    return jsonify({"message": "Group deleted successfully"})

# -----------------------
# Views / UI
# -----------------------
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
            try:
                session['role'] = db.session.get(Role, user.role_id).name
            except Exception:
                session['role'] = 'User'
            flash('Login successful.', 'success')
            return redirect(url_for('dashboard'))
        flash("Invalid credentials", "danger")
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    station_count = Station.query.count()
    user_count = User.query.count()

    region_station_counts = (
        db.session.query(
            Region.region_name, db.func.count(Station.id).label('station_count')
        )
        .join(District, District.region_id == Region.id)
        .join(Station, Station.location == District.id)
        .group_by(Region.region_name)
        .order_by(db.desc('station_count'))
        .all()
    )

    district_station_counts = (
        db.session.query(
            District.district_name, db.func.count(Station.id).label('station_count')
        )
        .join(Station, Station.location == District.id)
        .group_by(District.district_name)
        .order_by(db.desc('station_count'))
        .all()
    )

    top_region = region_station_counts[0][0] if region_station_counts else 'N/A'
    top_regions = region_station_counts[:10]
    top_district = district_station_counts[0][0] if district_station_counts else 'N/A'
    top_districts = district_station_counts[:10]

    return render_template('dashboard.html',
                           station_count=station_count,
                           user_count=user_count,
                           top_region=top_region,
                           top_regions=top_regions,
                           top_district=top_district,
                           top_districts=top_districts)

@app.route('/datasetup', methods=['GET'])
@login_required
@role_required('Admin')
def datasetup():
    # pass initial lists for server-render fallback if needed
    regions = Region.query.order_by(Region.region_name).all()
    districts = District.query.order_by(District.district_name).all()
    groups = Group.query.order_by(Group.group_name).all()
    return render_template('datasetup.html', regions=regions, districts=districts, groups=groups)


# -----------------------
# Stations + other routes (kept as before)
# -----------------------
from flask import jsonify

# API: Get all stations
@app.route('/api/stations', methods=['GET'])
@login_required
def api_get_stations():
    # Search, region filter, and pagination
    search = request.args.get('search', type=str)
    region_id = request.args.get('region_id', type=str)
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)

    query = Station.query
    if region_id:
        # Join with District and filter by District.region_id
        query = query.join(District, Station.location == District.id).filter(District.region_id == region_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            Station.station_name.ilike(search_pattern) |
            Station.station_code.ilike(search_pattern) |
            Station.contact_name.ilike(search_pattern)
        )

    pagination = query.order_by(Station.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
    stations = pagination.items
    result = []
    for s in stations:
        district_obj = db.session.get(District, s.location) if s.location else None
        region = district_obj.region_id if district_obj else None
        region_obj = db.session.get(Region, region) if region else None
        region_name = region_obj.region_name if region_obj else None
        district_name = district_obj.district_name if district_obj else None
        group_obj = db.session.get(Group, s.group_id) if s.group_id else None
        group_name = group_obj.group_name if group_obj else None
        result.append({
            'id': s.id,
            'station_code': s.station_code,
            'station_name': s.station_name,
            'group_id': s.group_id,
            'group_name': group_name,
            'location': s.location,
            'district_name': district_name,
            'region_id': region,
            'region_name': region_name,
            'contact_name': s.contact_name,
            'contact_number': s.contact_number,
            'connect_IP_Address': s.connect_IP_Address,
            'created_by': s.created_by,
            'created_time': s.created_time.strftime('%Y-%m-%d %H:%M:%S') if s.created_time else None
        })
    return jsonify({
        'items': result,
        'total_pages': pagination.pages,
        'total_items': pagination.total,
        'current_page': pagination.page
    })

# API: Get one station
@app.route('/api/stations/<int:id>', methods=['GET'])
@login_required
def api_get_station(id):
    s = Station.query.get_or_404(id)
    district_obj = db.session.get(District, s.location) if s.location else None
    region = district_obj.region_id if district_obj else None
    region_obj = db.session.get(Region, region) if region else None
    region_name = region_obj.region_name if region_obj else None
    district_name = district_obj.district_name if district_obj else None
    group_obj = db.session.get(Group, s.group_id) if s.group_id else None
    group_name = group_obj.group_name if group_obj else None
    result = {
        'id': s.id,
        'station_code': s.station_code,
        'station_name': s.station_name,
        'group_id': s.group_id,
        'group_name': group_name,
        'location': s.location,
        'district_name': district_name,
        'region_id': region,
        'region_name': region_name,
        'contact_name': s.contact_name,
        'contact_number': s.contact_number,
        'connect_IP_Address': s.connect_IP_Address,
        'created_by': s.created_by,
        'created_time': s.created_time.strftime('%Y-%m-%d %H:%M:%S') if s.created_time else None
    }
    return jsonify(result)

# API: Create station
@app.route('/api/stations', methods=['POST'])
@login_required
@role_required('Admin')
def api_create_station():
    data = request.json
    station = Station(
        station_code=data.get('station_code'),
        station_name=data.get('station_name'),
        group_id=data.get('group_id'),
        location=data.get('location'),
        contact_name=data.get('contact_name'),
        contact_number=data.get('contact_number'),
        connect_IP_Address=data.get('connect_IP_Address'),
        created_by=session.get('user_id')
    )
    db.session.add(station)
    db.session.commit()
    return jsonify({'message': 'Station created', 'id': station.id}), 201

# API: Update station
@app.route('/api/stations/<int:id>', methods=['PUT'])
@login_required
@role_required('Admin')
def api_update_station(id):
    s = Station.query.get_or_404(id)
    data = request.json
    s.station_code = data.get('station_code', s.station_code)
    s.station_name = data.get('station_name', s.station_name)
    s.group_id = data.get('group_id', s.group_id)
    s.location = data.get('location', s.location)
    s.contact_name = data.get('contact_name', s.contact_name)
    s.contact_number = data.get('contact_number', s.contact_number)
    s.connect_IP_Address = data.get('connect_IP_Address', s.connect_IP_Address)
    db.session.commit()
    return jsonify({'message': 'Station updated'})

# API: Delete station
@app.route('/api/stations/<int:id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def api_delete_station(id):
    s = Station.query.get_or_404(id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({'message': 'Station deleted'})
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


# create defaults if missing (safe)
with app.app_context():
    db.create_all()
    if not Region.query.get(1):
        db.session.add(Region(id=1, region_name='Default Region'))
        db.session.commit()
    if not District.query.get(1):
        db.session.add(District(id=1, region_id=1, district_name='Default District'))
        db.session.commit()
    auto_create_admin()

if __name__ == '__main__':
    app.run(debug=True)
