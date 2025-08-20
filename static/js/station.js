
let stations = [];
document.addEventListener('DOMContentLoaded', function () {
    // Get user role from hidden input
    const userRoleInput = document.getElementById('user-role');
    const userRole = userRoleInput ? userRoleInput.value : '';
    // --- Manage Stations: Dynamic Region Filter, Search, Pagination ---
    const regionFilter = document.getElementById('filter-region');
    const searchInput = document.getElementById('station-search');
    const itemsPerPage = document.getElementById('items-per-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageIndicator = document.getElementById('page-indicator');
    let currentPage = 1;
    let totalPages = 1;
    let currentRegion = '';
    let currentSearch = '';
        let currentItemsPerPage = itemsPerPage ? parseInt(itemsPerPage.value) : 50;



    const exportBtn = document.querySelector('.btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            exportStationsToPrint();
        });
    }

    function exportStationsToPrint() {

        let win = window.open('', '', 'width=900,height=700');
        let html = `
                    <html>
                    <head>
                        <title>Stations List</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; }
                            h2 { text-align: center; }
                            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                            th, td { border: 1px solid #888; padding: 8px; text-align: left; }
                            th { background: #f2f2f2; }
                        </style>
                    </head>
                    <body>
                        <h2>Stations List</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Group</th>
                                    <th>District</th>
                                    <th>Contact Name</th>
                                    <th>Contact Number</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${stations.map(station => `
                                    <tr>
                                        <td>${station.id}</td>
                                        <td>${station.station_code || ''}</td>
                                        <td>${station.station_name || ''}</td>
                                        <td>${station.group_name || ''}</td>
                                        <td>${station.district_name || ''}</td>
                                        <td>${station.contact_name || ''}</td>
                                        <td>${station.contact_number || ''}</td>
                                        <td>${station.connect_IP_Address || ''}</td>
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

    // Fetch regions for filter
    function loadRegions() {
        fetch('/api/regions')
            .then(res => res.json())
            .then(data => {
                if (!regionFilter) return;
                regionFilter.innerHTML = '<option value="">All Regions</option>';
                data.forEach(region => {
                    regionFilter.innerHTML += `<option value="${region.id}">${region.region_name}</option>`;
                });
            })
            .catch(err => {
                console.error('Error loading regions', err);
            });
    }
    loadRegions();

    // Fetch stations with filters and pagination
    function loadStations(page = 1) {
            let url = `/api/stations?page=${page}&per_page=${currentItemsPerPage}`;
            if (currentRegion) url += `&region_id=${currentRegion}`;
            if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
            // If support, filter by user's district (assume district is available in session or template)
            if (userRole === 'supporter') {
                const userDistrict = userRoleInput.getAttribute('data-district');
                if (userDistrict) {
                    url += `&district_id=${userDistrict}`;
                }
            }
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    stations = data.items || data;
                    renderStationsTable(stations);
                    totalPages = data.total_pages || 1;
                    pageIndicator.textContent = `Page ${page} of ${totalPages}`;
                })
                .catch(err => {
                    console.error('Error loading stations', err);
                    stationsTable.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#888;">Error loading stations</td></tr>`;
                });
    }

    // Region filter
    if (regionFilter) {
        regionFilter.addEventListener('change', function () {
            currentRegion = this.value || '';
            currentPage = 1;
            loadStations(currentPage);
        });
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            currentSearch = this.value;
            currentPage = 1;
            loadStations(currentPage);
        });
    }

    // Items per page
    if (itemsPerPage && typeof itemsPerPage.addEventListener === 'function') {
        itemsPerPage.addEventListener('change', function () {
            currentItemsPerPage = parseInt(this.value);
            currentPage = 1;
            loadStations(currentPage);
        });
    }

    // Pagination controls
    if (prevPageBtn && typeof prevPageBtn.addEventListener === 'function') {
        prevPageBtn.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                loadStations(currentPage);
            }
        });
    }
    if (nextPageBtn && typeof nextPageBtn.addEventListener === 'function') {
        nextPageBtn.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                loadStations(currentPage);
            }
        });
    }

    // Dynamic district filtering by region (register form)
    var regionSelect = document.getElementById('region_id');
    var districtSelect = document.getElementById('location');
    if (regionSelect && districtSelect) {
        var allDistrictOptions = Array.from(districtSelect.options);
        regionSelect.addEventListener('change', function () {
            var selectedRegion = regionSelect.value;
            districtSelect.innerHTML = '';
            var defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select District';
            districtSelect.appendChild(defaultOption);
            allDistrictOptions.forEach(function (opt) {
                if (!opt.value) return; // skip default
                if (opt.getAttribute('data-region') === selectedRegion) {
                    districtSelect.appendChild(opt.cloneNode(true));
                }
            });
        });
    }

    // Navigation between sections
    const navItems = document.querySelectorAll('.station-nav li');
    const contentSections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            contentSections.forEach(section => section.style.display = 'none');
            const sectionId = this.getAttribute('data-section') + '-section';
            const el = document.getElementById(sectionId);
            if (el) el.style.display = 'block';
            // Auto-load first station details when View tab is clicked
            if (sectionId === 'view-section') {
                fetch('/api/stations?per_page=1')
                    .then(res => res.json())
                    .then(data => {
                        let first = (data.items && data.items.length) ? data.items[0] : (Array.isArray(data) && data.length ? data[0] : null);
                        if (first && first.id) {
                            showStationDetails(first.id);
                            // Ensure connect button works for this station
                            setTimeout(() => {
                                const connectBtn = document.querySelector('.detail-actions .btn-connect');
                                if (connectBtn) {
                                    connectBtn.onclick = function () {
                                        activateConnectSection(first.id);
                                    };
                                }
                            }, 300);
                        } else {
                            document.getElementById('station-detail-message').style.display = 'block';
                            document.getElementById('station-detail-title').textContent = 'No station selected';
                        }
                    })
                    .catch(err => {
                        console.error('Error loading first station for view:', err);
                    });
            }
        });
    });

    // Form preview functionality
    const previewMap = [
        { input: 'station_name', preview: 'preview-name' },
        { input: 'region_id', preview: 'preview-region' },
        { input: 'location', preview: 'preview-district' },
        { input: 'group_id', preview: 'preview-group' },
        { input: 'contact_name', preview: 'preview-contact-name' },
        { input: 'contact_number', preview: 'preview-contact-number' }
    ];

    previewMap.forEach(({ input, preview }) => {
        const inputElem = document.getElementById(input);
        const previewElem = document.getElementById(preview);
        if (inputElem && previewElem) {
            inputElem.addEventListener('input', function () {
                if (this.tagName === 'SELECT') {
                    const selectedOption = this.options[this.selectedIndex];
                    previewElem.textContent = selectedOption ? selectedOption.text : '-';
                } else {
                    previewElem.textContent = this.value || '-';
                }
            });
        }
    });

    // Station form submission
    const stationForm = document.getElementById('station-form');
    const formInputs = [
        'station_name', 'region_id', 'location', 'group_id', 'contact_name', 'contact_number', 'connect_IP_Address'
    ];
    const previewElements = [
        'preview-name', 'preview-region', 'preview-district', 'preview-group', 'preview-contact-name', 'preview-contact-number'
    ];
    if (stationForm) {
        stationForm.addEventListener('submit', function (e) {
            e.preventDefault();

            let isValid = true;
            formInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (!input.value) {
                    input.style.borderColor = 'var(--danger-color)';
                    isValid = false;
                } else {
                    input.style.borderColor = '#ced4da';
                }
            });

            if (isValid) {
                const payload = {
                    station_code: document.getElementById('station_code').value,
                    station_name: document.getElementById('station_name').value,
                    region_id: document.getElementById('region_id').value,
                    location: document.getElementById('location').value,
                    group_id: document.getElementById('group_id').value,
                    contact_name: document.getElementById('contact_name').value,
                    contact_number: document.getElementById('contact_number').value,
                    connect_IP_Address: document.getElementById('connect_IP_Address').value
                };
                fetch('/api/stations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                    .then(res => {
                        if (!res.ok) throw new Error('Create failed');
                        return res.json();
                    })
                    .then(() => {
                        alert('Station registered successfully!');
                        stationForm.reset();
                        previewElements.forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.textContent = '-';
                        });
                        loadStations(currentPage);
                    })
                    .catch(err => {
                        console.error('Error registering station', err);
                        alert('Error registering station.');
                    });
            } else {
                alert('Please fill in all required fields');
            }
        });
    }

    // --- Table rendering with View/Edit/Delete ---
    function renderStationsTable(stations) {
        let stationsTable;
        // Both admin and supporters now use manage-section
        const manageSection = document.getElementById('manage-section');
        stationsTable = manageSection ? manageSection.querySelector('#stations-table tbody') : null;

        if (!stationsTable) return;
        stationsTable.innerHTML = '';
        if (!stations || stations.length === 0) {
            stationsTable.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#888;">No stations found</td></tr>`;
            return;
        }
        stations.forEach(station => {
            const row = stationsTable.insertRow();
            let actions = `<button type="button" class="btn-secondary btn-sm view-station" data-id="${station.id}"><i class="fas fa-eye"></i></button>`;
            if (userRole === 'admin') {
                actions += `<button type="button" class="btn-secondary btn-sm edit-station" data-id="${station.id}"><i class="fas fa-edit"></i></button>`;
                actions += `<button type="button" class="btn-secondary btn-sm delete-station" data-id="${station.id}"><i class="fas fa-trash-alt"></i></button>`;
            }
            row.innerHTML = `
                <td>${station.id}</td>
                <td>${station.station_code || ''}</td>
                <td>${station.station_name || ''}</td>
                <td>${station.group_name || ''}</td>
                <td>${station.district_name || ''}</td>
                <td>${station.contact_name || ''}</td>
                <td>${station.contact_number || ''}</td>
                <td>${station.connect_IP_Address || ''}</td>
                <td>${actions}</td>
            `;
        });
    }

    // Event delegation for actions (robust & minimal)
    function setupTableDelegation() {
        let stationsTable;
        // if (userRole === 'support' || userRole === 'supporter') {
        //     const viewSection = document.getElementById('view-section');
        //     stationsTable = viewSection ? viewSection.querySelector('#stations-table tbody') : null;
        // } else if (userRole === 'admin') {
        //     const manageSection = document.getElementById('manage-section');
        //     stationsTable = manageSection ? manageSection.querySelector('#stations-table tbody') : null;
        // }
        if (userRole === 'support' || userRole === 'supporter') {
            const manageSection = document.getElementById('manage-section');
            stationsTable = manageSection ? manageSection.querySelector('#stations-table tbody') : null;
        } else if (userRole === 'admin') {
            const manageSection = document.getElementById('manage-section');
            stationsTable = manageSection ? manageSection.querySelector('#stations-table tbody') : null;
        }

        if (!stationsTable) return;
        stationsTable.addEventListener('click', function (e) {
            const viewBtn = e.target.closest('.view-station');
            if (viewBtn) {
                e.preventDefault();
                const id = viewBtn.getAttribute('data-id');
                console.log('View button clicked for id=', id);
                showStationDetails(id);
                return;
            }
            const editBtn = e.target.closest('.edit-station');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                window.location.href = `/stations/edit/${id}`;
                return;
            }
            const delBtn = e.target.closest('.delete-station');
            if (delBtn) {
                const id = delBtn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this station?')) {
                    fetch(`/api/stations/${id}`, { method: 'DELETE' })
                        .then(res => {
                            if (!res.ok) throw new Error('Delete failed');
                            return res.json().catch(() => { });
                        })
                        .then(() => {
                            alert('Station deleted!');
                            loadStations(currentPage);
                        })
                        .catch(err => {
                            console.error('Error deleting station', err);
                            alert('Error deleting station.');
                        });
                }
                return;
            }
        });
    }
    // Call after table is rendered
    setupTableDelegation();

    // --- View Station Details ---
function showStationDetails(id) {
    console.log("View button clicked for id=", id);
    console.log("Fetching /api/stations/" + id);

    fetch(`/api/stations/${id}`)
        .then(res => res.ok ? res.json() : Promise.reject(`Server error: ${res.status}`))
        .then(station => {
            console.log("Station API response:", station);

            if (!station || Object.keys(station).length === 0) {
                alert("No station details found.");
                return;
            }

            // Helper to safely set text content
            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value ?? '-';
            };

            // Fill modal details
            setText('detail-station-code', station.station_code);
            setText('detail-station-name', station.station_name);
            setText('detail-region', station.region_name);
            setText('detail-district', station.district_name);
            setText('detail-ip', station.connect_IP_Address);
            setText('detail-contact', station.contact_name ? `${station.contact_name}, ${station.contact_number}` : '-');

            // Prefill connect input
            const connectInput = document.getElementById('station-connect');
            if (connectInput) connectInput.value = station.connect_IP_Address || station.station_code || '';

            // Show modal
            const modalEl = document.getElementById('stationModal');
            if (modalEl) {
                const bsModal = new bootstrap.Modal(modalEl);
                bsModal.show();
            }

            // Reset connection UI
            const connectBtn = document.getElementById('connect-btn');
            const indicator = document.querySelector('.indicator-circle');
            setText('connection-status', 'Disconnected');
            setText('latency', '-');
            setText('uptime', '-');
            if (indicator) indicator.style.backgroundColor = '#ccc';
            if (connectBtn) {
                connectBtn.disabled = false;
                connectBtn.innerHTML = '<i class="fas fa-link"></i> Connect';
                connectBtn.onclick = () => {
                    connectBtn.disabled = true;
                    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
                    setText('connection-status', 'Connecting...');
                    if (indicator) indicator.style.backgroundColor = '#f39c12';

                    setTimeout(() => {
                        if (indicator) indicator.style.backgroundColor = '#2ecc71';
                        setText('connection-status', 'Connected');
                        setText('latency', '42 ms');
                        setText('uptime', '00:01:25');
                        connectBtn.innerHTML = '<i class="fas fa-link"></i> Connected';
                    }, 2000);
                };
            }

            // Edit button (only if exists)
            const editBtn = document.getElementById('edit-btn');
            if (editBtn) {
                editBtn.onclick = () => window.location.href = `/stations/edit/${id}`;
            }

        })
        .catch(err => {
            console.error("Error fetching station details:", err);
            alert("Could not load station details. Please try again.");
        });
}





    // Initial load for admin (manage) and support (view)
    const activeNav = document.querySelector('.station-nav li.active');
    if (userRole === 'admin' && activeNav && activeNav.getAttribute('data-section') === 'manage') {
        loadStations(currentPage);
    }
    if ((userRole === 'support' || userRole === 'supporter')) {
        loadStations(currentPage);
    }
    const manageNav = document.querySelector('[data-section="manage"]');
    if (manageNav && typeof manageNav.addEventListener === 'function') {
        manageNav.addEventListener('click', function () {
            if (userRole === 'admin' || userRole === 'support' || userRole === 'supporter') {
                loadStations(currentPage);
            }
        });
    }


    // Connection simulation 
    const connectBtn = document.getElementById('connect-btn');
    const statusIndicator = document.querySelector('.indicator-circle');
    const connectionStatus = document.querySelector('.connection-status strong');
    const latencyStat = document.querySelector('.connection-stats .stat-item:nth-child(1) .stat-value');
    const uptimeStat = document.querySelector('.connection-stats .stat-item:nth-child(2) .stat-value');

    if (connectBtn) {
        connectBtn.addEventListener('click', function () {
            const stationInput = document.getElementById('station-connect');
            const viewerPlaceholder = document.querySelector('.viewer-placeholder') || document.querySelector('#connect-section');
            if (stationInput && stationInput.value) {
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
                if (statusIndicator) statusIndicator.style.backgroundColor = '#f39c12';
                if (connectionStatus) connectionStatus.textContent = 'Connecting';
                setTimeout(() => {
                    if (statusIndicator) statusIndicator.style.backgroundColor = '#2ecc71';
                    if (connectionStatus) connectionStatus.textContent = 'Connected';
                    if (latencyStat) latencyStat.textContent = '48 ms';
                    if (uptimeStat) uptimeStat.textContent = '00:01:30';
                    this.innerHTML = '<i class="fas fa-link"></i> Connected';
                    if (viewerPlaceholder) {
                        viewerPlaceholder.innerHTML = `
                            <div class="connection-success" style="text-align:center;">
                                <i class="fas fa-check-circle" style="color:#2ecc71;font-size:48px;"></i>
                                <p>Connected to ${stationInput.value}</p>
                            </div>
                        `;
                    }
                }, 2000);
            } else {
                alert('Please enter a station URL or ID');
            }
        });
    }

});
