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
    fetch(baseUrl + '/server-time')
        .then(response => response.json())
        .then(data => {
            const timeString = data.time;
            const formattedDate = data.formatted_date;
            const dateString = data.date;

            // Update tampilan modal
            document.getElementById("date_attendance").textContent = formattedDate;
            document.getElementById("time_in").textContent = timeString;

            // Hapus input hidden lama
            document.querySelectorAll('input[name="date_attendance"], input[name="time_in"]').forEach(el => el.remove());

            // Tambahkan input hidden baru
            const hiddenDate = document.createElement('input');
            hiddenDate.type = 'hidden';
            hiddenDate.name = 'date_attendance';
            hiddenDate.value = dateString;
            document.getElementById('checkInForm').appendChild(hiddenDate);

            const hiddenTime = document.createElement('input');
            hiddenTime.type = 'hidden';
            hiddenTime.name = 'time_in';
            hiddenTime.value = timeString;
            document.getElementById('checkInForm').appendChild(hiddenTime);

            // Tampilkan modal
            const modal = new bootstrap.Modal(document.getElementById("checkInModal"));
            modal.show();
        })
        .catch(error => {
            console.error('Gagal ambil waktu server:', error);
        });
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
                            const lastAttendance = attendances[attendances.length - 1];

                            if (lastAttendance.type_attendance === "check_in" && !lastAttendance.time_out) {
                                // Last record is check-in without checkout, show checkout button
                                checkInBtn.style.display = "none";
                                checkOutBtn.style.display = "flex";

                                // Update hidden time fields
                                const checkInTimeInput = document.getElementById("checkInTime");
                                if (checkInTimeInput) {
                                    checkInTimeInput.value = lastAttendance.time_in;
                                }
                                return;
                            } else {
                                // Last record is checkout or fully checked out, show check-in button
                                checkInBtn.style.display = "flex";
                                checkOutBtn.style.display = "none";
                                return;
                            }
                        } else {
                            // No attendance today, show check-in button
                            checkInBtn.style.display = "flex";
                            checkOutBtn.style.display = "none";
                            return;
                        }
                    }

                    // If no attendance today, check latest unclosed check-in from previous days
                    if (latestData.status === "success" && latestData.data) {
                        const latestAttendance = latestData.data;
                        const latestDate = latestAttendance.date_attendance;

                        if (latestDate < today) {
                            checkInBtn.style.display = "none";
                            checkOutBtn.style.display = "flex";
                            // Set hidden checkInTime to latest check-in time
                            const checkInTimeInput = document.getElementById("checkInTime");
                            if (checkInTimeInput) {
                                checkInTimeInput.value = latestAttendance.time_in;
                            }
                            return;
                        }
                    }

                    // Default fallback: show check-in button
                    checkInBtn.style.display = "flex";
                    checkOutBtn.style.display = "none";
                });
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
    console.log("Rendering calendar for", month, year);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Update header
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    document.getElementById("currentMonthYear").textContent = `${monthNames[month]} ${year}`;

    // Clear previous days
    const calendarDays = document.getElementById("calendarDays");
    calendarDays.innerHTML = "";

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "calendar-day other-month";
        calendarDays.appendChild(emptyDay);
    }

    // Ambil employee_id
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
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
                    const day = date.getDate();

                    if (!attendanceData[day]) {
                        attendanceData[day] = {
                            hasCheckIn: true,
                            hasCheckOut: false
                        };
                    }

                    // Tandai check-in dan check-out terpisah
                    if (record.type_attendance === "check_in") {
                        attendanceData[day].hasCheckIn = true;
                    }
                    if (record.type_attendance === "check_out") {
                        attendanceData[day].hasCheckOut = true;
                    }
                });
            }

            console.log("Processed attendance data:", attendanceData);

            // Tambahkan hari-hari di bulan
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement("div");
                dayElement.className = "calendar-day";
                dayElement.textContent = day;

                const checkDate = new Date(year, month, day);
                if (checkDate.toDateString() === new Date().toDateString()) {
                    dayElement.classList.add("today");
                }

                // Tambahkan status check-in / check-out
                if (attendanceData[day]) {
                    const { hasCheckIn, hasCheckOut } = attendanceData[day];

                    if (hasCheckIn) {
                        dayElement.classList.add("checked-in");
                        const inLabel = document.createElement("span");
                        inLabel.className = "check-in-label";
                        inLabel.textContent = "In";
                        dayElement.appendChild(inLabel);
                    }

                    if (hasCheckOut) {
                        dayElement.classList.add("checked-out");
                        const outLabel = document.createElement("span");
                        outLabel.className = "check-out-label";
                        outLabel.textContent = "Out";
                        dayElement.appendChild(outLabel);
                    }
                }

                // Event klik
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

let stream = null;
let capturedImage = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeCameraFeatures();
});

function initializeCameraFeatures() {
  const cameraLabel = document.querySelector(".camera-label");
  const clearImageBtn = document.getElementById("clearImageBtn");
  const imageInput = document.getElementById("imageInput");
  const captureBtn = document.getElementById("captureBtn");

  if (cameraLabel) {
    cameraLabel.addEventListener("click", e => {
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

function startCamera() {
  const video = document.getElementById("cameraVideo");
  const cameraWrapper = document.getElementById("cameraWrapper");
  const modalBody = document.querySelector(".modal-body");
  const modalFooter = document.querySelector(".modal-footer");

  if (stream) return;

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(mediaStream => {
      stream = mediaStream;
      video.srcObject = mediaStream;
      video.onloadedmetadata = () => video.play();

      cameraWrapper.classList.remove("d-none");
      modalBody.classList.add("d-none");
      modalFooter.classList.add("d-none");
    })
    .catch(err => {
      console.error("Cannot access camera:", err);
      alert("Cannot access camera on this device.");
    });
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

  canvas.toBlob(blob => {
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    capturedImage = file;

    const reader = new FileReader();
    reader.onload = e => showImagePreview(e.target.result, file);
    reader.readAsDataURL(blob);
  }, "image/jpeg", 0.9);

  cameraWrapper.classList.add("d-none");
  modalBody.classList.remove("d-none");
  modalFooter.classList.remove("d-none");

  stopCamera();
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

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
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


// Inisialisasi ketika halaman siap
document.addEventListener("DOMContentLoaded", initializeCameraFeatures);


function submitCheckIn() {

    const form = document.getElementById("checkInForm");
    if (!form) return;

    // Validate form before submission
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    if (!employeeId) {
        showFloatingAlert("Employee ID not found. Please refresh the page.", "error");
        return;
    }

    const isWorkOutsideRadio = document.querySelector('input[name="is_work_outside"]:checked');
    if (!isWorkOutsideRadio) {
        showFloatingAlert("Please select whether you are working outside or not.", "error");
        return;
    }

    // Create new FormData
    const formData = new FormData();
    
    // Add required fields
    formData.append("employee_id", employeeId);
    formData.append("is_work_outside", isWorkOutsideRadio.value === "1" ? "1" : "0");
    formData.append("date_attendance", document.querySelector('input[name="date_attendance"]').value);
    formData.append("time_in", document.querySelector('input[name="time_in"]').value);
    formData.append("type_attendance", "check_in");
    
    // Add optional fields
    const noteTextarea = document.querySelector('textarea[name="note"]');
    if (noteTextarea && noteTextarea.value.trim()) {
        formData.append("note", noteTextarea.value.trim());
    }

    // Add captured image if exists
    if (capturedImage) {
        formData.append("image", capturedImage);
    } else {
        // Check if there's a file input
        const imageInput = document.getElementById("imageInput");
        if (imageInput && imageInput.files && imageInput.files[0]) {
            formData.append("image", imageInput.files[0]);
        }
    }

    // Add CSRF token
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    if (!csrfToken) {
        showFloatingAlert("CSRF token not found. Please refresh the page.", "error");
        return;
    }
    formData.append("_token", csrfToken);

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
            return response.json().then((data) => {
                if (!response.ok) {
                    // Handle validation errors
                    if (data.errors) {
                        const errorMessages = Object.values(data.errors).flat().join('\n');
                        throw new Error(errorMessages || data.message || 'Validation error');
                    }
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
                return data;
            });
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
    fetch(baseUrl + '/server-time')
        .then(response => response.json())
        .then(data => {
            const serverTime = data.time;       // HH:mm
            const serverDate = data.date;       // YYYY-MM-DD

            // Update hidden input
            document.getElementById("date_attendance").value = serverDate;
            document.getElementById("time_out").value = serverTime;

            // Update tampilan
            document.getElementById("time_out_display").textContent = serverTime;

            // Load check-in data dan hitung durasi kerja
            loadCheckInDataForCheckout(serverTime);
        })
        .catch(error => console.error('Gagal ambil waktu server:', error));

    // Tampilkan modal
    const modal = new bootstrap.Modal(document.getElementById("checkOutModal"));
    modal.show();
}

function calculateDuration24h(timeIn, timeOut) {
    if (!timeIn || !timeOut) return "0h 0m";

    const [inHour, inMin] = timeIn.split(":").map(Number);
    const [outHour, outMin] = timeOut.split(":").map(Number);

    let totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // handle overnight

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
}

function loadCheckInDataForCheckout(serverTime) {
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    if (!employeeId) return;

    const selectedDate = document.getElementById("currentDate")?.value || new Date().toISOString().split("T")[0];
    const url = `${baseUrl}/attendance/daily/${employeeId}/${selectedDate}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
                const checkInRecord = data.data.find(r => r.type_attendance === "check_in");
                if (!checkInRecord) return setCheckoutModalDefaults();

                populateCheckoutModal(checkInRecord, serverTime);
            } else {
                setCheckoutModalDefaults();
            }
        })
        .catch(() => setCheckoutModalDefaults());
}

// Fungsi populate modal checkout
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
    document.getElementById("workOutsideStatusText").textContent = "Not available";
    document.getElementById("time_in_display").textContent = "Not available";
    document.getElementById("total_work_duration").textContent = "0h 0m";

    const imageSection = document.getElementById("imageUploadSection");
    if (imageSection) imageSection.style.display = "none";
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
