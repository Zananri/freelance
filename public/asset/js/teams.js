const appUrl = $('meta[name=app-url]').attr("content");

const modalView = new bootstrap.Modal('#modalView', {
  keyboard: false
});

$(document).on('click','.card-employee',function(){
    let employeeId = $(this).attr('data-emplpoyee');
    getTeamsDetail(employeeId);
});

function getTeamsDetail(employeeId)
{

    $.ajax({
        url: appUrl + "/teams/get-teams-detail",
        type: "GET",
        data:{
            'ID_EMPLOYEE' : employeeId
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
            var resData = response.data.employee;
            
            //'employees.id','employees.grade','employees.name','employees.status','employees.photo',
            //'job_list.job_name','departments.name_department','divisions.name_division'

            //employee-name employee-grade employee-email employee-phone 
            //employee-department employee-division employee-job

        
            $('#modalView .employee-name').text(resData.name);
            $('#modalView .employee-grade').text(resData.grade);
            $('#modalView .employee-email').text(resData.email_work);
            $('#modalView .employee-phone').text(resData.phone);
            $('#modalView .employee-department').text(resData.name_department);
            $('#modalView .employee-division').text(resData.name_division);
            $('#modalView .employee-job').text(resData.job_name);
            $('#modalView .employee-photo').attr('src',appUrl+'/'+resData.photo);

            modalView.show();
        }
         
    });

}

$('.input-card-action.search-query').on('keyup',function(){
    let searchQuery = $(this).val();
    console.log(searchQuery);

    if(searchQuery){
        $('.col-employee').addClass('d-none');

        $('.col-employee').each(function(){
            let employeeName = $(this).find('.employee-name').text();
            if(employeeName.toLowerCase().includes(searchQuery.toLowerCase())){
                $(this).removeClass('d-none');
            }
        });

    }else{
        $('.col-employee').removeClass('d-none');
    }
});