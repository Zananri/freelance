(function(){
  const btn = document.getElementById('openContributionsModalBtn');
  if (!btn) return;

  const contributionsModalEl = document.getElementById('contributionsModal');
  let bsModal = null;
  function ensureModal(){
    if (!bsModal && contributionsModalEl && window.bootstrap) {
      bsModal = new bootstrap.Modal(contributionsModalEl);
    }
    return bsModal;
  }

  function getEmployeeId(){
    const input = document.querySelector("input[name='employee_id']");
    return input ? input.value : null;
  }

  function route(path){
    // Build URL using APP_URL when available; keep path relative (no leading slash)
    const base = (window.APP_URL || window.location.origin).replace(/\/$/, '');
    const rel = path.replace(/^\//, '');
    try {
      return new URL(rel, base + '/').toString();
    } catch (_) {
      return rel; // fallback to relative
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

  function isoWeekday(date){
    // 0..6 with 0=Sun like GitHub grid (top is Sun)
    return date.getDay();
  }

  function getWeekIndex(startDate, current, weekStart){
    // count weeks from the first Sunday (or weekStart) from start
    const msInDay = 86400000;
    const diffDays = Math.floor((current - startDate) / msInDay);
    return Math.floor((diffDays + ((startDate.getDay() - weekStart + 7) % 7)) / 7);
  }

  function renderGrid(container, data){
    // data: {start, end, days:[{date, count}], max}
    container.innerHTML = '';

  const todayLocal = new Date();
  const yearLocal = todayLocal.getFullYear();
  const start = new Date(yearLocal, 0, 1); // Jan 1 current year
  const end = new Date(yearLocal, 11, 31); // Dec 31 current year

    // Build a map date->count
    const map = new Map();
    data.days.forEach(d => { map.set(d.date, d.count); });

    // Align grid to the Sunday on/before start
    const first = new Date(start);
    while (first.getDay() !== 0) { first.setDate(first.getDate() - 1); }

    // Prepare elements for labels
    const weekdaysEl = document.getElementById('contribWeekdays');
    const monthsEl = document.getElementById('contribMonths');
    if (weekdaysEl) {
      weekdaysEl.innerHTML = '';
      const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      for (let i = 0; i < 7; i++) {
        const span = document.createElement('div');
        span.className = 'contrib-weekday-label';
        // Show only Mon, Wed, Fri to mimic GitHub sparsity
        span.textContent = (labels[i] === 'Mon' || labels[i] === 'Wed' || labels[i] === 'Fri') ? labels[i] : '';
        weekdaysEl.appendChild(span);
      }
    }

  // Build heatmap grid
    const grid = document.createElement('div');
    grid.className = 'contrib-grid';

    let tooltip = document.querySelector('.contrib-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'contrib-tooltip';
      document.body.appendChild(tooltip);
    }

    function showTip(e, text){
      tooltip.textContent = text;
      tooltip.style.left = (e.clientX + 10) + 'px';
      tooltip.style.top = (e.clientY + 10) + 'px';
      tooltip.style.display = 'block';
    }
    function hideTip(){ tooltip.style.display = 'none'; }

  let cursor = new Date(first);
    const msInDay = 86400000;
    let weekIndex = 0;

  // We'll render labels for Jan..Dec (current year) and align them to the week column that contains the 1st

    while (cursor <= end) {
      const dstr = cursor.toISOString().slice(0,10);
      const count = map.get(dstr) || 0;
      const square = document.createElement('div');
      square.className = `contrib-square ${levelClassForCount(count)}`;
      square.title = `${count} completed on ${dstr}`;
      square.setAttribute('aria-label', square.title);
      square.addEventListener('mousemove', (e)=>showTip(e, square.title));
      square.addEventListener('mouseleave', hideTip);

      const row = cursor.getDay();
      square.style.gridRowStart = String(row + 1);
      grid.appendChild(square);

      // Count weeks (columns) on Sundays
      if (row === 0) { // Sunday = new column
        weekIndex++;
      }

      cursor = new Date(cursor.getTime() + msInDay);
    }

    // Set responsive sizing based on number of weeks
    const weeks = Math.max(1, weekIndex);
    const layoutEl = container.closest('.contrib-layout');
    if (layoutEl) {
      layoutEl.style.setProperty('--weeks', weeks);
      // Compute cell size so weeks fit within the chart width
      const chartEl = container.closest('.contrib-chart');
      if (chartEl) {
        const chartWidth = chartEl.getBoundingClientRect().width;
        const cs = getComputedStyle(layoutEl);
        const gapStr = (cs.getPropertyValue('--gap') || '2px').trim();
        const gapPx = parseFloat(gapStr) || 2;
        const raw = (chartWidth - (weeks - 1) * gapPx) / weeks;
        const cellPx = Math.max(6, Math.floor(raw)); // enforce a sane minimum
        layoutEl.style.setProperty('--cell', `${cellPx}px`);
      }
    }

    // Render month labels (Jan..Dec) aligned to the week column containing the 1st of each month
    if (monthsEl) {
      monthsEl.innerHTML = '';
      // Make month-label grid match week columns exactly
      monthsEl.style.gridTemplateColumns = `repeat(${weeks}, var(--cell))`;
      // Ensure same gap as grid
      const layoutStyles = getComputedStyle(layoutEl || monthsEl);
      const gapVal = layoutStyles.getPropertyValue('--gap') || '2px';
      monthsEl.style.gap = gapVal;
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const startYear = start.getFullYear();
      const msInDayLocal = msInDay;
      for (let m = 0; m < 12; m++) {
        const firstOfMonth = new Date(startYear, m, 1);
        const anchor = new Date(firstOfMonth);
        while (anchor.getDay() !== 0) { anchor.setDate(anchor.getDate() - 1); }
        const diffDays = Math.floor((anchor - first) / msInDayLocal);
        const colIndex = Math.floor(diffDays / 7) + 1; // 1-based grid column
        if (colIndex >= 1 && colIndex <= weeks) {
          const label = document.createElement('div');
          label.className = 'contrib-month-label';
          label.style.gridColumnStart = String(colIndex);
          label.textContent = monthNames[m];
          monthsEl.appendChild(label);
        }
      }
    }

    container.appendChild(grid);
  }

  async function fetchData(employeeId){
    const today = new Date();
    const year = today.getFullYear();
    const start = new Date(year, 0, 1); // Jan 1
    const end = new Date(year, 11, 31); // Dec 31
    const fmt = (d)=> d.toISOString().slice(0,10);
    const endpointEl = document.getElementById('contrib-endpoint');
    const baseUrl = endpointEl ? endpointEl.value : route(`employees/${employeeId}/contributions`);
    const sep = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${sep}start=${fmt(start)}&end=${fmt(end)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
    if (!res.ok) throw new Error('Failed to fetch contributions');
    const json = await res.json();
    if (json && json.data) return json.data; else return { start: fmt(start), end: fmt(end), days: [], max: 0 };
  }

  btn.addEventListener('click', async function(){
    const modal = ensureModal();
    if (!modal) return;
    const employeeId = getEmployeeId();
    if (!employeeId) {
      console.warn('No employee_id on page');
      modal.show();
      return;
    }

    const grid = document.getElementById('contributionsGrid');
    if (grid) grid.innerHTML = '<div class="text-center w-100 py-3"><div class="spinner-border" role="status"></div></div>';

    modal.show();

    try {
      const data = await fetchData(employeeId);
      if (grid) renderGrid(grid, data);
      // Recompute on resize while modal is open
      const onResize = () => {
        const layoutEl = document.querySelector('#contributionsGrid')?.closest('.contrib-layout');
        const chartEl = document.querySelector('#contributionsGrid')?.closest('.contrib-chart');
        if (!layoutEl || !chartEl) return;
        const weeksVar = parseInt(getComputedStyle(layoutEl).getPropertyValue('--weeks')) || 53;
        const chartWidth = chartEl.getBoundingClientRect().width;
        const cs = getComputedStyle(layoutEl);
        const gapStr = (cs.getPropertyValue('--gap') || '2px').trim();
        const gapPx = parseFloat(gapStr) || 2;
        const raw = (chartWidth - (weeksVar - 1) * gapPx) / weeksVar;
        const cellPx = Math.max(6, Math.floor(raw));
        layoutEl.style.setProperty('--cell', `${cellPx}px`);
      };
      window.addEventListener('resize', onResize);
      contributionsModalEl.addEventListener('hidden.bs.modal', () => {
        window.removeEventListener('resize', onResize);
      }, { once: true });
      // Trigger once after render for correct initial sizing
      setTimeout(() => onResize(), 0);
    } catch (e) {
      if (grid) grid.innerHTML = '<div class="text-danger">Failed to load contributions.</div>';
    }
  });
})();
