const appUrl = $('meta[name=app-url]').attr("content");

const modalAttendance = new bootstrap.Modal('#modalAttendance', {
  keyboard: false
});

$('.input-search-query').on('keyup',function(){
    let searchQuery = $(this).val();
    console.log(searchQuery);

    if(searchQuery){
        $('.employee-row').addClass('d-none');

        $('.employee-row').each(function(){
            let employeeName = $(this).find('.employee-name').text();
            if(employeeName.toLowerCase().includes(searchQuery.toLowerCase())){
                $(this).removeClass('d-none');
            }
        });

    }else{
        $('.employee-row').removeClass('d-none');
    }
});



let CURRENT_DATE = new Date();



$(document).on('click','.data-fullscreen, .data-fullscreen-exit',function(){
    $('.weekday-off-container').toggleClass('fullscreen');
    $('.data-fullscreen').toggleClass('d-none');
});

function getAttendanceTrackingData(month,year)
{

    $.ajax({
        url: appUrl + "/attendance_tracking/get-attendance-tracking-data",
        type: "GET",
        data:{
            'YEAR' : year,
            'MONTH' : month,
        },
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('.loader').fadeOut('fast');
          //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            var resData = response.data;
            
            $('.employee-row .time-in, .employee-row  .time-out').text(' ');

            $('.table-weekday-off .col-day').removeClass('is-late');

            for (let i = 0; i < resData.length; i++) {
                const attendance = resData[i];

                const dateString = attendance.date_attendance;
                const dateObject = new Date(dateString);
                const dayOfMonth = dateObject.getDate();

                const timeIn = formatTimeDisplay(attendance.time_in);
                const timeOut = formatTimeDisplay(attendance.time_out);

                //console.log(attendance.time_late);

                if(attendance.time_late != null && attendance.time_late != '00:00:00'){
                    $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"]').addClass('is-late');   
                }

                $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-in').text(timeIn);
                $('[data-employee-id="'+attendance.employee_id+'"] [data-day="'+dayOfMonth+'"] .time-out').text(timeOut);
                
                
                
            }

            // "id": 1,
            // "employee_id": 1,
            // "date_attendance": "2025-08-12T17:00:00.000000Z",
            // "time_in": "15:24:00",
            // "time_out": null,
            // "time_late": "06:24:00",
            // "type_attendance": "check_in",
            // "note": null,
            // "image": null,
            // "status": "PRESENT",
            // "created_by": null,
            // "updated_by": null,
            // "deleted_by": null,
            // "created_at": "2025-08-13T01:24:26.000000Z",
            // "updated_at": "2025-08-13T01:24:26.000000Z"
        
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


