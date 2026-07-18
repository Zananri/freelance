document.addEventListener('DOMContentLoaded', function () {
    var wrapper = document.querySelector('.monitoring-wrapper');
    var mapElement = document.getElementById('monitoringMap');
    if (!wrapper || !mapElement) {
        return;
    }

    var monitoringDataUrl = wrapper.dataset.monitoringUrl;
    var divisions = [];
    var employees = [];
    var checkins = [];
    var selectedEmployeeId = null;

    var monitoringMap = L.map('monitoringMap', {
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: true,
    }).setView([-6.2, 106.816666], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(monitoringMap);

    var markerLayer = L.layerGroup().addTo(monitoringMap);

    var divisionListElement = document.getElementById('divisionList');
    var employeeListElement = document.getElementById('employeeList');
    var divisionSearch = document.querySelector('.division-search');
    var employeeSearch = document.querySelector('.employee-search');
    var divisionFilter = document.querySelector('.division-filter');

    function escapeHtml(text) {
        return String(text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#039;');
    }

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) {
            return '-';
        }
        var date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getCheckinByEmployee(employeeId) {
        return checkins.find(function (checkin) {
            return checkin.employee_id === employeeId;
        });
    }

    function createMarker(checkin, employeeName, showLabel = false) {

        var marker = L.marker(
            [checkin.lat, checkin.lng],
            {
                icon: createPinIcon(checkin.type)
            }
        );

        var label = checkin.type === 'check_out'
            ? 'Checked-out'
            : 'Checked-in';

        marker.bindPopup(
            '<strong>' + employeeName + '</strong><br/>' +
            label + ': ' + escapeHtml(formatDateTime(checkin.date_time))
        );

        if (showLabel) {
            marker.bindTooltip(
                employeeName + '<br>' + label + ': ' + escapeHtml(formatDateTime(checkin.date_time)),
                {
                    permanent: true,
                    direction: 'top',
                    offset: [0, -12],
                    className: 'employee-map-label'
                }
            );
        }

        marker.on('click', function () {
            setSelectedEmployee(checkin.employee_id, true);
        });

        return marker;
    }

    function createPinIcon(type) {

        let color = "#0d6efd";

        if (type === "check_out") {
            color = "#dc3545";
        }

        return L.divIcon({
            className: "",
            html: `
                <div style="
                    width:18px;
                    height:18px;
                    border-radius:50%;
                    background:${color};
                    border:3px solid white;
                    box-shadow:0 0 6px rgba(0,0,0,.3);
                "></div>
            `,
            iconSize: [18,18],
            iconAnchor: [9,9]
        });

    }

    function renderMarkers() {

        markerLayer.clearLayers();

        if (!checkins.length) return;

        let visibleCheckins = checkins;

        if (selectedEmployeeId) {
            visibleCheckins = checkins.filter(c => c.employee_id === selectedEmployeeId);
        }

        const bounds = [];

        visibleCheckins.forEach(function (checkin) {

            const employee = employees.find(e => e.id === checkin.employee_id);

            if (!employee) return;

            const marker = createMarker(
                checkin,
                employee.name,
                selectedEmployeeId === checkin.employee_id
            );

            markerLayer.addLayer(marker);

            bounds.push([checkin.lat, checkin.lng]);
        });

        if (bounds.length) {
            monitoringMap.fitBounds(bounds, {
                padding: [40,40],
                maxZoom:14
            });
        }

    }

    function renderDivisionOptions() {
        divisionFilter.innerHTML = '<option value="all">All Division</option>' +
            divisions.map(function (division) {
                return '<option value="' + division.id + '">' + division.name + '</option>';
            }).join('');
    }

    function renderDivisionList() {
        var searchTerm = (divisionSearch.value || '').trim().toLowerCase();
        var activeDivision = divisionFilter.value;

        var filtered = divisions.filter(function (division) {
            var matchesDivision = activeDivision === 'all' || String(division.id) === String(activeDivision);
            var matchesSearch = division.name.toLowerCase().indexOf(searchTerm) !== -1 ||
                (division.department || '').toLowerCase().indexOf(searchTerm) !== -1;

            return matchesDivision && matchesSearch;
        });

        divisionListElement.innerHTML = filtered.map(function (division) {
            return '<div class="division-item card p-2 mb-2" data-division-id="' + division.id + '">' +
                '<div class="d-flex justify-content-between align-items-center">' +
                    '<div>' +
                        '<div class="fw-semibold">' + division.name + '</div>' +
                        '<div class="text-muted small">Department: ' + division.department + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        divisionListElement.querySelectorAll('.division-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var divisionId = item.dataset.divisionId;
                divisionFilter.value = divisionId;
                renderDivisionList();
                renderEmployeeList();
            });
        });
    }

    function renderEmployeeList() {
        var searchTerm = (employeeSearch.value || '').trim().toLowerCase();
        var activeDivision = divisionFilter.value;

        var filtered = employees.filter(function (employee) {
            var matchesDivision = activeDivision === 'all' || String(employee.division_id) === String(activeDivision);
            var matchesSearch = employee.name.toLowerCase().indexOf(searchTerm) !== -1 ||
                (employee.division_name || '').toLowerCase().indexOf(searchTerm) !== -1 ||
                (employee.job_name || '').toLowerCase().indexOf(searchTerm) !== -1;

            return matchesDivision && matchesSearch;
        });

        employeeListElement.innerHTML = filtered.map(function (employee) {
            var checkin = getCheckinByEmployee(employee.id);
            var statusLabel = checkin ? 'Checked in' : 'No check-in';
            var statusClass = checkin ? 'text-success' : 'text-muted';
            var selectedClass = selectedEmployeeId === employee.id ? 'border-primary' : 'border-transparent';

            return '<div class="employee-item card p-2 mb-2 ' + selectedClass + '" data-employee-id="' + employee.id + '">' +
                '<div class="d-flex justify-content-between align-items-start">' +
                    '<div>' +
                        '<div class="fw-semibold">' + employee.name + '</div>' +
                        '<div class="small text-muted">' + (employee.division_name || 'No division') + ' • ' + (employee.job_name || 'No job') + '</div>' +
                    '</div>' +
                    '<div class="text-end fs-8">' +
                        '<div class="small ' + statusClass + '">' + statusLabel + '</div>' +
                        (checkin ? '<div class="small text-muted">' + formatDateTime(checkin.date_time) + '</div>' : '') +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        employeeListElement.querySelectorAll('.employee-item').forEach(function (item) {
            item.addEventListener('click', function () {
                setSelectedEmployee(parseInt(item.dataset.employeeId, 10), true);
            });
        });
    }

    function setSelectedEmployee(employeeId, centerOnMarker) {
        selectedEmployeeId = employeeId;
        renderEmployeeList();
        renderMarkers();

        if (centerOnMarker) {
            var checkin = getCheckinByEmployee(employeeId);
            if (checkin) {
                monitoringMap.setView([checkin.lat, checkin.lng], 14);
            }

            markerLayer.eachLayer(function (layer) {
                if (!layer || !layer.getLatLng) return;

                var ll = layer.getLatLng();
                var matched = checkins.some(function (c) {
                    return (
                        c.employee_id === employeeId &&
                        typeof c.lat === 'number' &&
                        typeof c.lng === 'number' &&
                        c.lat === ll.lat &&
                        c.lng === ll.lng
                    );
                });

                if (matched) {
                    layer.bindPopup(layer.getPopup());
                    layer.openPopup();
                }
            });
        }
    }

    function fetchMonitoringData() {
        if (!monitoringDataUrl) {
            return;
        }

        fetch(monitoringDataUrl, {
            headers: {
                'Accept': 'application/json',
            },
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                if (!json || json.code !== 200 || !json.data) {
                    return;
                }

                divisions = json.data.divisions || [];
                employees = json.data.employees || [];
                checkins = json.data.checkins || [];

                renderDivisionOptions();
                renderDivisionList();
                renderEmployeeList();
                renderMarkers();

                setTimeout(function () {
                    monitoringMap.invalidateSize();
                }, 200);
            })
            .catch(function (error) {
                console.error('Failed to load monitoring data:', error);
            });
    }

    divisionSearch.addEventListener('input', function () {
        renderDivisionList();
    });

    divisionFilter.addEventListener('change', function () {
        renderEmployeeList();
        renderDivisionList();
    });

    employeeSearch.addEventListener('input', function () {
        renderEmployeeList();
    });

    fetchMonitoringData();
});
