// Attendance JavaScript for Dashboard - Identical to attendance.js
// Pastikan baseUrl didefinisikan dengan fallback
const baseUrl = document.querySelector('meta[name="app-url"]')?.getAttribute('content') || 
                $('meta[name="app-url"]').attr("content") || 
                window.location.origin;

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

// Run once on initial load to set chevron visibility correctly
document.addEventListener('DOMContentLoaded', function () {
    try { updateChevronVisibility(); } catch (e) {}
});

// Fungsi untuk validasi waktu check-in berdasarkan shift
async function validateCheckInTime(employeeId, date) {
    const shiftDetails = await getEmployeeShiftDetails(employeeId, date);
    // If no shift details available, allow check-in without blocking
    if (!shiftDetails) {
        return { valid: true, message: "", shiftDetails: null };
    }

    const currentTime = new Date();
    const [currentHour, currentMinute] = [currentTime.getHours(), currentTime.getMinutes()];
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const minCheckInTime = shiftDetails.min_checkin_time;
    const maxCheckInTime = shiftDetails.max_checkin_time;
    
    // Convert time strings to minutes for comparison
    const currentMinutes = currentHour * 60 + currentMinute;
    // Enforce minimum only if we have minCheckInTime
    if (minCheckInTime) {
        const minParts = minCheckInTime.split(':');
        if (minParts.length >= 2) {
            const minMinutes = parseInt(minParts[0]) * 60 + parseInt(minParts[1]);
            if (currentMinutes < minMinutes) {
                return {
                    valid: false,
                    message: `Check-in not allowed. You can only check-in 1 hour before your shift starts at ${shiftDetails.time_start}`
                };
            }
        }
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
    // If no shift details available, allow checkout without blocking
    if (!shiftDetails) {
        return { valid: true, message: "", shiftDetails: null };
    }

    const currentTime = new Date();
    const [currentHour, currentMinute] = [currentTime.getHours(), currentTime.getMinutes()];
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const minCheckOutTime = shiftDetails.min_checkout_time;
    
    // Convert time strings to minutes for comparison
    const currentMinutes = currentHour * 60 + currentMinute;
    // Enforce minimum only if we have minCheckOutTime
    if (minCheckOutTime) {
        const minParts = minCheckOutTime.split(':');
        if (minParts.length >= 2) {
            const minMinutes = parseInt(minParts[0]) * 60 + parseInt(minParts[1]);
            if (currentMinutes < minMinutes) {
                return {
                    valid: false,
                    message: `Check-out not allowed. You can only check-out after ${minCheckOutTime}`
                };
            }
        }
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

function initializeAttendance() {
    // Set current date
    const today = new Date();
    const currentDateInput = document.getElementById("currentDate");
    if (currentDateInput) {
        currentDateInput.value = today.toISOString().split("T")[0];
    }

    // Get attendance status immediately - this will call updateButtonStates()
    // This is sufficient as it provides all the necessary state information
    getTodayAttendanceStatus();
}

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
    // Check in/out button - open detail when active, otherwise open check-in modal
    const checkInBtn = document.getElementById("checkInBtn");
    if (checkInBtn) {
        checkInBtn.addEventListener("click", function () {
            try {
                if (checkInBtn.classList.contains('active')) {
                    // If already checked in (active), show detail modal
                    openCheckInDetailModal();
                } else {
                    // Otherwise, open check-in form
                    openCheckInModal();
                }
            } catch (err) {
                console.error('Error handling checkInBtn click:', err);
                openCheckInModal();
            }
        });
    }

    // Check out button
    const checkOutBtn = document.getElementById("checkOutBtn");
    if (checkOutBtn) {
        checkOutBtn.addEventListener("click", function () {
            try {
                // If user hasn't checked in yet, show alert instead of opening modal
                const currentStatus = (window.AttendanceState && window.AttendanceState.currentStatus) ? window.AttendanceState.currentStatus.status : undefined;
                if (currentStatus === 'not_started') {
                    showAlertDashboard("You have not checked in yet.", "warning");
                    return;
                }
                if (checkOutBtn.classList.contains('active')) {
                    // If already checked out (active), show detail modal
                    openCheckOutDetailModal();
                } else {
                    // Otherwise, open check-out form
                    openCheckOutModal();
                }
            } catch (err) {
                console.error('Error handling checkOutBtn click:', err);
                openCheckOutModal();
            }
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

    // Chevron detail buttons - use event delegation
    document.body.addEventListener('click', function (e) {
        // Handle chevron buttons
        const chevronBtn = e.target.closest && e.target.closest('.chevron-detail-btn');
        if (chevronBtn) {
            const type = chevronBtn.getAttribute('data-type');
            if (type === 'in') openCheckInDetailModal();
            else if (type === 'out') openCheckOutDetailModal();
            return;
        }

        // Handle clicking on the time text/area itself
        const timeBtn = e.target.closest && e.target.closest('.time-detail-btn');
        if (timeBtn) {
            const type = timeBtn.getAttribute('data-type');
            // Only open modal if time text exists
            const span = timeBtn.querySelector('span');
            const txt = span ? (span.textContent || '').trim() : '';
            if (!txt || txt === 'Loading...' || txt === '--:--') return;
            if (type === 'in') openCheckInDetailModal();
            else if (type === 'out') openCheckOutDetailModal();
        }
    });
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

// Cache untuk shift data
let shiftCache = {};

// Fungsi untuk mengambil dan menampilkan shift time
function updateShiftDisplay(employeeId, date, modalType = 'checkin') {
    console.log('updateShiftDisplay called with:', { employeeId, date, modalType });
    
    if (!employeeId || !date) {
        console.warn('Missing employeeId or date:', { employeeId, date });
        return;
    }

    const shiftDisplay = document.getElementById(modalType === 'checkin' ? 'shift_time_checkin' : 'shift_time_checkout');
    if (!shiftDisplay) {
        console.warn('Shift display element not found:', modalType === 'checkin' ? 'shift_time_checkin' : 'shift_time_checkout');
        return;
    }

    // Check cache first
    const cacheKey = `${employeeId}_${date}`;
    if (shiftCache[cacheKey]) {
        console.log('Using cached shift data:', shiftCache[cacheKey]);
        shiftDisplay.textContent = shiftCache[cacheKey];
        return;
    }

    // Set loading only if not cached
    shiftDisplay.textContent = 'Loading shift...';
    console.log('Fetching shift data from:', `${baseUrl}/attendance/today/${employeeId}`);

    const url = `${baseUrl}/attendance/today/${employeeId}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Shift data response:', data);
        if (data.status === 'success' && data.data && data.data.length > 0) {
                const attendanceData = data.data[0];
                if (attendanceData.shift_start && attendanceData.shift_end) {
                    const shiftText = `${attendanceData.shift_start} - ${attendanceData.shift_end}`;
                    shiftDisplay.textContent = shiftText;
                    shiftCache[cacheKey] = shiftText;
                    console.log('Shift display updated:', shiftText);
                } else {
            const shiftText = '-';
            shiftDisplay.textContent = shiftText;
            shiftCache[cacheKey] = shiftText;
                    console.log('No shift data in attendance, trying shift API...');
                }
            } else {
                // Jika tidak ada data attendance hari ini, coba ambil dari API shift
                console.log('No attendance data, trying direct shift API...');
                fetchEmployeeShift(employeeId, date, modalType);
            }
        })
        .catch(error => {
            console.error('Error fetching shift from attendance:', error);
            fetchEmployeeShift(employeeId, date, modalType);
        });
}

// Fungsi alternatif untuk mengambil shift langsung dari EmployeeShift
function fetchEmployeeShift(employeeId, date, modalType = 'checkin') {
    console.log('fetchEmployeeShift called with:', { employeeId, date, modalType });
    
    const shiftDisplay = document.getElementById(modalType === 'checkin' ? 'shift_time_checkin' : 'shift_time_checkout');
    if (!shiftDisplay) {
        console.warn('Shift display element not found in fetchEmployeeShift');
        return;
    }

    const cacheKey = `${employeeId}_${date}`;
    const url = `${baseUrl}/attendance/shift-details/${employeeId}/${date}`;
    
    console.log('Fetching direct shift data from:', url);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Direct shift data response:', data);
            if (data.status === 'success' && data.data) {
                // Use top-level time_start/time_end which may come from base shift
                const ts = data.data.time_start;
                const te = data.data.time_end;
                if (ts && te) {
                    const startTime = new Date(`2000-01-01 ${ts}`).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const endTime = new Date(`2000-01-01 ${te}`).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const shiftText = `${startTime} - ${endTime}`;
                    shiftDisplay.textContent = shiftText;
                    shiftCache[cacheKey] = shiftText;
                    console.log('Direct shift display updated:', shiftText);
                } else {
                    const shiftText = '-';
                    shiftDisplay.textContent = shiftText;
                    shiftCache[cacheKey] = shiftText;
                    console.log('No shift times available in API response (per-date or base)');
                }
            } else {
                const shiftText = '-';
                shiftDisplay.textContent = shiftText;
                shiftCache[cacheKey] = shiftText;
                console.log('No shift data in direct API response');
            }
        })
        .catch(error => {
            console.error('Error fetching employee shift:', error);
            const shiftText = 'Error loading shift';
            shiftDisplay.textContent = shiftText;
        });
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
    // Format tanggal untuk tampilan menggunakan formatDate helper (e.g. "22 August 2025")
    const dateString = now.toISOString().split("T")[0];
    const formattedDate = formatDateWithDay(now.toISOString());

    // Update tampilan di modal check-in (dengan detik)
    const dateDisplay = document.getElementById("date_attendance");
    const timeDisplay = document.getElementById("time_in");

    if (dateDisplay) dateDisplay.textContent = formattedDate;
    if (dateDisplay) {
        // Debugging: store formatted date for inspection
        try { dateDisplay.dataset.formatted = formattedDate; } catch(e){}
    }
    console.debug('attendance_dashboard updateModalTime formattedDate ->', formattedDate);
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
    // Format tanggal untuk tampilan menggunakan formatDate helper (e.g. "22 August 2025")
    const dateString = now.toISOString().split("T")[0];
    const formattedDate = formatDateWithDay(now.toISOString());

    // Update tampilan di modal check-out (dengan detik)
    const dateDisplay = document.getElementById("date_attendance_checkout");
    const timeDisplay = document.getElementById("time_out");

    if (dateDisplay) dateDisplay.textContent = formattedDate;
    if (dateDisplay) {
        try { dateDisplay.dataset.formatted = formattedDate; } catch(e){}
    }
    console.debug('attendance_dashboard updateModalTimeCheckout formattedDate ->', formattedDate);
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
    // Reset form sebelum menampilkan modal
    resetCheckInModal();
    
    // Update waktu berjalan
    updateModalTime();

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

// Function to open the check-in detail modal (adapted to match attendance.js styling/format)
function openCheckInDetailModal() {
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    if (!employeeId) {
        console.error("Employee ID not found");
        return;
    }

    const today = new Date().toISOString().split("T")[0];
    const url = `${baseUrl}/attendance/today/${employeeId}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
                // Prefer active (unclosed) check-in; fallback to latest check-in record of today
                let lastCheckIn = data.data.find(record => record.time_in && !record.time_out);
                if (!lastCheckIn) {
                    const checkIns = data.data.filter(record => record.time_in);
                    if (checkIns.length > 0) {
                        lastCheckIn = checkIns[checkIns.length - 1];
                    }
                }

                if (!lastCheckIn) {
                    showAlertDashboard("No check-in data found for today", "warning");
                    return;
                }

                // Log untuk debugging
                console.log("Check-in data found:", lastCheckIn);
                
                // Create modal content (match attendance.js markup and classes)
                const modalContent = `
                    <div class="modal fade" id="checkInDetailModal" tabindex="-1" role="dialog" aria-labelledby="checkInDetailModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" role="document">
                            <div class="modal-content rounded-4">
                                <div class="modal-header modal-header-custom">
                                    <h5 class="modal-title modal-title-custom text-center w-100" id="checkInDetailModalLabel">Check In</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="check-in-details">
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Date:</div>
                                            <div class="detail-value">${formatDateWithDay(lastCheckIn.date_attendance)}</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Time In:</div>
                                            <div class="detail-value">${formatTimeDisplay(lastCheckIn.time_in)}</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Work Outside:</div>
                                            <div class="detail-value">${lastCheckIn.is_work_outside ? "Yes" : "No"}</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Shift:</div>
                                            <div class="detail-value">${formatTimeDisplay(lastCheckIn.shift_start) || '--:--'} - ${formatTimeDisplay(lastCheckIn.shift_end) || '--:--'}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-0">
                                        <div id="detailMapCheckIn" style="height: 200px; width: 90%; margin: 0px auto; position: relative; outline-style: none;" class="rounded-3"></div>
                                    </div>
                                    
                                    ${lastCheckIn.is_work_outside && lastCheckIn.image_path ? `
                                        <div class="mt-4">
                                            <div class="image-checkin">
                                                <img src="${lastCheckIn.image_path ? (lastCheckIn.image_path.startsWith('http') ? lastCheckIn.image_path : baseUrl + '/' + lastCheckIn.image_path.replace(/^\//, '')) : ''}" 
                                                     alt="Check-in photo" 
                                                     class="img-fluid rounded-3"
                                                     style="max-height: 200px;">
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Remove existing modal if any
                const existingModal = document.getElementById('checkInDetailModal');
                if (existingModal) {
                    existingModal.remove();
                }

                // Add modal to body
                document.body.insertAdjacentHTML('beforeend', modalContent);

                // Initialize and show modal
                const modal = new bootstrap.Modal(document.getElementById('checkInDetailModal'));
                modal.show();

                // Initialize map after modal is shown
                document.getElementById('checkInDetailModal').addEventListener('shown.bs.modal', function () {
                    // Log untuk debugging
                    console.log("Check-in data:", lastCheckIn);
                    
                    // Extract both check-in and check-out coordinates
                    let checkInLat = lastCheckIn.latitude ?? null;
                    let checkInLng = lastCheckIn.longitude ?? null;
                    let checkOutLat = lastCheckIn.checkout_latitude ?? null;
                    let checkOutLng = lastCheckIn.checkout_longitude ?? null;

                    // Fallback to tracking combined location: "lat,lng|lat,lng"
                    if (lastCheckIn.attendanceTrackings && lastCheckIn.attendanceTrackings.length) {
                        const loc = lastCheckIn.attendanceTrackings[0].location;
                        if (loc && (!checkInLat || !checkInLng || !checkOutLat || !checkOutLng)) {
                            const pairs = loc.split('|');
                            if (pairs[0]) {
                                const first = pairs[0].split(',');
                                if (first.length >= 2) {
                                    checkInLat = checkInLat ?? first[0].trim();
                                    checkInLng = checkInLng ?? first[1].trim();
                                }
                            }
                            if (pairs[1]) {
                                const second = pairs[1].split(',');
                                if (second.length >= 2) {
                                    checkOutLat = checkOutLat ?? second[0].trim();
                                    checkOutLng = checkOutLng ?? second[1].trim();
                                }
                            }
                        }
                    }

                    const inLat = parseFloat(checkInLat);
                    const inLng = parseFloat(checkInLng);
                    const outLat = checkOutLat !== null && checkOutLat !== undefined && checkOutLat !== '' ? parseFloat(checkOutLat) : NaN;
                    const outLng = checkOutLng !== null && checkOutLng !== undefined && checkOutLng !== '' ? parseFloat(checkOutLng) : NaN;

                    if (!inLat || !inLng || isNaN(inLat) || isNaN(inLng)) {
                        console.error('Invalid or missing check-in coordinates:', { inLat, inLng });
                        document.getElementById('detailMapCheckIn').innerHTML = '<div class="alert alert-warning text-center">Location data not available</div>';
                        return;
                    }

                    try {
                        const detailMap = L.map('detailMapCheckIn', {
                            center: [inLat, inLng],
                            zoom: 16
                        });
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors',
                            maxZoom: 19
                        }).addTo(detailMap);

                        // Marker for Check-in with label (only show check-in location in this modal)
                        const inMarker = L.marker([inLat, inLng]).addTo(detailMap);
                        inMarker.bindPopup("Check in Location");
                        inMarker.bindTooltip("Check in Location", { permanent: true, direction: 'top', offset: [0, -10] });

                        setTimeout(() => {
                            detailMap.invalidateSize();
                            // Only center on check-in location for this modal
                            detailMap.setView([inLat, inLng], 16);
                        }, 250);
                    } catch (error) {
                        console.error('Error initializing map:', error);
                        document.getElementById('detailMapCheckIn').innerHTML = '<div class="alert alert-warning text-center">Error loading map</div>';
                    }
                });
            } else {
                showAlertDashboard("No check-in data found for today", "warning");
            }
        })
        .catch(error => {
            console.error("Error fetching check-in details:", error);
            showAlertDashboard("Error loading check-in details", "error");
        });
}

// Function to open the check-out detail modal
function openCheckOutDetailModal() {
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    if (!employeeId) {
        console.error("Employee ID not found");
        return;
    }

    const today = new Date().toISOString().split("T")[0];
    const url = `${baseUrl}/attendance/today/${employeeId}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
                // Cari data check-out yang valid (memiliki time_in dan time_out)
                const lastCheckOut = data.data.find(record => record.time_in && record.time_out);
                
                if (!lastCheckOut) {
                    showAlertDashboard("No check-out data found for today", "warning");
                    return;
                }

                // Log untuk debugging
                console.log("Check-out data found:", lastCheckOut);
                
                // Calculate work duration
                const workDuration = calculateDuration24h(lastCheckOut.time_in, lastCheckOut.time_out);
                
                // Create modal content
                const modalContent = `
                    <div class="modal fade" id="checkOutDetailModal" tabindex="-1" role="dialog" aria-labelledby="checkOutDetailModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" role="document">
                            <div class="modal-content rounded-4">
                                <div class="modal-header modal-header-custom">
                                    <h5 class="modal-title modal-title-custom text-center w-100" id="checkOutDetailModalLabel">Check Out</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="check-out-details">
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Date:</div>
                                            <div class="detail-value">${formatDateWithDay(lastCheckOut.date_attendance)}</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Total Work Duration:</div>
                                            <div class="detail-value">${workDuration}</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Time Out:</div>
                                            <div class="detail-value">${formatTimeDisplay(lastCheckOut.time_out)}</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Work Outside:</div>
                                            <div class="detail-value">${lastCheckOut.is_work_outside ? "Yes" : "No"}</div>
                                        </div>
                                        <div class="detail-row">
                                            <div class="form-label label-custom">Shift:</div>
                                            <div class="detail-value">${formatTimeDisplay(lastCheckOut.shift_start) || '--:--'} - ${formatTimeDisplay(lastCheckOut.shift_end) || '--:--'}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-0">
                                        <div id="detailMapCheckOut" style="height: 200px; width: 90%; margin: 0px auto; position: relative; outline-style: none;" class="rounded-3"></div>
                                    </div>
                                    
                                    ${lastCheckOut.is_work_outside && lastCheckOut.checkout_image_path ? `
                                        <div class="mt-4">
                                            <div class="image-checkout">
                                                <img src="${lastCheckOut.checkout_image_path ? (lastCheckOut.checkout_image_path.startsWith('http') ? lastCheckOut.checkout_image_path : baseUrl + '/' + lastCheckOut.checkout_image_path.replace(/^\//, '')) : ''}" 
                                                     alt="Check-out photo" 
                                                     class="img-fluid rounded-3"
                                                     style="max-height: 200px;">
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Remove existing modal if any
                const existingModal = document.getElementById('checkOutDetailModal');
                if (existingModal) {
                    existingModal.remove();
                }

                // Add modal to body
                document.body.insertAdjacentHTML('beforeend', modalContent);

                // Initialize and show modal
                const modal = new bootstrap.Modal(document.getElementById('checkOutDetailModal'));
                modal.show();

                // Initialize map after modal is shown
                document.getElementById('checkOutDetailModal').addEventListener('shown.bs.modal', function () {
                    // Log untuk debugging
                    console.log("Check-out data:", lastCheckOut);
                    
                    // Prefer explicit fields
                    let outLat = lastCheckOut.checkout_latitude ?? null;
                    let outLng = lastCheckOut.checkout_longitude ?? null;
                    // Also try to fetch check-in for bounds
                    let inLat = lastCheckOut.latitude ?? null;
                    let inLng = lastCheckOut.longitude ?? null;

                    // Fallback: parse combined location "lat,lng|lat,lng" from first tracking
                    if (lastCheckOut.attendanceTrackings && lastCheckOut.attendanceTrackings.length) {
                        const loc = lastCheckOut.attendanceTrackings[0].location;
                        if (loc && (!outLat || !outLng || !inLat || !inLng)) {
                            const pairs = loc.split('|');
                            if (pairs[0]) {
                                const first = pairs[0].split(',');
                                if (first.length >= 2) {
                                    inLat = inLat ?? first[0].trim();
                                    inLng = inLng ?? first[1].trim();
                                }
                            }
                            if (pairs[1]) {
                                const second = pairs[1].split(',');
                                if (second.length >= 2) {
                                    outLat = outLat ?? second[0].trim();
                                    outLng = outLng ?? second[1].trim();
                                }
                            }
                        }
                    }

                    const outLatNum = parseFloat(outLat);
                    const outLngNum = parseFloat(outLng);
                    const inLatNum = inLat !== null && inLat !== undefined && inLat !== '' ? parseFloat(inLat) : NaN;
                    const inLngNum = inLng !== null && inLng !== undefined && inLng !== '' ? parseFloat(inLng) : NaN;

                    if (!outLatNum || !outLngNum || isNaN(outLatNum) || isNaN(outLngNum)) {
                        console.error('Invalid or missing checkout coordinates:', { outLatNum, outLngNum });
                        document.getElementById('detailMapCheckOut').innerHTML = '<div class="alert alert-warning text-center">Checkout location data not available</div>';
                        return;
                    }

                    try {
                        const detailMapCheckOut = L.map('detailMapCheckOut', {
                            center: [outLatNum, outLngNum],
                            zoom: 16
                        });
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors',
                            maxZoom: 19
                        }).addTo(detailMapCheckOut);

                        const outMarker = L.marker([outLatNum, outLngNum]).addTo(detailMapCheckOut);
                        outMarker.bindPopup("Check out Location");
                        outMarker.bindTooltip("Check out Location", { permanent: true, direction: 'top', offset: [0, -10] });

                        setTimeout(() => {
                            detailMapCheckOut.invalidateSize();
                            // Only center on check-out location for this modal
                            detailMapCheckOut.setView([outLatNum, outLngNum], 16);
                        }, 250);
                    } catch (error) {
                        console.error('Error initializing checkout map:', error);
                        document.getElementById('detailMapCheckOut').innerHTML = '<div class="alert alert-warning text-center">Error loading checkout map</div>';
                    }
                });
            } else {
                showAlertDashboard("No check-out data found for today", "warning");
            }
        })
        .catch(error => {
            console.error("Error fetching check-out details:", error);
            showAlertDashboard("Error loading check-out details", "error");
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
    showAlertDashboard("Successfully checked in at " + timeString, "success");
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

    // Reset radio button to default (NO)
    const workOutsideYes = document.getElementById("work_outside_yes");
    const workOutsideNo = document.getElementById("work_outside_no");
    const imageUploadSection = document.getElementById("imageUploadSection");

    if (workOutsideNo) {
        workOutsideNo.checked = true;
    }
    
    if (workOutsideYes) {
        workOutsideYes.checked = false;
    }

    // Hide image upload section
    if (imageUploadSection) {
        imageUploadSection.style.display = "none";
    }

    // Clear note textarea
    const noteTextarea = document.querySelector('textarea[name="note"]');
    if (noteTextarea) {
        noteTextarea.value = "";
    }

    // Clear hidden inputs
    document.querySelectorAll('input[name="date_attendance"], input[name="time_in"]').forEach(el => el.remove());

    // Reset date/time display
    document.getElementById("date_attendance").textContent = "Loading...";
    document.getElementById("time_in").textContent = "Loading...";

    // Clear latitude and longitude
    const latitudeInput = document.getElementById('latitudeCheckIn');
    const longitudeInput = document.getElementById('longitudeCheckIn');
    if (latitudeInput) latitudeInput.value = "";
    if (longitudeInput) longitudeInput.value = "";

    // Reset form
    const form = document.getElementById("checkInForm");
    if (form) {
        form.reset();
    }
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
    showAlertDashboard("Successfully checked out at " + timeString, "success");
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

                                    if (lastTodayAttendance.time_in && !lastTodayAttendance.time_out) {
                                        // Sudah check-in hari ini: tampilkan tombol checkout.
                                        // Jangan disable checkInBtn — biarkan clickable untuk membuka detail.
                                        checkInBtn.style.display = "flex";
                                        checkInBtn.disabled = false;
                                        checkInBtn.classList.add('active');
                                        try { $("#checkInBtn .check-icon").show(); } catch(e){}
                                        checkOutBtn.style.display = "flex";
                                        // Enable check-out because user has checked in today and hasn't checked out yet.
                                        checkOutBtn.disabled = false;
                                        checkOutBtn.classList.remove('active');
                                        try { $("#checkOutBtn .done-all-icon").hide(); } catch(e){}
                                        return;
                                    } else if (lastTodayAttendance.time_in && lastTodayAttendance.time_out) {
                                        // Sudah checkout hari ini, tampilkan tombol check-in untuk shift berikutnya (default)
                                        checkInBtn.style.display = "flex";
                                        checkInBtn.disabled = false;
                                        checkInBtn.classList.remove('active');
                                        try { $("#checkInBtn .check-icon").hide(); } catch(e){}

                                        checkOutBtn.style.display = "flex";
                                        checkOutBtn.disabled = true;
                                        checkOutBtn.classList.remove('active');
                                        try { $("#checkOutBtn .done-all-icon").hide(); } catch(e){}
                                        return;
                                    }
                                }
                            }

                            if (checkInDate < today) {
                                // Ada check-in yang belum ditutup dari hari sebelumnya
                                console.warn("You forgot to check out yesterday, please contact HR.");

                                // Reset UI for a new day: allow check-in for today.
                                // Do NOT disable checkOutBtn here just because there is an unclosed
                                // attendance from a previous day — allow user to act for today.
                                checkInBtn.style.display = "flex";
                                checkInBtn.disabled = false;
                                checkInBtn.classList.remove('active');
                                try { $("#checkInBtn .check-icon").hide(); } catch(e){}

                                        checkOutBtn.style.display = "flex";
                                        // Do not enable checkout here — by default checkout stays disabled
                                        // until user actually checks in today.
                                        checkOutBtn.disabled = true;
                                checkOutBtn.classList.remove('active');
                                try { $("#checkOutBtn .done-all-icon").hide(); } catch(e){}

                                // Clear displayed times/status
                                const checkInTimeInput = document.getElementById("checkInTime");
                                const checkOutTimeInput = document.getElementById("checkOutTime");
                                if (checkInTimeInput) checkInTimeInput.value = "";
                                if (checkOutTimeInput) checkOutTimeInput.value = "";
                                const attendanceStatusEl = document.getElementById('attendanceStatus');
                                if (attendanceStatusEl) attendanceStatusEl.textContent = "";

                                // Hanya tampilkan alert di halaman dashboard, sekali saja per user
                                if (window.location.href.includes('/dashboard')) {
                                    const employeeId = document.querySelector('input[name="employee_id"]')?.value || 'guest';
                                    const alertKey = `attendanceForgotCheckoutShown_${employeeId}`;

                                    // Cek jika alert belum pernah ditampilkan untuk user ini
                                    if (!localStorage.getItem(alertKey)) {
                                        // Tampilkan pesan warning sekali
                                        showAlertDashboard(
                                            `You forgot to check out yesterday. Please contact HR and check in for today.`,
                                            "warning"
                                        );

                                        // Tandai alert sudah ditampilkan untuk user ini
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

                            // Check based on time_in and time_out fields instead of type_attendance
                            if (lastAttendance.time_in && !lastAttendance.time_out) {
                                // Has checked in but not checked out, show checkout button
                                checkInBtn.style.display = "flex";
                                checkOutBtn.style.display = "flex";
                                // Enable checkout for today's checked-in record
                                checkOutBtn.disabled = false;

                                // Update hidden time fields
                                const checkInTimeInput = document.getElementById("checkInTime");
                                if (checkInTimeInput) {
                                    checkInTimeInput.value = lastAttendance.time_in;
                                }
                                return;
                            } else if (lastAttendance.time_in && lastAttendance.time_out) {
                                // Has both checked in and checked out, show check-in button for next shift
                                checkInBtn.style.display = "flex";
                                checkOutBtn.style.display = "flex";
                                // No active checkout available
                                checkOutBtn.disabled = true;
                                return;
                            } else {
                                // Fallback case
                                checkInBtn.style.display = "flex";
                                checkOutBtn.style.display = "flex";
                                checkOutBtn.disabled = true;
                                return;
                            }
                        } else {
                            // No attendance today, show check-in button
                            checkInBtn.style.display = "flex";
                            checkOutBtn.style.display = "flex";
                            checkOutBtn.disabled = true;
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
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const months = [
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
    // Reset form sebelum menampilkan modal
    resetCheckInModal();
    
    // Update waktu berjalan dengan real-time clock
    updateModalTime();

    // Update shift display sekali saja
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    const dateString = new Date().toISOString().split("T")[0];
    console.log('openCheckInModal - calling updateShiftDisplay with:', { employeeId, dateString });
    if (employeeId) {
        updateShiftDisplay(employeeId, dateString, 'checkin');
    } else {
        console.warn('openCheckInModal - No employee ID found');
    }

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

    // Set interval untuk update waktu setiap detik
    const timeInterval = setInterval(updateModalTime, 1000);

    // Ensure displayed date uses formatted month name immediately
    try {
        const dateEl = document.getElementById('date_attendance');
        if (dateEl) dateEl.textContent = formatDate(new Date().toISOString());
    } catch (e) { console.error(e); }

    // Clear interval saat modal ditutup
    document.getElementById("checkInModal").addEventListener('hidden.bs.modal', function() {
        clearInterval(timeInterval);
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
            showAlertDashboard("Check-in submitted successfully!", "success");

            // Update UI tanpa reload
            $("#checkInBtn .check-icon").show();
            $("#checkInBtn").addClass("active");

            // Update calendar
            if (typeof renderCalendar === 'function') {
                renderCalendar(currentMonth, currentYear);
            }

            const modal = bootstrap.Modal.getInstance(
                document.getElementById("checkInModal")
            );
            if (modal) modal.hide();

            form.reset();
            clearImage();

            // Update status without reload
            // After showing success alert, reload the page once the alert has disappeared
            // showAlertDashboard uses a 3s display + 0.5s fade; reload after ~3.6s
            setTimeout(() => {
                try { window.location.reload(); } catch (e) { /* ignore */ }
            }, 3600);
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
// Override fungsi openCheckOutModal untuk menambahkan validasi
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

// Checkout Modal Functions
let checkoutStream = null;
let checkoutCapturedImage = null;

function openCheckOutModal() {
    // Update waktu berjalan
    updateModalTimeCheckout();

    // Update shift display sekali saja
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    const dateString = new Date().toISOString().split("T")[0];
    console.log('openCheckOutModal - calling updateShiftDisplay with:', { employeeId, dateString });
    if (employeeId) {
        updateShiftDisplay(employeeId, dateString, 'checkout');
    } else {
        console.warn('openCheckOutModal - No employee ID found');
    }

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
        showAlertDashboard("Employee ID not found. Please refresh the page.", "error");
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
                // Find record with time_in (check-in record) instead of type_attendance
                const checkInRecord = data.data.find(r => r.time_in && !r.time_out);
                if (!checkInRecord) {
                    console.error("No check-in record found");
                    showAlertDashboard("No check-in record found for today.", "error");
                    return setCheckoutModalDefaults();
                }

                populateCheckoutModal(checkInRecord, serverTime);
            } else {
                console.warn("No attendance data found");
                showAlertDashboard("No attendance data found for today.", "error");
                setCheckoutModalDefaults();
            }
        })
        .catch(error => {
            console.error("Error loading check-in data:", error);
            showAlertDashboard("Error loading check-in data. Please try again.", "error");
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

        // Tampilkan time in dengan format 00:00
        const timeInDisplay = document.getElementById("time_in_display");
        if (timeInDisplay) {
            timeInDisplay.textContent = formatTimeDisplay(checkInRecord.time_in) || "--:--";
            try {
                if (checkInRecord.is_late) {
                    timeInDisplay.classList.add('text-danger');
                } else {
                    timeInDisplay.classList.remove('text-danger');
                }
            } catch (e) {}
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
        showAlertDashboard("Error loading checkout data. Please try again.", "error");
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
    const timeDisplayContainer = document.querySelector("#checkOutModal .text-center.mb-4");

    if (checkoutStream) return;

    modalContent?.classList.add("camera-active");
    modalHeader?.classList.add("d-none");
    modalFooter?.classList.add("d-none");
    modalBody?.classList.add("d-none");
    timeDisplayContainer?.classList.add("d-none");

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
    const timeDisplayContainer = document.querySelector("#checkOutModal .text-center.mb-4");

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
    timeDisplayContainer?.classList.remove("d-none");
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
        showAlertDashboard("Employee ID is missing. Please refresh the page.", "error");
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
        showAlertDashboard("Could not get your location. Please refresh and try again.", "error");
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
        showAlertDashboard("CSRF token not found. Please refresh the page.", "error");
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
                showAlertDashboard(
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

                // Update status without reload
                getTodayAttendanceStatus();
                // Refresh calendar so the day shows both In and Out colors immediately
                try { if (typeof renderCalendar === 'function') { renderCalendar(currentMonth, currentYear); } } catch (e) {}
                
                // Update UI to show both buttons as active
                const checkInBtn = document.getElementById("checkInBtn");
                const checkOutBtn = document.getElementById("checkOutBtn");
                if (checkInBtn && checkOutBtn) {
                    checkInBtn.classList.add("active");
                    checkOutBtn.classList.add("active");
                    checkInBtn.disabled = false;
                    checkOutBtn.disabled = false;
                    $("#checkInBtn .check-icon").show();
                    $("#checkOutBtn .done-all-icon").show();
                }
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

// Initialize checkout camera features on DOM ready
document.addEventListener("DOMContentLoaded", function() {
    initializeCheckoutCameraFeatures();
});

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

// Fungsi untuk mendapatkan status absensi harian
function getTodayAttendanceStatus() {
    const employeeId = document.querySelector('input[name="employee_id"]')?.value;
    
    if (!employeeId) {
        console.error("Employee ID not found");
        // Set default state if no employee ID
        updateButtonStates({ status: "not_started" });
        return;
    }

    const urlStatus = `${baseUrl}/attendance/today-status/${employeeId}`;

    fetch(urlStatus)
        .then((response) => response.json())
        .then((statusData) => {
            console.log('Status data received:', statusData); // Debug log
            updateButtonStates(statusData.data);
        })
        .catch((error) => {
            console.error("Error fetching attendance status:", error);
            // Set default state on error
            updateButtonStates({ status: "not_started" });
        });
}

    // Fungsi untuk memformat waktu menjadi format 00:00 (mendukung HH:MM, HH:MM:SS, dan datetime umum)
    function formatTimeDisplay(timeString) {
        if (!timeString) return '--:--';

        // Jika string waktu sederhana HH:MM atau HH:MM:SS
        if (typeof timeString === 'string') {
            const m = timeString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
            if (m) return `${m[1]}:${m[2]}`;
        }

        // Coba parse sebagai Date (ISO atau timestamp)
        let date = new Date(timeString);
        if (isNaN(date.getTime()) && typeof timeString === 'string' && timeString.includes(' ')) {
            // Coba normalize "YYYY-MM-DD HH:MM:SS" => "YYYY-MM-DDTHH:MM:SS"
            date = new Date(timeString.replace(' ', 'T'));
        }
        if (isNaN(date.getTime())) return '--:--';

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

// Function to format date (same as attendance.js)
function formatDateWithDay(dateString) {
    // Return format: "Friday, 22 August 2025"
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString || '';
    const day = date.getDate();
    const months = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    const days = [
        'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'
    ];
    const monthName = months[date.getMonth()];
    const dayName = days[date.getDay()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
}

// Override global formatDate function untuk halaman ini
if (typeof window !== 'undefined') {
    window.formatDateWithDay = formatDateWithDay;
}

    // Fungsi untuk update state tombol berdasarkan status
    function updateButtonStates(status) {
        console.log('Dashboard - Updating button states with status:', status); // Debug log
        const checkInBtn = document.getElementById("checkInBtn");
        const checkOutBtn = document.getElementById("checkOutBtn");

        if (!checkInBtn || !checkOutBtn) {
            console.log('Dashboard - Buttons not found, skipping update'); // Debug log
            return;
        }

        // Reset semua state sekali saja
        checkInBtn.classList.remove("active");
        checkOutBtn.classList.remove("active");
        checkInBtn.disabled = false;
        checkOutBtn.disabled = false;
        
        // Ensure buttons are visible
        checkInBtn.style.display = "flex";
        checkOutBtn.style.display = "flex";

        // Hide semua icon
        $("#checkInBtn .check-icon").hide();
        $("#checkOutBtn .done-all-icon").hide();

        // Update berdasarkan status
        if (status.status === "not_started") {
            // Belum check-in sama sekali: jangan disable checkout, tampilkan alert saat diklik
            console.log('Dashboard - Set state: not_started (checkout enabled with alert)');
        } else if (status.status === "checked_in") {
            // Sudah check-in tapi belum check-out: enable both buttons
            checkInBtn.classList.add("active");
            $("#checkInBtn .check-icon").show();
            // checkOutBtn tetap enabled untuk checkout
            console.log('Dashboard - Set state: checked_in (both enabled, checkin active)');
        } else if (status.status === "checked_out") {
            // Sudah check-out: both buttons active and enabled
            checkInBtn.classList.add("active");
            checkOutBtn.classList.add("active");
            $("#checkInBtn .check-icon").show();
            $("#checkOutBtn .done-all-icon").show();
            console.log('Dashboard - Set state: checked_out (both active and enabled)');
        }

        console.log('Dashboard - Final button states - CheckIn active:', checkInBtn.classList.contains('active'), 
                   'CheckOut active:', checkOutBtn.classList.contains('active'),
                   'CheckIn disabled:', checkInBtn.disabled,
                   'CheckOut disabled:', checkOutBtn.disabled); // Debug log

        // Handle unclosed attendance: do NOT automatically mark buttons as active.
        // Showing buttons as "active" should reflect an actual today's action.
        // Instead, show a non-blocking warning once per user session.
        if (status.has_unclosed) {
            try {
                const employeeId = document.querySelector('input[name="employee_id"]')?.value || 'guest';
                const alertKey = `attendanceForgotCheckoutShown_${employeeId}`;
                if (!localStorage.getItem(alertKey)) {
                    showAlertDashboard('You have an unclosed check-in from a previous day. Please contact HR if needed.', 'warning');
                    localStorage.setItem(alertKey, 'true');
                }
            } catch (e) {
                // ignore
            }
            // Do not change checkInBtn/checkOutBtn active/disabled state here.
        }

        // Update attendance logs dengan format 00:00
        if (status.last_check_in_time) {
            const timeInDisplay = document.getElementById("time_in_display");
            if (timeInDisplay) {
                timeInDisplay.textContent = formatTimeDisplay(status.last_check_in_time);
                // Apply red color immediately if server says this check-in is late
                try {
                    if (status.is_late) {
                        timeInDisplay.classList.add('text-danger');
                    } else {
                        timeInDisplay.classList.remove('text-danger');
                    }
                } catch (e) { /* ignore */ }
            }
        }

        if (status.last_check_out_time) {
            const timeOutDisplay = document.getElementById("time_out_display");
            if (timeOutDisplay) {
                timeOutDisplay.textContent = formatTimeDisplay(status.last_check_out_time);
            }
        }

        // Simpan status terkini untuk handler click
        try {
            if (!window.AttendanceState) window.AttendanceState = {};
            window.AttendanceState.currentStatus = status;
        } catch (e) { /* ignore */ }
        // Update chevron visibility after times have been updated
        try { updateChevronVisibility(); } catch (e) {}
    }

// Hide chevron buttons until their corresponding time is available
function updateChevronVisibility() {
    const timeInEl = document.getElementById('time_in_display');
    const timeOutEl = document.getElementById('time_out_display');

    const hasTime = (el) => {
        if (!el) return false;
        const txt = (el.textContent || '').trim();
        if (!txt) return false;
        if (txt === 'Loading...' || txt === '--:--') return false;
        return true;
    };

    try {
        const inWrapper = document.querySelector('.chevron-icon-attendance .time_in');
        if (inWrapper) {
            const btn = inWrapper.parentElement.querySelector('button');
            if (btn) btn.style.display = hasTime(timeInEl) ? 'inline-flex' : 'none';
        }
    } catch (e) {}

    try {
        const outWrapper = document.querySelectorAll('.chevron-icon-attendance .time_out')[0];
        const outEl = document.querySelector('.chevron-icon-attendance .time_out');
        const targetOut = outWrapper || outEl;
        if (targetOut) {
            const btn = targetOut.parentElement.querySelector('button');
            if (btn) btn.style.display = hasTime(timeOutEl) ? 'inline-flex' : 'none';
        }
    } catch (e) {}
}

// Fungsi untuk refresh status setelah check-in/check-out
function refreshAttendanceStatus() {
    getTodayAttendanceStatus();
}

// Fungsi untuk reset state saat berganti hari
function resetDailyAttendanceState() {
    const today = new Date().toISOString().split("T")[0];
    const lastResetDate = localStorage.getItem('lastAttendanceReset');
    
    if (lastResetDate !== today) {
        localStorage.setItem('lastAttendanceReset', today);
        getTodayAttendanceStatus();
    }
}

// Fungsi untuk memastikan status diperbarui saat halaman dimuat
function initializeAttendanceState() {
    // Check daily reset
    resetDailyAttendanceState();
    
    // Get initial status immediately
    getTodayAttendanceStatus();
    
    // Set up periodic refresh
    setInterval(getTodayAttendanceStatus, 30000); // Refresh every 30 seconds
    
    // Add event listener untuk refresh setelah check-in/check-out
    document.addEventListener('attendanceUpdated', refreshAttendanceStatus);
}

// Initialize saat DOM ready - call multiple times to ensure quick loading
document.addEventListener("DOMContentLoaded", function() {
    // Call immediately
    initializeAttendanceState();
    
    // Call again after short delay to ensure all elements are ready
    setTimeout(initializeAttendanceState, 100);
});

// Export fungsi untuk digunakan di file lain
window.AttendanceState = {
    getTodayAttendanceStatus,
    refreshAttendanceStatus,
    updateButtonStates
};