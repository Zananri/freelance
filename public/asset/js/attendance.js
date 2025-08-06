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

    // Image input handling
    const imageInput = document.getElementById("imageInput");
    if (imageInput) {
        imageInput.addEventListener("change", handleImagePreview);
    }

    // Camera functionality
    initializeCameraFeatures();
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
    showNotification("Successfully checked in at " + timeString, "success");
}

function handleCheckOut() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });

    document.getElementById("checkOutTime").value = timeString;
    document.getElementById("attendanceStatus").textContent = "Checked Out";

    // Calculate working hours
    calculateWorkingHours();

    // Disable check out button
    document.getElementById("checkOutBtn").disabled = true;

    // Show success message
    showNotification("Successfully checked out at " + timeString, "success");
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
    // This would typically fetch from server
    // For now, we'll use mock data
    const mockData = {
        checkInTime: null,
        checkOutTime: null,
        status: "",
    };

    if (mockData.checkInTime) {
        document.getElementById("checkInTime").value = mockData.checkInTime;
        document.getElementById("checkInBtn").disabled = true;
        document.getElementById("attendanceStatus").textContent = "Checked In";
    } else {
        document.getElementById("attendanceStatus").textContent = "";
    }

    if (mockData.checkOutTime) {
        document.getElementById("checkOutTime").value = mockData.checkOutTime;
        document.getElementById("checkOutBtn").disabled = true;
        document.getElementById("attendanceStatus").textContent = "Checked Out";
    }
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

        // Add mock attendance data
        addMockAttendanceData(dayElement, day, month, year);

        // Add click event
        dayElement.addEventListener("click", function () {
            selectDate(day, month, year);
        });

        calendarDays.appendChild(dayElement);
    }
}

function addMockAttendanceData(dayElement, day, month, year) {
    // Mock attendance data for demonstration
    const mockAttendance = {
        1: "present",
        3: "absent",
        5: "late",
        7: "leave",
        10: "present",
        12: "late",
        15: "present",
        18: "leave",
        20: "present",
        22: "absent",
        25: "present",
        28: "late",
    };

    if (mockAttendance[day]) {
        dayElement.classList.add("has-attendance", mockAttendance[day]);
    }
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

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `alert alert-${type} notification`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    if (type === "success") {
        notification.style.backgroundColor = "#28a745";
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .calendar-day.selected {
        background-color: #007bff;
        color: white;
    }
`;
document.head.appendChild(style);

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

    // Retake button
    const retakeBtn = document.getElementById("retakeBtn");
    if (retakeBtn) {
        retakeBtn.addEventListener("click", retakePhoto);
    }
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

        if (clearBtn) clearBtn.style.display = "inline-block";
        if (retakeBtn) retakeBtn.style.display = "inline-block";
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

    if (preview) preview.style.display = "none";
    if (previewImg) previewImg.src = "";
    if (clearBtn) clearBtn.style.display = "none";
    if (retakeBtn) retakeBtn.style.display = "none";
    if (cameraLabel) cameraLabel.style.display = "block";
    if (imageInput) imageInput.value = "";

    capturedImage = null;
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
                showNotification(
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
                showNotification(
                    data.message || "Error submitting check-in",
                    "error"
                );
                console.error("Server error:", data);
            }
        })
        .catch((error) => {
            console.error("Network error:", error);
            showNotification(
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
