const appUrl = $('meta[name=app-url]').attr("content");

const modalEdit = new bootstrap.Modal('#modalEdit', {
  keyboard: false
});

$(document).on('click','.btn-edit-role',function(){
    let employeeId = $(this).closest('tr').attr('data-id');
    setUserModalData(employeeId);
    
    modalEdit.show();
});

function resolveAvatar(raw){
    if(!raw) return null;
    const val = String(raw).trim();
    if(!val || val.toLowerCase()==='null' || val.toLowerCase()==='undefined') return null;
    if(/^https?:\/\//i.test(val)) return val; // already absolute
    return appUrl + '/' + val.replace(/^\//,'');
}

function pickAvatar(row){
    return row.profile_picture || row.photo || row.user_photo || null;
}

function buildAvatarUrl(row){
    const chosen = pickAvatar(row);
    const url = resolveAvatar(chosen);
    return (url && url.length > 0) ? url : (appUrl + '/asset/img/avatar.png');
}

function setUserModalData(employeeId){
        const dataRow = ARR_DATA.find(item => item.id == employeeId);
        if(!dataRow) return;

        $('#modalEdit [name="employee_id"]').val(dataRow.id);
        $('#modalEdit [name="user_id"]').val(dataRow.user_id);
        $('#modalEdit [name="user_role"]').val(dataRow.user_role);
        $('#modalEdit [name="user_type"]').val(dataRow.user_type);

        $('#modalEdit .employee-name').text(dataRow.name);
        const avatarUrl = buildAvatarUrl(dataRow) + '?t=' + Date.now();
        $('#modalEdit .employee-photo').attr('src', avatarUrl);
}

$(document).change('.search-query',function(){
  SEARCH_QUERY = $('.search-query').val();
  PAGE_DATA = 1;
  showAllData();
});

let ARR_DATA = [];
let SEARCH_QUERY = '';
let SEARCH_STATUS = '';
let PAGE_DATA = 1;

function showAllData()
{

    $.ajax({
        url: appUrl + "/settings/get-all-User",
        type: "GET",
        data:{
            'SEARCH_QUERY' : SEARCH_QUERY,
            'page' : PAGE_DATA
        },
        beforeSend:function(){
            $('.col-user-management .loader').fadeIn('fast');
        },
        error:function(res){
          $('.col-user-management .loader').fadeOut('fast');
        },
        success: function(response) {
            var rs = JSON.parse(response.data_result)
            ARR_DATA = rs.data;

            dataPagination(rs.total,rs.per_page);
            
            $('#table-user-management tbody').html('');

            var dtRow = ''; 
            
                
            for (var i = 0; i < ARR_DATA.length; i++) 
            {
                dtRow += htmlDataRow(ARR_DATA[i]);
            }

            if(ARR_DATA.length == 0){
                dtRow ='<tr class="row-item" data-id="0">';
                dtRow +='    <td colspan="3">No data</td>';
                dtRow +='</tr>';   
            }

            $('#data-voucher').html(dtRow);
            $('#table-user-management tbody').html(dtRow);

            $('.col-user-management .loader').fadeOut('fast');
            // const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            // const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
            
        }
         
    });

}

showAllData();

function htmlDataRow(dataRow){
    const avatar = buildAvatarUrl(dataRow);
  let htmlRow = `
    <tr data-id="${dataRow.id}" data-user-id="${dataRow.user_id}" class="row-item">
        <td>
            <div>
                <div class="d-flex align-items-center">
                    <div class="employee-image" style="background-image:url('${avatar}?t=${Date.now()}');">
                    </div>
                    <div class="employee-name">
                        ${dataRow.name}
                        <div class="user-role d-table-cell d-md-none " >
                            ${dataRow.user_type} & ${dataRow.user_role}
                        </div>
                    </div>
                </div>
            </div>
        </td>
        <td class="d-none d-md-table-cell">${dataRow.user_type} & ${dataRow.user_role}</td>
        <td class="text-end">
            <div class="btn-action btn-edit-role">
                <span class="material-symbols-outlined">edit</span>
            </div>
        </td>
    </tr>
  `;
  return htmlRow;
}

function setPageData(i){
    PAGE_DATA = i;
    showAllData();
}

function dataPagination(totalDt,perPage){
    var totalPage = Math.ceil(totalDt/perPage);

    if(totalPage <= 1){
        $('#box-pagination').html(' ');
        return;
    }

    var from = ((PAGE_DATA - 1) * perPage) + 1;
    var to = Math.min(PAGE_DATA * perPage, totalDt);
    var summaryText = 'Showing ' + from + '-' + to + ' of ' + totalDt;

    var htmlPage = '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">';
    htmlPage += '<div class="pagination-summary">' + summaryText + '</div>';
    htmlPage += '<div class="pagination-controls">';

    htmlPage += '<button type="button" class="page-btn" data-page="' + Math.max(PAGE_DATA - 1, 1) + '" ' + (PAGE_DATA <= 1 ? 'disabled' : '') + '>Prev</button>';

    var pages = [];
    if(totalPage <= 7){
        for(var i = 1; i <= totalPage; i++) pages.push(i);
    } else {
        pages.push(1);
        if(PAGE_DATA > 3) pages.push('...');
        var start = Math.max(2, PAGE_DATA - 1);
        var end = Math.min(totalPage - 1, PAGE_DATA + 1);
        for(var i = start; i <= end; i++) pages.push(i);
        if(PAGE_DATA < totalPage - 2) pages.push('...');
        pages.push(totalPage);
    }

    for(var i = 0; i < pages.length; i++){
        if(pages[i] === '...'){
            htmlPage += '<span style="font-size:11px;padding:0 4px;">...</span>';
        } else {
            htmlPage += '<button type="button" class="page-btn ' + (pages[i] === PAGE_DATA ? 'is-active' : '') + '" data-page="' + pages[i] + '">' + pages[i] + '</button>';
        }
    }

    htmlPage += '<button type="button" class="page-btn" data-page="' + Math.min(PAGE_DATA + 1, totalPage) + '" ' + (PAGE_DATA >= totalPage ? 'disabled' : '') + '>Next</button>';

    htmlPage += '</div></div>';
    $('#box-pagination').html(htmlPage);
}

$(document).on('click', '#box-pagination .page-btn', function(){
    var page = parseInt($(this).data('page'));
    if(!page || page < 1) return;
    PAGE_DATA = page;
    showAllData();
});

$('#form-edit-user').submit(function(e){
  e.preventDefault();
  submitFormEdit();
});


$(document).on('click','.btn-submit',function(){
  submitFormEdit();
})


function submitFormEdit(){
  $.ajax({
    url: appUrl + "/settings/edit-user-role",
    type: "POST",
    data: $('#form-edit-user').serialize(),
    beforeSend:function(){
        $('.modal .loader').fadeIn('fast');
    },
    error:function(res){
      var resJson = res.responseJSON;
      showAlertMsg(resJson.message,'error',5000);
      $('.loader').fadeOut('fast');
    },
    success: function(res) {
        modalEdit.hide();
        showAllData();
        $('.modal .loader').fadeOut('fast');
        showAlertMsg(res.message);
    }
  });
}
