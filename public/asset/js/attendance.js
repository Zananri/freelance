// Attendance JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize attendance page
    initializeAttendance();
    initializeCalendar();
    setupEventListeners();
});

function initializeAttendance() {
    // Set current date
    const today = new Date();
    document.getElementById('currentDate').value = today.toISOString().split('T')[0];
    
    // Update check in/out times if available
    updateAttendanceStatus();
}

function setupEventListeners() {
    // Check in button
    document.getElementById('checkInBtn').addEventListener('click', function() {
        handleCheckIn();
    });
    
    // Check out button
    document.getElementById('checkOutBtn').addEventListener('click', function() {
        handleCheckOut();
    });
    
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', function() {
        navigateMonth(-1);
    });
    
    document.getElementById('nextMonth').addEventListener('click', function() {
        navigateMonth(1);
    });
}

function handleCheckIn() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    document.getElementById('checkInTime').value = timeString;
    document.getElementById('attendanceStatus').textContent = 'Checked In';
    
    // Disable check in button and enable check out
    document.getElementById('checkInBtn').disabled = true;
    document.getElementById('checkOutBtn').disabled = false;
    
    // Show success message
    showNotification('Successfully checked in at ' + timeString, 'success');
}

function handleCheckOut() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    document.getElementById('checkOutTime').value = timeString;
    document.getElementById('attendanceStatus').textContent = 'Checked Out';
    
    // Calculate working hours
    calculateWorkingHours();
    
    // Disable check out button
    document.getElementById('checkOutBtn').disabled = true;
    
    // Show success message
    showNotification('Successfully checked out at ' + timeString, 'success');
}

function calculateWorkingHours() {
    const checkInTime = document.getElementById('checkInTime').value;
    const checkOutTime = document.getElementById('checkOutTime').value;
    
    if (checkInTime && checkOutTime) {
        const [checkInHour, checkInMin] = checkInTime.split(':').map(Number);
        const [checkOutHour, checkOutMin] = checkOutTime.split(':').map(Number);
        
        const checkInTotal = checkInHour * 60 + checkInMin;
        const checkOutTotal = checkOutHour * 60 + checkOutMin;
        
        const totalMinutes = checkOutTotal - checkInTotal;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        document.getElementById('workingHours').textContent = `${hours}h ${minutes}m`;
    }
}

function updateAttendanceStatus() {
    // This would typically fetch from server
    // For now, we'll use mock data
    const mockData = {
        checkInTime: null,
        checkOutTime: null,
        status: 'Not Checked In'
    };
    
    if (mockData.checkInTime) {
        document.getElementById('checkInTime').value = mockData.checkInTime;
        document.getElementById('checkInBtn').disabled = true;
    }
    
    if (mockData.checkOutTime) {
        document.getElementById('checkOutTime').value = mockData.checkOutTime;
        document.getElementById('checkOutBtn').disabled = true;
    }
    
    document.getElementById('attendanceStatus').textContent = mockData.status;
}

// Calendar Functions
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

function initializeCalendar() {
    renderCalendar(currentMonth, currentYear);
}

function renderCalendar(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Update header
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Clear previous days
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDays.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // Check if this is today
        const checkDate = new Date(year, month, day);
        if (checkDate.toDateString() === new Date().toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Add mock attendance data
        addMockAttendanceData(dayElement, day, month, year);
        
        // Add click event
        dayElement.addEventListener('click', function() {
            selectDate(day, month, year);
        });
        
        calendarDays.appendChild(dayElement);
    }
}

function addMockAttendanceData(dayElement, day, month, year) {
    // Mock attendance data for demonstration
    const mockAttendance = {
        1: 'present',
        3: 'absent',
        5: 'late',
        7: 'leave',
        10: 'present',
        12: 'late',
        15: 'present',
        18: 'leave',
        20: 'present',
        22: 'absent',
        25: 'present',
        28: 'late'
    };
    
    if (mockAttendance[day]) {
        dayElement.classList.add('has-attendance', mockAttendance[day]);
    }
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
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Update form date
    document.getElementById('currentDate').value = dateString;
    
    // Highlight selected date
    const days = document.querySelectorAll('.calendar-day');
    days.forEach(d => d.classList.remove('selected'));
    
    const selectedDay = Array.from(days).find(d => 
        d.textContent == day && !d.classList.contains('other-month')
    );
    
    if (selectedDay) {
        selectedDay.classList.add('selected');
    }
    
    // Load attendance for selected date
    loadAttendanceForDate(dateString);
}

function loadAttendanceForDate(dateString) {
    // This would typically fetch from server
    // For now, we'll reset the form for new date
    document.getElementById('checkInTime').value = '';
    document.getElementById('checkOutTime').value = '';
    document.getElementById('workingHours').textContent = '0h 0m';
    document.getElementById('attendanceStatus').textContent = 'Not Checked In';
    
    document.getElementById('checkInBtn').disabled = false;
    document.getElementById('checkOutBtn').disabled = true;
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .calendar-day.selected {
        background-color: #007bff;
        color: white;
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add Font Awesome for icons
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
});
