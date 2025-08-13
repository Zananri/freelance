<!-- Progress Modal -->
<div class="modal fade" id="progressModal" tabindex="-1" aria-labelledby="progressModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
        <div class="modal-content modal-content-custom">
            <div class="modal-header modal-header-custom">
                <h5 class="modal-title modal-title-custom" id="progressModalLabel">Progress</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body modal-body-custom d-flex flex-column align-items-center">
                <h6 class="fw-bold text-primary mb-2">In Progress</h6>
                <p class="text-muted small mb-4 text-center" style="font-size: 0.9rem; max-width: 250px;">
                    Task is currently being worked on and making progress...
                </p>
                <p class="fw-bold fs-5 text-center mb-4">Are you sure want to update status?</p>
                <div class="d-flex justify-content-center gap-3 w-100">
                    <button type="button" class="btn btn-submit-black" onclick="updateTaskStatus('progress')">Confirm</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Set to Complete Modal -->
<div class="modal fade" id="completeModal" tabindex="-1" aria-labelledby="completeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
        <div class="modal-content modal-content-custom">
            <div class="modal-header modal-header-custom">
