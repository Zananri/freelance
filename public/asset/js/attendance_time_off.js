const timeOffModal = new bootstrap.Modal('#timeOffModal', {
  keyboard: false
});

const requestTimeOffModal = new bootstrap.Modal('#requestTimeOffModal', {
  keyboard: false
});


function htmlDataItem(){

    var rowItem = `
        <div class="item-time-off mb-3">
            <div class="item-header mb-2">
                <div class="mb-0">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="col-title">
                            <div class="item-title me-2">Leave</div>
                        </div>
                        <div class="col-day-status">
                            <div class="item-day">7 Day</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="col-date"> 
                            <div class="item-date">
                                1 Aug 2025 - 8 Aug 2025
                            </div>
                        </div>
                        <div class="col-status">
                            <div class="item-status">Request</div>
                        </div>
                    </div>
                </div>
                
            </div>
            <div class="item-body mb-2">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="col-description">
                        <div class="item-description">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        </div>
                    </div> 
                </div>
            </div>
            <div class="item-footer">
                <div class="d-flex align-items-center justify-content-between">
                    
                    <div class="">

                    </div>
                    
                    <div class="col-item-action">
                        <div class="item-action">
                            <div class="btn-action">
                                <span class="material-symbols-outlined">attach_file</span>
                            </div>
                            <div class="btn-action">
                                <span class="material-symbols-outlined">photo</span>
                            </div>
                            <div class="btn-action">
                                <span class="material-symbols-outlined">edit</span>
                            </div>
                            <div class="btn-action">
                                <span class="material-symbols-outlined">delete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return rowItem;
}

$('#timeOffModal .btn-submit-modal').on('click',function(){
    
    timeOffModal.hide();
    requestTimeOffModal.show();

});

$('#requestTimeOffModal .btn-submit-modal').on('click',function(){
    
    if(validationFormRequestTimeOff()){
        submitFormRequestTimeOff();
    }

});

function submitFormRequestTimeOff(){

    $.ajax({
        url: appUrl + "/time-off/submit-new-request",
        type: "POST",
        data: new FormData($('#form-request-time-off').get(0)) ,
        cache: false,
        processData: false,
        contentType: false,
        beforeSend:function(){
            $('#requestTimeOffModal .box-loader').fadeIn();
        },
        error:function(res){
            var resJson = res.responseJSON;
            showAlertMsg(resJson.message,'error',5000);
            $('#requestTimeOffModal .box-loader').fadeOut();
            //$('.loader').fadeOut('fast');
        },
        success: function(res) {
            //checkInModal.hide();
            //$('.modal .loader').fadeOut('fast');
            showAlertMsg(res.message,'success',15000);

            setTimeout(function() {
                window.location.reload();
            }, 2000);
        }
    });
    
}

$('#form-request-time-off [attr-validation="required"]').on('change',function(){
    if($(this).val()){
        $(this).removeClass('is-invalid');
    }
});

function validationFormRequestTimeOff(){

    $('#form-request-time-off').find('[attr-validation="required"]').each(function(){
        if(!$(this).val()){
            $(this).addClass('is-invalid');
        }else{
            $(this).removeClass('is-invalid');
        }
    });


    if($('#form-request-time-off [attr-validation="required"]').hasClass('is-invalid')){
        return false;
    }else{
        return true;
    }

}