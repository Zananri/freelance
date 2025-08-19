// Attendance JavaScript
const baseUrl = $('meta[name="app-url"]').attr("content");

$(document).ready(function () {
    initializeAttendance();

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
