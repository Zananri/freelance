const appUrl = $('meta[name=app-url]').attr("content");

const modalSalaryEdit = new bootstrap.Modal('#modalSalaryEdit', {
   keyboard: false
});

const modalPayslipSend = new bootstrap.Modal('#modalPayslipSend', {
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
                let employeeId = $(this).attr('data-employee-id');
                $('.employee-row[data-employee-id="'+employeeId+'"]').removeClass('d-none');
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
            $('.card-content .box-loader').fadeIn('fast');
            
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('.card-content .box-loader').fadeOut('fast');
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



            $('.set-row .gaji-pokok').text('0');
            $('.set-row .uang-makan').text('0');
            $('.set-row .transportasi').text('0');
            $('.set-row .pulsa-internet').text('0');
            $('.set-row .jabatan').text('0');
            $('.set-row .bonus').text('0');
            $('.set-row .lembur').text('0');
            $('.set-row .thr').text('0');
            
            $('.set-row .bonus').text('0');
            $('.set-row .lembur').text('0');
            $('.set-row .thr').text('0');
            
            $('.set-row .btn-icon.payslip, .set-row .btn-icon.send').addClass('d-none');
            
            
            for (let i = 0; i < DATA_EMPLOYEE_PAYSLIP.length; i++) {
                const salary = DATA_EMPLOYEE_PAYSLIP[i];
                
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .btn-icon.send').removeClass('d-none');
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .btn-icon.payslip').removeClass('d-none');
                
                $('[data-employee-id="'+salary.employee_id+'"] .gaji').text('Rp '+parseInt(salary.take_home_pay).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .gaji-pokok').text(parseInt(salary.prorate_basic_salary).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .uang-makan').text(parseInt(salary.prorate_meal_allowance).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .transportasi').text(parseInt(salary.prorate_transportation_allowance).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .pulsa-internet').text(parseInt(salary.prorate_internet_phone_allowance).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .jabatan').text(parseInt(salary.prorate_positional_allowance).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .bonus').text(parseInt(salary.bonus).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .lembur').text(parseInt(salary.overtime).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .thr').text(parseInt(salary.thr).toLocaleString('id-ID'));
                
                $('[data-employee-id="'+salary.employee_id+'"] .hari-bln').text(salary.total_day_active);
                $('[data-employee-id="'+salary.employee_id+'"] .hari-kerja').text(salary.total_working_day);
                $('[data-employee-id="'+salary.employee_id+'"] .hari-um').text(salary.total_working_day_meal);

                $('[data-employee-id="'+salary.employee_id+'"] .bonus').text(parseInt(salary.bonus).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .lembur').text(parseInt(salary.overtime).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .thr').text(parseInt(salary.thr).toLocaleString('id-ID'));
                
            }
            

            
        
            $('.card-content .box-loader').delay(500).fadeOut('fast');
        }
         
    });

}


const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

$('#btn-download-xlsx').on('click',function(){
    
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    let currentYear = CURRENT_DATE.getFullYear();

    const monthName = months[CURRENT_DATE.getMonth()];

    window.location.href = `${appUrl}/salary_payslip/employee_salary_${currentYear}_${monthName}.xlsx`;

});

$('.table-data .btn-icon.edit-data').on('click',function(){

    let employeeId = $(this).closest('.employee-row').attr('data-employee-id');
    let employeeName = $(this).closest('.employee-row').attr('data-employee-name');
    let employeePhoto = $(this).closest('.employee-row').attr('data-employee-photo');
    let currentDate = CURRENT_DATE.toISOString();

    $('#modalSalaryEdit .employee-name').text(employeeName);
    $('[name="salary_date"]').val(currentDate);

    
    getEmployeeSalaryPayslipDetail(employeeId, CURRENT_DATE.getMonth()+1,CURRENT_DATE.getFullYear());

});

$('.table-data .btn-icon.payslip').on('click',function(){

    let employeeId = $(this).closest('.employee-row').attr('data-employee-id');
    let employeeName = $(this).closest('.employee-row').attr('data-employee-name');
    let currentDate = CURRENT_DATE.toISOString();

    $('#modalSalaryEdit .employee-name').text(employeeName);
    $('[name="salary_date"]').val(currentDate);

    let linkPayslip = appUrl + "/salary_payslip/view_payslip/"+employeeId+"/"+CURRENT_DATE.getFullYear()+"/"+(CURRENT_DATE.getMonth()+1);

    window.open(linkPayslip, "_blank");

});

$('.btn-close-modal-edit').on('click',function(){
    modalSalaryEdit.hide();
});

let employeeDetail = [];
let employeePayslip = [];
let employeeSalary = [];
let employeeAttendanceAll = [];
let employeeAttendanceAbsent = [];
let employeeAttendanceNotComplete = [];
let employeeTotalActiveDay = 0;

function getEmployeeSalaryPayslipDetail(employeeId,month,year)
{

    $.ajax({
        url: appUrl + "/salary_payslip/employee-salary-detail",
        type: "GET",
        data:{
            'EMPLOYEE_ID' : employeeId,
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
            
            let bonus = 0;
            let overtime = 0;
            let thp = 0;
            let thr = 0;
            let absent = 0;
            let attendanceNotComplete = 0;


            employeeDetail = response.data.employee;
            employeeTotalActiveDay = response.data.totalActiveDay;
            employeePayslip = response.data.employeePayslip;
            employeeSalary = response.data.employeeSalary;
            employeeAttendanceAll = response.data.employeeAttendanceAll;
            employeeAttendanceAbsent = response.data.employeeAttendanceAbsent;
            employeeAttendanceNotComplete = response.data.employeeAttendanceNotComplete;
            
            // parseInt(largeNum).toLocaleString('id-ID');

            $('#modalSalaryEdit [name="employee_id"]').val(employeeDetail.id);
            $('#modalSalaryEdit [name="year"]').val(year);
            $('#modalSalaryEdit [name="month"]').val(month);
            
            $('#modalSalaryEdit [name="active_day"]').val(employeeTotalActiveDay);
            $('#modalSalaryEdit [name="working_day"]').val(employeeTotalActiveDay - employeeAttendanceAbsent);
            $('#modalSalaryEdit [name="meal_day"]').val(employeeTotalActiveDay);

            $('#modalSalaryEdit [name="basic_salary"').val(employeeSalary.basic_salary);

            $('#modalSalaryEdit [name="positional_allowance"').val(employeeSalary.positional_allowance);
            $('#modalSalaryEdit [name="meal_allowance"]').val(employeeSalary.meal_allowance);

            $('#modalSalaryEdit [name="transportation_allowance"]').val(employeeSalary.transportation_allowance);
            $('#modalSalaryEdit [name="internet_phone_allowance"]').val(employeeSalary.internet_phone_allowance);

            
            
            absent = employeeAttendanceAbsent;
            
            attendanceNotComplete = employeeAttendanceNotComplete;
            
            
            $('#modalSalaryEdit [name="attendance_not_complete"]').val(attendanceNotComplete);
            
            $('#modalSalaryEdit .jumlah_absensi_tidak_lengkap').text(attendanceNotComplete+' hari');
            
            $('#modalSalaryEdit .hitungan_absensi_tidak_lengkap').text( (0 - (attendanceNotComplete * 50000)).toLocaleString('id-ID'));
            
            $('#modalSalaryEdit .info_working_day').attr('data-bs-title','Tidak Masuk Kerja : '+parseInt(absent) + ' <br> Absensi tidak lengkap : '+parseInt(attendanceNotComplete));
            
            $('#modalSalaryEdit .info_basic_salary').attr('data-bs-title','Rp '+parseInt(employeeSalary.basic_salary).toLocaleString('id-ID'));
            $('#modalSalaryEdit .info_positional_allowance').attr('data-bs-title','Rp '+parseInt(employeeSalary.positional_allowance).toLocaleString('id-ID'));
            
            $('#modalSalaryEdit .info_meal_allowance').attr('data-bs-title','Rp '+parseInt(employeeSalary.meal_allowance).toLocaleString('id-ID'));
            $('#modalSalaryEdit .info_transportation_allowance').attr('data-bs-title','Rp '+parseInt(employeeSalary.transportation_allowance).toLocaleString('id-ID'));
            $('#modalSalaryEdit .info_internet_phone_allowance').attr('data-bs-title','Rp '+parseInt(employeeSalary.internet_phone_allowance).toLocaleString('id-ID'));

            thp = employeeSalary.take_home_pay;

            if(employeePayslip != null){
                
                // $('#modalSalaryEdit [name="active_day"]').val(employeePayslip.total_day_active);
                // $('#modalSalaryEdit [name="working_day"]').val(employeePayslip.total_working_day);
                // $('#modalSalaryEdit [name="meal_day"]').val(employeePayslip.total_working_day_meal);
                
                // $('#modalSalaryEdit [name="basic_salary"').val(employeePayslip.prorate_basic_salary);
            
                // $('#modalSalaryEdit [name="positional_allowance"').val(employeePayslip.prorate_positional_allowance);
                // $('#modalSalaryEdit [name="meal_allowance"]').val(employeePayslip.prorate_meal_allowance);

                // $('#modalSalaryEdit [name="transportation_allowance"]').val(employeePayslip.prorate_transportation_allowance);
                // $('#modalSalaryEdit [name="internet_phone_allowance"]').val(employeePayslip.prorate_internet_phone_allowance);
                
                $('#modalSalaryEdit [name="note"]').val(employeePayslip.note);

                
                bonus = employeePayslip.bonus;
                overtime = employeePayslip.overtime;
                thr = employeePayslip.thr;

                // thp = employeePayslip.take_home_pay;
            }

            $('#modalSalaryEdit [name="bonus"]').val(bonus);
            $('#modalSalaryEdit [name="overtime"]').val(overtime);
            $('#modalSalaryEdit [name="thr"]').val(thr);

            thp = thp - attendanceNotComplete * 50000;



            $('#modalSalaryEdit .employee-name').text(employeeDetail.name);
            $('#modalSalaryEdit .employee-division').text(employeeDetail.division.name_division);
            $('#modalSalaryEdit .employee-salary-thp').text('Rp '+parseInt(thp).toLocaleString('id-ID'));
            
            countSalary();
            
            modalSalaryEdit.show();
            
            
            const newtooltipTriggerList = document.querySelectorAll('#modalSalaryEdit [data-bs-toggle="tooltip"]');
            const newtooltipList = [...newtooltipTriggerList].map(newtooltipTriggerEl => new bootstrap.Tooltip(newtooltipTriggerEl));
            
        
        }
         
    });

}

$('#modalSalaryEdit [name="working_day"], #modalSalaryEdit [name="meal_day"], #modalSalaryEdit [name="active_day"]').on('change',function(){
    countSalary();
});

$('#modalSalaryEdit [name="bonus"], #modalSalaryEdit [name="overtime"],#modalSalaryEdit [name="thr"]').on('change',function(){
    countSalary();
});

function countSalary(){
    let thp = 0;

    let totalDayActive = parseInt($('#modalSalaryEdit [name="active_day"]').val());
    let totalWorkingDay = parseInt($('#modalSalaryEdit [name="working_day"]').val());
    let totalWorkingDayMeal = parseInt($('#modalSalaryEdit [name="meal_day"]').val());
    let bonus = parseInt($('#modalSalaryEdit [name="bonus"]').val());
    let overtime = parseInt($('#modalSalaryEdit [name="overtime"]').val());
    let thr = parseInt($('#modalSalaryEdit [name="thr"]').val());

    let basicSalary = 0;
    let positionalAllowance = 0;
    let mealAllowance = 0;
    let transportationAllowance = 0;
    let internetPhoneAllowance = 0;
    let attendanceNotComplete = parseInt($('#modalSalaryEdit [name="attendance_not_complete"]').val());;

    if(employeeSalary != null){

        basicSalary = (employeeSalary.basic_salary / totalDayActive) * totalWorkingDay;
        positionalAllowance = (employeeSalary.positional_allowance / totalDayActive) * totalWorkingDay;
        mealAllowance = (employeeSalary.meal_allowance / totalDayActive) * totalWorkingDayMeal
        transportationAllowance = (employeeSalary.transportation_allowance / totalDayActive) * totalWorkingDay;
        internetPhoneAllowance = (employeeSalary.internet_phone_allowance / totalDayActive) * totalWorkingDay;
    }
    
    if(employeePayslip != null){

        basicSalary = (employeePayslip.basic_salary / totalDayActive) * totalWorkingDay;
        positionalAllowance = (employeePayslip.positional_allowance / totalDayActive) * totalWorkingDay;
        mealAllowance = (employeePayslip.meal_allowance / totalDayActive) * totalWorkingDayMeal
        transportationAllowance = (employeePayslip.transportation_allowance / totalDayActive) * totalWorkingDay;
        internetPhoneAllowance = (employeePayslip.internet_phone_allowance / totalDayActive) * totalWorkingDay;

    }

    thp = parseInt(basicSalary) - parseInt(attendanceNotComplete*50000) + parseInt(positionalAllowance) + parseInt(mealAllowance) + parseInt(transportationAllowance) + parseInt(internetPhoneAllowance) + parseInt(bonus) + parseInt(overtime) + parseInt(thr);

    if(employeeAttendanceNotComplete.length > 0){
        thp = thp - (employeeAttendanceNotComplete[0].total_attendance * 50000);
    }
    

    $('#modalSalaryEdit [name="basic_salary"').val(parseInt(basicSalary));
    $('#modalSalaryEdit [name="positional_allowance"').val(parseInt(positionalAllowance));
    $('#modalSalaryEdit [name="meal_allowance"]').val(parseInt(mealAllowance));
    $('#modalSalaryEdit [name="transportation_allowance"]').val(parseInt(transportationAllowance));
    $('#modalSalaryEdit [name="internet_phone_allowance"]').val(parseInt(internetPhoneAllowance));


    $('#modalSalaryEdit .employee-salary-thp').text('Rp '+parseInt(thp).toLocaleString('id-ID'));
}

$('#modalSalaryEdit .btn-save-salary').on('click',function(){
    saveEmployeeSalaryPayslip();
});

function saveEmployeeSalaryPayslip(){

    $.ajax({
        url: appUrl + "/salary_payslip/save-employee-salary-by-year-month",
        type: "POST",
        data: new FormData($('#form-edit-salary').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#modalSalaryEdit .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#modalSalaryEdit .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            getEmployeeSalaryPayslipData(CURRENT_DATE.getMonth()+1,CURRENT_DATE.getFullYear());
            
            showAlertMsg(res.message,'success',3000);

            modalSalaryEdit.hide();
            $('#modalSalaryEdit .box-loader').fadeOut();
            $('#form-edit-salary')[0].reset();
            
        }
    });
}












