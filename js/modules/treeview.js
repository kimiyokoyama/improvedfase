/**
 * Formats a sequence with mutations by wrapping mutated characters in em tags.
 * @param {string} sequence - the original sequence to be formatted
 * @param {Array<Object>} mutations - an array of mutation objects with index, mutationType, and mutation
 * @return {string} the formatted sequence with mutated characters wrapped in em tags
 */
function formatMutationSequence(sequence, mutations) {
  const sanatize = (s) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (!mutations || mutations.length === 0) return sanatize(sequence);
  // put em's around mutated characters, mutations happen in order
  let formattedSequence = sequence.split("");
  mutations.forEach((mutation) => {
    let { index, mutationType, mutation: mutationString } = mutation;
    mutationString = sanatize(mutationString);
    formattedSequence[index] = mutationType !== "delete" ? `<em>${mutationString}</em>` :  "<em>_</em>" ;
  });
  // sanatize any non-mutated characters
  formattedSequence = formattedSequence.map((char) => {
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return char;
  });
  return formattedSequence.join("");
}

/**
 * Creates a tree from the given data.
 * @param {Array<Object>} data - array of objected with a name, sequence, and children.
 * @return {HTMLElement} the root element of the created tree structure.
 */
function makeTree(data) {
  const rootList = document.createElement('ul');
  rootList.classList.add('tree-root');
  data.forEach(item => {
    const listItem = document.createElement('li');
    listItem.classList.add('tree-item');
    const itemSpan = listItem.appendChild(document.createElement('span'));
    itemSpan.classList.add('tree-item-content');
    const itemName = itemSpan.appendChild(document.createElement('span'));
    const itemSequence = itemSpan.appendChild(document.createElement('span'));
    itemName.textContent = item.name;
    itemSequence.innerHTML = formatMutationSequence(item.sequence, item.mutations);
    itemSpan.appendChild(itemName);
    itemSpan.appendChild(itemSequence);
    if (item.children) {
      listItem.appendChild(makeTree(item.children));
    }
    rootList.appendChild(listItem);
  });
  return rootList;
}

/**
 * Collects all leaf node sequences from a mutation tree.
 * A leaf is defined as a node with no children.
 * 
 * @param {Array<Object>} data - Array of mutation tree nodes, each with a sequence and optional children.
 * @returns {Array<string>} Array of sequences from all leaf nodes.
 */
function collectLeafSequences(data) {
  const leaves = [];

  function dfs(nodeList) {
    nodeList.forEach(node => {
      if (!node.children || node.children.length === 0) {
        leaves.push(node.sequence);
      } else {
        dfs(node.children);
      }
    });
  }

  dfs(data);
  return leaves;
}


export {
  makeTree,
  formatMutationSequence,
  collectLeafSequences
}
