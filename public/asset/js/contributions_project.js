(function($){
    const $btn = $('#openContributionsModalBtn');
    if ($btn.length === 0) return;

    const $contribModal = $('#contributionsModal');
    let bsModal = null;
    function ensureModal(){
      if (!bsModal && $contribModal.length && window.bootstrap) {
        bsModal = new bootstrap.Modal($contribModal[0]);
      }
      return bsModal;
    }

    function getEmployeeId(){
      const $input = $("input[name='employee_id']");
      const v = ($input.length ? $input.val() : '') || '';
      if (v) return v;
      // Fallback: try data-employee-id on common modals
      const $pfm = $('#projectFeedbackModal');
      if ($pfm.length) {
        const d = $pfm.data('employee-id');
        if (d) return String(d);
      }
      const $epm = $('#editProjectModal');
      if ($epm.length) {
        const d = $epm.data('employee-id');
        if (d) return String(d);
      }
      return null;
    }

    function route(path){
      const base = (window.APP_URL || window.location.origin).replace(/\/$/, '');
      const rel = path.replace(/^\//, '');
      try {
        return new URL(rel, base + '/').toString();
      } catch (_) {
        return rel;
      }
    }

    function levelClassForCount(count){
      if (!count) return 'level-0';
      const thresholds = [1, 3, 6, 10];
      let idx = 0;
      for (let i = 0; i < thresholds.length; i++) {
        if (count <= thresholds[i]) { idx = i+1; break; }
        idx = thresholds.length;
      }
      return `level-${Math.min(idx, 4)}`;
    }

    function renderGrid($container, data){
      // data: {start, end, days:[{date, count}], max}
      $container.empty();

      const todayLocal = new Date();
      const yearLocal = todayLocal.getFullYear();
      const start = new Date(yearLocal, 0, 1);
      const end = new Date(yearLocal, 11, 31);

      // Build a map date->count
      const map = new Map();
      (data.days || []).forEach(d => { map.set(d.date, d.count); });

      // Align grid to the Sunday on/before start
      const first = new Date(start);
      while (first.getDay() !== 0) { first.setDate(first.getDate() - 1); }

      // Weekday labels
      const $weekdaysEl = $('#contribWeekdays');
      const $monthsEl = $('#contribMonths');
      if ($weekdaysEl.length) {
        $weekdaysEl.empty();
        const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        for (let i = 0; i < 7; i++) {
          const text = (labels[i] === 'Mon' || labels[i] === 'Wed' || labels[i] === 'Fri') ? labels[i] : '';
          $('<div/>', { class: 'contrib-weekday-label', text }).appendTo($weekdaysEl);
        }
      }

      // Build heatmap grid
      const $grid = $('<div/>', { class: 'contrib-grid' });

      let $tooltip = $('.contrib-tooltip');
      if ($tooltip.length === 0) {
        $tooltip = $('<div/>', { class: 'contrib-tooltip' }).appendTo('body');
      }

      function showTip(e, text){
        $tooltip.text(text)
                .css({ left: (e.clientX + 10) + 'px', top: (e.clientY + 10) + 'px', display: 'block' });
      }
      function hideTip(){ $tooltip.css('display', 'none'); }

      let cursor = new Date(first);
      const msInDay = 86400000;
      let weekIndex = 0;

      while (cursor <= end) {
        const dstr = cursor.toISOString().slice(0,10);
        const count = map.get(dstr) || 0;
        const $square = $('<div/>', {
          class: `contrib-square ${levelClassForCount(count)}`,
          'aria-label': `${count} completed on ${dstr}`,
          'data-tip': `${count} completed on ${dstr}`
        }).on('mousemove', (e)=>showTip(e, `${count} completed on ${dstr}`))
          .on('mouseleave', hideTip)
          .css('grid-row-start', String(cursor.getDay() + 1));

        $grid.append($square);

        if (cursor.getDay() === 0) { // Sunday = new column
          weekIndex++;
        }

        cursor = new Date(cursor.getTime() + msInDay);
      }

      // Set responsive sizing based on number of weeks
      const weeks = Math.max(1, weekIndex);
      const layoutEl = $container.closest('.contrib-layout')[0];
      if (layoutEl) {
        layoutEl.style.setProperty('--weeks', weeks);
        const chartEl = $container.closest('.contrib-chart')[0];
        if (chartEl) {
          const isMobile = window.matchMedia && window.matchMedia('(max-width: 576px)').matches;
          if (!isMobile) {
            const chartWidth = chartEl.getBoundingClientRect().width;
            const cs = getComputedStyle(layoutEl);
            const gapStr = (cs.getPropertyValue('--gap') || '2px').trim();
            const gapPx = parseFloat(gapStr) || 2;
            const raw = (chartWidth - (weeks - 1) * gapPx) / weeks;
            const cellPx = Math.max(6, Math.floor(raw));
            layoutEl.style.setProperty('--cell', `${cellPx}px`);
          }
        }
      }

      // Month labels Jan..Dec
      if ($monthsEl.length) {
        $monthsEl.empty();
        $monthsEl.css('grid-template-columns', `repeat(${weeks}, var(--cell))`);
        const cs = getComputedStyle(layoutEl || $monthsEl[0]);
        const gapVal = cs.getPropertyValue('--gap') || '2px';
        $monthsEl.css('gap', gapVal);

        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const startYear = start.getFullYear();
        for (let m = 0; m < 12; m++) {
          const firstOfMonth = new Date(startYear, m, 1);
          const anchor = new Date(firstOfMonth);
          while (anchor.getDay() !== 0) { anchor.setDate(anchor.getDate() - 1); }
          const diffDays = Math.floor((anchor - first) / msInDay);
          const colIndex = Math.floor(diffDays / 7) + 1; // 1-based grid column
          if (colIndex >= 1 && colIndex <= weeks) {
            $('<div/>', { class: 'contrib-month-label', text: monthNames[m] })
              .css('grid-column-start', String(colIndex))
              .appendTo($monthsEl);
          }
        }
      }

      $container.append($grid);
    }

    async function fetchData(employeeId){
      const today = new Date();
      const year = today.getFullYear();
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const fmt = (d)=> d.toISOString().slice(0,10);
      const $endpointEl = $('#contrib-endpoint');
      const baseUrl = $endpointEl.length ? $endpointEl.val() : route(`employees/${employeeId}/contributions`);
      const sep = (baseUrl || '').includes('?') ? '&' : '?';
      // Optional project scoping (project detail page)
      const projectId = ($('#contrib-project-id').length ? $('#contrib-project-id').val() : '') || '';
      const scope = projectId ? `&project_id=${encodeURIComponent(projectId)}` : '';
      const url = `${baseUrl}${sep}start=${fmt(start)}&end=${fmt(end)}${scope}`;

      try {
        const json = await $.ajax({
          url,
          method: 'GET',
          dataType: 'json',
          headers: { 'Accept': 'application/json' }
        });
        if (json && json.data) return json.data; else return { start: fmt(start), end: fmt(end), days: [], max: 0 };
      } catch (err) {
        throw new Error('Failed to fetch contributions');
      }
    }

    $btn.on('click', async function(){
      const modal = ensureModal();
      if (!modal) return;
      const employeeId = getEmployeeId();
      const hasEndpoint = $('#contrib-endpoint').length && $('#contrib-endpoint').val();
      if (!employeeId && !hasEndpoint) {
        console.warn('No employee_id on page');
        modal.show();
        return;
      }

      const $gridContainer = $('#contributionsGrid');
      if ($gridContainer.length) $gridContainer.html('<div class="text-center w-100 py-3"><div class="spinner-border" role="status"></div></div>');

      modal.show();

      try {
  const data = await fetchData(employeeId || 'self');
        if ($gridContainer.length) renderGrid($gridContainer, data);
        const onResize = () => {
          const layoutEl = $('#contributionsGrid').closest('.contrib-layout')[0];
          const chartEl = $('#contributionsGrid').closest('.contrib-chart')[0];
          if (!layoutEl || !chartEl) return;
          const isMobile = window.matchMedia && window.matchMedia('(max-width: 576px)').matches;
          if (!isMobile) {
            const weeksVar = parseInt(getComputedStyle(layoutEl).getPropertyValue('--weeks')) || 53;
            const chartWidth = chartEl.getBoundingClientRect().width;
            const cs = getComputedStyle(layoutEl);
            const gapStr = (cs.getPropertyValue('--gap') || '2px').trim();
            const gapPx = parseFloat(gapStr) || 2;
            const raw = (chartWidth - (weeksVar - 1) * gapPx) / weeksVar;
            const cellPx = Math.max(6, Math.floor(raw));
            layoutEl.style.setProperty('--cell', `${cellPx}px`);
          } else {
            // On mobile, let cells use CSS default; no resize calc
          }
        };
        $(window).on('resize.contrib', onResize);
        $contribModal.one('hidden.bs.modal', () => {
          $(window).off('resize.contrib', onResize);
        });
        setTimeout(() => onResize(), 0);
      } catch (e) {
        if ($gridContainer.length) $gridContainer.html('<div class="text-danger">Failed to load contributions.</div>');
      }
    });
})(jQuery);
