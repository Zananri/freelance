var appUrl = $('meta[name="app-url"]').attr("content");
var selectedStatus = "ALL";

var addDepartmentModal;
var editDepartmentModal;
var deleteDepartmentModal;

function showFloatingAlert(message, type = 'success', delayMs = 2500) {
    try {
        if (typeof window.showAlertMsg === 'function') {
            window.showAlertMsg(message, 'light', delayMs);
            return;
        }
        const box = document.querySelector('.box-alert-messages .box-message');
        if (box && box.parentElement) {
            box.parentElement.style.display = 'block';
            box.classList.remove('success', 'warning', 'error', 'light');
            box.classList.add('light');
            box.innerHTML = message;
            setTimeout(() => {
                if (typeof window.hideAlertMsg === 'function') {
                    window.hideAlertMsg();
                } else {
                    box.parentElement.style.display = 'none';
                }
            }, delayMs);
            return;
        }
    } catch (e) {}

    try {
        alert(typeof message === 'string' ? message.replace(/<[^>]+>/g, '') : String(message));
    } catch (e) {}
}

function showLoader(modalType, show) {
    const loaderMap = {
        add: '#addModalLoader',
        edit: '#editModalLoader',
        delete: '#deleteModalLoader'
    };

    const selector = loaderMap[modalType];
    if (!selector) {
        return;
    }

    $(selector).toggleClass('d-none', !show);
}

function readURL(input, labelSelector) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $(labelSelector)
                .css('background-image', 'url(' + e.target.result + ')')
                .css('background-size', 'cover')
                .css('opacity', '1');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function getDefaultImageCss() {
    return {
        'background-image': "url('" + appUrl + "/asset/img/background/add-image.png')",
        'background-position': 'center center',
        'background-repeat': 'no-repeat',
        'background-size': '50%',
        opacity: '0.5'
    };
}

function loadPartnerOptions(selectedDepartmentId, selectedOfficeId, isEdit) {
    const departmentSelector = isEdit ? '#edit_department_id' : '#department_id';
    const officeSelector = isEdit ? '#edit_office_id' : '#office_id';

    $.ajax({
        url: appUrl + '/department/options',
        type: 'GET',
        success: function (response) {
            const data = response.data || {};
            const departments = data.departments || [];
            const offices = data.offices || [];

            let departmentOptions = '<option value="" disabled selected>Select Department</option>';
            departments.forEach((item) => {
                departmentOptions += '<option value="' + item.id + '">' + item.name_department + '</option>';
            });

            let officeOptions = '<option value="" disabled selected>Select Wilayah</option>';
            offices.forEach((item) => {
                officeOptions += '<option value="' + item.id + '">' + item.name + '</option>';
            });

            $(departmentSelector).html(departmentOptions);
            $(officeSelector).html(officeOptions);

            if (selectedDepartmentId) {
                $(departmentSelector).val(String(selectedDepartmentId));
            }

            if (selectedOfficeId) {
                $(officeSelector).val(String(selectedOfficeId));
            }
        },
        error: function () {
            showFloatingAlert('Failed to load partner options.', 'warning', 3500);
        }
    });
}

function loadDepartments(query, status) {
    $.ajax({
        url: appUrl + '/department/index',
        type: 'GET',
        data: { query: query || '', status: status || 'ALL' },
        success: function (response) {
            const rows = response.data || [];
            let rowHtml = '';

            if (!rows.length) {
                rowHtml = '<tr><td colspan="4" class="text-center">No Data</td></tr>';
            } else {
                rows.forEach((partner) => {
                    let statusText = partner.status;
                    let statusClass = 'status-INACTIVE';
                    if (partner.status === 'ACTIVE') {
                        statusText = 'ACTIVE';
                        statusClass = 'status-ACTIVE';
                    }
                    if (partner.status === 'DELETED') {
                        statusText = 'DELETED';
                        statusClass = 'status-DELETED';
                    }

                    const imageHtml = partner.image_url
                        ? '<img src="' + partner.image_url + '" alt="Partner Image" class="table-image" />'
                        : '';

                    rowHtml +=
                        '<tr data-id="' + partner.id + '">' +
                        '<td>' + imageHtml + '</td>' +
                        '<td>' + (partner.name_department || partner.partner_name || '-') + '</td>' +
                        '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
                        '<td style="text-align: right;">' +
                        '<button class="btn-icon-toggle btn-edit" data-id="' + partner.id + '"><span class="material-symbols-outlined icon">edit</span></button> ' +
                        '<button class="btn-icon-toggle btn-delete" data-id="' + partner.id + '"><span class="material-symbols-outlined icon">delete</span></button>' +
                        '</td>' +
                        '</tr>';
                });
            }

            $('#departmentTableBody').html(rowHtml);
        },
        error: function () {
            showFloatingAlert('Failed to load partners.', 'warning', 3500);
        }
    });
}

function buildValidationErrors(errors) {
    let html = '<ul style="margin:0; padding-left:18px;">';
    $.each(errors || {}, function (_, value) {
        if (Array.isArray(value)) {
            value.forEach((item) => {
                html += '<li>' + item + '</li>';
            });
        } else {
            html += '<li>' + value + '</li>';
        }
    });
    html += '</ul>';
    return html;
}

function resetAddDepartmentForm() {
    const form = $('#addDepartmentForm')[0];
    form.reset();
    $(form).removeClass('was-validated');

    $('#name_department, #department_id, #office_id, #status, #description, #image').removeClass('is-valid is-invalid');
    $('#imageLabel').removeClass('is-valid is-invalid').css(getDefaultImageCss());
    $('#imageClearBtn').addClass('d-none');
    $('#addDepartmentModal .alert-container').empty();
}

$(document).ready(function () {
    addDepartmentModal = new bootstrap.Modal(document.getElementById('addDepartmentModal'));
    editDepartmentModal = new bootstrap.Modal(document.getElementById('editDepartmentModal'));
    deleteDepartmentModal = new bootstrap.Modal(document.getElementById('deleteDepartmentModal'));

    if ($('#editDepartmentForm input[name="remove_image"]').length === 0) {
        $('#editDepartmentForm').append('<input type="hidden" name="remove_image" id="edit_remove_image" value="0">');
    }

    loadDepartments('', selectedStatus);

    $('#btnAddData').on('click', function () {
        resetAddDepartmentForm();
        loadPartnerOptions('', '', false);
        addDepartmentModal.show();
    });

    $('#image').on('change', function () {
        readURL(this, '#imageLabel');
        if (this.files && this.files.length > 0) {
            $('#imageClearBtn').removeClass('d-none');
        } else {
            $('#imageLabel').css(getDefaultImageCss());
            $('#imageClearBtn').addClass('d-none');
        }
    });

    $('#edit_image').on('change', function () {
        readURL(this, '#editImageLabel');
        $('#edit_remove_image').val('0');
        if (this.files && this.files.length > 0) {
            $('#editImageClearBtn').removeClass('d-none');
        }
    });

    $('#imageClearBtn').on('click', function (e) {
        e.preventDefault();
        $('#image').val('');
        $('#imageLabel').css(getDefaultImageCss());
        $('#imageClearBtn').addClass('d-none');
    });

    $('#editImageClearBtn').on('click', function (e) {
        e.preventDefault();
        $('#edit_image').val('');
        $('#editImageLabel').css(getDefaultImageCss());
        $('#editImageClearBtn').addClass('d-none');
        $('#edit_remove_image').val('1');
    });

    $('#addDepartmentForm').on('submit', function (e) {
        e.preventDefault();

        const form = this;
        if (!form.checkValidity()) {
            e.stopPropagation();
            $(form).addClass('was-validated');
            return;
        }

        $(form).removeClass('was-validated');
        showLoader('add', true);

        $.ajax({
            url: appUrl + '/department/store',
            type: 'POST',
            data: new FormData(form),
            contentType: false,
            processData: false,
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                showLoader('add', false);
                showFloatingAlert(response.message || 'Partner created successfully.', 'success', 1400);
                loadDepartments($('#searchInput').val(), selectedStatus);
                setTimeout(function () {
                    addDepartmentModal.hide();
                }, 1400);
            },
            error: function (xhr) {
                showLoader('add', false);
                if (xhr.status === 422 && xhr.responseJSON && xhr.responseJSON.errors) {
                    showFloatingAlert(buildValidationErrors(xhr.responseJSON.errors), 'warning', 5000);
                    return;
                }
                showFloatingAlert((xhr.responseJSON && xhr.responseJSON.message) || 'Failed to create partner.', 'warning', 3500);
            }
        });
    });

    $(document).on('click', '.btn-edit', function () {
        const id = $(this).data('id');

        $.ajax({
            url: appUrl + '/department/' + id,
            type: 'GET',
            success: function (partner) {
                $('#edit_name_department').val(partner.name_department || partner.partner_name || '');
                $('#edit_status').val(partner.status || 'ACTIVE');
                $('#edit_description').val(partner.description || '');
                $('#editDepartmentForm').data('id', id);

                loadPartnerOptions(partner.department_id, partner.office_id, true);

                if (partner.image_url) {
                    $('#editImageLabel').css({
                        'background-image': 'url(' + partner.image_url + ')',
                        'background-position': 'center center',
                        'background-repeat': 'no-repeat',
                        'background-size': 'cover',
                        opacity: '1'
                    });
                    $('#editImageClearBtn').removeClass('d-none');
                } else {
                    $('#editImageLabel').css(getDefaultImageCss());
                    $('#editImageClearBtn').addClass('d-none');
                }

                $('#edit_remove_image').val('0');
                $('#editDepartmentForm').removeClass('was-validated');
                editDepartmentModal.show();
            },
            error: function () {
                showFloatingAlert('Failed to fetch partner data.', 'warning', 3000);
            }
        });
    });

    $('#editDepartmentForm').on('submit', function (e) {
        e.preventDefault();

        const id = $(this).data('id');
        const form = this;
        if (!form.checkValidity()) {
            e.stopPropagation();
            $(form).addClass('was-validated');
            return;
        }

        $(form).removeClass('was-validated');

        const formData = new FormData(form);
        formData.append('_method', 'PUT');

        showLoader('edit', true);

        $.ajax({
            url: appUrl + '/department/' + id,
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                showLoader('edit', false);
                showFloatingAlert(response.message || 'Partner updated successfully.', 'success', 1400);
                loadDepartments($('#searchInput').val(), selectedStatus);
                setTimeout(function () {
                    editDepartmentModal.hide();
                }, 1400);
            },
            error: function (xhr) {
                showLoader('edit', false);
                if (xhr.status === 422 && xhr.responseJSON && xhr.responseJSON.errors) {
                    showFloatingAlert(buildValidationErrors(xhr.responseJSON.errors), 'warning', 5000);
                    return;
                }
                showFloatingAlert((xhr.responseJSON && xhr.responseJSON.message) || 'Failed to update partner.', 'warning', 3500);
            }
        });
    });

    $(document).on('click', '.btn-delete', function () {
        const id = $(this).data('id');

        $.ajax({
            url: appUrl + '/department/' + id,
            type: 'GET',
            success: function (partner) {
                $('#delete_name_department').val(partner.name_department || partner.partner_name || '-');
                $('#delete_department_name').val(partner.department && partner.department.name_department ? partner.department.name_department : '-');
                $('#delete_office_name').val(partner.office && partner.office.name ? partner.office.name : '-');
                $('#delete_status').val(partner.status || '-');
                $('#delete_description').val(partner.description || '-');

                if (partner.image_url) {
                    $('#deleteImageLabel').css({
                        'background-image': 'url(' + partner.image_url + ')',
                        'background-position': 'center center',
                        'background-repeat': 'no-repeat',
                        'background-size': 'cover',
                        opacity: '1'
                    });
                } else {
                    $('#deleteImageLabel').css(getDefaultImageCss());
                }

                $('#deleteDepartmentForm').data('id', id);
                deleteDepartmentModal.show();
            },
            error: function () {
                showFloatingAlert('Failed to fetch partner data.', 'warning', 3000);
            }
        });
    });

    $('#deleteDepartmentForm').on('submit', function (e) {
        e.preventDefault();

        const id = $(this).data('id');
        showLoader('delete', true);

        $.ajax({
            url: appUrl + '/department/' + id,
            type: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                showLoader('delete', false);
                showFloatingAlert(response.message || 'Partner deleted successfully.', 'success', 1200);
                deleteDepartmentModal.hide();
                loadDepartments($('#searchInput').val(), selectedStatus);
            },
            error: function () {
                showLoader('delete', false);
                showFloatingAlert('Failed to delete partner.', 'warning', 3500);
            }
        });
    });

    $('#searchInput').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadDepartments($(this).val(), selectedStatus);
        }
    });

    $('.filter-option').on('click', function (e) {
        e.preventDefault();
        $('.filter-option').removeClass('active');
        $(this).addClass('active');
        selectedStatus = $(this).data('status');
        loadDepartments($('#searchInput').val(), selectedStatus);
    });
});
