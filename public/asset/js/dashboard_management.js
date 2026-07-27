const appUrl = $("meta[name=app-url]").attr("content");
const currentUserType = (
    $('meta[name="current-user-type"]').attr("content") || ""
).toUpperCase();

function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


let widgetAreaLayer = null;
let widgetSecurityColorMap = {};
window.__widgetSecurityZoneState = window.__widgetSecurityZoneState || {};
let widgetMonitoringMap = null;
let widgetMarkerLayer = null;
let widgetUserLocationMarker = null;
let widgetDefaultCenter = [-6.2, 106.816666];
let widgetUserLocation = null;
let widgetMonitoringPollingTimer = null;
let widgetMonitoringRequestInFlight = false;
let widgetPointModal = null;

const departmentColorPalette = [
    "#0d6efd",
    "#e74c3c",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#3498db",
    "#e84393",
    "#34495e",
];

let departmentColorMap = {};

function departmentColorKey(employee) {
    return employee.department_id != null
        ? String(employee.department_id)
        : employee.department_name || "unknown";
}

function buildDepartmentColorMap(employees) {
    departmentColorMap = {};

    const seen = {};
    const uniqueDepartments = [];

    employees.forEach(function (employee) {
        const key = departmentColorKey(employee);
        if (!seen[key]) {
            seen[key] = true;
            uniqueDepartments.push({
                key: key,
                name: employee.department_name || "Unknown Department",
            });
        }
    });

    uniqueDepartments.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });

    uniqueDepartments.forEach(function (dept, index) {
        departmentColorMap[dept.key] =
            departmentColorPalette[index % departmentColorPalette.length];
    });
}

function getDepartmentColor(employee) {
    return departmentColorMap[departmentColorKey(employee)] || "#6c757d";
}

function pointBadgeColor(type, sourceType, isLive) {
    if (type === "check_out") {
        return "#dc3545";
    }
    if (type === "check_in") {
        return "#28a745";
    }
    if (isLive || sourceType === "live") {
        return "#0dcaf0";
    }
    return "#f39c12";
}

function pointTypeLabel(type, sourceType, isLive) {
    if (type === "check_out") {
        return "Check Out";
    }
    if (type === "check_in") {
        return "Check In";
    }
    if (isLive || sourceType === "live") {
        return "Checkpoint Live";
    }
    return "Checkpoint";
}

function createStickmanIcon(color, type, sourceType, isLive) {
    const badgeColor = pointBadgeColor(type, sourceType, isLive);

    return L.divIcon({
        className: "",
        html: `
            <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="6" r="4" fill="${color}" />
                <line x1="15" y1="10" x2="15" y2="19" stroke="${color}" stroke-width="3" stroke-linecap="round" />
                <line x1="9" y1="13" x2="21" y2="13" stroke="${color}" stroke-width="3" stroke-linecap="round" />
                <line x1="15" y1="19" x2="10" y2="27" stroke="${color}" stroke-width="3" stroke-linecap="round" />
                <line x1="15" y1="19" x2="20" y2="27" stroke="${color}" stroke-width="3" stroke-linecap="round" />
                <circle cx="28" cy="8" r="5" fill="${badgeColor}" stroke="#ffffff" stroke-width="1.5" />
            </svg>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 28],
        popupAnchor: [0, -24],
    });
}

function buildMarkerTooltip(employee, checkin) {
    const statusClass =
        checkin.type === "check_out"
            ? "#dc3545"
            : checkin.type === "check_in"
                ? "#28a745"
                : "#f39c12";
    const statusText = pointTypeLabel(checkin.type, checkin.source_type, checkin.is_live);
    const isLive = checkin.is_live || checkin.source_type === "live";

    if (isLive || !checkin.image_url) {
        return '<div style="display:flex;align-items:center;min-width:150px;padding:7px 10px;border-radius:10px;background:#ffffff;box-shadow:0 8px 18px rgba(0,0,0,.2);">' +
            '<div style="min-width:0;">' +
                '<div style="font-size:8px;font-weight:700;color:#213047;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(employee.name || "-") + '</div>' +
                '<div style="font-size:8px;color:#5d6981;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(employee.partner_name || "-") + '</div>' +
            '</div>' +
        '</div>';
    }

    if (checkin.image_url) {
        return '<div style="display:flex;align-items:center;gap:8px;min-width:190px;padding:7px 9px;border-radius:10px;background:#ffffff;box-shadow:0 8px 18px rgba(0,0,0,.2);">' +
            '<img src="' + escapeHtml(checkin.image_url) + '" alt="" style="width:20px;height:20px;aspect-ratio:1/1;object-fit:cover;border-radius:8px;display:block;">' +
            '<div style="min-width:0;">' +
                '<div style="font-size:8px;font-weight:700;color:#213047;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(employee.name || "-") + '</div>' +
                '<div style="font-size:8px;color:#5d6981;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(employee.partner_name || "-") + '</div>' +
            '</div>' +
            '</div>';
    }

    return "";
}

function createPointLabelIcon(employee, checkin) {
    return L.divIcon({
        className: "dashboard-marker-label-wrap",
        html: buildMarkerTooltip(employee, checkin),
        iconSize: [190, 74],
        iconAnchor: [95, 76],
    });
}

function ensureWidgetPointModal() {
    if (widgetPointModal) {
        return widgetPointModal;
    }

    const modalId = "dashboardMonitoringPointModal";
    const html =
        '<div class="modal fade" id="' + modalId + '" tabindex="-1" aria-hidden="true">' +
        '  <div class="modal-dialog modal-dialog-centered">' +
        '    <div class="modal-content border-0 rounded-4">' +
        '      <div class="modal-header border-0 pb-0">' +
        '        <h5 class="modal-title fw-semibold">Employee Point Detail</h5>' +
        '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
        '      </div>' +
        '      <div class="modal-body pt-2" id="dashboardMonitoringPointModalBody"></div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

    $("body").append(html);
    widgetPointModal = new bootstrap.Modal(document.getElementById(modalId));
    return widgetPointModal;
}

function openWidgetPointModal(employee, checkin) {
    const modal = ensureWidgetPointModal();
    let bodyHtml =
        '<div class="mb-2">' +
        '<div class="fw-semibold">' + escapeHtml(employee.name || "-") + '</div>' +
        '<div class="small text-secondary">' + escapeHtml(employee.partner_name || "-") + ' • ' + escapeHtml(employee.division_name || "-") + '</div>' +
        '</div>' +
        '<div class="mb-2"><span class="badge ' +
            (checkin.type === "check_out" ? "bg-danger" : checkin.type === "check_in" ? "bg-success" : "bg-warning") +
            '">' + escapeHtml(pointTypeLabel(checkin.type, checkin.source_type, checkin.is_live)) + '</span></div>' +
        '<div class="small text-secondary mb-2">' + escapeHtml(formatWidgetCheckinTime(checkin.date_time)) + '</div>';

    if (checkin.image_url) {
        bodyHtml += '<img src="' + escapeHtml(checkin.image_url) + '" alt="" style="width:92px;height:92px;aspect-ratio:1/1;border-radius:10px;object-fit:cover;display:block;">';
    }

    $("#dashboardMonitoringPointModalBody").html(bodyHtml);
    modal.show();
}

function initWidgetMonitoringMap() {
    const mapElement = document.getElementById("widgetMonitoringMap");

    if (!mapElement || widgetMonitoringMap) {
        return;
    }

    if (mapElement.offsetHeight === 0) {
        mapElement.style.height = "260px";
    }

    widgetMonitoringMap = L.map(mapElement, {
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: false,
    }).setView(widgetDefaultCenter, 5);

    L.control.zoom({ position: "topright" }).addTo(widgetMonitoringMap);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
    }).addTo(widgetMonitoringMap);

    widgetMarkerLayer = L.layerGroup().addTo(widgetMonitoringMap);
    widgetAreaLayer = L.layerGroup().addTo(widgetMonitoringMap);

    [100, 400, 1000].forEach(function (delay) {
        setTimeout(function () {
            if (widgetMonitoringMap) {
                widgetMonitoringMap.invalidateSize();
            }
        }, delay);
    });

    $(window).on("resize", function () {
        if (widgetMonitoringMap) {
            widgetMonitoringMap.invalidateSize();
        }
    });

    centerMapOnUserLocation();
}

function centerMapOnUserLocation() {
    if (!widgetMonitoringMap || !navigator.geolocation) {
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            widgetUserLocation = [lat, lng];
            widgetMonitoringMap.setView(widgetUserLocation, 13);

            if (widgetUserLocationMarker) {
                widgetMonitoringMap.removeLayer(widgetUserLocationMarker);
            }

            widgetUserLocationMarker = L.marker(widgetUserLocation, {
                icon: createStickmanIcon("#28a745", "checkpoint", "live", true),
            })
                .addTo(widgetMonitoringMap)
                .bindPopup("Your current location");

            setTimeout(function () {
                widgetMonitoringMap.invalidateSize();
            }, 200);
        },
        function (error) {
            console.warn("Unable to get user location:", error.message);
        },
        { enableHighAccuracy: true, timeout: 8000 },
    );
}

function formatWidgetCheckinTime(dateTimeString) {
    if (!dateTimeString) {
        return "-";
    }
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function renderMonitoringLegend(employees) {
    const legendContainer = document.getElementById("widgetMonitoringLegend");
    if (!legendContainer) {
        return;
    }

    const entries = Object.keys(departmentColorMap);
    if (!entries.length) {
        legendContainer.innerHTML = "";
        return;
    }

    const nameByKey = {};
    employees.forEach(function (employee) {
        nameByKey[departmentColorKey(employee)] = employee.department_name || "-";
    });

    let html = "";
    entries.forEach(function (key) {
        const color = departmentColorMap[key];
        const name = nameByKey[key] || "Unknown Department";
        html += `
            <div class="legend-item d-inline-flex align-items-center me-3 mb-1">
                <span class="legend-dot" style="background-color:${color}"></span>
                <span class="legend-label fs-11">${escapeHtml(name)}</span>
            </div>
        `;
    });

    legendContainer.innerHTML = html;
}

function hashToHue(value) {
    const text = String(value ?? "");
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) % 360;
    }
    return hash;
}

function getSecurityZoneColor(employee) {
    const key = String(employee?.id ?? employee?.name ?? "unknown");
    if (!widgetSecurityColorMap[key]) {
        widgetSecurityColorMap[key] = "hsl(" + hashToHue(key) + ", 72%, 50%)";
    }
    return widgetSecurityColorMap[key];
}

function isSecurityEmployee(employee) {
    return String(employee?.job_name || "").trim().toUpperCase() === "TENAGA KEAMANAN";
}

function getRequiredCheckpointCount(employee) {
    return Number(employee.required_checkpoint_count || 0);
}

function normalizePointType(point) {
    return String(point?.type || "").trim().toLowerCase();
}

function isSecurityCheckpoint(point) {
    const type = normalizePointType(point);
    const sourceType = String(point?.source_type || "").trim().toLowerCase();
    return !point.is_live && sourceType !== "live" && (type === "check_in" || type === "checkpoint");
}

function sortPointsByDate(points) {
    return points.slice().sort(function (a, b) {
        return new Date(a.date_time || 0).getTime() - new Date(b.date_time || 0).getTime();
    });
}

function getUniqueCoordinates(points) {
    const coordinates = [];
    const seen = {};
    points.forEach(function (point) {
        const lat = Number(point.lat);
        const lng = Number(point.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const key = lat.toFixed(7) + "," + lng.toFixed(7);
        if (seen[key]) return;
        seen[key] = true;
        coordinates.push([lat, lng]);
    });
    return coordinates;
}

function getSecurityPhotos(points) {
    return points
        .map(function (point, index) {
            if (!point.image_url) return null;
            return {
                image_url: point.image_url,
                type: normalizePointType(point),
                label: normalizePointType(point) === "check_in" ? "Check In" : "Checkpoint " + (index + 1),
                date_time: point.date_time,
            };
        })
        .filter(Boolean);
}

function getSecurityCheckInPhoto(photos) {
    let checkInPhoto = null;
    photos.forEach(function (photo) {
        if (!checkInPhoto && photo.type === "check_in") checkInPhoto = photo;
    });
    return checkInPhoto || photos[0] || null;
}

function getSecurityCheckpointPhotos(photos, checkInPhoto) {
    return photos.filter(function (photo) {
        return photo !== checkInPhoto;
    });
}

let widgetSecurityGalleryModal = null;
let widgetSecurityGalleryPhotos = [];
let widgetSecurityGalleryIndex = 0;

function ensureWidgetSecurityGalleryModal() {
    if (widgetSecurityGalleryModal) return widgetSecurityGalleryModal;

    const html =
        '<div class="modal fade" id="widgetSecurityGalleryModal" tabindex="-1" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered modal-lg">' +
        '<div class="modal-content border-0 rounded-4 security-gallery-modal">' +
        '<div class="modal-header border-0">' +
        '<div>' +
        '<h5 class="modal-title fw-semibold mb-1" id="widgetSecurityGalleryTitle"></h5>' +
        '<div class="small text-secondary" id="widgetSecurityGallerySubtitle"></div>' +
        '</div>' +
        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
        '</div>' +
        '<div class="modal-body pt-0">' +
        '<div class="security-gallery-viewer">' +
        '<button type="button" class="security-gallery-nav widget-security-gallery-prev">' +
        '<span class="material-symbols-outlined">chevron_left</span></button>' +
        '<img id="widgetSecurityGalleryImage" class="security-gallery-image" src="" alt="Checkpoint">' +
        '<button type="button" class="security-gallery-nav widget-security-gallery-next">' +
        '<span class="material-symbols-outlined">chevron_right</span></button>' +
        '</div>' +
        '<div class="security-gallery-information">' +
        '<div>' +
        '<div class="fw-semibold" id="widgetSecurityGalleryCaption"></div>' +
        '<div class="small text-secondary" id="widgetSecurityGalleryDate"></div>' +
        '</div>' +
        '<div class="security-gallery-counter" id="widgetSecurityGalleryCounter"></div>' +
        '</div>' +
        '<div class="security-gallery-thumbnails" id="widgetSecurityGalleryThumbnails"></div>' +
        '</div></div></div></div>';

    $("body").append(html);
    widgetSecurityGalleryModal = new bootstrap.Modal(document.getElementById("widgetSecurityGalleryModal"));

    $(document).on("click", ".widget-security-gallery-prev", function () {
        showWidgetSecurityGalleryPhoto(widgetSecurityGalleryIndex - 1);
    });
    $(document).on("click", ".widget-security-gallery-next", function () {
        showWidgetSecurityGalleryPhoto(widgetSecurityGalleryIndex + 1);
    });
    $(document).on("click", ".widget-security-gallery-thumbnail", function () {
        showWidgetSecurityGalleryPhoto(Number($(this).data("index")));
    });

    return widgetSecurityGalleryModal;
}

function renderWidgetSecurityGalleryThumbnails() {
    let html = "";
    widgetSecurityGalleryPhotos.forEach(function (photo, index) {
        const activeClass = index === widgetSecurityGalleryIndex ? "is-active" : "";
        html +=
            '<button type="button" class="security-gallery-thumbnail widget-security-gallery-thumbnail ' +
            activeClass + '" data-index="' + index + '">' +
            '<img src="' + escapeHtml(photo.image_url) + '" alt="' + escapeHtml(photo.label) + '"></button>';
    });
    $("#widgetSecurityGalleryThumbnails").html(html);
}

function showWidgetSecurityGalleryPhoto(index) {
    if (!widgetSecurityGalleryPhotos.length) return;
    if (index < 0) index = widgetSecurityGalleryPhotos.length - 1;
    if (index >= widgetSecurityGalleryPhotos.length) index = 0;
    widgetSecurityGalleryIndex = index;

    const photo = widgetSecurityGalleryPhotos[index];
    $("#widgetSecurityGalleryImage").attr("src", photo.image_url);
    $("#widgetSecurityGalleryCaption").text(photo.label);
    $("#widgetSecurityGalleryDate").text(formatWidgetCheckinTime(photo.date_time));
    $("#widgetSecurityGalleryCounter").text(index + 1 + " / " + widgetSecurityGalleryPhotos.length);
    $(".widget-security-gallery-prev, .widget-security-gallery-next").toggle(widgetSecurityGalleryPhotos.length > 1);
    renderWidgetSecurityGalleryThumbnails();
}

function openWidgetSecurityGallery(employee, photos, selectedIndex) {
    if (!photos.length) return;
    widgetSecurityGalleryPhotos = photos;
    widgetSecurityGalleryIndex = Number(selectedIndex || 0);

    $("#widgetSecurityGalleryTitle").text(employee.name || "-");
    $("#widgetSecurityGallerySubtitle").text((employee.partner_name || "-") + " • " + (employee.division_name || "-"));

    showWidgetSecurityGalleryPhoto(widgetSecurityGalleryIndex);
    ensureWidgetSecurityGalleryModal().show();
}

function buildWidgetSecurityZoneLabel(employee, photos, checkInPhoto, checkpointPhotos, color) {
    const checkpointPreview = checkpointPhotos[0] || checkInPhoto;
    const remainingPhotos = Math.max(checkpointPhotos.length - 1, 0);

    const checkInFrame = checkInPhoto
        ? '<img src="' + escapeHtml(checkInPhoto.image_url) + '" alt="Check In">'
        : '<div class="security-zone-empty">No Photo</div>';

    const checkpointFrame = checkpointPreview
        ? '<img src="' + escapeHtml(checkpointPreview.image_url) + '" alt="Checkpoint">'
        : '<div class="security-zone-empty">No Photo</div>';

    return (
        '<div class="security-zone-label" style="--security-zone-color:' + escapeHtml(color) + ';">' +
        '<div class="security-zone-header">' +
        '<div class="security-zone-employee">' +
        '<div class="security-zone-name fs-8">' + escapeHtml(employee.name || "-") + '</div>' +
        '<div class="security-zone-partner fs-8">' + escapeHtml(employee.partner_name || "-") + '</div>' +
        '</div>' +
        '</div>' +
        '<div class="security-zone-frames">' +
        '<button type="button" class="security-zone-frame" data-gallery-index="0">' +
        checkInFrame +
        '<span class="security-zone-frame-label">Check In</span>' +
        '</button>' +
        '<button type="button" class="security-zone-frame" data-gallery-index="' + Math.min(1, photos.length - 1) + '">' +
        checkpointFrame +
        (remainingPhotos > 0 ? '<span class="security-zone-more-count">+' + remainingPhotos + '</span>' : "") +
        '<span class="security-zone-frame-label">Checkpoint</span>' +
        '</button>' +
        '</div>' +
        '</div>'
    );
}

function bindWidgetSecurityZoneEvents(zoneMarker, polygon, employee, photos) {
    zoneMarker.on("add", function () {
        const element = zoneMarker.getElement();
        if (!element) return;

        $(element)
            .off(".widgetSecurityZone")
            .on("click.widgetSecurityZone", ".security-zone-frame", function (event) {
                event.preventDefault();
                event.stopPropagation();
                const selectedIndex = Number($(this).data("gallery-index") || 0);
                openWidgetSecurityGallery(employee, photos, selectedIndex);
            });
    });

    polygon.on("click", function () {
        openWidgetSecurityGallery(employee, photos, 0);
    });
}

function renderWidgetSecurityZone(filteredPoints, employeeMap) {
    const groupedPoints = {};

    filteredPoints.forEach(function (point) {
        const employee = employeeMap[String(point.employee_id)];
        if (!employee || !isSecurityEmployee(employee)) return;
        if (!isSecurityCheckpoint(point)) return;

        const employeeId = String(point.employee_id);
        groupedPoints[employeeId] = groupedPoints[employeeId] || [];
        groupedPoints[employeeId].push(point);
    });

    Object.keys(groupedPoints).forEach(function (employeeId) {
        const employee = employeeMap[employeeId];
        if (!employee) return;

        const orderedPoints = sortPointsByDate(groupedPoints[employeeId]);
        const requiredCheckpointCount = getRequiredCheckpointCount(employee);

        if (requiredCheckpointCount <= 0 || orderedPoints.length < requiredCheckpointCount) {
            return;
        }

        const completedPoints = orderedPoints.slice(0, requiredCheckpointCount);
        const coordinates = getUniqueCoordinates(completedPoints);

        if (coordinates.length < 3) return;

        const photos = getSecurityPhotos(completedPoints);
        const checkInPhoto = getSecurityCheckInPhoto(photos);
        const checkpointPhotos = getSecurityCheckpointPhotos(photos, checkInPhoto);
        const color = getSecurityZoneColor(employee);

        const polygon = L.polygon(coordinates, {
            color: color,
            weight: 3,
            opacity: 0.95,
            fillColor: color,
            fillOpacity: 0.16,
        });

        const center = polygon.getBounds().getCenter();

        const zoneIcon = L.divIcon({
            className: "monitoring-security-zone-icon",
            html: buildWidgetSecurityZoneLabel(employee, photos, checkInPhoto, checkpointPhotos, color),
            iconSize: [150, 100],
            iconAnchor: [75, 50],
        });

        const zoneMarker = L.marker(center, {
            icon: zoneIcon,
            zIndexOffset: 2000,
            keyboard: false,
        });

        bindWidgetSecurityZoneEvents(zoneMarker, polygon, employee, photos);

        widgetAreaLayer.addLayer(polygon);
        widgetAreaLayer.addLayer(zoneMarker);
    });
}

function renderWidgetMonitoringMap(employees, checkins, shouldFitMap) {
    if (!widgetMonitoringMap || !widgetMarkerLayer) {
        return;
    }

    widgetMarkerLayer.clearLayers();
    widgetAreaLayer.clearLayers();

    const employeeById = {};
    employees.forEach(function (employee) {
        employeeById[employee.id] = employee;
    });

    const bounds = [];

    (checkins || []).forEach(function (checkin) {
        const employee = employeeById[checkin.employee_id];
        const lat = Number(checkin.lat);
        const lng = Number(checkin.lng);

        if (!employee || !Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
        }

        const markerColor = getDepartmentColor(employee);
        const marker = L.marker([lat, lng], {
            icon: createStickmanIcon(markerColor, checkin.type, checkin.source_type, checkin.is_live),
        });

        const labelMarker = L.marker([lat, lng], {
            icon: createPointLabelIcon(employee, checkin),
            zIndexOffset: 1500,
            keyboard: false,
        });

        labelMarker.on("click", function () {
            openWidgetPointModal(employee, checkin);
        });

        widgetMarkerLayer.addLayer(marker);
        widgetMarkerLayer.addLayer(labelMarker);
        bounds.push([lat, lng]);
    });

    renderWidgetSecurityZone(checkins || [], employeeById);

    if (shouldFitMap && bounds.length) {
        widgetMonitoringMap.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: 14,
        });
    } else if (shouldFitMap && widgetUserLocation) {
        widgetMonitoringMap.setView(widgetUserLocation, 13);
    } else if (shouldFitMap) {
        widgetMonitoringMap.setView(widgetDefaultCenter, 5);
    }

    setTimeout(function () {
        widgetMonitoringMap.invalidateSize();
    }, 200);
}

function loadDashboardMonitoringWidget(shouldFitMap = false) {
    if (widgetMonitoringRequestInFlight) {
        return;
    }

    const departmentFilter = $("#widgetDepartmentFilter");
    const departmentId = departmentFilter.length
        ? departmentFilter.val() || "all"
        : "all";
    const divisionId = $("#widgetDivisionFilter").val() || "all";
    const employeeId = $("#widgetEmployeeFilter").val() || "all";
    const $jobFilter = $("#widgetJobFilter");
    const jobId = $jobFilter.length ? ($jobFilter.val() || "all") : "all";

    widgetMonitoringRequestInFlight = true;

    $.ajax({
        url: appUrl + "/dashboard/monitoring-widget",
        type: "GET",
        cache: false,
        data: {
            department_id: departmentId,
            division_id: divisionId,
            employee_id: employeeId,
            job_id: jobId,
            _ts: Date.now(),
        },
        success: function (response) {
            const employees = (response.data && response.data.employees) || [];
            const checkins = (response.data && (response.data.points || response.data.checkins)) || [];
            buildDepartmentColorMap(employees);
            renderWidgetMonitoringMap(employees, checkins, shouldFitMap);
            renderMonitoringLegend(employees);
            widgetMonitoringRequestInFlight = false;
        },
        error: function () {
            widgetMonitoringRequestInFlight = false;
            return;
        },
    });
}

function startWidgetMonitoringPolling() {
    if (widgetMonitoringPollingTimer) {
        clearInterval(widgetMonitoringPollingTimer);
    }

    widgetMonitoringPollingTimer = setInterval(function () {
        loadDashboardMonitoringWidget(false);
    }, 10000);
}

$(document).on("change", "#widgetDepartmentFilter", function () {
    const departmentId = $(this).val();
    const $divisionFilter = $("#widgetDivisionFilter");
    const $employeeFilter = $("#widgetEmployeeFilter");

    // Filter division options based on department
    $divisionFilter.find("option").each(function () {
        if ($(this).val() === "all") {
            $(this).show();
            return;
        }
        const optionDepartmentId = $(this).data("department-id");
        const visible = departmentId === "all" || String(optionDepartmentId) === String(departmentId);
        $(this).toggle(visible);
    });

    // Reset and disable division/employee if no department selected
    if (departmentId === "all") {
        $divisionFilter.val("all").prop("disabled", true);
        $employeeFilter.val("all").prop("disabled", true);
        $employeeFilter.find('option:not([value="all"])').remove();
    } else {
        $divisionFilter.val("all").prop("disabled", false);
        $employeeFilter.val("all").prop("disabled", true);
        $employeeFilter.find('option:not([value="all"])').remove();
    }

    loadDashboardMonitoringWidget(true);
});

$(document).on("change", "#widgetDivisionFilter", function () {
    const $employeeFilter = $("#widgetEmployeeFilter");
    const divisionId = $(this).val();
    const departmentId = $("#widgetDepartmentFilter").val();

    // Clear employee options
    $employeeFilter.find('option:not([value="all"])').remove();

    if (divisionId === "all") {
        $employeeFilter.val("all").prop("disabled", true);
        loadDashboardMonitoringWidget(true);
        return;
    }

    // Fetch employees for this department+division
    $.ajax({
        url: appUrl + "/get-employees-by-division",
        type: "GET",
        data: {
            department_id: departmentId,
            division_id: divisionId,
        },
        success: function (response) {
            if (response.data && response.data.length) {
                response.data.forEach(function (emp) {
                    $employeeFilter.append(
                        '<option value="' + emp.id + '">' + escapeHtml(emp.name) + '</option>'
                    );
                });
                $employeeFilter.prop("disabled", false).val("all");
            } else {
                $employeeFilter.val("all").prop("disabled", true);
            }
        },
        error: function () {
            $employeeFilter.val("all").prop("disabled", true);
        },
    });

    loadDashboardMonitoringWidget(true);
});

$(document).on("change", "#widgetEmployeeFilter", function () {
    loadDashboardMonitoringWidget(true);
});

function applyAdminFilterScope() {
    if (currentUserType !== "ADMINISTRATOR") {
        return;
    }

    const departmentFilter = $("#widgetDepartmentFilter");
    if (!departmentFilter.length) {
        return;
    }

    const ownDepartmentOption = departmentFilter
        .find('option:not([value="all"])')
        .first();

    if (ownDepartmentOption.length) {
        departmentFilter.val(ownDepartmentOption.val());
    }

    const wrapper = departmentFilter.closest(
        ".widget-filter-item, .col, .form-group",
    );
    if (wrapper.length) {
        wrapper.hide();
    } else {
        departmentFilter.hide();
    }

    departmentFilter.trigger("change");
}

let widgetDocumentRequestToken = 0;
let widgetDocumentPage = 1;
let widgetDocumentPerPage = 12;
let widgetDocumentPagination = null;

function renderWidgetDocumentGrid(folders, files) {
    const container = $("#widgetDocumentGrid");

    const items = folders
        .map((folder) => Object.assign({}, folder, { __type: "folder" }))
        .concat(
            files.map((file) => Object.assign({}, file, { __type: "file" })),
        );

    if (!items.length) {
        container.html(
            '<div class="widget-empty-state text-body text-opacity-50 fs-12 text-center py-4">No documents found</div>',
        );
        return;
    }

    let html = "";

    items.forEach(function (item) {
        if (item.__type === "folder") {
            html += `
                <div class="widget-folder-card" data-id="${item.id}" title="${escapeHtml(item.folder_name)}">
                    <div class="widget-folder-shadow-tab"></div>
                    <div class="widget-folder-shadow"></div>
                    <div class="widget-folder-tab"></div>
                    <div class="widget-folder-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p class="widget-folder-name fs-8 mb-1">${escapeHtml(item.folder_name)}</p>
                                <p class="widget-folder-role fs-8 mb-0">${item.creator?.name || "Unknown"}</p>
                            </div>
                        </div>
                        <hr class="widget-folder-divider">
                    </div>
                </div>
            `;
            return;
        }

        const href = (item.file_path || "").startsWith("/")
            ? item.file_path
            : "/" + item.file_path;
        const fileExt = (item.file_name || item.file_type || "").toLowerCase();
        const isImage =
            fileExt.match(/\.(png|jpe?g|gif|webp)$/) ||
            (item.file_type || "").startsWith("image/");
        const preview = isImage
            ? `<img src="${href}" alt="${escapeHtml(item.file_name)}">`
            : `<span class="material-symbols-outlined">insert_drive_file</span>`;

        html += `
            <a href="${href}" target="_blank" class="widget-file-card" title="${escapeHtml(item.file_name)}">
                <div class="widget-file-preview">${preview}</div>
                <div class="widget-file-title">${escapeHtml(item.file_name)}</div>
            </a>
        `;
    });

    container.html(html);
}

function renderWidgetDocumentPagination() {
    const container = $("#widgetDocumentPagination");

    if (!container.length) {
        return;
    }

    if (
        !widgetDocumentPagination ||
        (widgetDocumentPagination.last_page || 1) <= 1
    ) {
        container.html("");
        return;
    }

    const currentPage = Number(
        widgetDocumentPagination.current_page || 1
    );

    const lastPage = Number(
        widgetDocumentPagination.last_page || 1
    );

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(lastPage, startPage + 2);

    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }

    let html = '<div class="widget-doc-pagination-inner">';

    html +=
        '<button type="button" class="widget-doc-page-btn" data-page="' +
        Math.max(1, currentPage - 1) +
        '" ' +
        (currentPage <= 1 ? 'disabled' : '') +
        '>Prev</button>';

    for (let page = startPage; page <= endPage; page++) {
        const activeClass = page === currentPage ? 'is-active' : '';

        html +=
            '<button type="button" class="widget-doc-page-btn ' +
            activeClass +
            '" data-page="' +
            page +
            '">' +
            page +
            '</button>';
    }

    html +=
        '<button type="button" class="widget-doc-page-btn" data-page="' +
        Math.min(lastPage, currentPage + 1) +
        '" ' +
        (currentPage >= lastPage ? 'disabled' : '') +
        '>Next</button>';

    html += '</div>';

    html +=
        '<div class="widget-doc-page-summary">' +
        'Showing ' +
        (widgetDocumentPagination.from || 0) +
        ' - ' +
        (widgetDocumentPagination.to || 0) +
        ' of ' +
        (widgetDocumentPagination.total || 0) +
        '</div>';

    container.html(html);
}

function updateWidgetDocumentBackButton() {
    const backButton = $("#widgetDocumentBack");
    if (!backButton.length) {
        return;
    }
    const shouldShow = currentDocumentFolderId !== null && currentDocumentFolderId !== undefined;
    backButton.toggleClass("d-none", !shouldShow);
}

function loadDashboardDocumentWidget(search, folderId) {
    const resolvedFolderId =
        folderId === undefined || folderId === "" ? null : folderId;

    currentDocumentSearch = search || "";
    currentDocumentFolderId = resolvedFolderId;

    updateWidgetDocumentBackButton();

    const requestToken = ++widgetDocumentRequestToken;

    const url = new URL(appUrl + "/document/get-all-folder");
    url.searchParams.set("sort_by", "updated_at");
    url.searchParams.set("sort_direction", "desc");

    if (resolvedFolderId !== null) {
        url.searchParams.set("parent_id", resolvedFolderId);
    }

    url.searchParams.set("page", widgetDocumentPage);
    url.searchParams.set("per_page", widgetDocumentPerPage);

    if (currentDocumentSearch) {
        url.searchParams.set("search", currentDocumentSearch);
    }

    fetch(url.toString(), {
        method: "GET",
        credentials: "same-origin",
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (res) {
            if (requestToken !== widgetDocumentRequestToken) {
                return;
            }

            currentDocumentParentId =
                res.current_folder && res.current_folder.parent_folder_id
                    ? res.current_folder.parent_folder_id
                    : null;

            widgetDocumentPagination = res.pagination || null;

            renderWidgetDocumentGrid(res.folders || [], res.files || []);
            renderWidgetDocumentPagination();
            updateWidgetDocumentBackButton();
        })
        .catch(function () {
            if (requestToken !== widgetDocumentRequestToken) {
                return;
            }
            $("#widgetDocumentGrid").html(
                '<div class="widget-error-state text-danger fs-12 text-center py-4">Failed to load documents</div>',
            );
            $("#widgetDocumentPagination").html("");
        });
}

$(document).on("click", "#widgetDocumentGrid .widget-folder-card", function () {
    const folderId = $(this).data("id");

    if (folderId === undefined || folderId === null || folderId === "") {
        return;
    }

    widgetDocumentPage = 1;
    loadDashboardDocumentWidget(currentDocumentSearch, folderId);
});

$(document).on("click", "#widgetDocumentBack", function () {
    widgetDocumentPage = 1;
    loadDashboardDocumentWidget(currentDocumentSearch, currentDocumentParentId);
});

$(document).on("keyup", "#widgetDocumentSearch", function () {
    const value = $(this).val();

    clearTimeout(widgetDocumentSearchTimeout);
    widgetDocumentSearchTimeout = setTimeout(function () {
        widgetDocumentPage = 1;
        loadDashboardDocumentWidget(value, currentDocumentFolderId);
    }, 350);
});

$(document).on("click", "#widgetDocumentPagination .widget-doc-page-btn", function () {
    const page = Number($(this).data("page") || 1);
    if (!page || page < 1) {
        return;
    }
    if (widgetDocumentPagination && page === Number(widgetDocumentPagination.current_page || 1)) {
        return;
    }

    widgetDocumentPage = page;
    loadDashboardDocumentWidget(currentDocumentSearch, currentDocumentFolderId);
});

initWidgetMonitoringMap();
applyAdminFilterScope();
loadDashboardMonitoringWidget(true);

if ($("#widgetDocumentGrid").length) {
    loadDashboardDocumentWidget("", null);
}

let widgetDocumentSearchTimeout = null;

startWidgetMonitoringPolling();
