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
            
            showAlertMsg(res.message,'success',5000);
            $('.col-photo-password .loader').fadeOut('fast');
        }
    });
});