// Project Tree Renderer & DnD - Single unified implementation
// Dependencies: jQuery, Bootstrap tooltip (optional), CSS from project-tree.css
(function(){
	var appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content')||'').replace(/\/$/, '');
	var projectsRaw = [];
	var isInitialized = false;
	var currentProjectId = null;
	var $globalMenu = null;
    const userDeptId = $('select#edit_department option:selected').val();

	function normalizeStatus(v){
		var s = String(v||'').toLowerCase();
		if (s === 'complete' || s === 'completed') return 'complete';
		if (s === 'late') return 'late';
		if (s === 'in progress' || s === 'in-progress' || s === 'in_progress') return 'in-progress';
		return 'not-started';
	}

	function formatDateENMediumDayMonth(dateStr){
		if(!dateStr) return '';
		try{
			var d = new Date(dateStr);
			if (isNaN(d.getTime())) return '';
			var opt = { month:'short', day:'2-digit' };
			return d.toLocaleDateString('en-US', opt);
		}catch(_){return ''}
	}

	function buildForest(list){
		var map = {}, roots = [];
		list.forEach(function(p){ map[p.id] = Object.assign({children:[]}, p); });
		list.forEach(function(p){
			var parents = Array.isArray(p.parent_ids) ? p.parent_ids.slice() : [];
			if ((!parents || parents.length === 0) && p.legacy_parent_id) parents = [p.legacy_parent_id];
			if (parents && parents.length && parents[0] !== p.id && map[parents[0]]){
				map[parents[0]].children.push(map[p.id]);
			} else {
				roots.push(map[p.id]);
			}
		});
		return roots;
	}

	function renderNode(p){
		var $tpl = $('#task-template').clone().removeClass('d-none').removeAttr('id');
		var $card = $tpl.find('.task-box');
		$card.attr('data-project-id', String(p.id));
		if (!$card.attr('id')) $card.attr('id', 'proj-node-'+String(p.id));
		$card.attr('draggable', true);

		// Add plumb handle for jsPlumb connections
		try {
			$card.css("position", function(i, v){ return v || "relative"; });
			if ($card.find('.plumb-handle').length === 0) {
				const $handle = $('<div class="plumb-handle d-none" title="Drag a line to add a parent"\
					style="position:absolute;top:15px;right:-5px;width:14px;height:14px;border-radius:50%;background:#D2D3E1;cursor:crosshair;opacity:0.9;box-shadow:0 0 0 1px #fff;z-index:10;pointer-events:auto;user-select:none;-webkit-user-select:none;"></div>');
				$handle.attr('draggable', false);
				$handle.on('pointerdown mousedown touchstart', function(){
					try { $card.attr('draggable', false); } catch(_){ }
				});
				$handle.on('pointerup mouseup touchend touchcancel', function(){
					try { $card.attr('draggable', true); } catch(_){ }
				});
				$handle.on('click', function(e){ try { e.stopPropagation(); e.preventDefault(); } catch(_){} });
				$card.append($handle);
			}

			// Add three-dot menu button (circular, half outside top-right corner) - smaller
			if ($card.find('.more-menu-btn').length === 0) {
				const $moreBtn = $('<div class="more-menu-btn d-none" title="More options"\
					style="position:absolute;top:-7px;right:-7px;width:18px;height:18px;background:#fff;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.15);z-index:9999;pointer-events:auto;user-select:none;-webkit-user-select:none;border:1px solid rgba(0,0,0,0.08);">\
					<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style="color:#666;">\
					<circle cx="2" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="14" cy="8" r="1.2"/>\
					</svg></div>');
				$moreBtn.attr('draggable', false);
				$moreBtn.on('click', function(e){
					try {
						e.stopPropagation();
						e.preventDefault();
						showMenu(e, p.id);
					} catch(_){}
				});
				$card.append($moreBtn);
			}

			$card.hover(
				function () {
					$(this).find('.plumb-handle, .more-menu-btn').removeClass('d-none');
				},
				function () {
					$(this).find('.plumb-handle, .more-menu-btn').addClass('d-none');
				}
			);
		} catch(_) {}

        const pDetailUrl = `${appUrl}/project/${p.id}/${p.title}`

        $tpl.find('.task-name')
        .html(`<a href="${pDetailUrl}" target="_blank" class="text-decoration-none">${p.title || 'Untitled'}</a>`)
		var start = formatDateENMediumDayMonth(p.start_date);
		var due = formatDateENMediumDayMonth(p.due_date);
		var dateTxt = start && due ? (start+' - '+due) : (start||due||'');
		$tpl.find('.task-date').text(dateTxt);

		// Apply colors immediately based on visual_status from server
		var visual = normalizeStatus(p.visual_status||p.status);
		if (visual==='complete') $card.css('background-color', '#B2EECD');
		else if (visual==='in-progress') $card.css('background-color', '#F5EFCE');
		else if (visual==='late') $card.css('background-color', '#EBA5A5');
		else $card.css('background-color', '#DDE4E8');

		if (p.children && p.children.length){
			var $branch = $('<div class="task-branch"></div>');
			$branch.append($('<div class="task-item"></div>').append($tpl));
			var $childGroup = $('<div class="child-group"></div>');
			p.children.forEach(function(c){ $childGroup.append($('<div class="task-item"></div>').append(renderNode(c))); });
			$branch.append($childGroup);
			return $branch;
		}
		return $tpl;
	}

	function renderTree(list){
		var $tree = $('#task-tree');
		$tree.empty();
		if (!list || !list.length) {
			$tree.html('<div class="text-muted small">No projects found.</div>');
			return;
		}
		var forest = buildForest(list);
		var $rootCol = $('<div class="root-column"></div>');
		forest.forEach(function(r){ $rootCol.append(renderNode(r)); });
		$tree.append($rootCol);
		try { if (typeof window.initProjectPlumb === 'function') window.initProjectPlumb(list); } catch(_){}
	}

	function fetchTree(){
		return $.getJSON(appUrl + '/projects/tree?t=' + Date.now())
			.done(function(resp){
				var data = (resp && resp.data) ? resp.data : [];
				projectsRaw = data;
				// Server should provide visual_status, render immediately
				renderTree(projectsRaw);
			})
			.fail(function(){
				$('#task-tree').html('<div class="text-muted small">Failed to load project tree.</div>');
				try { if (typeof showFloatingAlert==='function') showFloatingAlert('Gagal memuat project tree','warning',3000); } catch(_){ }
			});
	}

	// Expose fetchTree globally
	window.fetchProjectTree = fetchTree;

	function projectMap(){ var m={}; (projectsRaw||[]).forEach(function(p){ m[String(p.id)] = p; }); return m; }

	function showMenu(e, projectId) {
		try {
			hideMenu();
			currentProjectId = projectId;

			if (!$globalMenu || !$globalMenu.length) {
				$globalMenu = $('<div id="project-global-more-menu" class="d-none" style="position:fixed;min-width:160px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 8px 20px rgba(0,0,0,0.12);border-radius:8px;z-index:99999;overflow:hidden;pointer-events:auto;">' +
					'<button type="button" class="clear-parent-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:13px;color:#333;cursor:pointer;">Clear Parent</button>' +
					'<button type="button" class="edit-project-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:13px;color:#333;cursor:pointer;">Edit</button>' +
					'<button type="button" class="delete-project-action" style="display:block;width:100%;padding:8px 12px;background:#fff;border:0;text-align:left;font-size:13px;color:#d33;cursor:pointer;">Delete</button>' +
				'</div>');
				$('body').append($globalMenu);
			}

			var x = e.clientX || (e.originalEvent && e.originalEvent.clientX) || 0;
			var y = e.clientY || (e.originalEvent && e.originalEvent.clientY) || 0;

			$globalMenu.css({ left: x + 'px', top: y + 'px' }).removeClass('d-none');

			setTimeout(function() {
				$(document).one('click', hideMenu);
			}, 50);
		} catch(_) {}
	}

	function hideMenu() {
		try {
			if ($globalMenu && $globalMenu.length) {
				$globalMenu.addClass('d-none');
			}
			currentProjectId = null;
		} catch(_) {}
	}

	// Expose a global deleteProject(projectId) used by tree menu to delete a project
	window.deleteProject = function(projectId){
		try {
			if (!projectId) return;
			var modalEl = document.getElementById('deleteProjectModal');
			var csrf = window.csrfToken || (document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content')) || '';

			var showModalAndBind = function(projectData){
				if (!modalEl) {
					// Fallback to simple confirm
					if (!confirm('Delete project?')) return;
					$.ajax({ url: appUrl + '/project/' + encodeURIComponent(String(projectId)), type: 'DELETE', headers: { 'X-CSRF-TOKEN': csrf } })
						.done(function(res){ try{ if (typeof fetchTree === 'function') fetchTree(); if (typeof showFloatingAlert === 'function') showFloatingAlert(res.message || 'Project deleted', 'success', 2000); }catch(_){} })
						.fail(function(xhr){ try{ if (typeof showFloatingAlert === 'function') showFloatingAlert('Failed to delete project: ' + (xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Unknown'), 'warning', 4000); }catch(_){} });
					return;
				}

				// store project id on modal dataset
				modalEl.dataset.projectId = String(projectId);
				// populate preview if helper available
				try {
					if (typeof setDeleteProjectModalPreview === 'function') {
						setDeleteProjectModalPreview(projectData || {});
					} else {
						var contentEl = modalEl.querySelector('#deleteProjectContent');
						if (contentEl) {
							// Build full card HTML (match structure provided)
							try {
								var title = projectData && projectData.title ? projectData.title : '';
								var desc = projectData && projectData.description ? projectData.description : '';
								var dept = projectData && (projectData.department || projectData.department_name) ? (projectData.department || projectData.department_name) : '-';
								var divn = projectData && (projectData.division || projectData.division_name) ? (projectData.division || projectData.division_name) : '-';
								var due = projectData && projectData.due_date ? projectData.due_date : '-';
								var pid = projectData && projectData.id ? projectData.id : projectId;
								var img = projectData && projectData.image ? projectData.image : null;

								function escapeHtml(str) {
									return String(str || '').replace(/[&<>\"]/g, function (s) {
										return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[s];
									});
								}

								function buildImgTag(imgSrc, titleText) {
									if (!imgSrc) return '';
									// Normalize to absolute URL when likely a filename
									var src = imgSrc;
									if (!/^https?:\/\//i.test(src) && !/^\//.test(src)) {
										src = appUrl.replace(/\/$/, '') + '/file/project/' + src;
									} else if (!/^https?:\/\//i.test(src) && /^\//.test(src)) {
										src = appUrl.replace(/\/$/, '') + src;
									}
									// Return a plain img tag; error handling will be attached after insertion
									return '<img src="'+escapeHtml(src)+'" alt="Project Image" class="rounded-circle me-3 project-preview-img" style="width:34px;height:34px;object-fit:cover;">';
								}

								var imgHtml = buildImgTag(img, title);

								var card = '';
								card += '<div class="custom-card-delete rounded-4 position-relative p-3 border-0">';
								card += '<div class="d-flex align-items-center mb-2">';
								card += imgHtml || '<div class="rounded-circle d-flex align-items-center justify-content-center me-3" style="width:34px;height:34px;background:#2E7D32;color:#fff;font-weight:600;font-size:11px;">'+(title? (title.substring(0,2).toUpperCase()):'NA')+'</div>';
								card += '<div class="d-flex flex-column">';
								card += '<h5 class="mb-0 task-title" style="line-height:1.2;">'+(title||'Untitled Project')+'</h5>';
								card += '</div></div>';
								if (desc) card += '<div class="task-description-container mb-2"><p class="task-description mb-0" style="font-size:14px;">'+desc+'</p></div>';
								card += '<hr class="task-separator rounded-4">';
								card += '<div class="d-flex justify-content-between mb-2" id="project-'+pid+'" style="font-size:12px;">';
								card += '<span style="color:#797E91;">Deadline: </span>';
								card += '<span id="deadline-'+pid+'" style="color:#4B4F5E;">'+due+'</span>';
								card += '</div>';
								card += '<div class="d-flex justify-content-between mb-1" style="font-size:12px;">';
								card += '<span class="text-muted">Department:</span><span>'+(dept||'-')+'</span>';
								card += '</div>';
								card += '<div class="d-flex justify-content-between mb-2" style="font-size:12px;">';
								card += '<span class="text-muted">Division:</span><span>'+(divn||'-')+'</span>';
								card += '</div>';
								card += '</div>';

								contentEl.innerHTML = card;
								// Attach a safe error handler to the inserted image so it is replaced by an initials fallback
								try {
									var insertedImg = contentEl.querySelector('img.project-preview-img');
									if (insertedImg) {
										insertedImg.addEventListener('error', function onImgError() {
											try {
												var t = (title||'').trim();
												var parts = t.split(/\s+/).filter(Boolean);
												var initials = 'NA';
												if (parts.length === 0) initials = 'NA';
												else if (parts.length === 1) initials = parts[0].substring(0,2).toUpperCase();
												else initials = (parts[0].charAt(0) + parts[parts.length-1].charAt(0)).toUpperCase();
												var fallback = document.createElement('div');
												fallback.className = 'rounded-circle d-flex align-items-center justify-content-center me-3';
												fallback.style.width = '34px'; fallback.style.height = '34px';
												fallback.style.background = '#2E7D32'; fallback.style.color = '#fff';
												fallback.style.fontWeight = '600'; fallback.style.fontSize = '11px';
												fallback.textContent = initials;
												insertedImg.replaceWith(fallback);
											} catch(_){ }
											}, { once: true });
										}
									} catch(_){}

								// If setDeleteProjectModalPreview is not present (we're in fallback), compute deadline using tasks like the main preview does
								try {
									function formatTaskDate(date) {
										if (!date) return '-';
										var d = new Date(date);
										if (isNaN(d.getTime())) return String(date || '-');
										var yyyy = d.getFullYear();
										var mm = String(d.getMonth() + 1).padStart(2, '0');
										var dd = String(d.getDate()).padStart(2, '0');
										return yyyy + '-' + mm + '-' + dd;
									}

									function getTaskByDueDate(projectId, callback) {
										$.ajax({
											url: appUrl + '/projects/' + encodeURIComponent(String(projectId)) + '/tasks',
											type: 'GET',
											dataType: 'json'
										})
										.done(function(response){
											if (response && response.data && response.data.length > 0) {
												var tasksWithDue = response.data.filter(function(t){ return t && t.due_date; });
												if (tasksWithDue.length === 0) return callback(null);
												var maxTask = tasksWithDue.reduce(function(latest, t){
													return new Date(t.due_date) > new Date(latest.due_date) ? t : latest;
												}, tasksWithDue[0]);
												callback(maxTask);
											} else {
												callback(null);
											}
										})
										.fail(function(){ callback(null); });
									}

									var pidSelector = '#deadline-' + pid;
									getTaskByDueDate(pid, function(maxTask){
										try {
											var deadlineEl = contentEl.querySelector(pidSelector);
											if (!deadlineEl) return;
											var projectDue = projectData && projectData.due_date ? new Date(projectData.due_date) : null;
											if (maxTask && maxTask.due_date) {
												var taskDue = new Date(maxTask.due_date);
												if (!projectDue || taskDue > projectDue) {
													deadlineEl.textContent = formatTaskDate(taskDue);
												} else {
												deadlineEl.textContent = formatTaskDate(projectDue);
												}
											} else {
												deadlineEl.textContent = projectData && projectData.due_date ? formatTaskDate(projectData.due_date) : '-';
											}
										} catch(_){ }
									});
								} catch(_){}
							} catch(e) {
								contentEl.innerHTML = '<div class="p-3">'+((projectData && projectData.title) ? '<strong>'+projectData.title+'</strong>' : 'Project')+'</div>';
							}
						}
					}
				} catch(_){}

				// Ensure this delete modal appears above any existing open modal (projectTreeModal)
				var modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl) || new bootstrap.Modal(modalEl);
				try {
					// Count currently open modals to calculate stacking offset
					var openModals = document.querySelectorAll('.modal.show').length;
					var zOffset = (openModals || 0) * 20; // 20px per stacked modal step

					// Pre-set modal z-index so it will appear above existing ones
					try { modalEl.style.zIndex = (1050 + zOffset).toString(); } catch(_) {}

					// When shown, adjust the most-recent backdrop z-index to sit behind this modal
					var onShownAdjust = function() {
						try {
							var backdrops = document.querySelectorAll('.modal-backdrop');
							if (backdrops && backdrops.length) {
								var lastBackdrop = backdrops[backdrops.length - 1];
								if (lastBackdrop) lastBackdrop.style.zIndex = (1040 + zOffset).toString();
							}
							// Re-apply modal z-index in case Bootstrap changed it
							try { modalEl.style.zIndex = (1050 + zOffset).toString(); } catch(_) {}
						} catch(_) {}
						try { modalEl.removeEventListener('shown.bs.modal', onShownAdjust); } catch(_){}
					};
					modalEl.addEventListener('shown.bs.modal', onShownAdjust);
				} catch(_) {}
				modalInstance.show();
				// Remove extra backdrops so the newest modal's backdrop is on top of older ones
				try {
					setTimeout(function(){
						var backdrops = document.querySelectorAll('.modal-backdrop');
						if (backdrops && backdrops.length > 1) {
							// Keep only the last backdrop (the top-most), remove others to avoid overlaying issues
							for (var i = 0; i < backdrops.length - 1; i++) {
								try { backdrops[i].parentNode && backdrops[i].parentNode.removeChild(backdrops[i]); } catch(_){}
							}
						}
					}, 50);
				} catch(_){}

				var btn = document.getElementById('confirmDeleteProjectBtn');
				if (!btn) return;

				var handler = function(){
					$.ajax({
						url: appUrl + '/project/' + encodeURIComponent(String(projectId)),
						type: 'DELETE',
						headers: { 'X-CSRF-TOKEN': csrf },
					})
					.done(function(res){
						try { modalInstance.hide(); } catch(_){}
						try { if (typeof fetchTree === 'function') fetchTree(); } catch(_){}
						try { if (typeof showFloatingAlert === 'function') showFloatingAlert(res.message || 'Project deleted', 'success', 2000); } catch(_){}
					})
					.fail(function(xhr){
						try { var msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Failed to delete project'; if (typeof showFloatingAlert === 'function') showFloatingAlert(msg, 'warning', 4000); } catch(_){}
					})
					.always(function(){
						try { btn.removeEventListener('click', handler); } catch(_){}
					});
				};

				// ensure no duplicate handlers
				try { btn.removeEventListener('click', handler); } catch(_){}
				btn.addEventListener('click', handler);
			};

			// Try to fetch full project data to display preview; if fails, still show modal with minimal info
			$.ajax({ url: appUrl + '/project/' + encodeURIComponent(String(projectId)), type: 'GET', dataType: 'json' })
				.done(function(resp){ var project = (resp && resp.data) ? resp.data : {}; showModalAndBind(project); })
				.fail(function(){ showModalAndBind({ id: projectId, title: '' }); });
		} catch(_){}
	};

	// Clear Parent action
	$(document).on('click', '#project-global-more-menu .clear-parent-action', function(e){
		try {
			e.preventDefault(); e.stopPropagation();
			var projectId = currentProjectId;
			if (!projectId) return;
			hideMenu();

			// Clear all parents: set parent_ids to empty array
			$.ajax({
				url: appUrl + '/project/' + encodeURIComponent(String(projectId)) + '/parents',
				type: 'DELETE',
				dataType: 'json',
				headers: {
					'X-CSRF-TOKEN': window.csrfToken || $('meta[name="csrf-token"]').attr('content') || '',
					'X-Requested-With': 'XMLHttpRequest'
				}
			})
			.done(function(res){
				try {
					if (typeof window.refreshProjectTreePartial === 'function') {
						window.refreshProjectTreePartial();
					} else {
						fetchTree();
					}
					if (typeof window.showFloatingAlert === 'function') {
						window.showFloatingAlert('Semua parent dibersihkan', 'success', 1400);
					}
				} catch(_){}
			})
			.fail(function(xhr){
				try {
					console.error('Gagal clear parent', xhr && xhr.responseText);
					if (typeof window.showFloatingAlert === 'function') {
						window.showFloatingAlert('Gagal menghapus parent', 'warning', 2400);
					} else { alert('Gagal menghapus parent'); }
				} catch(_){}
			});
		} catch(_){}
	});

	// Edit Project action
	$(document).on('click', '#project-global-more-menu .edit-project-action', function(e){
		try {
			e.preventDefault(); e.stopPropagation();
			var projectId = currentProjectId;
			if (!projectId) return;
			hideMenu();
			// Call the global edit function if it exists
			if (typeof window.editProject === 'function') {
				window.editProject(projectId);
			}
		} catch(_) {}
	});

	// Provide a global editProject(projectId) so tree can reuse existing edit modal logic
	window.editProject = function(projectId){
		try {
			if (!projectId) return;
			var url = appUrl.replace(/\/$/, '') + '/project/' + encodeURIComponent(String(projectId)) + '/edit';
			// show loader on modal if exists
			var editModalEl = document.getElementById('editProjectModal');
			var loader = editModalEl ? editModalEl.querySelector('#editModalLoader') : null;
			try { if (loader) loader.classList.remove('d-none'); } catch(_){}

			$.ajax({ url: url, type: 'GET', dataType: 'json' })
				.done(function(resp){
					var data = resp && resp.data ? resp.data : resp;
					try {
						// Basic fields
						try { $('#edit_project_id').val(data.id); } catch(_){}
						try { $('#edit_title').val(data.title || ''); } catch(_){}
						try { $('#edit_description').val(data.description || ''); } catch(_){}
						try { if (window.__quillEdit && window.__quillEdit.root) window.__quillEdit.root.innerHTML = data.description || ''; } catch(_){}

						// Reference URLs (will be normalized by existing project.js helpers if present)
						try {
							var container = document.getElementById('edit_project_reference_urls_container');
							if (container) {
								container.innerHTML = '';
								var urls = [];
								if (Array.isArray(data.reference_urls)) urls = data.reference_urls.slice();
								else if (typeof data.reference_urls === 'string') {
									try { var parsed = JSON.parse(data.reference_urls); if (Array.isArray(parsed)) urls = parsed; } catch(_){}
								}
								if ((!urls || urls.length === 0) && data.reference_url) urls = [data.reference_url];
								function makeRow(value, withAdd){
									var row = document.createElement('div'); row.className = 'input-group';
									row.innerHTML = '<input type="url" class="form-control input-text" name="reference_urls[]" placeholder="https://example.com">' + (withAdd ? ' <button type="button" class="btn btn-submit-black add-ref-url" aria-label="Add URL"><span class="material-symbols-outlined">add</span></button>' : ' <button type="button" class="btn btn-remove-url remove-ref-url" aria-label="Remove URL"><span class="material-symbols-outlined">close</span></button>');
									container.appendChild(row);
									var inp = row.querySelector('input[type="url"]'); if (inp && value) inp.value = value;
								}
								if (urls && urls.length) { urls.forEach(function(u){ makeRow(u, false); }); makeRow('', true); } else { makeRow('', true); }
							}
						} catch(_){}

						try { $('#edit_start_date').val(data.start_date || ''); } catch(_){}
						try { $('#edit_due_date').val(data.due_date || ''); } catch(_){}

						// Part of project select population helper (defined in project.js)
						try {
							var curId = data.id || $('#edit_project_id').val();
							var curTitle = data.title || '';
							populatePartOfProjectSelects && populatePartOfProjectSelects('edit', curId, curTitle, data.part_of_project);
						} catch(_){}

                        try {
                            const deptEl = document.getElementById("edit_department");
                            const divEl = document.getElementById("edit_division");

                            // Ambil department dari user login (sudah auto-inject di Blade)
                            const fixedDeptId = $(deptEl).val();

                            if (typeof window.loadDivisions === "function" && fixedDeptId) {
                                divEl.innerHTML = '<option value="" disabled selected>Loading...</option>';
                                divEl.disabled = true;

                                // Load division berdasarkan department user login
                                window.loadDivisions(fixedDeptId, function () {
                                    try {
                                        if (data.division_id) {
                                            $(divEl).val(data.division_id).trigger("change");
                                        }
                                    } catch (e) {
                                        console.error("Error applying division_id:", e);
                                    }
                                }, divEl);
                            }
                        } catch (e) {
                            console.error("Error loading division:", e);
                        }

						// Image preview
						try {
							if (data.image) {
								$('#editImageLabel').css('background-image', 'url(' + appUrl + '/file/project/' + data.image + ')');
								$('#editImageLabel').addClass('has-image').css('background-size','cover').css('opacity','1');
								$('#editImageClearBtn').removeClass('d-none');
							} else {
								$('#editImageLabel').css('background-image', "url('"+ appUrl +"/asset/img/background/add-image.png')");
								$('#editImageLabel').removeClass('has-image').css('opacity','0.5');
								$('#editImageClearBtn').addClass('d-none');
							}
						} catch(_){}

						// Existing reference files handling (keep JSON in hidden input)
						try {
							var existingFiles = Array.isArray(data.reference_files) ? data.reference_files.slice() : (Array.isArray(data.reference_file) ? data.reference_file.slice() : (data.reference_file ? [data.reference_file] : []));
							var existingInput = document.getElementById('existing_reference_files_input');
							if (!existingInput) {
								existingInput = document.createElement('input'); existingInput.type='hidden'; existingInput.id='existing_reference_files_input'; existingInput.name='existing_reference_files'; document.getElementById('editProjectForm').appendChild(existingInput);
							}
							existingInput.value = JSON.stringify(existingFiles || []);

							var existingContainer = document.getElementById('existing_reference_files');
							if (existingContainer) {
								existingContainer.innerHTML = '';
								if (existingFiles && existingFiles.length) {
									var fileList = document.createElement('div'); fileList.className = 'selected-files-list mt-2 existing-files-list w-100';
									existingFiles.forEach(function(fn){
										var fileItem = document.createElement('div'); fileItem.className = 'd-flex align-items-center gap-2 p-2 rounded bg-light selected-task mb-2';
										var isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(String(fn||''));
										if (isImage) { var img = document.createElement('img'); img.src = appUrl + '/file/project/' + fn; img.width=28; img.height=28; img.style.objectFit='cover'; img.style.borderRadius='50%'; fileItem.appendChild(img); }
										var link = document.createElement('a'); link.href = appUrl + '/file/project/' + fn; link.target='_blank'; link.className='flex-grow-1 text-truncate'; link.textContent = fn; fileItem.appendChild(link);
										var removeBtn = document.createElement('button'); removeBtn.type='button'; removeBtn.className='btn btn-sm btn-remove-task remove-task'; removeBtn.style.lineHeight='1'; removeBtn.innerHTML='<span class="material-symbols-outlined">close</span>';
										removeBtn.addEventListener('click', function(){ try { existingFiles = existingFiles.filter(function(x){ return x !== fn; }); existingInput.value = JSON.stringify(existingFiles); fileItem.remove(); } catch(_){} });
										fileItem.appendChild(removeBtn);
										fileList.appendChild(fileItem);
									});
									existingContainer.appendChild(fileList);
								}
							}
						} catch(_){}

						// Populate co-authors and contributors preview/hidden inputs using existing helpers in project.js
						try {
							// First, programmatically set co-authors then contributors to allow mutual exclusion logic
							if (typeof window.setSelectedCoAuthorsEdit === 'function') {
								window.setSelectedCoAuthorsEdit(Array.isArray(data.co_authors) ? data.co_authors : (data.co_authors ? [data.co_authors] : []));
							}
							if (typeof window.setSelectedContributorsEdit === 'function') {
								window.setSelectedContributorsEdit(Array.isArray(data.contributors) ? data.contributors : (data.contributors ? [data.contributors] : []));
							}
						} catch(_){ }

						// Finally show modal (ensure it stacks above Project Tree modal/backdrops)
						try {
							if (editModalEl) {
								var modalInstance = bootstrap.Modal.getOrCreateInstance(editModalEl) || new bootstrap.Modal(editModalEl);
								// store desired values so we can enforce them after modal shown
								var __desired_edit_department = data.department_id || null;
								var __desired_edit_division = data.division_id || null;
								var __desired_co_authors = Array.isArray(data.co_authors) ? data.co_authors : (data.co_authors ? [data.co_authors] : []);
								var __desired_contributors = Array.isArray(data.contributors) ? data.contributors : (data.contributors ? [data.contributors] : []);
								try {
									// Count currently open modals to calculate stacking offset
									var openModals = document.querySelectorAll('.modal.show').length;
									var zOffset = (openModals || 0) * 20; // 20px per stacked modal step

									// Pre-set modal z-index so it will appear above existing ones
									try { editModalEl.style.zIndex = (1050 + zOffset).toString(); } catch(_){}

									// When shown, adjust the most-recent backdrop z-index to sit behind this modal
									var onShownAdjust = function() {
										try {
											var backdrops = document.querySelectorAll('.modal-backdrop');
											if (backdrops && backdrops.length) {
												var lastBackdrop = backdrops[backdrops.length - 1];
												if (lastBackdrop) lastBackdrop.style.zIndex = (1040 + zOffset).toString();
											}
											// Re-apply modal z-index in case Bootstrap changed it
											try { editModalEl.style.zIndex = (1050 + zOffset).toString(); } catch(_){}
										} catch(_){}
										// After modal shown, ensure division and co/contributor selections are applied
										try {
											// If department/division not yet set by earlier load callback, enforce now
											if (__desired_edit_department) {
												try { $('#edit_department').val(__desired_edit_department).trigger && $('#edit_department').trigger('change'); } catch(_){}
											}
											if (__desired_edit_division) {
												try { $('#edit_division').val(__desired_edit_division).trigger && $('#edit_division').trigger('change'); } catch(_){}
											}
											// Set co-authors and contributors preview (call helpers again to be safe)
											try { if (typeof window.setSelectedCoAuthorsEdit === 'function') window.setSelectedCoAuthorsEdit(__desired_co_authors); } catch(_){ }
											try { if (typeof window.setSelectedContributorsEdit === 'function') window.setSelectedContributorsEdit(__desired_contributors); } catch(_){ }
										} catch(_){ }
										try { editModalEl.removeEventListener('shown.bs.modal', onShownAdjust); } catch(_){ }
									};
									editModalEl.addEventListener('shown.bs.modal', onShownAdjust);
								} catch(_){}

								modalInstance.show();

								// Remove extra backdrops so the newest modal's backdrop is on top of older ones
								try {
									setTimeout(function(){
										var backdrops = document.querySelectorAll('.modal-backdrop');
										if (backdrops && backdrops.length > 1) {
											// Keep only the last backdrop (the top-most), remove others to avoid overlaying issues
											for (var i = 0; i < backdrops.length - 1; i++) {
												try { backdrops[i].parentNode && backdrops[i].parentNode.removeChild(backdrops[i]); } catch(_){ }
											}
										}
									}, 50);
								} catch(_){}
							} else {
								// fallback: navigate to edit page
								window.location.href = appUrl + '/project/' + encodeURIComponent(String(projectId)) + '/edit';
							}
						} catch(_){ }
					} catch(e){ console.error('Failed to populate edit modal', e); }
				})
				.fail(function(xhr){
					try { if (typeof showFloatingAlert === 'function') showFloatingAlert('You are enabled to edit this project', 'warning', 3000); else alert('Unexpected error while opening edit modal'); } catch(_){}
				})
				.always(function(){ try { if (loader) loader.classList.add('d-none'); } catch(_){} });
		} catch(_){}
	};

	// Delete Project action
	$(document).on('click', '#project-global-more-menu .delete-project-action', function(e){
		try {
			e.preventDefault(); e.stopPropagation();
			var projectId = currentProjectId;
			if (!projectId) return;
			hideMenu();
			// Call the global delete function if it exists
			if (typeof window.deleteProject === 'function') {
				window.deleteProject(projectId);
			}
		} catch(_) {}
	});

	function isDescendant(sourceId, targetId){
		try{
			var map = projectMap();
			if (!map[sourceId] || !map[targetId]) return false;
			// climb up from target to root using first parent
			var cur = map[targetId]; var guard=0;
			while (cur && guard++<2000){
				var parents = Array.isArray(cur.parent_ids) ? cur.parent_ids : [];
				var parentId = parents.length ? String(parents[0]) : (cur.legacy_parent_id? String(cur.legacy_parent_id): null);
				if (!parentId) return false;
				if (parentId === String(sourceId)) return true;
				cur = map[parentId];
			}
		}catch(_){ }
		return false;
	}

	function bindDnD(){
		// Start
		$(document).on('dragstart', '#task-tree .task-box', function(e){
			var id = $(this).attr('data-project-id');
			window.__dragProjectId = id ? String(id) : null;
			if (e.originalEvent && e.originalEvent.dataTransfer){
				e.originalEvent.dataTransfer.setData('text/plain', window.__dragProjectId||'');
				e.originalEvent.dataTransfer.effectAllowed = 'move';
			}
			$(this).addClass('dragging');
		});
		// End
		$(document).on('dragend', '#task-tree .task-box', function(){
			$(this).removeClass('dragging drop-ok drop-denied').css({outline:''});
			window.__dragProjectId = null;
			$('#task-tree').removeClass('empty-space-drop-ok').css({outline:'', backgroundColor:''});
		});
		// Over card
		$(document).on('dragover dragenter', '#task-tree .task-box', function(e){
			e.preventDefault();
			var targetId = $(this).attr('data-project-id');
			var draggedId = window.__dragProjectId;
			var denied = !draggedId || String(draggedId)===String(targetId) || isDescendant(draggedId, targetId);
			if (e.originalEvent && e.originalEvent.dataTransfer) e.originalEvent.dataTransfer.dropEffect = denied? 'none':'move';
			$(this).toggleClass('drop-ok', !denied).toggleClass('drop-denied', denied).css({outline: denied? '2px dashed #d66':'2px dashed #2a7'});
		});
		$(document).on('dragleave', '#task-tree .task-box', function(){ $(this).removeClass('drop-ok drop-denied').css({outline:''}); });

		// Over empty space
		$(document).on('dragover dragenter', '#task-tree', function(e){
			var $t = $(e.target);
			if ($t.closest('.task-box').length) return;
			if (window.__dragProjectId) { e.preventDefault(); }
		});

		// Drop on empty space => clear all parents
		$(document).on('drop', '#task-tree', function(e){
			var $t = $(e.target);
			if ($t.closest('.task-box').length) return;
			e.preventDefault();
			var dragData = null;
			try { if (e.originalEvent && e.originalEvent.dataTransfer) dragData = e.originalEvent.dataTransfer.getData('text/plain'); } catch(_){}
			var draggedId = dragData || window.__dragProjectId;
			if (!draggedId) return;
			$.ajax({
				url: appUrl + '/project/' + encodeURIComponent(String(draggedId)) + '/parents',
				type:'DELETE',
				dataType:'json',
				headers: {
					'X-CSRF-TOKEN': window.csrfToken || $('meta[name="csrf-token"]').attr('content') || '',
					'X-Requested-With': 'XMLHttpRequest'
				}
			})
				.done(function(){
					try {
						if (typeof window.refreshProjectTreePartial === 'function') {
							window.refreshProjectTreePartial();
						} else {
							fetchTree();
						}
						if (typeof showFloatingAlert==='function') showFloatingAlert('Project dikeluarkan dari parent','success',2000);
					} catch(_){ }
				})
				.fail(function(xhr){ console.error('Failed to clear parents', xhr?.responseText); alert('Gagal memindahkan project. Coba lagi.'); });
		});

		// Drop on card => set parent
		$(document).on('drop', '#task-tree .task-box', function(e){
			e.preventDefault();
			var targetId = $(this).attr('data-project-id');
			var dragData=null; try{ if (e.originalEvent && e.originalEvent.dataTransfer) dragData = e.originalEvent.dataTransfer.getData('text/plain'); }catch(_){}
			var draggedId = dragData || window.__dragProjectId;
			if (!draggedId || !targetId) return;
			if (String(draggedId)===String(targetId) || isDescendant(draggedId, targetId)) return;
			var url = appUrl + '/project/' + encodeURIComponent(String(draggedId)) + '/parents';
			$.ajax({
				url: url,
				type:'POST',
				dataType:'json',
				data: { parent_id: String(targetId) },
				headers: {
					'X-CSRF-TOKEN': window.csrfToken || $('meta[name="csrf-token"]').attr('content') || '',
					'X-Requested-With': 'XMLHttpRequest'
				}
			})
				.done(function(){
					try {
						if (typeof window.refreshProjectTreePartial === 'function') {
							window.refreshProjectTreePartial();
						} else {
							fetchTree();
						}
						if (typeof showFloatingAlert === 'function') showFloatingAlert('Project berhasil menjadi sub dari parent', 'success', 2000);
					} catch(_){ }
				})
				.fail(function(xhr){ console.error('Failed to set parent', xhr?.responseText); alert('Gagal mengatur parent project.'); });
		});
	}

	function initializeProjectTree(){
		if (isInitialized) return;
		isInitialized = true;

		// Bind modal event handler
		$(document).on('shown.bs.modal', '#projectTreeModal', function(){
			fetchTree();
			setTimeout(function(){
				try { $('[data-bs-toggle="tooltip"]').tooltip(); } catch(_){}
			}, 200);
		});

		// Initialize drag and drop
		bindDnD();
	}

	// Initialize when DOM is ready
	$(document).ready(function(){
		initializeProjectTree();
	});
})();

