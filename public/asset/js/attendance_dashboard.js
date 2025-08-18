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


