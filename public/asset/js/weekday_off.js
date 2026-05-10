const appUrl = $('meta[name=app-url]').attr("content");

const modalAttendance = new bootstrap.Modal('#modalAttendance', {
  keyboard: false
});

$('.input-search-query').on('keyup',function(){
    filterEmployee();
});

function filterEmployee(){

    let departmentId = $('.col-dropdown-department').attr('data-department-id');
    let divisionId = $('.col-dropdown-division').attr('data-division-id');

    let divisionFilter = `[data-division="${divisionId}"]`;
    let searchQuery = $('.input-search-query').val();

    $('.employee-row').addClass('d-none');
    
    if(divisionId == 0){
        divisionFilter = '';
    }

    
    if(searchQuery){
        
        $(`.employee-row[data-department="${departmentId}"]${divisionFilter}`).each(function(){
            let employeeName = $(this).find('.employee-name').text();
            if(employeeName.toLowerCase().includes(searchQuery.toLowerCase())){
                $(this).removeClass('d-none');
            }
        });

    }else{
        $(`.employee-row[data-department="${departmentId}"]${divisionFilter}`).removeClass('d-none');
    }

}


$('.department-item').on('click',function(){
    let departmentId = $(this).attr('data-department-id');
    let departmentName = $(this).attr('data-department-name');

    $('.col-dropdown-department').attr('data-department-id',departmentId);
    $('.col-dropdown-department .title-dropdown').text(departmentName);
    
    $('.col-dropdown-division').attr('data-division-id',0);
    $('.col-dropdown-division .title-dropdown').text('All Division');

    $('.division-item').addClass('d-none');
    $(`.division-item[data-department-id="${departmentId}"]`).removeClass('d-none');
    $(`.division-item[data-department-id="0"]`).removeClass('d-none');
    filterEmployee();
});

$('.division-item').on('click',function(){
    let departmentId = $(this).attr('data-department-id');
    let divisionId = $(this).attr('data-division-id');
    let divisionName = $(this).attr('data-division-name');
 
    $('.col-dropdown-division').attr('data-department-id',departmentId);
    $('.col-dropdown-division').attr('data-division-id',divisionId);
    $('.col-dropdown-division .title-dropdown').text(divisionName);
    
    
    filterEmployee();
});

function setDefaultDropdown(){


    
    $('.col-dropdown-department').attr('data-department-id',1);
    $('.col-dropdown-department .title-dropdown').text('ACER');

    $('.col-dropdown-division').attr('data-department-id',1);
    $('.col-dropdown-division').attr('data-division-id',0);
    $('.col-dropdown-division .title-dropdown').text('All Division');

    $('.department-item:eq(0)').click();

}

setDefaultDropdown();
filterEmployee();


$(document).on('click','.data-fullscreen, .data-fullscreen-exit',function(){
    $('.weekday-off-container').toggleClass('fullscreen');
    $('.data-fullscreen').toggleClass('d-none');
});


$('#btn-save-weekday-off').on('click',function(){
    

    const rowEmployee = [];

    $('.employee-row:not(.d-none)').each(function(){

        let employeeId = $(this).attr('data-employee-id');
        let divisionId = $(this).attr('data-division');
        let weekDay = [];

        $(this).find('.col-day.day-off').each(function(){
            weekDay.push($(this).attr('data-weekday'));
        });


        rowEmployee[rowEmployee.length]= [employeeId,divisionId,`${weekDay.join(',')}`];

    })

    const jsonEmployee = JSON.stringify(rowEmployee);

    saveWeekdayOff(jsonEmployee);
});


function saveWeekdayOff(jsonEmployee)
{

    const formData = new FormData();
        // Appending a string value
    formData.append('json_weekday_off', jsonEmployee);
    formData.append('_token', $('meta[name="csrf-token"]').attr('content'));

    $.ajax({
        url: appUrl + "/weekday_off/save-employee-weekday-off",
        type: "POST",
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){

            $('.col-weekday-off .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('.col-weekday-off .loader').fadeOut('fast');
        },
        success: function(response) {

            var resData = response.data;
            
            showAlertMsg(response.message);
            $('.col-weekday-off .loader').fadeOut('fast');
        }
         
    });

}



$(document).on('click','tbody .col-day',function(){

    // let dayCalendar = $(this).attr('data-day');
    // let employeeId = $(this).closest('.employee-row').attr('data-employee-id');

    $(this).toggleClass('day-off');
    
    
});

$(document).on('click','thead .col-day',function(){

    let weekDay = $(this).attr('data-weekday');
    
    $(this).toggleClass('day-off',function(){

    });

    let hasDayOff = $(this).hasClass('day-off');
    if (hasDayOff) {
        $(`tbody tr:not(.d-none) [data-weekday="${weekDay}"]`).addClass('day-off');
    } else {
        $(`tbody tr:not(.d-none) [data-weekday="${weekDay}"]`).removeClass('day-off');
    }
    
    
});

function getAttendanceDetail(employeeId,dateAttendance)
{

    $.ajax({
        url: appUrl + "/attendance_tracking/get-attendance-detail",
        type: "GET",
        data:{
            'EMPLOYEE_ID' : employeeId,
            'DATE_ATTENDANCE' : dateAttendance,
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            //$('.loader').fadeOut('fast');
            //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            var resData = response.data;
            
            let employee = resData.employee;
            let attendance = resData.attendance;

            let employeeShift = formatTimeShort(attendance.shift_time_start)+' - '+formatTimeShort(attendance.shift_time_end);

            $('#modalAttendance .attendance-date').text(formateDateFull(attendance.date_attendance));
            
            $('#modalAttendance .employee-name').text(employee.name);
            $('#modalAttendance .employee-shift').text(employeeShift);

            $('#modalAttendance .attendance-late').text(formatTimeShort(attendance.time_late)).removeClass('text-danger');

            if(attendance.time_late != null && attendance.time_late != '00:00:00'){
                $('#modalAttendance .attendance-late').addClass('text-danger');   
            }

            $('#modalAttendance .attendance-checkin').text(formatTimeShort(attendance.time_in));
            $('#modalAttendance .attendance-checkout').text(formatTimeShort(attendance.time_out));
            $('#modalAttendance .attendance-work-duration').text(formatTimeShort(attendance.total_work_duration));

            
            //attendance-checkin attendance-checkout attendance-work-duration

            modalAttendance.show();
        
        }
         
    });

}

$('#btn-download-xlsx').on('click',function(){
    
    let department = 'all';
    let division = 'all';

    window.location.href = `${appUrl}/weekdays_off/export/weekday_off_${department}_${division}.xlsx`;

});

