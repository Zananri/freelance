// Attendance JavaScript - Refactored with AJAX
var appUrl = $('meta[name="app-url"]').attr("content");

$(document).ready(function () {
    // Initialize attendance page
    initializeAttendance();
    initializeCalendar();

    // Setup event listeners
    setupEventListeners();
});

function initializeAttendance() {
    // Set current date
    const today = new Date();
    const currentDateInput = document.getElementById("currentDate");
    if (currentDateInput) {
        currentDateInput.value = today.toISOString().split("T")[0];
    }

    // Load initial attendance data
    loadAttendanceData();
}

function setupEventListeners() {
    // Check in/out button - opens modal
    $(document).on("click", "#checkInBtn", function () {
        openCheckInModal();
    });

    // Calendar navigation
    $(document).on("click", "#prevMonth", function () {
        navigateMonth(-1);
    });

    $(document).on("click", "#nextMonth", function () {
        navigateMonth(1);
    });

    // Modal form submission
    $(document).on("click", "#submitCheckInBtn", function () {
        submitCheckInAJAX();
    });

    // Image input handling
    $(document).on("change", "#imageInput", handleImagePreview);

    // Camera functionality
    initializeCameraFeatures();
}

// Function to open the check-in modal
function openCheckInModal() {
    // Set current date and time
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
  const timeString = now.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
});


    // Update modal form fields
    $("#date_attendance").val(dateString);
    $("#time_in").val(timeString);

    // Show the modal
    $("#checkInModal").modal("show");
}

// AJAX function to load attendance data
function loadAttendanceData() {
    const employeeId = $('input[name="employee_id"]').val();
    const selectedDate = $("#currentDate").val();

    if (!employeeId || !selectedDate) return;

    $.ajax({
        url: appUrl + "/attendance/data",
        type: "GET",
        dataType: "json",
        data: {
            employee_id: employeeId,
            date: selectedDate
        },
        beforeSend: function () {
            showLoadingState();
        },
        success: function (response) {
            if (response.success) {
                updateAttendanceUI(response.data);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error loading attendance data:", error);
            showNotification("Failed to load attendance data", "error");
        },
        complete: function () {
            hideLoadingState();
        }
    });
}

// Update attendance UI with data
function updateAttendanceUI(data) {
    if (data.check_in_time) {
        $("#checkInTime").val(data.check_in_time);
        $("#checkInBtn").prop("disabled", true);
        $("#attendanceStatus").text("Checked In");
    } else {
        $("#checkInTime").val("");
        $("#checkInBtn").prop("disabled", false);
        $("#attendanceStatus").text("");
    }

    if (data.check_out_time) {
        $("#checkOutTime").val(data.check_out_time);
        $("#checkOutBtn").prop("disabled", true);
        $("#attendanceStatus").text("Checked Out");
        calculateWorkingHours();
    } else {
        $("#checkOutTime").val("");
        $("#checkOutBtn").prop("disabled", !data.check_in_time);
    }

    if (data.working_hours) {
        $("#workingHours").text(data.working_hours);
    }
}

// AJAX function to submit check-in
function submitCheckInAJAX() {
    const form = document.getElementById("checkInForm");
    if (!form) return;

    const formData = new FormData(form);
    
    // Add CSRF token
    formData.append("_token", $('meta[name="csrf-token"]').attr("content"));

    // Add captured image if exists
    if (window.capturedImage) {
        formData.append("image", window.capturedImage);
    }

    $.ajax({
        url: appUrl + "/attendance/store",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        beforeSend: function () {
            $("#submitCheckInBtn")
                .html('<i class="fas fa-spinner fa-spin"></i> Processing...')
                .prop("disabled", true);
        },
        success: function (response) {
            if (response.success) {
                showNotification(response.message || "Check-in submitted successfully!", "success");
                
                // Close modal
                $("#checkInModal").modal("hide");
                
                // Reset form
                form.reset();
                clearImage();
                
                // Reload attendance data
                loadAttendanceData();
                loadCalendarData();
            } else {
                showNotification(response.message || "Error submitting check-in", "error");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error submitting check-in:", error);
            let errorMessage = "An error occurred. Please try again.";
            
            if (xhr.responseJSON && xhr.responseJSON.errors) {
                const errors = Object.values(xhr.responseJSON.errors).flat();
                errorMessage = errors.join("\n");
            } else if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            
            showNotification(errorMessage, "error");
        },
        complete: function () {
            $("#submitCheckInBtn")
                .html("Submit Check-in")
                .prop("disabled", false);
        }
    });
}

// Calculate working hours
function calculateWorkingHours() {
    const checkInTime = $("#checkInTime").val();
    const checkOutTime = $("#checkOutTime").val();

    if (checkInTime && checkOutTime) {
        const [checkInHour, checkInMin] = checkInTime.split(":").map(Number);
        const [checkOutHour, checkOutMin] = checkOutTime.split(":").map(Number);

        const checkInTotal = checkInHour * 60 + checkInMin;
        const checkOutTotal = checkOutHour * 60 + checkOutMin;

        const totalMinutes = checkOutTotal - checkInTotal;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        $("#workingHours").text(`${hours}h ${minutes}m`);
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
    loadCalendarData();
}

// AJAX function to load calendar data
function loadCalendarData() {
    const employeeId = $('input[name="employee_id"]').val();
    
    if (!employeeId) return;

    $.ajax({
        url: appUrl + "/attendance/calendar",
        type: "GET",
        dataType: "json",
        data: {
            employee_id: employeeId,
            month: currentMonth + 1,
            year: currentYear
        },
        beforeSend: function () {
            $("#calendarDays").html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i></div>');
        },
        success: function (response) {
            if (response.success) {
                renderCalendarWithData(response.data);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error loading calendar data:", error);
            $("#calendarDays").html('<div class="text-center text-danger">Failed to load calendar</div>');
        }
    });
}

function renderCalendarWithData(attendanceData) {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Update header
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    $("#currentMonthYear").text(`${monthNames[currentMonth]} ${currentYear}`);

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
        const checkDate = new Date(currentYear, currentMonth, day);
        if (checkDate.toDateString() === new Date().toDateString()) {
            dayElement.classList.add("today");
        }

        // Add attendance data from server
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (attendanceData[dateKey]) {
            dayElement.classList.add("has-attendance", attendanceData[dateKey]);
        }

        // Add click event
        $(dayElement).on("click", function () {
            selectDate(day, currentMonth, currentYear);
        });

        calendarDays.appendChild(dayElement);
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

    loadCalendarData();
}

function selectDate(day, month, year) {
    const selectedDate = new Date(year, month, day);
    const dateString = selectedDate.toISOString().split("T")[0];

    // Update form date
    $("#currentDate").val(dateString);

    // Highlight selected date
    $(".calendar-day").removeClass("selected");
    $(`.calendar-day:contains('${day}')`).not('.other-month').addClass("selected");

    // Load attendance for selected date
    loadAttendanceData();
}

// Notification system
function showNotification(message, type) {
    const notification = $(`
        <div class="alert alert-${type} notification" style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        ">
            ${message}
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
        </div>
    `);

    if (type === "success") {
        notification.css("background-color", "#28a745");
    } else if (type === "error") {
        notification.css("background-color", "#dc3545");
    }

    $("body").append(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    }, 3000);
}

// Loading states
function showLoadingState() {
    // Add loading overlay or spinner
    const loadingHtml = '<div class="loading-overlay"><i class="fas fa-spinner fa-spin"></i></div>';
    $(".attendance-container").append(loadingHtml);
}

function hideLoadingState() {
    $(".loading-overlay").remove();
}

// Camera functionality
let stream = null;
window.capturedImage = null;

function initializeCameraFeatures() {
    // Camera label click handler
    $(document).on("click", ".camera-label", function (e) {
        e.preventDefault();
        startCamera();
    });

    // Clear image button
    $(document).on("click", "#clearImageBtn", clearImage);

    // Retake button
    $(document).on("click", "#retakeBtn", retakePhoto);
}

function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification("Camera is not supported on this device/browser", "error");
        return;
    }

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
            const video = document.getElementById("cameraVideo");
            const imageInput = document.getElementById("imageInput");
            const cameraLabel = document.querySelector(".camera-label");
            const preview = document.getElementById("imagePreview");

            if (video && cameraLabel) {
                video.srcObject = mediaStream;
                $(video).show();
                $(cameraLabel).hide();
                $(imageInput).hide();
                $(preview).hide();

                addCaptureButton();
            }
        })
        .catch(function (error) {
            console.error("Error accessing camera:", error);
            showNotification("Failed to access camera. Using file upload instead.", "error");
            $("#imageInput").click();
        });
}

function addCaptureButton() {
    // Remove existing capture button
    $("#captureBtn").remove();

    // Create capture button
    const captureBtn = $(`
        <button type="button" id="captureBtn" class="btn btn-primary mt-2 w-100">
            <i class="fas fa-camera"></i> Capture Photo
        </button>
    `);

    captureBtn.on("click", capturePhoto);
    $("#cameraVideo").parent().append(captureBtn);
}

function capturePhoto() {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cameraCanvas");

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
        function (blob) {
            if (blob) {
                const file = new File([blob], "attendance-photo.jpg", {
                    type: "image/jpeg",
                });

                const reader = new FileReader();
                reader.onload = function (e) {
                    showImagePreview(e.target.result);
                    window.capturedImage = file;

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

    stopCamera();
}

function showImagePreview(src) {
    const preview = $("#imagePreview");
    const previewImg = $("#previewImg");
    const clearBtn = $("#clearImageBtn");
    const retakeBtn = $("#retakeBtn");
    const video = $("#cameraVideo");
    const captureBtn = $("#captureBtn");

    if (preview.length && previewImg.length) {
        previewImg.attr("src", src);
        preview.show();
        clearBtn.show();
        retakeBtn.show();
        video.hide();
        captureBtn.remove();
    }
}

function clearImage() {
    $("#imagePreview").hide();
    $("#previewImg").attr("src", "");
    $("#clearImageBtn").hide();
    $("#retakeBtn").hide();
    $(".camera-label").show();
    $("#imageInput").val("");
    window.capturedImage = null;
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

    $("#cameraVideo").hide();
    $("#captureBtn").remove();
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

// Add CSS for animations
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
    
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .loading-overlay i {
        font-size: 2rem;
        color: #007bff;
    }
`;
document.head.appendChild(style);

// Initialize Font Awesome
if (!$('link[href*="font-awesome"]').length) {
    const fontAwesome = document.createElement("link");
    fontAwesome.rel = "stylesheet";
    fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";
    document.head.appendChild(fontAwesome);
}
