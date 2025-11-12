const appUrl = $('meta[name=app-url]').attr("content");

// const modalAttendance = new bootstrap.Modal('#modalAttendance', {
//   keyboard: false
// });

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
    $(`.division-item[data-department-id="${departmentId}"], .division-item[data-department-id="0"]`).removeClass('d-none');
    
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

    let departmentId = $('.col-dropdown-department').attr('data-department-id');
    
    // $('.col-dropdown-division').attr('data-department-id',1);
    // $('.col-dropdown-division').attr('data-division-id',0);
    // $('.col-dropdown-division .title-dropdown').text('All Division');

    $('.department-item[data-department-id="'+departmentId+'"]').click();

}

setDefaultDropdown();
filterEmployee();

let CURRENT_DATE = new Date();

function renderCalendar(year, month) {
    
    getEmployeeSalaryPayslipData(month+1,year);

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthNames = new Date(year,month);


    $('.calendar-month').text(`${CURRENT_DATE.toLocaleString('default', { month: 'long' })}`);
    $('.calendar-month-short').text(`${CURRENT_DATE.toLocaleString('default', { month: 'short' })}`);
    $('.calendar-year').text(`${year}`);

    $('.col-day').removeClass('d-none');

    for (let i = totalDays+1; i <= 31; i++) {
        $('.col-day[data-day="' + i + '"]').addClass('d-none');
    }

 
}

renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());

$('.calendar-prev-month').click(function() {
    CURRENT_DATE.setMonth(CURRENT_DATE.getMonth() - 1);
    renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());
});

$('.calendar-next-month').click(function() {
    CURRENT_DATE.setMonth(CURRENT_DATE.getMonth() + 1);
    renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());
});

$(document).on('click','.dropdown-month .month-item',function(){
    let monthNum = $(this).attr('data-month');
    
    CURRENT_DATE.setMonth(parseInt(monthNum)-1);

    renderCalendar(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth());

    //$('.dropdown-month.show').removeClass('show');
});

$(document).on('click','.data-fullscreen, .data-fullscreen-exit',function(){
    $('.calendar-container').toggleClass('fullscreen');
    $('.data-fullscreen').toggleClass('d-none');
});

function getEmployeeSalaryPayslipData(month,year)
{

    $.ajax({
        url: appUrl + "/salary_payslip/employee-salary-data",
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
            var dtAttendance = [];
            var employeeSalary = response.data.employeeSalary;
            
            // parseInt(largeNum).toLocaleString('id-ID');


            for (let i = 0; i < employeeSalary.length; i++) {
                const salary = employeeSalary[i];
                $('[data-employee-id="'+salary.employee_id+'"] .gaji').text(parseInt(salary.take_home_pay).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .gaji-pokok').text(parseInt(salary.basic_salary).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .uang-makan').text(parseInt(salary.meal_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .transportasi').text(parseInt(salary.transportation_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .pulsa-internet').text(parseInt(salary.internet_phone_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .jabatan').text(parseInt(salary.positional_allowance).toLocaleString('id-ID'));
                
            }
            
            if(employeeSalary.length > 0){
                
                 
                $('.employee-row.basic-row[data]')
            }

            $('.employee-row .time-in, .employee-row  .time-out').text(' ');

            
        
        }
         
    });

}

$('#btn-download-xlsx').on('click',function(){
    
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    let currentYear = CURRENT_DATE.getFullYear();

    const monthName = months[CURRENT_DATE.getMonth()];

    window.location.href = `${appUrl}/salary_payslip/employee_salary_${currentYear}_${monthName}.xlsx`;

});









