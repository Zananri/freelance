/*
 Multi-parent task edges using jsPlumb. Draws additional connections between parent and child cards.
 Requires: jsPlumb community lib loaded globally as jsPlumb or window.jsPlumb.
*/
(function(){
  function meta(name){ try{ var m=document.querySelector('meta[name="'+name+'"]'); return m? m.getAttribute('content') : null; }catch(_){ return null; } }
  var appUrl = (window.appUrl || meta('app-url') || (location && location.origin) || '').replace(/\/$/, '');
  var projectId = (window.projectId || meta('project-id') || '')+'';
  var csrf = (window.csrfToken || meta('csrf-token') || '');

  var instance = null;
  var endpoints = {};
  function getElId(taskId){ return 'task-node-' + String(taskId); }

  function ensureInstance(){
    if (instance) return instance;
    if (!(window.jsPlumb && window.jsPlumb.jsPlumb)) {
      // v2 style
      instance = window.jsPlumb ? window.jsPlumb.getInstance() : null;
    } else {
      // v5 UMD exposes jsPlumb.jsPlumb
      instance = window.jsPlumb.jsPlumb.getInstance();
    }
    if (!instance) return null;
    try {
      // ensure all connectors are drawn within the task tree container
      try {
        var c = document.getElementById('task-tree');
        if (c) {
          instance.setContainer && instance.setContainer(c);
          // container should be positioned to host the overlay canvas
          try { var cs = window.getComputedStyle(c); if (cs && cs.position === 'static') c.style.position = 'relative'; } catch(_){}
        }
      } catch(_){ }
      instance.importDefaults({
        Connector: ["Bezier", { curviness: 40 }],
        Endpoint: ["Dot", { radius: 3 }],
        PaintStyle: { stroke: "#6A5AE0", strokeWidth: 2 },
        EndpointStyle: { fill: "#6A5AE0" },
        Overlays: [["Arrow", { location: 1, width: 8, length: 8 }]],
        ConnectionsDetachable: true,
      });
    } catch(_){}
    return instance;
  }

  function makeSourceAndTarget(el){
    var inst = ensureInstance(); if (!inst || !el) return;
    try {
      inst.makeSource(el, {
        // Only start connections from the small handle to avoid DnD conflicts
        filter: '.plumb-handle',
        filterExclude: false,
        // help some browsers start drag correctly
        extract:{
          'action':'the-action'
        },
        anchor: "Continuous",
        allowLoopback: false,
        maxConnections: -1
      });
    } catch(_){}
    try {
      inst.makeTarget(el, {
        dropOptions: { hoverClass: 'plumb-drop-ok' },
        anchor: "Continuous",
        allowLoopback: false,
        maxConnections: -1
      });
    } catch(_){}
  }

  function buildExistingEdges(tasks){
    // edges are implied by parent_ids as parent -> child
    var edges = [];
    try {
      (tasks||[]).forEach(function(t){
        var parents = [];
        if (Array.isArray(t.parent_ids)) parents = t.parent_ids.slice();
        if (t.parent_id && parents.indexOf(t.parent_id) === -1) parents.push(t.parent_id);
        parents.forEach(function(pid){
          if (pid) edges.push({ parent: String(pid), child: String(t.id) });
        });
      });
    } catch(_){}
    return edges;
  }

  function connectEdge(pId, cId){
    var inst = ensureInstance(); if (!inst) return;
    var sourceId = getElId(pId), targetId = getElId(cId);
    try { inst.connect({ source: sourceId, target: targetId }); } catch(_){}
  }

  function clearAll(){ var inst = ensureInstance(); if (!inst) return; try{ inst.deleteEveryConnection(); inst.reset(); }catch(_){} instance=null; }

  function attachEvents(){
    var inst = ensureInstance(); if (!inst) return;
    // When user draws a connection, hit backend to add parent
    try {
      inst.bind('connection', function(info, originalEvent){
        try {
          // Make sure HTML5 draggable is restored on cards after drawing
          try { if (info && info.source) info.source.setAttribute('draggable','true'); } catch(_){}
          try { if (info && info.target) info.target.setAttribute('draggable','true'); } catch(_){}
          // Detect user-initiated events across versions
          var isUser = !!originalEvent || (info && info.originalEvent) || (info && info.connection && info.connection._jsPlumb && info.connection._jsPlumb.params && info.connection._jsPlumb.params.originalEvent);
          if (!isUser) return; // ignore programmatic wiring
          var source = info.sourceId, target = info.targetId;
          var sEl = document.getElementById(source), tEl = document.getElementById(target);
          var sRect = sEl ? sEl.getBoundingClientRect() : null;
          var tRect = tEl ? tEl.getBoundingClientRect() : null;
          // Default: start from parent -> drop to child; if user drags right-to-left, flip mapping
          var parentId = source.replace('task-node-','');
          var childId = target.replace('task-node-','');
          try {
            if (sRect && tRect && tRect.left < sRect.left - 5) {
              // target is left of source -> assume target is parent
              parentId = target.replace('task-node-','');
              childId = source.replace('task-node-','');
            }
          } catch(_){ }
          if (!parentId || !childId || parentId === childId) return;
          fetch(appUrl + '/task/' + encodeURIComponent(childId) + '/parents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ parent_id: Number(parentId) })
          }).then(function(r){ return r.json(); }).then(function(res){
            if (!(res && String(res.status||res.code)==='success' || res.code===200)) {
              // revert on failure
              try { info.connection && inst.deleteConnection(info.connection); } catch(_){}
              try { window.showFloatingAlert && window.showFloatingAlert(res.message||'Gagal menambah parent', 'warning', 3000); } catch(_){}
            } else {
              try { window.showFloatingAlert && window.showFloatingAlert('Parent ditambahkan', 'success', 1400); } catch(_){}
              try { inst.repaintEverything && inst.repaintEverything(); } catch(_){ }
            }
          }).catch(function(){ try { info.connection && inst.deleteConnection(info.connection); }catch(_){} });
        } catch(_){}
      });
    } catch(_){}

    // Deletion: user can click connection to remove
    try {
      inst.bind('click', function(conn){
        try {
          var sId = String(conn.sourceId||'');
          var tId = String(conn.targetId||'');
          var parentId = sId.replace('task-node-','');
          var childId = tId.replace('task-node-','');
          try {
            var sEl = document.getElementById(sId), tEl = document.getElementById(tId);
            var sRect = sEl ? sEl.getBoundingClientRect() : null;
            var tRect = tEl ? tEl.getBoundingClientRect() : null;
            if (sRect && tRect && tRect.left < sRect.left - 5) {
              // target is left of source -> target is likely parent
              parentId = tId.replace('task-node-','');
              childId = sId.replace('task-node-','');
            }
          } catch(_){ }
          if (!parentId || !childId) return;
          fetch(appUrl + '/task/' + encodeURIComponent(childId) + '/parents', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ parent_id: Number(parentId) })
          }).then(function(r){ return r.json(); }).then(function(res){
            if (res && (res.status==='success' || res.code===200)) {
              try { inst.deleteConnection(conn); } catch(_){}
              try { window.showFloatingAlert && window.showFloatingAlert('Parent dihapus', 'success', 1200); } catch(_){}
              try { inst.repaintEverything && inst.repaintEverything(); } catch(_){ }
            } else {
              try { window.showFloatingAlert && window.showFloatingAlert(res.message||'Gagal menghapus parent', 'warning', 2800); } catch(_){}
            }
          }).catch(function(){ try { window.showFloatingAlert && window.showFloatingAlert('Gagal menghapus parent', 'warning', 2800); }catch(_){} });
        } catch(_){}
      });
    } catch(_){}
  }

  function layConnections(tasks){
    var edges = buildExistingEdges(tasks);
    edges.forEach(function(e){ connectEdge(e.parent, e.child); });
  }

  function init(tasks){
    try {
      clearAll();
    } catch(_){}
    var inst = ensureInstance(); if (!inst) return;
    try {
      // register endpoints for all visible task boxes
      (tasks||[]).forEach(function(t){
        var el = document.getElementById(getElId(t.id));
        if (el) makeSourceAndTarget(el);
      });
    } catch(_){}
    layConnections(tasks);
    attachEvents();
    try { inst.repaintEverything && inst.repaintEverything(); } catch(_){}
  }

  window.initTaskPlumb = function(tasks){
    // debounce slightly to wait for layout
    clearTimeout(window.__initTaskPlumbTimer);
    window.__initTaskPlumbTimer = setTimeout(function(){ init(tasks); }, 60);
  };

  // Repaint on viewport changes to keep connectors aligned
  try {
    window.addEventListener('resize', function(){
      try { var inst = ensureInstance(); inst && inst.repaintEverything && inst.repaintEverything(); } catch(_){}
    });
    // capture scroll on any ancestor as well
    window.addEventListener('scroll', function(){
      try { var inst = ensureInstance(); inst && inst.repaintEverything && inst.repaintEverything(); } catch(_){}
    }, true);
  } catch(_){ }
})();
