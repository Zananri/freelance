// Attendance JavaScript for Dashboard - Identical to attendance.js
const baseUrl = $('meta[name="app-url"]').attr("content");

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
            showAlertDashboard(validation.message, "error");
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
            showAlertDashboard(validation.message, "error");
            return;
        }
        
        // Tampilkan informasi shift
        await displayShiftInfo(employeeId, today);
    }
    
    // Panggil fungsi asli
    originalOpenCheckOutModal();
};

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

$(document).ready(function () {
    initializeAttendance();
    // initializeCalendar();

    // Setup event listeners with DOM ready check
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupEventListeners);
    } else {
        setupEventListeners();
    }
});

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

            // Get current location and center map
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

                        // Set view dengan zoom yang lebih tinggi dan tambahkan marker di tengah
                        window.mapCheckIn.setView([latitude, longitude], 18);
                        L.marker([latitude, longitude]).addTo(window.mapCheckIn);
                        
                        // Update hidden inputs
                        document.getElementById('latitudeCheckIn').value = latitude;
                        document.getElementById('longitudeCheckIn').value = longitude;

                        // Force map resize untuk memastikan tampilan benar
                        setTimeout(() => {
                            window.mapCheckIn.invalidateSize();
                        }, 300);
                    }
                }, function (error) {
                    console.error('Error getting location:', error);
                    // Fallback ke default jika geolocation gagal
                    if (window.mapCheckIn && window.mapCheckIn.setView) {
                        setTimeout(() => {
                            window.mapCheckIn.invalidateSize();
                        }, 300);
                    }
                });
            } else {
                console.error('Geolocation is not supported by this browser.');
                // Fallback ke default jika geolocation tidak tersedia
                setTimeout(() => {
                    window.mapCheckIn.invalidateSize();
                }, 300);
            }

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
    
    // Tambahkan latitude dan longitude untuk location field
    const latitude = document.getElementById('latitudeCheckIn')?.value;
    const longitude = document.getElementById('longitudeCheckIn')?.value;
    if (latitude && longitude) {
        formData.append("latitude", latitude);
        formData.append("longitude", longitude);
    }

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

function showAlertDashboard(message, type = "success") {
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
    document.getElementById("workOutsideStatusText").textContent =
        workOutsideText;

    // Tampilkan time in
    document.getElementById("time_in_display").textContent =
        checkInRecord.time_in || "Not available";

    // Hitung durasi kerja dari time_in dan serverTime
    if (checkInRecord.time_in) {
        const totalDuration = calculateDuration24h(
            checkInRecord.time_in,
            serverTime
        );
        document.getElementById("total_work_duration").textContent =
            totalDuration;
    } else {
        document.getElementById("total_work_duration").textContent = "0h 0m";
    }

    // Show/hide image section berdasarkan work outside
    const imageSection = document.getElementById("imageUploadSection");
    if (imageSection) {
        imageSection.style.display = checkInRecord.is_work_outside
            ? "block"
            : "none";
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

document.addEventListener("DOMContentLoaded", () => {
    initializeCameraFeatures();
});

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
        cameraLabel.addEventListener("click", (e) => {
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

let stream = null;
let capturedImage = null;
