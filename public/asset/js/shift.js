// Shift Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadShiftData();
});

// Function to load shift data
async function loadShiftData() {
    try {
        // Simulated data - in real implementation, fetch from API
        const shifts = [
            {
                id: 1,
                employee: {
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john.doe@company.com',
                    profile_picture: '/asset/img/default-profile.png'
                },
                shift_name: 'Morning Shift',
                start_time: '08:00',
                end_time: '16:00',
                date: '2024-07-20',
                status: 'Active'
            },
            {
                id: 2,
                employee: {
                    first_name: 'Jane',
                    last_name: 'Smith',
                    email: 'jane.smith@company.com',
                    profile_picture: '/asset/img/default-profile.png'
                },
                shift_name: 'Afternoon Shift',
                start_time: '14:00',
                end_time: '22:00',
                date: '2024-07-20',
                status: 'Active'
            }
        ];

        renderShiftTable(shifts);
    } catch (error) {
        console.error('Error loading shift data:', error);
    }
}

// Function to render shift table with employee data
function renderShiftTable(shifts) {
    const tableBody = document.getElementById('shiftTableBody');
    tableBody.innerHTML = '';

    shifts.forEach((shift, index) => {
        const row = document.createElement('tr');
        
        // Employee display format like in employee page
        const employeeDisplay = `
            <div class="d-flex align-items-center gap-3">
                <img src="${shift.employee.profile_picture}" 
                     alt="Profile Picture" 
                     class="table-image rounded-circle" 
                     width="40" 
                     height="40" />
                <div>
                    <div class="fw-semibold" style="font-size: 14px;">
                        ${shift.employee.first_name} ${shift.employee.last_name}
                    </div>
                    <div style="font-size: 10px; color: #6c757d;">
                        ${shift.employee.email}
                    </div>
                </div>
            </div>
        `;

        row.innerHTML = `
            <td>${employeeDisplay}</td>
            <td>${shift.shift_name}</td>
            <td>${shift.start_time}</td>
            <td>${shift.end_time}</td>
            <td>${shift.date}</td>
            <td>
                <span class="badge ${shift.status === 'Active' ? 'bg-success' : 'bg-secondary'}">
                    ${shift.status}
                </span>
            </td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary" onclick="editShift(${shift.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteShift(${shift.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Placeholder functions for actions
function editShift(id) {
    console.log('Edit shift:', id);
    // Implement edit functionality
}

function deleteShift(id) {
    console.log('Delete shift:', id);
    // Implement delete functionality
}

// Function to fetch real data from API (for future implementation)
async function fetchShiftData() {
    try {
        const response = await fetch('/api/shifts');
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching shift data:', error);
        return [];
    }
}
