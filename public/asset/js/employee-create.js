var appUrl = $('meta[name="app-url"]').attr("content");

document.addEventListener("DOMContentLoaded", function () {
    // --- DYNAMIC DROPDOWN LOGIC ---
    const departmentSelect = document.getElementById("department_id");

    // Function to show floating alert with SVG icon
    function showFloatingAlert(message, type = "success") {
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type} d-flex align-items-center employee-create-alert`;
        alertDiv.setAttribute("role", "alert");
        alertDiv.style.opacity = "1";
        alertDiv.style.position = "fixed";
        alertDiv.style.bottom = "20px";
        alertDiv.style.right = "20px";
        alertDiv.style.zIndex = "9999";
        alertDiv.style.minWidth = "300px";
        alertDiv.style.margin = "0";
        alertDiv.style.borderRadius = "8px";
        alertDiv.style.padding = "10px 20px";

        let iconId = "";
        if (type === "success") {
            iconId = "check-circle-fill";
        } else if (type === "danger") {
            iconId = "exclamation-triangle-fill";
        } else {
            iconId = "info-fill";
        }

        alertDiv.innerHTML = `
            <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="${type.charAt(0).toUpperCase() + type.slice(1)}:">
                <use xlink:href="#${iconId}"/>
            </svg>
            <div>
                ${message}
            </div>
        `;

        document.body.appendChild(alertDiv);

        // After 1.5 seconds, fade out alert
        setTimeout(() => {
            alertDiv.style.opacity = "0";
            setTimeout(() => {
                alertDiv.remove();
            }, 500);
        }, 1500);
    }
    const divisionSelect = document.getElementById("division_id");
    const jobSelect = document.getElementById("job_id");

    // Load departments on page load
    function loadDepartments() {
        $.ajax({
            url: appUrl + "/department/index",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Department</option>';
                (data.data || []).forEach((dept) => {
                    options += `<option value="${dept.id}">${
                        dept.name_department || dept.name
                    }</option>`;
                });
                departmentSelect.innerHTML = options;
            },
            error: function () {
                alert("Failed to load departments.");
            },
        });
    }

    // Load divisions when department changes
    function loadDivisions(departmentId) {
        divisionSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/division/index",
            type: "GET",
            data: { department_id: departmentId },
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Division</option>';
                (data.data || []).forEach((div) => {
                    options += `<option value="${div.id}">${
                        div.name_division || div.name
                    }</option>`;
                });
                divisionSelect.innerHTML = options;
                jobSelect.innerHTML =
                    '<option value="" disabled selected>Select Job</option>';
            },
            error: function () {
                alert("Failed to load divisions.");
            },
        });
    }

    // Load jobs when division changes
    function loadJobs(divisionId) {
        jobSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/job/index",
            type: "GET",
            data: { division_id: divisionId },
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Job</option>';
                (data.data || []).forEach((job) => {
                    options += `<option value="${job.id}">${
                        job.job_name || job.name
                    }</option>`;
                });
                jobSelect.innerHTML = options;
            },
            error: function () {
                alert("Failed to load jobs.");
            },
        });
    }

    if (departmentSelect && divisionSelect && jobSelect) {
        loadDepartments();

        departmentSelect.addEventListener("change", function () {
            const deptId = this.value;
            if (deptId) {
                loadDivisions(deptId);
            } else {
                divisionSelect.innerHTML =
                    '<option value="" disabled selected>Select Division</option>';
                jobSelect.innerHTML =
                    '<option value="" disabled selected>Select Job</option>';
            }
        });

        divisionSelect.addEventListener("change", function () {
            const divId = this.value;
            if (divId) {
                loadJobs(divId);
            } else {
                jobSelect.innerHTML =
                    '<option value="" disabled selected>Select Job</option>';
            }
        });
    }

    // New code to auto-fill email_work based on employee_name
    const employeeNameInput = document.getElementById("employee_name");
    const employeeEmailWorkInput = document.getElementById("employee_email_work");

    if (employeeNameInput && employeeEmailWorkInput) {
        employeeNameInput.addEventListener("input", function () {
            const fullName = employeeNameInput.value.trim();
            if (fullName.length > 0) {
                // Only auto-fill if email_work is empty or matches previous auto-fill pattern
                const currentEmailWork = employeeEmailWorkInput.value.trim();
                const generatedEmailWork = fullName.replace(/\s+/g, "_").toLowerCase() + "@nsaperformance.id";
                if (currentEmailWork === "" || currentEmailWork === employeeEmailWorkInput.getAttribute("data-auto-filled")) {
                    employeeEmailWorkInput.value = generatedEmailWork;
                    employeeEmailWorkInput.setAttribute("data-auto-filled", generatedEmailWork);
                }
                employeeEmailWorkInput.readOnly = false; // allow editing
                employeeEmailWorkInput.removeAttribute("disabled");
            } else {
                employeeEmailWorkInput.value = "";
                employeeEmailWorkInput.readOnly = false;
                employeeEmailWorkInput.removeAttribute("disabled");
                employeeEmailWorkInput.removeAttribute("data-auto-filled");
            }
        });

        // Remove data-auto-filled attribute if user manually edits email_work
        employeeEmailWorkInput.addEventListener("input", function () {
            employeeEmailWorkInput.removeAttribute("data-auto-filled");
        });
    }

    function setupImageInput(inputId, labelSelector, clearBtnId) {
        const input = document.getElementById(inputId);
        const label = document.querySelector(labelSelector);
        const clearBtn = clearBtnId ? document.getElementById(clearBtnId) : null;

        if (!input || !label) return;

        input.addEventListener("change", function () {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    label.style.backgroundImage = `url('${e.target.result}')`;
                    label.classList.add("has-image");
                    label.style.backgroundSize = "cover";
                    label.style.opacity = "1";
                    if (clearBtn) clearBtn.classList.remove("d-none");
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                label.style.backgroundImage = "";
                label.classList.remove("has-image");
                label.style.opacity = "0.5";
                if (clearBtn) clearBtn.classList.add("d-none");
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener("click", function (e) {
                e.preventDefault();
                input.value = "";
                label.style.backgroundImage = "";
                label.classList.remove("has-image");
                label.style.opacity = "0.5";
                label.classList.remove("is-valid");
                label.classList.remove("is-invalid");
                clearBtn.classList.add("d-none");
            });
        }
    }

    // AJAX form submission for employee create form
    const employeeCreateForm = document.getElementById("employeeCreateForm");
    const formAlert = document.getElementById("formAlert");

    if (employeeCreateForm) {
        const photoLabel = document.querySelector('label[for="photo"]');
        employeeCreateForm.addEventListener("submit", function (e) {
            // Bootstrap validation
            if (!employeeCreateForm.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                employeeCreateForm.classList.add("was-validated");
                return;
            }
            employeeCreateForm.classList.remove("was-validated");

            e.preventDefault();

            const employeeCreateLoader = document.getElementById("employeeCreateLoader");
            formAlert.innerHTML = "";
            // Show loader
            if (employeeCreateLoader) employeeCreateLoader.classList.remove("d-none");

            const formData = new FormData(employeeCreateForm);

            // Map form field names to controller expected names
            formData.set("name", formData.get("employee_name"));
            formData.delete("employee_name");
            formData.set("email", formData.get("employee_email"));
            formData.delete("employee_email");
            formData.set("email_work", formData.get("employee_email_work"));
            formData.delete("employee_email_work");
            formData.set("phone", formData.get("employee_phone"));
            formData.delete("employee_phone");
            formData.set("address", formData.get("address"));
            formData.set("birth_date", formData.get("birth_date"));
            formData.set("hire_date", formData.get("hire_date"));
            formData.set("grade", formData.get("grade"));
            formData.set("office", formData.get("office"));
            formData.set("department_id", formData.get("department_id"));
            formData.set("division_id", formData.get("division_id"));
            formData.set("job_id", formData.get("job_id"));
            formData.set("time_start", formData.get("time_start"));
            formData.set("time_end", formData.get("time_end"));

            // Handle date_shift as single array
            const dateShiftInput = document.getElementById('date_shift');
            if (dateShiftInput && dateShiftInput.value) {
                try {
                    const dates = JSON.parse(dateShiftInput.value);
                    formData.append('date_shift', JSON.stringify(dates));
                } catch (e) {
                    console.error('Error parsing date_shift:', e);
                }
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
                    // Hide loader
                    if (employeeCreateLoader) employeeCreateLoader.classList.add("d-none");

                // Show success floating alert
                showFloatingAlert("Employee created successfully!", "success");

                if (response.redirect_url) {
                    // Redirect after showing alert
                    setTimeout(() => {
                        window.location.href = response.redirect_url;
                    }, 2000);
                    employeeCreateForm.reset();
                    return;
                }

                // Hide alert after 3 seconds
                setTimeout(() => {
                    const alertDiv = document.querySelector(".employee-create-alert");
                    if (alertDiv) {
                        alertDiv.style.opacity = "0";
                        setTimeout(() => {
                            alertDiv.remove();
                        }, 500);
                    }
                }, 3000);
                employeeCreateForm.reset();

                // Remove validation classes from inputs and labels
                const inputs = employeeCreateForm.querySelectorAll("input, select, textarea");
                inputs.forEach((input) => {
                    input.classList.remove("is-valid", "is-invalid");
                });
                const labels = employeeCreateForm.querySelectorAll("label");
                labels.forEach((label) => {
                    label.classList.remove("is-valid", "is-invalid");
                });
                employeeCreateForm.classList.remove("was-validated");

                // Reset image previews
                ["photo", "ktp", "profile_picture"].forEach((id) => {
                    const input = document.getElementById(id);
                    if (input) input.value = "";
                    const label = document.querySelector(
                        `label[for="${id}"]`
                    );
                    if (label) {
                        label.style.backgroundImage = "";
                        label.classList.remove("has-image", "is-valid", "is-invalid");
                        label.style.opacity = "0.5";
                    }
                    const clearBtn = document.getElementById(
                        id === "photo"
                            ? "photoClearBtn"
                            : id === "ktp"
                            ? "ktpClearBtn"
                            : id + "ClearBtn"
                    );

                    if (clearBtn) clearBtn.classList.add("d-none");
                });
                },
                error: function (xhr) {
                    // Hide loader
                    if (employeeCreateLoader) employeeCreateLoader.classList.add("d-none");

                    if (xhr.status === 422) {
                        // Validation errors
                        let errorsHtml = '<div class="alert alert-danger"><ul>';
                        const errors = xhr.responseJSON.errors;
                        for (const key in errors) {
                            errors[key].forEach((msg) => {
                                errorsHtml += `<li>${msg}</li>`;
                            });
                        }
                        errorsHtml += "</ul></div>";
                        formAlert.innerHTML = errorsHtml;
                    } else {
                        formAlert.innerHTML =
                            '<div class="alert alert-danger">Failed to create employee.</div>';
                    }
                },
            });
        });

        // Add input/change event listeners for validation classes
        const inputs = employeeCreateForm.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
            input.addEventListener("input", () => {
                if (input.id === "photo" || input.id === "ktp") {
                    if (input.checkValidity()) {
                        input.classList.remove("is-invalid");
                        input.classList.add("is-valid");
                        if (photoLabel) {
                            photoLabel.classList.remove("is-invalid");
                            photoLabel.classList.add("is-valid");
                        }
                    } else {
                        input.classList.remove("is-valid");
                        input.classList.add("is-invalid");
                        if (photoLabel) {
                            photoLabel.classList.add("is-invalid");
                            photoLabel.classList.remove("is-valid");
                        }
                    }
                } else {
                    if (input.checkValidity()) {
                        input.classList.remove("is-invalid");
                        input.classList.add("is-valid");
                    } else {
                        input.classList.remove("is-valid");
                        input.classList.add("is-invalid");
                    }
                }
                employeeCreateForm.classList.remove("was-validated");
            });
            input.addEventListener("change", () => {
                if (input.id === "photo" || input.id === "ktp") {
                    if (input.checkValidity()) {
                        input.classList.remove("is-invalid");
                        input.classList.add("is-valid");
                        if (photoLabel) {
                            photoLabel.classList.remove("is-invalid");
                            photoLabel.classList.add("is-valid");
                        }
                    } else {
                        input.classList.remove("is-valid");
                        input.classList.add("is-invalid");
                        if (photoLabel) {
                            photoLabel.classList.add("is-invalid");
                            photoLabel.classList.remove("is-valid");
                        }
                    }
                } else {
                    if (input.checkValidity()) {
                        input.classList.remove("is-invalid");
                        input.classList.add("is-valid");
                    } else {
                        input.classList.remove("is-valid");
                        input.classList.add("is-invalid");
                    }
                }
                employeeCreateForm.classList.remove("was-validated");
            });
        });
    }

    setupImageInput(
        "photo",
        'label[for="photo"]',
        "photoClearBtn"
    );

    setupImageInput(
        "ktp",
        'label[for="ktp"]',
        "ktpClearBtn"
    );

    // Setup multiple date picker for shift dates
    let selectedDates = [];
    
    function initializeDatePicker() {
        const dateDisplay = document.getElementById('date_shift_display');
        const dateInput = document.getElementById('date_shift');
        
        if (!dateDisplay || !dateInput) return;

        // Create datepicker container
        const datepickerContainer = document.createElement('div');
        datepickerContainer.id = 'shift-datepicker';
        datepickerContainer.className = 'datepicker-container';
        datepickerContainer.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            padding: 10px;
            z-index: 1000;
            display: none;
            max-width: 300px;
        `;
        
        dateDisplay.parentNode.style.position = 'relative';
        dateDisplay.parentNode.appendChild(datepickerContainer);

        // Create calendar
        const calendar = document.createElement('div');
        calendar.className = 'calendar-grid';
        calendar.style.cssText = `
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            font-size: 12px;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = 'grid-column: span 7; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
        header.innerHTML = `
            <button type="button" class="btn-prev-month" style="border: none; background: none; cursor: pointer;"><</button>
            <span class="month-year"></span>
            <button type="button" class="btn-next-month" style="border: none; background: none; cursor: pointer;">></button>
        `;
        
        // Weekday headers
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.textContent = day;
            dayHeader.style.cssText = 'text-align: center; font-weight: bold; padding: 5px;';
            calendar.appendChild(dayHeader);
        });
        
        datepickerContainer.appendChild(header);
        datepickerContainer.appendChild(calendar);

        let currentDate = new Date();
        
        function renderCalendar() {
            calendar.innerHTML = '';
            weekdays.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.textContent = day;
                dayHeader.style.cssText = 'text-align: center; font-weight: bold; padding: 5px;';
                calendar.appendChild(dayHeader);
            });

            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            header.querySelector('.month-year').textContent = 
                currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.textContent = date.getDate();
                dayElement.style.cssText = `
                    text-align: center;
                    padding: 8px;
                    cursor: pointer;
                    border-radius: 4px;
                    ${date.getMonth() !== currentDate.getMonth() ? 'color: #ccc;' : ''}
                    ${selectedDates.some(d => d.toDateString() === date.toDateString()) ? 'background: #007bff; color: white;' : ''}
                `;
                
                dayElement.addEventListener('click', () => toggleDate(date));
                calendar.appendChild(dayElement);
            }
        }

        function toggleDate(date) {
            const index = selectedDates.findIndex(d => d.toDateString() === date.toDateString());
            if (index > -1) {
                selectedDates.splice(index, 1);
            } else {
                selectedDates.push(new Date(date));
            }
            updateDisplay();
            renderCalendar();
        }

        function updateDisplay() {
            selectedDates.sort((a, b) => a - b);
            const dateStrings = selectedDates.map(d => d.toISOString().split('T')[0]);
            dateDisplay.value = selectedDates.length > 0 
                ? selectedDates.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')
                : '';
            
            // Update hidden input with array of dates in format [Aug 12, Aug 22, Aug 13]
            const formattedDates = selectedDates.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            dateInput.value = JSON.stringify(formattedDates);
        }

        // Event listeners
        dateDisplay.addEventListener('click', () => {
            datepickerContainer.style.display = datepickerContainer.style.display === 'none' ? 'block' : 'none';
            renderCalendar();
        });

        header.querySelector('.btn-prev-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        header.querySelector('.btn-next-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        // Close datepicker when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#shift-datepicker') && e.target !== dateDisplay) {
                datepickerContainer.style.display = 'none';
            }
        });

        renderCalendar();
    }

    // Initialize date picker
    initializeDatePicker();
});
