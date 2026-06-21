$('.switch-btn').click(function(){

    $('.switch-btn').removeClass('active');
    $(this).addClass('active');

    if($(this).data('view') === 'grid'){
        $('.switch-indicator').addClass('grid');
    }else{
        $('.switch-indicator').removeClass('grid');
    }

});