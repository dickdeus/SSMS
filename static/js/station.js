document.addEventListener('DOMContentLoaded', function () {
    // Navigation between sections
    const navItems = document.querySelectorAll('.station-nav li');
    const contentSections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            // Remove active class from all nav items
            navItems.forEach(navItem => navItem.classList.remove('active'));

            // Add active class to clicked item
            this.classList.add('active');

            // Hide all content sections
            contentSections.forEach(section => {
                section.style.display = 'none';
            });

            // Show the corresponding section
            const sectionId = this.getAttribute('data-section') + '-section';
            document.getElementById(sectionId).style.display = 'block';
        });
    });

    // Form preview functionality
    const formInputs = ['station-name', 'station-region', 'station-district', 'station-url'];
    const previewElements = ['preview-name', 'preview-region', 'preview-district', 'preview-url'];

    formInputs.forEach((inputId, index) => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewElements[index]);

        input.addEventListener('input', function () {
            if (this.tagName === 'SELECT') {
                const selectedOption = this.options[this.selectedIndex];
                preview.textContent = selectedOption.text;
            } else {
                preview.textContent = this.value || '-';
            }
        });
    });

    // Station form submission
    const stationForm = document.getElementById('station-form');
    stationForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Form validation
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
            // Show success message
            alert('Station registered successfully!');
            this.reset();

            // Reset preview
            previewElements.forEach(elementId => {
                document.getElementById(elementId).textContent = '-';
            });
        } else {
            alert('Please fill in all required fields');
        }
    });

    // Load sample data for manage section
    const stationsTable = document.getElementById('stations-table').getElementsByTagName('tbody')[0];
    const sampleStations = [
        { id: 'STN-001', name: 'Central Broadcasting', region: 'Central', district: 'Capital', status: 'Active' },
        { id: 'STN-002', name: 'Northern Radio', region: 'Northern', district: 'North', status: 'Active' },
        { id: 'STN-003', name: 'Eastern FM', region: 'Eastern', district: 'East', status: 'Inactive' },
        { id: 'STN-004', name: 'Western Waves', region: 'Western', district: 'West', status: 'Active' },
        { id: 'STN-005', name: 'Southern Sounds', region: 'Southern', district: 'South', status: 'Active' },
        { id: 'STN-006', name: 'Coastal Radio', region: 'Coastal', district: 'Bay', status: 'Inactive' },
        { id: 'STN-007', name: 'Highland Radio', region: 'Highland', district: 'Mountain', status: 'Active' },
        { id: 'STN-008', name: 'Island FM', region: 'Island', district: 'Harbor', status: 'Active' },
        { id: 'STN-009', name: 'Frontier Radio', region: 'Frontier', district: 'Border', status: 'Inactive' },
        { id: 'STN-010', name: 'Special Zone Radio', region: 'Special Zone', district: 'Zone A', status: 'Active' }
    ];

    function populateStationsTable() {
        stationsTable.innerHTML = '';
        sampleStations.forEach(station => {
            const row = stationsTable.insertRow();
            row.innerHTML = `
                <td>${station.id}</td>
                <td>${station.name}</td>
                <td>${station.region} Region</td>
                <td>${station.district} District</td>
                <td><span class="status-badge ${station.status === 'Active' ? 'status-active' : 'status-inactive'}">${station.status}</span></td>
                <td>
                    <button class="btn-secondary btn-sm"><i class="fas fa-edit"></i></button>
                    <button class="btn-secondary btn-sm"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    // Only populate if we're on the manage section
    if (document.querySelector('.station-nav li.active').getAttribute('data-section') === 'manage') {
        populateStationsTable();
    }

    // Connection simulation
    const connectBtn = document.getElementById('connect-btn');
    const statusIndicator = document.querySelector('.indicator-circle');
    const connectionStatus = document.querySelector('.connection-status strong');
    const latencyStat = document.querySelector('.connection-stats .stat-item:nth-child(1) .stat-value');
    const uptimeStat = document.querySelector('.connection-stats .stat-item:nth-child(2) .stat-value');

    connectBtn.addEventListener('click', function () {
        const stationInput = document.getElementById('station-connect');

        if (stationInput.value) {
            // Simulate connection process
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            statusIndicator.style.backgroundColor = '#f39c12';
            connectionStatus.textContent = 'Connecting';

            setTimeout(() => {
                statusIndicator.style.backgroundColor = '#2ecc71';
                connectionStatus.textContent = 'Connected';
                latencyStat.textContent = '48 ms';
                uptimeStat.textContent = '00:01:30';
                this.innerHTML = '<i class="fas fa-link"></i> Connected';

                // Change viewer placeholder
                const viewerPlaceholder = document.querySelector('.viewer-placeholder');
                viewerPlaceholder.innerHTML = `
                    <div class="connection-success">
                        <i class="fas fa-check-circle" style="color:#2ecc71;font-size:48px;"></i>
                        <p>Connected to ${stationInput.value}</p>
                    </div>
                `;
            }, 2000);
        } else {
            alert('Please enter a station URL or ID');
        }
    });

    // Pagination controls
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageIndicator = document.getElementById('page-indicator');

    let currentPage = 1;
    const totalPages = 5;

    prevPageBtn.addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });

    nextPageBtn.addEventListener('click', function () {
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    });

    function updatePagination() {
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        // In a real app, you would fetch data for the new page here
    }

    // Items per page change
    const itemsPerPage = document.getElementById('items-per-page');
    itemsPerPage.addEventListener('change', function () {
        alert(`Showing ${this.value} items per page`);
        // In a real app, you would reload the data with the new pagination size
    });
});