const appUrl = $('meta[name=app-url]').attr("content");

const modalConfig = new bootstrap.Modal('#modalConfig', {
  keyboard: false
});


$('#btn-show-config').click(function(){
    modalConfig.show();
});






let currentDate = new Date();

function renderCalendar(year, month) {
    
    const calendarBody = $('.table-calendar tbody');
    calendarBody.empty();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthNames = new Date(year,month);


    $('.calendar-month').text(`${currentDate.toLocaleString('default', { month: 'long' })}`);
    $('.calendar-year').text(`${year}`);

    let day = 1;
    let row = $('<tr>');

    for (let i = 0; i < firstDay; i++) {
        row.append('<td class="empty-cell"></td>');
    }

    for (let i = 0; i < totalDays; i++) {
        if ((firstDay + i) % 7 === 0 && i !== 0) {
            calendarBody.append(row);
            row = $('<tr>');
        }
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

        row.append(`<td class="calendar-day  ${isToday ? 'today' : ''}" data-calendar-date="${year}-${month+1}-${day}"><div class="day">${day}</div><div class="box-event"></div></td>`);

        day++;
    }


    calendarBody.append(row);
}

renderCalendar(currentDate.getFullYear(), currentDate.getMonth());

$('.calendar-prev-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

$('.calendar-next-month').click(function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

$(document).on('click','.dropdown-month .month-item',function(){
    let monthNum = $(this).attr('data-month');
    
    currentDate.setMonth(parseInt(monthNum));

    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());

    //$('.dropdown-month.show').removeClass('show');
});

$(document).on('click','.calendar-day',function(){
    let dateCalendar = $(this).attr('data-calendar-date');
});


function appendEventCalendar(dateCalendar,text,type){

    let boxEvent = `<div class="text-event">${text}</div>`;

    $(document).find('[data-calendar-date="'+dateCalendar+'"] .box-event').append(boxEvent);

}