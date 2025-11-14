const appUrl = $('meta[name=app-url]').attr("content");

const modalSalaryEdit = new bootstrap.Modal('#modalSalaryEdit', {
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

let DATA_EMPLOYEE_SALARY = [];
let DATA_EMPLOYEE_ATTENDANCE = [];
let DATA_EMPLOYEE_PAYSLIP = [];
let DATA_TOTAL_ACTIVE_DAY = 0;

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
            
            DATA_TOTAL_ACTIVE_DAY = response.data.totalActiveDay;

            DATA_EMPLOYEE_PAYSLIP = response.data.employeePayslip;
            DATA_EMPLOYEE_SALARY = response.data.employeeSalary;
            DATA_EMPLOYEE_ATTENDANCE = response.data.employeeAttendance;
            
            // parseInt(largeNum).toLocaleString('id-ID');

            $('.employee-row .hari-bln, .employee-row .hari-kerja, .employee-row .hari-um').text(DATA_TOTAL_ACTIVE_DAY);

            for (let i = 0; i < DATA_EMPLOYEE_SALARY.length; i++) {
                const salary = DATA_EMPLOYEE_SALARY[i];
                $('[data-employee-id="'+salary.employee_id+'"] .gaji').text('Rp '+parseInt(salary.take_home_pay).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .gaji-pokok').text(parseInt(salary.basic_salary).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .uang-makan').text(parseInt(salary.meal_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .transportasi').text(parseInt(salary.transportation_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .pulsa-internet').text(parseInt(salary.internet_phone_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .jabatan').text(parseInt(salary.positional_allowance).toLocaleString('id-ID'));
                
            }
            
            for (let i = 0; i < DATA_EMPLOYEE_ATTENDANCE.length; i++) {
                const attendance = DATA_EMPLOYEE_ATTENDANCE[i];
                $('[data-employee-id="'+attendance.employee_id+'"] .hari-kerja').text(attendance.total_attendance);
            }

            for (let i = 0; i < DATA_EMPLOYEE_SALARY.length; i++) {
                const salary = DATA_EMPLOYEE_SALARY[i];

                let basicSalary = salary.basic_salary;
                let mealAllowance = salary.meal_allowance;
                let transportationAllowance = salary.transportation_allowance;
                let internetPhoneAllowance = salary.internet_phone_allowance;
                let positionalAllowance = salary.positional_allowance;

                let takeHomePay = basicSalary + mealAllowance + transportationAllowance + internetPhoneAllowance + positionalAllowance;

                let employeeAttendanceTotalDay = 0;

                if(DATA_EMPLOYEE_ATTENDANCE.length > 0){

                    
                    for (let j = 0; j < DATA_EMPLOYEE_ATTENDANCE.length; j++) {
                        const item = DATA_EMPLOYEE_ATTENDANCE[j];

                        if(item.employee_id == salary.employee_id){
                            employeeAttendanceTotalDay = item.total_attendance;
                        }
                    }

                    if(employeeAttendanceTotalDay > 0){
                        basicSalary = (salary.basic_salary/DATA_TOTAL_ACTIVE_DAY)*employeeAttendanceTotalDay;
                        // mealAllowance = (salary.meal_allowance/DATA_TOTAL_ACTIVE_DAY)*employeeAttendanceTotalDay;
                        transportationAllowance = (salary.transportation_allowance/DATA_TOTAL_ACTIVE_DAY)*employeeAttendanceTotalDay;
                        internetPhoneAllowance = (salary.internet_phone_allowance/DATA_TOTAL_ACTIVE_DAY)*employeeAttendanceTotalDay;   
                        
                        takeHomePay = basicSalary + mealAllowance + transportationAllowance + internetPhoneAllowance + positionalAllowance;

                    }

                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .gaji-pokok').text(parseInt(basicSalary).toLocaleString('id-ID'));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .uang-makan').text(parseInt(mealAllowance).toLocaleString('id-ID'));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .transportasi').text(parseInt(transportationAllowance).toLocaleString('id-ID'));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .pulsa-internet').text(parseInt(internetPhoneAllowance).toLocaleString('id-ID'));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .jabatan').text(parseInt(positionalAllowance).toLocaleString('id-ID'));
                    
                }
                

                


                
            }
            
        
        }
         
    });

}

$('#btn-download-xlsx').on('click',function(){
    
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    let currentYear = CURRENT_DATE.getFullYear();

    const monthName = months[CURRENT_DATE.getMonth()];

    window.location.href = `${appUrl}/salary_payslip/employee_salary_${currentYear}_${monthName}.xlsx`;

});

$('.btn-icon.edit-data').on('click',function(){

    let employeeId = $(this).closest('.basic-row').attr('data-employee-id');
    let employeeName = $(this).closest('.basic-row').attr('data-employee-name');
    let employeePhoto = $(this).closest('.basic-row').attr('data-employee-photo');
    let currentDate = CURRENT_DATE.toISOString();

    $('#modalSalaryEdit .employee-name').text(employeeName);
    $('[name="salary_date"]').val(currentDate);

    modalSalaryEdit.show();
});

$('.btn-close-modal-edit').on('click',function(){
    modalSalaryEdit.hide();
});











