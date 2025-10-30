const appUrl = $('meta[name=app-url]').attr("content");

$('#btnChangePassword').on('click',function(){
    submitFormEdit();
});

function submitFormEdit(){
  $.ajax({
    url: appUrl + "/profile/edit-password",
    type: "POST",
    data: $('#formEditPassword').serialize(),
    beforeSend:function(){
        $('.col-photo-password .loader').fadeIn('fast');
    },
    error:function(res){
      var resJson = res.responseJSON;
      showAlertMsg(resJson.message,'error',5000);
      $('.col-photo-password .loader').fadeOut('fast');
    },

    success: function(res) {
        $('#formEditPassword')[0].reset();
        showAlertMsg(res.message,'success',5000);
        $('.col-photo-password .loader').fadeOut('fast');
    }
  });
}

$('#profile_photo_input').on('change',function(){
    
    $('#profilePreview').attr('src',URL.createObjectURL(this.files[0]));

    $('.box-btn-change-photo-profil').fadeIn('fast');
});

$('.box-btn-change-photo-profil .btn-cancel').click(function(){
    $('#formPhotoProfile')[0].reset();
    $('#profilePreview').attr('src',$('#old_profile_photo').val());
    $('.box-btn-change-photo-profil').hide();
});


$('.box-btn-change-photo-profil .btn-save').click(function(){

    var form = $('#formPhotoProfile')[0];
    var dataForm = new FormData(form);

    $.ajax({
        url: appUrl + "/profile/edit-photo-profile",
        type: "POST",
        data: dataForm,
        enctype: 'multipart/form-data',
        processData: false,
        contentType: false,
        cache: false,
        beforeSend:function(){
            $('.col-photo-password .loader').fadeIn('fast');
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('.col-photo-password .loader').fadeOut('fast');
        },

        success: function(res) {
            $('#formPhotoProfile')[0].reset();
            $('.box-btn-change-photo-profil').hide();

            $('#profilePreview').attr('src',res.data.new_profile_photo);
            $('.img-avatar img').attr('src',res.data.new_profile_photo);
            try {
                // Broadcast global event so listening pages can refresh avatars (except employee/shift tables which use employee.photo)
                const absUrl = /^https?:\/\//i.test(res.data.new_profile_photo) ? res.data.new_profile_photo : (appUrl + '/' + String(res.data.new_profile_photo).replace(/^\//,''));
                const evt = new CustomEvent('profilePictureUpdated', { detail: { url: absUrl } });
                window.dispatchEvent(evt);
            } catch(_) { /* no-op */ }
            
            showAlertMsg(res.message,'success',5000);
            $('.col-photo-password .loader').fadeOut('fast');
        }
    });
});

$('.btn-copy-link-auth').click(function(){
    navigator.clipboard.writeText($(this).attr('data-copied-link'));
    $(this).tooltip('show');
});

$('.btn-copy-link-auth').on('shown.bs.tooltip', function () {
    setTimeout(function () {
     $('.btn-copy-link-auth').tooltip('hide');
    }, 1000);
});