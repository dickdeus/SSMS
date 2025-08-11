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
    const regionTableBody = document.querySelector("#regions-table tbody");
    const regionFormContainer = document.querySelector("#region-form-container");
    const regionForm = document.querySelector("#region-form");
    const regionNameInput = document.querySelector("#region-name");
    const regionIdInput = document.querySelector("#region-id");

    document.querySelector("#add-region-btn").addEventListener("click", () => {
        regionIdInput.value = "";
        regionNameInput.value = "";
        regionFormContainer.style.display = "block";
    });

    document.querySelector("#cancel-region").addEventListener("click", () => {
        regionFormContainer.style.display = "none";
    });

    function loadRegions() {
        fetchJSON("/api/regions").then(data => {
            regionTableBody.innerHTML = "";
            const regionSelect = document.querySelector("#district-region");
            const regionFilter = document.querySelector("#district-region-filter");
            regionSelect.innerHTML = `<option value="">Select Region</option>`;
            regionFilter.innerHTML = `<option value="">All Regions</option>`;

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
                regionSelect.innerHTML += `<option value="${r.id}">${r.region_name}</option>`;
                regionFilter.innerHTML += `<option value="${r.id}">${r.region_name}</option>`;
            });
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
    const districtTableBody = document.querySelector("#districts-table tbody");
    const districtFormContainer = document.querySelector("#district-form-container");
    const districtForm = document.querySelector("#district-form");
    const districtNameInput = document.querySelector("#district-name");
    const districtIdInput = document.querySelector("#district-id");
    const districtRegionSelect = document.querySelector("#district-region");

    document.querySelector("#add-district-btn").addEventListener("click", () => {
        districtIdInput.value = "";
        districtNameInput.value = "";
        districtRegionSelect.value = "";
        districtFormContainer.style.display = "block";
    });

    document.querySelector("#cancel-district").addEventListener("click", () => {
        districtFormContainer.style.display = "none";
    });

    function loadDistricts() {
        fetchJSON("/api/districts").then(data => {
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
    const groupTableBody = document.querySelector("#groups-table tbody");
    const groupFormContainer = document.querySelector("#group-form-container");
    const groupForm = document.querySelector("#group-form");
    const groupNameInput = document.querySelector("#group-name");
    const groupIdInput = document.querySelector("#group-id");

    document.querySelector("#add-group-btn").addEventListener("click", () => {
        groupIdInput.value = "";
        groupNameInput.value = "";
        groupFormContainer.style.display = "block";
    });

    document.querySelector("#cancel-group").addEventListener("click", () => {
        groupFormContainer.style.display = "none";
    });

    function loadGroups() {
        fetchJSON("/api/groups").then(data => {
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
