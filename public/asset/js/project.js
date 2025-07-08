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

    // Load departments dynamically
    function loadDepartments() {
        $.ajax({
            url: appUrl + "/departments",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options = '<option value="" disabled selected>Select Department</option>';
                (data.data || []).forEach((dept) => {
                    options += `<option value="${dept.id}">${dept.name_department || dept.name}</option>`;
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
        divisionSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
        $.ajax({
            url: appUrl + "/divisions",
            type: "GET",
            data: { department_id: departmentId },
            dataType: "json",
            success: function (data) {
                let options = '<option value="" disabled selected>Select Division</option>';
                (data.data || []).forEach((div) => {
                    options += `<option value="${div.id}">${div.name_division || div.name}</option>`;
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
                let options = '<option value="" disabled selected>Select Project</option>';
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
            label.style.backgroundImage = "url('" + appUrl + "/asset/img/background/add-image.png')";
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

    // Form submission via AJAX
    addProjectForm.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!addProjectForm.checkValidity()) {
            e.stopPropagation();
            addProjectForm.classList.add("was-validated");
            return;
        }
        addProjectForm.classList.remove("was-validated");

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
                alert(response.message);
                // Reset form and preview
                addProjectForm.reset();
                imageLabel.style.backgroundImage = "";
                imageLabel.classList.remove("has-image");
                imageLabel.style.opacity = "0.5";
                imageClearBtn.classList.add("d-none");
                divisionSelect.innerHTML = '<option value="" disabled selected>Select Division</option>';
                loadDepartments();
                loadProjects();
                // Close modal
                var addProjectModalEl = document.getElementById("addProjectModal");
                var addProjectModal = bootstrap.Modal.getInstance(addProjectModalEl);
                if (addProjectModal) addProjectModal.hide();
            },
            error: function (xhr) {
                if (xhr.status === 422) {
                    let errors = xhr.responseJSON.errors;
                    let errorMessages = "";
                    for (let key in errors) {
                        errorMessages += errors[key].join("\\n") + "\\n";
                    }
                    alert(errorMessages);
                } else {
                    alert("Failed to create project.");
                }
            },
        });
    });

    // Load departments and projects on page load
    loadDepartments();
    loadProjects();

    // Load divisions when department changes
    departmentSelect.addEventListener("change", function () {
        const deptId = this.value;
        if (deptId) {
            loadDivisions(deptId);
        } else {
            divisionSelect.innerHTML = '<option value="" disabled selected>Select Division</option>';
        }
    });

    // Clear form and reset image preview when modal is closed
    var addProjectModalEl = document.getElementById("addProjectModal");
    addProjectModalEl.addEventListener("hidden.bs.modal", function () {
        addProjectForm.reset();
        imageLabel.style.backgroundImage = "url('" + appUrl + "/asset/img/background/add-image.png')";
        imageLabel.style.backgroundPosition = "center center";
        imageLabel.style.backgroundRepeat = "no-repeat";
        imageLabel.style.backgroundSize = "50%";
        imageLabel.classList.remove("has-image");
        imageLabel.style.opacity = "0.5";
        imageClearBtn.classList.add("d-none");
        divisionSelect.innerHTML = '<option value="" disabled selected>Select Division</option>';
    });
});
