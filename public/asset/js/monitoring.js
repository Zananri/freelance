$(function () {
    var $wrapper = $(".monitoring-wrapper");
    var $mapElement = $("#monitoringMap");

    if (!$wrapper.length || !$mapElement.length) {
        return;
    }

    var monitoringDataUrl = $wrapper.data("monitoring-url") || "";
    var pollingTimer = null;
    var isFetching = false;

    var userType = "";
    var departments = [];
    var partners = [];
    var divisions = [];
    var employees = [];
    var points = [];

    var selectedDepartmentId = "all";
    var selectedPartnerId = "all";
    var selectedDivisionId = "all";

    var departmentColorPalette = [
        "#0d6efd",
        "#e74c3c",
        "#2ecc71",
        "#f39c12",
        "#16a085",
        "#e67e22",
        "#34495e",
        "#20c997",
        "#d63384",
        "#6610f2",
    ];

    var departmentColorMap = {};

    var monitoringMap = L.map("monitoringMap", {
        scrollWheelZoom: false,
        doubleClickZoom: false,
        zoomControl: true,
    }).setView([-6.2, 106.816666], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
    }).addTo(monitoringMap);

    var markerLayer = L.layerGroup().addTo(monitoringMap);
    var areaLayer = L.layerGroup().addTo(monitoringMap);

    var $sidebarCards = $(".monitoring-sidebar .monitoring-card");
    var $topCard = $sidebarCards.eq(0);
    var $bottomCard = $sidebarCards.eq(1);
    var $topTitle = $topCard.find("h6").first();
    var $bottomTitle = $bottomCard.find("h6").first();
    var $topSearch = $topCard.find("input.custom-form-filter").first();
    var $bottomSearch = $bottomCard.find("input.custom-form-filter").first();
    var $topList = $("#divisionList");
    var $bottomList = $("#employeeList");
    var monitoringPointModal = null;

    function escapeHtml(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) {
            return "-";
        }

        var date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function normalizeUserType(rawType) {
        return String(rawType || "").toUpperCase();
    }

    function departmentColorKey(employee) {
        if (!employee) {
            return "unknown";
        }

        if (employee.department_id != null && employee.department_id !== "") {
            return String(employee.department_id);
        }

        return employee.department_name || "unknown";
    }

    function buildDepartmentColorMap(list) {
        departmentColorMap = {};

        var seen = {};
        var uniqueDepartments = [];

        $.each(list, function (_, employee) {
            var key = departmentColorKey(employee);
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

        $.each(uniqueDepartments, function (index, dept) {
            departmentColorMap[dept.key] = departmentColorPalette[index % departmentColorPalette.length];
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

    function createStickmanIcon(departmentColor, pointType, sourceType, isLive) {
        var badgeColor = pointBadgeColor(pointType, sourceType, isLive);

        return L.divIcon({
            className: "",
            html: '<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="17" cy="7" r="4" fill="' + departmentColor + '" />' +
                '<line x1="17" y1="11" x2="17" y2="21" stroke="' + departmentColor + '" stroke-width="3" stroke-linecap="round" />' +
                '<line x1="10" y1="15" x2="24" y2="15" stroke="' + departmentColor + '" stroke-width="3" stroke-linecap="round" />' +
                '<line x1="17" y1="21" x2="11" y2="30" stroke="' + departmentColor + '" stroke-width="3" stroke-linecap="round" />' +
                '<line x1="17" y1="21" x2="23" y2="30" stroke="' + departmentColor + '" stroke-width="3" stroke-linecap="round" />' +
                '<circle cx="28" cy="8" r="5" fill="' + badgeColor + '" stroke="#ffffff" stroke-width="1.5" />' +
            "</svg>",
            iconSize: [34, 34],
            iconAnchor: [17, 28],
            popupAnchor: [0, -24],
        });
    }

    function getEmployeeMap() {
        var map = {};
        $.each(employees, function (_, employee) {
            map[String(employee.id)] = employee;
        });
        return map;
    }

    function getAdminDepartmentId() {
        if (!employees.length) {
            return "all";
        }

        var firstEmployee = employees[0];
        return firstEmployee && firstEmployee.department_id != null
            ? String(firstEmployee.department_id)
            : "all";
    }

    function filteredTopItems() {
        var keyword = String($topSearch.val() || "").trim().toLowerCase();

        if (userType === "SUPERADMIN") {
            return $.grep(departments, function (department) {
                return String(department.name || "").toLowerCase().indexOf(keyword) !== -1;
            });
        }

        var adminDepartmentId = getAdminDepartmentId();
        var scopedPartners = $.grep(partners, function (partner) {
            if (adminDepartmentId === "all") {
                return true;
            }
            return String(partner.department_id || "") === adminDepartmentId;
        });

        return $.grep(scopedPartners, function (partner) {
            return String(partner.name || "").toLowerCase().indexOf(keyword) !== -1;
        });
    }

    function filteredBottomItems() {
        var keyword = String($bottomSearch.val() || "").trim().toLowerCase();

        if (userType === "SUPERADMIN") {
            var partnerFiltered = $.grep(partners, function (partner) {
                var matchedDepartment =
                    selectedDepartmentId === "all" ||
                    String(partner.department_id || "") === String(selectedDepartmentId);

                if (!matchedDepartment) {
                    return false;
                }

                return String(partner.name || "").toLowerCase().indexOf(keyword) !== -1;
            });
            return partnerFiltered;
        }

        var adminDepartmentId = getAdminDepartmentId();
        var divisionFiltered = $.grep(divisions, function (division) {
            var matchedDepartment =
                adminDepartmentId === "all" ||
                String(division.department_id || "") === String(adminDepartmentId);

            var matchedPartner =
                selectedPartnerId === "all" ||
                String(division.partner_id || "") === String(selectedPartnerId);

            if (!matchedDepartment || !matchedPartner) {
                return false;
            }

            return String(division.name || "").toLowerCase().indexOf(keyword) !== -1;
        });

        return divisionFiltered;
    }

    function renderList($container, items, selectedId, itemType) {
        if (!items.length) {
            $container.html('<div class="text-muted small p-2">No data found</div>');
            return;
        }

        var html = "";

        $.each(items, function (_, item) {
            var isActive = String(selectedId) === String(item.id);
            var activeClass = isActive ? "is-selected" : "";
            var subtitle = "";

            if (itemType === "department") {
                subtitle = "Department";
            } else if (itemType === "partner") {
                subtitle = "Partner";
            } else {
                subtitle = "Site";
            }

            html += '<div class="monitoring-filter-item p-2 mb-2 ' + activeClass + '" data-item-id="' + item.id + '" data-item-type="' + itemType + '">' +
                '<div class="d-flex justify-content-between align-items-center">' +
                    '<div>' +
                        '<div class="fw-semibold">' + escapeHtml(item.name || "-") + '</div>' +
                        '<div class="text-muted small">' + subtitle + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });

        $container.html(html);
    }

    function ensureActiveFiltersValid() {
        if (userType === "SUPERADMIN") {
            var departmentExists = $.grep(departments, function (department) {
                return String(department.id) === String(selectedDepartmentId);
            }).length > 0;

            if (selectedDepartmentId !== "all" && !departmentExists) {
                selectedDepartmentId = "all";
            }

            var partnerExists = $.grep(partners, function (partner) {
                return String(partner.id) === String(selectedPartnerId);
            }).length > 0;

            if (selectedPartnerId !== "all" && !partnerExists) {
                selectedPartnerId = "all";
            }

            selectedDivisionId = "all";
            return;
        }

        var adminDepartmentId = getAdminDepartmentId();

        if (adminDepartmentId !== "all") {
            selectedDepartmentId = adminDepartmentId;
        }

        var scopedPartners = $.grep(partners, function (partner) {
            if (adminDepartmentId === "all") {
                return true;
            }
            return String(partner.department_id || "") === adminDepartmentId;
        });

        var partnerExistsForAdmin = $.grep(scopedPartners, function (partner) {
            return String(partner.id) === String(selectedPartnerId);
        }).length > 0;

        if (selectedPartnerId !== "all" && !partnerExistsForAdmin) {
            selectedPartnerId = "all";
        }

        var scopedDivisions = $.grep(divisions, function (division) {
            var matchedDepartment =
                adminDepartmentId === "all" ||
                String(division.department_id || "") === String(adminDepartmentId);

            var matchedPartner =
                selectedPartnerId === "all" ||
                String(division.partner_id || "") === String(selectedPartnerId);

            return matchedDepartment && matchedPartner;
        });

        var divisionExists = $.grep(scopedDivisions, function (division) {
            return String(division.id) === String(selectedDivisionId);
        }).length > 0;

        if (selectedDivisionId !== "all" && !divisionExists) {
            selectedDivisionId = "all";
        }
    }

    function renderSidebar() {
        ensureActiveFiltersValid();

        if (userType === "SUPERADMIN") {
            $topTitle.text("Department List");
            $bottomTitle.text("Partner List");
            renderList($topList, filteredTopItems(), selectedDepartmentId, "department");
            renderList($bottomList, filteredBottomItems(), selectedPartnerId, "partner");
            return;
        }

        $topTitle.text("Partner List");
        $bottomTitle.text("Site List");
        renderList($topList, filteredTopItems(), selectedPartnerId, "partner");
        renderList($bottomList, filteredBottomItems(), selectedDivisionId, "division");
    }

    function pointTypeLabel(point) {
        if (point.type === "check_out") {
            return "Check Out";
        }
        if (point.type === "check_in") {
            return "Check In";
        }
        if (point.is_live || point.source_type === "live") {
            return "Checkpoint Live";
        }
        return "Checkpoint";
    }

    function ensurePointModal() {
        if (monitoringPointModal) {
            return monitoringPointModal;
        }

        var modalId = "monitoringPointModal";
        var html = '' +
            '<div class="modal fade" id="' + modalId + '" tabindex="-1" aria-hidden="true">' +
            '  <div class="modal-dialog modal-dialog-centered">' +
            '    <div class="modal-content border-0 rounded-4">' +
            '      <div class="modal-header border-0 pb-0">' +
            '        <h5 class="modal-title fw-semibold">Employee Point Detail</h5>' +
            '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '      </div>' +
            '      <div class="modal-body pt-2" id="monitoringPointModalBody"></div>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        $("body").append(html);
        monitoringPointModal = new bootstrap.Modal(document.getElementById(modalId));
        return monitoringPointModal;
    }

    function buildPointTooltipHtml(employee, point) {
        var statusColor = point.type === "check_out" ? "#dc3545" : point.type === "check_in" ? "#28a745" : "#f39c12";
        var statusText = pointTypeLabel(point);

        if (point.image_url) {
            return '<div style="display:flex;align-items:center;gap:8px;min-width:190px;padding:7px 9px;border-radius:10px;background:#ffffff;box-shadow:0 8px 18px rgba(0,0,0,.2);">' +
                '<img src="' + escapeHtml(point.image_url) + '" alt="" style="width:60px;height:60px;aspect-ratio:1/1;object-fit:cover;border-radius:8px;display:block;">' +
                '<div style="min-width:0;">' +
                    '<div style="font-size:12px;font-weight:700;color:#213047;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(employee.name || "-") + '</div>' +
                    '<div style="font-size:11px;color:#5d6981;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(employee.partner_name || "-") + '</div>' +
                    '<div style="margin-top:4px;"><span style="display:inline-block;padding:2px 8px;border-radius:999px;background:' + statusColor + ';color:#fff;font-size:10px;font-weight:700;">' + escapeHtml(statusText) + '</span></div>' +
                '</div>' +
            '</div>';
        }

        return '<div style="display:flex;align-items:center;gap:8px;min-width:170px;padding:7px 9px;border-radius:10px;background:#ffffff;box-shadow:0 8px 18px rgba(0,0,0,.2);">' +
            '<div style="width:60px;height:60px;aspect-ratio:1/1;border-radius:8px;background:#edf1ff;display:flex;align-items:center;justify-content:center;color:#4e5a75;font-size:10px;font-weight:700;">No Photo</div>' +
            '<div style="min-width:0;">' +
                '<div style="font-size:12px;font-weight:700;color:#213047;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(employee.name || "-") + '</div>' +
                '<div style="font-size:11px;color:#5d6981;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(employee.partner_name || "-") + '</div>' +
                '<div style="margin-top:4px;"><span style="display:inline-block;padding:2px 8px;border-radius:999px;background:' + statusColor + ';color:#fff;font-size:10px;font-weight:700;">' + escapeHtml(statusText) + '</span></div>' +
            '</div>' +
        '</div>';
    }

    function createPointLabelIcon(employee, point) {
        return L.divIcon({
            className: "monitoring-marker-label-wrap",
            html: buildPointTooltipHtml(employee, point),
            iconSize: [190, 74],
            iconAnchor: [95, 76],
        });
    }

    function openPointModal(employee, point) {
        var modal = ensurePointModal();
        var bodyHtml = '<div class="mb-2">' +
            '<div class="fw-semibold">' + escapeHtml(employee.name || "-") + '</div>' +
            '<div class="small text-secondary">' + escapeHtml(employee.partner_name || "-") + ' • ' + escapeHtml(employee.division_name || "-") + '</div>' +
            '</div>' +
            '<div class="mb-2"><span class="badge ' +
                (point.type === "check_out" ? "bg-danger" : point.type === "check_in" ? "bg-success" : "bg-warning") +
                '">' + escapeHtml(pointTypeLabel(point)) + '</span></div>' +
            '<div class="small text-secondary mb-2">' + escapeHtml(formatDateTime(point.date_time)) + '</div>';

        if (point.image_url) {
            bodyHtml += '<img src="' + escapeHtml(point.image_url) + '" alt="" style="width:92px;height:92px;aspect-ratio:1/1;border-radius:10px;object-fit:cover;display:block;">';
        }

        $("#monitoringPointModalBody").html(bodyHtml);
        modal.show();
    }

    function employeeIdsByFilter() {
        var adminDepartmentId = getAdminDepartmentId();

        var filtered = $.grep(employees, function (employee) {
            if (userType !== "SUPERADMIN") {
                if (adminDepartmentId !== "all" && String(employee.department_id || "") !== adminDepartmentId) {
                    return false;
                }
            }

            if (selectedDepartmentId !== "all" && String(employee.department_id || "") !== String(selectedDepartmentId)) {
                return false;
            }

            if (selectedPartnerId !== "all" && String(employee.partner_id || "") !== String(selectedPartnerId)) {
                return false;
            }

            if (selectedDivisionId !== "all" && String(employee.division_id || "") !== String(selectedDivisionId)) {
                return false;
            }

            return true;
        });

        var map = {};
        $.each(filtered, function (_, employee) {
            map[String(employee.id)] = true;
        });

        return map;
    }

    function isSecurityEmployee(employee) {
        return String(employee && employee.job_name ? employee.job_name : "").toUpperCase() === "TENAGA KEAMANAN";
    }

    function renderSecurityZone(filteredPoints, employeeMap) {
        var grouped = {};

        $.each(filteredPoints, function (_, point) {
            var employee = employeeMap[String(point.employee_id)];
            if (!employee || !isSecurityEmployee(employee)) {
                return;
            }

            if (!grouped[String(point.employee_id)]) {
                grouped[String(point.employee_id)] = [];
            }

            grouped[String(point.employee_id)].push(point);
        });

        $.each(grouped, function (employeeId, employeePoints) {
            var checkOutExists = $.grep(employeePoints, function (point) {
                return point.type === "check_out";
            }).length > 0;

            if (!checkOutExists) {
                return;
            }

            var zonePoints = $.grep(employeePoints, function (point) {
                return point.type === "check_in" || point.type === "checkpoint";
            });

            if (zonePoints.length < 2) {
                return;
            }

            var photoPoints = $.grep(zonePoints, function (point) {
                return !!point.image_url;
            });

            if (!photoPoints.length) {
                return;
            }

            var sumLat = 0;
            var sumLng = 0;

            $.each(zonePoints, function (_, point) {
                sumLat += Number(point.lat) || 0;
                sumLng += Number(point.lng) || 0;
            });

            var centerLat = sumLat / zonePoints.length;
            var centerLng = sumLng / zonePoints.length;
            var centerLatLng = L.latLng(centerLat, centerLng);

            var maxDistance = 0;
            $.each(zonePoints, function (_, point) {
                var pointLatLng = L.latLng(point.lat, point.lng);
                var distance = monitoringMap.distance(centerLatLng, pointLatLng);
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            });

            var radius = Math.max(40, Math.min(maxDistance + 35, 500));

            var circle = L.circle(centerLatLng, {
                radius: radius,
                color: "#0d6efd",
                fillColor: "#0d6efd",
                fillOpacity: 0.12,
                weight: 2,
            });

            areaLayer.addLayer(circle);

            var firstPhoto = photoPoints[0].image_url;
            var extraCount = Math.max(photoPoints.length - 1, 0);
            var badgeText = extraCount > 0 ? "+" + extraCount : "";

            var zoneIcon = L.divIcon({
                className: "",
                html: '<div style="display:flex;align-items:center;gap:4px;">' +
                    '<img src="' + escapeHtml(firstPhoto) + '" alt="" style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,.25);">' +
                    (extraCount > 0
                        ? '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:22px;padding:0 8px;border-radius:999px;background:#0d6efd;color:#fff;font-size:11px;font-weight:600;">' + badgeText + '</span>'
                        : "") +
                '</div>',
                iconSize: [78, 32],
                iconAnchor: [20, 16],
            });

            var zoneMarker = L.marker(centerLatLng, {
                icon: zoneIcon,
            });

            var galleryHtml = '<div style="min-width:220px;">';
            $.each(photoPoints, function (index, photoPoint) {
                if (!photoPoint.image_url) {
                    return;
                }

                galleryHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                    '<img src="' + escapeHtml(photoPoint.image_url) + '" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">' +
                    '<div>' +
                        '<div style="font-size:12px;font-weight:600;">' + escapeHtml(index === 0 ? "Check In" : "Checkpoint " + (index + 1)) + '</div>' +
                        '<div style="font-size:11px;color:#6c757d;">' + escapeHtml(formatDateTime(photoPoint.date_time)) + '</div>' +
                    '</div>' +
                '</div>';
            });
            galleryHtml += '</div>';

            zoneMarker.bindPopup(galleryHtml);
            areaLayer.addLayer(zoneMarker);
        });
    }

    function renderMarkers() {
        markerLayer.clearLayers();
        areaLayer.clearLayers();

        var employeeMap = getEmployeeMap();
        var allowedEmployeeIds = employeeIdsByFilter();
        var filteredPoints = $.grep(points, function (point) {
            return !!allowedEmployeeIds[String(point.employee_id)];
        });

        if (!filteredPoints.length) {
            return;
        }

        var bounds = [];

        $.each(filteredPoints, function (_, point) {
            var employee = employeeMap[String(point.employee_id)];
            var lat = Number(point.lat);
            var lng = Number(point.lng);
            if (!employee) {
                return;
            }

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return;
            }

            var departmentColor = getDepartmentColor(employee);
            var marker = L.marker([lat, lng], {
                icon: createStickmanIcon(departmentColor, point.type, point.source_type, point.is_live),
            });

            var popupHtml = '<div style="min-width:170px;">' +
                '<div style="font-weight:700;">' + escapeHtml(employee.name || "-") + '</div>' +
                '<div style="font-size:12px;color:#6c757d;">' + escapeHtml(employee.department_name || "-") + ' • ' + escapeHtml(employee.division_name || "-") + '</div>' +
                '<div style="margin-top:6px;font-size:12px;"><span class="badge ' +
                    (point.type === "check_out" ? "bg-danger" : point.type === "check_in" ? "bg-success" : "bg-warning") +
                '">' + escapeHtml(pointTypeLabel(point)) + '</span></div>' +
                '<div style="font-size:12px;color:#495057;margin-top:4px;">' + escapeHtml(formatDateTime(point.date_time)) + '</div>';

            if (point.image_url) {
                popupHtml += '<div style="margin-top:8px;"><img src="' + escapeHtml(point.image_url) + '" alt="" style="width:100%;max-width:200px;max-height:120px;object-fit:cover;border-radius:8px;"></div>';
            }

            popupHtml += '</div>';

            marker.bindPopup(popupHtml);

            var labelMarker = L.marker([lat, lng], {
                icon: createPointLabelIcon(employee, point),
                zIndexOffset: 1500,
                keyboard: false,
            });

            marker.on("click", function () {
                openPointModal(employee, point);
            });

            labelMarker.on("click", function () {
                openPointModal(employee, point);
            });

            markerLayer.addLayer(marker);
            markerLayer.addLayer(labelMarker);
            bounds.push([lat, lng]);
        });

        renderSecurityZone(filteredPoints, employeeMap);

        if (bounds.length) {
            monitoringMap.fitBounds(bounds, {
                padding: [35, 35],
                maxZoom: 16,
            });
        }
    }

    function handleTopCardSelect(itemId, itemType) {
        if (userType === "SUPERADMIN") {
            if (itemType === "department") {
                selectedDepartmentId = String(itemId);
                selectedPartnerId = "all";
                selectedDivisionId = "all";
            }
            return;
        }

        if (itemType === "partner") {
            selectedPartnerId = String(itemId);
            selectedDivisionId = "all";
        }
    }

    function handleBottomCardSelect(itemId, itemType) {
        if (userType === "SUPERADMIN") {
            if (itemType === "partner") {
                selectedPartnerId = String(itemId);
                selectedDivisionId = "all";
            }
            return;
        }

        if (itemType === "division") {
            selectedDivisionId = String(itemId);
        }
    }

    function fetchMonitoringData() {
        if (!monitoringDataUrl || isFetching) {
            return;
        }

        isFetching = true;

        $.ajax({
            url: monitoringDataUrl,
            type: "GET",
            dataType: "json",
            success: function (json) {
                isFetching = false;

                if (!json || json.code !== 200 || !json.data) {
                    return;
                }

                userType = normalizeUserType(json.data.user_type || "");
                departments = json.data.departments || [];
                partners = json.data.partners || [];
                divisions = json.data.divisions || [];
                employees = json.data.employees || [];
                points = json.data.points || json.data.checkins || [];

                buildDepartmentColorMap(employees);
                renderSidebar();
                renderMarkers();

                setTimeout(function () {
                    monitoringMap.invalidateSize();
                }, 150);
            },
            error: function () {
                isFetching = false;
            },
        });
    }

    function startLivePolling() {
        if (pollingTimer) {
            clearInterval(pollingTimer);
        }

        pollingTimer = setInterval(function () {
            fetchMonitoringData();
        }, 30000);
    }

    $topList.on("click", ".monitoring-filter-item", function () {
        var itemId = $(this).data("item-id");
        var itemType = $(this).data("item-type");

        handleTopCardSelect(itemId, itemType);
        renderSidebar();
        renderMarkers();
    });

    $bottomList.on("click", ".monitoring-filter-item", function () {
        var itemId = $(this).data("item-id");
        var itemType = $(this).data("item-type");

        handleBottomCardSelect(itemId, itemType);
        renderSidebar();
        renderMarkers();
    });

    $topSearch.on("input", function () {
        renderSidebar();
    });

    $bottomSearch.on("input", function () {
        renderSidebar();
    });

    fetchMonitoringData();
    startLivePolling();
});
