// Project Tree Renderer & DnD - Single unified implementation
// Dependencies: jQuery, Bootstrap tooltip (optional), CSS from project-tree.css
(function(){
	var appUrl = (document.querySelector('meta[name="app-url"]')?.getAttribute('content')||'').replace(/\/$/, '');
	var projectsRaw = [];
	var isInitialized = false;

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

				$card.hover(
					function () { $(this).find('.plumb-handle').removeClass('d-none'); },
					function () { $(this).find('.plumb-handle').addClass('d-none'); }
				);
			}
		} catch(_) {}

		$tpl.find('.task-name').text(p.title||'Untitled');
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

	function projectMap(){ var m={}; (projectsRaw||[]).forEach(function(p){ m[String(p.id)] = p; }); return m; }

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
			$.ajax({ url: appUrl + '/project/' + encodeURIComponent(String(draggedId)) + '/parents', type:'DELETE', dataType:'json' })
				.done(function(){
					var map = projectMap(); var p = map[String(draggedId)]; if (p){ p.parent_ids = []; p.legacy_parent_id = null; }
					renderTree(projectsRaw);
					try{ if (typeof showFloatingAlert==='function') showFloatingAlert('Project dikeluarkan dari parent','success',2000);}catch(_){ }
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
			$.ajax({ url: url, type:'POST', dataType:'json', data: { parent_id: String(targetId) } })
				.done(function(){
					var map = projectMap(); var p = map[String(draggedId)]; if (p){ p.parent_ids = [Number(targetId)]; p.legacy_parent_id = null; }
					renderTree(projectsRaw);
					try { showFloatingAlert('Project berhasil menjadi sub dari parent', 'success', 2000); } catch(_){ }
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

