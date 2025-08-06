<x-office-layout>
    <x-slot name="menu_active">
        {{ __('attendance') }}
    </x-slot>
    <x-slot name="head_slot">
        <link href="{{ asset('asset/css/attendance.css') }}" rel="stylesheet">
    </x-slot>
    
    <div class="title-content">
        <h2>Attendance</h2>
    </div>
    
    <div class="body-content scrollable-container rounded-4 p-5">
        <div class="attendance-container">
            <!-- Left Section - Attendance Form -->
            <div class="attendance-left">
                <div class="attendance-header">
                    <h3>Daily Attendance</h3>
                    <p class="text-muted">Please check in and check out for your attendance record</p>
                </div>
                
                <div class="attendance-form">
                    <div class="form-group">
                        <label>Employee ID</label>
                        <input type="text" class="form-control" value="EMP001" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label>Employee Name</label>
                        <input type="text" class="form-control" value="John Doe" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" class="form-control" id="currentDate" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label>Check In Time</label>
                        <input type="time" class="form-control" id="checkInTime" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label>Check Out Time</label>
                        <input type="time" class="form-control" id="checkOutTime" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label>Status</label>
                        <select class="form-control">
                            <option>Present</option>
                            <option>Absent</option>
                            <option>Late</option>
                            <option>Leave</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea class="form-control" rows="3" placeholder="Add notes if any..."></textarea>
                    </div>
                    
                    <div class="attendance-buttons">
                        <button type="button" class="btn btn-success" id="checkInBtn">
                            <i class="fas fa-sign-in-alt"></i> Check In
                        </button>
                        <button type="button" class="btn btn-danger" id="checkOutBtn">
                            <i class="fas fa-sign-out-alt"></i> Check Out
                        </button>
                    </div>
                </div>
                
                <div class="attendance-summary mt-4">
                    <h4>Today's Summary</h4>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <div class="card-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="card-info">
                                <h5>Working Hours</h5>
                                <p id="workingHours">0h 0m</p>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                            <div class="card-info">
                                <h5>Status</h5>
                                <p id="attendanceStatus">Not Checked In</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Section - Calendar -->
            <div class="attendance-right">
                <div class="calendar-container">
                    <div class="calendar-header">
                        <button class="btn btn-sm" id="prevMonth">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h4 id="currentMonthYear">July 2024</h4>
                        <button class="btn btn-sm" id="nextMonth">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="calendar-weekdays">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>
                    
                    <div class="calendar-days" id="calendarDays">
                        <!-- Calendar days will be generated by JavaScript -->
                    </div>
                    
                    <div class="calendar-legend mt-3">
                        <div class="legend-item">
                            <span class="legend-color present"></span>
                            <span>Present</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color absent"></span>
                            <span>Absent</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color late"></span>
                            <span>Late</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color leave"></span>
                            <span>Leave</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
   
    <x-slot name="script_slot">
        <script src="{{ asset('asset/js/attendance.js') }}"></script>
    </x-slot>
</x-office-layout>
