const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Validate edge
function isValidEdge(edge) {
  edge = edge.trim();
  const regex = /^[A-Z]->[A-Z]$/;
  if (!regex.test(edge)) return false;

  const [p, c] = edge.split("->");
  if (p === c) return false;

  return true;
}

// Build tree
function buildTree(node, graph, visited) {
  if (visited.has(node)) return {};
  visited.add(node);

  let obj = {};
  if (graph[node]) {
    graph[node].forEach(child => {
      obj[child] = buildTree(child, graph, visited);
    });
  }
  return obj;
}

// Depth
function getDepth(node, graph) {
  if (!graph[node] || graph[node].length === 0) return 1;

  let max = 0;
  graph[node].forEach(child => {
    max = Math.max(max, getDepth(child, graph));
  });

  return max + 1;
}

// Cycle detection
function hasCycle(node, graph, visiting, visited) {
  if (visiting.has(node)) return true;
  if (visited.has(node)) return false;

  visiting.add(node);

  if (graph[node]) {
    for (let child of graph[node]) {
      if (hasCycle(child, graph, visiting, visited)) return true;
    }
  }

  visiting.delete(node);
  visited.add(node);
  return false;
}

app.post("/bfhl", (req, res) => {
  const input = req.body.data || [];

  let invalid_entries = [];
  let duplicate_edges = [];
  let seen = new Set();
  let validEdges = [];

  // Validate + duplicates
  input.forEach(edge => {
    if (!isValidEdge(edge)) {
      invalid_entries.push(edge);
    } else {
      if (seen.has(edge)) {
        if (!duplicate_edges.includes(edge)) {
          duplicate_edges.push(edge);
        }
      } else {
        seen.add(edge);
        validEdges.push(edge);
      }
    }
  });

  // Build graph
  let graph = {};
  let childSet = new Set();

  validEdges.forEach(edge => {
    const [p, c] = edge.split("->");

    if (!graph[p]) graph[p] = [];
    graph[p].push(c);

    childSet.add(c);
  });

  // Find nodes
  let nodes = new Set();
  validEdges.forEach(e => {
    const [p, c] = e.split("->");
    nodes.add(p);
    nodes.add(c);
  });

  // Roots
  let roots = [...nodes].filter(n => !childSet.has(n));

  let hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;

  let largest_tree_root = "";
  let maxDepth = 0;

  let processed = new Set();

  roots.forEach(root => {
    if (processed.has(root)) return;

    let cycle = hasCycle(root, graph, new Set(), new Set());

    if (cycle) {
      total_cycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    } else {
      total_trees++;

      let tree = {};
      tree[root] = buildTree(root, graph, new Set());

      let depth = getDepth(root, graph);

      if (depth > maxDepth || (depth === maxDepth && root < largest_tree_root)) {
        maxDepth = depth;
        largest_tree_root = root;
      }

      hierarchies.push({
        root,
        tree,
        depth
      });
    }

    processed.add(root);
  });

  // Pure cycle case
  if (roots.length === 0 && nodes.size > 0) {
    total_cycles = 1;
    let root = [...nodes].sort()[0];

    hierarchies.push({
      root,
      tree: {},
      has_cycle: true
    });
  }

  res.json({
    user_id: "atchaya_24042004", 
    email_id: "ap9093@srm.edu", 
    college_roll_number: "RA2311026050014", 
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("BFHL API is running 🚀");
});

app.get("/bfhl", (req, res) => {
  res.send("Use POST request for this endpoint");
});