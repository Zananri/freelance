/* Project Tree jsPlumb connectors
   Draws connectors between a project card and its first-level children (like task tree).
   Requires: window.jsPlumb (2.x) and jQuery
*/
(function(){
  var instance = null;
  function getInstance(){
    try {
      if (instance && instance.setSuspendDrawing) return instance;
      if (window.jsPlumb && window.jsPlumb.jsPlumb) {
        instance = window.jsPlumb.jsPlumb.getInstance();
      } else if (window.jsPlumb && window.jsPlumb.getInstance) {
        instance = window.jsPlumb.getInstance();
      }
      if (!instance) return null;
      instance.setContainer(document.getElementById('task-tree'));
      instance.importDefaults({
        Connector: ["Flowchart", { cornerRadius: 6 }],
        PaintStyle: { stroke: "#b9c1cc", strokeWidth: 2 },
        HoverPaintStyle: { stroke: "#8892a4", strokeWidth: 2 },
        Endpoint: ["Dot", { radius: 2 }],
        EndpointStyle: { fill: "#b9c1cc" },
        Overlays: [["Arrow", { width: 8, length: 8, location: 1 }]]
      });
      return instance;
    } catch(_) { return null; }
  }

  function collectEdges(){
    var edges = [];
    try {
      // For each .task-branch, connect its first child-group children to the parent card
      $('#task-tree .task-branch').each(function(){
        var $branch = $(this);
        var $parent = $branch.children('.task-item').first().find('.task-box').first();
        var $group = $branch.children('.child-group').first();
        if (!$parent.length || !$group.length) return;
        var pid = $parent.attr('data-project-id');
        if (!pid) return;
        $group.find('> .task-item .task-box').each(function(){
          var $child = $(this);
          var cid = $child.attr('data-project-id');
          if (!cid) return;
          edges.push({ source: 'proj-node-'+pid, target: 'proj-node-'+cid });
        });
      });
    } catch(_) {}
    return edges;
  }

  function collectEdgesFromData(projects){
    var edges = [];
    try {
      var seen = new Set();
      (projects||[]).forEach(function(p){
        if (!p || p.id==null) return;
        var parents = Array.isArray(p.parent_ids) ? p.parent_ids.slice() : [];
        if ((!parents || parents.length===0) && p.legacy_parent_id) parents = [p.legacy_parent_id];
        parents.forEach(function(pid){
          if (pid==null || String(pid) === String(p.id)) return;
          var key = String(pid)+">"+String(p.id);
          if (seen.has(key)) return;
          edges.push({ source: 'proj-node-'+String(pid), target: 'proj-node-'+String(p.id) });
          seen.add(key);
        });
      });
    } catch(_){}
    return edges;
  }

  function ensureNodeIds(){
    $('#task-tree .task-box').each(function(){
      var $b = $(this);
      var id = $b.attr('data-project-id');
      if (id && !$b.attr('id')) $b.attr('id', 'proj-node-'+String(id));
    });
  }

  function repaint(){ try { if (instance) instance.repaintEverything(); } catch(_){} }

  window.initProjectPlumb = function(projects){
    try {
      var inst = getInstance();
      if (!inst) return;
      inst.reset();
      ensureNodeIds();
      // Prefer data-driven edges; fall back to DOM inference if data missing
      var edges = Array.isArray(projects) && projects.length ? collectEdgesFromData(projects) : collectEdges();
      // make endpoints on all nodes
      $('#task-tree .task-box').each(function(){
        try { inst.manage($(this).attr('id')); } catch(_){}
      });
      edges.forEach(function(e){
        try {
          inst.connect({
            source: e.source,
            target: e.target,
            anchors: [ ["Right"], ["Left"] ],
            detachable: false
          });
        } catch(_){}
      });
      setTimeout(repaint, 30);
    } catch(_) {}
  };

  // Repaint on modal shown and on window resize/scroll inside tree
  $(document).on('shown.bs.modal', '#projectTreeModal', function(){ setTimeout(function(){ try{ window.initProjectPlumb(); }catch(_){} }, 100); });
  $(window).on('resize', function(){ setTimeout(repaint, 50); });
  $('.task-tree-wrapper').on('scroll', function(){ setTimeout(repaint, 10); });
})();
