var appUrl = $('meta[name="app-url"]').attr("content");
var regionsUrl = appUrl + "/employee/regions";
var dropdownText = window.dropdownTranslations || {};
var dropdownLabel = function (key, fallback) {
    return dropdownText[key] || fallback;
};

$(function () {
    var $partnerSelect = $("#department_id");
    var $businessDepartmentSelect = $("#business_department_id");
    var $partnerOfficeSelect = $("#partner_office_id");
    var $regionSelect = $("#region");
    var $divisionSelect = $("#division_id");
    var $jobSelect = $("#job_id");
    var $shiftSelect = $("#shift_id");
    var $shiftTimeHint = $("#shift_time_hint");

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

    function isSuperadminName(name) {
        return /superadmin/i.test(String(name || ""));
    }

    function isAdminDummyName(name) {
        return /^ADMIN\s+.+\s+(PARTNER|SITE|DIVISION|JOB)$/i.test(String(name || "").trim());
    }

    function loadBusinessDepartments() {
        if (!$businessDepartmentSelect.length) return;
        var currentId = $businessDepartmentSelect.attr("data-current") || "";
        var locked = $businessDepartmentSelect.attr("data-locked") === "1";

        $.ajax({
            url: appUrl + "/department/index",
            type: "GET",
            dataType: "json",
            success: function (data) {
                var options = '<option value="" disabled selected>' + dropdownLabel("select_department", "Select Department") + '</option>';
                (data.data || [])
                    .filter(function (dept) {
                        return !isSuperadminName(dept.name_department || dept.name);
                    })
                    .forEach(function (dept) {
                        var selected = currentId && String(currentId) === String(dept.id) ? "selected" : "";
                        options += '<option value="' + dept.id + '" ' + selected + ">" + (dept.name_department || dept.name) + "</option>";
                    });
                $businessDepartmentSelect.html(options);
                if (currentId) {
                    $businessDepartmentSelect.val(String(currentId));
                }
                $businessDepartmentSelect.prop("disabled", locked);
                loadRegions();
                loadPartners();
                loadDivisionsByDepartment();
                loadJobsByDepartment();
            },
            error: function () {
                showFloatingAlert("Failed to load departments.", "warning", 3000);
            },
        });
    }

    function loadRegions(selectedRegion) {
        if (!$regionSelect.length) return;
        var departmentId = $businessDepartmentSelect.val();

        if (!departmentId) {
            $regionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_department_first", "Select Department First") + '</option>');
            $regionSelect.prop("disabled", true);
            return;
        }

        $regionSelect.html('<option value="" disabled selected>Loading...</option>');
        $regionSelect.prop("disabled", true);

        $.ajax({
            url: regionsUrl,
            type: "GET",
            data: {
                business_department_id: departmentId,
            },
            dataType: "json",
            success: function (data) {
                var options = '<option value="" disabled selected>' + dropdownLabel("select_region", "Select Region") + '</option>';
                (data.data || []).forEach(function (region) {
                    var selected = selectedRegion && String(selectedRegion) === String(region) ? "selected" : "";
                    options += '<option value="' + region + '" ' + selected + ">" + region + "</option>";
                });
                $regionSelect.html(options);
                $regionSelect.prop("disabled", false);
                if (selectedRegion) {
                    $regionSelect.val(String(selectedRegion));
                }
            },
            error: function () {
                $regionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_region", "Select Region") + '</option>');
                $regionSelect.prop("disabled", false);
                showFloatingAlert("Failed to load regions.", "warning", 3000);
            },
        });
    }

    function loadPartners() {
        if (!$partnerSelect.length) return;
        var selectedDepartmentId = $businessDepartmentSelect.val();
        var selectedOfficeId = $partnerOfficeSelect.val();
        var selectedRegion = $regionSelect.length ? $regionSelect.val() : "";

        $.ajax({
            url: appUrl + "/partner/index",
            type: "GET",
            data: {
                department_id: selectedDepartmentId || undefined,
                office_id: selectedOfficeId || undefined,
                region: selectedRegion || undefined,
            },
            dataType: "json",
            success: function (data) {
                var options = '<option value="" disabled selected>' + dropdownLabel("select_partner", "Select Partner") + '</option>';
                (data.data || [])
                    .filter(function (dept) {
                        var name = dept.name_department || dept.name;
                        return !isSuperadminName(name) && !isAdminDummyName(name);
                    })
                    .forEach(function (dept) {
                        options += '<option value="' + dept.id + '">' + (dept.name_department || dept.name) + "</option>";
                    });
                $partnerSelect.html(options);
            },
            error: function () {
                showFloatingAlert("Failed to load partners.", "warning", 3000);
            },
        });
    }

    function loadDivisionsByDepartment(selectedDivisionId) {
        selectedDivisionId = selectedDivisionId || "";
        var departmentId = $businessDepartmentSelect.val() || "";
        var partnerId = $partnerSelect.val() || "";
        var region = $regionSelect.length ? $regionSelect.val() || "" : "";
        var adminDivisionId = String($businessDepartmentSelect.data("admin-division") || "");
        var isAdmin = $businessDepartmentSelect.data("locked") === "1" || $businessDepartmentSelect.data("locked") === 1;

        $divisionSelect.html('<option value="" disabled selected>Loading...</option>');

        if (!departmentId) {
            $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_department", "Select Department") + '</option>');
            $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
            return;
        }

        if (!partnerId) {
            $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_partner", "Select Partner") + '</option>');
            $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
            return;
        }

        $.ajax({
            url: appUrl + "/division/index",
            type: "GET",
            data: {
                business_department_id: departmentId,
                partner_id: partnerId,
                region: region || undefined,
                status: "ACTIVE",
            },
            dataType: "json",
            success: function (data) {
                var options = '<option value="" disabled selected>' + dropdownLabel("select_site", "Select Site") + '</option>';
                var divisions = data.data || [];

                divisions
                    .filter(function (division) {
                        var divisionName = division.name_division || division.name || "";
                        var isAdminDivision = isAdmin && adminDivisionId && String(division.id) === adminDivisionId;
                        return !isSuperadminName(divisionName) && !isAdminDummyName(divisionName) && !isAdminDivision;
                    })
                    .forEach(function (division) {
                        var divisionName = division.name_division || division.name || "";
                        var selected = selectedDivisionId && String(selectedDivisionId) === String(division.id) ? "selected" : "";
                        options += '<option value="' + division.id + '" ' + selected + ">" + divisionName + "</option>";
                    });

                $divisionSelect.html(options);

                var selectedDivisionExists = $divisionSelect.find('option[value="' + selectedDivisionId + '"]').length > 0;
                if (selectedDivisionExists) {
                    $divisionSelect.val(String(selectedDivisionId));
                }

                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
                loadJobsByDepartment();
            },
            error: function () {
                $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_site", "Select Site") + '</option>');
                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
                showFloatingAlert("Failed to load sites.", "warning", 3000);
            },
        });
    }

    function loadJobsByDepartment(selectedJobId) {
        selectedJobId = selectedJobId || "";
        var departmentId = $businessDepartmentSelect.val() || "";
        var partnerId = $partnerSelect.val() || "";
        var divisionId = $divisionSelect.val() || "";
        var region = $regionSelect.length ? $regionSelect.val() || "" : "";
        var adminJobId = String($businessDepartmentSelect.data("admin-job") || "");
        var isAdmin = $businessDepartmentSelect.data("locked") === "1" || $businessDepartmentSelect.data("locked") === 1;

        $jobSelect.html('<option value="" disabled selected>Loading...</option>');

        if (!departmentId || !partnerId || !divisionId) {
            $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
            return;
        }

        $.ajax({
            url: appUrl + "/job/index",
            type: "GET",
            data: {
                business_department_id: departmentId,
                partner_id: partnerId,
                division_id: divisionId,
                region: region || undefined,
                status: "ACTIVE",
            },
            dataType: "json",
            success: function (data) {
                var options = '<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>';
                (data.data || [])
                    .filter(function (job) {
                        var name = job.job_name || job.name;
                        var isAdminJob = isAdmin && adminJobId && String(job.id) === adminJobId;
                        return !isSuperadminName(name) && !isAdminDummyName(name) && !isAdminJob;
                    })
                    .forEach(function (job) {
                        var selected = selectedJobId && String(selectedJobId) === String(job.id) ? "selected" : "";
                        options += '<option value="' + job.id + '" ' + selected + ">" + (job.job_name || job.name) + "</option>";
                    });
                $jobSelect.html(options);
                if (selectedJobId) {
                    $jobSelect.val(String(selectedJobId));
                }
            },
            error: function () {
                showFloatingAlert("Failed to load jobs.", "warning", 3000);
            },
        });
    }

    if ($partnerSelect.length && $divisionSelect.length && $jobSelect.length) {
        loadBusinessDepartments();

        $partnerSelect.on("change", function () {
            loadDivisionsByDepartment();
            $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
        });

        if ($businessDepartmentSelect.length) {
            $businessDepartmentSelect.on("change", function () {
                loadRegions();
                loadPartners();
                $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_site", "Select Site") + '</option>');
                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
            });
        }

        if ($regionSelect.length) {
            $regionSelect.on("change", function () {
                loadPartners();
                $divisionSelect.html('<option value="" disabled selected>' + dropdownLabel("select_site", "Select Site") + '</option>');
                $jobSelect.html('<option value="" disabled selected>' + dropdownLabel("select_job", "Select Job") + '</option>');
            });
        }

        if ($partnerOfficeSelect.length) {
            $partnerOfficeSelect.on("change", function () {
                loadPartners();
            });
        }

        $divisionSelect.on("change", function () {
            loadJobsByDepartment();
        });
    }

    function loadShifts() {
        if (!$shiftSelect.length) return;
        var shiftsUrl = $shiftSelect.attr("data-fetch-url") || (appUrl ? appUrl + "/shift/list" : "/shift/list");

        $.ajax({
            url: shiftsUrl,
            type: "GET",
            dataType: "json",
            success: function (resp) {
                var data = resp.data || [];
                var options = '<option value="" disabled selected>Select Shift</option>';
                data.forEach(function (s) {
                    var start = (s.time_start || "").slice(0, 5) || "--:--";
                    var end = (s.time_end || "").slice(0, 5) || "--:--";
                    var title = s.title || "Shift " + start + "-" + end;
                    options += '<option value="' + s.id + '" data-start="' + start + '" data-end="' + end + '">' + title + " (" + start + " - " + end + ")</option>";
                });
                $shiftSelect.html(options);
            },
            error: function () {
                showFloatingAlert("Gagal memuat data shift. Coba refresh halaman.", "warning", 3500);
            },
        });
    }

    if ($shiftSelect.length) {
        loadShifts();
        $shiftSelect.on("change", function () {
            var $opt = $(this).find("option:selected");
            var start = $opt.attr("data-start");
            var end = $opt.attr("data-end");
            if ($shiftTimeHint.length) $shiftTimeHint.text(start + " - " + end);
        });
    }

    var $employeeNameInput = $("#employee_name");
    var $employeeEmailWorkInput = $("#employee_email_work");

    if ($employeeNameInput.length && $employeeEmailWorkInput.length) {
        $employeeNameInput.on("input", function () {
            var fullName = $employeeNameInput.val().trim();
            if (fullName.length > 0) {
                var currentEmailWork = $employeeEmailWorkInput.val().trim();
                var generatedEmailWork = fullName.replace(/\s+/g, "_").toLowerCase() + "@office.id";
                if (currentEmailWork === "" || currentEmailWork === $employeeEmailWorkInput.attr("data-auto-filled")) {
                    $employeeEmailWorkInput.val(generatedEmailWork);
                    $employeeEmailWorkInput.attr("data-auto-filled", generatedEmailWork);
                }
                $employeeEmailWorkInput.prop("readOnly", false).removeAttr("disabled");
            } else {
                $employeeEmailWorkInput.val("").prop("readOnly", false).removeAttr("disabled").removeAttr("data-auto-filled");
            }
        });

        $employeeEmailWorkInput.on("input", function () {
            $employeeEmailWorkInput.removeAttr("data-auto-filled");
        });
    }

    function setupImageInput(inputId, labelSelector, clearBtnId) {
        var $input = $("#" + inputId);
        var $label = $(labelSelector);
        var $clearBtn = clearBtnId ? $("#" + clearBtnId) : $();

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
                    $label.css("background-image", "url('" + e.target.result + "')").addClass("has-image").css({ "background-size": "cover", opacity: "1" });
                    if ($clearBtn.length) $clearBtn.removeClass("d-none");
                };
                reader.readAsDataURL(files[0]);
            } else {
                $label.css("background-image", "").removeClass("has-image").css("opacity", "0.5");
                if ($clearBtn.length) $clearBtn.addClass("d-none");
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

    var $employeeCreateForm = $("#employeeCreateForm");
    var $formAlert = $("#formAlert");

    if ($employeeCreateForm.length) {
        var $photoLabel = $('label[for="photo"]');

        $employeeCreateForm.on("submit", function (e) {
            var formEl = $employeeCreateForm.get(0);

            if (!formEl.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                $employeeCreateForm.addClass("was-validated");
                return;
            }
            $employeeCreateForm.removeClass("was-validated");

            e.preventDefault();

            var $employeeCreateLoader = $("#employeeCreateLoader");
            $formAlert.html("");
            if ($employeeCreateLoader.length) $employeeCreateLoader.removeClass("d-none");

            var formData = new FormData(formEl);

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
            formData.set("address", formData.get("address"));
            formData.set("birth_date", formData.get("birth_date"));
            formData.set("hire_date", formData.get("hire_date"));
            formData.set("grade_id", formData.get("grade_id"));
            formData.delete("grade");
            formData.set("office", formData.get("office"));
            formData.set("department_id", formData.get("department_id"));
            formData.set("division_id", formData.get("division_id"));
            formData.set("job_id", formData.get("job_id"));
            if (formData.get("region")) {
                formData.set("region", formData.get("region"));
            }
            if (formData.get("shift_id")) {
                formData.set("shift_id", formData.get("shift_id"));
            }

            $.ajax({
                url: appUrl + "/employee",
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                headers: {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
                    Accept: "application/json",
                },
                success: function (response) {
                    if ($employeeCreateLoader.length) $employeeCreateLoader.addClass("d-none");

                    showFloatingAlert("Employee created successfully!", "success");

                    if (response.redirect_url) {
                        setTimeout(function () {
                            window.location.href = response.redirect_url;
                        }, 2000);
                        formEl.reset();
                        return;
                    }

                    formEl.reset();

                    $employeeCreateForm.find("input, select, textarea").removeClass("is-valid is-invalid");
                    $employeeCreateForm.find("label").removeClass("is-valid is-invalid");
                    $employeeCreateForm.removeClass("was-validated");

                    ["photo", "ktp", "profile_picture"].forEach(function (id) {
                        var $input = $("#" + id);
                        if ($input.length) $input.val("");
                        var $label = $('label[for="' + id + '"]');
                        if ($label.length) {
                            $label.css("background-image", "").removeClass("has-image is-valid is-invalid").css("opacity", "0.5");
                        }
                        var clearBtnId = id === "photo" ? "photoClearBtn" : id === "ktp" ? "ktpClearBtn" : id + "ClearBtn";
                        var $clearBtn = $("#" + clearBtnId);
                        if ($clearBtn.length) $clearBtn.addClass("d-none");
                    });
                },
                error: function (xhr) {
                    if ($employeeCreateLoader.length) $employeeCreateLoader.addClass("d-none");

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
                        var msg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Failed to create employee.";
                        if ($formAlert.length) $formAlert.html("");
                        showFloatingAlert(msg, "warning", 4000);
                    }
                },
            });
        });

        var $inputs = $employeeCreateForm.find("input, select, textarea");

        function validateField($input) {
            var el = $input.get(0);
            if ($input.attr("id") === "photo" || $input.attr("id") === "ktp") {
                if (el.checkValidity()) {
                    $input.removeClass("is-invalid").addClass("is-valid");
                    if ($photoLabel.length) $photoLabel.removeClass("is-invalid").addClass("is-valid");
                } else {
                    $input.removeClass("is-valid").addClass("is-invalid");
                    if ($photoLabel.length) $photoLabel.addClass("is-invalid").removeClass("is-valid");
                }
            } else {
                if (el.checkValidity()) {
                    $input.removeClass("is-invalid").addClass("is-valid");
                } else {
                    $input.removeClass("is-valid").addClass("is-invalid");
                }
            }
            $employeeCreateForm.removeClass("was-validated");
        }

        $inputs.on("input", function () {
            validateField($(this));
        });
        $inputs.on("change", function () {
            validateField($(this));
        });
    }

    setupImageInput("photo", 'label[for="photo"]', "photoClearBtn");
    setupImageInput("ktp", 'label[for="ktp"]', "ktpClearBtn");

    $("#basic_salary,#positional_allowance,#bpjs_allowance,#bpjs_tenaga_kerja_allowance,#pension_allowance").mask("000.000.000", { reverse: true });
    $('[name="hid_thp"]').mask("000.000.000", { reverse: true });
    $(".text-thp").html($('[name="hid_thp"]').val());

    function setTHP() {
        var basicSalary = $('[name="basic_salary"]').val();
        var positionalAllowance = $('[name="positional_allowance"]').val();
        var transportationAllowance = $('[name="bpjs_allowance"]').val();
        var mealAllowance = $('[name="bpjs_tenaga_kerja_allowance"]').val();
        var internetPhoneAllowance = $('[name="pension_allowance"]').val();
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
    $("#bpjs_allowance").on("keyup", function () {
        $('[name="bpjs_allowance"]').val($("#bpjs_allowance").cleanVal());
        setTHP();
    });
    $("#bpjs_tenaga_kerja_allowance").on("keyup", function () {
        $('[name="bpjs_tenaga_kerja_allowance"]').val($("#bpjs_tenaga_kerja_allowance").cleanVal());
        setTHP();
    });
    $("#pension_allowance").on("keyup", function () {
        $('[name="pension_allowance"]').val($("#pension_allowance").cleanVal());
        setTHP();
    });

    $("#cv").on("change", function () {
        var file = this.files[0];
        $("#cvFileName").val(file ? file.name : "");
    });

    $("#pkwt").on("change", function () {
        var file = this.files[0];
        $("#pkwtFileName").val(file ? file.name : "");
    });
});
