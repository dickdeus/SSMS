document.addEventListener('DOMContentLoaded', function () {
    // Dynamic data
    let users = [];
    let districts = [];
    let roles = [];

    // DOM elements
    const addUserBtn = document.getElementById('add-user-btn');
    const userFormContainer = document.getElementById('user-form-container');
    const userForm = document.getElementById('user-form');
    const cancelUserBtn = document.getElementById('cancel-user');
    const userFormTitle = document.getElementById('user-form-title');
    const userRoleSelect = document.getElementById('user-role');
    const regionAccessContainer = document.getElementById('region-access-container');
    const usersTableBody = document.querySelector('#users-table tbody');
    const userSearch = document.getElementById('user-search');
    const userRoleFilter = document.getElementById('user-role-filter');
    const userStatusFilter = document.getElementById('user-status-filter');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageIndicator = document.getElementById('page-indicator');

    // Pagination variables
    let currentPage = 1;
    const usersPerPage = 10;
    let filteredUsers = [];

    // Initialize
    fetchInitialData();
    setupEventListeners();

    // Export to printable document
    const exportBtn = document.querySelector('.table-actions .btn-secondary i.fas.fa-download')?.parentElement;
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            exportUsersToPrint();
        });
    }

    function exportUsersToPrint() {
        let win = window.open('', '', 'width=900,height=700');
        let html = `
            <html>
            <head>
                <title>Users List</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h2 { text-align: center; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #888; padding: 8px; text-align: left; }
                    th { background: #f2f2f2; }
                </style>
            </head>
            <body>
                <h2>Users List</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>District</th>
                            <th>Role</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredUsers.map(user => `
                            <tr>
                                <td>USR-${user.id.toString().padStart(3, '0')}</td>
                                <td>${user.first_name} ${user.last_name}</td>
                                <td>${user.phone_number || ''}</td>
                                <td>${user.district_name || ''}</td>
                                <td>${user.role_name || ''}</td>
                                <td>${user.created_time || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
    }

    function fetchInitialData() {
        Promise.all([
            fetch('/api/users').then(res => res.json()),
            fetch('/api/districts').then(res => res.json()),
            fetch('/api/groups').then(res => res.json()),
            fetch('/api/roles').then(res => res.json()).catch(() => []) // fallback if no endpoint
        ]).then(([userData, districtData, groupData, roleData]) => {
            users = userData;
            districts = districtData;
            roles = roleData.length ? roleData : [
                { id: 1, name: 'Administrator' },
                { id: 2, name: 'Supporter' }
            ];
            filteredUsers = [...users];
            loadUsers();
            populateFormOptions();
        });
    }

    function populateFormOptions() {
        // Populate role select (form)
        userRoleSelect.innerHTML = '<option value="">Select Role</option>' +
            roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

        // Populate role filter (table filter)
        if (userRoleFilter) {
            userRoleFilter.innerHTML = '<option value="">All Roles</option>' +
                roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        }

        // Populate district select
        const districtSelect = document.getElementById('user-district');
        if (districtSelect) {
            districtSelect.innerHTML = '<option value="">Select District</option>' +
                districts.map(d => `<option value="${d.id}">${d.district_name}</option>`).join('');
        }
    }

    function loadUsers() {
        usersTableBody.innerHTML = '';
        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const usersToDisplay = filteredUsers.slice(startIndex, endIndex);
        usersToDisplay.forEach(user => {
            const initials = (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
            const formattedDate = user.created_time || '';
            const roleName = user.role_name || '';
            const districtName = user.district_name || '';
            const phone = user.phone_number || '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>USR-${user.id.toString().padStart(3, '0')}</td>
                <td>
                    <div class="user-info-cell">
                        <div class="user-avatar">${initials}</div>
                        <div>
                            <div class="user-name">${user.first_name} ${user.last_name}</div>
                            <div class="user-email">${phone}</div>
                        </div>
                    </div>
                </td>
                <td>${districtName}</td>
                <td>${roleName}</td>
                <td>${formattedDate}</td>
                <td>
                    <button class="action-btn edit-user" data-id="${user.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="action-btn delete delete-user" data-id="${user.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
        const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = parseInt(this.getAttribute('data-id'));
                editUser(userId);
            });
        });
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = parseInt(this.getAttribute('data-id'));
                deleteUser(userId);
            });
        });
    }

    function applyFilters() {
        const searchTerm = userSearch.value.toLowerCase();
        const roleFilter = userRoleFilter.value;
        filteredUsers = users.filter(user => {
            const matchesSearch =
                user.first_name.toLowerCase().includes(searchTerm) ||
                user.last_name.toLowerCase().includes(searchTerm) ||
                user.phone_number.toLowerCase().includes(searchTerm);
            const matchesRole = !roleFilter || user.role_id == roleFilter;
            return matchesSearch && matchesRole;
        });
        currentPage = 1;
        loadUsers();
    }

    function setupEventListeners() {
        addUserBtn.addEventListener('click', function () {
            userFormTitle.textContent = 'Add New';
            userForm.reset();
            document.getElementById('user-id').value = '';
            userFormContainer.style.display = 'block';
        });
        cancelUserBtn.addEventListener('click', function () {
            userFormContainer.style.display = 'none';
        });
        userForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const userId = document.getElementById('user-id').value;
            const firstName = document.getElementById('user-firstname').value;
            const lastName = document.getElementById('user-lastname').value;
            const phone = document.getElementById('user-phone').value;
            const password = document.getElementById('user-password').value;
            const roleId = document.getElementById('user-role').value;
            const districtId = document.getElementById('user-district').value;
            if (firstName && lastName && phone && password && roleId && districtId) {
                const payload = {
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phone,
                    password: password,
                    role_id: roleId,
                    location: districtId
                };
                if (userId) {
                    fetch(`/api/users/${userId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }).then(() => fetchInitialData());
                } else {
                    fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }).then(() => fetchInitialData());
                }
                userFormContainer.style.display = 'none';
            } else {
                alert('Please fill in all required fields');
            }
        });
        userSearch.addEventListener('input', function () {
            applyFilters();
        });
        userRoleFilter.addEventListener('change', function () {
            applyFilters();
        });
        prevPageBtn.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                loadUsers();
            }
        });
        nextPageBtn.addEventListener('click', function () {
            const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                loadUsers();
            }
        });
    }

    

    function editUser(id) {
        const user = users.find(u => u.id === id);
        if (user) {
            userFormTitle.textContent = 'Edit';
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-firstname').value = user.first_name;
            document.getElementById('user-lastname').value = user.last_name;
            document.getElementById('user-phone').value = user.phone_number;
            document.getElementById('user-password').value = '';
            document.getElementById('user-role').value = user.role_id;
            document.getElementById('user-district').value = user.location;
            userFormContainer.style.display = 'block';
        }
    }

    function deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            fetch(`/api/users/${id}`, { method: 'DELETE' })
                .then(() => fetchInitialData());
        }
    }
});