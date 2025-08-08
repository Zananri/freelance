// Shift Management JavaScript - Complete rebuild with correct endpoint
document.addEventListener('DOMContentLoaded', function() {
    loadEmployeeData();
});

// Function to load employee data with proper error handling
async function loadEmployeeData() {
    try {
        // Construct the correct endpoint based on the application's base path
        const basePath = window.location.pathname.split('/').slice(0, -1).join('/') || '';
        const endpoint = `${basePath}/shift/employees-basic`;
        
        console.log('Fetching from:', endpoint);
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            renderEmployeeTable(data.data);
        } else {
            console.error('Invalid data format:', data);
            renderError('Failed to load employee data');
        }
    } catch (error) {
        console.error('Error loading employee data:', error);
        renderError(error.message || 'Failed to load employee data');
    }
}

// Function to render employee table
function renderEmployeeTable(employees) {
    const tableBody = document.getElementById('shiftTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    if (!employees || employees.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="1" class="text-center">No employees found</td></tr>';
        return;
    }

    employees.forEach((employee) => {
        const row = document.createElement('tr');
        
        const employeeDisplay = `
            <div class="d-flex align-items-center gap-3">
                <img src="${employee.profile_picture || '/asset/img/default-profile.png'}" 
                     alt="Profile Picture" 
                     class="table-image rounded-circle" 
                     width="40" 
                     height="40" />
                <div>
                    <div class="fw-semibold">${employee.name}</div>
                    <div class="text-muted">${employee.email}</div>
                </div>
            </div>
        `;

        row.innerHTML = `<td>${employeeDisplay}</td>`;
        tableBody.appendChild(row);
    });
}

// Function to render error message
function renderError(message) {
    const tableBody = document.getElementById('shiftTableBody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="1" class="text-center text-danger">${message}</td></tr>`;
    }
}
