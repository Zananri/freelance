// Attendance JavaScript
const baseUrl =
    document.querySelector('meta[name="app-url"]')?.getAttribute("content") ||
    "";

// Pastikan Leaflet sudah dimuat sebelum inisialisasi
let mapCheckIn = null;
let mapCheckOut = null;

document.addEventListener("DOMContentLoaded", function () {
    // Tunggu hingga Leaflet tersedia
    const checkLeaflet = setInterval(() => {
        if (typeof L !== 'undefined') {
            clearInterval(checkLeaflet);
            initializeMaps();
            initializeAttendance();
        }
    }, 100);
});

function initializeMaps() {
    // Inisialisasi map dengan aman
    const mapCheckInEl = document.getElementById('mapCheckIn');
    const mapCheckOutEl = document.getElementById('mapCheckOut');

    if (mapCheckInEl && typeof L !== 'undefined') {
        if (!window.mapCheckIn || !window.mapCheckIn._container) {
            window.mapCheckIn = L.map('mapCheckIn').setView([0, 0], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(window.mapCheckIn);
        }
    }

    if (mapCheckOutEl && typeof L !== 'undefined') {
        if (!window.mapCheckOut || !window.mapCheckOut._container) {
            window.mapCheckOut = L.map('mapCheckOut').setView([0, 0], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(window.mapCheckOut);
        }
    }

    // Perbaikan Event Listener untuk Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const { latitude, longitude } = position.coords;

            // Pastikan map sudah diinisialisasi
            if (window.mapCheckIn && window.mapCheckIn.setView) {
                // Clear existing markers
                window.mapCheckIn.eachLayer(function (layer) {
                    if (layer instanceof L.Marker) {
                        window.mapCheckIn.removeLayer(layer);
                    }
                });

                // Set view dan tambahkan marker di tengah
                window.mapCheckIn.setView([latitude, longitude], 15);
                L.marker([latitude, longitude]).addTo(window.mapCheckIn);
                document.getElementById('latitudeCheckIn').value = latitude;
                document.getElementById('longitudeCheckIn').value = longitude;

                // Force map resize
                setTimeout(() => {
                    window.mapCheckIn.invalidateSize();
                }, 100);
            }

            if (window.mapCheckOut && window.mapCheckOut.setView) {
                // Clear existing markers
                window.mapCheckOut.eachLayer(function (layer) {
                    if (layer instanceof L.Marker) {
                        window.mapCheckOut.removeLayer(layer);
                    }
                });

                // Set view dan tambahkan marker di tengah
                window.mapCheckOut.setView([latitude, longitude], 15);
                L.marker([latitude, longitude]).addTo(window.mapCheckOut);
                document.getElementById('latitudeCheckOut').value = latitude;
                document.getElementById('longitudeCheckOut').value = longitude;

                // Force map resize
                setTimeout(() => {
                    window.mapCheckOut.invalidateSize();
                }, 100);
            }
        }, function (error) {
            console.error('Error getting location:', error);
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
};

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

// Fungsi untuk update waktu berjalan di modal check-in
function updateModalTime() {
    const now = new Date();

    // Format waktu untuk tampilan dengan detik (untuk UI)
    const displayTimeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    // Format waktu untuk server (tanpa detik)
    const serverTimeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
    });

    // Format tanggal untuk tampilan
    const dateString = now.toISOString().split("T")[0];
    const formattedDate = now.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    // Update tampilan di modal check-in (dengan detik)
    const dateDisplay = document.getElementById("date_attendance");
    const timeDisplay = document.getElementById("time_in");

    if (dateDisplay) dateDisplay.textContent = formattedDate;
    if (timeDisplay) timeDisplay.textContent = displayTimeString;

    // Update hidden inputs (format untuk server tanpa detik)
    let hiddenDate = document.querySelector('input[name="date_attendance"]');
    let hiddenTime = document.querySelector('input[name="time_in"]');

    if (!hiddenDate) {
        hiddenDate = document.createElement('input');
        hiddenDate.type = 'hidden';
        hiddenDate.name = 'date_attendance';
        document.getElementById('checkInForm').appendChild(hiddenDate);
    }

    if (!hiddenTime) {
        hiddenTime = document.createElement('input');
        hiddenTime.type = 'hidden';
        hiddenTime.name = 'time_in';
        document.getElementById('checkInForm').appendChild(hiddenTime);
    }

    hiddenDate.value = dateString;
    hiddenTime.value = serverTimeString;
}

// Fungsi untuk update waktu berjalan di modal check-out
function updateModalTimeCheckout() {
    const now = new Date();

    // Format waktu untuk tampilan dengan detik (untuk UI)
    const displayTimeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    // Format waktu untuk server (tanpa detik)
    const serverTimeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
    });

    // Format tanggal untuk tampilan
    const dateString = now.toISOString().split("T")[0];
    const formattedDate = now.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    // Update tampilan di modal check-out (dengan detik)
    const dateDisplay = document.getElementById("date_attendance_checkout");
    const timeDisplay = document.getElementById("time_out");

    if (dateDisplay) dateDisplay.textContent = formattedDate;
    if (timeDisplay) timeDisplay.textContent = displayTimeString;

    // Update hidden inputs (format untuk server tanpa detik)
    let hiddenDate = document.querySelector('input[name="date_attendance"]');
    let hiddenTime = document.querySelector('input[name="time_out"]');

    if (!hiddenDate) {
        hiddenDate = document.createElement('input');
        hiddenDate.type = 'hidden';
        hiddenDate.name = 'date_attendance';
        document.getElementById('checkOutForm').appendChild(hiddenDate);
    }

    if (!hiddenTime) {
        hiddenTime = document.createElement('input');
        hiddenTime.type = 'hidden';
        hiddenTime.name = 'time_out';
        document.getElementById('checkOutForm').appendChild(hiddenTime);
    }

    hiddenDate.value = dateString;
    hiddenTime.value = serverTimeString;
}

// Function to open the check-in modal dengan waktu berjalan
function openCheckInModal() {
    // Update waktu berjalan
    updateModalTime();

    // Reset pilihan radio dan visibilitas imageUploadSection
    const workOutsideNo = document.getElementById("work_outside_no");
    const imageUploadSection = document.getElementById("imageUploadSection");

    if (workOutsideNo) workOutsideNo.checked = true;
    if (imageUploadSection) imageUploadSection.style.display = "none";

    // Get current location and zoom map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const { latitude, longitude } = position.coords;

            // Pastikan map sudah diinisialisasi
            if (window.mapCheckIn && window.mapCheckIn.setView) {
                // Clear existing markers
                window.mapCheckIn.eachLayer(function (layer) {
                    if (layer instanceof L.Marker) {
                        window.mapCheckIn.removeLayer(layer);
                    }
                });

                // Set view dan tambahkan marker di tengah
                window.mapCheckIn.setView([latitude, longitude], 18);
                const marker = L.marker([latitude, longitude]).addTo(window.mapCheckIn);

                // Pastikan marker di tengah map
                window.mapCheckIn.panTo([latitude, longitude]);

                document.getElementById('latitudeCheckIn').value = latitude;
                document.getElementById('longitudeCheckIn').value = longitude;

                // Force map resize untuk memastikan tampilan benar
                setTimeout(() => {
                    window.mapCheckIn.invalidateSize();
                }, 500);
            }
        }, function (error) {
            console.error('Error getting location:', error);
        });
    }

    const modal = new bootstrap.Modal(document.getElementById("checkInModal"));
    modal.show();

    // Set interval untuk update waktu setiap detik
    const timeInterval = setInterval(updateModalTime, 1000);

    // Clear interval saat modal ditutup
    document.getElementById("checkInModal").addEventListener('hidden.bs.modal', function() {
        clearInterval(timeInterval);
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
  document.querySelectorAll('input[name="date_attendance"], input[name="time_in"]').forEach(el => el.remove());

  // Reset date/time display
  document.getElementById("date_attendance").textContent = "Loading...";
  document.getElementById("time_in").textContent = "Loading...";
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

                        // Cek apakah ada check-in yang belum ditutup dari hari sebelumnya
                        if (latestData.status === "success" && latestData.data) {
                            const lastCheckIn = latestData.data;
                            const checkInDate = lastCheckIn.date_attendance;

                            // Cek data attendance hari ini
                            if (todayData.status === "success" && Array.isArray(todayData.data)) {
                                const todayAttendances = todayData.data;

                                if (todayAttendances.length > 0) {
                                    // Ada aktivitas hari ini
                                    const lastTodayAttendance = todayAttendances[todayAttendances.length - 1];

                                    if (lastTodayAttendance.type_attendance === "check_in" && !lastTodayAttendance.time_out) {
                                        // Sudah check-in hari ini, tampilkan tombol checkout
                                        checkInBtn.style.display = "flex";
                                        checkOutBtn.style.display = "flex";
                                        return;
                                    } else if (lastTodayAttendance.type_attendance === "check_out") {
                                        // Sudah checkout hari ini, tampilkan tombol check-in untuk shift berikutnya
                                        checkInBtn.style.display = "flex";
                                        checkOutBtn.style.display = "flex";
                                        return;
                                    }
                                }
                            }

                            if (checkInDate < today) {
                                // Ada check-in yang belum ditutup dari hari sebelumnya
                                console.warn("You forgot to check out yesterday, please contact HR.");

                                // Tampilkan tombol check-in untuk hari ini
                                checkInBtn.style.display = "flex";
                                checkOutBtn.style.display = "flex";

                                // Hanya tampilkan alert di halaman dashboard
                                if (window.location.href.includes('/dashboard')) {
                                    const alertKey = `attendanceAlertShown_${today}`;

                                    // Cek jika alert belum ditampilkan hari ini
                                    if (!localStorage.getItem(alertKey)) {
                                        // Tampilkan pesan warning sekali
                                        showFloatingAlert(
                                            `You forgot to check out yesterday. Please contact HR and check in for today.`,
                                            "warning"
                                        ).setTimeout(5000);

                                        // Tandai alert sudah ditampilkan untuk hari ini
                                        localStorage.setItem(alertKey, "true");
                                    }
                                }
                                return;
                            }
                        }

                        // Handle missing or invalid data
                        if (!todayData.data || !Array.isArray(todayData.data)) {
                            console.warn("No attendance record found for today.");
                            checkInBtn.style.display = "flex";
                            checkOutBtn.style.display = "flex";
                            return;
                        }

                        const attendances = todayData.data;

                        if (attendances.length > 0) {
                            const lastAttendance = attendances[attendances.length - 1];

                            if (lastAttendance.type_attendance === "check_in" && !lastAttendance.time_out) {
                                // Last record is check-in without checkout, show checkout button
                                checkInBtn.style.display = "flex";
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
                                checkOutBtn.style.display = "flex";
                                return;
                            }
                        } else {
                            // No attendance today, show check-in button
                            checkInBtn.style.display = "flex";
                            checkOutBtn.style.display = "flex";
                            return;
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching today's attendance data:", error);
                    });
            })
            .catch((error) => {
                console.error("Error fetching latest unclosed attendance data:", error);
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

// Enhanced showFloatingAlert with proper styling and fallback
function showFloatingAlert(message, type = "success") {
    const alertDiv = document.createElement("div");
    
    // Ensure proper Bootstrap classes and fallback styling
    let alertClass = `alert alert-${type}`;
    let iconClass = "fa-exclamation-triangle";
    let bgColor = "#ffc107"; // Default warning
    
    switch(type) {
        case "success":
            alertClass = "alert alert-success";
            iconClass = "fa-check-circle";
            bgColor = "#d4edda";
            break;
        case "warning":
            alertClass = "alert alert-warning";
            iconClass = "fa-exclamation-triangle";
            bgColor = "#fff3cd";
            break;
        case "error":
            alertClass = "alert alert-danger";
            iconClass = "fa-times-circle";
            bgColor = "#f8d7da";
            break;
    }

    alertDiv.className = `${alertClass} d-flex align-items-center task-status-alert`;
    alertDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        opacity: 1;
        transition: opacity 0.5s ease;
        background-color: ${bgColor} !important;
        border: 1px solid ${type === 'warning' ? '#ffeaa7' : type === 'success' ? '#c3e6cb' : '#f5c6cb'} !important;
        color: ${type === 'warning' ? '#856404' : type === 'success' ? '#155724' : '#721c24'} !important;
    `;

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

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

function initializeCameraFeatures() {
  const cameraLabel = document.querySelector(".camera-label");
  const clearImageBtn = document.getElementById("clearImageBtn");
  const imageInput = document.getElementById("imageInput");
  const captureBtn = document.getElementById("captureBtn");
  const checkInModalEl = document.getElementById("checkInModal");

  if (checkInModalEl) {
    checkInModalEl.addEventListener("hidden.bs.modal", resetCheckInModal);
  }

  if (cameraLabel) {
    cameraLabel.addEventListener("click", e => {
      if (!isMobileDevice()) {
        e.preventDefault(); // only prevent default on desktop
        startCamera();
      }
    });
  }

  if (clearImageBtn) clearImageBtn.addEventListener("click", clearImage);
  if (imageInput) imageInput.addEventListener("change", handleImagePreview);
  if (captureBtn) captureBtn.addEventListener("click", capturePhoto);
}

function startCamera() {
  const video = document.getElementById("cameraVideo");
  const cameraWrapper = document.getElementById("cameraWrapper");
  const modalContent = document.querySelector(".modal-content");
  const modalHeader = document.querySelector(".modal-header");
  const modalFooter = document.querySelector(".modal-footer");
  const modalBody = document.querySelector(".modal-body");

  if (stream) return;

  modalContent?.classList.add("camera-active");
  modalHeader?.classList.add("d-none");
  modalFooter?.classList.add("d-none");
  modalBody?.classList.add("d-none");

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(mediaStream => {
      stream = mediaStream;
      video.srcObject = mediaStream;
      video.onloadedmetadata = () => video.play();
      cameraWrapper.classList.remove("d-none");
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
  const modalContent = document.querySelector(".modal-content");
  const modalHeader = document.querySelector(".modal-header");
  const modalFooter = document.querySelector(".modal-footer");
  const modalBody = document.querySelector(".modal-body");

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
  modalHeader?.classList.remove("d-none");
  modalFooter?.classList.remove("d-none");
  modalBody?.classList.remove("d-none");
  modalContent?.classList.remove("camera-active");

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
  cameraLabel.style.display = "none";
  clearBtn.classList.remove("d-none");

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
  const modalContent = document.querySelector(".modal-content");

  previewImg.src = "";
  preview.style.display = "none";
  cameraLabel.style.display = "flex";
  imageInput.value = "";
  video.style.display = "block";
  captureBtn.classList.remove("d-none");
  clearBtn.classList.add("d-none");
  modalContent?.classList.remove("camera-active");

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
  reader.onload = e => showImagePreview(e.target.result, file);
  reader.readAsDataURL(file);
}

function resetCheckInModal() {
  clearImage();
}

// Inisialisasi ketika halaman siap
document.addEventListener("DOMContentLoaded", initializeCameraFeatures);

function submitCheckIn() {
    const form = document.getElementById("checkInForm");
    if (!form) return;

    // Validate employeeId
    const employeeIdInput = document.querySelector('input[name="employee_id"]');
    if (!employeeIdInput || !employeeIdInput.value) {
        console.error("Employee ID not found or is empty.");
        showFloatingAlert("Employee ID is missing. Please refresh the page.", "error");
        return;
    }
    const employeeId = employeeIdInput.value;

    const formData = new FormData(form);

    // Add latitude and longitude for check-in
    const latitude = document.getElementById("latitudeCheckIn").value;
    const longitude = document.getElementById("longitudeCheckIn").value;
    formData.append("latitudeCheckIn", latitude);
    formData.append("longitudeCheckIn", longitude);

    // Add employee ID
    formData.append("employee_id", employeeId);

    // Add required fields
    const isWorkOutsideRadio = document.querySelector('input[name="is_work_outside"]:checked');
    if (!isWorkOutsideRadio) {
        console.error("Work outside selection is missing.");
        showFloatingAlert("Please select if you are working outside.", "error");
        return;
    }
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

// Fungsi untuk mendapatkan informasi shift karyawan
async function getEmployeeShiftDetails(employeeId, date) {
    try {
        const response = await fetch(`${baseUrl}/attendance/shift-details/${employeeId}/${date}`);
        const data = await response.json();
        
        if (data.status === "success") {
            return data.data;
        } else {
            console.error("Error fetching shift details:", data.message);
            return null;
        }
    } catch (error) {
        console.error("Network error:", error);
        return null;
    }
}

// Fungsi untuk validasi waktu check-in berdasarkan shift
async function validateCheckInTime(employeeId, date) {
    const shiftDetails = await getEmployeeShiftDetails(employeeId, date);
    
    if (!shiftDetails) {
        return {
            valid: false,
            message: "No shift assigned for this date"
        };
    }

    const currentTime = new Date();
    const [currentHour, currentMinute] = [currentTime.getHours(), currentTime.getMinutes()];
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const minCheckInTime = shiftDetails.min_checkin_time;
    const maxCheckInTime = shiftDetails.max_checkin_time;
    
    // Convert time strings to minutes for comparison
    const currentMinutes = currentHour * 60 + currentMinute;
    const minMinutes = parseInt(minCheckInTime.split(':')[0]) * 60 + parseInt(minCheckInTime.split(':')[1]);
    
    if (currentMinutes < minMinutes) {
        return {
            valid: false,
            message: `Check-in not allowed. You can only check-in 1 hour before your shift starts at ${shiftDetails.time_start}`
        };
    }
    
    // Tidak ada batasan maksimum untuk check-in setelah shift dimulai
    
    return {
        valid: true,
        message: "Check-in time is valid",
        shiftDetails: shiftDetails
    };
}

// Fungsi untuk validasi waktu check-out berdasarkan shift
async function validateCheckOutTime(employeeId, date) {
    const shiftDetails = await getEmployeeShiftDetails(employeeId, date);
    
    if (!shiftDetails) {
        return {
            valid: false,
            message: "No shift assigned for this date"
        };
    }

    const currentTime = new Date();
    const [currentHour, currentMinute] = [currentTime.getHours(), currentTime.getMinutes()];
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const minCheckOutTime = shiftDetails.min_checkout_time;
    
    // Convert time strings to minutes for comparison
    const currentMinutes = currentHour * 60 + currentMinute;
    const minMinutes = parseInt(minCheckOutTime.split(':')[0]) * 60 + parseInt(minCheckOutTime.split(':')[1]);
    
    if (currentMinutes < minMinutes) {
        return {
            valid: false,
            message: `Check-out not allowed. You can only check-out after ${minCheckOutTime}`
        };
    }
    
    return {
        valid: true,
        message: "Check-out time is valid",
        shiftDetails: shiftDetails
    };
}

// Fungsi untuk menampilkan informasi shift di modal
async function displayShiftInfo(employeeId, date) {
    const shiftDetails = await getEmployeeShiftDetails(employeeId, date);
    
    if (shiftDetails) {
        const shiftInfoDiv = document.getElementById("shiftInfo");
        if (shiftInfoDiv) {
            shiftInfoDiv.innerHTML = `
                <div class="alert alert-info">
                    <strong>Shift Information:</strong><br>
                    Time Start: ${shiftDetails.time_start}<br>
                    Time End: ${shiftDetails.time_end}<br>
                    Check-in allowed: ${shiftDetails.min_checkin_time} - ${shiftDetails.max_checkin_time}<br>
                    Check-out allowed: After ${shiftDetails.min_checkout_time}
                </div>
            `;
        }
    }
}

// Override fungsi openCheckInModal untuk menambahkan validasi
const originalOpenCheckInModal = openCheckInModal;
openCheckInModal = async function() {
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    const today = new Date().toISOString().split("T")[0];
    
    if (employeeId) {
        const validation = await validateCheckInTime(employeeId, today);
        
        if (!validation.valid) {
            showFloatingAlert(validation.message, "error");
            return;
        }
        
        // Tampilkan informasi shift
        await displayShiftInfo(employeeId, today);
    }
    
    // Panggil fungsi asli
    originalOpenCheckInModal();
};

// Override fungsi openCheckOutModal untuk menambahkan validasi
const originalOpenCheckOutModal = openCheckOutModal;
openCheckOutModal = async function() {
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    const today = new Date().toISOString().split("T")[0];
    
    if (employeeId) {
        const validation = await validateCheckOutTime(employeeId, today);
        
        if (!validation.valid) {
            showFloatingAlert(validation.message, "error");
            return;
        }
        
        // Tampilkan informasi shift
        await displayShiftInfo(employeeId, today);
    }
    
    // Panggil fungsi asli
    originalOpenCheckOutModal();
};

// Checkout Modal Functions
let checkoutStream = null;
let checkoutCapturedImage = null;

function openCheckOutModal() {
    // Update waktu berjalan
    updateModalTimeCheckout();

    // Load check-in data and set dateAttendance
    loadCheckInDataForCheckout();

    // Get current location and zoom map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
          const { latitude, longitude } = position.coords;

          // Pastikan map sudah diinisialisasi
          if (window.mapCheckOut && window.mapCheckOut.setView) {
            // Clear existing markers
            window.mapCheckOut.eachLayer(function (layer) {
              if (layer instanceof L.Marker) {
                window.mapCheckOut.removeLayer(layer);
              }
            });

            // Set view dan tambahkan marker di tengah
            window.mapCheckOut.setView([latitude, longitude], 18);
            const marker = L.marker([latitude, longitude]).addTo(window.mapCheckOut);

            // Pastikan marker di tengah map
            window.mapCheckOut.panTo([latitude, longitude]);

            document.getElementById('latitudeCheckOut').value = latitude;
            document.getElementById('longitudeCheckOut').value = longitude;

            // Force map resize untuk memastikan tampilan benar
            setTimeout(() => {
                window.mapCheckOut.invalidateSize();
            }, 500);
          }
        }, function (error) {
          console.error('Error getting location:', error);
        });
    }

    // Tampilkan modal
    const modal = new bootstrap.Modal(document.getElementById("checkOutModal"));
    modal.show();

    // Set interval untuk update waktu setiap detik
    const timeInterval = setInterval(updateModalTimeCheckout, 1000);

    // Clear interval saat modal ditutup
    document.getElementById("checkOutModal").addEventListener('hidden.bs.modal', function() {
        clearInterval(timeInterval);
    });
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
    if (!employeeId) {
        console.error("Employee ID not found");
        showFloatingAlert("Employee ID not found. Please refresh the page.", "error");
        return;
    }

    // Set dateAttendance dengan tanggal hari ini
    const today = new Date().toISOString().split("T")[0];
    const dateAttendanceInput = document.getElementById("date_attendance");
    if (dateAttendanceInput) {
        dateAttendanceInput.value = today;
    }

    const url = `${baseUrl}/attendance/daily/${employeeId}/${today}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
                const checkInRecord = data.data.find(r => r.type_attendance === "check_in");
                if (!checkInRecord) {
                    console.error("No check-in record found");
                    showFloatingAlert("No check-in record found for today.", "error");
                    return setCheckoutModalDefaults();
                }

                populateCheckoutModal(checkInRecord, serverTime);
            } else {
                console.warn("No attendance data found");
                showFloatingAlert("No attendance data found for today.", "error");
                setCheckoutModalDefaults();
            }
        })
        .catch(error => {
            console.error("Error loading check-in data:", error);
            showFloatingAlert("Error loading check-in data. Please try again.", "error");
            setCheckoutModalDefaults();
        });
}

// Fungsi populate modal checkout
function populateCheckoutModal(checkInRecord, serverTime) {
    try {
        // Tampilkan status work outside
        const workOutsideText = checkInRecord.is_work_outside ? "Yes" : "No";
        const workOutsideStatusEl = document.getElementById("workOutsideStatusText");
        if (workOutsideStatusEl) {
            workOutsideStatusEl.textContent = workOutsideText;
        }

        // Set hidden field for work outside status
        const workOutsideInput = document.getElementById("is_work_outside_checkout");
        if (workOutsideInput) {
            workOutsideInput.value = checkInRecord.is_work_outside ? "1" : "0";
        }

        // Tampilkan time in
        const timeInDisplay = document.getElementById("time_in_display");
        if (timeInDisplay) {
            timeInDisplay.textContent = checkInRecord.time_in || "Not available";
        }

        // Simpan time_in untuk referensi
        const timeInHidden = document.getElementById("time_in");
        if (timeInHidden) {
            timeInHidden.value = checkInRecord.time_in;
        }

        // Hitung durasi kerja dari time_in dan serverTime
        if (checkInRecord.time_in && serverTime) {
            const totalDuration = calculateDuration24h(checkInRecord.time_in, serverTime);
            const durationEl = document.getElementById("total_work_duration");
            if (durationEl) {
                durationEl.textContent = totalDuration;
            }
        }

        // Show/hide image section berdasarkan work outside
        const imageSection = document.getElementById("imageUploadSectionCheckout");
        if (imageSection) {
            imageSection.style.display = checkInRecord.is_work_outside ? "block" : "none";
        }

        // Enable submit button
        const submitBtn = document.getElementById("submitCheckOutBtn");
        if (submitBtn) {
            submitBtn.disabled = false;
        }

    } catch (error) {
        console.error("Error populating checkout modal:", error);
        showFloatingAlert("Error loading checkout data. Please try again.", "error");
        setCheckoutModalDefaults();
    }
}

function setCheckoutModalDefaults() {
    document.getElementById("workOutsideStatusText").textContent = "Not available";
    document.getElementById("time_in_display").textContent = "Not available";
    document.getElementById("total_work_duration").textContent = "0h 0m";

    const imageSection = document.getElementById("imageUploadSectionCheckout");
    if (imageSection) imageSection.style.display = "none";
}

// Initialize checkout camera features
function initializeCheckoutCameraFeatures() {
    const cameraLabelCheckout = document.querySelector(".camera-label[for='imageInputCheckout']");
    const clearImageBtnCheckout = document.getElementById("clearImageBtnCheckout");
    const imageInputCheckout = document.getElementById("imageInputCheckout");
    const captureBtnCheckout = document.getElementById("captureBtnCheckout");
    const checkOutModalEl = document.getElementById("checkOutModal");

    if (checkOutModalEl) {
        checkOutModalEl.addEventListener("hidden.bs.modal", resetCheckoutModal);
    }

    if (cameraLabelCheckout) {
        cameraLabelCheckout.addEventListener("click", e => {
            if (!isMobileDevice()) {
                e.preventDefault();
                startCheckoutCamera();
            }
        });
    }

    if (clearImageBtnCheckout) clearImageBtnCheckout.addEventListener("click", clearCheckoutImage);
    if (imageInputCheckout) imageInputCheckout.addEventListener("change", handleCheckoutImagePreview);
    if (captureBtnCheckout) captureBtnCheckout.addEventListener("click", captureCheckoutPhoto);
}

// Camera functions for checkout
function startCheckoutCamera() {
    const video = document.getElementById("cameraVideoCheckout");
    const cameraWrapper = document.getElementById("cameraWrapperCheckout");
    const modalContent = document.getElementById("checkOutModalContent");
    const modalHeader = document.querySelector("#checkOutModal .modal-header");
    const modalFooter = document.querySelector("#checkOutModal .modal-footer");
    const modalBody = document.querySelector("#checkOutModal .modal-body");

    if (checkoutStream) return;

    modalContent?.classList.add("camera-active");
    modalHeader?.classList.add("d-none");
    modalFooter?.classList.add("d-none");
    modalBody?.classList.add("d-none");

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(mediaStream => {
            checkoutStream = mediaStream;
            video.srcObject = mediaStream;
            video.onloadedmetadata = () => video.play();
            cameraWrapper.classList.remove("d-none");
        })
        .catch(err => {
            console.error("Cannot access camera:", err);
            alert("Cannot access camera on this device.");
        });
}

function captureCheckoutPhoto() {
    const video = document.getElementById("cameraVideoCheckout");
    const canvas = document.getElementById("cameraCanvasCheckout");
    const cameraWrapper = document.getElementById("cameraWrapperCheckout");
    const modalContent = document.getElementById("checkOutModalContent");
    const modalHeader = document.querySelector("#checkOutModal .modal-header");
    const modalFooter = document.querySelector("#checkOutModal .modal-footer");
    const modalBody = document.querySelector("#checkOutModal .modal-body");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        checkoutCapturedImage = file;

        const reader = new FileReader();
        reader.onload = e => showCheckoutImagePreview(e.target.result, file);
        reader.readAsDataURL(blob);
    }, "image/jpeg", 0.9);

    cameraWrapper.classList.add("d-none");
    modalHeader?.classList.remove("d-none");
    modalFooter?.classList.remove("d-none");
    modalBody?.classList.remove("d-none");
    modalContent?.classList.remove("camera-active");

    stopCheckoutCamera();
}

function showCheckoutImagePreview(src, file = null) {
    const preview = document.getElementById("imagePreviewCheckout");
    const previewImg = document.getElementById("previewImgCheckout");
    const cameraLabel = document.querySelector(".camera-label[for='imageInputCheckout']");
    const imageInput = document.getElementById("imageInputCheckout");
    const video = document.getElementById("cameraVideoCheckout");
    const captureBtn = document.getElementById("captureBtnCheckout");
    const clearBtn = document.getElementById("clearImageBtnCheckout");

    if (!preview || !previewImg) return;

    previewImg.src = src;
    preview.style.display = "block";

    video.style.display = "none";
    captureBtn.classList.add("d-none");
    cameraLabel.style.display = "none";
    clearBtn.classList.remove("d-none");

    if (file && imageInput) {
        const dt = new DataTransfer();
        dt.items.add(file);
        imageInput.files = dt.files;
    }
}

function clearCheckoutImage() {
    const preview = document.getElementById("imagePreviewCheckout");
    const previewImg = document.getElementById("previewImgCheckout");
    const cameraLabel = document.querySelector(".camera-label[for='imageInputCheckout']");
    const imageInput = document.getElementById("imageInputCheckout");
    const video = document.getElementById("cameraVideoCheckout");
    const captureBtn = document.getElementById("captureBtnCheckout");
    const clearBtn = document.getElementById("clearImageBtnCheckout");
    const modalContent = document.getElementById("checkOutModalContent");

    previewImg.src = "";
    preview.style.display = "none";
    cameraLabel.style.display = "flex";
    imageInput.value = "";
    video.style.display = "block";
    captureBtn.classList.remove("d-none");
    clearBtn.classList.add("d-none");
    modalContent?.classList.remove("camera-active");

    stopCheckoutCamera();
}

function stopCheckoutCamera() {
    if (checkoutStream) {
        checkoutStream.getTracks().forEach(track => track.stop());
        checkoutStream = null;
    }
}

function handleCheckoutImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => showCheckoutImagePreview(e.target.result, file);
    reader.readAsDataURL(file);
}

function resetCheckoutModal() {
    clearCheckoutImage();
}

// Updated submit check-out function
function submitCheckOut() {
    const form = document.getElementById("checkOutForm");
    if (!form) {
        console.error("Check out form not found");
        return;
    }

    // Get current time for checkout
    const now = new Date();
    const serverTimeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
    });

    // Get and validate all required fields
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    const dateAttendance = document.getElementById('date_attendance')?.value || now.toISOString().split("T")[0];
    
    if (!employeeId) {
        console.error("Employee ID is missing");
        showFloatingAlert("Employee ID is missing. Please refresh the page.", "error");
        return;
    }

    const formData = new FormData(form);

    // Ensure all required fields are properly set
    formData.set("employee_id", employeeId);
    formData.set("date_attendance", dateAttendance);
    formData.set("time_out", serverTimeString);
    formData.set("type_attendance", "check_out");
    
    // Get work outside value
    const isWorkOutsideValue = document.getElementById("is_work_outside_checkout")?.value || "0";
    formData.set("is_work_outside", isWorkOutsideValue);

    // Add latitude and longitude for check-out
    const latitude = document.getElementById("latitudeCheckOut")?.value;
    const longitude = document.getElementById("longitudeCheckOut")?.value;

    if (!latitude || !longitude) {
        console.error("Location coordinates are missing");
        showFloatingAlert("Could not get your location. Please refresh and try again.", "error");
        return;
    }

    formData.set("latitude", latitude);
    formData.set("longitude", longitude);

    // Add captured image if exists and if work outside
    if (isWorkOutsideValue === "1") {
        if (checkoutCapturedImage) {
            formData.append("image", checkoutCapturedImage);
        } else {
            // Check if there's a file input
            const imageInput = document.getElementById("imageInputCheckout");
            if (imageInput && imageInput.files && imageInput.files[0]) {
                formData.append("image", imageInput.files[0]);
            }
        }
    }

    // Add optional note if exists
    const noteTextarea = document.querySelector('textarea[name="note"]');
    if (noteTextarea && noteTextarea.value.trim()) {
        formData.append("note", noteTextarea.value.trim());
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

                // Reset form
                form.reset();
                resetCheckoutModal();

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

// Initialize checkout camera features on DOM ready
document.addEventListener("DOMContentLoaded", function() {
    initializeCheckoutCameraFeatures();
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
