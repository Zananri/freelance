$(document).ready(function() {
    const attendanceData = {
        annual_leave: 5,
        sick: 3,
        present: 20,
        absent: 2
    };

    const ctx = document.getElementById('attendanceChart');

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Annual Leave', 'Sick', 'Present', 'Absent'],
            datasets: [{
                data: [
                    attendanceData.annual_leave,
                    attendanceData.sick,
                    attendanceData.present,
                    attendanceData.absent
                ],
                backgroundColor: [
                    '#FFAE4C',
                    '#8979FF',
                    '#3CC3DF',
                    '#FF928A',
                ],
                borderwidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: false, 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label} : ${context.raw} Days`;
                        }
                    }
                }
            }
        }
    })
})

(function () {
    function qs(id) {
        return document.getElementById(id);
    }

    const elBreadcrumbText = qs('mydocBreadcrumbText');
    const elGridWrapper = qs('mydocGridWrapper');
    const elLoading = qs('mydocLoading');
    const elEmptyState = qs('mydocEmptyState');

    if (!elBreadcrumbText || !elGridWrapper) return;

    let lastBreadcrumb = [];
    let state = { parentId: null };

    function renderBreadcrumb(breadcrumb) {
        const text = breadcrumb && breadcrumb.length
            ? breadcrumb.map(x => x.folder_name).join(' / ')
            : 'Documents';
        elBreadcrumbText.textContent = text;

    }

    function escapeHtml(str) {
        return String(str || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '<')
            .replaceAll('>', '>')
            .replaceAll('"', '"')
            .replaceAll("'", '&#039;');
    }

    function renderFolderCard(folder, totalItems) {
        const name = escapeHtml(folder.folder_name);
        const owner = escapeHtml(folder.creator ? (folder.creator.name ?? '') : '');

        return `
            <div class="folder-wrapper" role="button" tabindex="0" data-folder-id="${folder.id}">
                <div class="folder-shadow-tab"></div>
                <div class="folder-shadow"></div>
                <div class="folder-tab"></div>
                <div class="folder-body" onclick="void(0)">
                    <p class="folder-name">${name}</p>
                    <p class="folder-role">${owner}</p>
                    <hr class="folder-divider">
                    <div class="folder-footer">
                        <div class="folder-avatar"></div>
                        <span class="folder-items">${totalItems} Items</span>
                    </div>
                </div>
            </div>
        `;
    }

    function loadWithBreadcrumb(parentId) {
        state.parentId = parentId;

        if (elLoading) elLoading.classList.remove('d-none');
        if (elEmptyState) elEmptyState.classList.add('d-none');

        const baseUrl = window.APP_URL ? `${window.APP_URL}/document/get-all-folder` : '/document/get-all-folder';
        const url = new URL(baseUrl, window.location.origin);

        if (parentId) url.searchParams.set('parent_id', parentId);

        fetch(url.toString(), {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(r => r.json())
            .then(data => {
                if (!data) return;

                const folders = data.folders || [];
                const files = data.files || [];
                lastBreadcrumb = data.breadcrumb || [];

                renderBreadcrumb(lastBreadcrumb);

                [...elGridWrapper.querySelectorAll('.folder-wrapper')].forEach(n => n.remove());

                if (elLoading) elLoading.classList.add('d-none');

                if ((!folders || folders.length === 0) && (!files || files.length === 0)) {
                    if (elEmptyState) elEmptyState.classList.remove('d-none');
                    return;
                }

                const filesByFolderId = new Map();
                (files || []).forEach(f => {
                    const fid = f.folder_id || null;
                    const key = fid ? String(fid) : 'null';
                    filesByFolderId.set(key, (filesByFolderId.get(key) || 0) + 1);
                });

                folders.forEach(folder => {
                    const folderKey = String(folder.id);
                    const fileCount = filesByFolderId.get(folderKey) || 0;
                    const totalItems = fileCount;

                    const cardHtml = renderFolderCard(folder, totalItems);
                    const temp = document.createElement('div');
                    temp.innerHTML = cardHtml.trim();
                    const card = temp.firstElementChild;

                    card.addEventListener('click', () => {
                        loadWithBreadcrumb(folder.id);
                    });

                    elGridWrapper.appendChild(card);
                });
            })
            .catch(() => {
                if (elLoading) elLoading.classList.add('d-none');
                if (elEmptyState) elEmptyState.classList.remove('d-none');
            });
    }

    loadWithBreadcrumb(null);
})();

