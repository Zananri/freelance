// Attendance JavaScript
const baseUrl = $('meta[name="app-url"]').attr("content");

$(document).ready(function () {
    initializeAttendance();
    initializeCalendar();

    $(".btn-custom-check").on("click", function () {
        let checkBtnActive = $(this).attr("data-check-active");

        if (checkBtnActive === "checkIn") {
            openCheckInModal();
        } else if (checkBtnActive === "checkOut") {
            openCheckOutModal();
        }
    });

    const submitCheckInBtn = document.getElementById("submitCheckInBtn");
    if (submitCheckInBtn) {
        submitCheckInBtn.addEventListener("click", function () {
            if (localStorage.getItem("checkInDone") === "true") {
                $("#checkInBtn .check-icon").show();
                $("#checkInBtn").addClass("active");
            }

            submitCheckIn();
        });
    }

    const submitCheckOutBtn = document.getElementById("submitCheckOutBtn");
    if (submitCheckOutBtn) {
        submitCheckOutBtn.addEventListener("click", function () {
            if (localStorage.getItem("checkOutDone") === "true") {
                $("#checkOutBtn .done-all-icon").show();
                $("#checkOutBtn").addClass("active");
            }

            submitCheckOut();
        });
    }
});

function openCheckInModal() {
    fetch(baseUrl + "/server-time")
        .then((response) => response.json())
        .then((data) => {
            const timeString = data.time;
            const formattedDate = data.formatted_date;
            const dateString = data.date;

            // Update tampilan modal
            document.getElementById("date_attendance").textContent =
                formattedDate;
            document.getElementById("time_in").textContent = timeString;

            // Hapus input hidden lama
            document
                .querySelectorAll(
                    'input[name="date_attendance"], input[name="time_in"]'
                )
                .forEach((el) => el.remove());

            // Tambahkan input hidden baru
            const hiddenDate = document.createElement("input");
            hiddenDate.type = "hidden";
            hiddenDate.name = "date_attendance";
            hiddenDate.value = dateString;
            document.getElementById("checkInForm").appendChild(hiddenDate);

            const hiddenTime = document.createElement("input");
            hiddenTime.type = "hidden";
            hiddenTime.name = "time_in";
            hiddenTime.value = timeString;
            document.getElementById("checkInForm").appendChild(hiddenTime);

            // Tampilkan modal
            const modal = new bootstrap.Modal(
                document.getElementById("checkInModal")
            );
            modal.show();
        })
        .catch((error) => {
            console.error("Gagal ambil waktu server:", error);
        });
}

let stream = null;
let capturedImage = null;

document.addEventListener("DOMContentLoaded", () => {
    function initializeCameraFeatures() {
        const cameraLabel = document.querySelector(".camera-label");
        const clearImageBtn = document.getElementById("clearImageBtn");
        const imageInput = document.getElementById("imageInput");
        const captureBtn = document.getElementById("captureBtn");

        if (cameraLabel) {
            cameraLabel.addEventListener("click", (e) => {
                e.preventDefault();
                startCamera();
            });
        }

        if (clearImageBtn) {
            clearImageBtn.addEventListener("click", clearImage);
        }

        if (imageInput) {
            imageInput.addEventListener("change", handleImagePreview);
        }

        if (captureBtn) {
            captureBtn.addEventListener("click", capturePhoto);
        }
    }

    initializeCameraFeatures();
});

function startCamera() {
    const video = document.getElementById("cameraVideo");
    const cameraWrapper = document.getElementById("cameraWrapper");
    const modalBody = document.querySelector(".modal-body");
    const modalFooter = document.querySelector(".modal-footer");

    if (stream) return;

    navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then((mediaStream) => {
            stream = mediaStream;
            video.srcObject = mediaStream;
            video.onloadedmetadata = () => video.play();

            cameraWrapper.classList.remove("d-none");
            modalBody.classList.add("d-none");
            modalFooter.classList.add("d-none");
        })
        .catch((err) => {
            console.error("Cannot access camera:", err);
            alert("Cannot access camera on this device.");
        });
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cameraCanvas");
    const cameraWrapper = document.getElementById("cameraWrapper");
    const modalBody = document.querySelector(".modal-body");
    const modalFooter = document.querySelector(".modal-footer");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
        (blob) => {
            const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
            capturedImage = file;

            const reader = new FileReader();
            reader.onload = (e) => showImagePreview(e.target.result, file);
            reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.9
    );

    cameraWrapper.classList.add("d-none");
    modalBody.classList.remove("d-none");
    modalFooter.classList.remove("d-none");

    stopCamera();
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        showImagePreview(e.target.result, file);
    };
    reader.readAsDataURL(file);
}

function showImagePreview(src, file = null) {
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");
    const cameraLabel = document.querySelector(".camera-label");
    const imageInput = document.getElementById("imageInput");
    const video = document.getElementById("cameraVideo");
    const captureBtn = document.getElementById("captureBtn");
    const clearBtn = document.getElementById("clearImageBtn");

    if (!preview || !previewImg) return;

    previewImg.src = src;
    preview.style.display = "block";

    video.style.display = "none";
    captureBtn.classList.add("d-none");
    if (cameraLabel) cameraLabel.style.display = "none";
    if (clearBtn) clearBtn.classList.remove("d-none");

    if (file && imageInput) {
        const dt = new DataTransfer();
        dt.items.add(file);
        imageInput.files = dt.files;
    }
}

function clearImage() {
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");
    const cameraLabel = document.querySelector(".camera-label");
    const imageInput = document.getElementById("imageInput");
    const video = document.getElementById("cameraVideo");
    const captureBtn = document.getElementById("captureBtn");
    const clearBtn = document.getElementById("clearImageBtn");

    if (previewImg) previewImg.src = "";
    if (preview) preview.style.display = "none";
    if (cameraLabel) cameraLabel.style.display = "flex";
    if (imageInput) imageInput.value = "";
    if (video) video.style.display = "block";
    if (captureBtn) captureBtn.classList.remove("d-none");
    if (clearBtn) clearBtn.classList.add("d-none");

    stopCamera();
}

function showAlertDashboard(message, type = "success") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} d-flex align-items-center task-status-alert`;
    alertDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        opacity: 1;
        transition: opacity 0.5s ease;
    `;

    let iconClass =
        type === "success" ? "fa-check-circle" : "fa-exclamation-triangle";

    alertDiv.innerHTML = `
        <i class="fas ${iconClass} me-2"></i>
        <div>${message}</div>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = "0";
        setTimeout(() => alertDiv.remove(), 500);
    }, 3000);
}

function resetCheckInModal() {
    // Reset image preview
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");
    const cameraLabel = document.querySelector(".camera-label");
    const imageInput = document.getElementById("imageInput");
    const video = document.getElementById("cameraVideo");
    const captureBtn = document.getElementById("captureBtn");
    const clearBtn = document.getElementById("clearImageBtn");

    if (previewImg) previewImg.src = "";
    if (preview) preview.style.display = "none";
    if (cameraLabel) cameraLabel.style.display = "flex";
    if (imageInput) imageInput.value = "";
    if (video) video.style.display = "block";
    if (captureBtn) captureBtn.classList.remove("d-none");
    if (clearBtn) clearBtn.classList.add("d-none");

    // Stop camera stream if still active
    stopCamera();

    // Reset radio button (optional)
    const workOutsideYes = document.getElementById("work_outside_yes");
    const workOutsideNo = document.getElementById("work_outside_no");
    const imageUploadSection = document.getElementById("imageUploadSection");

    if (workOutsideYes) {
        workOutsideYes.addEventListener("change", () => {
            if (imageUploadSection) imageUploadSection.style.display = "block";
        });
    }

    if (workOutsideNo) {
        workOutsideNo.addEventListener("change", () => {
            if (imageUploadSection) imageUploadSection.style.display = "none";
        });
    }

    // Clear hidden inputs
    document
        .querySelectorAll(
            'input[name="date_attendance"], input[name="time_in"]'
        )
        .forEach((el) => el.remove());

    // Reset date/time display
    document.getElementById("date_attendance").textContent = "Loading...";
    document.getElementById("time_in").textContent = "Loading...";
}

function submitCheckIn() {
    const form = document.getElementById("checkInForm");
    if (!form) return;

    const employeeId = document.querySelector(
        'input[name="employee_id"]'
    )?.value;
    if (!employeeId) {
        showAlertDashboard(
            "Employee ID not found. Please refresh the page.",
            "error"
        );
        return;
    }

    const isWorkOutsideRadio = document.querySelector(
        'input[name="is_work_outside"]:checked'
    );
    if (!isWorkOutsideRadio) {
        showAlertDashboard(
            "Please select whether you are working outside or not.",
            "error"
        );
        return;
    }

    const formData = new FormData();
    formData.append("employee_id", employeeId);
    formData.append(
        "is_work_outside",
        isWorkOutsideRadio.value === "1" ? "1" : "0"
    );
    formData.append(
        "date_attendance",
        document.querySelector('input[name="date_attendance"]').value
    );
    formData.append(
        "time_in",
        document.querySelector('input[name="time_in"]').value
    );
    formData.append("type_attendance", "check_in");

    const noteTextarea = document.querySelector('textarea[name="note"]');
    if (noteTextarea && noteTextarea.value.trim()) {
        formData.append("note", noteTextarea.value.trim());
    }

    if (capturedImage) {
        formData.append("image", capturedImage);
    } else {
        const imageInput = document.getElementById("imageInput");
        if (imageInput && imageInput.files && imageInput.files[0]) {
            formData.append("image", imageInput.files[0]);
        }
    }

    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    if (!csrfToken) {
        showAlertDashboard(
            "CSRF token not found. Please refresh the page.",
            "error"
        );
        return;
    }
    formData.append("_token", csrfToken);

    const submitBtn = document.getElementById("submitCheckInBtn");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    fetch(`${baseUrl}/attendance/store`, {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": csrfToken,
            Accept: "application/json",
        },
    })
        .then((response) =>
            response.json().then((data) => {
                if (!response.ok)
                    throw new Error(data.message || "Validation error");
                return data;
            })
        )
        .then((data) => {
            if (data.status === "success") {
                showAlertDashboard(
                    "Check-in submitted successfully!",
                    "success"
                );

                // Update UI tanpa reload
                $("#checkInBtn .check-icon").show();
                $("#checkInBtn").addClass("active");

                updateAttendanceStatus();
                renderCalendar(currentMonth, currentYear);

                const modal = bootstrap.Modal.getInstance(
                    document.getElementById("checkInModal")
                );
                if (modal) modal.hide();

                form.reset();
                clearImage();
            } else {
                showAlertDashboard(
                    data.message || "Error submitting check-in",
                    "error"
                );
            }
        })
        .catch((error) => {
            console.error("Network error:", error);
            showAlertDashboard(error.message || "Network error", "error");
        })
        .finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

function loadCheckInDataForCheckout(serverTime) {
    const employeeId = document.querySelector(
        'input[name="employee_id"]'
    )?.value;
    if (!employeeId) return;

    const selectedDate =
        document.getElementById("currentDate")?.value ||
        new Date().toISOString().split("T")[0];
    const url = `${baseUrl}/attendance/daily/${employeeId}/${selectedDate}`;

    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            if (
                data.status === "success" &&
                Array.isArray(data.data) &&
                data.data.length > 0
            ) {
                const checkInRecord = data.data.find(
                    (r) => r.type_attendance === "check_in"
                );
                if (!checkInRecord) return setCheckoutModalDefaults();

                populateCheckoutModal(checkInRecord, serverTime);
            } else {
                setCheckoutModalDefaults();
            }
        })
        .catch(() => setCheckoutModalDefaults());
}

function openCheckOutModal() {
    fetch(baseUrl + "/server-time")
        .then((response) => response.json())
        .then((data) => {
            const serverTime = data.time;
            const serverDate = data.date;

            // Update hidden input
            document.getElementById("date_attendance").value = serverDate;
            document.getElementById("time_out").value = serverTime;

            // Update tampilan
            document.getElementById("time_out_display").textContent =
                serverTime;

            // Load check-in data dan hitung durasi kerja
            loadCheckInDataForCheckout(serverTime);
        })
        .catch((error) => console.error("Gagal ambil waktu server:", error));

    // Tampilkan modal
    const modal = new bootstrap.Modal(document.getElementById("checkOutModal"));
    modal.show();
}

function initializeAttendance() {
    // Set current date
    const today = new Date();
    const currentDateInput = document.getElementById("currentDate");
    if (currentDateInput) {
        currentDateInput.value = today.toISOString().split("T")[0];
    }

    // Update check in/out times if available
    updateAttendanceStatus();
}

function updateAttendanceStatus() {
    const employeeId = document.querySelector(
        'input[name="employee_id"]'
    )?.value;

    if (!employeeId) {
        console.error("Employee ID not found");
        return;
    }

    const today = new Date().toISOString().split("T")[0];
    const urlToday = `${baseUrl}/attendance/today/${employeeId}`;
    const urlLatestUnclosed = `${baseUrl}/attendance/latest-unclosed/${employeeId}`;

    // Fetch latest unclosed check-in (could be from previous day)
    fetch(urlLatestUnclosed)
        .then((response) => response.json())
        .then((latestData) => {
            // Fetch today's attendance data
            fetch(urlToday)
                .then((response) => response.json())
                .then((todayData) => {
                    const checkInBtn = document.getElementById("checkInBtn");
                    const checkOutBtn = document.getElementById("checkOutBtn");

                    if (!checkInBtn || !checkOutBtn) {
                        console.error("Check buttons not found");
                        return;
                    }

                    console.log("Latest unclosed attendance:", latestData);
                    console.log("Today's attendance:", todayData);

                    // Determine button state based on today's attendance first
                    if (todayData.status === "success" && todayData.data) {
                        const attendances = todayData.data;

                        if (attendances.length > 0) {
                            const lastAttendance =
                                attendances[attendances.length - 1];

                            if (
                                lastAttendance.type_attendance === "check_in" &&
                                !lastAttendance.time_out
                            ) {
                                // Last record is check-in without checkout, show checkout button
                                checkInBtn.style.display = "flex";
                                checkOutBtn.style.display = "flex";

                                // Update hidden time fields
                                const checkInTimeInput =
                                    document.getElementById("checkInTime");
                                if (checkInTimeInput) {
                                    checkInTimeInput.value =
                                        lastAttendance.time_in;
                                }
                                return;
                            } else {
                                // Last record is checkout or fully checked out, show check-in button
                                checkInBtn.style.display = "flex";
                                checkOutBtn.style.display = "flex";
                                return;
                            }
                        } else {
                            // No attendance today, show check-in button
                            checkInBtn.style.display = "flex";
                            checkOutBtn.style.display = "flex";
                            return;
                        }
                    }

                    // If no attendance today, check latest unclosed check-in from previous days
                    if (latestData.status === "success" && latestData.data) {
                        const latestAttendance = latestData.data;
                        const latestDate = latestAttendance.date_attendance;

                        if (latestDate < today) {
                            checkInBtn.style.display = "flex";
                            checkOutBtn.style.display = "flex";
                            // Set hidden checkInTime to latest check-in time
                            const checkInTimeInput =
                                document.getElementById("checkInTime");
                            if (checkInTimeInput) {
                                checkInTimeInput.value =
                                    latestAttendance.time_in;
                            }
                            return;
                        }
                    }

                    // Default fallback: show check-in button
                    checkInBtn.style.display = "flex";
                    checkOutBtn.style.display = "flex";
                });
        })
        .catch((error) => {
            console.error("Error fetching attendance data:", error);
            // Fallback to showing check-in button
            const checkInBtn = document.getElementById("checkInBtn");
            const checkOutBtn = document.getElementById("checkOutBtn");

            if (checkInBtn && checkOutBtn) {
                checkInBtn.style.display = "flex";
                checkOutBtn.style.display = "flex";
            }
        });
}

function populateCheckoutModal(checkInRecord, serverTime) {
    // Tampilkan status work outside
    const workOutsideText = checkInRecord.is_work_outside ? "Yes" : "No";
    document.getElementById("workOutsideStatusText").textContent = workOutsideText;

    // Tampilkan time in
    document.getElementById("time_in_display").textContent = checkInRecord.time_in || "Not available";

    // Hitung durasi kerja dari time_in dan serverTime
    if (checkInRecord.time_in) {
        const totalDuration = calculateDuration24h(checkInRecord.time_in, serverTime);
        document.getElementById("total_work_duration").textContent = totalDuration;
    } else {
        document.getElementById("total_work_duration").textContent = "0h 0m";
    }

    // Show/hide image section berdasarkan work outside
    const imageSection = document.getElementById("imageUploadSection");
    if (imageSection) {
        imageSection.style.display = checkInRecord.is_work_outside ? "block" : "none";
    }
}

function setCheckoutModalDefaults() {
    document.getElementById("workOutsideStatusText").textContent =
        "Not available";
    document.getElementById("time_in_display").textContent = "Not available";
    document.getElementById("total_work_duration").textContent = "0h 0m";

    const imageSection = document.getElementById("imageUploadSection");
    if (imageSection) imageSection.style.display = "none";
}

function submitCheckOut() {
    const form = document.getElementById("checkOutForm");
    const formData = new FormData(form);

    // Add CSRF token
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    formData.append("_token", csrfToken);

    const url = `${baseUrl}/attendance/checkout`;

    // Show loading state
    const submitCheckOutBtn = document.getElementById("submitCheckOutBtn");
    const originalText = submitCheckOutBtn.innerHTML;
    submitCheckOutBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitCheckOutBtn.disabled = true;

    fetch(url, {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": csrfToken,
            Accept: "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                showAlertDashboard(
                    data.message || "Check-out submitted successfully!",
                    "success"
                );

                // Close modal
                const modal = bootstrap.Modal.getInstance(
                    document.getElementById("checkOutModal")
                );
                if (modal) modal.hide();

                // Update UI tanpa reload
                updateAttendanceStatus();
                renderCalendar(currentMonth, currentYear);

                $("#checkOutBtn .done-all-icon").show();
                $("#checkOutBtn").addClass("active");
            } else {
                showAlertDashboard(
                    data.message || "Error submitting check-out",
                    "error"
                );
                console.error("Server error:", data);
            }
        })
        .catch((error) => {
            console.error("Network error:", error);
            showAlertDashboard(
                error.message || "Network error. Please check your connection.",
                "error"
            );
        })
        .finally(() => {
            // Reset button state
            submitCheckOutBtn.innerHTML = originalText;
            submitCheckOutBtn.disabled = false;
        });
}

$(".btn-tab-task").on("click", function () {
    $(".btn-tab-task").removeClass("active");
    $(this).addClass("active");

    showTask();
});

function showTask() {
    let taskActive = $(".btn-tab-task.active").attr("data-tab-active");

    if (taskActive === "today") {
        getTaskToday();
    } else if (taskActive === "tomorrow") {
        getTaskTomorrow();
    }
}

function getTaskToday() {
    console.log("task aktive today");
}

function getTaskTomorrow() {
    console.log("task aktive today");
}

// Calendar Functions
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

function initializeCalendar() {
    currentDate = new Date();
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderCalendar(currentMonth, currentYear);
}

function renderCalendar(month, year) {
    console.log("Rendering calendar for", month, year); // Debug log
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Update header
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    document.getElementById(
        "currentMonthYear"
    ).textContent = `${monthNames[month]} ${year}`;

    // Clear previous days
    const calendarDays = document.getElementById("calendarDays");
    calendarDays.innerHTML = "";

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "calendar-day other-month";
        calendarDays.appendChild(emptyDay);
    }

    // Fetch attendance data for the month and employee
    const employeeId = document.querySelector(
        'input[name="employee_id"]'
    )?.value;
    if (!employeeId) {
        console.error("Employee ID not found for attendance calendar");
        return;
    }

    fetch(`${baseUrl}/attendance/monthly/${employeeId}/${year}/${month + 1}`)
        .then((response) => response.json())
        .then((data) => {
            let attendanceData = {};
            if (data.status === "success" && Array.isArray(data.data)) {
                // Group attendance records by date
                data.data.forEach((record) => {
                    const date = new Date(record.date_attendance);
                    const day = date.getDate();
                    if (!attendanceData[day]) {
                        attendanceData[day] = [];
                    }
                    attendanceData[day].push(record);
                });
            }

            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement("div");
                dayElement.className = "calendar-day";
                dayElement.textContent = day;

                // Check if this is today
                const checkDate = new Date(year, month, day);
                if (checkDate.toDateString() === new Date().toDateString()) {
                    dayElement.classList.add("today");
                }

                // Add attendance classes based on data
                if (attendanceData[day]) {
                    const records = attendanceData[day];

                    // Special handling for current day to show 3 segments with previous day checkout
                    const today = new Date();
                    const checkDate = new Date(year, month, day);
                    const isToday =
                        checkDate.toDateString() === today.toDateString();

                    // Define dateString for current day
                    const dateString = checkDate.toISOString().split("T")[0];

                    // Group records by type and date
                    const todayRecords = records.filter(
                        (r) => r.date_attendance === dateString
                    );
                    const previousDayRecords = records.filter(
                        (r) => r.date_attendance < dateString
                    );

                    // Check for previous day checkout
                    const hasPreviousDayCheckout = previousDayRecords.some(
                        (r) => r.type_attendance === "check_out"
                    );

                    // Count today's check-ins and check-outs
                    const todayCheckIns = todayRecords.filter(
                        (r) => r.type_attendance === "check_in"
                    );
                    const todayCheckOuts = todayRecords.filter(
                        (r) => r.type_attendance === "check_out"
                    );

                    // Handle 3-segment display for current day
                    if (
                        isToday &&
                        (hasPreviousDayCheckout ||
                            todayCheckIns.length > 0 ||
                            todayCheckOuts.length > 0)
                    ) {
                        // Always use 3-segment layout for today
                        dayElement.classList.add("has-three-sections");

                        // Create date number container
                        const dateNumber = document.createElement("span");
                        dateNumber.className = "date-number";
                        dateNumber.textContent = day;
                        dayElement.appendChild(dateNumber);

                        // Top section - Previous day's checkout (if exists)
                        if (hasPreviousDayCheckout) {
                            const outLabelTop = document.createElement("span");
                            outLabelTop.className = "check-out-label-top";
                            dayElement.appendChild(outLabelTop);
                        }

                        // Middle section - Today's check-in
                        if (todayCheckIns.length > 0) {
                            const inLabel = document.createElement("span");
                            inLabel.className = "check-in-label-middle";
                            inLabel.textContent = "In";
                            dayElement.appendChild(inLabel);
                        }

                        // Bottom section - Today's checkout
                        if (todayCheckOuts.length > 0) {
                            const outLabelBottom =
                                document.createElement("span");
                            outLabelBottom.className = "check-out-label-bottom";
                            dayElement.appendChild(outLabelBottom);
                        }
                    } else {
                        // Handle other days with simpler display
                        let checkInCount = 0;
                        let checkOutCount = 0;
                        records.forEach((rec) => {
                            if (rec.type_attendance === "check_in")
                                checkInCount++;
                            if (rec.type_attendance === "check_out")
                                checkOutCount++;
                        });

                        if (checkInCount > 0 && checkOutCount > 0) {
                            // Both check-in and check-out
                            dayElement.classList.add("checked-in");
                            dayElement.classList.add("checked-out");
                            const inLabel = document.createElement("span");
                            inLabel.className = "check-in-label";
                            dayElement.appendChild(inLabel);
                            const outLabel = document.createElement("span");
                            outLabel.className = "check-out-label";
                            dayElement.appendChild(outLabel);
                        } else if (checkInCount > 0) {
                            // Only check-in
                            dayElement.classList.add("checked-in");
                            const inLabel = document.createElement("span");
                            inLabel.className = "check-in-label";
                            dayElement.appendChild(inLabel);
                        } else if (checkOutCount > 0) {
                            // Only check-out
                            dayElement.classList.add("checked-out");
                            const outLabel = document.createElement("span");
                            outLabel.className = "check-out-label";
                            dayElement.appendChild(outLabel);
                        }
                    }
                }

                // Add click event
                dayElement.addEventListener("click", function () {
                    selectDate(day, month, year);
                });

                calendarDays.appendChild(dayElement);
            }
        })
        .catch((error) => {
            console.error("Error fetching monthly attendance:", error);
        });
}

// calendar mobile toggle
$(document).ready(function () {
    $(".toggle-calendar").on("click", function () {
        let $calendar = $(".calendar-card-mobile");
        $(".calendar-toggle-btn").addClass("active");

        if ($calendar.is(":visible")) {
            // keluar animasi slide out
            $calendar.removeClass("animate-in").addClass("animate-out");

            // setelah animasi selesai, sembunyikan
            setTimeout(() => {
                $calendar.hide();
            }, 400);
        } else {
            // sebelum show reset posisi
            $calendar.show().removeClass("animate-out").addClass("animate-in");
        }
    });
});

// timline mobile toggle
$(document).ready(function () {
    $(".toggle-timeline").on("click", function () {
        let $timeline = $(".timeline-card-mobile");
        $(".timeline-toggle-btn").addClass("active");

        if ($timeline.is(":visible")) {
            // keluar animasi slide out
            $timeline.removeClass("animate-in").addClass("animate-out");

            // setelah animasi selesai, sembunyikan
            setTimeout(() => {
                $timeline.hide();
            }, 400);
        } else {
            // sebelum show reset posisi
            $timeline.show().removeClass("animate-out").addClass("animate-in");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    function updateClock() {
        const now = new Date();

        let hours = now.getHours().toString().padStart(2, "0");
        let minutes = now.getMinutes().toString().padStart(2, "0");
        let seconds = now.getSeconds().toString().padStart(2, "0");

        const clockEl = document.getElementById("clock");
        if (clockEl) {
            clockEl.textContent = `${hours} : ${minutes} : ${seconds}`;
        }

        const days = [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
        ];
        const months = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
        ];

        let dayName = days[now.getDay()];
        let date = now.getDate();
        let monthName = months[now.getMonth()];
        let year = now.getFullYear();

        const dateEl = document.getElementById("date");
        if (dateEl) {
            dateEl.textContent = `${dayName}, ${date} ${monthName} ${year}`;
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
});

// Doughnut Chart Porject
document.addEventListener("DOMContentLoaded", function () {
    const createDoughnut = (el) =>
        new Chart(el, {
            type: "doughnut",
            data: {
                labels: ["Total", "Complete", "On Progress", "Late"],
                datasets: [
                    {
                        data: [3, 5, 2],
                        backgroundColor: ["#b6e7c9", "#8fb3e8", "#ff9c9c"],
                        borderWidth: 0,
                    },
                ],
            },
            options: { cutout: "60%", plugins: { legend: { display: false } } },
        });

    const ctxDesktop = document.getElementById("doughnutChart");
    if (ctxDesktop) createDoughnut(ctxDesktop);

    const ctxMobile = document.getElementById("doughnutChartMobile");
    if (ctxMobile) createDoughnut(ctxMobile);
});

// State untuk timeline
let currentMonthProject = new Date().getMonth(); // 0 - 11
let currentWeekProject = 0; // 0-3
const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

// Dummy data project (ubah sesuai backend lu)
const timelineData = [
    { name: "Name Project", start: 0, end: 3, color: "color1" },
    { name: "Name Project", start: 1, end: 4, color: "color2" },
    { name: "Name Project", start: 2, end: 6, color: "color3" },
    { name: "Name Project", start: 0, end: 6, color: "color4" },
];

// Fungsi render timeline
function renderTimeline(
    targetRows = "#timelineRows",
    targetTitle = "#timelineTitle"
) {
    $(targetTitle).text(
        `${months[currentMonthProject]} week ${currentWeekProject + 1}`
    );

    const $timelineRows = $(targetRows);
    $timelineRows.empty();

    $.each(timelineData, function (_, proj) {
        const $row = $("<div>")
            .addClass("timeline-row d-flex")
            .css("position", "relative");

        // bikin 7 kolom (hari Senin–Minggu)
        for (let i = 0; i < 7; i++) {
            $row.append(
                $("<div>").addClass("timeline-cell").css("position", "relative")
            );
        }

        const barLeft = proj.start * (100 / 7);
        const barWidth = (proj.end - proj.start + 1) * (100 / 7);

        const $bar = $("<div>")
            .addClass(`timeline-bar ${proj.color}`)
            .css({
                left: `${barLeft}%`,
                width: `${barWidth}%`,
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
            })
            .html(
                `<span class="circle border-0 ${proj.color}"></span>${proj.name}`
            );

        $row.append($bar);
        $timelineRows.append($row);
    });
}

$(document).ready(function () {
    // render pertama kali
    if ($("#timelineRows").length) {
        renderTimeline("#timelineRows", "#timelineTitle");
    }

    // event prev
    $("#prevTimeline").on("click", function () {
        if (currentWeekProject > 0) {
            currentWeekProject--;
        } else if (currentMonthProject > 0) {
            currentMonthProject--;
            currentWeekProject = 3;
        }
        renderTimeline("#timelineRows", "#timelineTitle");
    });

    // event next
    $("#nextTimeline").on("click", function () {
        if (currentWeekProject < 3) {
            currentWeekProject++;
        } else if (currentMonthProject < 11) {
            currentMonthProject++;
            currentWeekProject = 0;
        }
        renderTimeline("#timelineRows", "#timelineTitle");
    });
});

// Initialize Swiper for mobile task display
function initializeTaskSwiper() {
    // Check if we're on mobile (width <= 768px)
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Initialize Swiper if not already initialized
        if (!window.taskSwiper) {
            window.taskSwiper = new Swiper(".task-swiper", {
                slidesPerView: 1,
                spaceBetween: 5,
                centeredSlides: true,
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true,
                },
                loop: true,
                grabCursor: false,
                effect: "slide",
                speed: 300,
                breakpoints: {
                    320: {
                        slidesPerView: 1,
                        spaceBetween: 10,
                    },
                    480: {
                        slidesPerView: 1,
                        spaceBetween: 15,
                    },
                    640: {
                        slidesPerView: 1,
                        spaceBetween: 20,
                    },
                },
            });
        }
    } else {
        // Destroy Swiper if it exists and we're on desktop
        if (window.taskSwiper) {
            window.taskSwiper.destroy();
            window.taskSwiper = null;
        }
    }
}

$(document).ready(function () {
    initializeTaskSwiper();
    $(window).on("resize", function () {
        handleResize();
    });
});

$(document).ready(function () {
    // existing code...
    initializeTaskSwiper();

    // render default timeline untuk desktop
    if ($("#timelineRows").length) {
        renderTimeline("#timelineRows", "#timelineTitle");
    }
});

$(document).on("click", ".toggle-timeline", function () {
    const $timelineCard = $(this)
        .closest(".project-card")
        .find(".timeline-card");

    $timelineCard.slideToggle();

    if ($timelineCard.is(":visible")) {
        renderTimeline("#timelineRows", "#timelineTitle");
    }
});

// Handle window resize for responsive behavior
function handleResize() {
    initializeTaskSwiper();
}

// Initialize on document ready and window resize
$(document).ready(function () {
    initializeTaskSwiper();
    $(window).on("resize", handleResize);
});
