///hr-info/count-employee-request

function getCountAllEmployeeRequest(){

    $.ajax({
        url: $('meta[name="app-url"]').attr('content') + "/hr-info/count-employee-request",
        type: "GET",
        data:{},
        beforeSend:function(){
            //$('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
          //$('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            
            //sidebar-menu menu-leave menu-overtime pill-new-request

            $('.sidebar-menu .menu-leave .pill-new-request').text(response.data.employee_leave);
            $('.sidebar-menu .menu-overtime .pill-new-request').text(response.data.employee_overtime);

            if(response.data.employee_leave > 0){
                $('.sidebar-menu .menu-leave .pill-new-request').removeClass('d-none');
            }

            if(response.data.employee_overtime > 0){
                $('.sidebar-menu .menu-overtime .pill-new-request').removeClass('d-none');
            }
        }
         
    });

}

getCountAllEmployeeRequest();