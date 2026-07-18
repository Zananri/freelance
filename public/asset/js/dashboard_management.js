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

let widgetMonitoringMap = null;
let widgetMarkerLayer = null;
let widgetUserLocationMarker = null;
let widgetDefaultCenter = [-6.2, 106.816666];
let widgetUserLocation = null;

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

function createPinIcon(color) {
    return L.divIcon({
        className: "custom-pin-marker",
        html: `
            <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24s14-13.5 14-24c0-7.7-6.3-14-14-14z"
                      fill="${color}" stroke="#fff" stroke-width="1.5"/>
                <circle cx="14" cy="14" r="5.5" fill="#fff"/>
            </svg>
        `,
        iconSize: [28, 38],
        iconAnchor: [14, 38],
        popupAnchor: [0, -34],
    });
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
                icon: createPinIcon("#28a745"),
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

// function renderWidgetEmployeeList(employees) {
//     const container = $("#widgetEmployeeList");

//     if (!container.length) {
//         return;
//     }

//     if (!employees.length) {
//         container.html(
//             '<div class="text-body text-opacity-50 fs-12 text-center py-4">No employee found</div>',
//         );
//         return;
//     }

//     let html = "";

//     employees.forEach(function (employee) {
//         const statusClass = employee.checked_in ? "is-online" : "";
//         const statusText = (() => {
//             if (employee.checked_in) {
//                 return "Checked in " + (employee.checkin_time || "");
//             }

//             if (employee.checkout_time) {
//                 return "Checked out " + (employee.checkout_time || "");
//             }

//             return "No attendance";
//         })();
//         const deptColor = getDepartmentColor(employee);

//         html += `
//             <div class="widget-employee-item">
//                 <div class="widget-employee-avatar" style="border-color:${deptColor}"></div>
//                 <div class="widget-employee-info">
//                     <div class="widget-employee-name">${escapeHtml(employee.name)}</div>
//                     <div class="widget-employee-meta">
//                         <span class="legend-dot legend-dot-sm" style="background-color:${deptColor}"></span>
//                         ${escapeHtml(employee.division_name || "-")} • ${escapeHtml(employee.department_name || "-")}
//                     </div>
//                 </div>
//                 <div class="widget-employee-status ${statusClass}">
//                     <span class="status-dot"></span>
//                     <span class="status-text">${escapeHtml(statusText)}</span>
//                 </div>
//             </div>
//         `;
//     });

//     container.html(html);
// }

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

function renderWidgetMonitoringMap(employees, checkins) {
    if (!widgetMonitoringMap || !widgetMarkerLayer) {
        return;
    }

    widgetMarkerLayer.clearLayers();

    const employeeById = {};
    employees.forEach(function (employee) {
        employeeById[employee.id] = employee;
    });

    const bounds = [];

    (checkins || []).forEach(function (checkin) {
        const employee = employeeById[checkin.employee_id];

        if (
            !employee ||
            typeof checkin.lat !== "number" ||
            typeof checkin.lng !== "number"
        ) {
            return;
        }

        const markerColor =
            checkin.type === "check_out"
                ? "#dc3545" 
                : "#0d6efd"; 

        const marker = L.marker([checkin.lat, checkin.lng], {
            icon: createPinIcon(markerColor),
        });

        marker.bindPopup(
            "<strong>" +
                escapeHtml(employee.name) +
                "</strong><br/>" +
                escapeHtml(employee.department_name || "-") +
                "<br/>" +
                escapeHtml(employee.job_name || "-") +
                "<br/>" +

                (checkin.type === "check_out"
                    ? '<span class="badge bg-danger me-1">Checked-out</span>'
                    : '<span class="badge bg-primary me-1">Checked-in</span>'
            ) + escapeHtml(checkin.time || "-")
        );

        widgetMarkerLayer.addLayer(marker);
        bounds.push([checkin.lat, checkin.lng]);
    });

    if (bounds.length) {
        widgetMonitoringMap.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: 14,
        });
    } else if (widgetUserLocation) {
        widgetMonitoringMap.setView(widgetUserLocation, 13);
    } else {
        widgetMonitoringMap.setView(widgetDefaultCenter, 5);
    }

    setTimeout(function () {
        widgetMonitoringMap.invalidateSize();
    }, 200);
}

function loadDashboardMonitoringWidget() {
    const departmentFilter = $("#widgetDepartmentFilter");
    const departmentId = departmentFilter.length
        ? departmentFilter.val() || "all"
        : "all";
    const divisionId = $("#widgetDivisionFilter").val() || "all";
    const jobId = $("#widgetJobFilter").val() || "all";

    $.ajax({
        url: appUrl + "/dashboard/monitoring-widget",
        type: "GET",
        data: {
            department_id: departmentId,
            division_id: divisionId,
            job_id: jobId,
        },
        success: function (response) {
            const employees = (response.data && response.data.employees) || [];
            const checkins = (response.data && response.data.checkins) || [];

            buildDepartmentColorMap(employees);
            // renderWidgetEmployeeList(employees);
            renderWidgetMonitoringMap(employees, checkins);
            renderMonitoringLegend(employees);
        },
        error: function () {
            $("#widgetEmployeeList").html(
                '<div class="text-danger fs-12 text-center py-4">Failed to load data</div>',
            );
        },
    });
}

$(document).on("change", "#widgetDepartmentFilter", function () {
    const departmentId = $(this).val();

    $("#widgetDivisionFilter option, #widgetJobFilter option").each(
        function () {
            if ($(this).val() === "all") {
                $(this).show();
                return;
            }

            const optionDepartmentId = $(this).data("department-id");
            const visible =
                departmentId === "all" ||
                String(optionDepartmentId) === String(departmentId);
            $(this).toggle(visible);
        },
    );

    $("#widgetDivisionFilter").val("all");
    $("#widgetJobFilter").val("all");
    loadDashboardMonitoringWidget();
});

$(document).on("change", "#widgetDivisionFilter", function () {
    loadDashboardMonitoringWidget();
});

$(document).on("change", "#widgetJobFilter", function () {
    loadDashboardMonitoringWidget();
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

function renderWidgetDocumentGrid(folders, files) {
    const container = $("#widgetDocumentGrid");

    const items = folders
        .map((folder) => Object.assign({}, folder, { __type: "folder" }))
        .concat(
            files.map((file) => Object.assign({}, file, { __type: "file" })),
        )
        .slice(0, 9);

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

            renderWidgetDocumentGrid(res.folders || [], res.files || []);
            updateWidgetDocumentBackButton();
        })
        .catch(function () {
            if (requestToken !== widgetDocumentRequestToken) {
                return;
            }
            $("#widgetDocumentGrid").html(
                '<div class="widget-error-state text-danger fs-12 text-center py-4">Failed to load documents</div>',
            );
        });
}

$(document).on("click", "#widgetDocumentGrid .widget-folder-card", function () {
    const folderId = $(this).data("id");

    if (folderId === undefined || folderId === null || folderId === "") {
        return;
    }

    loadDashboardDocumentWidget(currentDocumentSearch, folderId);
});

$(document).on("click", "#widgetDocumentBack", function () {
    loadDashboardDocumentWidget(currentDocumentSearch, currentDocumentParentId);
});

$(document).on("keyup", "#widgetDocumentSearch", function () {
    const value = $(this).val();

    clearTimeout(widgetDocumentSearchTimeout);
    widgetDocumentSearchTimeout = setTimeout(function () {
        loadDashboardDocumentWidget(value, currentDocumentFolderId);
    }, 350);
});

initWidgetMonitoringMap();
applyAdminFilterScope();

if ($("#widgetDocumentGrid").length) {
    loadDashboardDocumentWidget("", null);
}

let widgetDocumentSearchTimeout = null;

$(document).on("keyup", "#widgetDocumentSearch", function () {
    const value = $(this).val();

    clearTimeout(widgetDocumentSearchTimeout);
    widgetDocumentSearchTimeout = setTimeout(function () {
        loadDashboardDocumentWidget(value);
    }, 350);
});

initWidgetMonitoringMap();
applyAdminFilterScope();

if ($("#widgetDocumentGrid").length) {
    loadDashboardDocumentWidget("");
}