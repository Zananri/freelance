$(document).ready(function() {
    if (window.__dashboardAnnouncementInitialized) {
        return;
    }
    window.__dashboardAnnouncementInitialized = true;

    const mydocGridWrapper = document.getElementById('mydocGridWrapper');
    const mydocLoading = document.getElementById('mydocLoading');
    const mydocEmptyState = document.getElementById('mydocEmptyState');
    const mydocBreadcrumbText = document.getElementById('mydocBreadcrumbText');

    const state = {
        parentId: null, // null = root
    };

    function setMyDocLoading(isLoading) {
        if (mydocLoading) mydocLoading.classList.toggle('d-none', !isLoading);
    }

    function setMyDocEmpty(isEmpty) {
        if (mydocEmptyState) mydocEmptyState.classList.toggle('d-none', !isEmpty);
    }

    function renderBreadcrumb(breadcrumb) {
        if (!mydocBreadcrumbText) return;
        const parts = (breadcrumb || []).map(b => b.folder_name).filter(Boolean);
        mydocBreadcrumbText.textContent = parts.length ? parts.join(' / ') : 'Documents';
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '<')
            .replaceAll('>', '>')
            .replaceAll('"', '"')
            .replaceAll("'", '&#039;');
    }

    function renderMyDocsGrid({ folders, files, breadcrumb }) {
        if (!mydocGridWrapper) return;

        renderBreadcrumb(breadcrumb);
        const foldersArr = folders || [];
        const filesArr = files || [];

        const folderCardsHtml = foldersArr.length
            ? foldersArr
                .map(f => {
                    const folderId = f.id;
                    const folderName = escapeHtml(f.folder_name);
                    return `
                        <div class="folder-wrapper" style="cursor:pointer;" data-parent-id="${folderId}">
                            <div class="folder-shadow-tab"></div>
                            <div class="folder-shadow"></div>
                            <div class="folder-tab"></div>
                            <div class="folder-body">
                                <p class="folder-name">${folderName}</p>
                                <p class="folder-role">Folder</p>
                                <hr class="folder-divider">
                                <div class="folder-footer">
                                    <div class="folder-avatar"></div>
                                    <span class="folder-items">&nbsp;Items</span>
                                </div>
                            </div>
                        </div>
                    `;
                })
                .join('')
            : '';

        const filesHtml = (!foldersArr.length && filesArr.length)
            ? `
                <div class="document-files">
                    ${filesArr
                        .slice(0, 6)
                        .map(d => {
                            const name = escapeHtml(d.file_name);
                            return `<div class="fs-12 text-body mb-2">📄 ${name}</div>`;
                        })
                        .join('')}
                    ${filesArr.length > 6 ? `<div class="fs-12 text-body text-opacity-50">+${filesArr.length - 6} more...</div>` : ''}
                </div>
            `
            : '';

        mydocGridWrapper.querySelectorAll('.folder-wrapper[data-parent-id]').forEach(el => el.remove());

        mydocGridWrapper.innerHTML = `
            ${folderCardsHtml}
            ${filesHtml}
        `;

        const existingBack = mydocGridWrapper.querySelector('#mydocWidgetDocumentBack');
        if (existingBack) existingBack.remove();

        if (state.parentId !== null) {
            const backBtn = document.createElement('button');
            backBtn.id = 'mydocWidgetDocumentBack';
            backBtn.type = 'button';
            backBtn.className = 'widget-back-btn mb-3';
            backBtn.innerHTML = `<span class="material-symbols-outlined">arrow_back</span> Back`;
            backBtn.style.marginTop = '8px';
            backBtn.addEventListener('click', () => {
                const parts = (state.lastBreadcrumb || []);
                if (parts.length >= 2) {
                    const parent = parts[parts.length - 2];
                    state.parentId = parent && parent.id ? parent.id : null;
                } else {
                    state.parentId = null;
                }
                loadMyDocs();
            });
            mydocGridWrapper.prepend(backBtn);
        }

        mydocGridWrapper.querySelectorAll('.folder-wrapper[data-parent-id]').forEach(card => {
            card.addEventListener('click', () => {
                const nextId = card.getAttribute('data-parent-id');
                state.parentId = nextId ? Number(nextId) : null;
                loadMyDocs();
            });
        });
    }

    function loadMyDocs() {
        if (!mydocGridWrapper) return;

        state.lastBreadcrumb = state.lastBreadcrumb || [];
        setMyDocLoading(true);
        setMyDocEmpty(false);

        const baseUrl = window.APP_URL ? `${window.APP_URL}/document/get-all-folder` : '/document/get-all-folder';
        const url = new URL(baseUrl, window.location.origin);

        if (state.parentId !== null && state.parentId !== undefined) {
            url.searchParams.set('parent_id', state.parentId);
        }

        fetch(url.toString(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })
            .then(r => r.json())
            .then(res => {
                const folders = res.folders || [];
                const files = res.files || [];
                const breadcrumb = res.breadcrumb || [];

                state.lastBreadcrumb = breadcrumb;

                if (!folders.length && !files.length) {
                    setMyDocEmpty(true);
                    if (mydocGridWrapper) mydocGridWrapper.innerHTML = '';
                    return;
                }

                setMyDocEmpty(false);
                renderMyDocsGrid({ folders, files, breadcrumb });
            })
            .catch(() => {
                setMyDocEmpty(true);
                if (mydocGridWrapper) mydocGridWrapper.innerHTML = '';
            })
            .finally(() => setMyDocLoading(false));
    }

    if (mydocGridWrapper) {
        loadMyDocs();
    }

    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;

    const now = new Date();
    const month = String(now.getMonth() + 1);
    const year = String(now.getFullYear());

    const centerValueEl = document.querySelector('#attendanceChartCenter .attendance-chart-center-value');
    const loadingEl = document.getElementById('attendanceChartLoading');
    const emptyEl = document.getElementById('attendanceChartEmpty');

    const dayEls = {
        present: document.getElementById('attendancePresentDay'),
        sick: document.getElementById('attendanceSickDay'),
        annual_leave: document.getElementById('attendanceLeaveDay'),
        absent: document.getElementById('attendanceAbsentDay'),
    };

    let attendanceChartInstance = null;

    function setLoading(isLoading) {
        if (loadingEl) loadingEl.classList.toggle('d-none', !isLoading);
    }

    function setEmpty(isEmpty) {
        if (emptyEl) emptyEl.classList.toggle('d-none', !isEmpty);
    }

    function updateLegend(summary) {
        if (dayEls.present) dayEls.present.textContent = summary.present + ' Days';
        if (dayEls.sick) dayEls.sick.textContent = summary.sick + ' Days';
        if (dayEls.annual_leave) dayEls.annual_leave.textContent = summary.annual_leave + ' Days';
        if (dayEls.absent) dayEls.absent.textContent = summary.absent + ' Days';
    }

    function renderAttendanceChart(selectedMonth, selectedYear) {
        setLoading(true);
        setEmpty(false);

        $.ajax({
            url: '/attendance/get-attendance-summary-by-month',
            type: 'GET',
            data: { MONTH: selectedMonth, YEAR: selectedYear }
        })
        .done(function(res) {
            const summary = (res && res.data && res.data.summary) || {
                present: 0, sick: 0, annual_leave: 0, absent: 0
            };

            const total = summary.present + summary.sick + summary.annual_leave + summary.absent;

            updateLegend(summary);

            if (centerValueEl) centerValueEl.textContent = total;

            setEmpty(total === 0);

            const chartData = [
                summary.annual_leave,
                summary.sick,
                summary.present,
                summary.absent
            ];

            if (attendanceChartInstance) {
                attendanceChartInstance.data.datasets[0].data = chartData;
                attendanceChartInstance.update();
            } else {
                const existingChart = Chart.getChart(ctx);
                if (existingChart) {
                    existingChart.destroy();
                }
                attendanceChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Annual Leave', 'Sick', 'Present', 'Absent'],
                        datasets: [{
                            data: chartData,
                            backgroundColor: [
                                '#FFAE4C',
                                '#8979FF',
                                '#3CC3DF',
                                '#FF928A'
                            ],
                            borderWidth: 0,
                            hoverOffset: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        animation: {
                            duration: 400
                        },
                        plugins: {
                            legend: {
                                display: false
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
                });
            }
        })
        .fail(function() {
            setEmpty(true);
        })
        .always(function() {
            setLoading(false);
        });
    }

    // Initial render
    renderAttendanceChart(month, year);

    // Month dropdown
    const dropdown = document.getElementById('attendanceMonthDropdown');
    if (dropdown) {
        const dropdownMenu = dropdown.closest('.dropdown')?.querySelector('.dropdown-menu');

        dropdownMenu?.querySelectorAll('button[data-month][data-year]').forEach(btn => {
            btn.addEventListener('click', () => {
                const m = btn.getAttribute('data-month');
                const y = btn.getAttribute('data-year');

                const label = btn.textContent.trim();
                const labelEl = document.getElementById('attendanceMonthDropdownLabel');
                if (labelEl) labelEl.textContent = label;

                dropdownMenu.querySelectorAll('button[data-month][data-year]').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                renderAttendanceChart(m, y);
            });
        });
    }
});