const fs = require('fs');
const path = require('path');

const graphJsonPath = path.join(__dirname, '..', 'graphify-out', 'graph.json');
const outputPath = path.join(__dirname, '..', 'graphify-out', 'graph3d.html');

if (!fs.existsSync(graphJsonPath)) {
  console.error("graph.json not found in graphify-out!");
  process.exit(1);
}

const rawGraph = JSON.parse(fs.readFileSync(graphJsonPath, 'utf8'));

// Calculate node degree (number of connections)
const degreeMap = {};
(rawGraph.links || []).forEach(l => {
  degreeMap[l.source] = (degreeMap[l.source] || 0) + 1;
  degreeMap[l.target] = (degreeMap[l.target] || 0) + 1;
});

const nodes = (rawGraph.nodes || []).map(n => {
  const degree = degreeMap[n.id] || 1;
  return {
    id: n.id,
    name: n.label || n.id,
    val: Math.max(degree, 1),
    community: n.community !== undefined ? n.community : 0,
    communityName: n.community_name || `Community ${n.community}`,
    file: n.source_file || '',
    loc: n.source_location || '',
    fileType: n.file_type || 'code'
  };
});

const links = (rawGraph.links || []).map(l => ({
  source: l.source,
  target: l.target,
  relation: l.relation || 'relates',
  context: l.context || ''
}));

const gData = { nodes, links };

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GuideBloc - 3D Knowledge Galaxy</title>
  <script src="https://unpkg.com/3d-force-graph@1.73.4/dist/3d-force-graph.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #060813;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    #3d-graph {
      width: 100vw;
      height: 100vh;
      display: block;
    }
    /* Floating Header & Search */
    .overlay-panel {
      position: absolute;
      top: 16px;
      left: 16px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: 16px;
      padding: 16px 20px;
      z-index: 10;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      width: 340px;
      max-height: calc(100vh - 32px);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-glow {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 12px #06b6d4, 0 0 20px #06b6d4;
      animation: pulse 2s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.7; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    .brand-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #f8fafc;
      background: linear-gradient(135deg, #fff 0%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
    }
    .search-input {
      width: 100%;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(71, 85, 105, 0.8);
      border-radius: 10px;
      padding: 9px 12px;
      color: #fff;
      font-size: 13px;
      outline: none;
      transition: all 0.2s ease;
    }
    .search-input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
    }
    .btn-group {
      display: flex;
      gap: 8px;
    }
    .btn {
      flex: 1;
      padding: 7px 10px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(71, 85, 105, 0.7);
      border-radius: 8px;
      color: #cbd5e1;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .btn:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: #38bdf8;
      color: #fff;
    }
    .btn.active {
      background: rgba(56, 189, 248, 0.35);
      border-color: #38bdf8;
      color: #fff;
    }
    /* Info Details */
    #info-box {
      border-top: 1px solid rgba(51, 65, 85, 0.6);
      padding-top: 10px;
      font-size: 12px;
      display: none;
      flex-direction: column;
      gap: 6px;
      max-height: 240px;
      overflow-y: auto;
    }
    .info-label {
      font-weight: 700;
      font-size: 14px;
      color: #38bdf8;
      word-break: break-word;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 11px;
    }
    .info-val {
      color: #e2e8f0;
      font-mono: true;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .stat-badge {
      display: inline-block;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      font-weight: 600;
    }
    /* Controls hint */
    .controls-hint {
      position: absolute;
      bottom: 16px;
      right: 16px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(51, 65, 85, 0.5);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 11px;
      color: #94a3b8;
      pointer-events: none;
      z-index: 10;
      line-height: 1.5;
    }
    .controls-hint b { color: #f1f5f9; }
  </style>
</head>
<body>
  <div id="3d-graph"></div>

  <!-- UI Floating Controls -->
  <div class="overlay-panel">
    <div class="brand">
      <div class="brand-glow"></div>
      <div>
        <div class="brand-title">3D Codebase Galaxy</div>
        <div class="brand-subtitle">${nodes.length} Nodes · ${links.length} Neural Edges</div>
      </div>
    </div>

    <!-- Search box -->
    <input 
      type="text" 
      id="search-input" 
      class="search-input" 
      placeholder="Search symbol (e.g. GuideBloc, deposit)..."
    />

    <!-- Quick Buttons -->
    <div class="btn-group">
      <button class="btn" id="btn-rotate">Orbit: OFF</button>
      <button class="btn" id="btn-reset">Reset View</button>
      <button class="btn active" id="btn-particles">Particles: ON</button>
    </div>

    <!-- Active Node Info Box -->
    <div id="info-box">
      <div id="info-title" class="info-label">Node Name</div>
      <div class="info-row">
        <span>Community:</span>
        <span id="info-community" class="stat-badge">Community 0</span>
      </div>
      <div class="info-row">
        <span>Connections:</span>
        <span id="info-degree" class="info-val">0</span>
      </div>
      <div class="info-row">
        <span>Source File:</span>
        <span id="info-file" class="info-val">file.ts</span>
      </div>
      <div class="info-row">
        <span>Location:</span>
        <span id="info-loc" class="info-val">L1</span>
      </div>
    </div>
  </div>

  <div class="controls-hint">
    <b>Rotate:</b> Left-Click + Drag &nbsp;|&nbsp; <b>Pan:</b> Right-Click + Drag<br/>
    <b>Zoom:</b> Scroll &nbsp;|&nbsp; <b>Fly To:</b> Click any sphere
  </div>

  <script>
    const gData = ${JSON.stringify(gData)};

    // Community color generator (HSL spectrum)
    function getCommunityColor(c) {
      const hue = ((c * 137.508) % 360);
      return \`hsl(\${hue}, 85%, 60%)\`;
    }

    const container = document.getElementById('3d-graph');
    let isRotating = false;
    let particlesEnabled = true;

    const Graph = ForceGraph3D()(container)
      .graphData(gData)
      .backgroundColor('#060813')
      .showNavInfo(false)
      // Node visual styling
      .nodeLabel(node => \`
        <div style="background: rgba(15,23,42,0.9); border: 1px solid #38bdf8; border-radius: 8px; padding: 8px 12px; font-family: sans-serif; color: #fff;">
          <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">\${node.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">\${node.file} \${node.loc}</div>
          <div style="font-size: 10px; color: #a5f3fc; margin-top: 4px;">\${node.communityName} · \${node.val} connections</div>
        </div>
      \`)
      .nodeVal(node => Math.max(Math.sqrt(node.val) * 1.5 + 2, 2.5))
      .nodeColor(node => getCommunityColor(node.community))
      // Links visual styling
      .linkWidth(link => Math.min(Math.max(link.weight || 1, 0.4), 2))
      .linkColor(() => 'rgba(148, 163, 184, 0.2)')
      .linkDirectionalParticles(2)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleWidth(1.4)
      .linkDirectionalParticleColor(link => '#38bdf8')
      .onNodeClick(node => {
        // Aim at node from outside it
        const distance = 160;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        Graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node, // lookAt
          2000  // ms transition
        );

        showNodeDetails(node);
      });

    // Node Details Sidebar Display
    function showNodeDetails(node) {
      const box = document.getElementById('info-box');
      box.style.display = 'flex';
      document.getElementById('info-title').textContent = node.name;
      document.getElementById('info-community').textContent = node.communityName;
      document.getElementById('info-community').style.borderColor = getCommunityColor(node.community);
      document.getElementById('info-degree').textContent = node.val + ' edges';
      document.getElementById('info-file').textContent = node.file || 'External / Module';
      document.getElementById('info-loc').textContent = node.loc || 'N/A';
    }

    // Auto-Orbit camera
    let angle = 0;
    setInterval(() => {
      if (isRotating) {
        const distance = 900;
        Graph.cameraPosition({
          x: distance * Math.sin(angle),
          z: distance * Math.cos(angle)
        });
        angle += Math.PI / 1200;
      }
    }, 1000 / 60);

    // Button: Toggle Rotate
    const btnRotate = document.getElementById('btn-rotate');
    btnRotate.addEventListener('click', () => {
      isRotating = !isRotating;
      btnRotate.textContent = 'Orbit: ' + (isRotating ? 'ON' : 'OFF');
      btnRotate.classList.toggle('active', isRotating);
    });

    // Button: Reset Camera
    document.getElementById('btn-reset').addEventListener('click', () => {
      Graph.cameraPosition({ x: 0, y: 0, z: 950 }, { x: 0, y: 0, z: 0 }, 1500);
    });

    // Button: Toggle Particles
    const btnParticles = document.getElementById('btn-particles');
    btnParticles.addEventListener('click', () => {
      particlesEnabled = !particlesEnabled;
      Graph.linkDirectionalParticles(particlesEnabled ? 2 : 0);
      btnParticles.textContent = 'Particles: ' + (particlesEnabled ? 'ON' : 'OFF');
      btnParticles.classList.toggle('active', particlesEnabled);
    });

    // Search input handler
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        const target = gData.nodes.find(n => 
          n.name.toLowerCase() === query ||
          n.name.toLowerCase().includes(query) ||
          n.file.toLowerCase().includes(query)
        );

        if (target) {
          const distance = 140;
          const distRatio = 1 + distance / Math.hypot(target.x, target.y, target.z);
          Graph.cameraPosition(
            { x: target.x * distRatio, y: target.y * distRatio, z: target.z * distRatio },
            target,
            2000
          );
          showNodeDetails(target);
        } else {
          alert('Symbol not found: ' + query);
        }
      }
    });

    // Adjust camera initial position
    Graph.cameraPosition({ x: 0, y: 0, z: 950 });
  </script>
</body>
</html>`;

fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log('Successfully generated 3D Galaxy Graph:', outputPath);
