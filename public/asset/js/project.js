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
    function loadProjectCardData() {
        $.ajax({
            url: appUrl + "/project/card-data",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let container = document.getElementById(
                    "project-cards-container"
                );
                container.innerHTML = ""; // Clear existing cards

                if (data.project_titles && data.project_titles.length > 0) {
                    let rowHtml = '<div class="row">';
                    data.project_titles.forEach((title, index) => {
                        let taskCount = data.task || 0;
                        let inProgressCount = data.in_progress || 0;
                        let completedCount = data.completed || 0;
                        let imageUrl =
                            data.project_images && data.project_images[index]
                                ? appUrl +
                                  "/file/project/" +
                                  data.project_images[index]
                                : "{{ asset('asset/img/background/add-image.png') }}";

                        // Get project ID from data.project_ids if available
                        let projectId = data.project_ids && data.project_ids[index] ? data.project_ids[index] : null;

                            rowHtml += `
                            <div class="col-md-4 mb-4 position-relative" data-project-id="${projectId}">
                                    <div class="card shadow-sm rounded-4 p-0" style="background-color: rgb(240, 241, 248); border:0; position: relative;">
                                        <div class="dropdown-icon-container">
                                            <span class="material-symbols-outlined dropdown-icon" tabindex="0">more_vert</span>
                <div class="dropdown-menu d-none">
                    <div class="dropdown-item">Detail</div>
                    <div class="dropdown-item">Task</div>
                    <div class="dropdown-item">Feedback</div>
                    <div class="dropdown-item">Assignment</div>
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
                                                        <h6 class="mb-0 title-project">${title}</h6>
                                                    </div>
                                                    <div class="d-flex justify-content-start mt-2">
                                                        <div class="d-flex align-items-center me-3">
                                                            <span class="material-symbols-outlined icon-format_list_bulleted">format_list_bulleted</span>
                                                            <span class="icon-number">${taskCount}</span>
                                                        </div>
                                                        <div class="d-flex align-items-center me-3">
                                                            <span class="material-symbols-outlined icon-av-timer">av_timer</span>
                                                            <span class="icon-number">${inProgressCount}</span>
                                                        </div>
                                                        <div class="d-flex align-items-center">
                                                            <span class="material-symbols-outlined icon-checklist">checklist</span>
                                                            <span class="icon-number">${completedCount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                               
                            </div>
                            `;

                        if (
                            (index + 1) % 3 === 0 &&
                            index !== data.project_titles.length - 1
                        ) {
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
                            // Toggle current dropdown
                            if (!isVisible) {
                                dropdownMenu.classList.remove('d-none');
                            }
                        });
                    });

// Feedback modal elements
var projectFeedbackModalEl = document.getElementById("projectFeedbackModal");
var modalTitle = projectFeedbackModalEl.querySelector(".feedback-modal-title");
var modalBody = projectFeedbackModalEl.querySelector(".feedback-modal-body");
var feedbackModalCloseBtn = projectFeedbackModalEl.querySelector(".btn-close");

// Function to load feedback data with loading spinner
function loadFeedbackData(projectId) {
    modalTitle.textContent = "Feedback";
    modalBody.innerHTML = '<div class="text-center my-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

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
                img.src = employeePhotoPath.length > 0 ? window.location.origin + employeePhotoPath : window.location.origin + '/asset/img/profile_picture/default.png';
                img.alt = 'Employee Photo';
                img.className = 'feedback-employee-photo me-2 rounded-circle';
                img.style.width = '40px';
                img.style.height = '40px';
                img.style.objectFit = 'cover';

                const infoDiv = document.createElement('div');
                const nameDiv = document.createElement('div');
                nameDiv.className = 'fw-bold';
                nameDiv.textContent = feedback.employee_name || 'Unknown';

                const roleDiv = document.createElement('div');
                roleDiv.className = 'text-muted small';
                roleDiv.textContent = (feedback.division ? feedback.division + ' | ' : '') + (feedback.role || '');

                infoDiv.appendChild(nameDiv);
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

                if (feedback.image) {
                    const feedbackImage = document.createElement('img');
                    feedbackImage.src = window.location.origin + '/file/project/' + feedback.image;
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
        refFileLink.href = window.location.origin + '/file/project/' + feedback.reference_file;
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
                <label for="feedback_comment" class="form-label">Comment</label>
                <textarea class="form-control" id="feedback_comment" name="feedback_comment" rows="3" required></textarea>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Image (Optional)</label>
                <div class="image-upload-container">
                    <label for="feedback_image" class="image-upload-label">
                        <img id="imagePreview" src="${window.location.origin}/asset/img/background/add-image.png" alt="Preview" class="img-thumbnail">
                        <span class="image-upload-text">Click to upload image</span>
                    </label>
                    <input type="file" id="feedback_image" name="feedback_image" accept="image/*" class="d-none">
                    <button type="button" id="clearImageBtn" class="btn btn-sm btn-danger mt-2 d-none">Remove Image</button>
                </div>
            </div>
            
            <div class="mb-3">
                <label for="reference_url" class="form-label">Reference URL (Optional)</label>
                <input type="url" class="form-control" id="reference_url" name="reference_url" placeholder="https://example.com">
            </div>
            
            <div class="mb-3">
                <label for="reference_file" class="form-label">Reference File (Optional)</label>
                <input type="file" class="form-control" id="reference_file" name="reference_file" accept=".pdf,.doc,.docx,.xls,.xlsx">
            </div>
            
            <div class="d-flex justify-content-between mt-4">
                <button type="button" class="btn btn-secondary" id="cancelFeedbackBtn">Cancel</button>
                <button type="submit" class="btn btn-primary">Submit Feedback</button>
            </div>
        </form>
    `;

    // Setup image preview logic
    const imageInput = modalBody.querySelector('#feedback_image');
    const imagePreview = modalBody.querySelector('#imagePreview');
    const clearImageBtn = modalBody.querySelector('#clearImageBtn');

    imageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                clearImageBtn.classList.remove('d-none');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    clearImageBtn.addEventListener('click', function() {
        imageInput.value = '';
        imagePreview.src = window.location.origin + '/asset/img/background/add-image.png';
        clearImageBtn.classList.add('d-none');
    });

    // Cancel button handler
    modalBody.querySelector('#cancelFeedbackBtn').addEventListener('click', function() {
        loadFeedbackData(projectFeedbackModalEl.getAttribute('data-project-id'));
    });

    // Form submission handler
    modalBody.querySelector('#addFeedbackForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitFeedbackForm(this, projectFeedbackModalEl.getAttribute('data-project-id'));
    });
}

// Function to submit feedback form
function submitFeedbackForm(form, projectId) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
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
        // Show success message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${data.message || 'Feedback submitted successfully!'}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        modalBody.prepend(alertDiv);

        // Reset form
        form.reset();
        const imagePreview = modalBody.querySelector('#imagePreview');
        if (imagePreview) {
            imagePreview.src = window.location.origin + '/asset/img/background/add-image.png';
        }
        modalBody.querySelector('#clearImageBtn').classList.add('d-none');

        // Reload feedback list after 1.5 seconds
        setTimeout(() => {
            loadFeedbackData(projectFeedbackModalEl.getAttribute('data-project-id'));
        }, 1500);
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


                    // Add event listener for delete project
                    document.querySelectorAll('.delete-project').forEach(item => {
                        item.addEventListener('click', function (e) {
                            e.stopPropagation();
                            if (!confirm('Are you sure you want to delete this project?')) {
                                return;
                            }
                            const card = this.closest('.col-md-4');
                            const projectId = card.getAttribute('data-project-id');
                            if (!projectId) {
                                alert('Project ID not found.');
                                return;
                            }
                            // Send AJAX DELETE request
                            $.ajax({
                                url: appUrl + '/projects/' + projectId,
                                type: 'DELETE',
                                headers: {
                                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                                },
                                success: function (response) {
                                    // Remove card from UI
                                    card.remove();

                                    // Show success alert below Add Project button
                                    let addProjectButtonContainer = document.querySelector('.d-flex.justify-content-end.mb-3');
                                    let projectCardsContainer = document.getElementById('project-cards-container');
                                    let alertContainer = document.querySelector('.alert alert-success');

                                    if (!alertContainer) {
                                        alertContainer = document.createElement('div');
                                        alertContainer.className = 'alert alert-success';
                                      
                                        addProjectButtonContainer.parentNode.insertBefore(alertContainer, projectCardsContainer);
                                    }
                                    alertContainer.textContent = response.message || 'Project deleted successfully';
                                    alertContainer.style.opacity = '1';

                                    // After 1.5 seconds, fade out alert and reload page
                                    setTimeout(() => {
                                        alertContainer.style.opacity = '0';
                                        setTimeout(() => {
                                            alertContainer.remove();
                                            location.reload();
                                        }, 500);
                                    }, 1500);
                                },
                                error: function () {
                                    alert('Failed to delete project.');
                                }
                            });
                        });
                    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function () {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('d-none');
        });
    });

    // Event listener for "Detail" dropdown item click and "Feedback";" dropdown item click
    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('dropdown-item')) {
            const text = e.target.textContent.trim();
            if (text === 'Detail') {
                e.preventDefault();
                e.stopPropagation();

                const card = e.target.closest('.col-md-4');
                if (!card) return;

                const projectId = card.getAttribute('data-project-id');
                if (!projectId) {
                    alert('Project ID not found.');
                    return;
                }

                // Fetch project details via AJAX
                $.ajax({
                    url: appUrl + '/projects/' + projectId,
                    type: 'GET',
                    dataType: 'json',
                    success: function (data) {
                        // Populate modal fields
                        const baseFileUrl = appUrl + '/file/project/';

                        $('#projectDetailImage').attr('src', data.image ? baseFileUrl + data.image : appUrl + '/asset/img/background/add-image.png');
                        $('#projectDetailTitle').text(data.title || '');
                        $('#projectDetailAuthor').text(data.author ? 'Author: ' + data.author.name : 'Author: N/A');
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

                        // Format dates as "day month year"
                        function formatDate(dateStr) {
                            if (!dateStr) return '';
                            const options = { year: 'numeric', month: 'long', day: 'numeric' };
                            const dateObj = new Date(dateStr);
                            return dateObj.toLocaleDateString(undefined, options);
                        }

                        $('#projectDetailStartDate').text(formatDate(data.start_date));
                        $('#projectDetailDueDate').text(formatDate(data.due_date));

                        // Co-authors list
                        if (data.co_authors && data.co_authors.length > 0) {
                            const coAuthorNames = data.co_authors.map(ca => ca.name).join(', ');
                            $('#projectDetailCoAuthors').text(coAuthorNames);
                        } else {
                            $('#projectDetailCoAuthors').text('None');
                        }

                        // Show modal
                        const projectDetailModalEl = document.getElementById('projectDetailModal');
                        const projectDetailModal = new bootstrap.Modal(projectDetailModalEl);
                        projectDetailModal.show();
                    },
                    error: function () {
                        alert('Failed to load project details.');
                    }
                });
            } else if (text === 'Feedback') {
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

                // Set the project id on the modal data attribute dynamically
                const projectFeedbackModalEl = document.getElementById('projectFeedbackModal');
                projectFeedbackModalEl.setAttribute('data-project-id', projectId);

                // Clear existing modal body content
                const modalBody = projectFeedbackModalEl.querySelector('.feedback-modal-body');
                modalBody.innerHTML = '';

            // Remove direct fetch call to avoid duplication
            // Instead, just call loadFeedbackData and show modal
            loadFeedbackData(projectId);
            const projectFeedbackModal = new bootstrap.Modal(projectFeedbackModalEl);
            projectFeedbackModal.show();
            }
        }
    });
    
    // Add Feedback button click handler (no logic yet)
document.getElementById('addFeedbackButton').addEventListener('click', function () {
    const feedbackModal = document.getElementById('projectFeedbackModal');
    const modalTitle = feedbackModal.querySelector('.feedback-modal-title');
    const modalContent = feedbackModal.querySelector('.feedback-modal-content');
    const modalBody = feedbackModal.querySelector('.feedback-modal-body');

    // Change modal title
    modalTitle.textContent = 'Add Feedback';

    // Clear existing modal body content
    modalBody.innerHTML = '';

    // Create form element
    const form = document.createElement('form');
    form.id = 'addFeedbackForm';
    form.enctype = 'multipart/form-data';

    // Hidden inputs for project_id and employee_id (assumed to be set dynamically)
    const projectIdInput = document.createElement('input');
    projectIdInput.type = 'hidden';
    projectIdInput.name = 'project_id';
    projectIdInput.value = feedbackModal.getAttribute('data-project-id') || '';

    const employeeIdInput = document.createElement('input');
    employeeIdInput.type = 'hidden';
    employeeIdInput.name = 'employee_id';
    employeeIdInput.value = feedbackModal.getAttribute('data-employee-id') || '';

    form.appendChild(projectIdInput);
    form.appendChild(employeeIdInput);

    // Image input section
    const imageDiv = document.createElement('div');
    imageDiv.className = 'mb-3';

    const imageLabelTitle = document.createElement('div');
    imageLabelTitle.className = 'title-label-image';
    imageLabelTitle.textContent = 'Input Image';
    imageDiv.appendChild(imageLabelTitle);

    const imageLabel = document.createElement('label');
    imageLabel.className = 'custom-image-upload position-relative';
    imageLabel.style.backgroundPosition = 'center center';
    imageLabel.style.backgroundRepeat = 'no-repeat';
    imageLabel.style.backgroundSize = '50%';
    imageLabel.style.backgroundImage = "url('"+window.location.origin+"/asset/img/background/add-image.png')";
    imageLabel.htmlFor = 'feedback_image';

    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.className = 'input-image';
    imageInput.id = 'feedback_image';
    imageInput.name = 'feedback_image';
    imageInput.accept = 'image/*';
    imageInput.hidden = true;

    const imageClearBtn = document.createElement('span');
    imageClearBtn.className = 'image-clear-btn d-none';
    imageClearBtn.id = 'feedbackImageClearBtn';
    imageClearBtn.title = 'Remove image';
    imageClearBtn.textContent = '×';

    imageLabel.appendChild(imageInput);
    imageLabel.appendChild(imageClearBtn);
    imageDiv.appendChild(imageLabel);

    // Invalid feedback div
    const invalidFeedback = document.createElement('div');
    invalidFeedback.className = 'invalid-feedback';
    invalidFeedback.textContent = 'Please select an image file.';
    imageDiv.appendChild(invalidFeedback);

    form.appendChild(imageDiv);

    // Feedback comment textarea
    const commentDiv = document.createElement('div');
    commentDiv.className = 'mb-3';

    const commentLabel = document.createElement('label');
    commentLabel.htmlFor = 'feedback_comment';
    commentLabel.className = 'form-label label-custom';
    commentLabel.textContent = 'Feedback Comment';
    commentDiv.appendChild(commentLabel);

    const commentTextarea = document.createElement('textarea');
    commentTextarea.className = 'form-control input-text';
    commentTextarea.id = 'feedback_comment';
    commentTextarea.name = 'feedback_comment';
    commentTextarea.rows = 3;
    commentDiv.appendChild(commentTextarea);

    form.appendChild(commentDiv);

    // Reference URL input
    const refUrlDiv = document.createElement('div');
    refUrlDiv.className = 'mb-3';

    const refUrlLabel = document.createElement('label');
    refUrlLabel.htmlFor = 'reference_url';
    refUrlLabel.className = 'form-label label-custom';
    refUrlLabel.textContent = 'Reference URL';
    refUrlDiv.appendChild(refUrlLabel);

    const refUrlInput = document.createElement('input');
    refUrlInput.type = 'text';
    refUrlInput.className = 'form-control input-text';
    refUrlInput.id = 'reference_url';
    refUrlInput.name = 'reference_url';
    refUrlDiv.appendChild(refUrlInput);

    form.appendChild(refUrlDiv);

    // Reference file input
    const refFileDiv = document.createElement('div');
    refFileDiv.className = 'mb-3';

    const refFileLabel = document.createElement('label');
    refFileLabel.htmlFor = 'reference_file';
    refFileLabel.className = 'form-label label-custom';
    refFileLabel.textContent = 'Reference File';
    refFileDiv.appendChild(refFileLabel);

    const refFileInput = document.createElement('input');
    refFileInput.type = 'file';
    refFileInput.className = 'form-control input-text';
    refFileInput.id = 'reference_file';
    refFileInput.name = 'reference_file';
    refFileInput.accept = '.pdf,.doc,.docx';
    refFileDiv.appendChild(refFileInput);

    form.appendChild(refFileDiv);

    // Submit button
    const submitDiv = document.createElement('div');
    submitDiv.className = 'modal-footer modal-footer-custom';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn-submit-black btn-submit-custom';
    submitBtn.textContent = 'Submit';

    submitDiv.appendChild(submitBtn);
    form.appendChild(submitDiv);

    // Append form to modal body
    modalBody.appendChild(form);

    // Image clear button logic
    imageInput.addEventListener('change', function () {
        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imageLabel.style.backgroundImage = `url('${e.target.result}')`;
                imageLabel.classList.add('has-image');
                imageLabel.style.backgroundSize = 'cover';
                imageLabel.style.opacity = '1';
                imageClearBtn.classList.remove('d-none');
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            imageLabel.style.backgroundImage = "url('"+window.location.origin+"/asset/img/background/add-image.png')";
            imageLabel.classList.remove('has-image');
            imageLabel.style.opacity = '0.5';
            imageClearBtn.classList.add('d-none');
        }
    });

    imageClearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        imageInput.value = '';
        imageLabel.style.backgroundPosition = 'center center';
        imageLabel.style.backgroundRepeat = 'no-repeat';
        imageLabel.style.backgroundSize = '50%';
        imageLabel.style.backgroundImage = "url('"+window.location.origin+"/asset/img/background/add-image.png')";
        imageLabel.classList.remove('has-image');
        imageLabel.style.opacity = '0.5';
        imageClearBtn.classList.add('d-none');
    });

    // File renaming logic on form submit
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Client-side validation for employee_id
        const feedbackModal = document.getElementById('projectFeedbackModal');
        const employeeId = feedbackModal.getAttribute('data-employee-id');
        if (!employeeId) {
            alert('You must be logged in to submit feedback.');
            return;
        }

        // Rename files with FEEDBACK_(timestamp) prefix
        const timestamp = Date.now();

        // Rename image file if exists
        if (imageInput.files.length > 0) {
            const imageFile = imageInput.files[0];
            const imageExtension = imageFile.name.split('.').pop();
            const newImageName = `FEEDBACK_${timestamp}.${imageExtension}`;
            const newImageFile = new File([imageFile], newImageName, { type: imageFile.type });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(newImageFile);
            imageInput.files = dataTransfer.files;
        }

        // Rename reference file if exists
        if (refFileInput.files.length > 0) {
            const refFile = refFileInput.files[0];
            const refExtension = refFile.name.split('.').pop();
            const newRefName = `FEEDBACK_${timestamp}.${refExtension}`;
            const newRefFile = new File([refFile], newRefName, { type: refFile.type });
            const dataTransferRef = new DataTransfer();
            dataTransferRef.items.add(newRefFile);
            refFileInput.files = dataTransferRef.files;
        }

        // Show loading overlay
        const loaderOverlay = feedbackModal.querySelector('.modal-loading-overlay');
        if (loaderOverlay) {
            loaderOverlay.classList.remove('d-none');
        }

        // Prepare form data
        const formData = new FormData(form);

        // Submit form via AJAX
        // Use absolute URL for fetch
        const feedbackUrl = appUrl + '/project-feedbacks';

        // Client-side validation for project_id and employee_id
        const projectId = feedbackModal.getAttribute('data-project-id');
        const employeeIdCheck = feedbackModal.getAttribute('data-employee-id');
        if (!projectId || !employeeIdCheck) {
            alert('You must be logged in and have a valid project to submit feedback.');
            return;
        }

        // Set hidden inputs explicitly before submit
        form.querySelector('input[name="project_id"]').value = projectId;
        form.querySelector('input[name="employee_id"]').value = employeeIdCheck;

        fetch(feedbackUrl, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text);
                });
            }
            return response.json();
        })
        .then(data => {
            // Hide loading overlay
            if (loaderOverlay) {
                loaderOverlay.classList.add('d-none');
            }

            if (data.message) {
                // Show success alert outside modal content in alert container below modal
                let modalDialog = feedbackModal.querySelector('.modal-dialog');
                let alertContainer = modalDialog.querySelector('.alert-container');
                if (!alertContainer) {
                    alertContainer = document.createElement('div');
                    alertContainer.className = 'alert-container mt-2';
                    modalDialog.appendChild(alertContainer);
                }
                alertContainer.innerHTML = `<div class="alert alert-success alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert" style="margin-bottom:0;">
                    <div>${data.message}</div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
                alertContainer.style.display = 'block';

                // Close modal after short delay
                setTimeout(() => {
                    // Instead of closing modal, reload feedback list and reset modal title
                    alertContainer.style.display = 'none';
                    alertContainer.innerHTML = '';
                    loadFeedbackData(feedbackModal.getAttribute('data-project-id'));
                    const modalTitle = feedbackModal.querySelector('.feedback-modal-title');
                    modalTitle.textContent = 'Project Feedback';
                }, 1500);
            } else {
                alert('Feedback added, but no confirmation message received.');
            }
        })
        .catch(error => {
            if (loaderOverlay) {
                loaderOverlay.classList.add('d-none');
            }
            alert('Failed to submit feedback. Please try again.');
            console.error('Error submitting feedback:', error);
        });
    });
});
                }
            },
            error: function () {
                console.error("Failed to load project card data.");
            },
        });
    }

    // Load departments dynamically
    function loadDepartments() {
        $.ajax({
            url: appUrl + "/departments",
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
                departmentSelect.innerHTML = options;
            },
            error: function () {
                alert("Failed to load departments.");
            },
        });
    }

    // Load divisions based on selected department
    function loadDivisions(departmentId) {
        divisionSelect.innerHTML =
            '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/divisions",
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
                divisionSelect.innerHTML = options;
            },
            error: function () {
                alert("Failed to load divisions.");
            },
        });
    }

    // Load projects for "part_of_project" select
    function loadProjects() {
        $.ajax({
            url: appUrl + "/projects",
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
                alert("Failed to load projects.");
            },
        });
    }

    // Load employees for "co_author" single select
    function loadEmployees() {
        $.ajax({
            url: appUrl + "/employees",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options = '<option value="">Select Co-Author</option>';
                (data.data || []).forEach((emp) => {
                    options += `<option value="${emp.id}">${emp.name}</option>`;
                });
                const coAuthorSelect = document.getElementById("co_author_select");
                if (coAuthorSelect) {
                    coAuthorSelect.innerHTML = options;
                }
            },
            error: function () {
                alert("Failed to load employees.");
            },
        });
    }

    // Manage selected co-authors list and hidden input
    function setupCoAuthorSelection() {
        const coAuthorSelect = document.getElementById("co_author_select");
        const selectedContainer = document.getElementById("selected_co_authors");
        const hiddenInput = document.getElementById("co_author");

        let selectedCoAuthors = [];

        function updateHiddenInput() {
            hiddenInput.value = JSON.stringify(selectedCoAuthors.map(e => e.id));
        }

        function renderSelectedCoAuthors() {
            selectedContainer.innerHTML = '';
            selectedCoAuthors.forEach(emp => {
                const badge = document.createElement('span');
                badge.className = 'badge bg-primary me-2 mb-2 d-inline-flex align-items-center';
                badge.textContent = emp.name;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-close-white btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', () => {
                    selectedCoAuthors = selectedCoAuthors.filter(e => e.id !== emp.id);
                    renderSelectedCoAuthors();
                    updateHiddenInput();
                });

                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        coAuthorSelect.addEventListener('change', () => {
            const selectedId = coAuthorSelect.value;
            if (selectedId && !selectedCoAuthors.some(e => e.id == selectedId)) {
                const selectedOption = coAuthorSelect.options[coAuthorSelect.selectedIndex];
                selectedCoAuthors.push({ id: selectedId, name: selectedOption.text });
                renderSelectedCoAuthors();
                updateHiddenInput();
            }
            coAuthorSelect.value = '';
        });

        // Function to clear selected co-authors
        function clearSelectedCoAuthors() {
            selectedCoAuthors = [];
            renderSelectedCoAuthors();
            updateHiddenInput();
            if (coAuthorSelect) {
                coAuthorSelect.value = '';
            }
        }

        // Expose clearSelectedCoAuthors function to global scope for use in modal close event
        window.clearSelectedCoAuthors = clearSelectedCoAuthors;
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
        alertContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
        alertContainer.style.display = 'block';
        setTimeout(() => {
            alertContainer.style.display = 'none';
            // Reload the page after alert disappears
            location.reload();
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
            url: appUrl + "/projects",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                // Show success alert
                showAlert(response.message || "Project added successfully!", "success");

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
    loadEmployees();
    setupCoAuthorSelection();

    // Load divisions when department changes
    departmentSelect.addEventListener("change", function () {
        const deptId = this.value;
        if (deptId) {
            loadDivisions(deptId);
        } else {
            divisionSelect.innerHTML =
                '<option value="" disabled selected>Select Division</option>';
        }
    });

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
        loadEmployees();

        // Clear selected co-authors display and hidden input using the global function
        if (window.clearSelectedCoAuthors) {
            window.clearSelectedCoAuthors();
        }
    });
});

