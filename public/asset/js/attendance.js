// Attendance JavaScript
const baseUrl =
    document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
    "";

document.addEventListener("DOMContentLoaded", function () {
    // Initialize attendance page
    initializeAttendance();
    initializeCalendar();

    // Setup event listeners with DOM ready check
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupEventListeners);
    } else {
        setupEventListeners();
    }
});

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

function setupEventListeners() {
    // Check in/out button - now opens modal
    const checkInBtn = document.getElementById("checkInBtn");
    if (checkInBtn) {
        checkInBtn.addEventListener("click", function () {
            openCheckInModal();
        });
    }

    // Check out button
    const checkOutBtn = document.getElementById("checkOutBtn");
    if (checkOutBtn) {
        checkOutBtn.addEventListener("click", function () {
            openCheckOutModal();
        });
    }

    // Calendar navigation
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener("click", function () {
            navigateMonth(-1);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener("click", function () {
            navigateMonth(1);
        });
    }

    // Modal form submission
    const submitCheckInBtn = document.getElementById("submitCheckInBtn");
    if (submitCheckInBtn) {
        submitCheckInBtn.addEventListener("click", function () {
            submitCheckIn();
        });
    }

    // Submit checkout
    const submitCheckOutBtn = document.getElementById("submitCheckOutBtn");
    if (submitCheckOutBtn) {
        submitCheckOutBtn.addEventListener("click", function () {
            submitCheckOut();
        });
    }

    // Image input handling
    const imageInput = document.getElementById("imageInput");
    if (imageInput) {
        imageInput.addEventListener("change", handleImagePreview);
    }

    // Work outside radio buttons event listeners
    const workOutsideYes = document.getElementById("work_outside_yes");
    const workOutsideNo = document.getElementById("work_outside_no");

    if (workOutsideYes && workOutsideNo) {
        workOutsideYes.addEventListener("change", toggleImageUploadVisibility);
        workOutsideNo.addEventListener("change", toggleImageUploadVisibility);
    }

    // Camera functionality
    initializeCameraFeatures();

    // Initialize image upload visibility based on default selection
    toggleImageUploadVisibility();
}

// Function to toggle image upload visibility based on work outside selection
function toggleImageUploadVisibility() {
    const workOutsideYes = document.getElementById("work_outside_yes");
    const imageUploadSection = document.getElementById("imageUploadSection");

    if (workOutsideYes && imageUploadSection) {
        if (workOutsideYes.checked) {
            // Show image upload section when "Yes" is selected
            imageUploadSection.style.display = "block";
        } else {
            // Hide image upload section when "No" is selected
            imageUploadSection.style.display = "none";

            // Clear any existing image when hiding
            clearImage();
        }
    }
}

// Function to open the check-in modal
function openCheckInModal() {
    // Set current date and time
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });

    // Update modal form fields
    document.getElementById("date_attendance").value = dateString;
    document.getElementById("time_in").value = timeString;

    // Check for existing image URL and show preview if present
    const existingImageUrlInput = document.getElementById("existingImageUrl");
    if (existingImageUrlInput && existingImageUrlInput.value) {
        showImagePreview(existingImageUrlInput.value);
    } else {
        clearImage();
    }

    // Show the modal using Bootstrap's modal API
    const modal = new bootstrap.Modal(document.getElementById("checkInModal"));
    modal.show();
}

function handleCheckIn() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });

    document.getElementById("checkInTime").value = timeString;
    document.getElementById("attendanceStatus").textContent = "Checked In";

    // Disable check in button and enable check out
    document.getElementById("checkInBtn").disabled = true;
    document.getElementById("checkOutBtn").disabled = false;

    // Show success message
    showFloatingAlert("Successfully checked in at " + timeString, "success");
}

function handleCheckOut() {
    const now = new Date();
    const currentTime = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });

    document.getElementById("checkOutTime").value = currentTime;
    document.getElementById("attendanceStatus").textContent = "Checked Out";

    // Calculate working hours
    calculateWorkingHours();

    // Disable check out button
    document.getElementById("checkOutBtn").disabled = true;

    // Show success message
    showFloatingAlert("Successfully checked out at " + timeString, "success");
}

function calculateWorkingHours() {
    const checkInTime = document.getElementById("checkInTime").value;
    const checkOutTime = document.getElementById("checkOutTime").value;

    if (checkInTime && checkOutTime) {
        const [checkInHour, checkInMin] = checkInTime.split(":").map(Number);
        const [checkOutHour, checkOutMin] = checkOutTime.split(":").map(Number);

        const checkInTotal = checkInHour * 60 + checkInMin;
        const checkOutTotal = checkOutHour * 60 + checkOutMin;

        const totalMinutes = checkOutTotal - checkInTotal;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        document.getElementById(
            "workingHours"
        ).textContent = `${hours}h ${minutes}m`;
    }
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
    const url = `${baseUrl}/attendance/today/${employeeId}`;

    // Fetch actual attendance data from server
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success" && data.data) {
                const attendance = data.data;

                const checkInBtn = document.getElementById("checkInBtn");
                const checkOutBtn = document.getElementById("checkOutBtn");

                if (!checkInBtn || !checkOutBtn) {
                    console.error("Check buttons not found");
                    return;
                }

                if (attendance.time_in && !attendance.time_out) {
                    // Checked in but not checked out - show checkout button
                    checkInBtn.style.display = "none";
                    checkOutBtn.style.display = "flex";

                    // Update hidden time fields
                    const checkInTimeInput =
                        document.getElementById("checkInTime");
                    if (checkInTimeInput) {
                        checkInTimeInput.value = attendance.time_in;
                    }
                } else if (attendance.time_in && attendance.time_out) {
                    // Already checked out - hide both buttons
                    checkInBtn.style.display = "none";
                    checkOutBtn.style.display = "none";
                } else {
                    // No check-in yet - show checkin button
                    checkInBtn.style.display = "flex";
                    checkOutBtn.style.display = "none";
                }
            } else {
                // No attendance record - show checkin button
                const checkInBtn = document.getElementById("checkInBtn");
                const checkOutBtn = document.getElementById("checkOutBtn");

                if (checkInBtn && checkOutBtn) {
                    checkInBtn.style.display = "flex";
                    checkOutBtn.style.display = "none";
                }
            }
        })
        .catch((error) => {
            console.error("Error fetching attendance data:", error);
            // Fallback to showing check-in button
            const checkInBtn = document.getElementById("checkInBtn");
            const checkOutBtn = document.getElementById("checkOutBtn");

            if (checkInBtn && checkOutBtn) {
                checkInBtn.style.display = "flex";
                checkOutBtn.style.display = "none";
            }
        });
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
                data.data.forEach((record) => {
                    const date = new Date(record.date_attendance);
                    attendanceData[date.getDate()] = record;
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
                    const record = attendanceData[day];

                    // Add checked-in class
                    dayElement.classList.add("checked-in");

                    // Create "In" label
                    const inLabel = document.createElement("span");
                    inLabel.className = "check-in-label";
                    inLabel.textContent = "In";
                    dayElement.appendChild(inLabel);

                    // If checked out, add checked-out class and "Out" label
                    if (record.time_out) {
                        dayElement.classList.add("checked-out");

                        // Create "Out" label
                        const outLabel = document.createElement("span");
                        outLabel.className = "check-out-label";
                        outLabel.textContent = "Out";
                        dayElement.appendChild(outLabel);
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

function navigateMonth(direction) {
    currentMonth += direction;

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    renderCalendar(currentMonth, currentYear);
}

function selectDate(day, month, year) {
    const selectedDate = new Date(year, month, day);
    const dateString = selectedDate.toISOString().split("T")[0];

    // Update form date
    document.getElementById("currentDate").value = dateString;

    // Highlight selected date
    const days = document.querySelectorAll(".calendar-day");
    days.forEach((d) => d.classList.remove("selected"));

    const selectedDay = Array.from(days).find(
        (d) => d.textContent == day && !d.classList.contains("other-month")
    );

    if (selectedDay) {
        selectedDay.classList.add("selected");
    }

    // Load attendance for selected date
    loadAttendanceForDate(dateString);
}

function loadAttendanceForDate(dateString) {
    // This would typically fetch from server
    // For now, we'll reset the form for new date
    document.getElementById("checkInTime").value = "";
    document.getElementById("checkOutTime").value = "";
    document.getElementById("workingHours").textContent = "0h 0m";
    // Remove "Not Checked In" text when no check-in yet
    document.getElementById("attendanceStatus").textContent = "";

    document.getElementById("checkInBtn").disabled = false;
    document.getElementById("checkOutBtn").disabled = true;
}

// Function to show floating alert with SVG icon - same as task.js
function showFloatingAlert(message, type = "success") {
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

// Camera functionality
let stream = null;
let capturedImage = null;

function initializeCameraFeatures() {
    // Camera label click handler
    const cameraLabel = document.querySelector(".camera-label");
    if (cameraLabel) {
        cameraLabel.addEventListener("click", function (e) {
            e.preventDefault();
            startCamera();
        });
    }

    // Clear image button
    const clearImageBtn = document.getElementById("clearImageBtn");
    if (clearImageBtn) {
        clearImageBtn.addEventListener("click", clearImage);
    }

    // Removed retake button event listener as per user request
}

function startCamera() {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera is not supported on this device/browser");
        return;
    }

    // Request camera access
    navigator.mediaDevices
        .getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 },
            },
        })
        .then(function (mediaStream) {
            stream = mediaStream;

            // Show video element
            const video = document.getElementById("cameraVideo");
            const imageInput = document.getElementById("imageInput");
            const cameraLabel = document.querySelector(".camera-label");
            const preview = document.getElementById("imagePreview");

            if (video && cameraLabel) {
                video.srcObject = mediaStream;
                video.style.display = "block";
                cameraLabel.style.display = "none";
                imageInput.style.display = "none";
                preview.style.display = "none";

                // Add capture button
                addCaptureButton();
            }
        })
        .catch(function (error) {
            console.error("Error accessing camera:", error);

            // Fallback to file input if camera fails
            const imageInput = document.getElementById("imageInput");
            if (imageInput) {
                imageInput.click();
            }
        });
}

function addCaptureButton() {
    // Remove existing capture button
    const existingBtn = document.getElementById("captureBtn");
    if (existingBtn) {
        existingBtn.remove();
    }

    // Create capture button
    const captureBtn = document.createElement("button");
    captureBtn.id = "captureBtn";
    captureBtn.type = "button";
    captureBtn.className = "btn btn-primary mt-2 w-100";
    captureBtn.innerHTML = '<i class="fas fa-camera"></i> Capture Photo';

    captureBtn.addEventListener("click", capturePhoto);

    const videoContainer = document.getElementById("cameraVideo").parentElement;
    videoContainer.appendChild(captureBtn);
}

function capturePhoto() {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cameraCanvas");

    if (!video || !canvas) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
        function (blob) {
            if (blob) {
                // Create file from blob
                const file = new File([blob], "attendance-photo.jpg", {
                    type: "image/jpeg",
                });

                // Create data URL for preview
                const reader = new FileReader();
                reader.onload = function (e) {
                    showImagePreview(e.target.result);
                    capturedImage = file;

                    // Update file input
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    document.getElementById("imageInput").files = dt.files;
                };
                reader.readAsDataURL(blob);
            }
        },
        "image/jpeg",
        0.9
    );

    // Stop camera stream
    stopCamera();
}

function showImagePreview(src) {
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");
    const clearBtn = document.getElementById("clearImageBtn");
    const retakeBtn = document.getElementById("retakeBtn");
    const video = document.getElementById("cameraVideo");
    const captureBtn = document.getElementById("captureBtn");

    if (preview && previewImg) {
        previewImg.src = src;
        preview.style.display = "block";

        if (clearBtn) {
            clearBtn.style.display = "";
            clearBtn.classList.remove("d-none");
        }
        if (retakeBtn) {
            retakeBtn.style.display = "inline-block";
            retakeBtn.classList.remove("d-none");
        }
        if (video) video.style.display = "none";
        if (captureBtn) captureBtn.remove();
    }
}

function clearImage() {
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");
    const clearBtn = document.getElementById("clearImageBtn");
    const retakeBtn = document.getElementById("retakeBtn");
    const cameraLabel = document.querySelector(".camera-label");
    const imageInput = document.getElementById("imageInput");
    const video = document.getElementById("cameraVideo");
    const existingImageUrlInput = document.getElementById("existingImageUrl");

    // Reset preview
    if (preview) preview.style.display = "none";
    if (previewImg) previewImg.src = "";

    // Hide clear and retake buttons
    if (clearBtn) {
        clearBtn.style.display = "none";
        clearBtn.classList.add("d-none");
    }
    if (retakeBtn) {
        retakeBtn.style.display = "none";
        retakeBtn.classList.add("d-none");
    }

    // Show camera label again
    if (cameraLabel) {
        cameraLabel.style.display = "flex";
        cameraLabel.style.backgroundPosition = "center center";
        cameraLabel.style.backgroundRepeat = "no-repeat";
        cameraLabel.style.backgroundSize = "50%";
    }

    // Clear file input
    if (imageInput) imageInput.value = "";

    // Clear existing image URL hidden input
    if (existingImageUrlInput) existingImageUrlInput.value = "";

    // Hide video if showing
    if (video) video.style.display = "none";

    // Reset captured image
    capturedImage = null;

    // Stop camera if running
    stopCamera();
}

function retakePhoto() {
    clearImage();
    startCamera();
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
    }

    const video = document.getElementById("cameraVideo");
    const captureBtn = document.getElementById("captureBtn");

    if (video) video.style.display = "none";
    if (captureBtn) captureBtn.remove();
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function submitCheckIn() {
    const form = document.getElementById("checkInForm");
    if (!form) return;

    // Get form data
    const formData = new FormData(form);

    // Add captured image if exists
    if (capturedImage) {
        formData.append("image", capturedImage);
    }

    // Add CSRF token
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    if (!csrfToken) {
        console.error("CSRF token not found");
        return;
    }
    formData.append("_token", csrfToken);

    // Add employee_id from hidden field
    const employeeId = document.querySelector(
        'input[name="employee_id"]'
    )?.value;
    if (!employeeId) {
        console.error("Employee ID not found");
        return;
    }
    formData.append("employee_id", employeeId);

    // Convert boolean values properly
    const isWorkOutside = document.querySelector(
        'input[name="is_work_outside"]:checked'
    )?.value;
    if (!isWorkOutside) {
        console.error("Work outside selection not found");
        return;
    }
    formData.set("is_work_outside", isWorkOutside);

    // Show loading state
    const submitBtn = document.getElementById("submitCheckInBtn");
    if (!submitBtn) {
        console.error("Submit button not found");
        return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    // Get base URL from meta tag
    const url = `${baseUrl}/attendance/store`;

    // Send data to server
    fetch(url, {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": csrfToken,
            Accept: "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((err) => {
                    throw new Error(
                        err.message || `HTTP error! status: ${response.status}`
                    );
                });
            }
            return response.json();
        })
        .then((data) => {
            if (data.status === "success") {
                showFloatingAlert(
                    data.message || "Check-in submitted successfully!",
                    "success"
                );
                // Close modal
                const modal = bootstrap.Modal.getInstance(
                    document.getElementById("checkInModal")
                );
                if (modal) modal.hide();

                // Reset form
                form.reset();
                clearImage();

                // Reload attendance data
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showFloatingAlert(
                    data.message || "Error submitting check-in",
                    "error"
                );
                console.error("Server error:", data);
            }
        })
        .catch((error) => {
            console.error("Network error:", error);
            showFloatingAlert(
                error.message || "Network error. Please check your connection.",
                "error"
            );
        })
        .finally(() => {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
    // Add Font Awesome for icons
    const fontAwesome = document.createElement("link");
    fontAwesome.rel = "stylesheet";
    fontAwesome.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";
    document.head.appendChild(fontAwesome);
});

// Checkout Modal Functions
function openCheckOutModal() {
    // Get current date and time
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });

    // Update modal form fields
    document.getElementById("date_attendance").value = dateString;
    document.getElementById("time_out").value = timeString;

    // Set the visible time_out_display input to current time
    const timeOutDisplay = document.getElementById("time_out_display");
    if (timeOutDisplay) {
        timeOutDisplay.value = timeString;
    }

    // Load check-in data to display work outside status
    loadCheckInDataForCheckout();

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById("checkOutModal"));
    modal.show();
}

function calculateDuration24h(timeIn24h, timeOut24h) {
    if (!timeIn24h || !timeOut24h) return "0h 0m";

    try {
        // Normalize time formats (handle cases like "09:00 AM" or "09:00:00")
        const normalizeTime = (timeStr) => {
            let [hours, minutes] = timeStr.replace(/[^0-9:]/g, "").split(":");
            return `${hours.padStart(2, "0")}:${(minutes || "00").padStart(
                2,
                "0"
            )}`;
        };

        const normalizedIn = normalizeTime(timeIn24h);
        const normalizedOut = normalizeTime(timeOut24h);

        const [inHours, inMinutes] = normalizedIn.split(":").map(Number);
        const [outHours, outMinutes] = normalizedOut.split(":").map(Number);

        let totalInMinutes =
            outHours * 60 + outMinutes - (inHours * 60 + inMinutes);

        // Handle overnight case (negative duration)
        if (totalInMinutes < 0) {
            totalInMinutes += 24 * 60; // Add 24 hours
        }

        const hours = Math.floor(totalInMinutes / 60);
        const minutes = totalInMinutes % 60;

        return `${hours} hours ${minutes.toString().padStart(2)} minutes`;
    } catch (e) {
        console.error("Error calculating duration:", e);
        return "0 hours 0 minutes";
    }
}

function loadCheckInDataForCheckout() {
    const employeeId = document.querySelector(
        'input[name="employee_id"]'
    )?.value;
    if (!employeeId) return;

    const url = `${baseUrl}/attendance/today/${employeeId}`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success" && data.data) {
                const attendance = data.data;

                // Display work outside status
                const workOutsideText = attendance.is_work_outside
                    ? "Yes"
                    : "No";
                document.getElementById("workOutsideStatusText").textContent =
                    workOutsideText;
                document.getElementById("workOutsideStatusText").className =
                    attendance.is_work_outside;

                // Display time in
                if (attendance.time_in) {
                    document.getElementById("time_in_display").value =
                        attendance.time_in;

                    // Calculate work duration only if both time_in and time_out exist
                    if (attendance.time_out) {
                        const totalDuration = calculateDuration24h(
                            attendance.time_in,
                            attendance.time_out
                        );
                        document.getElementById("total_work_duration").value =
                            totalDuration;
                    } else {
                        // If not checked out yet, show current duration
                        const currentTime = new Date()
                            .toLocaleTimeString("en-US", {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            .replace(/^24/, "00");
                        const totalDuration = calculateDuration24h(
                            attendance.time_in,
                            currentTime
                        );
                        document.getElementById("total_work_duration").value =
                            totalDuration;
                    }
                } else {
                    document.getElementById("time_in_display").value =
                        "Not available";
                    document.getElementById("total_work_duration").value =
                        "0h 0m";
                }

                // Show/hide image upload based on work outside
                const imageSection =
                    document.getElementById("imageUploadSection");
                if (imageSection) {
                    imageSection.style.display = attendance.is_work_outside
                        ? "block"
                        : "none";
                }
            }
        })
        .catch((error) => {
            console.error("Error loading check-in data:", error);
            const errorElements = [
                "workOutsideStatusText",
                "time_in_display",
                "total_work_duration",
            ];
            errorElements.forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.textContent = "Error loading data";
            });
        });
}

// Function to submit check-out
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
                showFloatingAlert(
                    data.message || "Check-out submitted successfully!",
                    "success"
                );

                // Close modal
                const modal = bootstrap.Modal.getInstance(
                    document.getElementById("checkOutModal")
                );
                if (modal) modal.hide();

                // Reload attendance data
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showFloatingAlert(
                    data.message || "Error submitting check-out",
                    "error"
                );
                console.error("Server error:", data);
            }
        })
        .catch((error) => {
            console.error("Network error:", error);
            showFloatingAlert(
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
