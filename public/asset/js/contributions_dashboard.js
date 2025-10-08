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
    // Basic helper to build absolute path; assumes app is at root
    return path;
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

    const start = new Date(data.start + 'T00:00:00');
    const end = new Date(data.end + 'T00:00:00');

    // Build a map date->count
    const map = new Map();
    data.days.forEach(d => { map.set(d.date, d.count); });

    // Find grid dimensions
    // We'll start on the Sunday on/before start
    const first = new Date(start);
    while (first.getDay() !== 0) { first.setDate(first.getDate() - 1); }

    // Build columns week by week until end
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridAutoFlow = 'column';
    grid.style.gridTemplateRows = 'repeat(7, 12px)';
    grid.style.gridAutoColumns = '12px';
    grid.style.gap = '3px';

  const tooltip = document.createElement('div');
  tooltip.className = 'contrib-tooltip';
    document.body.appendChild(tooltip);

    function showTip(e, text){
      tooltip.textContent = text;
      tooltip.style.left = (e.clientX + 10) + 'px';
      tooltip.style.top = (e.clientY + 10) + 'px';
      tooltip.style.display = 'block';
    }
    function hideTip(){ tooltip.style.display = 'none'; }

    let cursor = new Date(first);
    const msInDay = 86400000;
    while (cursor <= end) {
      // For each day, create a square
      const dstr = cursor.toISOString().slice(0,10);
      const count = map.get(dstr) || 0;
  const square = document.createElement('div');
  square.className = `contrib-square ${levelClassForCount(count)}`;
      square.title = `${count} completed on ${dstr}`;
      square.setAttribute('aria-label', square.title);
      square.addEventListener('mousemove', (e)=>showTip(e, square.title));
      square.addEventListener('mouseleave', hideTip);

      // position in grid by day of week
      const row = cursor.getDay(); // 0..6
      square.style.gridRowStart = String(row+1);
      grid.appendChild(square);

      cursor = new Date(cursor.getTime() + msInDay);
      // new column starts automatically due to grid-auto-flow: column
    }

    container.appendChild(grid);
  }

  async function fetchData(employeeId){
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 364);
    const fmt = (d)=> d.toISOString().slice(0,10);
    const url = route(`/employees/${employeeId}/contributions?start=${fmt(start)}&end=${fmt(end)}`);
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
    } catch (e) {
      if (grid) grid.innerHTML = '<div class="text-danger">Failed to load contributions.</div>';
    }
  });
})();
