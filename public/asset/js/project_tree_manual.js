/* Fallback manual connector drawing untuk Project Tree
   Jika jsPlumb gagal, gambar garis SVG sederhana
*/
window.drawManualProjectConnectors = function(projects) {
    console.log('Drawing manual connectors for projects:', projects);
    
    // Remove existing SVG
    $('#project-tree-svg').remove();
    
    if (!projects || !projects.length) return;
    
    var $tree = $('#task-tree');
    var treeOffset = $tree.offset();
    
    // Create SVG overlay
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'project-tree-svg';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    
    $tree.append(svg);
    
    // Collect edges from data
    var edges = [];
    projects.forEach(function(p) {
        if (!p || p.id == null) return;
        var parents = Array.isArray(p.parent_ids) ? p.parent_ids.slice() : [];
        parents.forEach(function(pid) {
            if (pid == null || String(pid) === String(p.id)) return;
            edges.push({
                sourceId: 'proj-node-' + String(pid),
                targetId: 'proj-node-' + String(p.id)
            });
        });
    });
    
    console.log('Manual edges to draw:', edges);
    
    // Draw each edge
    edges.forEach(function(edge) {
        var sourceEl = document.getElementById(edge.sourceId);
        var targetEl = document.getElementById(edge.targetId);
        
        if (!sourceEl || !targetEl) {
            console.warn('Missing elements for edge:', edge.sourceId, '->', edge.targetId);
            return;
        }
        
        var sourceRect = sourceEl.getBoundingClientRect();
        var targetRect = targetEl.getBoundingClientRect();
        
        // Calculate positions relative to tree container
        var x1 = sourceRect.right - treeOffset.left;
        var y1 = sourceRect.top + sourceRect.height / 2 - treeOffset.top;
        var x2 = targetRect.left - treeOffset.left;
        var y2 = targetRect.top + targetRect.height / 2 - treeOffset.top;
        
        // Create simple curved path
        var cx1 = x1 + (x2 - x1) * 0.5;
        var cy1 = y1;
        var cx2 = x1 + (x2 - x1) * 0.5;
        var cy2 = y2;
        
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
        path.setAttribute('stroke', '#D2D3E1');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        
        // Add arrow
        var arrowSize = 8;
        var angle = Math.atan2(y2 - cy2, x2 - cx2);
        var arrowX1 = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
        var arrowY1 = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
        var arrowX2 = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
        var arrowY2 = y2 - arrowSize * Math.sin(angle + Math.PI / 6);
        
        var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`);
        arrow.setAttribute('fill', '#D2D3E1');
        
        svg.appendChild(path);
        svg.appendChild(arrow);
        
        console.log('Drew manual connector:', edge.sourceId, '->', edge.targetId);
    });
};