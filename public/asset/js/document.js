$('.switch-btn').click(function(){

    $('.switch-btn').removeClass('active');
    $(this).addClass('active');

    if($(this).data('view') === 'grid'){
        $('.switch-indicator').addClass('grid');
        $('.grid-view').removeClass('d-none');
        $('.table-view').addClass('d-none');
    }else{
        $('.switch-indicator').removeClass('grid');
        $('.table-view').removeClass('d-none');
        $('.grid-view').addClass('d-none');
    }
});