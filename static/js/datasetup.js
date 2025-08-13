document.addEventListener("DOMContentLoaded", () => {

    // =============================
    // TAB NAVIGATION HANDLER
    // =============================
    const navItems = document.querySelectorAll(".data-nav li");
    const sections = document.querySelectorAll(".content-section");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const sectionId = item.dataset.section + "-section";
            sections.forEach(sec => {
                sec.style.display = sec.id === sectionId ? "block" : "none";
            });
        });
    });

    // =============================
    // REUSABLE FETCH HELPERS
    // =============================
    function fetchJSON(url) {
        return fetch(url).then(res => res.json());
    }
    function postJSON(url, data) {
        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    }
    function putJSON(url, data) {
        return fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    }
    function deleteJSON(url) {
        return fetch(url, { method: "DELETE" });
    }

    // =============================
    // REGIONS CRUD
    // =============================
    // Export regions
    const regionExportBtn = document.querySelector('#regions-table').closest('.data-table-container').querySelector('.btn-secondary .fa-download')?.parentElement;
    if (regionExportBtn) {
        regionExportBtn.addEventListener('click', function () {
            let win = window.open('', '', 'width=900,height=700');
            let html = `
                <html>
                <head>
                    <title>Regions List</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        h2 { text-align: center; }
                        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                        th, td { border: 1px solid #888; padding: 8px; text-align: left; }
                        th { background: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h2>Regions List</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Region Name</th>
                                <th>Stations</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allRegions.map(r => `
                                <tr>
                                    <td>${r.id}</td>
                                    <td>${r.region_name}</td>
                                    <td>${r.stations || '-'}</td>
                                    <td>${r.last_updated || '-'}</td>
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
        });
    }
    const regionTableBody = document.querySelector("#regions-table tbody");
    const regionFormContainer = document.querySelector("#region-form-container");
    const regionForm = document.querySelector("#region-form");
    const regionNameInput = document.querySelector("#region-name");
    const regionIdInput = document.querySelector("#region-id");
    const regionSearchInput = document.getElementById("region-search");

    document.querySelector("#add-region-btn").addEventListener("click", () => {
        regionIdInput.value = "";
        regionNameInput.value = "";
        regionFormContainer.style.display = "block";
    });

    document.querySelector("#cancel-region").addEventListener("click", () => {
        regionFormContainer.style.display = "none";
    });

    let allRegions = [];
    function renderRegionsTable(data) {
        regionTableBody.innerHTML = "";
        data.forEach(r => {
            regionTableBody.innerHTML += `
                <tr>
                    <td>${r.id}</td>
                    <td>${r.region_name}</td>
                    <td>${r.stations || '-'}</td>
                    <td>${r.last_updated || '-'}</td>
                    <td>
                        <button class="action-btn edit" data-id="${r.id}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" data-id="${r.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
    function loadRegions() {
        fetchJSON("/api/regions").then(data => {
            allRegions = data;
            const regionSelect = document.querySelector("#district-region");
            const regionFilter = document.querySelector("#district-region-filter");
            regionSelect.innerHTML = `<option value="">Select Region</option>`;
            regionFilter.innerHTML = `<option value="">All Regions</option>`;
            data.forEach(r => {
                regionSelect.innerHTML += `<option value="${r.id}">${r.region_name}</option>`;
                regionFilter.innerHTML += `<option value="${r.id}">${r.region_name}</option>`;
            });
            renderRegionsTable(data);
        });
    }
    if (regionSearchInput) {
        regionSearchInput.addEventListener('input', function() {
            const term = this.value.trim().toLowerCase();
            renderRegionsTable(allRegions.filter(r =>
                r.region_name.toLowerCase().includes(term)
            ));
        });
    }

    regionForm.addEventListener("submit", e => {
        e.preventDefault();
        const id = regionIdInput.value;
        const payload = { name: regionNameInput.value };
        const req = id ? putJSON(`/api/regions/${id}`, payload) : postJSON("/api/regions", payload);
        req.then(() => {
            loadRegions();
            regionFormContainer.style.display = "none";
        });
    });

    regionTableBody.addEventListener("click", e => {
        if (e.target.closest(".edit")) {
            const id = e.target.closest(".edit").dataset.id;
            fetchJSON(`/api/regions`).then(data => {
                const r = data.find(x => x.id == id);
                if (r) {
                    regionIdInput.value = r.id;
                    regionNameInput.value = r.name;
                    regionFormContainer.style.display = "block";
                }
            });
        }
        if (e.target.closest(".delete")) {
            const id = e.target.closest(".delete").dataset.id;
            if (confirm("Delete this region?")) {
                deleteJSON(`/api/regions/${id}`).then(() => loadRegions());
            }
        }
    });

    // =============================
    // DISTRICTS CRUD
    // =============================
    // Export districts
    const districtExportBtn = document.querySelector('#districts-table').closest('.data-table-container').querySelector('.btn-secondary .fa-download')?.parentElement;
    if (districtExportBtn) {
        districtExportBtn.addEventListener('click', function () {
            let win = window.open('', '', 'width=900,height=700');
            let html = `
                <html>
                <head>
                    <title>Districts List</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        h2 { text-align: center; }
                        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                        th, td { border: 1px solid #888; padding: 8px; text-align: left; }
                        th { background: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h2>Districts List</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>District Name</th>
                                <th>Region</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allDistricts.map(d => `
                                <tr>
                                    <td>${d.id}</td>
                                    <td>${d.district_name}</td>
                                    <td>${d.region_name}</td>
                                    <td>${d.last_updated || '-'}</td>
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
        });
    }
    const districtTableBody = document.querySelector("#districts-table tbody");
    const districtFormContainer = document.querySelector("#district-form-container");
    const districtForm = document.querySelector("#district-form");
    const districtNameInput = document.querySelector("#district-name");
    const districtIdInput = document.querySelector("#district-id");
    const districtRegionSelect = document.querySelector("#district-region");
    const districtSearchInput = document.getElementById("district-search");

    document.querySelector("#add-district-btn").addEventListener("click", () => {
        districtIdInput.value = "";
        districtNameInput.value = "";
        districtRegionSelect.value = "";
        districtFormContainer.style.display = "block";
    });

    document.querySelector("#cancel-district").addEventListener("click", () => {
        districtFormContainer.style.display = "none";
    });

    let allDistricts = [];
    function renderDistrictsTable(data) {
        districtTableBody.innerHTML = "";
        data.forEach(d => {
            districtTableBody.innerHTML += `
                <tr>
                    <td>${d.id}</td>
                    <td>${d.district_name}</td>
                    <td>${d.region_name}</td>
                    <td>${d.last_updated || '-'}</td>
                    <td>
                        <button class="action-btn edit" data-id="${d.id}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" data-id="${d.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
    function loadDistricts() {
        fetchJSON("/api/districts").then(data => {
            allDistricts = data;
            renderDistrictsTable(data);
        });
    }
    if (districtSearchInput) {
        districtSearchInput.addEventListener('input', function() {
            const term = this.value.trim().toLowerCase();
            renderDistrictsTable(allDistricts.filter(d =>
                d.district_name.toLowerCase().includes(term) ||
                d.region_name.toLowerCase().includes(term)
            ));
        });
    }

    districtForm.addEventListener("submit", e => {
        e.preventDefault();
        const id = districtIdInput.value;
        const payload = { name: districtNameInput.value, region_id: districtRegionSelect.value };
        const req = id ? putJSON(`/api/districts/${id}`, payload) : postJSON("/api/districts", payload);
        req.then(() => {
            loadDistricts();
            districtFormContainer.style.display = "none";
        });
    });

    districtTableBody.addEventListener("click", e => {
        if (e.target.closest(".edit")) {
            const id = e.target.closest(".edit").dataset.id;
            fetchJSON(`/api/districts`).then(data => {
                const d = data.find(x => x.id == id);
                if (d) {
                    districtIdInput.value = d.id;
                    districtNameInput.value = d.name;
                    districtRegionSelect.value = d.region_id;
                    districtFormContainer.style.display = "block";
                }
            });
        }
        if (e.target.closest(".delete")) {
            const id = e.target.closest(".delete").dataset.id;
            if (confirm("Delete this district?")) {
                deleteJSON(`/api/districts/${id}`).then(() => loadDistricts());
            }
        }
    });

    // =============================
    // GROUPS CRUD
    // =============================
    // Export groups
    const groupExportBtn = document.querySelector('#groups-table').closest('.data-table-container').querySelector('.btn-secondary .fa-download')?.parentElement;
    if (groupExportBtn) {
        groupExportBtn.addEventListener('click', function () {
            let win = window.open('', '', 'width=900,height=700');
            let html = `
                <html>
                <head>
                    <title>Groups List</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        h2 { text-align: center; }
                        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                        th, td { border: 1px solid #888; padding: 8px; text-align: left; }
                        th { background: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h2>Groups List</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Group Name</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allGroups.map(g => `
                                <tr>
                                    <td>${g.id}</td>
                                    <td>${g.group_name}</td>
                                    <td>${g.last_updated || '-'}</td>
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
        });
    }
    const groupTableBody = document.querySelector("#groups-table tbody");
    const groupFormContainer = document.querySelector("#group-form-container");
    const groupForm = document.querySelector("#group-form");
    const groupNameInput = document.querySelector("#group-name");
    const groupIdInput = document.querySelector("#group-id");
    const groupSearchInput = document.getElementById("group-search");

    document.querySelector("#add-group-btn").addEventListener("click", () => {
        groupIdInput.value = "";
        groupNameInput.value = "";
        groupFormContainer.style.display = "block";
    });

    document.querySelector("#cancel-group").addEventListener("click", () => {
        groupFormContainer.style.display = "none";
    });

    let allGroups = [];
    function renderGroupsTable(data) {
        groupTableBody.innerHTML = "";
        data.forEach(g => {
            groupTableBody.innerHTML += `
                <tr>
                    <td>${g.id}</td>
                    <td>${g.group_name}</td>
                    <td>${g.last_updated || '-'}</td>
                    <td>
                        <button class="action-btn edit" data-id="${g.id}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" data-id="${g.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
    function loadGroups() {
        fetchJSON("/api/groups").then(data => {
            allGroups = data;
            renderGroupsTable(data);
        });
    }
    if (groupSearchInput) {
        groupSearchInput.addEventListener('input', function() {
            const term = this.value.trim().toLowerCase();
            renderGroupsTable(allGroups.filter(g =>
                g.group_name.toLowerCase().includes(term)
            ));
        });
    }

    groupForm.addEventListener("submit", e => {
        e.preventDefault();
        const id = groupIdInput.value;
        const payload = { name: groupNameInput.value };
        const req = id ? putJSON(`/api/groups/${id}`, payload) : postJSON("/api/groups", payload);
        req.then(() => {
            loadGroups();
            groupFormContainer.style.display = "none";
        });
    });

    groupTableBody.addEventListener("click", e => {
        if (e.target.closest(".edit")) {
            const id = e.target.closest(".edit").dataset.id;
            fetchJSON(`/api/groups`).then(data => {
                const g = data.find(x => x.id == id);
                if (g) {
                    groupIdInput.value = g.id;
                    groupNameInput.value = g.name;
                    groupFormContainer.style.display = "block";
                }
            });
        }
        if (e.target.closest(".delete")) {
            const id = e.target.closest(".delete").dataset.id;
            if (confirm("Delete this group?")) {
                deleteJSON(`/api/groups/${id}`).then(() => loadGroups());
            }
        }
    });

    // =============================
    // INITIAL LOAD
    // =============================
    loadRegions();
    loadDistricts();
    loadGroups();

});
