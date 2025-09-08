const appUrl = ($('meta[name=app-url]').attr("content") || '').replace(/\/$/, '');

function buildTeamAvatar(raw){
    if(!raw) return appUrl + '/asset/img/default-profile.png';
    try {
        raw = String(raw).trim();
        const trimmed = raw.replace(/^\/+/, '');
        if(/^https?:\/\//i.test(raw)) return raw;
        if(/^(file\/|asset\/|storage\/)/.test(trimmed)) return appUrl + '/' + trimmed;
        if(raw.startsWith('/')) return appUrl + raw;
        if(raw.indexOf('/') !== -1) return appUrl + '/' + trimmed;
        return appUrl + '/file/profile_picture/' + raw;
    } catch(_) { return appUrl + '/asset/img/default-profile.png'; }
}

// Live update when profile picture changes
window.addEventListener('profilePictureUpdated', function(){
    document.querySelectorAll('.teams-container img.employee-photo[data-global-avatar]').forEach(function(img){
        try {
            const base = img.getAttribute('src').replace(/\?t=\d+$/,'');
            img.src = base + '?t=' + Date.now();
        } catch(_) {}
    });
});

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
            $('#modalView .employee-grade').text(resData.grade.title);
            $('#modalView .employee-email').text(resData.email_work);
            $('#modalView .employee-phone').text(resData.phone);
            $('#modalView .employee-department').text(resData.department.name_department);
            $('#modalView .employee-division').text(resData.division.name_division);
            $('#modalView .employee-job').text(resData.job.job_name);
            const avatarRaw = resData.profile_picture || resData.photo || (resData.user_photo || (resData.user ? resData.user.photo : null));
            $('#modalView .employee-photo').attr('src', buildTeamAvatar(avatarRaw) + '?t=' + Date.now());

            modalView.show();
        }
         
    });

}

$('.input-card-action.search-query').on('keyup',function(){
    let searchQuery = $(this).val();
    console.log(searchQuery);

    if(searchQuery){
        $('.card-department').addClass('d-none');
        $('.col-employee').addClass('d-none');

        $('.col-employee').each(function(){
            let employeeName = $(this).find('.employee-name').text();
            if(employeeName.toLowerCase().includes(searchQuery.toLowerCase())){
                $(this).removeClass('d-none');
                $(this).closest('.card-department').removeClass('d-none');
            }
        });

    }else{
        $('.col-employee').removeClass('d-none');
        $('.card-department').removeClass('d-none');
    }
});