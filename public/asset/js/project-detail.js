(function ($) {
	'use strict';

	function getMeta(name) {
		return $('meta[name="' + name + '"]').attr('content') || '';
	}

	function safeText(str) {
		return (str === null || typeof str === 'undefined') ? '-' : String(str);
	}

	function formatDate(dateStr) {
		if (!dateStr) return '-';
		try {
			var d = new Date(dateStr);
			if (isNaN(d.getTime())) return '-';
			var opts = { year: 'numeric', month: 'short', day: '2-digit' };
			return d.toLocaleDateString(undefined, opts);
		} catch (e) {
			return '-';
		}
	}

	function resolveAvatar(url) {
		if (!url) return '/asset/img/avatar.png';
		return url;
	}

	function renderAssignments(container, author, coAuthors, contributors) {
		container.empty();
		var makeEntry = function (person, roleLabel) {
			var $wrap = $('<div>').addClass('d-flex align-items-center detail-role me-2 mb-2');
			var avatarSrc = '/asset/img/avatar.png';
			if (person) {
				avatarSrc = person.profile_picture || person.user_photo || person.photo || avatarSrc;
			}
			var $img = $('<img>').addClass('user-profile me-2').attr('alt', 'user profile').attr('src', resolveAvatar(avatarSrc));
			var $info = $('<div>');
			var nameText = (person && person.name) ? person.name : '-';
			var $name = $('<p>').addClass('m-0 fw-normal').text(safeText(nameText));
			var $role = $('<p>').addClass('m-0 text-muted small').text(roleLabel);
			$info.append($name).append($role);
			$wrap.append($img).append($info);
			return $wrap;
		};

		if (author) container.append(makeEntry(author, 'Author'));
		if (Array.isArray(coAuthors)) coAuthors.forEach(function (c) { container.append(makeEntry(c, 'Co Author')); });
		if (Array.isArray(contributors)) contributors.forEach(function (c) { container.append(makeEntry(c, 'Contributor')); });
	}

	function createActionButtons(projectId, actionsContainer) {
		actionsContainer.empty();
		var appUrl = getMeta('app-url') || '';
		var editUrl = appUrl.replace(/\/$/, '') + '/project/' + projectId + '/edit';
		var $edit = $('<a>').addClass('detail-icon').attr('title', 'Edit').attr('href', editUrl)
			.append($('<span>').addClass('material-symbols-outlined icon-fill me-3').text('edit'));

		// Delete button
		var $delete = $('<button>').addClass('detail-icon btn-delete-project').attr('title', 'Delete').append($('<span>').addClass('material-symbols-outlined icon-fill').text('delete'));

		actionsContainer.append($edit).append($delete);

		// Delete handler: open modal (modal already contains server-rendered project details)
		$delete.on('click', function (e) {
			e.preventDefault();
			var modalEl = document.getElementById('deleteProjectModal');
			if (!modalEl) {
				if (!confirm('Are you sure you want to delete this project?')) return;
				// fallback delete
				var appUrlFb = getMeta('app-url') || '';
				$.ajax({ url: appUrlFb.replace(/\/$/, '') + '/project/' + projectId, method: 'DELETE', headers: { 'X-CSRF-TOKEN': getMeta('csrf-token'), 'Accept':'application/json' }, success: function(){ window.location.href = appUrlFb.replace(/\/$/, '') + '/project'; }, error: function(){ alert('Failed to delete'); } });
				return;
			}
			// ensure confirm button has correct project id (server already set it, but set again for safety)
			$('#confirmDeleteProjectBtn').attr('data-project-id', projectId);
			var bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
			bsModal.show();
		});

		// Confirm delete button handler (delegated in case element created later)
		$(document).off('click', '#confirmDeleteProjectBtn').on('click', '#confirmDeleteProjectBtn', function (e) {
			var $btn = $(this);
			var pid = $btn.attr('data-project-id') || $btn.data('projectId');
			if (!pid) {
				alert('Project ID tidak ditemukan');
				return;
			}
			var appUrlLocal = getMeta('app-url') || '';
			var token = getMeta('csrf-token');
			// show loader state on button
			$btn.prop('disabled', true).text('Deleting...');
			$.ajax({
				url: appUrlLocal.replace(/\/$/, '') + '/project/' + pid,
				method: 'DELETE',
				headers: { 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
				success: function (res) {
					if (res && res.status === 'success') {
						// hide modal and redirect
						var modalEl = document.getElementById('deleteProjectModal');
						try { var m = bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); } catch (_) {}
						window.location.href = appUrlLocal.replace(/\/$/, '') + '/project';
					} else {
						alert((res && res.message) || 'Failed to delete project');
						$btn.prop('disabled', false).text('Delete');
					}
				},
				error: function (xhr) {
					var msg = 'Failed to delete project';
					try { msg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : msg; } catch (e) {}
					alert(msg);
					$btn.prop('disabled', false).text('Delete');
				}
			});
		});
	}

	function populateProject(data) {
		$('#project-title').text(safeText(data.title));
		if (data.image) {
			var imgUrl = data.image;
			// if image is a filename, prefix with /file/project/
			if (!imgUrl.match(/^(https?:)?\/\//)) {
				var appUrl = getMeta('app-url') || '';
				imgUrl = appUrl.replace(/\/$/, '') + '/file/project/' + imgUrl.replace(/^\//, '');
			}
			$('#project-image').attr('src', imgUrl);
		} else {
			// keep the server-provided placeholder image from meta (already set during init)
			var metaImg = getMeta('project-image');
			if (metaImg) $('#project-image').attr('src', metaImg);
		}
		$('#project-description').html((data.description) ? data.description.replace(/\n/g, '<br>') : '-');
		if (data.task_counts && typeof data.task_counts.total !== 'undefined') {
			$('#project-total-tasks').text(data.task_counts.total + ' Task' + ((data.task_counts.total > 1) ? 's' : ''));
		} else {
			var metaTotal = getMeta('project-total-tasks');
			if (metaTotal) {
				$('#project-total-tasks').text(metaTotal + ' Task' + (Number(metaTotal) > 1 ? 's' : ''));
			}
		}
		$('#project-deadline').text(formatDate(data.due_date));
		$('#project-department').text(safeText(data.department));
		$('#project-division').text(safeText(data.division));
		renderAssignments($('#project-assignments'), data.author, data.co_authors, data.contributors);
		createActionButtons(data.id, $('#project-actions'));
	}

	function fetchProject(projectId) {
		if (!projectId) return;
		var appUrl = getMeta('app-url') || '';
		var url = appUrl.replace(/\/$/, '') + '/project/' + projectId;
		$.ajax({
			url: url,
			method: 'GET',
			headers: { 'Accept': 'application/json' },
			success: function (res) {
				if (res && res.status === 'success' && res.data) {
					populateProject(res.data);
				} else {
					console.error('Invalid project payload', res);
					alert('Gagal mengambil data project');
				}
			},
			error: function (xhr) {
				console.error('Error fetching project', xhr);
				alert('Gagal mengambil data project');
			}
		});
	}

	// Setup global AJAX CSRF for forms if token present
	$(function () {
		var csrf = getMeta('csrf-token');
		if (csrf) {
			$.ajaxSetup({ headers: { 'X-CSRF-TOKEN': csrf } });
		}

		var projectId = getMeta('project-id');
		// initialize placeholders from meta if available
		var initialImg = getMeta('project-image');
		if (initialImg) {
			$('#project-image').attr('src', initialImg);
		}
		var initialTotal = getMeta('project-total-tasks');
		if (initialTotal) {
			$('#project-total-tasks').text(initialTotal + ' Task' + (Number(initialTotal) > 1 ? 's' : ''));
		}
		if (projectId) {
			fetchProject(projectId);
		}

		// button references (anchor to #references) - if project doesn't have references this simply navigates
		$('#btn-references').on('click', function () { window.location.hash = '#references'; });
		$('#btn-comments').on('click', function () { window.location.hash = '#comments'; });
	});

})(jQuery);
