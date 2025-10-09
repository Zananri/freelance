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
		$box.attr('draggable', true).addClass('draggable-task');
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
			var $group = $('<div class="child-group" style="display:flex;flex-direction:column;gap:20px;position:relative;"></div>');
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
