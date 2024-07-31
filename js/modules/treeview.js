import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm'

/**
 * Sets up svg for tree view and returns the node
 * @param {Object} data - tree data
 * @returns {HTMLElement} the node for the tree
 */
function makeTree(data) {
  // https://observablehq.com/@d3/cluster/2
  const zoom = d3.zoom()
    .on("zoom", handleZoom);

  const root = d3.hierarchy(data);
  const tree = d3.cluster().size([960, 500]);
  tree(root);

  let x0 = Infinity;
  let x1 = -x0;
  root.each(d => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const svg = d3.create("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 960 500");

  const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
    .selectAll("path")
      .data(root.links())
      .join("path")
        .attr("d", d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x));

  const node = svg.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants())
    .join("g")
      .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
      .attr("fill", d => d.children ? "#555" : "#999")
      .attr("r", 2.5);

  node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -6 : 6)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
    .clone(true).lower()
      .attr("stroke", "white");


  function handleZoom(event) {
    const {transform} = event;
    link.attr("transform", transform);
    node.attr("transform", d => `translate(${transform.apply([d.y, d.x])})`);
  }

  svg.call(zoom);
  return svg.node();
}

export {
  makeTree,
}
