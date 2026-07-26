$(function () {
    var monitoringText = window.monitoringTranslations || {};
    var monitoringLocale = window.monitoringLocale || "en";
    function translateMonitoring(key) {
        return monitoringText[key] || key;
    }

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
    var securityColorMap = {};

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
    var monitoringPointModal = null;
    var securityGalleryModal = null;
    var securityGalleryPhotos = [];
    var securityGalleryIndex = 0;
    var securityGalleryEmployee = null;
    window.__monitoringSecurityZoneState =
        window.__monitoringSecurityZoneState || {};

    window.__monitoringSecurityZoneNext = function (popupKey) {
        var state = window.__monitoringSecurityZoneState[popupKey];
        if (!state || !state.photos || !state.photos.length) {
            return;
        }

        state.index = (state.index + 1) % state.photos.length;

        var currentPhoto = state.photos[state.index];
        var imageEl = document.getElementById(state.rightImageId);
        var captionEl = document.getElementById(state.rightCaptionId);
        var countEl = document.getElementById(state.rightCountId);

        if (imageEl) {
            imageEl.src = currentPhoto.image_url;
        }

        if (captionEl) {
            captionEl.textContent =
                translateMonitoring("checkpoint") +
                " " +
                (state.index + 1) +
                " " +
                translateMonitoring("of") +
                " " +
                state.photos.length;
        }

        if (countEl) {
            countEl.textContent =
                state.photos.length +
                " " +
                translateMonitoring(state.photos.length > 1 ? "photos" : "photo");
        }
    };

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

        return date.toLocaleString(monitoringLocale, {
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
                    name: employee.department_name || translateMonitoring("unknown_department"),
                });
            }
        });

        uniqueDepartments.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

        $.each(uniqueDepartments, function (index, dept) {
            departmentColorMap[dept.key] =
                departmentColorPalette[index % departmentColorPalette.length];
        });
    }

    function getDepartmentColor(employee) {
        return departmentColorMap[departmentColorKey(employee)] || "#6c757d";
    }

    function hashToHue(value) {
        var text = String(value == null ? "" : value);
        var hash = 0;

        for (var i = 0; i < text.length; i++) {
            hash = (hash * 31 + text.charCodeAt(i)) % 360;
        }

        return hash;
    }

    function getSecurityZoneColor(employee) {
        var key = String(
            employee && employee.id != null
                ? employee.id
                : employee && employee.name
                  ? employee.name
                  : "unknown",
        );

        if (!securityColorMap[key]) {
            var hue = hashToHue(key);
            securityColorMap[key] = "hsl(" + hue + ", 72%, 50%)";
        }

        return securityColorMap[key];
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

    function createStickmanIcon(
        departmentColor,
        pointType,
        sourceType,
        isLive,
    ) {
        var badgeColor = pointBadgeColor(pointType, sourceType, isLive);

        return L.divIcon({
            className: "",
            html:
                '<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="17" cy="7" r="4" fill="' +
                departmentColor +
                '" />' +
                '<line x1="17" y1="11" x2="17" y2="21" stroke="' +
                departmentColor +
                '" stroke-width="3" stroke-linecap="round" />' +
                '<line x1="10" y1="15" x2="24" y2="15" stroke="' +
                departmentColor +
                '" stroke-width="3" stroke-linecap="round" />' +
                '<line x1="17" y1="21" x2="11" y2="30" stroke="' +
                departmentColor +
                '" stroke-width="3" stroke-linecap="round" />' +
                '<line x1="17" y1="21" x2="23" y2="30" stroke="' +
                departmentColor +
                '" stroke-width="3" stroke-linecap="round" />' +
                '<circle cx="28" cy="8" r="5" fill="' +
                badgeColor +
                '" stroke="#ffffff" stroke-width="1.5" />' +
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
        var keyword = String($topSearch.val() || "")
            .trim()
            .toLowerCase();

        if (userType === "SUPERADMIN") {
            return $.grep(departments, function (department) {
                return (
                    String(department.name || "")
                        .toLowerCase()
                        .indexOf(keyword) !== -1
                );
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
            return (
                String(partner.name || "")
                    .toLowerCase()
                    .indexOf(keyword) !== -1
            );
        });
    }

    function filteredBottomItems() {
        var keyword = String($bottomSearch.val() || "")
            .trim()
            .toLowerCase();

        if (userType === "SUPERADMIN") {
            var partnerFiltered = $.grep(partners, function (partner) {
                var matchedDepartment =
                    selectedDepartmentId === "all" ||
                    String(partner.department_id || "") ===
                        String(selectedDepartmentId);

                if (!matchedDepartment) {
                    return false;
                }

                return (
                    String(partner.name || "")
                        .toLowerCase()
                        .indexOf(keyword) !== -1
                );
            });
            return partnerFiltered;
        }

        var adminDepartmentId = getAdminDepartmentId();
        var divisionFiltered = $.grep(divisions, function (division) {
            var matchedDepartment =
                adminDepartmentId === "all" ||
                String(division.department_id || "") ===
                    String(adminDepartmentId);

            var matchedPartner =
                selectedPartnerId === "all" ||
                String(division.partner_id || "") === String(selectedPartnerId);

            if (!matchedDepartment || !matchedPartner) {
                return false;
            }

            return (
                String(division.name || "")
                    .toLowerCase()
                    .indexOf(keyword) !== -1
            );
        });

        return divisionFiltered;
    }

    function renderList($container, items, selectedId, itemType) {
        if (!items.length) {
            $container.html(
                '<div class="text-muted small p-2">' +
                    translateMonitoring("no_data_found") +
                    "</div>",
            );
            return;
        }

        var html = "";

        $.each(items, function (_, item) {
            var isActive = String(selectedId) === String(item.id);
            var activeClass = isActive ? "is-selected" : "";
            var subtitle = "";

            if (itemType === "department") {
                subtitle = translateMonitoring("department");
            } else if (itemType === "partner") {
                subtitle = translateMonitoring("partner");
            } else {
                subtitle = translateMonitoring("site");
            }

            html +=
                '<div class="monitoring-filter-item p-2 mb-2 ' +
                activeClass +
                '" data-item-id="' +
                item.id +
                '" data-item-type="' +
                itemType +
                '">' +
                '<div class="d-flex justify-content-between align-items-center">' +
                "<div>" +
                '<div class="fw-semibold">' +
                escapeHtml(item.name || "-") +
                "</div>" +
                '<div class="text-muted small">' +
                subtitle +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>";
        });

        $container.html(html);
    }

    function ensureActiveFiltersValid() {
        if (userType === "SUPERADMIN") {
            var departmentExists =
                $.grep(departments, function (department) {
                    return (
                        String(department.id) === String(selectedDepartmentId)
                    );
                }).length > 0;

            if (selectedDepartmentId !== "all" && !departmentExists) {
                selectedDepartmentId = "all";
            }

            var partnerExists =
                $.grep(partners, function (partner) {
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

        var partnerExistsForAdmin =
            $.grep(scopedPartners, function (partner) {
                return String(partner.id) === String(selectedPartnerId);
            }).length > 0;

        if (selectedPartnerId !== "all" && !partnerExistsForAdmin) {
            selectedPartnerId = "all";
        }

        var scopedDivisions = $.grep(divisions, function (division) {
            var matchedDepartment =
                adminDepartmentId === "all" ||
                String(division.department_id || "") ===
                    String(adminDepartmentId);

            var matchedPartner =
                selectedPartnerId === "all" ||
                String(division.partner_id || "") === String(selectedPartnerId);

            return matchedDepartment && matchedPartner;
        });

        var divisionExists =
            $.grep(scopedDivisions, function (division) {
                return String(division.id) === String(selectedDivisionId);
            }).length > 0;

        if (selectedDivisionId !== "all" && !divisionExists) {
            selectedDivisionId = "all";
        }
    }

    function renderSidebar() {
        ensureActiveFiltersValid();

        if (userType === "SUPERADMIN") {
            $topTitle.text(translateMonitoring("department_list"));
            $bottomTitle.text(translateMonitoring("partner_list"));
            renderList(
                $topList,
                filteredTopItems(),
                selectedDepartmentId,
                "department",
            );
            renderList(
                $bottomList,
                filteredBottomItems(),
                selectedPartnerId,
                "partner",
            );
            return;
        }

        $topTitle.text(translateMonitoring("partner_list"));
        $bottomTitle.text(translateMonitoring("site_list"));
        renderList($topList, filteredTopItems(), selectedPartnerId, "partner");
        renderList(
            $bottomList,
            filteredBottomItems(),
            selectedDivisionId,
            "division",
        );
    }

    function pointTypeLabel(point) {
        if (point.type === "check_out") {
            return translateMonitoring("check_out");
        }
        if (point.type === "check_in") {
            return translateMonitoring("check_in");
        }
        if (point.is_live || point.source_type === "live") {
            return translateMonitoring("checkpoint_live");
        }
        return translateMonitoring("checkpoint");
    }

    function ensurePointModal() {
        if (monitoringPointModal) {
            return monitoringPointModal;
        }

        var modalId = "monitoringPointModal";
        var html =
            "" +
            '<div class="modal fade" id="' +
            modalId +
            '" tabindex="-1" aria-hidden="true">' +
            '  <div class="modal-dialog modal-dialog-centered">' +
            '    <div class="modal-content border-0 rounded-4">' +
            '      <div class="modal-header border-0 pb-0">' +
            '        <h5 class="modal-title fw-semibold">' +
            translateMonitoring("employee_point_detail") +
            "</h5>" +
            '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' +
            translateMonitoring("close") +
            '"></button>' +
            "      </div>" +
            '      <div class="modal-body pt-2" id="monitoringPointModalBody"></div>' +
            "    </div>" +
            "  </div>" +
            "</div>";

        $("body").append(html);
        monitoringPointModal = new bootstrap.Modal(
            document.getElementById(modalId),
        );
        return monitoringPointModal;
    }

    function buildPointTooltipHtml(employee, point) {
        var statusColor =
            point.type === "check_out"
                ? "#dc3545"
                : point.type === "check_in"
                  ? "#28a745"
                  : "#f39c12";
        var statusText = pointTypeLabel(point);

        if (point.image_url) {
            return (
                '<div style="display:flex;align-items:center;gap:8px;min-width:190px;padding:7px 9px;border-radius:10px;background:#ffffff;box-shadow:0 8px 18px rgba(0,0,0,.2);">' +
                    '<img src="' +
                    escapeHtml(point.image_url) +
                    '" alt="" style="width:20px;height:20px;aspect-ratio:1/1;object-fit:cover;border-radius:8px;display:block;">' +
                    '<div style="min-width:0;">' +
                        '<div style="font-size:10px;font-weight:700;color:#213047;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                            escapeHtml(employee.name || "-") +
                        "</div>" +
                        '<div style="font-size:8px;color:#5d6981;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                            escapeHtml(employee.partner_name || "-") +
                        "</div>" +
                    "</div>" +
                "</div>"
            );
        }
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
        var bodyHtml =
            '<div class="mb-2">' +
            '<div class="fw-semibold">' +
            escapeHtml(employee.name || "-") +
            "</div>" +
            '<div class="small text-secondary">' +
            escapeHtml(employee.partner_name || "-") +
            " • " +
            escapeHtml(employee.division_name || "-") +
            "</div>" +
            "</div>" +
            '<div class="mb-2"><span class="badge ' +
            (point.type === "check_out"
                ? "bg-danger"
                : point.type === "check_in"
                  ? "bg-success"
                  : "bg-warning") +
            '">' +
            escapeHtml(pointTypeLabel(point)) +
            "</span></div>" +
            '<div class="small text-secondary mb-2">' +
            escapeHtml(formatDateTime(point.date_time)) +
            "</div>";

        if (point.image_url) {
            bodyHtml +=
                '<img src="' +
                escapeHtml(point.image_url) +
                '" alt="" style="width:92px;height:92px;aspect-ratio:1/1;border-radius:10px;object-fit:cover;display:block;">';
        }

        $("#monitoringPointModalBody").html(bodyHtml);
        modal.show();
    }

    function buildSecurityZonePopup(employee, zonePoints, color) {
        var checkpointPoints = $.grep(zonePoints, function (point) {
            return point && point.image_url;
        });

        if (!checkpointPoints.length) {
            return "";
        }

        var checkInPoint = checkpointPoints[0];
        var checkpointPhotos = checkpointPoints.slice(1);
        var rightPhotos = checkpointPhotos.length
            ? checkpointPhotos
            : [checkInPoint];
        var rightExtraCount = Math.max(checkpointPhotos.length - 1, 0);
        var popupKey = String(employee.id);
        var leftImageId = "securityZoneLeftImage_" + popupKey;
        var rightFrameId = "securityZoneRightFrame_" + popupKey;
        var rightImageId = "securityZoneRightImage_" + popupKey;
        var rightCaptionId = "securityZoneRightCaption_" + popupKey;
        var rightCountId = "securityZoneRightCount_" + popupKey;

        window.__monitoringSecurityZoneState[popupKey] = {
            index: 0,
            photos: rightPhotos,
            rightImageId: rightImageId,
            rightCaptionId: rightCaptionId,
            rightCountId: rightCountId,
        };

        var popupHtml =
            "" +
            '<div style="min-width:320px;max-width:420px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;">' +
            '<div style="min-width:0;">' +
            '<div style="font-size:8px;font-weight:700;color:#213047;line-height:1.2;">' +
            escapeHtml(employee.name || "-") +
            "</div>" +
            '<div style="font-size:8px;color:#5d6981;line-height:1.2;">' +
            escapeHtml(employee.partner_name || "-") +
            " • " +
            escapeHtml(employee.division_name || "-") +
            "</div>" +
            "</div>" +
            '<div style="display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;background:' +
            color +
            ';color:#fff;font-size:10px;font-weight:700;white-space:nowrap;">' +
            translateMonitoring("security_activity") +
            "</div>" +
            "</div>" +
            '<div style="display:flex;gap:10px;align-items:stretch;">' +
            '<div style="flex:1;min-width:0;border:1px solid rgba(13,110,253,.18);border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 8px 20px rgba(15,23,42,.08);">' +
            '<div style="padding:8px 10px;font-size:8px;font-weight:700;color:#213047;background:rgba(13,110,253,.08);">' +
            translateMonitoring("check_in") +
            "</div>" +
            '<img id="' +
            leftImageId +
            '" src="' +
            escapeHtml(checkInPoint.image_url) +
            '" alt="check in" style="width:100%;height:140px;object-fit:cover;display:block;">' +
            '<div style="padding:8px 10px;font-size:8px;color:#5d6981;">' +
            escapeHtml(formatDateTime(checkInPoint.date_time)) +
            "</div>" +
            "</div>" +
            '<div id="' +
            rightFrameId +
            '" onclick="window.__monitoringSecurityZoneNext(\'' +
            popupKey +
            '\')" style="flex:1;min-width:0;border:1px solid rgba(13,110,253,.18);border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 8px 20px rgba(15,23,42,.08);cursor:pointer;position:relative;">' +
            '<div style="padding:8px 10px;font-size:11px;font-weight:700;color:#213047;background:rgba(13,110,253,.08);display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
            "<span>" +
            translateMonitoring("checkpoint") +
            "</span>" +
            '<span style="font-size:10px;color:' +
            color +
            ';font-weight:700;">+' +
            rightExtraCount +
            "</span>" +
            "</div>" +
            '<img id="' +
            rightImageId +
            '" src="' +
            escapeHtml(rightPhotos[0].image_url) +
            '" alt="checkpoint" style="width:100%;height:140px;object-fit:cover;display:block;">' +
            '<div style="padding:8px 10px;font-size:10px;color:#5d6981;display:flex;justify-content:space-between;gap:8px;">' +
            '<span id="' +
            rightCaptionId +
            '">' +
            translateMonitoring("checkpoint") +
            " 1 " +
            translateMonitoring("of") +
            " " +
            rightPhotos.length +
            "</span>" +
            '<span id="' +
            rightCountId +
            '" style="font-weight:700;color:' +
            color +
            ';">' +
            rightPhotos.length +
            " " +
            translateMonitoring(rightPhotos.length > 1 ? "photos" : "photo") +
            "</span>" +
            "</div>" +
            "</div>" +
            "</div>" +
            '<div style="margin-top:8px;font-size:10px;color:#6c757d;">' +
            translateMonitoring("checkpoint_hint") +
            "</div>" +
            "</div>";

        return popupHtml;
    }

    function employeeIdsByFilter() {
        var adminDepartmentId = getAdminDepartmentId();

        var filtered = $.grep(employees, function (employee) {
            if (userType !== "SUPERADMIN") {
                if (
                    adminDepartmentId !== "all" &&
                    String(employee.department_id || "") !== adminDepartmentId
                ) {
                    return false;
                }
            }

            if (
                selectedDepartmentId !== "all" &&
                String(employee.department_id || "") !==
                    String(selectedDepartmentId)
            ) {
                return false;
            }

            if (
                selectedPartnerId !== "all" &&
                String(employee.partner_id || "") !== String(selectedPartnerId)
            ) {
                return false;
            }

            if (
                selectedDivisionId !== "all" &&
                String(employee.division_id || "") !==
                    String(selectedDivisionId)
            ) {
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

    function normalizePointType(point) {
        return String(point && point.type ? point.type : "")
            .trim()
            .toLowerCase();
    }

    function isSecurityEmployee(employee) {
        return (
            String(employee && employee.job_name ? employee.job_name : "")
                .trim()
                .toUpperCase() === "TENAGA KEAMANAN"
        );
    }

    function getRequiredCheckpointCount(employee) {
        return Number(employee.required_checkpoint_count || 0);
    }

    function isSecurityCheckpoint(point) {
        var type = normalizePointType(point);
        var sourceType = String(
            point && point.source_type ? point.source_type : "",
        )
            .trim()
            .toLowerCase();

        return (
            !point.is_live &&
            sourceType !== "live" &&
            (type === "check_in" || type === "checkpoint")
        );
    }

    function sortPointsByDate(points) {
        return points.slice().sort(function (a, b) {
            return (
                new Date(a.date_time || 0).getTime() -
                new Date(b.date_time || 0).getTime()
            );
        });
    }

    function getUniqueCoordinates(points) {
        var coordinates = [];
        var seen = {};

        $.each(points, function (_, point) {
            var latitude = Number(point.lat);
            var longitude = Number(point.lng);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return;
            }

            var key = latitude.toFixed(7) + "," + longitude.toFixed(7);

            if (seen[key]) {
                return;
            }

            seen[key] = true;
            coordinates.push([latitude, longitude]);
        });

        return coordinates;
    }

    function getSecurityPhotos(points) {
        return $.map(points, function (point, index) {
            if (!point.image_url) {
                return null;
            }

            return {
                image_url: point.image_url,
                type: normalizePointType(point),
                label:
                    normalizePointType(point) === "check_in"
                        ? translateMonitoring("check_in")
                        : translateMonitoring("checkpoint") + " " + (index + 1),
                date_time: point.date_time,
            };
        });
    }

    function getSecurityCheckInPhoto(photos) {
        var checkInPhoto = null;

        $.each(photos, function (_, photo) {
            if (!checkInPhoto && photo.type === "check_in") {
                checkInPhoto = photo;
            }
        });

        return checkInPhoto || photos[0] || null;
    }

    function getSecurityCheckpointPhotos(photos, checkInPhoto) {
        return $.grep(photos, function (photo) {
            return photo !== checkInPhoto;
        });
    }

    function ensureSecurityGalleryModal() {
        if (securityGalleryModal) {
            return securityGalleryModal;
        }

        var html =
            '<div class="modal fade" id="securityGalleryModal" tabindex="-1" aria-hidden="true">' +
            '<div class="modal-dialog modal-dialog-centered modal-lg">' +
            '<div class="modal-content border-0 rounded-4 security-gallery-modal">' +
            '<div class="modal-header border-0">' +
            "<div>" +
            '<h5 class="modal-title fw-semibold mb-1" id="securityGalleryTitle"></h5>' +
            '<div class="small text-secondary" id="securityGallerySubtitle"></div>' +
            "</div>" +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' +
            translateMonitoring("close") +
            '"></button>' +
            "</div>" +
            '<div class="modal-body pt-0">' +
            '<div class="security-gallery-viewer">' +
            '<button type="button" class="security-gallery-nav security-gallery-prev">' +
            '<span class="material-symbols-outlined">chevron_left</span>' +
            "</button>" +
            '<img id="securityGalleryImage" class="security-gallery-image" src="" alt="Checkpoint">' +
            '<button type="button" class="security-gallery-nav security-gallery-next">' +
            '<span class="material-symbols-outlined">chevron_right</span>' +
            "</button>" +
            "</div>" +
            '<div class="security-gallery-information">' +
            "<div>" +
            '<div class="fw-semibold" id="securityGalleryCaption"></div>' +
            '<div class="small text-secondary" id="securityGalleryDate"></div>' +
            "</div>" +
            '<div class="security-gallery-counter" id="securityGalleryCounter"></div>' +
            "</div>" +
            '<div class="security-gallery-thumbnails" id="securityGalleryThumbnails"></div>' +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>";

        $("body").append(html);

        securityGalleryModal = new bootstrap.Modal(
            document.getElementById("securityGalleryModal"),
        );

        $(document).on("click", ".security-gallery-prev", function () {
            showSecurityGalleryPhoto(securityGalleryIndex - 1);
        });

        $(document).on("click", ".security-gallery-next", function () {
            showSecurityGalleryPhoto(securityGalleryIndex + 1);
        });

        $(document).on("click", ".security-gallery-thumbnail", function () {
            showSecurityGalleryPhoto(Number($(this).data("index")));
        });

        return securityGalleryModal;
    }

    function renderSecurityGalleryThumbnails() {
        var html = "";

        $.each(securityGalleryPhotos, function (index, photo) {
            var activeClass = index === securityGalleryIndex ? "is-active" : "";

            html +=
                '<button type="button" class="security-gallery-thumbnail ' +
                activeClass +
                '" data-index="' +
                index +
                '">' +
                '<img src="' +
                escapeHtml(photo.image_url) +
                '" alt="' +
                escapeHtml(photo.label) +
                '">' +
                "</button>";
        });

        $("#securityGalleryThumbnails").html(html);
    }

    function showSecurityGalleryPhoto(index) {
        if (!securityGalleryPhotos.length) {
            return;
        }

        if (index < 0) {
            index = securityGalleryPhotos.length - 1;
        }

        if (index >= securityGalleryPhotos.length) {
            index = 0;
        }

        securityGalleryIndex = index;

        var photo = securityGalleryPhotos[index];

        $("#securityGalleryImage").attr("src", photo.image_url);

        $("#securityGalleryCaption").text(photo.label);

        $("#securityGalleryDate").text(formatDateTime(photo.date_time));

        $("#securityGalleryCounter").text(
            index + 1 + " / " + securityGalleryPhotos.length,
        );

        $(".security-gallery-prev, .security-gallery-next").toggle(
            securityGalleryPhotos.length > 1,
        );

        renderSecurityGalleryThumbnails();
    }

    function openSecurityGallery(employee, photos, selectedIndex) {
        if (!photos.length) {
            return;
        }

        securityGalleryEmployee = employee;
        securityGalleryPhotos = photos;
        securityGalleryIndex = Number(selectedIndex || 0);

        $("#securityGalleryTitle").text(employee.name || "-");

        $("#securityGallerySubtitle").text(
            (employee.partner_name || "-") +
                " • " +
                (employee.division_name || "-"),
        );

        showSecurityGalleryPhoto(securityGalleryIndex);
        ensureSecurityGalleryModal().show();
    }

    function buildSecurityZoneLabel(
        employee,
        photos,
        checkInPhoto,
        checkpointPhotos,
        color,
    ) {
        var checkpointPreview = checkpointPhotos[0] || checkInPhoto;
        var remainingPhotos = Math.max(checkpointPhotos.length - 1, 0);

        var checkInFrame = checkInPhoto
            ? '<img src="' +
              escapeHtml(checkInPhoto.image_url) +
              '" alt="' +
              translateMonitoring("check_in") +
              '">'
            : '<div class="security-zone-empty">' +
              translateMonitoring("no_photo") +
              "</div>";

        var checkpointFrame = checkpointPreview
            ? '<img src="' +
              escapeHtml(checkpointPreview.image_url) +
              '" alt="' +
              translateMonitoring("checkpoint") +
              '">'
            : '<div class="security-zone-empty">' +
              translateMonitoring("no_photo") +
              "</div>";

        return (
            '<div class="security-zone-label" style="--security-zone-color:' +
            escapeHtml(color) +
            ';">' +
            '<div class="security-zone-header">' +
            '<div class="security-zone-employee">' +
            '<div class="security-zone-name fs-8">' +
            escapeHtml(employee.name || "-") +
            "</div>" +
            '<div class="security-zone-partner fs-8">' +
            escapeHtml(employee.partner_name || "-") +
            "</div>" +
            "</div>" +
            "</div>" +
            '<div class="security-zone-frames">' +
            '<button type="button" class="security-zone-frame security-zone-checkin" data-gallery-index="0">' +
            checkInFrame +
            '<span class="security-zone-frame-label">' +
            translateMonitoring("check_in") +
            "</span>" +
            "</button>" +
            '<button type="button" class="security-zone-frame security-zone-more" data-gallery-index="' +
            Math.min(1, photos.length - 1) +
            '">' +
            checkpointFrame +
            (remainingPhotos > 0
                ? '<span class="security-zone-more-count">+' +
                  remainingPhotos +
                  "</span>"
                : "") +
            '<span class="security-zone-frame-label">' +
            translateMonitoring("checkpoint") +
            "</span>" +
            "</button>" +
            "</div>" +
            "</div>"
        );
    }

    function bindSecurityZoneEvents(zoneMarker, polygon, employee, photos) {
        zoneMarker.on("add", function () {
            var element = zoneMarker.getElement();

            if (!element) {
                return;
            }

            $(element)
                .off(".securityZone")
                .on(
                    "click.securityZone",
                    ".security-zone-frame",
                    function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        var selectedIndex = Number(
                            $(this).data("gallery-index") || 0,
                        );

                        openSecurityGallery(employee, photos, selectedIndex);
                    },
                );
        });

        polygon.on("click", function () {
            openSecurityGallery(employee, photos, 0);
        });
    }

    function renderSecurityZone(filteredPoints, employeeMap) {
        var groupedPoints = {};

        $.each(filteredPoints, function (_, point) {
            var employee = employeeMap[String(point.employee_id)];

            if (!employee || !isSecurityEmployee(employee)) {
                return;
            }

            if (!isSecurityCheckpoint(point)) {
                return;
            }

            var employeeId = String(point.employee_id);

            if (!groupedPoints[employeeId]) {
                groupedPoints[employeeId] = [];
            }

            groupedPoints[employeeId].push(point);
        });

        $.each(groupedPoints, function (employeeId, employeePoints) {
            var employee = employeeMap[employeeId];

            if (!employee) {
                return;
            }

            var orderedPoints = sortPointsByDate(employeePoints);
            var requiredCheckpointCount = getRequiredCheckpointCount(employee);

            if (
                requiredCheckpointCount <= 0 ||
                orderedPoints.length < requiredCheckpointCount
            ) {
                return;
            }

            var completedPoints = orderedPoints.slice(
                0,
                requiredCheckpointCount,
            );

            var coordinates = getUniqueCoordinates(completedPoints);

            if (coordinates.length < 3) {
                return;
            }

            var photos = getSecurityPhotos(completedPoints);
            var checkInPhoto = getSecurityCheckInPhoto(photos);
            var checkpointPhotos = getSecurityCheckpointPhotos(
                photos,
                checkInPhoto,
            );

            var color = getSecurityZoneColor(employee);

            var polygon = L.polygon(coordinates, {
                color: color,
                weight: 3,
                opacity: 0.95,
                fillColor: color,
                fillOpacity: 0.16,
            });

            var center = polygon.getBounds().getCenter();

            var zoneIcon = L.divIcon({
                className: "monitoring-security-zone-icon",
                html: buildSecurityZoneLabel(
                    employee,
                    photos,
                    checkInPhoto,
                    checkpointPhotos,
                    color,
                ),
                iconSize: [270, 150],
                iconAnchor: [135, 75],
            });

            var zoneMarker = L.marker(center, {
                icon: zoneIcon,
                zIndexOffset: 2000,
                keyboard: false,
            });

            bindSecurityZoneEvents(zoneMarker, polygon, employee, photos);

            areaLayer.addLayer(polygon);
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
                icon: createStickmanIcon(
                    departmentColor,
                    point.type,
                    point.source_type,
                    point.is_live,
                ),
            });

            var popupHtml =
                '<div style="min-width:170px;">' +
                '<div style="font-weight:700;">' +
                escapeHtml(employee.name || "-") +
                "</div>" +
                '<div style="font-size:12px;color:#6c757d;">' +
                escapeHtml(employee.department_name || "-") +
                " • " +
                escapeHtml(employee.division_name || "-") +
                "</div>" +
                '<div style="margin-top:6px;font-size:12px;"><span class="badge ' +
                (point.type === "check_out"
                    ? "bg-danger"
                    : point.type === "check_in"
                      ? "bg-success"
                      : "bg-warning") +
                '">' +
                escapeHtml(pointTypeLabel(point)) +
                "</span></div>" +
                '<div style="font-size:12px;color:#495057;margin-top:4px;">' +
                escapeHtml(formatDateTime(point.date_time)) +
                "</div>";

            if (point.image_url) {
                popupHtml +=
                    '<div style="margin-top:8px;"><img src="' +
                    escapeHtml(point.image_url) +
                    '" alt="" style="width:100%;max-width:200px;max-height:120px;object-fit:cover;border-radius:8px;"></div>';
            }

            popupHtml += "</div>";

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
