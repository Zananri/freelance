$(function () {
    var appUrl = $('meta[name="app-url"]').attr("content") || "";

    var $form = $("#employeeEditForm");
    var $loaderOverlay = $('<div class="modal-loading-overlay d-none"><div class="loader-spinner"></div></div>');
    $form.append($loaderOverlay);

    var $profilePictureLabel = $('label[for="profile_picture"]');
    var $profilePictureClearBtn = $("#profilePictureClearBtn");
    var $photoLabel = $('label[for="photo"]');
    var $photoClearBtn = $("#photoClearBtn");
    var $ktpLabel = $('label[for="ktp"]');
    var $ktpClearBtn = $("#ktpClearBtn");
    var $inputProfilePicture = $("#profile_picture");
    var $inputPhoto = $("#photo");
    var $inputKtp = $("#ktp");
    var $formAlert = $("#formAlert");

var regionsUrl = appUrl + "/employee/regions";
var dropdownText = window.dropdownTranslations || {};
var dropdownLabel = function (key, fallback) {
    return dropdownText[key] || fallback;
};

    var $departmentSelect = $("#department_id");
    var $businessDepartmentSelect = $("#business_department_id");
    var $regionSelect = $("#region");
    var $divisionSelect = $("#division_id");
    var $jobSelect = $("#job_id");
    var $shiftSelect = $("#shift_id");
    var $shiftTimeHint = $("#shift_time_hint");

    function getEmployeeIdFromUrl() {
        try {
            var path = window.location.pathname || "";
            var m = path.match(/\/employee\/(\d+)\/(edit|update)?/i);
            if (m && m[1]) return m[1];
        } catch (e) {}
        try {
            if ($form.length && $form.attr("action")) {
                var m2 = String($form.attr("action")).match(/\/employee\/(\d+)/i);
                if (m2 && m2[1]) return m2[1];
            }
        } catch (e) {}
        return null;
    }

    function isSuperadminName(name) {
        return /superadmin/i.test(String(name || ""));
    }

    function isAdminDummyName(name) {
        return /^ADMIN\s+.+\s+(PARTNER|SITE|DIVISION|JOB)$/i.test(String(name || "").trim());
    }

    function showFloatingAlert(message, type, delayMs) {
        type = type || "success";
        delayMs = delayMs || 2500;
        if (typeof window.showAlertMsg === "function") {
            window.showAlertMsg(message, "light", delayMs);
            return;
        }
        var $box = $(".box-alert-messages .box-message");
        if ($box.length) {
            $box.parent().show();
            $box.removeClass("success warning error light").addClass("light");
            $box.html(message);
            setTimeout(function () {
                if (typeof window.hideAlertMsg === "function") {
                    window.hideAlertMsg();
                } else {
                    $box.parent().hide();
                }
            }, delayMs);
            return;
        }
        try {
            alert(typeof message === "string" ? message.replace(/<[^>]+>/g, "") : String(message));
        } catch (e) {}
    }

    function loadDepartmentFilters(selectedId, selectedRegion) {
        if (!$businessDepartmentSelect.length) return;
        var locked = $businessDepartmentSelect.attr("data-locked") === "1";

        $.ajax({
            url: appUrl + "/department/index",
            method: "GET",
            dataType: "json",
            success: function (data) {
                var options = '<option value="" disabled>' + dropdownLabel("select_department", "Select Department") + '</option>';
                (data.data || [])
                    .filter(function (dept) {
                        return !isSuperadminName(dept.name_department || dept.name);
                    })
                    .forEach(function (dept) {
                        var isSelected = selectedId && String(dept.id) === String(selectedId);
                        options += '<option value="' + dept.id + '" ' + (isSelected ? "selected" : "") + ">" + (dept.name_department || dept.name) + "</option>";
                    });
                $businessDepartmentSelect.html(options);
                if (selectedId) {
                    $businessDepartmentSelect.val(String(selectedId));
                }
                $businessDepartmentSelect.prop("disabled", locked);
                loadRegions(selectedRegion || "");
            },
            error: function () {
                showFloatingAlert("Failed to load department filters.", "warning", 3000);
            },
        });
    }

    function loadRegions(selectedRegion) {
        if (!$regionSelect.length) return;
        selectedRegion = $.trim(String(selectedRegion || $regionSelect.attr("data-current") || ""));
        var departmentId = $businessDepartmentSelect.length ? $businessDepartmentSelect.val() : "";

        if (!departmentId) {
            if (selectedRegion) {
                $regionSelect.empty().append(
                    $("<option>", { value: selectedRegion, text: selectedRegion, selected: true })
                );
                $regionSelect.prop("disabled", false);
            } else {
                $regionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_department_first", "Select Department First") + '</option>');
                $regionSelect.prop("disabled", true);
            }
            return;
        }

        if (!selectedRegion) {
            $regionSelect.html('<option value="" disabled selected>Loading...</option>');
        }
        $regionSelect.prop("disabled", true);

        $.ajax({
            url: regionsUrl,
            type: "GET",
            data: {
                business_department_id: departmentId,
            },
            dataType: "json",
            success: function (data) {
                var regions = (data.data || []).map(function (region) {
                    return $.trim(String(region));
                });
                if (selectedRegion && regions.indexOf(selectedRegion) === -1) {
                    regions.unshift(selectedRegion);
                }

                $regionSelect.empty().append(
                    $("<option>", {
                        value: "",
                        text: dropdownLabel("select_region", "Select Region"),
                        disabled: true,
                        selected: !selectedRegion,
                    })
                );
                regions.forEach(function (region) {
                    $regionSelect.append(
                        $("<option>", {
                            value: region,
                            text: region,
                            selected: selectedRegion === region,
                        })
                    );
                });
                $regionSelect.prop("disabled", false);
                if (selectedRegion) {
                    $regionSelect.val(selectedRegion);
                }
            },
            error: function () {
                if (selectedRegion) {
                    $regionSelect.empty().append(
                        $("<option>", { value: selectedRegion, text: selectedRegion, selected: true })
                    );
                } else {
                    $regionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_region", "Select Region") + '</option>');
                }
                $regionSelect.prop("disabled", false);
                showFloatingAlert("Failed to load regions.", "warning", 3000);
            },
        });
    }

    function loadDepartments(selectedId) {
        var selectedDepartmentFilter = $businessDepartmentSelect.length ? $businessDepartmentSelect.val() : "";
        var selectedRegionFilter = $regionSelect.length ? $regionSelect.val() : "";

        $.ajax({
            url: appUrl + "/partner/index",
            method: "GET",
            data: {
                department_id: selectedDepartmentFilter || undefined,
                region: selectedRegionFilter || undefined,
            },
            dataType: "json",
            success: function (data) {
                var options = '<option value="" disabled>' + dropdownLabel("select_partner", "Select Partner") + '</option>';
                (data.data || [])
                    .filter(function (dept) {
                        var name = dept.partner_name || dept.name_department || dept.name;
                        return !isSuperadminName(name) && !isAdminDummyName(name);
                    })
                    .forEach(function (dept) {
                        var isSelected = selectedId && String(dept.id) === String(selectedId);
                        options += '<option value="' + dept.id + '" ' + (isSelected ? "selected" : "") + ">" + (dept.partner_name || dept.name_department || dept.name) + "</option>";
                    });
                $departmentSelect.html(options);
                if (selectedId) {
                    $departmentSelect.val(String(selectedId));
                }
            },
            error: function () {
                showFloatingAlert("Failed to load partners.", "warning", 3000);
            },
        });
    }

    function loadDivisions(partnerId, selectedId) {
        if (!partnerId) {
            $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_partner_first", "Select Partner First") + '</option>');
            $divisionSelect.prop("disabled", true);
            return;
        }

        $divisionSelect.html('<option value="" disabled selected>Loading...</option>');
        $divisionSelect.prop("disabled", true);

        if ($jobSelect.length) {
            $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
            $jobSelect.prop("disabled", true);
        }

        $.ajax({
            url: appUrl + "/division/index",
            method: "GET",
            data: {
                partner_id: partnerId,
                business_department_id: $businessDepartmentSelect.length ? $businessDepartmentSelect.val() : undefined,
                region: $regionSelect.length ? $regionSelect.val() || undefined : undefined,
                status: "ACTIVE",
            },
            dataType: "json",
            success: function (data) {
                var options = '<option value="" disabled selected>' + dropdownLabel("select_site", "Select Site") + '</option>';
                (data.data || [])
                    .filter(function (div) {
                        var name = div.name_division || div.name;
                        return !isSuperadminName(name) && !isAdminDummyName(name);
                    })
                    .forEach(function (div) {
                        var isSelected = selectedId && String(div.id) === String(selectedId);
                        options += '<option value="' + div.id + '" ' + (isSelected ? "selected" : "") + ">" + (div.name_division || div.name) + "</option>";
                    });

                $divisionSelect.html(options);
                $divisionSelect.prop("disabled", false);

                if (selectedId) {
                    $divisionSelect.val(String(selectedId));
                }

                if ($jobSelect.length) {
                    $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
                    $jobSelect.prop("disabled", true);
                }
            },
            error: function () {
                $divisionSelect.html('<option value="" disabled selected>Failed to load divisions</option>');
                $divisionSelect.prop("disabled", true);
            },
        });
    }

    function loadJobs(divisionId, selectedId, departmentId) {
        if (!$jobSelect.length) return;

        if (!divisionId) {
            $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_site_first", "Select Site First") + '</option>');
            $jobSelect.prop("disabled", true);
            return;
        }

        $jobSelect.html('<option value="" disabled selected>Loading...</option>');
        $jobSelect.prop("disabled", true);

        $.ajax({
            url: appUrl + "/job/index",
            method: "GET",
            data: {
                division_id: divisionId,
                partner_id: $departmentSelect.length ? $departmentSelect.val() : undefined,
                business_department_id: $businessDepartmentSelect.length ? $businessDepartmentSelect.val() : undefined,
                region: $regionSelect.length ? $regionSelect.val() || undefined : undefined,
                status: "ACTIVE",
            },
            dataType: "json",
            success: function (data) {
                var jobs = data && Array.isArray(data.data) ? data.data : [];

                if (!jobs.length) {
                    $jobSelect.html('<option value="" disabled selected>No jobs available for this division</option>');
                    $jobSelect.prop("disabled", true);
                    return;
                }

                var options = '<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>';
                jobs
                    .filter(function (job) {
                        var name = job.job_name || job.name;
                        return !isSuperadminName(name) && !isAdminDummyName(name);
                    })
                    .forEach(function (job) {
                        var isSelected = selectedId && String(job.id) === String(selectedId);
                        options += '<option value="' + job.id + '" ' + (isSelected ? "selected" : "") + ">" + (job.job_name || job.name) + "</option>";
                    });

                $jobSelect.html(options);
                $jobSelect.prop("disabled", false);

                if (selectedId) {
                    $jobSelect.val(String(selectedId));
                }
            },
            error: function () {
                $jobSelect.html('<option value="" disabled selected>Failed to load jobs</option>');
                $jobSelect.prop("disabled", true);
            },
        });
    }

    var currentDepartmentId = $departmentSelect.attr("data-current-partner") || null;
    var currentPartnerDepartmentId = $businessDepartmentSelect.length ? $businessDepartmentSelect.attr("data-current") : null;
    var currentDivisionId = $divisionSelect.attr("data-current") || null;
    var currentJobId = $jobSelect.attr("data-current") || null;
    var currentRegion = $regionSelect.length ? $regionSelect.attr("data-current") : null;

    var hasExistingJobs = $jobSelect.length && $jobSelect.find("option").length > 1;

    if (currentDepartmentId) {
        loadDepartments(currentDepartmentId);
    }

    loadDepartmentFilters(currentPartnerDepartmentId || "", currentRegion || "");

    if (hasExistingJobs && currentJobId) {
        $jobSelect.val(currentJobId);
        $jobSelect.prop("disabled", false);
    } else if (currentDivisionId) {
        setTimeout(function () {
            loadDivisions(currentDepartmentId, currentDivisionId);
            if (currentJobId) {
                setTimeout(function () {
                    loadJobs(currentDivisionId, currentJobId, currentDepartmentId);
                }, 800);
            }
        }, 300);
    }

    function loadShifts(selectedId) {
        if (!$shiftSelect.length) return;
        var shiftsUrl = $shiftSelect.attr("data-fetch-url") || (appUrl ? appUrl + "/shift/list" : "/shift/list");

        $.ajax({
            url: shiftsUrl,
            type: "GET",
            dataType: "json",
            success: function (resp) {
                var data = resp.data || [];
                var options = '<option value="" disabled>Select Shift</option>';
                data.forEach(function (s) {
                    var start = (s.time_start || "").slice(0, 5) || "--:--";
                    var end = (s.time_end || "").slice(0, 5) || "--:--";
                    var title = s.title || "Shift " + start + "-" + end;
                    options += '<option value="' + s.id + '" data-start="' + start + '" data-end="' + end + '">' + title + " (" + start + " - " + end + ")</option>";
                });
                $shiftSelect.html(options);
                if (selectedId) {
                    $shiftSelect.val(String(selectedId));
                }
                var $opt = $shiftSelect.find("option:selected");
                if ($opt.attr("data-start") && $shiftTimeHint.length) {
                    $shiftTimeHint.text($opt.attr("data-start") + " - " + $opt.attr("data-end"));
                }
            },
            error: function () {
                showFloatingAlert("Failed to load shifts.", "warning", 3000);
            },
        });
    }

    if ($shiftSelect.length) {
        var currentShiftId = $shiftSelect.attr("data-current");
        loadShifts(currentShiftId);
        $shiftSelect.on("change", function () {
            var $opt = $(this).find("option:selected");
            var start = $opt.attr("data-start");
            var end = $opt.attr("data-end");
            if ($shiftTimeHint.length) $shiftTimeHint.text(start + " - " + end);
        });
    }

    $departmentSelect.on("change", function () {
        var partnerId = $(this).val();
        if (partnerId) {
            if ($divisionSelect.length) {
                $divisionSelect.val("");
                $divisionSelect.attr("data-current", "");
                $divisionSelect.html('<option value="" disabled selected>Loading...</option>');
                $divisionSelect.prop("disabled", true);
            }
            if ($jobSelect.length) {
                $jobSelect.val("");
                $jobSelect.attr("data-current", "");
                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
                $jobSelect.prop("disabled", true);
            }
            loadDivisions(partnerId, null);
        } else {
            if ($divisionSelect.length) {
                $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_site", "Select Site") + '</option>');
                $divisionSelect.prop("disabled", true);
                $divisionSelect.val("");
            }
            if ($jobSelect.length) {
                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
                $jobSelect.prop("disabled", true);
                $jobSelect.val("");
            }
        }
    });

    if ($businessDepartmentSelect.length) {
        $businessDepartmentSelect.on("change", function () {
            loadRegions();
            loadDepartments(null);
            if ($departmentSelect.length) $departmentSelect.val("");
            if ($divisionSelect.length) {
                $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_site", "Select Site") + '</option>');
                $divisionSelect.prop("disabled", true);
            }
            if ($jobSelect.length) {
                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
                $jobSelect.prop("disabled", true);
            }
        });
    }

    if ($regionSelect.length) {
        $regionSelect.on("change", function () {
            loadDepartments(null);
            if ($departmentSelect.length) $departmentSelect.val("");
            if ($divisionSelect.length) {
                $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_site", "Select Site") + '</option>');
                $divisionSelect.prop("disabled", true);
            }
            if ($jobSelect.length) {
                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
                $jobSelect.prop("disabled", true);
            }
        });
    }

    $divisionSelect.on("change", function () {
        var divId = $(this).val();
        var partnerId = $departmentSelect.length ? $departmentSelect.val() : null;
        if (divId && partnerId) {
            if ($jobSelect.length) {
                $jobSelect.attr("data-current", "");
                $jobSelect.val("");
            }
            loadJobs(divId, null, partnerId);
        } else {
            if ($jobSelect.length) {
                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
                $jobSelect.prop("disabled", true);
                $jobSelect.val("");
            }
        }
    });

    function setupImageInput($input, $label, $clearBtn) {
        if (!$input.length || !$label.length) return;

        $input.on("change", function () {
            var files = this.files;
            if (files && files[0]) {
                var maxBytes = 10 * 1024 * 1024;
                if (files[0].size > maxBytes) {
                    showFloatingAlert("Maximum file size is 10 MB.", "warning", 3500);
                    $input.val("");
                    $label.css("background-image", "").removeClass("has-image").css("opacity", "0.5");
                    if ($clearBtn.length) $clearBtn.addClass("d-none");
                    return;
                }
                var reader = new FileReader();
                reader.onload = function (e) {
                    if ($input.get(0) !== $inputProfilePicture.get(0)) {
                        $label.css("background-image", "url('" + e.target.result + "')").addClass("has-image").css({ "background-size": "cover", opacity: "1" });
                        if ($clearBtn.length) $clearBtn.removeClass("d-none");
                        if ($input.get(0) === $inputPhoto.get(0)) {
                            var empId = getEmployeeIdFromUrl();
                            if (empId) {
                                try {
                                    localStorage.setItem("editEmployeeUpdatedPhoto", JSON.stringify({ employeeId: String(empId), photoUrl: e.target.result }));
                                } catch (err) {}
                            }
                        }
                    }
                };
                reader.readAsDataURL(files[0]);
            } else {
                $label.css("background-image", "").removeClass("has-image").css("opacity", "0.5");
                if ($clearBtn.length) $clearBtn.addClass("d-none");
                if ($input.get(0) === $inputPhoto.get(0)) {
                    try {
                        localStorage.removeItem("editEmployeeUpdatedPhoto");
                    } catch (err) {}
                }
            }
        });

        if ($clearBtn.length) {
            $clearBtn.on("click", function (e) {
                e.preventDefault();
                $input.val("");
                $label.css("background-image", "").removeClass("has-image is-valid is-invalid").css("opacity", "0.5");
                $clearBtn.addClass("d-none");
            });
        }
    }

    setupImageInput($inputPhoto, $photoLabel, $photoClearBtn);
    setupImageInput($inputKtp, $ktpLabel, $ktpClearBtn);

    $form.on("submit", function (e) {
        e.preventDefault();
        var formEl = $form.get(0);

        if (!formEl.checkValidity()) {
            e.stopPropagation();
            $form.addClass("was-validated");
            return;
        }
        $form.removeClass("was-validated");

        $loaderOverlay.removeClass("d-none");
        if ($formAlert.length) $formAlert.html("");

        var formData = new FormData(formEl);
        formData.append("_method", "PUT");

        formData.set("name", formData.get("employee_name"));
        formData.delete("employee_name");
        if (formData.get("employee_niks") !== null) {
            formData.set("employee_niks", formData.get("employee_niks"));
        }
        formData.set("email", formData.get("employee_email"));
        formData.delete("employee_email");
        formData.set("email_work", formData.get("employee_email_work"));
        formData.delete("employee_email_work");
        formData.set("phone", formData.get("employee_phone"));
        formData.delete("employee_phone");
        if (formData.get("shift_id")) {
            formData.set("shift_id", formData.get("shift_id"));
        }
        if (formData.get("grade_id")) {
            formData.set("grade_id", formData.get("grade_id"));
        }
        if (formData.get("office")) {
            formData.set("office", formData.get("office"));
        }

        $.ajax({
            url: $form.attr("action"),
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                "X-Requested-With": "XMLHttpRequest",
            },
            success: function (data) {
                $loaderOverlay.addClass("d-none");
                var successMsg = (data && data.message) || "Employee updated successfully.";
                showFloatingAlert(successMsg, "success", 2000);

                setTimeout(function () {
                    if (data && data.updatedPhotoUrl && data.employeeId) {
                        try {
                            localStorage.setItem("editEmployeeUpdatedPhoto", JSON.stringify({ employeeId: String(data.employeeId), photoUrl: data.updatedPhotoUrl }));
                        } catch (err) {}
                    }
                    window.location.href = appUrl + "/employee";
                }, 2000);

                $form.find("input, select, textarea").removeClass("is-valid is-invalid");
                $form.find("label").removeClass("is-valid is-invalid");
                $form.removeClass("was-validated");
            },
            error: function (xhr) {
                $loaderOverlay.addClass("d-none");

                if (xhr.status === 422) {
                    var resp = xhr.responseJSON || {};
                    var errors = resp.errors || {};
                    var message = resp.message || "Validation failed.";
                    var keys = Object.keys(errors);
                    if (keys.length) {
                        var firstKey = keys[0];
                        var arr = errors[firstKey] || [];
                        if (arr.length) message = arr[0];
                    }
                    if ($formAlert.length) $formAlert.html("");
                    showFloatingAlert(message, "warning", 5000);
                } else {
                    var msg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Failed to update employee. Please try again.";
                    if ($formAlert.length) $formAlert.html("");
                    showFloatingAlert(msg, "warning", 4000);
                }
            },
        });
    });

    var $cvInput = $("#cv");
    var $cvFileName = $("#cvFileName");
    if ($cvInput.length && $cvFileName.length) {
        $cvInput.on("change", function () {
            var file = this.files && this.files[0] ? this.files[0] : null;
            $cvFileName.val(file ? file.name : "");
        });
    }

    var $pkwtInput = $("#pkwt");
    var $pkwtFileName = $("#pkwtFileName");
    if ($pkwtInput.length && $pkwtFileName.length) {
        $pkwtInput.on("change", function () {
            var file = this.files && this.files[0] ? this.files[0] : null;
            $pkwtFileName.val(file ? file.name : "");
        });
    }

    var $inputs = $form.find("input, select, textarea");

    function validateField($input) {
        var el = $input.get(0);
        if ($input.attr("id") === "profile_picture") {
            if (el.checkValidity()) {
                $input.removeClass("is-invalid").addClass("is-valid");
                if ($profilePictureLabel.length) $profilePictureLabel.removeClass("is-invalid").addClass("is-valid");
            } else {
                $input.removeClass("is-valid").addClass("is-invalid");
                if ($profilePictureLabel.length) $profilePictureLabel.addClass("is-invalid").removeClass("is-valid");
            }
        } else {
            if (el.checkValidity()) {
                $input.removeClass("is-invalid").addClass("is-valid");
            } else {
                $input.removeClass("is-valid").addClass("is-invalid");
            }
        }
        $form.removeClass("was-validated");
    }

    $inputs.on("input", function () {
        validateField($(this));
    });
    $inputs.on("change", function () {
        validateField($(this));
    });
});

$("#basic_salary,#positional_allowance,#pension_allowance,#bpjs_allowance,#bpjs_tenaga_kerja_allowance").mask("000.000.000", { reverse: true });
$('[name="hid_thp"]').mask("000.000.000", { reverse: true });
$(".text-thp").html($('[name="hid_thp"]').val());

function setTHP() {
    var basicSalary = $('[name="basic_salary"]').val();
    var positionalAllowance = $('[name="positional_allowance"]').val();
    var transportationAllowance = $('[name="pension_allowance"]').val();
    var mealAllowance = $('[name="bpjs_allowance"]').val();
    var internetPhoneAllowance = $('[name="bpjs_tenaga_kerja_allowance"]').val();
    var thp = parseInt(basicSalary) + parseInt(positionalAllowance) + parseInt(transportationAllowance) + parseInt(mealAllowance) + parseInt(internetPhoneAllowance);

    $('[name="hid_thp"]').val(thp).unmask().mask("000.000.000", { reverse: true });
    $(".text-thp").html($('[name="hid_thp"]').val());
}

$("#basic_salary").on("keyup", function () {
    $('[name="basic_salary"]').val($("#basic_salary").cleanVal());
    setTHP();
});
$("#positional_allowance").on("keyup", function () {
    $('[name="positional_allowance"]').val($("#positional_allowance").cleanVal());
    setTHP();
});
$("#pension_allowance").on("keyup", function () {
    $('[name="pension_allowance"]').val($("#pension_allowance").cleanVal());
    setTHP();
});
$("#bpjs_allowance").on("keyup", function () {
    $('[name="bpjs_allowance"]').val($("#bpjs_allowance").cleanVal());
    setTHP();
});
$("#bpjs_tenaga_kerja_allowance").on("keyup", function () {
    $('[name="bpjs_tenaga_kerja_allowance"]').val($("#bpjs_tenaga_kerja_allowance").cleanVal());
    setTHP();
});
