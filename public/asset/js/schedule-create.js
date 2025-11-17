document.addEventListener('DOMContentLoaded', () => {
    const appUrl = document.querySelector('meta[name="app-url"]')?.content?.replace(/\/+$/,'') || window.location.origin;
    const form = document.getElementById('scheduleCreateForm');
    const loader = document.getElementById('scheduleCreateLoader');

    // Gunakan gaya Settings (showAlertMsg di office.js). Mapping type bootstrap -> settings.
    function showScheduleAlert(message, type='success', delayMs=2500){
        const mapped = (function(t){
            if(t==='danger') return 'error';
            if(['success','warning','error','light'].includes(t)) return t;
            return 'light';
        })(type||'success');
        if (typeof window.showAlertMsg === 'function') {
            window.showAlertMsg(String(message||''), mapped, delayMs);
        } else {
            // Fallback: simple alert (should rarely happen since layout includes office.js)
            try { alert((message||'').replace(/<[^>]+>/g,'')); } catch(e) {}
        }
    }

    function setupImageInput(id,labelId,clearId){
        const input = document.getElementById(id), label = document.getElementById(labelId), clearBtn = document.getElementById(clearId);
        if(!input||!label||!clearBtn) return;
        input.addEventListener('change', ()=>{
            if(input.files && input.files[0]){
                const r = new FileReader();
                r.onload = e => { label.style.backgroundImage = `url('${e.target.result}')`; label.classList.add('has-image'); clearBtn.classList.remove('d-none'); };
                r.readAsDataURL(input.files[0]);
            }
        });
    clearBtn.addEventListener('click', (e)=>{ e.preventDefault(); input.value=''; label.style.backgroundImage = ''; label.classList.remove('has-image'); clearBtn.classList.add('d-none'); });
    }
    setupImageInput('schedule_image','scheduleImageLabel','scheduleImageClearBtn');

    // Delegated event handler for add/remove reference file buttons in add schedule modal
    document.addEventListener('click', function(e) {
        // Handle add reference file button
        if (e.target.closest('.add-ref-file')) {
            const btn = e.target.closest('.add-ref-file');
            const container = document.getElementById('schedule_reference_files_container');
            if (container) {
                const newGroup = document.createElement('div');
                newGroup.className = 'input-group mb-2';
                newGroup.innerHTML = `
                    <input type="file" name="reference_file[]" class="form-control input-text" 
                        accept="image/*,.csv,.pdf,.doc,.docx,.xls,.xlsx,.zip">
                    <button type="button" class="btn btn-submit-black btn-remove-file remove-ref-file">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                `;
                container.appendChild(newGroup);
            }
        }
        
        // Handle remove reference file button
        if (e.target.closest('.remove-ref-file')) {
            const btn = e.target.closest('.remove-ref-file');
            const inputGroup = btn.closest('.input-group');
            const container = document.getElementById('schedule_reference_files_container');
            if (inputGroup && container && container.querySelectorAll('.input-group').length > 1) {
                inputGroup.remove();
            }
        }
    });

    // Clone logic from task.js simplified for executors
    (function executorPicker(){
        const input = document.getElementById('schedule_executor_input');
        const dropdown = document.getElementById('schedule_executor_dropdown');
        const selectedContainer = document.getElementById('schedule_selected_executors');
        const hidden = document.getElementById('schedule_executors');
        if(!input||!dropdown||!selectedContainer||!hidden) return;

        let employees = [], filtered = [], selected = [];

        const EMP_CACHE_TTL_MS = 5*60*1000;
        const empCache = (window.__empExecCache = window.__empExecCache || { map:new Map(), inFlight:new Map() });

        function fetchEmployeesCached(q=''){
            const key = String(q||'').trim().toLowerCase();
            const now = Date.now();
            const hit = empCache.map.get(key);
            if(hit && (now - hit.t) < EMP_CACHE_TTL_MS) return Promise.resolve(hit.v);
            if(empCache.inFlight.has(key)) return empCache.inFlight.get(key);
            const p = fetch(appUrl + '/task/employees-for-executor?q='+encodeURIComponent(key))
                .then(r=>r.ok?r.json():Promise.reject(r))
                .then(d=>{ empCache.map.set(key,{v:d,t:Date.now()}); empCache.inFlight.delete(key); return d; })
                .catch(e=>{ empCache.inFlight.delete(key); throw e; });
            empCache.inFlight.set(key, p);
            return p;
        }

        function buildPhotoUrl(userPhoto){
            if(!userPhoto) return appUrl + '/asset/img/avatar.png';
            if(/^https?:/i.test(userPhoto)) return userPhoto;
            if(userPhoto.startsWith('/')) return appUrl+userPhoto;
            if(userPhoto.startsWith('file/')||userPhoto.startsWith('asset/'))
                return appUrl+'/'+userPhoto;
            return appUrl + '/file/profile_picture/' + userPhoto;
        }

        function fetchAllEmployeesIfNeeded() {
            if (employees && employees.length > 0) return Promise.resolve(employees);
            return fetchEmployeesCached('').then(d => {
                employees = (d && (d.data||d)) || [];
                employees = employees.filter(emp => String(emp.user_type || '').toUpperCase() !== 'ADMINISTRATOR');
                filtered = employees;
                return employees;
            }).catch(() => { showScheduleAlert('Failed load employees','danger'); return []; });
        }

        function renderDropdown(){
            dropdown.innerHTML = filtered.map(emp=>{
                const checked = selected.some(s=>s.id===emp.id);
                const photo=buildPhotoUrl(emp.user_photo);
                return `<label class='dropdown-item d-flex align-items-center justify-content-between'>
                    <div class='d-flex align-items-center'>
                        <img src='${photo}' class='rounded-circle me-2' style='width:30px;height:30px;object-fit:cover;'>
                        <div class='d-flex flex-column'>
                            <span class='executor-name'>${emp.name}</span>
                            <small class='text-muted executor-division'>${emp.division || emp.division_name || ''}</small>
                        </div>
                    </div>
                    <input type='checkbox' data-id='${emp.id}' ${checked?'checked':''}>
                </label>`;
            }).join('');

            dropdown.querySelectorAll('input[type=checkbox]').forEach(cb=>{
                cb.addEventListener('change', function(){
                    const id=parseInt(this.getAttribute('data-id'));
                    if(this.checked){
                        if(!selected.some(s=>s.id===id)){
                            const emp=employees.find(e=>e.id===id);
                            selected.push({
                                id,
                                name: emp.name,
                                user_photo: emp.user_photo,
                                division: emp.division || emp.division_name || ''
                            });
                        }
                    } else {
                        selected = selected.filter(s=>s.id!==id);
                    }
                    renderSelected();
                    updateHidden();
                    renderDropdown();
                });
            });
        }

        function renderSelected(){
            selectedContainer.innerHTML='';
            if(selected.length === 0){
                selectedContainer.style.display = "none";
                return;
            }
            selectedContainer.style.display = "flex";
            selected.forEach(emp=>{
                const photo=buildPhotoUrl(emp.user_photo);
                const badge=document.createElement('span');
                badge.className='badge fw-normal bg-light d-inline-flex align-items-center me-2 mb-2';

                const img = document.createElement('img');
                img.src = photo;
                img.alt = emp.name || '';
                img.className = 'rounded-circle me-2';
                img.style.width='24px';
                img.style.height='24px';
                img.style.objectFit='cover';

                const nameCol = document.createElement("div");
                nameCol.className = "d-flex flex-column";

                const nameSpan = document.createElement('span');
                nameSpan.textContent = emp.name || "";
                nameSpan.style.marginBottom = "5px"

                const divisionSmall = document.createElement('small');
                divisionSmall.className = "text-muted executor-division";
                divisionSmall.textContent = emp.division || "";

                nameCol.appendChild(nameSpan);
                nameCol.appendChild(divisionSmall);

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-close btn-sm ms-2';
                removeBtn.setAttribute('aria-label', 'Remove');
                removeBtn.addEventListener('click', ()=>{
                    selected = selected.filter(s=>s.id!==emp.id);
                    renderSelected();
                    updateHidden();
                    renderDropdown();
                });

                badge.appendChild(img);
                badge.appendChild(nameCol);
                badge.appendChild(removeBtn);
                selectedContainer.appendChild(badge);
            });
        }

        function updateHidden(){ hidden.value = JSON.stringify(selected.map(s=>s.id)); }

        input.addEventListener('input', function(){
            fetchAllEmployeesIfNeeded().then(()=> {
                filterEmployeesByName(this.value);
                dropdown.style.display = "block";
            });
        });
        input.addEventListener('focus', function(){
            fetchAllEmployeesIfNeeded().then(()=> {
                filterEmployeesByName(this.value);
                dropdown.style.display = "block";
            });
        });
        document.addEventListener('click', e=>{
            if(!dropdown.contains(e.target) && e.target!==input){
                dropdown.style.display='none';
            }
        });

        function filterEmployeesByName(q) {
            const val = String(q || '').trim().toLowerCase();
            if (!val) filtered = employees;
            else filtered = employees.filter(emp => (emp.name || '').toLowerCase().includes(val));
            renderDropdown();
        }

        // API buat luar
        window.__scheduleExecPicker = {
            clear: function(){
                selected = [];
                renderSelected();
                updateHidden();
                dropdown.innerHTML = '';
            },
            set: function(arr){
                fetchAllEmployeesIfNeeded().then(()=>{
                    if(!Array.isArray(arr)) return;
                    selected = arr.map(a=>{
                        const emp = employees.find(e=>e.id===a.id);
                        return {
                            id: a.id,
                            name: a.name || a.full_name || (emp?emp.name:''),
                            user_photo: a.user_photo || (emp?emp.user_photo:''),
                            division: emp? (emp.division || emp.division_name || '') : ''
                        };
                    });
                    renderSelected();  // <== ini langsung munculin badge
                    updateHidden();
                    renderDropdown();
                });
            }
        };

    // alias for create-picker only (do not override edit picker)
    window.setSelectedExecutorsAdd = execs => window.__scheduleExecPicker.set(execs||[]);

    })();

    // Recurrence toggle logic (reuse simplified logic from task.js schedule section)
    (function recurrenceToggles(){
        const typeSel = document.getElementById('schedule_recurrence_type');
        const editTypeSel = document.getElementById('edit_schedule_recurrence_type');
        const weekly = document.getElementById('schedule_weekly_opts');
        const monthly = document.getElementById('schedule_monthly_opts');
        const includeWeekendDiv = document.getElementById('schedule_include_weekend_div');
        const editIncludeWeekendDiv = document.getElementById('edit_schedule_include_weekend_div');
        const dateOpts = document.getElementById('schedule_date_opts');
        const startAtDiv = document.getElementById('schedule_start_at_div');
        const monthlyDateInput = document.getElementById('schedule_monthly_date');
        const monthlyDayHidden = document.getElementById('schedule_recurrence_day_of_month');

        function updateWeeklyStartDate(){
            const weeklyDay = document.getElementById('schedule_recurrence_day_of_week');
            const startAt = document.getElementById('schedule_start_at');
            if(!weeklyDay || !startAt || typeSel?.value !== 'weekly') return;
            const selectedDow = parseInt(weeklyDay.value);
            if(isNaN(selectedDow)) return;
            const today = new Date();
            const currentDow = today.getDay();
            // If the selected day is the same as today, the requirement is to set
            // start_at to the same weekday in the next week (not today). Therefore
            // compute daysToAdd so that when selectedDow === currentDow we add 7.
            let daysToAdd = selectedDow - currentDow;
            if(daysToAdd <= 0) daysToAdd += 7; // <=0 ensures today maps to next week
            const newDate = new Date(today);
            newDate.setDate(today.getDate() + daysToAdd);
            startAt.value = newDate.toISOString().split('T')[0];
            // small debug hook (silent in production unless console is open)
            if(window.__scheduleDebug) console.log('updateWeeklyStartDate:', { selectedDow, currentDow, daysToAdd, startAt: startAt.value });
        }

        function sync(){
            const v = typeSel?.value;

            // toggle weekly & monthly section (pastikan elemennya ada)
            if(weekly) weekly.classList.toggle('d-none', v !== 'weekly');
            if(monthly) monthly.classList.toggle('d-none', v !== 'monthly');

            // date options: show for daily, weekly, monthly
            if(dateOpts){
                if(v === 'daily' || v === 'weekly' || v === 'monthly'){
                    dateOpts.classList.remove('d-none');
                } else {
                    dateOpts.classList.add('d-none');
                }
            }

            // include_weekend removed from UI

            // show weekday picker for daily recurrence
            const dailyWeekdays = document.getElementById('schedule_daily_weekdays');
            if(dailyWeekdays){ dailyWeekdays.classList.toggle('d-none', v !== 'daily'); }

            // If user chose 'daily' and no weekdays have been selected yet,
            // default to selecting all weekdays so the UI shows every day selected.
            if (v === 'daily') {
                try {
                    const hiddenDays = document.getElementById('schedule_recurrence_days_of_week');
                    const buttonsContainer = document.getElementById('schedule_daily_weekdays_buttons');
                    if (hiddenDays && buttonsContainer) {
                        let curr = [];
                        try { curr = JSON.parse(hiddenDays.value || '[]'); } catch(e) { curr = []; }
                        if (!Array.isArray(curr) || curr.length === 0) {
                            const all = [0,1,2,3,4,5,6];
                            hiddenDays.value = JSON.stringify(all);
                            // update visual state of buttons
                            buttonsContainer.querySelectorAll('.weekday-btn').forEach(btn => {
                                const d = parseInt(btn.getAttribute('data-day'));
                                if (all.includes(d)) {
                                    btn.classList.add('weekday-selected');
                                    btn.classList.add('active');
                                    btn.classList.remove('btn-outline-secondary');
                                    btn.setAttribute('aria-pressed', 'true');
                                } else {
                                    btn.classList.remove('weekday-selected');
                                    btn.classList.remove('active');
                                    btn.classList.add('btn-outline-secondary');
                                    btn.setAttribute('aria-pressed', 'false');
                                }
                            });
                        }
                    }
                } catch (_) {}
            }

            // show start_at for daily, weekly, monthly. (User asked: daily should allow choosing start date)
            if(startAtDiv){
                // Show start_at for daily, weekly, monthly so user can pick which date the recurrence starts.
                // Keep it hidden for other/unset recurrence types.
                startAtDiv.classList.toggle('d-none', !(v === 'daily' || v === 'weekly' || v === 'monthly'));
            }

            // ensure both Start At and End At use equal width when visible
            const startAtDivElem = document.getElementById('schedule_start_at_div');
            const endAtDivElem = document.getElementById('schedule_end_at_div') || document.querySelector('#schedule_date_opts .d-flex > div:nth-child(2)');
            if(startAtDivElem && endAtDivElem){
                if(v === 'daily' || v === 'weekly' || v === 'monthly'){
                    startAtDivElem.classList.remove('w-100'); startAtDivElem.classList.add('w-50');
                    endAtDivElem.classList.remove('w-100'); endAtDivElem.classList.add('w-50');
                } else {
                    // default: end at takes full width
                    startAtDivElem.classList.remove('w-50'); startAtDivElem.classList.add('w-100');
                    endAtDivElem.classList.remove('w-50'); endAtDivElem.classList.add('w-100');
                }
            }

            // required rules
            const startAt = document.getElementById('schedule_start_at');
            if(startAt){
                // start_at is required only for weekly and monthly in create modal. For daily, we don't require a date.
                startAt.required = (v === 'weekly' || v === 'monthly');
            }
            const endAt = document.getElementById('schedule_end_at');
            if(endAt){
                endAt.required = false;
            }

            // khusus weekly
            const weeklyDay = document.getElementById('schedule_recurrence_day_of_week');
            if(weeklyDay){
                weeklyDay.required = (v === 'weekly');
                if(v === 'weekly'){
                    updateWeeklyStartDate();
                }
            }

            // khusus monthly
            if(v === 'monthly' && monthlyDayHidden){
                if(!monthlyDayHidden.value){
                    const today = new Date();
                    monthlyDayHidden.value = today.getDate();
                }
                if(monthlyDateInput && !monthlyDateInput.value){
                    const today = new Date();
                    const full = today.toLocaleDateString(undefined, {
                        weekday:'long',
                        day:'numeric',
                        month:'long',
                        year:'numeric'
                    });
                    monthlyDateInput.value = full;
                }
            }
        }

        if(typeSel){
            typeSel.addEventListener('change', sync);
            sync();
        }

        if(editTypeSel){ editTypeSel.addEventListener('change', sync); }

        // Add listener for weekly day change
        const weeklyDay = document.getElementById('schedule_recurrence_day_of_week');
        if(weeklyDay){
            weeklyDay.addEventListener('change', updateWeeklyStartDate);
        }
    })();

    // Load projects for select
    (function loadProjects() {
        const input = document.getElementById("schedule_project_context_id");
        const dropdown = document.getElementById("schedule_project_dropdown");
        const selectedContainer = document.getElementById("schedule_selected_project");
        const hiddenInput = document.getElementById("schedule_project_id");

        if (!input || !dropdown || !selectedContainer || !hiddenInput) return;

        let projects = [];

        function renderDropdown(filter = "") {
            dropdown.innerHTML = "";
            let filtered = projects.filter((p) =>
                p.title.toLowerCase().includes(filter.toLowerCase())
            );

            filtered.forEach((p) => {
                let avatarHtml = p.image
                    ? `<img src="${appUrl}/file/project/${p.image}" width="24" height="24" style="object-fit:cover;border-radius:50%;"/>`
                    : `<div class="rounded-circle d-flex align-items-center justify-content-center"
                            style="width:24px;height:24px;background:#6A5AE0;color:#fff;font-size:12px;">
                            ${p.title.charAt(0).toUpperCase()}
                    </div>`;

                const item = document.createElement("div");
                item.className = "dropdown-item d-flex align-items-center gap-2";
                item.innerHTML = `${avatarHtml}<span>${p.title}</span>`;
                item.addEventListener("click", () => {
                    hiddenInput.value = p.id;
                    input.value = p.title;
                    dropdown.style.display = "none";
                    showSelectedProject(p);
                });
                dropdown.appendChild(item);
            });

            dropdown.style.display = filtered.length ? "block" : "none";
        }

        function showSelectedProject(p) {
            selectedContainer.innerHTML = `
                <div class="d-flex align-items-center gap-2 p-2 rounded bg-light selected-project">
                    ${
                        p.image
                            ? `<img src="${appUrl}/file/project/${p.image}" width="28" height="28" style="object-fit:cover;border-radius:50%;">`
                            : `<div class="rounded-circle d-flex align-items-center justify-content-center"
                                    style="width:28px;height:28px;background:#6A5AE0;color:#fff;font-size:14px;">
                                    ${p.title.charAt(0).toUpperCase()}
                            </div>`
                    }
                    <span class="flex-grow-1">${p.title}</span>
                    <button type="button" class="btn btn-sm btn-remove-project" style="line-height:1">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;

            selectedContainer
                .querySelector(".btn-remove-project")
                .addEventListener("click", () => {
                    hiddenInput.value = "";
                    input.value = "";
                    selectedContainer.innerHTML = "";
                    // Clear any selected parent task for schedule when project is removed
                    try {
                        const pinput = document.getElementById('schedule_parent_input'); if(pinput) pinput.value = '';
                        const phidden = document.getElementById('schedule_parent_id'); if(phidden) phidden.value = '';
                        const selContainer = document.getElementById('schedule_selected_parent'); if(selContainer) selContainer.innerHTML = '';
                    } catch(_){}
                });
            // Load tasks for this project into the schedule parent selector (prefix 'schedule')
            try { loadRelatedTasks(p.id, 'schedule', null); } catch(_) {}
        }

    fetch(appUrl + "/project/index")
            .then((res) => res.json())
            .then((payload) => {
                projects = (payload.data || [])
                    .map(p => ({
                        id: p.id,
                        title: p.title,
                        image: p.image || "",
                        project_type: p.project_type || 'public'
                    }));
            })
            .catch((err) => console.error("Error loading projects:", err));

        input.addEventListener("input", () => renderDropdown(input.value));
        input.addEventListener("focus", () => renderDropdown(input.value));

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && e.target !== input) {
                dropdown.style.display = "none";
            }
        });
    })();

    // Load divisions and wire division -> executor behavior (mirror task.js)
    (function loadDivisionsAndWire(){
        // Create modal division
        const addDivSel = document.getElementById('schedule_division_id');
        const addDivDropdown = document.getElementById('schedule_division_dropdown');
        const addDivActivator = document.getElementById('schedule_division_activator');

        // Edit modal division
        const editDivSel = document.getElementById('edit_schedule_division_id');
        const editDivDropdown = document.getElementById('edit_schedule_division_dropdown');
        const editDivActivator = document.getElementById('edit_schedule_division_activator');

        function populate(sel){
            if(!sel) return;
            // Try to scope divisions to logged-in employee's department when available
            var deptId = null;
            try {
                var modal = document.getElementById('scheduleCreateModal') || document.getElementById('scheduleEditModal');
                if(modal && modal.dataset && modal.dataset.employeeDepartmentId) deptId = String(modal.dataset.employeeDepartmentId || '').trim();
            } catch(e) { deptId = null; }

            var tryLoad = function(url){
                return fetch(url).then(r=> r.ok? r.json(): Promise.reject('fail'));
            };

            var buildAndSet = function(d){
                if(!d||!d.data) return;
                let opts = '<option value="">Select Division</option>';
                d.data.forEach(function(div){ opts += `<option value="${div.id}" data-name="${(div.name_division||div.name||'').trim()}">${(div.name_division||div.name||'').trim()}</option>`; });
                sel.innerHTML = opts;
            };

            if(deptId){
                tryLoad(appUrl + '/divisions-for-projects?department_id=' + encodeURIComponent(deptId))
                    .then(buildAndSet)
                    .catch(function(){
                        // fallback to unfiltered list on error
                        tryLoad(appUrl + '/divisions-for-projects')
                            .then(buildAndSet)
                            .catch(function(){ /* ignore final failure */ });
                    });
            } else {
                // no department id available; load unfiltered list
                tryLoad(appUrl + '/divisions-for-projects')
                    .then(buildAndSet)
                    .catch(function(){ /* ignore */ });
            }
        }

        populate(addDivSel); populate(editDivSel);

        function wireDivision(sel, dropdown, activator, isEdit){
            if(!sel) return;
            // When division changes, fetch employees-for-projects and set selected executors
            sel.addEventListener('change', function(){
                const val = this.value;
                const selectedName = (this.selectedOptions && this.selectedOptions[0] && this.selectedOptions[0].dataset && this.selectedOptions[0].dataset.name) ? this.selectedOptions[0].dataset.name : '';
                if(!val){
                    try { if (isEdit) window.setSelectedExecutorsEdit?.([]); else window.setSelectedExecutorsAdd?.([]); } catch(_){}
                    return;
                }
                fetch(appUrl + '/employees-for-projects?executor_only=1')
                    .then(r=> r.ok? r.json(): Promise.reject('fail'))
                    .then(res=>{
                        const arr = (res && res.data) || [];
                        const nameLower = String(selectedName || '').toLowerCase();
                        const filteredByName = arr.filter(emp => String(emp.division || '').toLowerCase() === nameLower);
                        const filteredById = arr.filter(emp => String(emp.division_id || '').toLowerCase() === String(val).toLowerCase());
                        const final = filteredByName.length ? filteredByName : (filteredById.length ? filteredById : []);
                        if(!final.length){ try { showScheduleAlert('No employees found for selected division.','warning'); } catch(_){}; return; }
                        // adapt shape to what executor picker expects: objects with id, name, user_photo
                        const mapped = final.map(e => ({ id: e.id, name: e.name || e.full_name || '', user_photo: e.user_photo || e.profile_picture || '' }));
                        try { if(isEdit){ window.setSelectedExecutorsEdit?.(mapped); } else { window.setSelectedExecutorsAdd?.(mapped); } } catch(_){}
                    }).catch(()=>{ try { showScheduleAlert('Failed to load employees for division.','warning'); } catch(_){} });
            });

            // Custom dropup rendering similar to task.js
            if(dropdown){
                function escapeHtml(str){ return String(str||'').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
                function render(){
                    const opts = Array.from(sel.options || []);
                    if(!opts.length){ dropdown.innerHTML = '<div class="division-item disabled">No divisions</div>'; dropdown.style.display = 'block'; return; }
                    const html = opts.map(o=> `<div class="division-item" data-value="${o.value}">${escapeHtml(o.textContent||o.innerText||'')}</div>`).join('');
                    dropdown.innerHTML = html; dropdown.style.display = 'block';
                    dropdown.querySelectorAll('.division-item').forEach(el=> el.addEventListener('click', function(){ const v = this.getAttribute('data-value'); try{ sel.value = v; sel.dispatchEvent(new Event('change',{ bubbles:true })); }catch(_){} dropdown.style.display='none'; }));
                }
                sel.addEventListener('focus', render);
                const act = activator || sel;
                if(act){ act.addEventListener('click', function(e){ try{ e.preventDefault(); e.stopPropagation(); } catch(_){} render(); try{ sel.focus(); } catch(_){} }); }
                sel.addEventListener('keydown', function(e){ const k = e.key || ''; if(k===' '||k==='Spacebar'||k==='ArrowDown'||k==='ArrowUp'){ try{ e.preventDefault(); render(); } catch(_){} } });
                document.addEventListener('click', function(e){ if(!sel.contains(e.target) && !dropdown.contains(e.target)){ dropdown.style.display = 'none'; } });
            }
        }

        try{ wireDivision(addDivSel, addDivDropdown, addDivActivator, false); } catch(e){}
        try{ wireDivision(editDivSel, editDivDropdown, editDivActivator, true); } catch(e){}
    })();

    // Reference URL dynamic rows (simple) - reuse global logic in task.js if loaded; else lightweight here
    document.addEventListener('click', function(e){
        if(e.target.closest('.add-ref-url')){ const container=document.getElementById('schedule_reference_urls_container'); const row=document.createElement('div'); row.className='input-group'; row.innerHTML = `<input type='url' class='form-control input-text' name='reference_urls[]' placeholder='https://example.com'><button type='button' class='btn btn-remove-url remove-ref-url'><span class='material-symbols-outlined'>close</span></button>`; container.appendChild(row); }
        if(e.target.closest('.remove-ref-url')){ const row=e.target.closest('.input-group'); if(row) row.remove(); }
    });

    function resetCreateScheduleForm(){
        try {
            // Reset form fields
            if (form) form.reset();
            // Clear selected files & preview
            selectedFiles = [];
            displaySelectedFiles();
            // Reset image display
            try {
                const lbl = document.getElementById('scheduleImageLabel');
                const clr = document.getElementById('scheduleImageClearBtn');
                if (lbl) { lbl.style.backgroundImage = ''; lbl.classList.remove('has-image'); }
                if (clr) clr.classList.add('d-none');
            } catch(_) {}
            // Reset executors
            try {
                const selectedBox = document.getElementById('schedule_selected_executors');
                const hidden = document.getElementById('schedule_executors');
                const dropdown = document.getElementById('schedule_executor_dropdown');
                if (window.__scheduleExecPicker && typeof window.__scheduleExecPicker.clear === 'function') {
                    window.__scheduleExecPicker.clear();
                }
                if (selectedBox) selectedBox.innerHTML = '';
                if (hidden) hidden.value = '[]';
                if (dropdown) dropdown.innerHTML = '';
            } catch(_) {}
            // Reset reference URLs container to one empty row
            try {
                const container = document.getElementById('schedule_reference_urls_container');
                if (container) {
                    container.innerHTML = "<div class=\"input-group\"><input type='url' class='form-control input-text' name='reference_urls[]' placeholder='https://example.com'><button type='button' class='btn btn-submit-black add-ref-url' aria-label='Add URL'><span class='material-symbols-outlined'>add</span></button></div>";
                }
            } catch(_) {}
            // Reset recurrence toggles - set to default and trigger change to re-sync UI
            try {
                const typeSel = document.getElementById('schedule_recurrence_type');
                if (typeSel) {
                    typeSel.value = '';
                    // trigger change to let recurrenceToggles sync UI (if handler exists)
                    const ev = new Event('change', { bubbles: true });
                    typeSel.dispatchEvent(ev);
                }
                const monthlyDateInput = document.getElementById('schedule_monthly_date');
                const monthlyDayHidden = document.getElementById('schedule_recurrence_day_of_month');
                if (monthlyDateInput) {
                    const def = monthlyDateInput.getAttribute('data-initial-display');
                    monthlyDateInput.value = def || '';
                }
                if (monthlyDayHidden) monthlyDayHidden.value = (new Date()).getDate();
                // ensure start_at isn't required and cleared
                const startAt = document.getElementById('schedule_start_at');
                if (startAt) { startAt.required = false; startAt.value = '' }
                const weekly = document.getElementById('schedule_weekly_opts');
                if (weekly) weekly.classList.add('d-none');
                const monthly = document.getElementById('schedule_monthly_opts');
                if (monthly) monthly.classList.add('d-none');
                const dow = document.getElementById('schedule_recurrence_day_of_week');
                if (dow) dow.required = false;
            } catch(_) {}
            // Reset project selection to default (No Project)
            try {
                const sel = document.getElementById('schedule_project_id');
                if (sel) sel.value = '';
            } catch(_) {}
        } catch(e) {}
    }

    // Reset the form when modal is hidden (closed), so next open is clean
    try {
        const createModalEl = document.getElementById('scheduleCreateModal');
        if (createModalEl) {
            createModalEl.addEventListener('hidden.bs.modal', resetCreateScheduleForm);
        }
    } catch(_) {}

    // If user picks start_at first, update the day-of-week selection to match that date.
    // Use safe date parsing to avoid timezone shifts (parse components explicitly).
    function parseDateLocal(dateStr){
        if(!dateStr) return null;
        const parts = String(dateStr).split('-');
        if(parts.length !== 3) return null;
        const y = parseInt(parts[0],10), m = parseInt(parts[1],10), d = parseInt(parts[2],10);
        if(Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
        return new Date(y, m-1, d);
    }

    function syncWeeklyDayFromStart(startInputId, weeklySelectId){
        const startInput = document.getElementById(startInputId);
        const weeklySelect = document.getElementById(weeklySelectId);
        if(!startInput || !weeklySelect) return;
        startInput.addEventListener('change', function(){
            const val = this.value;
            const dt = parseDateLocal(val);
            if(!dt) return;
            const dow = dt.getDay(); // 0=Sun
            // Set weekly select value but do not dispatch change event so we don't trigger
            // updateWeeklyStartDate which would overwrite start_at based on selectedDow.
            try { weeklySelect.value = String(dow); } catch(e) {}
            // If recurrence type is weekly and UI is visible, ensure required and UI sync
            const typeSelEl = document.getElementById('schedule_recurrence_type');
            if(typeSelEl && typeSelEl.value === 'weekly'){
                // keep UI consistent; do not call updateWeeklyStartDate here (we preserve chosen start_at)
            }
        });
    }

    // Attach sync for create modal
    syncWeeklyDayFromStart('schedule_start_at','schedule_recurrence_day_of_week');
    // Attach sync for edit modal (if present)
    syncWeeklyDayFromStart('edit_schedule_start_at','edit_schedule_recurrence_day_of_week');

    // Weekday picker helpers for create modal
    (function setupDailyWeekdayPicker(){
        const container = document.getElementById('schedule_daily_weekdays_buttons');
        const hidden = document.getElementById('schedule_recurrence_days_of_week');
        if(!container || !hidden) return;
        function getSelected(){
            try{ return JSON.parse(hidden.value || '[]').map(d=>parseInt(d)); }catch(e){ return []; }
        }
        function setSelected(arr){
            try {
                const vals = Array.from(new Set((arr||[]).map(Number))).filter(n=>!Number.isNaN(n));
                hidden.value = JSON.stringify(vals);
            } catch(e){
                hidden.value = JSON.stringify([]);
            }
        }
        // initialize buttons
        container.querySelectorAll('.weekday-btn').forEach(btn=>{
            // ensure accessible pressed state
            btn.setAttribute('aria-pressed', 'false');
            btn.addEventListener('click', function(){
                const day = parseInt(this.getAttribute('data-day'));
                let sel = getSelected();
                if(sel.includes(day)){
                    // unselect
                    sel = sel.filter(s=>s!==day);
                    this.classList.remove('weekday-selected');
                    this.classList.remove('active');
                    this.classList.add('btn-outline-secondary');
                    this.setAttribute('aria-pressed','false');
                } else {
                    // select
                    sel.push(day);
                    this.classList.add('weekday-selected');
                    this.classList.add('active');
                    this.classList.remove('btn-outline-secondary');
                    this.setAttribute('aria-pressed','true');
                }
                setSelected(sel);
            });
        });

        // Initialize button states from hidden input
        (function initButtonsFromHidden(){
            const sel = getSelected();
            container.querySelectorAll('.weekday-btn').forEach(btn=>{
                const d = parseInt(btn.getAttribute('data-day'));
                if(sel.includes(d)){
                    btn.classList.add('weekday-selected');
                    btn.classList.add('active');
                    btn.classList.remove('btn-outline-secondary');
                    btn.setAttribute('aria-pressed','true');
                } else {
                    btn.classList.remove('weekday-selected');
                    btn.classList.remove('active');
                    btn.classList.add('btn-outline-secondary');
                    btn.setAttribute('aria-pressed','false');
                }
            });
        })();

        // expose for external resetting
        window.__scheduleDailyWeekdayPicker = { set: setSelected, get: getSelected };
    })();

    form.addEventListener('submit', e=>{
        e.preventDefault();
        if(!form.checkValidity()){ e.stopPropagation(); form.classList.add('was-validated'); return; }
        // include_weekend removed; weekend handling is driven by recurrence_days_of_week
        form.classList.remove('was-validated');
        if(loader) loader.classList.remove('d-none');
        const submitBtn = form.querySelector('button[type=submit]'); if(submitBtn) submitBtn.disabled=true;
        const fd = new FormData(form);
        // Ensure recurrence_days_of_week hidden field is serialized as JSON
        try {
            const hidden = document.getElementById('schedule_recurrence_days_of_week');
            if (hidden && !hidden.value) hidden.value = '[]';
        } catch(e) {}
        // Ensure parent_id is only sent when valid numeric
        try {
            const parentHidden = document.getElementById('schedule_parent_id');
            if (parentHidden) {
                const pv = parentHidden.value;
                if (pv && pv !== '' && pv !== 'null' && !isNaN(Number(pv))) {
                    fd.set('parent_id', String(Number(pv)));
                } else {
                    try { fd.delete('parent_id'); } catch(_) {}
                }
            }
        } catch(_) {}
        // Prefer due_in_days over due_date (no due_date field visible anyway)
        fetch(appUrl + '/schedules/create', { method:'POST', headers:{ 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }, body: fd })
            .then(r=> r.json().then(j=>({ok:r.ok, body:j})))
            .then(({ok, body})=>{ if(loader) loader.classList.add('d-none'); if(submitBtn) submitBtn.disabled=false; if(!ok || body.code!==200){ const msg = (body && (body.message || 'Failed to create schedule')) || 'Failed.'; showScheduleAlert(msg,'danger'); return; } showScheduleAlert(body.message || 'Schedule created successfully','success');
                // Reset all UI state then close modal and refresh list
                resetCreateScheduleForm();
                try { const modalEl = document.getElementById('scheduleCreateModal'); if (modalEl) { const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl); modalInstance.hide(); } } catch(_) {}
                try { if (typeof window.refreshScheduleList === 'function') { window.refreshScheduleList(); } else { if (typeof fetchScheduleData === 'function') fetchScheduleData(1, '', ''); } } catch(_) {}
            })
            .catch(()=>{ if(loader) loader.classList.add('d-none'); if(submitBtn) submitBtn.disabled=false; showScheduleAlert('Failed to create schedule','danger'); });
    });
});
