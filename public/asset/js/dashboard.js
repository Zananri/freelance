const baseUrl = document.querySelector('meta[name="app-url"]')?.getAttribute("content") || "";

document.addEventListener("DOMContentLoaded", function () {
    // Initialize attendance page
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
}

function initializeAttendance() {
    // Set current date
    const today = new Date();
    const currentDateInput = document.getElementById("currentDate");
    if (currentDateInput) {
        currentDateInput.value = today.toISOString().split("T")[0];
    }

    // Update check in/out times if available
    // updateAttendanceStatus();
}

function openCheckInModal() {
    // Set current date and time
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });

    // Format date for display (DD/MM/YYYY)
    const [year, month, day] = dateString.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    // Update modal display fields (span elements)
    const dateDisplay = document.getElementById("date_attendance");
    const timeDisplay = document.getElementById("time_in");

    if (dateDisplay) {
        dateDisplay.textContent = formattedDate;
    }
    if (timeDisplay) {
        timeDisplay.textContent = timeString;
    }

    // Update hidden form fields for submission
    let dateInput = document.querySelector('input[name="date_attendance"]');
    let timeInput = document.querySelector('input[name="time_in"]');

    // Remove existing hidden inputs if any
    if (dateInput) dateInput.remove();
    if (timeInput) timeInput.remove();

    // Create new hidden inputs
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

    // Check for existing image URL and show preview if present
    const existingImageUrlInput = document.getElementById("existingImageUrl");
    if (existingImageUrlInput && existingImageUrlInput.value) {
        showImagePreview(existingImageUrlInput.value);
    } else {
        // clearImage();
    }

    // Show the modal using Bootstrap's modal API
    const modal = new bootstrap.Modal(document.getElementById("checkInModal"));
    modal.show();
}


