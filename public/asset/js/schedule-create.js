document.addEventListener('DOMContentLoaded', () => {
    const appUrl = document.querySelector('meta[name="app-url"]')?.content?.replace(/\/+$/,'') || window.location.origin;
    const form = document.getElementById('scheduleCreateForm');
    const loader = document.getElementById('scheduleCreateLoader');
    let selectedFiles = [];

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

    function displaySelectedFiles(){
        const preview = document.getElementById('schedule_reference_files_preview');
        if(!preview) return;
        preview.innerHTML='';

        if(selectedFiles.length === 0) return;

        const list = document.createElement('div');
        list.className = 'selected-files-list mt-2';

        selectedFiles.forEach((file, index)=>{
            const item = document.createElement('div');
            item.className = 'selected-file-item d-flex align-items-center justify-content-between mb-2 p-2 bg-light border rounded';

            const info = document.createElement('div');
            info.className = 'd-flex align-items-center flex-grow-1';

            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined me-2';
            icon.textContent = 'description';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'file-name';
            nameSpan.textContent = file.name;

            const size = document.createElement('small');
            size.className = 'text-muted ms-1';
            size.textContent = ` (${(file.size/1024/1024).toFixed(2)} MB)`;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-sm btn-outline-danger';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', ()=>{ selectedFiles.splice(index,1); displaySelectedFiles(); });

            info.appendChild(icon);
            info.appendChild(nameSpan);
            info.appendChild(size);
            item.appendChild(info);
            item.appendChild(removeBtn);
            list.appendChild(item);
        });

        preview.appendChild(list);
    }

    const refInput = document.getElementById('schedule_reference_files');
    if(refInput){
        refInput.addEventListener('change', e=>{ const files = Array.from(e.target.files||[]); selectedFiles = [...selectedFiles, ...files]; displaySelectedFiles(); refInput.value=''; });
    }

    // Clone logic from task.js simplified for executors
    (function executorPicker(){
        const input = document.getElementById('schedule_executor_input');
        const dropdown = document.getElementById('schedule_executor_dropdown');
        const selectedContainer = document.getElementById('schedule_selected_executors');
        const hidden = document.getElementById('schedule_executors');
        if(!input||!dropdown||!selectedContainer||!hidden) return;
        let employees = [], filtered = [], selected = [];
        function buildPhotoUrl(userPhoto){
            if(!userPhoto) return appUrl + '/asset/img/profile_picture/default.png';
            if(/^https?:/i.test(userPhoto)) return userPhoto; if(userPhoto.startsWith('/')) return appUrl+userPhoto; if(userPhoto.startsWith('file/')||userPhoto.startsWith('asset/')) return appUrl+'/'+userPhoto; return appUrl + '/file/profile_picture/' + userPhoto;
        }
        function fetchEmployees(q=''){
            fetch(appUrl + '/task/employees-for-executor?q='+encodeURIComponent(q))
                .then(r=>r.json()).then(d=>{ employees = d.data||[]; filtered=employees; renderDropdown(); })
                .catch(()=>showScheduleAlert('Failed load employees','danger'));
        }
        function renderDropdown(){
            if(filtered.length===0){ dropdown.innerHTML='<div class="dropdown-item disabled">No employees found</div>'; dropdown.style.display='block'; return; }
            dropdown.innerHTML = filtered.map(emp=>{ const checked = selected.some(s=>s.id===emp.id); const photo=buildPhotoUrl(emp.user_photo); return `<label class='dropdown-item d-flex align-items-center justify-content-between'><div class='d-flex align-items-center'><img src='${photo}' class='rounded-circle me-2' style='width:30px;height:30px;object-fit:cover;'>${emp.name}</div><input type='checkbox' data-id='${emp.id}' ${checked?'checked':''}></label>`; }).join('');
            dropdown.style.display='block';
            dropdown.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.addEventListener('change', function(){ const id=parseInt(this.getAttribute('data-id')); if(this.checked){ if(!selected.some(s=>s.id===id)){ const emp=employees.find(e=>e.id===id); selected.push({id, name:emp.name, user_photo:emp.user_photo}); } } else { selected = selected.filter(s=>s.id!==id); } renderSelected(); renderDropdown(); updateHidden(); }));
        }
        function renderSelected(){ selectedContainer.innerHTML=''; selected.forEach(emp=>{ const photo=buildPhotoUrl(emp.user_photo); const badge=document.createElement('span'); badge.className='badge bg-primary d-inline-flex align-items-center me-2 mb-2'; badge.innerHTML=`<img src='${photo}' class='rounded-circle me-2' style='width:24px;height:24px;object-fit:cover;'>${emp.name}<button type='button' class='btn-close btn-close-white btn-sm ms-2'></button>`; badge.querySelector('button').addEventListener('click', ()=>{ selected = selected.filter(s=>s.id!==emp.id); renderSelected(); renderDropdown(); updateHidden(); }); selectedContainer.appendChild(badge); }); }
        function updateHidden(){ hidden.value = JSON.stringify(selected.map(s=>s.id)); }
        input.addEventListener('input', function(){ fetchEmployees(this.value.trim()); });
        input.addEventListener('focus', function(){ fetchEmployees(''); });
        document.addEventListener('click', e=>{ if(!dropdown.contains(e.target) && e.target!==input){ dropdown.style.display='none'; } });
    })();

    // Recurrence toggle logic (reuse simplified logic from task.js schedule section)
    (function recurrenceToggles(){
        const typeSel = document.getElementById('schedule_recurrence_type');
        const weekly = document.getElementById('schedule_weekly_opts');
        const monthly = document.getElementById('schedule_monthly_opts');
        const monthlyDateInput = document.getElementById('schedule_monthly_date');
        const monthlyDayHidden = document.getElementById('schedule_recurrence_day_of_month');
        function sync(){
            const v=typeSel.value;
            weekly.classList.toggle('d-none', v!=='weekly');
            monthly.classList.toggle('d-none', v!=='monthly');
            if(v==='weekly') { document.getElementById('schedule_recurrence_day_of_week').required=true; }
            else { document.getElementById('schedule_recurrence_day_of_week').required=false; }
            if(v==='monthly') {
                // Tampilkan format lengkap. Jika input kosong (misal setelah switch), isi ulang.
                if(!monthlyDayHidden.value){
                    const today = new Date();
                    monthlyDayHidden.value = today.getDate();
                }
                if(!monthlyDateInput.value){
                    const today = new Date();
                    const full = today.toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long', year:'numeric'});
                    monthlyDateInput.value = full;
                }
            } else {
                // Jangan hapus value jika user kembali lagi ke monthly; cukup biarkan.
            }
        }
        typeSel.addEventListener('change', sync);
        sync();
    })();

    // Load projects for select
    (function loadProjects(){ const sel=document.getElementById('schedule_project_id'); if(!sel) return; fetch(appUrl + '/project/index?task_scope=all').then(r=>r.json()).then(d=>{ const arr=d.data||[]; let opts='<option value="">No Project</option>'; arr.forEach(p=> opts += `<option value='${p.id}'>${p.title}</option>`); sel.innerHTML=opts; }).catch(()=>{}); })();

    // Reference URL dynamic rows (simple) - reuse global logic in task.js if loaded; else lightweight here
    document.addEventListener('click', function(e){
        if(e.target.closest('.add-ref-url')){ const container=document.getElementById('schedule_reference_urls_container'); const row=document.createElement('div'); row.className='d-flex gap-2 align-items-center'; row.innerHTML = `<input type='url' class='form-control input-text' name='reference_urls[]' placeholder='https://example.com'><button type='button' class='btn btn-danger remove-ref-url'><span class='material-symbols-outlined'>close</span></button>`; container.appendChild(row); }
        if(e.target.closest('.remove-ref-url')){ const row=e.target.closest('.d-flex'); if(row) row.remove(); }
    });

    form.addEventListener('submit', e=>{
        e.preventDefault();
        if(!form.checkValidity()){ e.stopPropagation(); form.classList.add('was-validated'); return; }
        form.classList.remove('was-validated');
        if(loader) loader.classList.remove('d-none');
        const submitBtn = form.querySelector('button[type=submit]'); if(submitBtn) submitBtn.disabled=true;
        const fd = new FormData(form);
        selectedFiles.forEach(f=> fd.append('reference_files[]', f));
        // Prefer due_in_days over due_date (no due_date field visible anyway)
        fetch(appUrl + '/schedules', { method:'POST', headers:{ 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }, body: fd })
            .then(r=> r.json().then(j=>({ok:r.ok, body:j})))
            .then(({ok, body})=>{ if(loader) loader.classList.add('d-none'); if(submitBtn) submitBtn.disabled=false; if(!ok || body.code!==200){ const msg = (body && (body.message || 'Failed to create schedule')) || 'Failed.'; showScheduleAlert(msg,'danger'); return; } showScheduleAlert(body.message || 'Schedule created successfully','success'); form.reset(); selectedFiles=[]; displaySelectedFiles(); document.getElementById('scheduleImageLabel').style.backgroundImage = `url('${appUrl}/asset/img/background/add-image.png')`; window.location.href = appUrl + '/task'; })
            .catch(()=>{ if(loader) loader.classList.add('d-none'); if(submitBtn) submitBtn.disabled=false; showScheduleAlert('Failed to create schedule','danger'); });
    });
});
