var appUrl = $('meta[name="app-url"]').attr("content");

document.addEventListener("DOMContentLoaded", function () {
    const departmentSelect = document.getElementById("department");
    const divisionSelect = document.getElementById("division");
    const partOfProjectSelect = document.getElementById("part_of_project");
    const imageInput = document.getElementById("image");
    const imageLabel = document.getElementById("imageLabel");
    const imageClearBtn = document.getElementById("imageClearBtn");
    const referenceFileInput = document.getElementById("reference_file");
    const addProjectForm = document.getElementById("addProjectForm");

    // Load project card data and generate cards dynamically
    function loadProjectCardData(filter = null) {
        $.ajax({
            url: appUrl + "/project/index",
            type: "GET",
            dataType: "json",
            data: { filter: filter },
            success: function (data) {
                let container = document.getElementById("project-cards-container");
                container.innerHTML = ""; // Clear existing cards

                if (data.data && data.data.length > 0) {
                    let rowHtml = '<div class="row">';
                    data.data.forEach((project, index) => {
                        let imageUrl = project.image
                            ? appUrl + "/file/project/" + project.image
                            : appUrl + "/asset/img/background/add-image.png";

                    rowHtml += `
                        <div class="col-md-4 mb-4 position-relative" data-project-id="${project.id}">
                            <div class="card shadow-sm rounded-4 p-0" style="background-color: rgb(240, 241, 248); border:0; position: relative;">
                                <div class="dropdown-icon-container">
                                    <span class="material-symbols-outlined dropdown-icon" tabindex="0">more_vert</span>
                                    <div class="dropdown-menu d-none">
                                        <div class="dropdown-item">Detail</div>
                                        <div class="dropdown-item">Task</div>
                                        <div class="dropdown-item">Feedback</div>
                                        <div class="dropdown-item">Edit</div>
                                        <div class="dropdown-item text-danger delete-project">Delete</div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex">
                                        <div class="me-3">
                                            <img src="${imageUrl}" alt="Project Image" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                                        </div>
                                        <div class="flex-grow-1">
                                            <div class="d-flex align-items-started mb-1">
                                                <h6 class="mb-0 title-project">${project.title}</h6>
                                            </div>
                                            <div class="d-flex justify-content-start mt-2">
                                                <div class="d-flex align-items-center me-3">
                                                    <span class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
                                                    <span class="icon-number">${project.task_counts?.total || 0}</span>
                                                </div>
                                                <div class="d-flex align-items-center me-3">
                                                    <span class="material-symbols-outlined icon-av-timer">av_timer</span>
                                                    <span class="icon-number">${project.task_counts?.in_progress || 0}</span>
                                                </div>
                                                <div class="d-flex align-items-center">
                                                    <span class="material-symbols-outlined icon-checklist">checklist</span>
                                                    <span class="icon-number">${project.task_counts?.completed || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                        if ((index + 1) % 3 === 0 && index !== data.data.length - 1) {
                            rowHtml += '</div><div class="row">';
                        }
                    });
                    rowHtml += "</div>";
                    container.innerHTML = rowHtml;


    // Add event listeners for dropdown toggle
    document.querySelectorAll('.dropdown-icon').forEach(icon => {
        icon.addEventListener('click', function (e) {
            e.stopPropagation();
            const dropdownMenu = this.nextElementSibling;
            const isVisible = !dropdownMenu.classList.contains('d-none');
            // Close all dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.add('d-none');
            });
            // Toggle current dropdownz
            if (!isVisible) {
                dropdownMenu.classList.remove('d-none');
            }
        });
    });

    // Event listener for "Edit" dropdown item click
    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('dropdown-item')) {
            const text = e.target.textContent.trim();
            if (text === 'Edit') {
                e.preventDefault();
                e.stopPropagation();

                const card = e.target.closest('.col-md-4');
                if (!card) {
                    alert('Project card not found.');
                    return;
                }

                const projectId = card.getAttribute('data-project-id');
                if (!projectId) {
                    alert('Project ID not found.');
                    return;
                }

                // Fetch project data for editing
                $.ajax({
                    url: appUrl + '/project/' + projectId + '/edit',
                    type: 'GET',
                    dataType: 'json',
                    success: function (data) {
                console.log('Edit project data loaded:', data); // Debug log
                // Populate edit modal form fields
                $('#edit_project_id').val(data.id);
                $('#edit_title').val(data.title);
                $('#edit_description').val(data.description);
                $('#edit_reference_url').val(data.reference_url);
                $('#edit_start_date').val(data.start_date);
                $('#edit_due_date').val(data.due_date);
                $('#edit_part_of_project').val(data.part_of_project);

                    // Load departments and set selected department
                    loadDepartments(function() {
                        $('#edit_department').val(data.department_id).trigger('change');

                        // After department is set, load divisions and set selected division
                        loadDivisions(data.department_id, function() {
                            $('#edit_division').val(data.division_id);
                            // Force refresh select display if needed
                            $('#edit_division').trigger('change');
                        }, document.getElementById('edit_division'));
                        // Force refresh select display if needed
                        $('#edit_department').trigger('change');
                    }, document.getElementById('edit_department'));

                // Reset image preview
                if (data.image) {
                    $('#editImageLabel').css('background-image', 'url(' + appUrl + '/file/project/' + data.image + ')');
                    $('#editImageLabel').addClass('has-image');
                    $('#editImageLabel').css('background-size', 'cover');
                    $('#editImageLabel').css('opacity', '1');
                    $('#editImageClearBtn').removeClass('d-none');
                } else {
                    $('#editImageLabel').css('background-image', "url('" + appUrl + "/asset/img/background/add-image.png')");
                    $('#editImageLabel').removeClass('has-image');
                    $('#editImageLabel').css('opacity', '0.5');
                    $('#editImageClearBtn').addClass('d-none');
                }

            // Clear file input for reference file
            $('#edit_reference_file').val('');

            // Populate co-author and contributor inputs
            // Clear previous selections
            window.clearSelectedCoAuthorsEdit && window.clearSelectedCoAuthorsEdit();
            window.clearSelectedContributorsEdit && window.clearSelectedContributorsEdit();

                // Set co-authors
                if (data.co_authors) {
                    var coAuthors = data.co_authors.map(function(a) {
                        return {
                            id: a.id,
                            name: a.name,
                            user_photo: a.user_photo || null
                        };
                    });
                    window.setSelectedCoAuthorsEdit && window.setSelectedCoAuthorsEdit(coAuthors);
                }

                // Set contributors
                if (data.contributors) {
                    var contributors = data.contributors.map(function(a) {
                        return {
                            id: a.id,
                            name: a.name,
                            user_photo: a.user_photo || null
                        };
                    });
                    window.setSelectedContributorsEdit && window.setSelectedContributorsEdit(contributors);
                }

                // Show edit modal after data is set
                const editProjectModalEl = document.getElementById('editProjectModal');
                if (!editProjectModalEl) {
                    console.error('Edit Project Modal element not found');
                    alert('Edit Project Modal element not found');
                    return;
                }
                const editProjectModal = new bootstrap.Modal(editProjectModalEl);
                editProjectModal.show();
            }

          });
            }
        }
    });

    // Handle edit project form submission
$('#editProjectForm').on('submit', function (e) {
    e.preventDefault();

    const projectId = $('#edit_project_id').val();
    if (!projectId) {
        alert('Project ID is missing.');
        return;
    }

    const formData = new FormData(this);

    // Add _method to FormData for Laravel PUT request
    formData.append('_method', 'PUT');

    // Append co_author and contributors JSON strings from hidden inputs
    formData.set('co_author', $('#edit_co_author').val());
    formData.set('contributors', $('#edit_contributors').val());

    // Show loading overlay and disable submit button
    $('#editModalLoader').removeClass('d-none');
    const submitBtn = $('#editProjectForm button[type="submit"]');
    submitBtn.prop('disabled', true);

    $.ajax({
        url: appUrl + '/project/' + projectId,
        type: 'POST', // Laravel expects POST with _method=PUT for PUT requests
        data: formData,
        contentType: false,
        processData: false,
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
        success: function (response) {
            // Show success alert
            showFloatingAlert(response.message || "Project updated successfully!", "success");

            // Close modal after short delay
            setTimeout(() => {
                var editProjectModalEl = document.getElementById('editProjectModal');
                var editProjectModal = bootstrap.Modal.getInstance(editProjectModalEl);
                if (editProjectModal) editProjectModal.hide();

                // Reload project cards
                loadProjectCardData();
            }, 1500);
        },
        error: function (xhr) {
            if (xhr.status === 422) {
                let errors = xhr.responseJSON.errors;
                let errorMessages = '';
                for (let key in errors) {
                    errorMessages += errors[key].join('\n') + '\n';
                }
                alert(errorMessages);
            } else {
                alert('Failed to update project.');
            }
        },
        complete: function () {
            // Hide loading overlay and enable submit button
            $('#editModalLoader').addClass('d-none');
            submitBtn.prop('disabled', false);
        }
    });
});

    // Image preview and clear button logic for edit image input
    setupImageInput(document.getElementById('edit_image'), document.getElementById('editImageLabel'), document.getElementById('editImageClearBtn'));

    // Clear form and reset image preview when edit modal is closed
    var editProjectModalEl = document.getElementById('editProjectModal');
    editProjectModalEl.addEventListener('hidden.bs.modal', function () {
        $('#editProjectForm')[0].reset();

        $('#editImageLabel').css('background-image', "url('" + appUrl + "/asset/img/background/add-image.png')");
        $('#editImageLabel').removeClass('has-image');
        $('#editImageLabel').css('opacity', '0.5');
        $('#editImageClearBtn').addClass('d-none');

        // Reload departments, divisions, projects to reset selects
        loadDepartments();
        $('#edit_division').html('<option value="" disabled selected>Select Division</option>');
        loadProjects();

        // Clear selected co-authors and contributors display and hidden inputs
        window.clearSelectedCoAuthorsEdit && window.clearSelectedCoAuthorsEdit();
        window.clearSelectedContributorsEdit && window.clearSelectedContributorsEdit();

        $('#editProjectAlert').addClass('d-none').hide();
    });

    // Setup co-author and contributor inputs for edit modal (similar to add modal)
    function setupCoAuthorInputEdit() {
        const input = document.getElementById('edit_co_author_input');
        const dropdown = document.getElementById('edit_co_author_dropdown');
        const selectedContainer = document.getElementById('edit_selected_co_authors');
        const hiddenInput = document.getElementById('edit_co_author');

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

    function fetchEmployees(query = '') {
        const currentEmployeeId = document.getElementById('editProjectModal')?.getAttribute('data-employee-id') || '';
        $.ajax({
            url: appUrl + '/employee/index',
            type: 'GET',
            data: { query: query, exclude_employee_id: currentEmployeeId },
            dataType: 'json',
            success: function (data) {
                employees = data.data || [];
                filteredEmployees = employees;
                renderDropdown();
            },
            error: function () {
                alert('Failed to load employees.');
            }
        });
    }

       function renderDropdown() {
    if (filteredEmployees.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
        dropdown.style.display = 'block';
        return;
    }

    const html = filteredEmployees.map(emp => {
        const isChecked = selectedEmployees.some(e => e.id === emp.id);

        // Atur default user_photo jika kosong
        if (!emp.user_photo) {
            emp.user_photo = '/asset/img/profile_picture/default.png'; // relatif terhadap appUrl
        }

        // Bangun URL gambar profile
        let photoUrl;
        if (emp.user_photo.startsWith('http')) {
            photoUrl = emp.user_photo;
        } else if (emp.user_photo.startsWith('/')) {
            photoUrl = appUrl + emp.user_photo;
        } else if (emp.user_photo.includes('/')) {
            photoUrl = appUrl + '/' + emp.user_photo;
        } else {
            photoUrl = appUrl + '/file/profile_picture/' + emp.user_photo;
        }

        return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="co-author-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? 'checked' : ''}>
            </label>
        `;
    }).join('');

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.co-author-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const name = this.getAttribute('data-name');
            const employeeObj = employees.find(emp => emp.id === id);

            if (this.checked) {
                if (!selectedEmployees.some(e => e.id === id)) {
                    selectedEmployees.push({
                        id,
                        name,
                        user_photo: employeeObj ? employeeObj.user_photo : null
                    });
                }
            } else {
                selectedEmployees = selectedEmployees.filter(e => e.id !== id);
            }

            renderSelected();
            updateHiddenInput();
        });
    });
}

        function renderSelected() {
            selectedContainer.innerHTML = '';
            selectedEmployees.forEach(emp => {
// Ganti semua logika pengambilan foto dengan:
                const photoUrl = emp.user_photo || appUrl + '/asset/img/profile_picture/default.png';
                const badge = document.createElement('span');
                badge.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2';

                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = 'rounded-circle me-2';
                img.style.width = '24px';
                img.style.height = '24px';
                img.style.objectFit = 'cover';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown();
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id));
        }

        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === '') {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(val));
            }
            renderDropdown();
        }

        input.addEventListener('input', function () {
            filterEmployees(this.value);
        });

        input.addEventListener('focus', function () {
            filterEmployees(this.value);
        });

        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        fetchEmployees();

        window.clearSelectedCoAuthorsEdit = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = 'none';
            input.value = '';
        };

        window.setSelectedCoAuthorsEdit = function (coAuthors) {
            selectedEmployees = coAuthors.map(ca => {
                let photoUrl = '';
                let userPhoto = ca.user_photo;
                if (userPhoto) {
                    if (userPhoto.startsWith('http')) {
                        photoUrl = userPhoto;
                    } else if (userPhoto.startsWith('/file/photo') || userPhoto.startsWith('/file/profile_picture')) {
                        photoUrl = appUrl + userPhoto;
                    } else if (userPhoto.startsWith('file/photo') || userPhoto.startsWith('file/profile_picture')) {
                        photoUrl = appUrl + '/' + userPhoto;
                    } else {
                        photoUrl = appUrl + '/file/profile_picture/' + userPhoto;
                    }
                } else {
                    photoUrl = appUrl + '/asset/img/profile_picture/default.png';
                }
                return {
                    id: ca.id,
                    name: ca.name,
                    user_photo: photoUrl
                };
            });
            renderSelected();
            updateHiddenInput();
        };
    }

    function setupContributorInputEdit() {
        const input = document.getElementById('edit_contributor_input');
        const dropdown = document.getElementById('edit_contributor_dropdown');
        const selectedContainer = document.getElementById('edit_selected_contributors');
        const hiddenInput = document.getElementById('edit_contributors');

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

    function fetchEmployees(query = '') {
        const currentEmployeeId = document.getElementById('editProjectModal')?.getAttribute('data-employee-id') || '';
        $.ajax({
            url: appUrl + '/employee/index',
            type: 'GET',
            data: { query: query, exclude_employee_id: currentEmployeeId },
            dataType: 'json',
            success: function (data) {
                employees = data.data || [];
                filteredEmployees = employees;
                renderDropdown();
            },
            error: function () {
                alert('Failed to load employees.');
            }
        });
    }

     function renderDropdown() {
    if (filteredEmployees.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
        dropdown.style.display = 'block';
        return;
    }

    const html = filteredEmployees.map(emp => {
        const isChecked = selectedEmployees.some(e => e.id === emp.id);

        // Pastikan user_photo ada, jika tidak set default
        if (!emp.user_photo) {
            emp.user_photo = '/asset/img/profile_picture/default.png'; // relatif terhadap appUrl
        }

        // Tentukan URL gambar profil
        let photoUrl;
        if (emp.user_photo.startsWith('http')) {
            photoUrl = emp.user_photo;
        } else if (emp.user_photo.startsWith('/')) {
            photoUrl = appUrl + emp.user_photo;
        } else if (emp.user_photo.includes('/')) {
            photoUrl = appUrl + '/' + emp.user_photo;
        } else {
            photoUrl = appUrl + '/file/profile_picture/' + emp.user_photo;
        }

        return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="contributor-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? 'checked' : ''}>
            </label>
        `;
    }).join('');

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.contributor-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const name = this.getAttribute('data-name');
            const employeeObj = employees.find(emp => emp.id === id);

            if (this.checked) {
                if (!selectedEmployees.some(e => e.id === id)) {
                    selectedEmployees.push({
                        id,
                        name,
                        user_photo: employeeObj ? employeeObj.user_photo : null
                    });
                }
            } else {
                selectedEmployees = selectedEmployees.filter(e => e.id !== id);
            }

            renderSelected();
            updateHiddenInput();
            renderDropdown(); // refresh dropdown setelah perubahan
        });
    });
}


        function renderSelected() {
            selectedContainer.innerHTML = '';
            selectedEmployees.forEach(emp => {
// Ganti semua logika pengambilan foto dengan:
                const photoUrl = emp.user_photo || appUrl + '/asset/img/profile_picture/default.png';
                const badge = document.createElement('span');
                badge.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2';

                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = 'rounded-circle me-2';
                img.style.width = '24px';
                img.style.height = '24px';
                img.style.objectFit = 'cover';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown();
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id));
        }

        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === '') {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(val));
            }
            renderDropdown();
        }

        input.addEventListener('input', function () {
            filterEmployees(this.value);
        });

        input.addEventListener('focus', function () {
            filterEmployees(this.value);
        });

        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        fetchEmployees();

        window.clearSelectedContributorsEdit = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = 'none';
            input.value = '';
        };

        window.setSelectedContributorsEdit = function (contributors) {
            selectedEmployees = contributors.map(ca => {
                let photoUrl = '';
                let userPhoto = ca.user_photo;
                
                if (!userPhoto) {
                    photoUrl = appUrl + '/asset/img/profile_picture/default.png';
                } else if (userPhoto.startsWith('http')) {
                    photoUrl = userPhoto;
                } else if (userPhoto.startsWith('/file/photo') || userPhoto.startsWith('/file/profile_picture')) {
                    photoUrl = appUrl + userPhoto;
                } else if (userPhoto.startsWith('file/photo') || userPhoto.startsWith('file/profile_picture')) {
                    photoUrl = appUrl + '/' + userPhoto;
                } else if (userPhoto.startsWith('/')) {
                    photoUrl = appUrl + userPhoto;
                } else {
                    photoUrl = appUrl + '/file/profile_picture/' + userPhoto;
                }
                
                return {
                    id: ca.id,
                    name: ca.name,
                    user_photo: photoUrl
                };
            });
            renderSelected();
            updateHiddenInput();
        };
    }

    setupCoAuthorInputEdit();
    setupContributorInputEdit();

// Feedback modal elements
var projectFeedbackModalEl = document.getElementById("projectFeedbackModal");
var modalTitle = projectFeedbackModalEl.querySelector(".feedback-modal-title");
var modalBody = projectFeedbackModalEl.querySelector(".feedback-modal-body");
var feedbackModalCloseBtn = projectFeedbackModalEl.querySelector(".btn-close");

// Function to load feedback data with loading spinner
function loadFeedbackData(projectId) {
    modalTitle.textContent = "Feedback";
    modalBody.innerHTML = '<div class="text-center my-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        resetAddFeedbackButton();

    

    fetch(appUrl + '/project-feedbacks/' + projectId)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch feedback data');
            }
            return response.json();
        })
        .then(data => {
            modalBody.innerHTML = ''; // Clear loading spinner

            if (!data.data || data.data.length === 0) {
                modalBody.innerHTML = '<p>No feedback available for this project.</p>';
                return;
            }

            // Render feedback items
            data.data.forEach(feedback => {
                const feedbackItem = document.createElement('div');
                feedbackItem.className = 'feedback-item mb-3 p-3 border-bottom';

                // Header with employee info
                const headerDiv = document.createElement('div');
                headerDiv.className = 'd-flex align-items-center mb-2';

                const img = document.createElement('img');
                // Adjust employee_photo path to avoid duplicate segments
                let employeePhotoPath = feedback.employee_photo || '';
                if (employeePhotoPath.startsWith('/file/photo') || employeePhotoPath.startsWith('/file/profile_picture')) {
                    // already full relative path, use as is
                } else if (employeePhotoPath.startsWith('file/photo') || employeePhotoPath.startsWith('file/profile_picture')) {
                    employeePhotoPath = '/' + employeePhotoPath;
                } else if (employeePhotoPath.length > 0) {
                    employeePhotoPath = '/file/profile_picture/' + employeePhotoPath;
                }
img.src = employeePhotoPath.length > 0 ? appUrl + employeePhotoPath : appUrl + '/asset/img/profile_picture/default.png';
                img.alt = 'Employee Photo';
                img.className = 'feedback-employee-photo me-2 rounded-circle';
                img.style.width = '40px';
                img.style.height = '40px';

                const infoDiv = document.createElement('div');
                const nameDiv = document.createElement('div');
                nameDiv.className = 'fw-bold';
                nameDiv.textContent = feedback.employee_name || 'Unknown';

                // Add creation date below employee name
                const dateDiv = document.createElement('div');
                dateDiv.className = 'text-muted small';
                if (feedback.created_at) {
                    const dateObj = new Date(feedback.created_at);
                    const now = new Date();

                    // Helper function to check if two dates are the same day
                    function isSameDay(d1, d2) {
                        return d1.getFullYear() === d2.getFullYear() &&
                            d1.getMonth() === d2.getMonth() &&
                            d1.getDate() === d2.getDate();
                    }

                    // Helper function to check if d1 is yesterday of d2
                    function isYesterday(d1, d2) {
                        const yesterday = new Date(d2);
                        yesterday.setDate(d2.getDate() - 1);
                        return isSameDay(d1, yesterday);
                    }

                    if (isSameDay(dateObj, now)) {
                        // Show time only
                        dateDiv.textContent = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    } else if (isYesterday(dateObj, now)) {
                        dateDiv.textContent = 'yesterday';
                    } else {
                        dateDiv.textContent = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                    }
                } else {
                    dateDiv.textContent = '';
                }

                const roleDiv = document.createElement('div');
                roleDiv.className = 'text-muted small';
                roleDiv.textContent = (feedback.division ? feedback.division + ' | ' : '') + (feedback.role || '');

                infoDiv.appendChild(nameDiv);
                infoDiv.appendChild(dateDiv);
                infoDiv.appendChild(roleDiv);
                headerDiv.appendChild(img);
                headerDiv.appendChild(infoDiv);

                // Comment
                const commentDiv = document.createElement('div');
                commentDiv.className = 'feedback-comment mb-2';
                commentDiv.textContent = feedback.feedback_comment || '';

                // Media attachments
                const mediaDiv = document.createElement('div');
                mediaDiv.className = 'feedback-media mt-2';

if (feedback.reference_url || feedback.reference_file) {
    const refContainer = document.createElement('div');
    refContainer.className = 'feedback-reference-container';

    if (feedback.reference_url) {
        const refUrlLink = document.createElement('a');
        refUrlLink.href = feedback.reference_url;
        refUrlLink.target = '_blank';
        refUrlLink.className = 'feedback-reference-url';

        refUrlLink.innerHTML = `<span class="material-symbols-outlined">link</span> Reference Link`;
        refContainer.appendChild(refUrlLink);
    }

    if (feedback.reference_file) {
        const refFileLink = document.createElement('a');
refFileLink.href = appUrl + '/file/project/' + feedback.reference_file;
        refFileLink.download = '';
        refFileLink.className = 'feedback-reference-file';

        // Extract file extension/type from filename
        const fileName = feedback.reference_file;
        let fileType = '';
        const extMatch = fileName.match(/\.(\w+)$/);
        if (extMatch) {
            fileType = extMatch[1].toUpperCase();
        }

        refFileLink.innerHTML = `<span class="material-symbols-outlined">draft</span> FEEDBACK_${fileType}`;
        refContainer.appendChild(refFileLink);
    }

    mediaDiv.appendChild(refContainer);
}

if (feedback.image) {
    const feedbackImage = document.createElement('img');
feedbackImage.src = appUrl + '/file/project/' + feedback.image;
    feedbackImage.alt = 'Feedback Image';
    feedbackImage.className = 'feedback-image me-2 mb-2';
    feedbackImage.style.maxWidth = '150px';
    feedbackImage.style.maxHeight = '150px';
    feedbackImage.style.borderRadius = '8px';
    feedbackImage.style.cursor = 'pointer';
    feedbackImage.addEventListener('click', () => {
        showImageModal(feedbackImage.src);
    });
    mediaDiv.appendChild(feedbackImage);
}

                feedbackItem.appendChild(headerDiv);
                feedbackItem.appendChild(commentDiv);
                feedbackItem.appendChild(mediaDiv);

                modalBody.appendChild(feedbackItem);
            });

            })
            .catch(error => {
                modalBody.innerHTML = '<div class="alert alert-danger">Error loading feedback data. Please try again.</div>';
                console.error('Error fetching feedback data:', error);
            });
}

// Function to show add feedback form
function showAddFeedbackForm(projectId) {
    modalTitle.textContent = 'Add Feedback';

    modalBody.innerHTML = `
        <form id="addFeedbackForm" enctype="multipart/form-data">
            <input type="hidden" name="project_id" value="${projectId}">
            <input type="hidden" name="employee_id" value="${projectFeedbackModalEl.getAttribute('data-employee-id') || ''}">
           <div class="mb-3">
                    <label class="form-label">Upload Image</label>
                    <div class="image-upload-container">
                        <label for="feedback_image" class="custom-image-upload position-relative" id="feedbackImageLabel"
                            style="background-position: center center; background-repeat: no-repeat; background-size: 50%; background-image: url('${appUrl}/asset/img/background/add-image.png'); cursor: pointer;">
                            <input type="file" id="feedback_image" name="image" accept="image/*" class="d-none">
                            <span class="image-clear-btn d-none" id="feedbackImageClearBtn" title="Remove image">&times;</span>
                        </label>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="feedback_comment" class="form-label">Feedback Comment</label>
                    <textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required></textarea>
                </div>
                
                <div class="mb-3">
                    <label for="reference_url" class="form-label">Reference URL (Optional)</label>
                    <input type="url" class="form-control" id="reference_url" name="reference_url" placeholder="https://example.com">
                </div>
                
                <div class="mb-3">
                    <label for="reference_file" class="form-label">Reference File (Optional)</label>
                    <input type="file" class="form-control" id="reference_file" name="reference_file" accept=".pdf,.doc,.docx" multiple>
                </div>
        </form>
    `;

     
        // Setup image preview and clear button logic
        const imageInput = modalBody.querySelector("#feedback_image");
        const imageLabel = modalBody.querySelector("#feedbackImageLabel");
        const imageClearBtn = modalBody.querySelector("#feedbackImageClearBtn");

        imageInput.addEventListener("change", function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imageLabel.style.backgroundImage = `url('${e.target.result}')`;
                    imageLabel.classList.add("has-image");
                    imageLabel.style.backgroundSize = "cover";
                    imageLabel.style.opacity = "1";
                    imageClearBtn.classList.remove("d-none");
                };
                reader.readAsDataURL(this.files[0]);
            }
        });

        imageClearBtn.addEventListener("click", function (e) {
            e.preventDefault();
            imageInput.value = "";
            imageLabel.style.backgroundImage =
                "url('" + appUrl + "/asset/img/background/add-image.png')";
            imageLabel.style.backgroundPosition = "center center";
            imageLabel.style.backgroundRepeat = "no-repeat";
            imageLabel.style.backgroundSize = "50%";
            imageLabel.classList.remove("has-image");
            imageLabel.style.opacity = "0.5";
            imageClearBtn.classList.add("d-none");
        });

        // Change Add Feedback button text to Submit
        addFeedbackButton.textContent = "Submit";

        // Remove previous event listeners and add submit handler
        const newButton = addFeedbackButton.cloneNode(true);
        addFeedbackButton.parentNode.replaceChild(newButton, addFeedbackButton);

        newButton.addEventListener("click", function (e) {
            e.preventDefault();
            const form = document.getElementById("addFeedbackForm");
            if (form) {
                submitFeedbackForm(form, projectId);
            }
        });

       
}

function submitFeedbackForm(form, projectId) {
    const submitBtn = document.getElementById('addFeedbackButton');
    const originalBtnText = submitBtn.innerHTML;
    
    // Tampilkan loading state
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
    submitBtn.disabled = true;

    const formData = new FormData(form);

    fetch(appUrl + '/project-feedbacks', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        // Tampilkan alert sukses
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${data.message || 'Feedback submitted successfully!'}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        modalBody.prepend(alertDiv);

                
        // Muat ulang daftar feedback setelah 1 detik
        setTimeout(() => {
            loadFeedbackData(projectId);
        }, 1000);
    })
    .catch(error => {
        let errorMessage = 'Failed to submit feedback. Please try again.';
        if (error.errors) {
            errorMessage = Object.values(error.errors).join('<br>');
        } else if (error.message) {
            errorMessage = error.message;
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${errorMessage}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        modalBody.prepend(alertDiv);
    })
    .finally(() => {
        // Reset tombol submit
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    });
}

// Modal hidden event to reset modal title and clear modal body
projectFeedbackModalEl.addEventListener('hidden.bs.modal', function() {
    modalTitle.textContent = 'Feedback';
    modalBody.innerHTML = '';

    // Remove any leftover modal backdrop elements to fix background remaining dark issue
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.parentNode.removeChild(backdrop));
});

// Event listener for "Feedback" dropdown item click
document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('dropdown-item')) {
        const text = e.target.textContent.trim();
        if (text === 'Feedback') {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.col-md-4');
            if (!card) {
                alert('Project card not found.');
                return;
            }

            const projectId = card.getAttribute('data-project-id');
            if (!projectId) {
                alert('Project ID not found.');
                return;
            }

            // Set the project id on the modal data attribute
            projectFeedbackModalEl.setAttribute('data-project-id', projectId);

            // Load feedback data and show modal
            loadFeedbackData(projectId);
            const projectFeedbackModal = new bootstrap.Modal(projectFeedbackModalEl);
            projectFeedbackModal.show();
        }
    }
});

// Helper function to show image in modal (for lightbox effect)
function showImageModal(imageSrc) {
    window.open(imageSrc, '_blank');
}


                    // Remove old confirm dialog and use modal instead
                    document.querySelectorAll('.delete-project').forEach(item => {
                        item.addEventListener('click', function (e) {
                            e.stopPropagation();

                            const card = this.closest('.col-md-4');
                            const projectId = card.getAttribute('data-project-id');
                            if (!projectId) {
                                alert('Project ID not found.');
                                return;
                            }

                            // Open delete confirmation modal and populate data
                            const deleteModalEl = document.getElementById('deleteProjectModal');
                            const deleteModal = new bootstrap.Modal(deleteModalEl);

                            // Set project image and title in modal
                            const projectImage = card.querySelector('img');
                            const projectTitle = card.querySelector('.title-project');

                            const deleteProjectImage = document.getElementById('deleteProjectImage');
                            const deleteProjectTitle = document.getElementById('deleteProjectTitle');

                            deleteProjectImage.src = projectImage ? projectImage.src : '';
                            deleteProjectTitle.textContent = projectTitle ? projectTitle.textContent : '';

                            // Store projectId and card element on modal for use in delete
                            deleteModalEl.dataset.projectId = projectId;
                            deleteModalEl.dataset.cardId = card.getAttribute('data-project-id');

                            deleteModal.show();

                            // Delete button click handler
                            const confirmDeleteBtn = document.getElementById('confirmDeleteProjectBtn');
                            confirmDeleteBtn.onclick = function () {
                            $.ajax({
                                url: appUrl + '/project/' + projectId,
                                type: 'DELETE',
                                headers: {
                                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                                },
                                success: function (response) {
                                    // Remove card from UI
                                    card.remove();

                                    // Hide modal
                                    deleteModal.hide();

                                    // Show success alert fixed at bottom right corner
                                    let alertContainer = document.createElement('div');
                                    alertContainer.className = 'alert alert-success d-flex align-items-center project-delete-alert';
                                    alertContainer.setAttribute('role', 'alert');
                                    alertContainer.style.opacity = '1';

                                    alertContainer.innerHTML = `
                                        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
                                            <use xlink:href="#check-circle-fill"/>
                                        </svg>
                                        <div>
                                            ${response.message || 'Project deleted successfully'}
                                        </div>
                                    `;

                                    document.body.appendChild(alertContainer);

                                    // After 1.5 seconds, fade out alert and reload page
                                    setTimeout(() => {
                                        alertContainer.style.opacity = '0';
                                        setTimeout(() => {
                                            alertContainer.remove();
                                        }, 500);
                                    }, 1500);
                                },
                                error: function (xhr) {
                                    console.error('Delete error:', xhr);
                                    alert('Failed to delete project: ' + (xhr.responseJSON?.message || 'Unknown error'));
                                }
                            });
                            };

                        });
                    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function () {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('d-none');
        });
    });

    // Event listener for "Detail", "Task", and "Feedback" dropdown item click
    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('dropdown-item')) {
            const text = e.target.textContent.trim();
            const card = e.target.closest('.col-md-4');
            if (!card) return;

            const projectId = card.getAttribute('data-project-id');
            if (!projectId) {
                alert('Project ID not found.');
                return;
            }

            if (text === 'Detail') {
                e.preventDefault();
                e.stopPropagation();

                // Fetch project details via AJAX
$.ajax({
    url: appUrl + '/project/' + projectId,
    type: 'GET',
    dataType: 'json',
    success: function (response) {
        const data = response.data || {};

        // Populate modal fields
        const baseFileUrl = appUrl + '/file/project/';

        $('#projectDetailImage').attr('src', data.image ? baseFileUrl + data.image : appUrl + '/asset/img/background/add-image.png');
        $('#projectDetailImage').attr('style', 'border-radius: 8px;');

        $('#projectDetailTitle').replaceWith(`<h2 class="project-title" id="projectDetailTitle">${data.title || ''}</h2>`);
        $('#projectDetailAuthor').text(data.author ? data.author.name : 'Unknown').css('text-align', 'justify');
        $('#projectDetailDepartment').text(data.department || '');
        $('#projectDetailDivision').text(data.division || '');
        $('#projectDetailDescription').text(data.description || '');

        if (data.reference_url) {
            $('#projectDetailReferenceUrl').attr('href', data.reference_url).text(data.reference_url).show();
        } else {
            $('#projectDetailReferenceUrl').hide();
        }

        if (data.reference_file) {
            $('#projectDetailReferenceFile').attr('href', baseFileUrl + data.reference_file).show();
        } else {
            $('#projectDetailReferenceFile').hide();
        }

        function formatDate(dateStr) {
            if (!dateStr) return '';
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const dateObj = new Date(dateStr);
            return dateObj.toLocaleDateString(undefined, options);
        }

        $('#projectDetailStartDate').text(formatDate(data.start_date));
        $('#projectDetailDueDate').text(formatDate(data.due_date));

        if (data.co_authors && data.co_authors.length > 0) {
            const coAuthorNames = data.co_authors.map(ca => ca.name).join(', ');
            $('#projectDetailCoAuthors').text(coAuthorNames);
        } else {
            $('#projectDetailCoAuthors').text('None');
        }

        if (data.contributors && data.contributors.length > 0) {
            const contributorNames = data.contributors.map(c => c.name).join(', ');
            $('#projectDetailContributors').text(contributorNames);
        } else {
            $('#projectDetailContributors').text('None');
        }

        const projectDetailModal = new bootstrap.Modal(document.getElementById('projectDetailModal'));
        projectDetailModal.show();
    },
    error: function () {
        alert('Failed to load project details.');
    }
});

            } else if (text === 'Task') {
                e.preventDefault();
                e.stopPropagation();

                loadProjectTasks(projectId);

            } else if (text === 'Feedback') {
                e.preventDefault();
                e.stopPropagation();

                const projectFeedbackModalEl = document.getElementById('projectFeedbackModal');
                projectFeedbackModalEl.setAttribute('data-project-id', projectId);

                const modalBody = projectFeedbackModalEl.querySelector('.feedback-modal-body');
                modalBody.innerHTML = '';

                loadFeedbackData(projectId);
                const projectFeedbackModal = new bootstrap.Modal(projectFeedbackModalEl);
                projectFeedbackModal.show();
            }
        }
    });

    // Function to format task date like feedback
    function formatTaskDate(dateStr) {
        if (!dateStr) return '';
        
        const dateObj = new Date(dateStr);
        const now = new Date();
        
        // Helper function to check if two dates are the same day
        function isSameDay(d1, d2) {
            return d1.getFullYear() === d2.getFullYear() &&
                   d1.getMonth() === d2.getMonth() &&
                   d1.getDate() === d2.getDate();
        }
        
        // Helper function to check if d1 is yesterday of d2
        function isYesterday(d1, d2) {
            const yesterday = new Date(d2);
            yesterday.setDate(d2.getDate() - 1);
            return isSameDay(d1, yesterday);
        }
        
        if (isSameDay(dateObj, now)) {
            // Show time only
            return dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        } else if (isYesterday(dateObj, now)) {
            return 'yesterday';
        } else {
            return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        }
    }

    // Function to load project tasks
    function loadProjectTasks(projectId) {
        const taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
        const taskListContainer = document.getElementById('taskListContainer');
        
        taskListContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        
        taskModal.show();

        $.ajax({
            url: appUrl + '/projects/' + projectId + '/tasks',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.data && response.data.length > 0) {
                    let html = '';
                    response.data.forEach((task, index) => {
                        const taskImage = task.image 
                            ? appUrl + '/file/task/' + task.image 
                            : appUrl + '/asset/img/profile_picture/default.png';
                        
                        const createdDate = formatTaskDate(task.created_at);

                        // Get PIC image
                        let picImage = appUrl + '/asset/img/profile_picture/default.png';
                        if (task.pic && task.pic.user_photo) {
                            if (task.pic.user_photo.startsWith('http')) {
                                picImage = task.pic.user_photo;
                            } else if (task.pic.user_photo.startsWith('/')) {
                                picImage = appUrl + task.pic.user_photo;
                            } else {
                                picImage = appUrl + '/file/profile_picture/' + task.pic.user_photo;
                            }
                        }

                        // Get status badge class and text
                        let statusClass = '';
                        let statusText = '';
                        
                        switch(task.status) {
                            case 'new_request':
                            case 'new request':
                                statusClass = 'status-badge status-new-request';
                                statusText = 'New Request';
                                break;
                            case 'in_progress':
                            case 'in progress':
                                statusClass = 'status-badge status-in-progress';
                                statusText = 'In Progress';
                                break;
                            case 'completed':
                                statusClass = 'status-badge status-completed';
                                statusText = 'Completed';
                                break;
                            case 'rejected':
                                statusClass = 'status-badge status-rejected';
                                statusText = 'Rejected';
                                break;
                            default:
                                statusClass = 'status-badge';
                                statusText = task.status;
                        }

                        // Build combined PIC and Executors HTML
                        let combinedImagesHtml = '';
                        let allPeople = [];
                        
                        // Helper function to get correct image URL
                        function getImageUrl(userPhoto) {
                            if (!userPhoto) {
                                return appUrl + '/asset/img/profile_picture/default.png';
                            }
                            
                            if (userPhoto.startsWith('http')) {
                                return userPhoto;
                            }
                            
                            // Handle different path formats
                            if (userPhoto.startsWith('/file/photo/')) {
                                return appUrl + userPhoto;
                            } else if (userPhoto.startsWith('/file/profile_picture/')) {
                                return appUrl + userPhoto;
                            } else if (userPhoto.startsWith('file/photo/')) {
                                return appUrl + '/' + userPhoto;
                            } else if (userPhoto.startsWith('file/profile_picture/')) {
                                return appUrl + '/' + userPhoto;
                            } else if (userPhoto.startsWith('/')) {
                                return appUrl + userPhoto;
                            } else {
                                return appUrl + '/file/profile_picture/' + userPhoto;
                            }
                        }
                        
                        // Add PIC first
                        if (task.pic) {
                            let picImage = getImageUrl(task.pic.user_photo);
                            allPeople.push({
                                id: task.pic.id,
                                image: picImage,
                                name: task.pic.name || 'Unknown',
                                title: 'PIC'
                            });
                        }
                        
                        // Add executors, excluding PIC duplicates
                        if (task.executors && task.executors.length > 0) {
                            task.executors.forEach((executor) => {
                                if (!allPeople.some(p => p.id === executor.id)) {
                                    let executorImage = getImageUrl(executor.user_photo);
                                    allPeople.push({
                                        id: executor.id,
                                        image: executorImage,
                                        name: executor.name || 'Unknown',
                                        title: 'Executor'
                                    });
                                }
                            });
                        }

                        // Build combined images HTML
                        combinedImagesHtml = allPeople.map((person, index) => {
                            const overlapClass = index === 0 ? '' : 'executor-image-overlap';
                            const zIndexStyle = `style="z-index: ${allPeople.length - index};"`;
                            return `<img src="${person.image}" alt="${person.name}" class="pic-executor-image ${overlapClass}" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${person.name} (${person.title})" ${zIndexStyle}>`;
                        }).join('');

                        // Initialize Bootstrap tooltips after images are added to DOM
                        setTimeout(() => {
                            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                            tooltipTriggerList.map(function (tooltipTriggerEl) {
                                return new bootstrap.Tooltip(tooltipTriggerEl);
                            });
                        }, 100);

                        html += `
                            <div class="task-item d-flex align-items-start mb-3 pb-3 border-bottom">
                                <img src="${taskImage}" alt="${task.title}" class="me-3" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="fw-bold">${task.title}</div>
                                        <span class="${statusClass}">${statusText}</span>
                                    </div>
                                    <div class="text-muted small mb-2">${createdDate}</div>
                                    <div class="d-flex align-items-center">
                                        <div class="d-flex align-items-center">
                                            <div class="d-flex align-items-center pic-executor-container">
                                                ${combinedImagesHtml}
                                            </div>
                                           
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    taskListContainer.innerHTML = html;
                } else {
                    taskListContainer.innerHTML = '<div class="text-center py-4 text-muted">No tasks found for this project.</div>';
                }
            },
            error: function () {
                taskListContainer.innerHTML = '<div class="text-center py-4 text-danger">Failed to load tasks. Please try again.</div>';
            }
        });
    }
    

// Reset footer button text and remove submit handler when modal is closed
const feedbackModalEl = document.getElementById('projectFeedbackModal');
feedbackModalEl.addEventListener('hidden.bs.modal', function () {
   

    // Remove any click event listeners by cloning the button
    const newButton = addFeedbackButton.cloneNode(true);
    addFeedbackButton.parentNode.replaceChild(newButton, addFeedbackButton);
});

// Reset button text to "Add Feedback" when loading feedback list
feedbackModalEl.addEventListener('shown.bs.modal', function () {
   
});

function resetAddFeedbackButton() {
    const addFeedbackButton = document.getElementById('addFeedbackButton');
    addFeedbackButton.textContent = 'Add Feedback';
    
    // Clone tombol untuk menghapus semua event listener sebelumnya
    const newButton = addFeedbackButton.cloneNode(true);
    addFeedbackButton.parentNode.replaceChild(newButton, addFeedbackButton);
    
    // Tambahkan event listener untuk menampilkan form
    newButton.addEventListener('click', function() {
        const projectId = projectFeedbackModalEl.getAttribute('data-project-id');
        if (projectId) {
            showAddFeedbackForm(projectId);
        }
    });
}

// Inisialisasi event listener untuk tombol Add Feedback saat modal muncul
feedbackModalEl.addEventListener('shown.bs.modal', function () {
    resetAddFeedbackButton();
});


                }
            },
            error: function () {
                console.error("Failed to load project card data.");
            },
        });
    }

    // Load departments dynamically
    function loadDepartments(callback, targetSelect = departmentSelect) {
        $.ajax({
            url: appUrl + "/department/index",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Department</option>';
                (data.data || []).forEach((dept) => {
                    options += `<option value="${dept.id}">${
                        dept.name_department || dept.name
                    }</option>`;
                });
                targetSelect.innerHTML = options;
                if (typeof callback === 'function') callback();
            },
            error: function () {
                alert("Failed to load departments.");
                if (typeof callback === 'function') callback();
            },
        });
    }

    // Load divisions based on selected department
    function loadDivisions(departmentId, callback, targetSelect = divisionSelect) {
        targetSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/division/index",
            type: "GET",
            data: { department_id: departmentId },
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Division</option>';
                (data.data || []).forEach((div) => {
                    options += `<option value="${div.id}">${
                        div.name_division || div.name
                    }</option>`;
                });
                targetSelect.innerHTML = options;
                targetSelect.disabled = false; // Ensure select is enabled
                targetSelect.style.display = 'block'; // Ensure visible
                if (typeof callback === 'function') callback();
            },
            error: function () {
                alert("Failed to load divisions.");
                if (typeof callback === 'function') callback();
            },
        });
    }

    // Load projects for "part_of_project" select
    function loadProjects() {
        $.ajax({
            url: appUrl + "/project/index",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options =
                    '<option value="" disabled selected>Select Project</option>';
                (data.data || []).forEach((proj) => {
                    options += `<option value="${proj.id}">${proj.title}</option>`;
                });
                partOfProjectSelect.innerHTML = options;
            },
            error: function () {
                // Suppress alert on failed projects load
                // Do nothing
            },
        });
    }

    // New implementation for co-author input with checkbox multi-select and search
    function setupCoAuthorInput() {
        const input = document.getElementById('co_author_input');
        const dropdown = document.getElementById('co_author_dropdown');
        const selectedContainer = document.getElementById('selected_co_authors');
        const hiddenInput = document.getElementById('co_author');

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        // Fetch employees from API with optional search query
        function fetchEmployees(query = '') {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId = document.getElementById('projectFeedbackModal')?.getAttribute('data-employee-id') || '';

            $.ajax({
                url: appUrl + '/employee/index',
                type: 'GET',
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: 'json',
                success: function (data) {
                    employees = data.data || [];
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert('Failed to load employees.');
                }
            });
        }

        // Render dropdown list with checkboxes
    function renderDropdown() {
    if (filteredEmployees.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
        dropdown.style.display = 'block';
        return;
    }

    const html = filteredEmployees.map(emp => {
        const isChecked = selectedEmployees.some(e => e.id === emp.id);

        // Gunakan default foto jika tidak ada user_photo
        let photoUrl;
        if (!emp.user_photo) {
            photoUrl = appUrl + '/asset/img/profile_picture/default.png';
        } else if (emp.user_photo.startsWith('http')) {
            photoUrl = emp.user_photo;
        } else if (emp.user_photo.startsWith('/')) {
            photoUrl = appUrl + emp.user_photo;
        } else if (emp.user_photo.includes('/')) {
            photoUrl = appUrl + '/' + emp.user_photo;
        } else {
            photoUrl = appUrl + '/file/profile_picture/' + emp.user_photo;
        }

        return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="co-author-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? 'checked' : ''}>
            </label>
        `;
    }).join('');

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.co-author-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const name = this.getAttribute('data-name');
            const employeeObj = employees.find(emp => emp.id === id);

            if (this.checked) {
                if (!selectedEmployees.some(e => e.id === id)) {
                    selectedEmployees.push({
                        id,
                        name,
                        user_photo: employeeObj ? employeeObj.user_photo : null
                    });
                }
            } else {
                selectedEmployees = selectedEmployees.filter(e => e.id !== id);
            }

            renderSelected();
            updateHiddenInput();
        });
    });
}


        // Render selected employees as badges with remove buttons
        function renderSelected() {
            selectedContainer.innerHTML = '';
            selectedEmployees.forEach(emp => {
                const photoUrl = emp.user_photo || appUrl + '/asset/img/profile_picture/default.png';

                const badge = document.createElement('span');
                badge.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2';

                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = 'rounded-circle me-2';
                img.style.width = '24px';
                img.style.height = '24px';
                img.style.objectFit = 'cover';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown(); // Update checkboxes
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        // Update hidden input with JSON string of selected employee IDs
        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id));
        }

        // Filter employees based on input value
        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === '') {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(val));
            }
            renderDropdown();
        }

        // Event listeners
        input.addEventListener('input', function () {
            filterEmployees(this.value);
        });

        input.addEventListener('focus', function () {
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Initial fetch of employees
        fetchEmployees();

        // Expose clearSelectedCoAuthors function to global scope for use in modal close event
        window.clearSelectedCoAuthors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = 'none';
            input.value = '';
        };
    }
    
    // New implementation for contributor input with checkbox multi-select and search
    function setupContributorInput() {
        const input = document.getElementById('contributor_input');
        const dropdown = document.getElementById('contributor_dropdown');
        const selectedContainer = document.getElementById('selected_contributors');
        const hiddenInput = document.getElementById('contributors');

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        // Fetch employees from API with optional search query
        function fetchEmployees(query = '') {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId = document.getElementById('projectFeedbackModal')?.getAttribute('data-employee-id') || '';

            $.ajax({
                url: appUrl + '/employee/index',
                type: 'GET',
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: 'json',
                success: function (data) {
                    // Exclude employees already selected as co-authors
                    const coAuthorIds = window.selectedCoAuthorIds || [];
                    employees = (data.data || []).filter(emp => !coAuthorIds.includes(emp.id));
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert('Failed to load employees.');
                }
            });
        }

        // Render dropdown list with checkboxes
      function renderDropdown() {
    if (filteredEmployees.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
        dropdown.style.display = 'block';
        return;
    }

    const html = filteredEmployees.map(emp => {
        const isChecked = selectedEmployees.some(e => e.id === emp.id);

        // Perbaikan aman untuk photoUrl
        let photoUrl;
        if (!emp.user_photo) {
            photoUrl = appUrl + '/asset/img/profile_picture/default.png';
        } else if (emp.user_photo.startsWith('http')) {
            photoUrl = emp.user_photo;
        } else if (emp.user_photo.startsWith('/')) {
            photoUrl = appUrl + emp.user_photo;
        } else if (emp.user_photo.includes('/')) {
            photoUrl = appUrl + '/' + emp.user_photo;
        } else {
            photoUrl = appUrl + '/file/profile_picture/' + emp.user_photo;
        }

        return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="contributor-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? 'checked' : ''}>
            </label>
        `;
    }).join('');

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';

    // Add event listeners for checkboxes
    dropdown.querySelectorAll('.contributor-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const name = this.getAttribute('data-name');
            const employeeObj = employees.find(emp => emp.id === id);

            if (this.checked) {
                if (!selectedEmployees.some(e => e.id === id)) {
                    selectedEmployees.push({
                        id,
                        name,
                        user_photo: employeeObj ? employeeObj.user_photo : null
                    });
                }
            } else {
                selectedEmployees = selectedEmployees.filter(e => e.id !== id);
            }

            renderSelected();
            updateHiddenInput();
        });
    });
}


        // Render selected employees as badges with remove buttons
        function renderSelected() {
            selectedContainer.innerHTML = '';
            selectedEmployees.forEach(emp => {
                const photoUrl = emp.user_photo || appUrl + '/asset/img/profile_picture/default.png';

                const badge = document.createElement('span');
                badge.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2';

                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = 'rounded-circle me-2';
                img.style.width = '24px';
                img.style.height = '24px';
                img.style.objectFit = 'cover';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown(); // Update checkboxes
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        // Update hidden input with JSON string of selected employee IDs
        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id));
        }

        // Filter employees based on input value
        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === '') {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(val));
            }
            renderDropdown();
        }

        // Event listeners
        input.addEventListener('input', function () {
            filterEmployees(this.value);
        });

        input.addEventListener('focus', function () {
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Initial fetch of employees
        fetchEmployees();

        // Expose clearSelectedContributors function to global scope for use in modal close event
        window.clearSelectedContributors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = 'none';
            input.value = '';
        };
    }

    // Image preview and clear button logic for image input
    function setupImageInput(input, label, clearBtn) {
        input.addEventListener("change", function () {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    label.style.backgroundImage = `url('${e.target.result}')`;
                    label.classList.add("has-image");
                    label.style.backgroundSize = "cover";
                    label.style.opacity = "1";
                    clearBtn.classList.remove("d-none");
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                label.style.backgroundImage = "";
                label.classList.remove("has-image");
                label.style.opacity = "0.5";
                clearBtn.classList.add("d-none");
            }
        });

        clearBtn.addEventListener("click", function (e) {
            e.preventDefault();
            input.value = "";
            label.style.backgroundImage =
                "url('" + appUrl + "/asset/img/background/add-image.png')";
            label.style.backgroundPosition = "center center";
            label.style.backgroundRepeat = "no-repeat";
            label.style.backgroundSize = "50%";
            label.classList.remove("has-image");
            label.style.opacity = "0.5";
            label.classList.remove("is-valid");
            label.classList.remove("is-invalid");
            clearBtn.classList.add("d-none");
        });
    }

    setupImageInput(imageInput, imageLabel, imageClearBtn);

    // Show loading overlay
    function showLoading() {
        document.getElementById('addModalLoader').classList.remove('d-none');
    }

    // Hide loading overlay
    function hideLoading() {
        document.getElementById('addModalLoader').classList.add('d-none');
    }

    // Show alert message below modal
    function showAlert(message, type = 'success') {
        let alertContainer = document.querySelector('#addProjectModal').parentElement.querySelector('.alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.className = 'alert-container mt-2';
            alertContainer.style.width = '100%';
            document.querySelector('#addProjectModal').parentElement.appendChild(alertContainer);
        }
        alertContainer.innerHTML = `
            <div class="alert alert-${type} d-flex align-items-center" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
                    <use xlink:href="#check-circle-fill"/>
                </svg>
                <div>${message}</div>
            </div>
        `;
        alertContainer.style.display = 'block';
        setTimeout(() => {
            alertContainer.style.display = 'none';
            // Reload the page after alert disappears
            location.reload();
        }, 1500);
    }

    // Show floating alert at bottom right corner (like task page)
    function showFloatingAlert(message, type = "success") {
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type} d-flex align-items-center project-status-alert`;
        alertDiv.setAttribute("role", "alert");
        alertDiv.style.opacity = "1";
        alertDiv.style.position = "fixed";
        alertDiv.style.bottom = "20px";
        alertDiv.style.right = "20px";
        alertDiv.style.zIndex = "9999";
        alertDiv.style.minWidth = "300px";
        alertDiv.style.margin = "0";

        let iconId = "";
        if (type === "success") {
            iconId = "check-circle-fill";
        } else if (type === "danger") {
            iconId = "exclamation-triangle-fill";
        } else {
            iconId = "info-fill";
        }

        alertDiv.innerHTML = `
            <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="${type.charAt(0).toUpperCase() + type.slice(1)}:">
                <use xlink:href="#${iconId}"/>
            </svg>
            <div>
                ${message}
            </div>
        `;

        document.body.appendChild(alertDiv);

        // After 1.5 seconds, fade out alert
        setTimeout(() => {
            alertDiv.style.opacity = "0";
            setTimeout(() => {
                alertDiv.remove();
            }, 500);
        }, 1500);
    }

    addProjectForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!addProjectForm.checkValidity()) {
            e.stopPropagation();
            addProjectForm.classList.add('was-validated');
            return;
        }
        addProjectForm.classList.remove('was-validated');

        // Show loading overlay and disable submit button
        showLoading();
        const submitBtn = addProjectForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const formData = new FormData(addProjectForm);

        $.ajax({
            url: appUrl + "/project/store",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
        success: function (response) {
            // Show success alert
            showFloatingAlert(response.message || "Project added successfully!", "success");

            // Reset form and preview
            addProjectForm.reset();
            imageLabel.style.backgroundImage = "";
            imageLabel.classList.remove("has-image");
            imageLabel.style.opacity = "0.5";
            imageClearBtn.classList.add("d-none");
            divisionSelect.innerHTML =
                '<option value="" disabled selected>Select Division</option>';
            loadDepartments();
            loadProjects();

            // Close modal after short delay to show alert
            setTimeout(() => {
                var addProjectModalEl =
                    document.getElementById("addProjectModal");
                var addProjectModal =
                    bootstrap.Modal.getInstance(addProjectModalEl);
                if (addProjectModal) addProjectModal.hide();
                
                // Reload page after alert disappears
                setTimeout(function() {
                    location.reload();
                }, 1500);
            }, 1500);
        },
            error: function (xhr) {
                if (xhr.status === 422) {
                    let errors = xhr.responseJSON.errors;
                    let errorMessages = "";
                    for (let key in errors) {
                        errorMessages += errors[key].join("\n") + "\n";
                    }
                    alert(errorMessages);
                } else {
                    alert("Failed to create project.");
                }
            },
            complete: function () {
                // Hide loading overlay and enable submit button
                hideLoading();
                const submitBtn = addProjectForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
            }
        });
    });

    // Load departments and projects on page load
    loadDepartments();
    loadProjects();
    loadProjectCardData();
    // loadEmployees(); // Removed obsolete function call
    setupCoAuthorInput();
    
    // Setup filter dropdown functionality
    setupFilterDropdown();

    // Add event listener to department select to load divisions on change
    departmentSelect.addEventListener('change', function () {
        const selectedDepartmentId = this.value;
        if (selectedDepartmentId) {
            loadDivisions(selectedDepartmentId);
        } else {
            divisionSelect.innerHTML = '<option value="" disabled selected>Select Division</option>';
            divisionSelect.disabled = true;
        }
    });

    // Global array to track selected co-author IDs for exclusion in contributor input
    window.selectedCoAuthorIds = [];

    // Wrap original setupCoAuthorInput to update global selectedCoAuthorIds and refresh contributor dropdown
    function wrappedSetupCoAuthorInput() {
        const input = document.getElementById('co_author_input');
        const dropdown = document.getElementById('co_author_dropdown');
        const selectedContainer = document.getElementById('selected_co_authors');
        const hiddenInput = document.getElementById('co_author');

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        function fetchEmployees(query = '') {
            const currentEmployeeId = document.getElementById('projectFeedbackModal')?.getAttribute('data-employee-id') || '';

            $.ajax({
                url: appUrl + '/employee/index',
                type: 'GET',
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: 'json',
                success: function (data) {
                    // Exclude employees already selected as contributors
                    const contributorIds = window.selectedContributorIds || [];
                    employees = (data.data || []).filter(emp => !contributorIds.includes(emp.id));
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert('Failed to load employees.');
                }
            });
        }

      function renderDropdown() {
    if (filteredEmployees.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
        dropdown.style.display = 'block';
        return;
    }

    const html = filteredEmployees.map(emp => {
        const isChecked = selectedEmployees.some(e => e.id === emp.id);

        // Perbaikan logika foto: aman untuk berbagai format
        let photoUrl;
        if (!emp.user_photo) {
            photoUrl = appUrl + '/asset/img/profile_picture/default.png';
        } else if (emp.user_photo.startsWith('http')) {
            photoUrl = emp.user_photo;
        } else if (emp.user_photo.startsWith('/')) {
            photoUrl = appUrl + emp.user_photo;
        } else if (emp.user_photo.includes('/')) {
            photoUrl = appUrl + '/' + emp.user_photo;
        } else {
            photoUrl = appUrl + '/file/profile_picture/' + emp.user_photo;
        }

        return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="co-author-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? 'checked' : ''}>
            </label>
        `;
    }).join('');

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.co-author-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const name = this.getAttribute('data-name');
            const employeeObj = employees.find(emp => emp.id === id);

            if (this.checked) {
                if (!selectedEmployees.some(e => e.id === id)) {
                    selectedEmployees.push({
                        id,
                        name,
                        user_photo: employeeObj ? employeeObj.user_photo : null
                    });
                }
            } else {
                selectedEmployees = selectedEmployees.filter(e => e.id !== id);
            }

            renderSelected();
            updateHiddenInput();

            // Update global selectedCoAuthorIds
            window.selectedCoAuthorIds = selectedEmployees.map(e => e.id);

            // Refresh contributor dropdown if available
            if (window.refreshContributorDropdown) {
                window.refreshContributorDropdown();
            }
        });
    });
}

        function renderSelected() {
            selectedContainer.innerHTML = '';
            selectedEmployees.forEach(emp => {
// Ganti semua logika pengambilan foto dengan:
                const photoUrl = emp.user_photo || appUrl + '/asset/img/profile_picture/default.png';
                const badge = document.createElement('span');
                badge.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2';

                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = 'rounded-circle me-2';
                img.style.width = '24px';
                img.style.height = '24px';
                img.style.objectFit = 'cover';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown();
                    // Update global selectedCoAuthorIds
                    window.selectedCoAuthorIds = selectedEmployees.map(e => e.id);
                    if (window.refreshContributorDropdown) {
                        window.refreshContributorDropdown();
                    }
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id));
        }

        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === '') {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(val));
            }
            renderDropdown();
        }

        input.addEventListener('input', function () {
            filterEmployees(this.value);
        });

        input.addEventListener('focus', function () {
            filterEmployees(this.value);
        });

        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        fetchEmployees();

        window.clearSelectedCoAuthors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = 'none';
            input.value = '';
            window.selectedCoAuthorIds = [];
            if (window.refreshContributorDropdown) {
                window.refreshContributorDropdown();
            }
        };
    }

    wrappedSetupCoAuthorInput();

    // Initialize contributor input
    setupContributorInput();

    // Function to refresh contributor dropdown when co-author selection changes
    window.refreshContributorDropdown = function () {
        // Clear contributor input and selected contributors
        const contributorInput = document.getElementById('contributor_input');
        const contributorDropdown = document.getElementById('contributor_dropdown');
        const selectedContributorsContainer = document.getElementById('selected_contributors');
        const hiddenContributorsInput = document.getElementById('contributors');

        if (!contributorInput || !contributorDropdown || !selectedContributorsContainer || !hiddenContributorsInput) {
            return;
        }

        // Clear current selections
        contributorInput.value = '';
        contributorDropdown.style.display = 'none';
        selectedContributorsContainer.innerHTML = '';
        hiddenContributorsInput.value = '';

        // Re-initialize contributor input to fetch updated employee list excluding current co-authors
        setupContributorInput();
    };

    // Add global array to track selected contributors
    window.selectedContributorIds = [];

    // Wrap original setupContributorInput to update global selectedContributorIds and refresh co-author dropdown
    function wrappedSetupContributorInput() {
        const input = document.getElementById('contributor_input');
        const dropdown = document.getElementById('contributor_dropdown');
        const selectedContainer = document.getElementById('selected_contributors');
        const hiddenInput = document.getElementById('contributors');

        let employees = [];
        let filteredEmployees = [];
        let selectedEmployees = [];

        // Fetch employees from API with optional search query
        function fetchEmployees(query = '') {
            // Get current logged-in employee ID from modal data attribute
            const currentEmployeeId = document.getElementById('projectFeedbackModal')?.getAttribute('data-employee-id') || '';

            $.ajax({
                url: appUrl + '/employee/index',
                type: 'GET',
                data: { query: query, exclude_employee_id: currentEmployeeId },
                dataType: 'json',
                success: function (data) {
                    // Exclude employees already selected as co-authors
                    const coAuthorIds = window.selectedCoAuthorIds || [];
                    employees = (data.data || []).filter(emp => !coAuthorIds.includes(emp.id));
                    filteredEmployees = employees;
                    renderDropdown();
                },
                error: function () {
                    alert('Failed to load employees.');
                }
            });
        }

        // Render dropdown list with checkboxes
      function renderDropdown() {
    if (filteredEmployees.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item disabled">No employees found</div>';
        dropdown.style.display = 'block';
        return;
    }

    const html = filteredEmployees.map(emp => {
        const isChecked = selectedEmployees.some(e => e.id === emp.id);

        // Penanganan URL foto secara aman
        let photoUrl;
        if (!emp.user_photo) {
            photoUrl = appUrl + '/asset/img/profile_picture/default.png';
        } else if (emp.user_photo.startsWith('http')) {
            photoUrl = emp.user_photo;
        } else if (emp.user_photo.startsWith('/')) {
            photoUrl = appUrl + emp.user_photo;
        } else if (emp.user_photo.includes('/')) {
            photoUrl = appUrl + '/' + emp.user_photo;
        } else {
            photoUrl = appUrl + '/file/profile_picture/' + emp.user_photo;
        }

        return `
            <label class="dropdown-item d-flex align-items-center justify-content-between" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <img src="${photoUrl}" alt="${emp.name}" class="rounded-circle me-2" style="width: 30px; height: 30px; object-fit: cover;">
                    <span>${emp.name}</span>
                </div>
                <input type="checkbox" class="contributor-checkbox" data-id="${emp.id}" data-name="${emp.name}" ${isChecked ? 'checked' : ''}>
            </label>
        `;
    }).join('');

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';

    // Event listener untuk checkbox
    dropdown.querySelectorAll('.contributor-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const name = this.getAttribute('data-name');
            const employeeObj = employees.find(emp => emp.id === id);

            if (this.checked) {
                if (!selectedEmployees.some(e => e.id === id)) {
                    selectedEmployees.push({
                        id,
                        name,
                        user_photo: employeeObj ? employeeObj.user_photo : null
                    });
                }
            } else {
                selectedEmployees = selectedEmployees.filter(e => e.id !== id);
            }

            renderSelected();
            updateHiddenInput();

            // Update global selectedContributorIds
            window.selectedContributorIds = selectedEmployees.map(e => e.id);

            // Refresh co-author dropdown jika tersedia
            if (window.refreshCoAuthorDropdown) {
                window.refreshCoAuthorDropdown();
            }
        });
    });
}


        // Render selected employees as badges with remove buttons
        function renderSelected() {
            selectedContainer.innerHTML = '';
            selectedEmployees.forEach(emp => {
                const photoUrl = emp.user_photo || appUrl + '/asset/img/profile_picture/default.png';

                const badge = document.createElement('span');
                badge.className = 'badge bg-primary d-inline-flex align-items-center me-2 mb-2';

                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = emp.name;
                img.className = 'rounded-circle me-2';
                img.style.width = '24px';
                img.style.height = '24px';
                img.style.objectFit = 'cover';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = emp.name;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', () => {
                    selectedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                    renderSelected();
                    updateHiddenInput();
                    renderDropdown();
                    // Update global selectedContributorIds
                    window.selectedContributorIds = selectedEmployees.map(e => e.id);
                    if (window.refreshCoAuthorDropdown) {
                        window.refreshCoAuthorDropdown();
                    }
                });

                badge.appendChild(img);
                badge.appendChild(nameSpan);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        // Update hidden input with JSON string of selected employee IDs
        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedEmployees.map(e => e.id));
        }

        // Filter employees based on input value
        function filterEmployees(value) {
            const val = value.trim().toLowerCase();
            if (val === '') {
                filteredEmployees = employees;
            } else {
                filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(val));
            }
            renderDropdown();
        }

        // Event listeners
        input.addEventListener('input', function () {
            filterEmployees(this.value);
        });

        input.addEventListener('focus', function () {
            filterEmployees(this.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Initial fetch of employees
        fetchEmployees();

        // Expose clearSelectedContributors function to global scope for use in modal close event
        window.clearSelectedContributors = function () {
            selectedEmployees = [];
            renderSelected();
            updateHiddenInput();
            dropdown.style.display = 'none';
            input.value = '';
            window.selectedContributorIds = [];
            if (window.refreshCoAuthorDropdown) {
                window.refreshCoAuthorDropdown();
            }
        };
    }

    wrappedSetupContributorInput();

    // Function to refresh co-author dropdown when contributor selection changes
    window.refreshCoAuthorDropdown = function () {
        // Clear co-author input and selected co-authors
        const coAuthorInput = document.getElementById('co_author_input');
        const coAuthorDropdown = document.getElementById('co_author_dropdown');
        const selectedCoAuthorsContainer = document.getElementById('selected_co_authors');
        const hiddenCoAuthorsInput = document.getElementById('co_author');

        if (!coAuthorInput || !coAuthorDropdown || !selectedCoAuthorsContainer || !hiddenCoAuthorsInput) {
            return;
        }

        // Clear current selections
        coAuthorInput.value = '';
        coAuthorDropdown.style.display = 'none';
        selectedCoAuthorsContainer.innerHTML = '';
        hiddenCoAuthorsInput.value = '';

        // Re-initialize co-author input to fetch updated employee list excluding current contributors
        wrappedSetupCoAuthorInput();
    };

    // Setup filter dropdown functionality
    function setupFilterDropdown() {
        const openFilterBtn = document.getElementById('openProjectFilterBtn');
        const filterDropdown = document.getElementById('projectFilterDropdown');
        const applyFilterBtn = document.getElementById('applyProjectFilterBtn');
        const resetFilterBtn = document.getElementById('resetProjectFilterBtn');
        const filterStatus = document.getElementById('filterProjectStatus');

        if (!openFilterBtn || !filterDropdown) return;

        // Toggle dropdown visibility
        openFilterBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = filterDropdown.style.display === 'block';
            filterDropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!openFilterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                filterDropdown.style.display = 'none';
            }
        });

        // Handle apply filter button
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', function() {
                const selectedStatus = filterStatus ? filterStatus.value : '';
                console.log('Filter applied with status:', selectedStatus);
                filterDropdown.style.display = 'none';

                // Map UI filter values to backend filter parameters
                let filterParam = null;
                if (selectedStatus === '') {
                    filterParam = null; // no filter
                } else if (selectedStatus === 'ongoing') {
                    filterParam = 'not_started'; // map "Not Started" to backend filter
                } else if (selectedStatus === 'completed') {
                    filterParam = 'completed'; // map "Completed" to backend filter
                } else if (selectedStatus === 'pending') {
                    filterParam = 'in_progress'; // map "In Progress" to backend filter
                }

                // Reload project cards with filter parameter
                loadProjectCardData(filterParam);
            });
        }

        // Handle reset filter button
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', function() {
                // Reset the filter dropdown to default
                if (filterStatus) {
                    filterStatus.value = '';
                }
                
                // Close the dropdown
                filterDropdown.style.display = 'none';
                
                // Reload project cards without filter (show all)
                loadProjectCardData(null);
                
                // Provide visual feedback
            });
        }

        // Handle dropdown item clicks
        filterDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }


    // Clear form and reset image preview when modal is closed
    var addProjectModalEl = document.getElementById("addProjectModal");
    addProjectModalEl.addEventListener("hidden.bs.modal", function () {
        // Reset the form
        addProjectForm.reset();

        // Reset image preview
        imageLabel.style.backgroundImage =
            "url('" + appUrl + "/asset/img/background/add-image.png')";
        imageLabel.style.backgroundPosition = "center center";
        imageLabel.style.backgroundRepeat = "no-repeat";
        imageLabel.style.backgroundSize = "50%";
        imageLabel.classList.remove("has-image");
        imageLabel.style.opacity = "0.5";
        imageClearBtn.classList.add("d-none");

        // Reload departments, divisions, projects to reset selects
        loadDepartments();
        divisionSelect.innerHTML = '<option value="" disabled selected>Select Division</option>';
        loadProjects();

        // Reload employees to reset co_author_select options
        // loadEmployees(); // Removed obsolete function call

        // Clear selected co-authors display and hidden input using the global function
        if (window.clearSelectedCoAuthors) {
            window.clearSelectedCoAuthors();
        }
    });
});

