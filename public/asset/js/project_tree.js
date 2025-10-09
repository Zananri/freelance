// Project Tree logic – mirrors task tree UX but for Projects
// Dependencies: jQuery, Bootstrap tooltip (optional), CSS from project-tree.css
(function(){
	var appUrl = (
		document.querySelector('meta[name="app-url"]')?.getAttribute('content') || ''
	).replace(/\/$/, '');

	var allProjects = [];

	function normalizeStatus(status){
		try {
			const s = String(status||'').toLowerCase();
			if (["new_request","new request","new-request","not started","not-started"].includes(s)) return 'not-started';
			if (["in_progress","in progress","in-progress","ongoing","pending"].includes(s)) return 'in-progress';
			if (["complete","completed","done"].includes(s)) return 'complete';
			return s.replace(/\s+/g,'-') || 'not-started';
		} catch(_) { return 'not-started'; }
	}

	function buildProjectForest(list){
		var map = {}, childrenCount = {}, roots = [];
		list.forEach(function(p){ map[String(p.id)] = Object.assign({}, p, { children: [] }); });
		list.forEach(function(p){
			var parents = Array.isArray(p.parent_ids) ? p.parent_ids : [];
			if (!parents.length && p.legacy_parent_id) parents = [p.legacy_parent_id];
			var attached = false;
			parents.forEach(function(pid){
				var parent = map[String(pid)];
				if (parent && String(pid) !== String(p.id)) {
					parent.children.push(map[String(p.id)]);
					attached = true;
					childrenCount[String(p.id)] = (childrenCount[String(p.id)]||0)+1;
				}
			});
			if (!attached) roots.push(map[String(p.id)]);
		});
		return roots;
	}

	function formatDate(d){
		if (!d) return '';
		try { var dt = new Date(d); if (isNaN(dt.getTime())) return ''; return dt.toLocaleDateString(undefined,{day:'2-digit',month:'short'}); } catch(_) { return ''; }
	}

	function renderNode(proj){
		var $tpl = $('#task-template').clone().removeClass('d-none').removeAttr('id');
		var $box = $tpl.find('.task-box');
		$box.attr('data-project-id', String(proj.id));
		if (!$box.attr('id')) $box.attr('id', 'proj-node-'+String(proj.id));
		$box.attr('draggable', true).addClass('draggable-task');
		// Add plumb handle for jsPlumb connections
		try {
			$box.css("position", function(i, v){ return v || "relative"; });
			if ($box.find('.plumb-handle').length === 0) {
				const $handle = $('<div class="plumb-handle d-none" title="Drag a line to add a parent"\
					style="position:absolute;top:15px;right:-5px;width:14px;height:14px;border-radius:50%;background:#D2D3E1;cursor:crosshair;opacity:0.9;box-shadow:0 0 0 1px #fff;z-index:10;pointer-events:auto;user-select:none;-webkit-user-select:none;"></div>');
				$handle.attr('draggable', false);
				$handle.on('pointerdown mousedown touchstart', function(){
					try { $box.attr('draggable', false); } catch(_){ }
				});
				$handle.on('pointerup mouseup touchend touchcancel', function(){
					try { $box.attr('draggable', true); } catch(_){ }
				});
				$handle.on('click', function(e){ try { e.stopPropagation(); e.preventDefault(); } catch(_){} });
				$box.append($handle);

				$box.hover(
					function () { $(this).find('.plumb-handle').removeClass('d-none'); },
					function () { $(this).find('.plumb-handle').addClass('d-none'); }
				);
			}
		} catch(_) {}
		var visual = normalizeStatus(proj.status);
		if (visual === 'complete') $box.css('background-color', '#B2EECD');
		else if (visual === 'in-progress') $box.css('background-color', '#F5EFCE');
		else $box.css('background-color', '#DDE4E8');
		$tpl.find('.task-name').text(proj.title||'Untitled');
		var sd = formatDate(proj.start_date), dd = formatDate(proj.due_date);
		$tpl.find('.task-date').text(sd && dd ? (sd+' - '+dd) : (sd||dd));
		if (proj.children && proj.children.length){
			var $branch = $('<div class="task-branch"></div>');
			$branch.append($('<div class="task-item"></div>').append($tpl));
			// let CSS (project-detail.css) control layout and gaps so spacing matches task tree
			var $group = $('<div class="child-group"></div>');
			proj.children.forEach(function(ch){ $group.append($('<div class="task-item"></div>').append(renderNode(ch))); });
			$branch.append($group);
			return $branch;
		}
		return $tpl;
	}

	function renderTree(data){
		var $tree = $('#task-tree');
		$tree.empty();
		if (!data || !data.length) return;
		var forest = buildProjectForest(data);
		var $rootCol = $('<div class="root-column"></div>');
		forest.forEach(function(root){ $rootCol.append(renderNode(root)); });
		$tree.append($rootCol);
		try { if (typeof window.initProjectPlumb === 'function') window.initProjectPlumb(data); } catch(_){}
	}

	function fetchProjects(){
		return $.getJSON(appUrl + '/projects/tree')
			.done(function(res){
				var arr = res && res.data ? res.data : [];
				allProjects = arr;
				renderTree(allProjects);
			})
			.fail(function(){
				$('#task-tree').html('<div class="text-muted small">Failed to load project tree.</div>');
			});
	}

	function projectMap(){ var m={}; (allProjects||[]).forEach(p=>m[String(p.id)]=p); return m; }
	function isDescendant(sourceId, targetId){
		var map = projectMap();
		if (String(sourceId) === String(targetId)) return true;
		// walk up via parent_ids
		var seen=0; var cur = map[String(targetId)];
		while(cur && seen<2000){
			var parents = Array.isArray(cur.parent_ids) ? cur.parent_ids : [];
			if (!parents.length && cur.legacy_parent_id) parents = [cur.legacy_parent_id];
			if (!parents.length) return false;
			if (parents.some(pid => String(pid) === String(sourceId))) return true;
			// follow first parent
			cur = map[String(parents[0])];
			seen++;
		}
		return false;
	}

	// Drag & drop to set/clear parent
	$(document).on('dragstart', '#task-tree .task-box', function(e){
		var id = $(this).attr('data-project-id');
		window.__dragProjectId = id ? String(id) : null;
		if (e.originalEvent && e.originalEvent.dataTransfer) {
			e.originalEvent.dataTransfer.setData('text/plain', window.__dragProjectId || '');
			e.originalEvent.dataTransfer.effectAllowed = 'move';
		}
		$(this).addClass('dragging');
	});
	$(document).on('dragend', '#task-tree .task-box', function(){
		$(this).removeClass('dragging drop-ok drop-denied').css({outline:''});
		window.__dragProjectId = null;
	});
	$(document).on('dragover dragenter', '#task-tree .task-box', function(e){
		e.preventDefault();
		var targetId = $(this).attr('data-project-id');
		var draggedId = window.__dragProjectId;
		var denied = !draggedId || String(draggedId)===String(targetId) || isDescendant(draggedId, targetId);
		if (e.originalEvent && e.originalEvent.dataTransfer) {
			e.originalEvent.dataTransfer.dropEffect = denied ? 'none' : 'move';
		}
		$(this).toggleClass('drop-ok', !denied).toggleClass('drop-denied', denied).css({outline: denied?'2px dashed #d66':'2px dashed #2a7'});
	});
	$(document).on('dragleave', '#task-tree .task-box', function(){
		$(this).removeClass('drop-ok drop-denied').css({outline:''});
	});
	// Drop onto a project to set it as parent
	$(document).on('drop', '#task-tree .task-box', function(e){
		e.preventDefault();
		var targetId = $(this).attr('data-project-id');
		var dragData = null;
		try { if (e.originalEvent && e.originalEvent.dataTransfer) dragData = e.originalEvent.dataTransfer.getData('text/plain'); } catch(_){}
		var draggedId = dragData || window.__dragProjectId;
		if (!draggedId || !targetId) return;
		if (String(draggedId)===String(targetId) || isDescendant(draggedId, targetId)) return;
		// Call API to add parent
		$.ajax({
			url: appUrl + '/project/' + encodeURIComponent(String(draggedId)) + '/parents',
			type: 'POST',
			data: { parent_id: String(targetId) },
			dataType: 'json'
		}).done(function(){
			// update local
			try { var map = projectMap(); var d = map[String(draggedId)]; if (d){ d.parent_ids = (Array.isArray(d.parent_ids)?d.parent_ids:[]).filter(pid=>String(pid)!==String(targetId)); d.parent_ids.push(targetId); } } catch(_){ }
			renderTree(allProjects);
			try { showFloatingAlert('Project berhasil menjadi sub dari parent', 'success', 2000); } catch(_){ }
		}).fail(function(xhr){
			console.error('Failed to set parent', xhr && xhr.responseText);
			try { showFloatingAlert('Gagal mengatur parent project', 'warning', 3000); } catch(_){ alert('Gagal mengatur parent project'); }
		});
	});

	// Drop to empty space to clear all parents (make it a root)
	$(document).on('dragover dragenter', '#task-tree', function(e){
		var $t = $(e.target);
		if ($t.closest('.task-box').length) return; // ignore when over cards
		e.preventDefault();
		if (e.originalEvent && e.originalEvent.dataTransfer) e.originalEvent.dataTransfer.dropEffect = 'move';
	});
	$(document).on('drop', '#task-tree', function(e){
		var $t = $(e.target);
		if ($t.closest('.task-box').length) return; // handled above
		e.preventDefault();
		var dragData = null; try { if (e.originalEvent && e.originalEvent.dataTransfer) dragData = e.originalEvent.dataTransfer.getData('text/plain'); } catch(_){}
		var draggedId = dragData || window.__dragProjectId; if (!draggedId) return;
		$.ajax({
			url: appUrl + '/project/' + encodeURIComponent(String(draggedId)) + '/parents',
			type: 'DELETE',
			dataType: 'json'
		}).done(function(){
			try { var map = projectMap(); var d = map[String(draggedId)]; if (d){ d.parent_ids = []; d.legacy_parent_id = null; } } catch(_){ }
			renderTree(allProjects);
			try { showFloatingAlert('Project dijadikan root', 'success', 2000); } catch(_){ }
		}).fail(function(xhr){
			console.error('Failed to clear parent', xhr && xhr.responseText);
			try { showFloatingAlert('Gagal menghapus parent project', 'warning', 3000); } catch(_){ alert('Gagal menghapus parent project'); }
		});
	});

	// Initialize on project page when modal opens
	$(document).on('shown.bs.modal', '#projectTreeModal', function(){
		fetchProjects();
		setTimeout(function(){
			try { $('[data-bs-toggle="tooltip"]').tooltip(); } catch(_){}
		}, 200);
	});
})();
/* Project Tree Renderer & DnD (mirrors Task Tree UX)
 * - Fetches projects from /projects/tree
 * - Builds a forest from parent_ids (fallback legacy_parent_id)
 * - Colors cards by visual_status: not-started, in-progress, late, complete
 * - Drag onto another card => set as parent (author only)
 * - Drag onto empty space => clear all parents
 */

(function(){
	var appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content')||'').replace(/\/$/, '');
	var projectsRaw = [];

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
		$tpl.find('.task-name').text(p.title||'Untitled');
		var start = formatDateENMediumDayMonth(p.start_date);
		var due = formatDateENMediumDayMonth(p.due_date);
		var dateTxt = start && due ? (start+' - '+due) : (start||due||'');
		$tpl.find('.task-date').text(dateTxt);
		var visual = normalizeStatus(p.visual_status||p.status);
		if (visual==='complete') $card.css('background-color', '#B2EECD');
		else if (visual==='in-progress') $card.css('background-color', '#F5EFCE');
		else if (visual==='late') $card.css('background-color', '#EBA5A5');
		else $card.css('background-color', '#DDE4E8');

		if (p.children && p.children.length){
			var $branch = $('<div class="task-branch"></div>');
			$branch.append($tpl);
			// rely on CSS for spacing so rendering matches the task tree appearance
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
		if (!list || !list.length) return;
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
					// If server didn't supply visual_status or everything becomes not-started, do a fallback enrichment
							var needsEnrich = (function(){
								if (!projectsRaw || !projectsRaw.length) return false;
								var hasColored = projectsRaw.some(function(p){ return (p.visual_status && p.visual_status !== 'not-started'); });
								if (hasColored) return false;
								var missing = projectsRaw.filter(function(p){ return !p.visual_status; }).length;
								if (missing > 0) return true;
								// If all are not-started, still enrich once to verify with task_counts
								var allNS = projectsRaw.every(function(p){ return (p.visual_status||'not-started') === 'not-started'; });
								return allNS;
							})();

					if (!needsEnrich) {
						renderTree(projectsRaw);
					} else {
						// Fallback: hit /project/index to get task_counts for deriving visual
						$.getJSON(appUrl + '/project/index?task_scope=me&t=' + Date.now())
							.done(function(r){
								var list = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : []);
								var map = {};
								list.forEach(function(item){ if (item && item.id!=null) map[String(item.id)] = item; });
								projectsRaw.forEach(function(p){
									var info = map[String(p.id)];
									if (!info || !info.task_counts) return;
									var tc = info.task_counts || {}; var total = +tc.total||0; var completed = +tc.completed||0; var late = +tc.late||0; var visual = 'not-started';
									if (total === 0) visual = 'not-started';
									else if (completed === total) visual = 'complete';
									else if (late > 0) visual = 'late';
									else visual = 'in-progress';
									p.visual_status = visual;
									// also keep start/due in case missing
									if (!p.start_date && info.start_date) p.start_date = info.start_date;
									if (!p.due_date && info.due_date) p.due_date = info.due_date;
								});
							})
							.always(function(){ renderTree(projectsRaw); });
					}
			})
			.fail(function(){
				try { if (typeof showFloatingAlert==='function') showFloatingAlert('Gagal memuat project tree','warning',3000); } catch(_){ }
			});
	}

	function projectMap(){ var m={}; (projectsRaw||[]).forEach(function(p){ m[String(p.id)] = p; }); return m; }

	function isDescendant(sourceId, targetId){
		try{
			var map = projectMap();
			if (!map[sourceId] || !map[targetId]) return false;
			// climb up from target to root using first parent (visual tree based on first parent)
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
			if ($t.closest('.task-box').length) return; // ignore when above a card
			if (window.__dragProjectId) { e.preventDefault(); }
		});

		// Drop on empty space => clear all parents
		$(document).on('drop', '#task-tree', function(e){
			var $t = $(e.target);
			if ($t.closest('.task-box').length) return; // handled by card drop
			e.preventDefault();
			var dragData = null;
			try { if (e.originalEvent && e.originalEvent.dataTransfer) dragData = e.originalEvent.dataTransfer.getData('text/plain'); } catch(_){}
			var draggedId = dragData || window.__dragProjectId;
			if (!draggedId) return;
			$.ajax({ url: appUrl + '/project/' + encodeURIComponent(String(draggedId)) + '/parents', type:'DELETE', dataType:'json' })
				.done(function(){
					var map = projectMap(); var p = map[String(draggedId)]; if (p){ p.parent_ids = []; p.legacy_parent_id = null; }
					renderTree(projectsRaw);
					try{ if (typeof showFloatingAlert==='function') showFloatingAlert('Project dikeluarkan dari parent','success',2000);}catch(_){ }
				})
				.fail(function(xhr){ console.error('Failed to clear parents', xhr?.responseText); alert('Gagal memindahkan project. Coba lagi.'); });
		});

		// Drop on card => set parent (first parent)
		$(document).on('drop', '#task-tree .task-box', function(e){
			e.preventDefault();
			var targetId = $(this).attr('data-project-id');
			var dragData=null; try{ if (e.originalEvent && e.originalEvent.dataTransfer) dragData = e.originalEvent.dataTransfer.getData('text/plain'); }catch(_){}
			var draggedId = dragData || window.__dragProjectId;
			if (!draggedId || !targetId) return;
			if (String(draggedId)===String(targetId) || isDescendant(draggedId, targetId)) return;
			var url = appUrl + '/project/' + encodeURIComponent(String(draggedId)) + '/parents';
			$.ajax({ url: url, type:'POST', dataType:'json', data: { parent_id: String(targetId) } })
				.done(function(){
					var map = projectMap(); var p = map[String(draggedId)]; if (p){ p.parent_ids = [Number(targetId)]; p.legacy_parent_id = null; }
					renderTree(projectsRaw);
				})
				.fail(function(xhr){ console.error('Failed to set parent', xhr?.responseText); alert('Gagal mengatur parent project.'); });
		});
	}

	function ensureOnce(fn){ var done=false; return function(){ if(done) return; done=true; try{ fn(); }catch(_){} } }

	var bindOnModalShown = ensureOnce(function(){
		$('#projectTreeModal').on('shown.bs.modal', function(){ fetchTree(); });
	});

	$(document).ready(function(){ bindOnModalShown(); bindDnD(); });
})();
