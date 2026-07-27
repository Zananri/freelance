const appUrl = $('meta[name=app-url]').attr("content");

const modalSalaryEdit = new bootstrap.Modal('#modalSalaryEdit', {
   keyboard: false
});

const modalPayslipSend = new bootstrap.Modal('#modalPayslipSend', {
   keyboard: false
});

const modalPayslipRecalled = new bootstrap.Modal('#modalPayslipRecalled', {
   keyboard: false
});

let salaryPayslipSearchTimer = null;

function updateDivisionOptions(departmentId) {
    $('.division-item').addClass('d-none');
    $(`.division-item[data-department-id="${departmentId}"], .division-item[data-department-id="0"]`).removeClass('d-none');
}

function reloadSalaryPayslipPage(filters) {
    const url = new URL(window.location.href);

    if (filters.departmentId !== undefined) {
        const departmentId = String(filters.departmentId);
        if (departmentId === 'all' || departmentId === '0' || departmentId === '') {
            url.searchParams.delete('department');
        } else {
            url.searchParams.set('department', departmentId);
        }
    }

    if (filters.divisionId !== undefined) {
        const divisionId = String(filters.divisionId);
        if (divisionId === 'all' || divisionId === '0' || divisionId === '') {
            url.searchParams.delete('division');
        } else {
            url.searchParams.set('division', divisionId);
        }
    }

    if (filters.query !== undefined) {
        const query = String(filters.query).trim();
        if (query === '') {
            url.searchParams.delete('query');
        } else {
            url.searchParams.set('query', query);
        }
    }

    window.location.href = url.toString();
}

$('.input-search-query').on('keyup', function (event) {
    if (event.key === 'Enter') {
        reloadSalaryPayslipPage({
            query: $(this).val(),
            departmentId: $('.col-dropdown-department').attr('data-department-id'),
            divisionId: $('.col-dropdown-division').attr('data-division-id'),
        });
        return;
    }

    clearTimeout(salaryPayslipSearchTimer);
    salaryPayslipSearchTimer = setTimeout(function () {
        reloadSalaryPayslipPage({
            query: $('.input-search-query').val(),
            departmentId: $('.col-dropdown-department').attr('data-department-id'),
            divisionId: $('.col-dropdown-division').attr('data-division-id'),
        });
    }, 400);
});

$('.department-item').on('click',function(){
    let departmentId = $(this).attr('data-department-id');
    let departmentName = $(this).attr('data-department-name');

    clearTimeout(salaryPayslipSearchTimer);

    $('.col-dropdown-department').attr('data-department-id', departmentId);
    $('.col-dropdown-department .title-dropdown').text(departmentName);

    $('.col-dropdown-division').attr('data-division-id', 0);
    $('.col-dropdown-division .title-dropdown').text('All Site');

    updateDivisionOptions(departmentId);

    reloadSalaryPayslipPage({
        departmentId: departmentId,
        divisionId: 0,
        query: $('.input-search-query').val(),
    });
});

$('.division-item').on('click',function(){
    let departmentId = $(this).attr('data-department-id');
    let divisionId = $(this).attr('data-division-id');
    let divisionName = $(this).attr('data-division-name');

    clearTimeout(salaryPayslipSearchTimer);
 
    $('.col-dropdown-division').attr('data-department-id',departmentId);
    $('.col-dropdown-division').attr('data-division-id',divisionId);
    $('.col-dropdown-division .title-dropdown').text(divisionName);

    reloadSalaryPayslipPage({
        departmentId: $('.col-dropdown-department').attr('data-department-id'),
        divisionId: divisionId,
        query: $('.input-search-query').val(),
    });
});

updateDivisionOptions($('.col-dropdown-department').attr('data-department-id'));

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
            $('.basic-row .payslip-sent').addClass('d-none');
            $('.set-row .btn-icon.recalled').addClass('d-none');

            for (let i = 0; i < DATA_EMPLOYEE_SALARY.length; i++) {
                const salary = DATA_EMPLOYEE_SALARY[i];
                
                $('[data-employee-id="'+salary.employee_id+'"] .gaji').text('Rp '+parseInt(salary.take_home_pay).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .gaji-pokok').text(parseInt(salary.basic_salary).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .bpjs-allowance').text(parseInt(salary.bpjs_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .bpjs-tenaga-kerja-allowance').text(parseInt(salary.bpjs_tenaga_kerja_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .pension-allowance').text(parseInt(salary.pension_allowance).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .jabatan').text(parseInt(salary.positional_allowance).toLocaleString('id-ID'));
                
            }
            
            for (let i = 0; i < DATA_EMPLOYEE_ATTENDANCE.length; i++) {
                const attendance = DATA_EMPLOYEE_ATTENDANCE[i];
                $('[data-employee-id="'+attendance.employee_id+'"] .hari-kerja').text(attendance.total_attendance);
            }

            
            for (let i = 0; i < DATA_EMPLOYEE_SALARY.length; i++) {
                const salary = DATA_EMPLOYEE_SALARY[i];

                let basicSalary = salary.basic_salary;
                let bpjsAllowance = salary.bpjs_allowance;
                let bpjsTenagaKerjaAllowance = salary.bpjs_tenaga_kerja_allowance;
                let pensionAllowance = salary.pension_allowance;
                let positionalAllowance = salary.positional_allowance;

                let takeHomePay = basicSalary + bpjsAllowance + bpjsTenagaKerjaAllowance + pensionAllowance + positionalAllowance;

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
                        bpjsTenagaKerjaAllowance = (salary.bpjs_tenaga_kerja_allowance/DATA_TOTAL_ACTIVE_DAY)*employeeAttendanceTotalDay;
                        pensionAllowance = (salary.pension_allowance/DATA_TOTAL_ACTIVE_DAY)*employeeAttendanceTotalDay;   
                        
                        takeHomePay = basicSalary + bpjsAllowance + bpjsTenagaKerjaAllowance + pensionAllowance + positionalAllowance;

                    }

                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .gaji-pokok').text(parseInt(basicSalary).toLocaleString('id-ID'));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .bpjs-kesehatan').text(parseInt(bpjsAllowance).toLocaleString('id-ID'));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .bpjs-tk').text(parseInt(bpjsTenagaKerjaAllowance).toLocaleString('id-ID'));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .pensiun').text(parseInt(pensionAllowance).toLocaleString('id-ID'));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .jabatan').text(parseInt(positionalAllowance).toLocaleString('id-ID'));
                    
                }
            }



            $('.set-row .gaji-pokok').text('0');
            $('.set-row .bpjs-kesehatan').text('0');
            $('.set-row .bpjs-tk').text('0');
            $('.set-row .pensiun').text('0');
            $('.set-row .jabatan').text('0');
            $('.set-row .kompensasi-pkwt').text('0');
            $('.set-row .thr').text('0');
            $('.set-row .potongan').text('0');
            
            $('.set-row .btn-icon.payslip, .set-row .btn-icon.send, .set-row .btn-icon.recalled').addClass('d-none');
            
            
            for (let i = 0; i < DATA_EMPLOYEE_PAYSLIP.length; i++) {
                const salary = DATA_EMPLOYEE_PAYSLIP[i];

                $('.set-row[data-employee-id="'+salary.employee_id+'"] .btn-icon.send').removeClass('d-none');
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .btn-icon.payslip').removeClass('d-none');
                
                $('[data-employee-id="'+salary.employee_id+'"] .gaji').text('Rp '+parseInt(salary.take_home_pay).toLocaleString('id-ID'));

                $('.set-row[data-employee-id="'+salary.employee_id+'"] .gaji-pokok').text(parseInt(salary.prorate_basic_salary).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .bpjs-kesehatan').text(parseInt(salary.prorate_bpjs_allowance).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .bpjs-tk').text(parseInt(salary.prorate_bpjs_tenaga_kerja_allowance).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .pensiun').text(parseInt(salary.prorate_pension_allowance).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .jabatan').text(parseInt(salary.prorate_positional_allowance).toLocaleString('id-ID'));
                
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .kompensasi-pkwt').text(parseInt(salary.kompensasi_pkwt).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .potongan').text(parseInt(salary.deduction).toLocaleString('id-ID'));
                $('.set-row[data-employee-id="'+salary.employee_id+'"] .thr').text(parseInt(salary.thr).toLocaleString('id-ID'));
                
                $('[data-employee-id="'+salary.employee_id+'"] .hari-bln').text(salary.total_day_active);
                $('[data-employee-id="'+salary.employee_id+'"] .hari-kerja').text(salary.total_working_day);
                $('[data-employee-id="'+salary.employee_id+'"] .hari-um').text(salary.total_working_day_meal);

                $('[data-employee-id="'+salary.employee_id+'"] .kompensasi-pkwt').text(parseInt(salary.kompensasi_pkwt).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .potongan').text(parseInt(salary.deduction).toLocaleString('id-ID'));
                $('[data-employee-id="'+salary.employee_id+'"] .thr').text(parseInt(salary.thr).toLocaleString('id-ID'));
                
                if(salary.status == 'PAYSLIP_SENT'){
                    $('.basic-row[data-employee-id="'+salary.employee_id+'"] .payslip-sent').removeClass('d-none');
                    $('.basic-row[data-employee-id="'+salary.employee_id+'"] .payslip-sent').attr('data-bs-title', formatDateENMediumWithDay(salary.date_payslip_send));
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .btn-icon.send').addClass('d-none');
                    $('.set-row[data-employee-id="'+salary.employee_id+'"] .btn-icon.recalled').removeClass('d-none');
                }
            }

            for (let i = 0; i < DATA_EMPLOYEE_SALARY.length; i++) {
                const salary = DATA_EMPLOYEE_SALARY[i];

                $('.basic-row[data-employee-id="'+salary.employee_id+'"] .gaji-pokok').text(parseInt(salary.basic_salary).toLocaleString('id-ID'));
                $('.basic-row[data-employee-id="'+salary.employee_id+'"] .bpjs-kesehatan').text(parseInt(salary.bpjs_allowance).toLocaleString('id-ID'));
                $('.basic-row[data-employee-id="'+salary.employee_id+'"] .bpjs-tk').text(parseInt(salary.bpjs_tenaga_kerja_allowance).toLocaleString('id-ID'));
                $('.basic-row[data-employee-id="'+salary.employee_id+'"] .pensiun').text(parseInt(salary.pension_allowance).toLocaleString('id-ID'));
                $('.basic-row[data-employee-id="'+salary.employee_id+'"] .jabatan').text(parseInt(salary.positional_allowance).toLocaleString('id-ID'));
                
            }
            
            const tooltipTriggerListNew = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            const tooltipList = [...tooltipTriggerListNew].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

            
        
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

    $('.modal .employee-name').text(employeeName);
    $('[name="salary_date"]').val(currentDate);

    getEmployeeSalaryPayslipDetail(employeeId, CURRENT_DATE.getMonth()+1,CURRENT_DATE.getFullYear()).then(res=>{
        countSalary();
        modalSalaryEdit.show();
    });

});

$('.table-data .btn-icon.payslip').on('click',function(){

    let employeeId = $(this).closest('.employee-row').attr('data-employee-id');
    let employeeName = $(this).closest('.employee-row').attr('data-employee-name');
    let currentDate = CURRENT_DATE.toISOString();

    $('.modal .employee-name').text(employeeName);
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

async function getEmployeeSalaryPayslipDetail(employeeId,month,year)
{

    let ajaxGetDetail = await $.ajax({
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
            
            let thp = 0;
            let thr = 0;
            let kompensasiPkwt = 0;
            let absent = 0;
            let attendanceNotComplete = 0;
            let totalDeduction = 0;
            let deductionAbsent = 0;
            let deductionLate = 0;
            let deductionCooperative = 0;
            let deductionPph21 = 0;
            let deductionBpjsKesehatan = 0;
            let deductionBpjsTenagaKerja = 0;
            let deductionBpjsDanaPensiun = 0;
            let deductionOther = 0;


            employeeDetail = response.data.employee;
            employeeTotalActiveDay = response.data.totalActiveDay;
            employeePayslip = response.data.employeePayslip;
            employeeSalary = response.data.employeeSalary;
            employeeAttendanceAll = response.data.employeeAttendanceAll;
            employeeAttendanceAbsent = response.data.employeeAttendanceAbsent;
            employeeAttendanceNotComplete = response.data.employeeAttendanceNotComplete;

            // parseInt(largeNum).toLocaleString('id-ID');

            $('.modal [name="employee_id"]').val(employeeDetail.id);
            $('.modal [name="year"]').val(year);
            $('.modal [name="month"]').val(month);
            
            $('#modalSalaryEdit [name="active_day"]').val(employeeTotalActiveDay);
            $('#modalSalaryEdit [name="working_day"]').val(employeeTotalActiveDay - employeeAttendanceAbsent);
            $('#modalSalaryEdit [name="meal_day"]').val(employeeTotalActiveDay);

            $('#modalSalaryEdit [name="basic_salary"]').val(employeeSalary.basic_salary);

            $('#modalSalaryEdit [name="positional_allowance"]').val(employeeSalary.positional_allowance);
            $('#modalSalaryEdit [name="bpjs_allowance"]').val(employeeSalary.bpjs_allowance);

            $('#modalSalaryEdit [name="bpjs_tenaga_kerja_allowance"]').val(employeeSalary.bpjs_tenaga_kerja_allowance);
            $('#modalSalaryEdit [name="pension_allowance"]').val(employeeSalary.pension_allowance);

            
            
            absent = employeeAttendanceAbsent;
            
            attendanceNotComplete = employeeAttendanceNotComplete;
            
            
            $('#modalSalaryEdit [name="attendance_not_complete"]').val(attendanceNotComplete);
            
            $('#modalSalaryEdit .jumlah_absensi_tidak_lengkap').text(attendanceNotComplete+' hari');
            
            $('#modalSalaryEdit .hitungan_absensi_tidak_lengkap').text( (0 - (attendanceNotComplete * 50000)).toLocaleString('id-ID'));
            
            $('#modalSalaryEdit .info_working_day').attr('data-bs-title','Tidak Masuk Kerja : '+parseInt(absent) + ' <br> Absensi tidak lengkap : '+parseInt(attendanceNotComplete));
            
            $('#modalSalaryEdit .info_basic_salary').attr('data-bs-title','Rp '+parseInt(employeeSalary.basic_salary).toLocaleString('id-ID'));
            $('#modalSalaryEdit .info_positional_allowance').attr('data-bs-title','Rp '+parseInt(employeeSalary.positional_allowance).toLocaleString('id-ID'));
            
            $('#modalSalaryEdit .info_bpjs_allowance').attr('data-bs-title','Rp '+parseInt(employeeSalary.bpjs_allowance).toLocaleString('id-ID'));
            $('#modalSalaryEdit .info_bpjs_tenaga_kerja_allowance').attr('data-bs-title','Rp '+parseInt(employeeSalary.bpjs_tenaga_kerja_allowance).toLocaleString('id-ID'));
            $('#modalSalaryEdit .info_pension_allowance').attr('data-bs-title','Rp '+parseInt(employeeSalary.pension_allowance).toLocaleString('id-ID'));

            thp = employeeSalary.take_home_pay;

            if(employeePayslip != null){
                
                $('#modalSalaryEdit [name="note"]').val(employeePayslip.note);

                kompensasiPkwt = employeePayslip.kompensasi_pkwt;
                thr = employeePayslip.thr;

                deductionAbsent = employeePayslip.deduction_absent;
                deductionLate = employeePayslip.deduction_late;
                deductionCooperative = employeePayslip.deduction_cooperative;
                deductionPph21 = employeePayslip.deduction_pph21;
                deductionBpjsKesehatan = employeePayslip.deduction_bpjs_kesehatan;
                deductionBpjsTenagaKerja = employeePayslip.deduction_bpjs_tenaga_kerja;
                deductionBpjsDanaPensiun = employeePayslip.deduction_bpjs_dana_pensiun;
                deductionOther = employeePayslip.deduction_other;

                totalDeduction = employeePayslip.deduction;
                
            }

            $('#modalSalaryEdit [name="kompensasi_pkwt"]').val(kompensasiPkwt);
            $('#modalSalaryEdit [name="thr"]').val(thr);
            $('#modalSalaryEdit [name="deduction_absent"]').val(deductionAbsent);
            $('#modalSalaryEdit [name="deduction_late"]').val(deductionLate);
            $('#modalSalaryEdit [name="deduction_cooperative"]').val(deductionCooperative);
            $('#modalSalaryEdit [name="deduction_pph21"]').val(deductionPph21);
            $('#modalSalaryEdit [name="deduction_bpjs_kesehatan"]').val(deductionBpjsKesehatan);
            $('#modalSalaryEdit [name="deduction_bpjs_tenaga_kerja"]').val(deductionBpjsTenagaKerja);
            $('#modalSalaryEdit [name="deduction_bpjs_dana_pensiun"]').val(deductionBpjsDanaPensiun);
            $('#modalSalaryEdit [name="deduction_other"]').val(deductionOther);

            thp = thp - (attendanceNotComplete * 50000) - totalDeduction;
            if(employeePayslip){
                thp = employeePayslip.take_home_pay;
            }

            $('.modal .employee-name').text(employeeDetail.name);
            $('.modal .employee-division').text(employeeDetail.division.name_division);
            $('.modal .employee-salary-thp').text(formatRupiah(thp));
                        
            countSalary();
            
            const newtooltipTriggerList = document.querySelectorAll('#modalSalaryEdit [data-bs-toggle="tooltip"]');
            const newtooltipList = [...newtooltipTriggerList].map(newtooltipTriggerEl => new bootstrap.Tooltip(newtooltipTriggerEl));
            
        
        }
         
    });

    return ajaxGetDetail;
}

function parseSalaryInput(value){
    if(value === undefined || value === null || value === ''){
        return 0;
    }

    let stringValue = String(value);
    stringValue = stringValue.replace(/[^0-9\-]/g, '');
    
    const numberValue = Number(stringValue);
    return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatRupiah(value){
    return 'Rp ' + parseSalaryInput(value).toLocaleString('id-ID');
}

function displayRupiah(element, value){
    $(element).val(formatRupiah(value)).data('raw', parseSalaryInput(value));
}

$('#modalSalaryEdit [name="thr"], #modalSalaryEdit [name="kompensasi_pkwt"], #modalSalaryEdit [name="deduction_absent"], #modalSalaryEdit [name="deduction_late"], #modalSalaryEdit [name="deduction_cooperative"], #modalSalaryEdit [name="deduction_pph21"], #modalSalaryEdit [name="deduction_bpjs_kesehatan"], #modalSalaryEdit [name="deduction_bpjs_tenaga_kerja"], #modalSalaryEdit [name="deduction_bpjs_dana_pensiun"], #modalSalaryEdit [name="deduction_other"]').on('input', function(){
    const numValue = parseSalaryInput($(this).val());
    $(this).data('raw-value', numValue);
    $(this).attr('value', numValue);
    $(this).val(numValue);
    countSalary();
});


$('#modalSalaryEdit [name="active_day"], #modalSalaryEdit [name="working_day"], #modalSalaryEdit [name="meal_day"], #modalSalaryEdit [name="basic_salary"], #modalSalaryEdit [name="positional_allowance"], #modalSalaryEdit [name="bpjs_allowance"], #modalSalaryEdit [name="bpjs_tenaga_kerja_allowance"], #modalSalaryEdit [name="pension_allowance"]').on('input change', function(){
    countSalary();
});

function countSalary(){
    let totalDayActive = parseSalaryInput($('#modalSalaryEdit [name="active_day"]').val());
    let totalWorkingDay = parseSalaryInput($('#modalSalaryEdit [name="working_day"]').val());
    let basicSalaryInput = parseSalaryInput($('#modalSalaryEdit [name="basic_salary"]').val());
    let positionalAllowanceInput = parseSalaryInput($('#modalSalaryEdit [name="positional_allowance"]').val());
    let bpjsAllowanceInput = parseSalaryInput($('#modalSalaryEdit [name="bpjs_allowance"]').val());
    let bpjsTenagaKerjaAllowanceInput = parseSalaryInput($('#modalSalaryEdit [name="bpjs_tenaga_kerja_allowance"]').val());
    let pensionAllowanceInput = parseSalaryInput($('#modalSalaryEdit [name="pension_allowance"]').val());
    let thr = parseSalaryInput($('#modalSalaryEdit [name="thr"]').val());
    let kompensasiPkwt = parseSalaryInput($('#modalSalaryEdit [name="kompensasi_pkwt"]').val());

    let deductionAbsent = parseSalaryInput($('#modalSalaryEdit [name="deduction_absent"]').val());
    let deductionLate = parseSalaryInput($('#modalSalaryEdit [name="deduction_late"]').val());
    let deductionCooperative = parseSalaryInput($('#modalSalaryEdit [name="deduction_cooperative"]').val());
    let deductionPph21 = parseSalaryInput($('#modalSalaryEdit [name="deduction_pph21"]').val());
    let deductionBpjsKesehatan = parseSalaryInput($('#modalSalaryEdit [name="deduction_bpjs_kesehatan"]').val());
    let deductionBpjsTenagaKerja = parseSalaryInput($('#modalSalaryEdit [name="deduction_bpjs_tenaga_kerja"]').val());
    let deductionBpjsDanaPensiun = parseSalaryInput($('#modalSalaryEdit [name="deduction_bpjs_dana_pensiun"]').val());
    let deductionOther = parseSalaryInput($('#modalSalaryEdit [name="deduction_other"]').val());

    let totalDeduction = deductionAbsent + deductionLate + deductionCooperative + deductionPph21
        + deductionBpjsKesehatan + deductionBpjsTenagaKerja + deductionBpjsDanaPensiun + deductionOther;

    $('#modalSalaryEdit .total-deduction-display').text(formatRupiah(totalDeduction));

    let basicSalary = 0;
    let positionalAllowance = 0;
    let bpjsAllowance = 0;
    let bpjsTenagaKerjaAllowance = 0;
    let pensionAllowance = 0;
    let attendanceNotComplete = parseSalaryInput($('#modalSalaryEdit [name="attendance_not_complete"]').val());

    if(totalDayActive <= 0){
        $('#modalSalaryEdit .employee-salary-thp').text('Rp 0');
        return;
    }

    if(employeeSalary && totalDayActive > 0){

        basicSalary = basicSalaryInput > 0 ? basicSalaryInput : parseSalaryInput(employeeSalary.basic_salary);
        positionalAllowance = positionalAllowanceInput > 0 ? positionalAllowanceInput : parseSalaryInput(employeeSalary.positional_allowance);
        bpjsAllowance = bpjsAllowanceInput > 0 ? bpjsAllowanceInput : parseSalaryInput(employeeSalary.bpjs_allowance);
        bpjsTenagaKerjaAllowance = bpjsTenagaKerjaAllowanceInput > 0 ? bpjsTenagaKerjaAllowanceInput : parseSalaryInput(employeeSalary.bpjs_tenaga_kerja_allowance);
        pensionAllowance = pensionAllowanceInput > 0 ? pensionAllowanceInput : parseSalaryInput(employeeSalary.pension_allowance);
    }
    
    if(employeePayslip && totalDayActive > 0){

        basicSalary = basicSalaryInput > 0 ? basicSalaryInput : parseSalaryInput(employeePayslip.basic_salary);
        positionalAllowance = positionalAllowanceInput > 0 ? positionalAllowanceInput : parseSalaryInput(employeePayslip.positional_allowance);
        bpjsAllowance = bpjsAllowanceInput > 0 ? bpjsAllowanceInput : parseSalaryInput(employeePayslip.bpjs_allowance);
        bpjsTenagaKerjaAllowance = bpjsTenagaKerjaAllowanceInput > 0 ? bpjsTenagaKerjaAllowanceInput : parseSalaryInput(employeePayslip.bpjs_tenaga_kerja_allowance);
        pensionAllowance = pensionAllowanceInput > 0 ? pensionAllowanceInput : parseSalaryInput(employeePayslip.pension_allowance);

    }

    let thp = basicSalary - (attendanceNotComplete * 50000) - totalDeduction + positionalAllowance + bpjsAllowance + bpjsTenagaKerjaAllowance + pensionAllowance + kompensasiPkwt + thr;

    if(Array.isArray(employeeAttendanceNotComplete) && employeeAttendanceNotComplete.length > 0){
        thp = thp - (employeeAttendanceNotComplete[0].total_attendance * 50000);
    }
    
    $('#modalSalaryEdit .employee-salary-thp').text(formatRupiah(thp));
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

$('.table-data .btn-icon.send').on('click',function(){

    let employeeId = $(this).closest('.employee-row').attr('data-employee-id');
    let employeeName = $(this).closest('.employee-row').attr('data-employee-name');
    let employeePhoto = $(this).closest('.employee-row').attr('data-employee-photo');
    let currentDate = CURRENT_DATE.toISOString();

    $('.modal .employee-name').text(employeeName);
    $('[name="salary_date"]').val(currentDate);

    getEmployeeSalaryPayslipDetail(employeeId, CURRENT_DATE.getMonth()+1,CURRENT_DATE.getFullYear()).then(res=>{
        if(employeePayslip != null){
            $('.modal .employee-salary-thp').text('Rp '+parseInt(employeePayslip.take_home_pay).toLocaleString('id-ID'));
        }
        modalPayslipSend.show();
    });
});

$('#modalPayslipSend .btn-close-modal-edit').on('click',function(){

    modalPayslipSend.hide();

});

$('#modalPayslipSend .btn-send-payslip').on('click',function(){
    sendEmployeeSalaryPayslip();
});

function sendEmployeeSalaryPayslip(){

    $.ajax({
        url: appUrl + "/salary_payslip/send-employee-payslip-by-year-month",
        type: "POST",
        data: new FormData($('#form-send-payslip').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#modalPayslipSend .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#modalPayslipSend .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            getEmployeeSalaryPayslipData(CURRENT_DATE.getMonth()+1,CURRENT_DATE.getFullYear());
            
            showAlertMsg(res.message,'success',3000);

            modalPayslipSend.hide();
            $('#modalPayslipSend .box-loader').fadeOut();
            $('#form-send-payslip')[0].reset();
            
        }
    });
}

$('.table-data .btn-icon.recalled').on('click',function(){

    let employeeId = $(this).closest('.employee-row').attr('data-employee-id');
    let employeeName = $(this).closest('.employee-row').attr('data-employee-name');
    let employeePhoto = $(this).closest('.employee-row').attr('data-employee-photo');
    let currentDate = CURRENT_DATE.toISOString();

    $('.modal .employee-name').text(employeeName);
    $('[name="salary_date"]').val(currentDate);

    getEmployeeSalaryPayslipDetail(employeeId, CURRENT_DATE.getMonth()+1,CURRENT_DATE.getFullYear()).then(res=>{
        if(employeePayslip != null){
            $('.modal .employee-salary-thp').text('Rp '+parseInt(employeePayslip.take_home_pay).toLocaleString('id-ID'));
        }
        modalPayslipRecalled.show();
    });
});


$('#modalPayslipRecalled .btn-close-modal-edit').on('click',function(){

    modalPayslipRecalled.hide();

});

$('#modalPayslipRecalled .btn-recalled-payslip').on('click',function(){
    recallEmployeeSalaryPayslip();
});

function recallEmployeeSalaryPayslip(){

    $.ajax({
        url: appUrl + "/salary_payslip/recall-employee-payslip-by-year-month",
        type: "POST",
        data: new FormData($('#form-recalled-payslip').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#modalPayslipRecalled .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#modalPayslipRecalled .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            
            getEmployeeSalaryPayslipData(CURRENT_DATE.getMonth()+1,CURRENT_DATE.getFullYear());
            
            showAlertMsg(res.message,'success',3000);

            modalPayslipRecalled.hide();
            $('#modalPayslipRecalled .box-loader').fadeOut();
            $('#form-recalled-payslip')[0].reset();
            
        }
    });
}
