// Attendance JavaScript
const baseUrl = $('meta[name="app-url"]').attr("content");

$(document).ready(function () {
    initializeCalendar();
});

$(".btn-custom-check").on("click", function () {
    $(".btn-custom-check").removeClass("active");
    $(this).addClass("active");

    getAttendanceToDay();

    const submitCheckInBtn = document.getElementById("submitCheckInBtn");
    if (submitCheckInBtn) {
        submitCheckInBtn.addEventListener("click", function () {
            submitCheckIn();
        });
    }
});

function getAttendanceToDay() {
    let checkBtnActive = $(".btn-custom-check.active").attr(
        "data-check-active"
    );

    if (checkBtnActive === "checkIn") {
        openCheckInModal();
    } else if (checkBtnActive === "checkOut") {
        openCheckOutModal();
    }
}

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

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
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

function submitCheckIn() {
    const form = document.getElementById("checkInForm");
    if (!form) return;

    // Validate form before submission
    const employeeId = document.querySelector(
        'input[name="employee_id"]'
    )?.value;
    if (!employeeId) {
        showFloatingAlert(
            "Employee ID not found. Please refresh the page.",
            "error"
        );
        return;
    }

    const isWorkOutsideRadio = document.querySelector(
        'input[name="is_work_outside"]:checked'
    );
    if (!isWorkOutsideRadio) {
        showFloatingAlert(
            "Please select whether you are working outside or not.",
            "error"
        );
        return;
    }

    // Create new FormData
    const formData = new FormData();

    // Add required fields
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
        showFloatingAlert(
            "CSRF token not found. Please refresh the page.",
            "error"
        );
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
                        const errorMessages = Object.values(data.errors)
                            .flat()
                            .join("\n");
                        throw new Error(
                            errorMessages || data.message || "Validation error"
                        );
                    }
                    throw new Error(
                        data.message || `HTTP error! status: ${response.status}`
                    );
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

                $("btnCheckIn .check-icon").show();

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
    const ctx = document.getElementById("doughnutChart");
    if (!ctx) return;

    new Chart(ctx, {
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
        options: {
            cutout: "60%", // Size middle hole
            plugins: {
                legend: { display: false },
            },
        },
    });
});
