// Shift Management JavaScript - Updated to use employee_shifts data
document.addEventListener("DOMContentLoaded", function () {
    loadEmployeeData();
    setupEventListeners();
});

// Function to load employee data with proper error handling
async function loadEmployeeData() {
    try {
        const basePath =
            window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/shift/employees-basic`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
            renderEmployeeTable(data.data);
        } else {
            console.error("Invalid data format:", data);
            renderError("Failed to load employee data");
        }
    } catch (error) {
        console.error("Error loading employee data:", error);
        renderError(error.message || "Failed to load employee data");
    }
}

// Function to render employee table with time_start and time_end
function renderEmployeeTable(employees) {
    const tableBody = document.getElementById("shiftTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!employees || employees.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="4" class="text-center">No employees found</td></tr>';
        return;
    }

    employees.forEach((employee) => {
        const row = document.createElement("tr");

        const employeeDisplay = `
            <div class="d-flex align-items-center gap-3">
                <img src="${
                    employee.profile_picture || "/asset/img/default-profile.png"
                }" 
                     alt="Profile Picture" 
                     class="table-image rounded-circle" 
                     width="40" 
                     height="40" />
                <div>
                    <div class="fw-semibold" style="font-size: 14px;">${
                        employee.name
                    }</div>
                    <div style="font-size: 10px; color: #6c757d;">${
                        employee.email
                    }</div>
                </div>
            </div>
        `;

        // Use actual shift data instead of dummy data
        const startTimeDisplay = employee.start_time || "Not set";
        const endTimeDisplay = employee.end_time || "Not set";

        row.innerHTML = `
            <td>${employeeDisplay}</td>
            <td>
                <span>${startTimeDisplay}</span>
            </td>
            <td>
                <span>${endTimeDisplay}</span>
            </td>
            <td>
            <button class="btn-icon-toggle btn-edit" data-id="${employee.id}" 
                    data-name="${employee.name}" 
                    data-date="${employee.date_shift || ''}" 
                    data-start="${employee.start_time || ''}" 
                    data-end="${employee.end_time || ''}" 
                    title="Edit">
                <span class="material-symbols-outlined icon">edit</span> Edit Shift
            </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to render error message
function renderError(message) {
    const tableBody = document.getElementById("shiftTableBody");
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${message}</td></tr>`;
    }
}

// Setup event listeners for edit buttons
function setupEventListeners() {
    // Event delegation for edit buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-edit')) {
            const button = e.target.closest('.btn-edit');
            openEditModal(button);
        }
    });

    // Save shift button
    document.getElementById('saveShiftBtn').addEventListener('click', saveShiftChanges);
}

// Initialize date picker for shift dates
let selectedShiftDates = [];

function initializeShiftDatePicker() {
    const dateDisplay = document.getElementById('editDateShiftDisplay');
    const dateInput = document.getElementById('editDateShift');
    
    if (!dateDisplay || !dateInput) return;

    // Create datepicker container
    const datepickerContainer = document.createElement('div');
    datepickerContainer.id = 'shift-datepicker';
    datepickerContainer.className = 'datepicker-container';
    datepickerContainer.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        padding: 10px;
        z-index: 1000;
        display: none;
        max-width: 300px;
    `;
    
    dateDisplay.parentNode.style.position = 'relative';
    dateDisplay.parentNode.appendChild(datepickerContainer);

    // Create calendar
    const calendar = document.createElement('div');
    calendar.className = 'calendar-grid';
    calendar.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        font-size: 12px;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = 'grid-column: span 7; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
    header.innerHTML = `
        <button type="button" class="btn-prev-month" style="border: none; background: none; cursor: pointer;"><</button>
        <span class="month-year"></span>
        <button type="button" class="btn-next-month" style="border: none; background: none; cursor: pointer;">></button>
    `;
    
    // Weekday headers
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.style.cssText = 'text-align: center; font-weight: bold; padding: 5px;';
        calendar.appendChild(dayHeader);
    });
    
    datepickerContainer.appendChild(header);
    datepickerContainer.appendChild(calendar);

    let currentDate = new Date();
    
    function renderCalendar() {
        calendar.innerHTML = '';
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.textContent = day;
            dayHeader.style.cssText = 'text-align: center; font-weight: bold; padding: 5px;';
            calendar.appendChild(dayHeader);
        });

        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        header.querySelector('.month-year').textContent = 
            currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.textContent = date.getDate();
            dayElement.style.cssText = `
                text-align: center;
                padding: 8px;
                cursor: pointer;
                border-radius: 4px;
                ${date.getMonth() !== currentDate.getMonth() ? 'color: #ccc;' : ''}
                ${selectedShiftDates.some(d => d.toDateString() === date.toDateString()) ? 'background: #007bff; color: white;' : ''}
            `;
            
            dayElement.addEventListener('click', () => toggleShiftDate(date));
            calendar.appendChild(dayElement);
        }
    }

    function toggleShiftDate(date) {
        const index = selectedShiftDates.findIndex(d => d.toDateString() === date.toDateString());
        if (index > -1) {
            selectedShiftDates.splice(index, 1);
        } else {
            selectedShiftDates.push(new Date(date));
        }
        updateDisplay();
        renderCalendar();
    }

    function updateDisplay() {
        selectedShiftDates.sort((a, b) => a - b);
        const formattedDates = selectedShiftDates.map(d => 
            d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        
        dateDisplay.value = formattedDates.join(', ');
        dateInput.value = JSON.stringify(formattedDates);
    }

    // Event listeners
    dateDisplay.addEventListener('click', () => {
        datepickerContainer.style.display = datepickerContainer.style.display === 'none' ? 'block' : 'none';
        renderCalendar();
    });

    header.querySelector('.btn-prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    header.querySelector('.btn-next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Close datepicker when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#shift-datepicker') && e.target !== dateDisplay) {
            datepickerContainer.style.display = 'none';
        }
    });

    renderCalendar();
}

// Open edit modal with employee data
function openEditModal(button) {
    const employeeId = button.dataset.id;
    const employeeName = button.dataset.name;
    const dateShift = button.dataset.date;
    const timeStart = button.dataset.start;
    const timeEnd = button.dataset.end;

    // Reset selected dates
    selectedShiftDates = [];
    
    // Parse existing dates
    if (dateShift && dateShift !== 'null' && dateShift !== '') {
        try {
            const dates = JSON.parse(dateShift);
            if (Array.isArray(dates)) {
                selectedShiftDates = dates.map(d => new Date(d));
            } else {
                selectedShiftDates = [new Date(dateShift)];
            }
        } catch (e) {
            selectedShiftDates = [new Date(dateShift)];
        }
    }

    // Populate modal fields
    document.getElementById('editEmployeeId').value = employeeId;
    document.getElementById('editEmployeeName').value = employeeName;
    document.getElementById('editTimeStart').value = timeStart || '';
    document.getElementById('editTimeEnd').value = timeEnd || '';

    // Update date display
    const dateDisplay = document.getElementById('editDateShiftDisplay');
    const dateInput = document.getElementById('editDateShift');
    
    if (selectedShiftDates.length > 0) {
        const formattedDates = selectedShiftDates.map(d => 
            d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        dateDisplay.value = formattedDates.join(', ');
        dateInput.value = JSON.stringify(formattedDates);
    } else {
        dateDisplay.value = '';
        dateInput.value = '';
    }

    // Initialize date picker
    initializeShiftDatePicker();

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editShiftModal'));
    modal.show();
}

// Save shift changes via AJAX
async function saveShiftChanges() {
    const form = document.getElementById('editShiftForm');
    const formData = new FormData(form);
    
    const data = {
        employee_id: formData.get('employee_id'),
        date_shift: formData.get('date_shift'),
        time_start: formData.get('time_start'),
        time_end: formData.get('time_end')
    };

    // Validate form
    if (!data.date_shift || !data.time_start || !data.time_end) {
        alert('Please fill all required fields');
        return;
    }

    // Validate time range
    if (data.time_start >= data.time_end) {
        alert('End time must be after start time');
        return;
    }

    try {
        const basePath = window.location.pathname.split("/").slice(0, -1).join("/") || "";
        const endpoint = `${basePath}/shift/update/${data.employee_id}`;

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editShiftModal'));
            modal.hide();

            // Reload data
            loadEmployeeData();
            
            // Show success message
            alert('Shift updated successfully');
        } else {
            alert('Failed to update shift: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating shift:', error);
        alert('Error updating shift: ' + error.message);
    }
}
