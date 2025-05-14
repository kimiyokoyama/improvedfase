/**
 * Applies mutations to an original sequence to generate the correct mutated result.
 * Handles swap, delete, and insert operations.
 * @param {string} originalSequence - The unmutated root sequence
 * @param {Array<Object>} mutations - Array of mutation objects (index, mutationType, mutation)
 * @returns {string} - The mutated sequence
 */
function applyMutations(originalSequence, mutations) {
  let sequence = originalSequence.split("");

  for (let i = 0; i < mutations.length; i++) {
    const { index, mutationType, mutation } = mutations[i];

    if (mutationType === "swap") {
      if (index >= 0 && index < sequence.length) {
        sequence[index] = mutation;
      }
    } else if (mutationType === "delete") {
      if (index >= 0 && index < sequence.length) {
        sequence.splice(index, 1);
      }
    } else if (mutationType === "insert") {
      if (index >= 0 && index <= sequence.length) {
        sequence.splice(index, 0, ...mutation.split(""));
      }
    }
  }
  return sequence.join("");
}


/**
 * Formats a sequence with mutations by wrapping mutated characters in em tags.
 * @param {string} sequence - the original sequence to be formatted
 * @param {Array<Object>} mutations - an array of mutation objects with index, mutationType, and mutation
 * @return {string} the formatted sequence with mutated characters wrapped in em tags
 */
function formatMutationSequence(sequence, mutations) {
  const sanatize = (s) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (!mutations || mutations.length === 0) return sanatize(sequence);

  let formatted = sequence.split("");
  let offset = 0;

  mutations.forEach(({ index, mutationType, mutation }) => {
    const adjIndex = index + offset;

    if (mutationType === "delete") {
      formatted.splice(adjIndex, 1, "<em>_</em>");
    }
    else if (mutationType === "swap") {
      formatted[adjIndex] = `<em>${sanatize(mutation)}</em>`;
    }
    else if (mutationType === "insert") {
      const originalChar = formatted[adjIndex];
      const chars = mutation.split("");

      const formattedChars = chars.map((char, i) => {
        // Only highlight if it's not just repeating the original character
        if (i === 0 && char === originalChar) return sanatize(char);
        return `<em>${sanatize(char)}</em>`;
      });

      formatted.splice(adjIndex, 1, ...formattedChars);
      offset += chars.length - 1;
    }
  });

  return formatted.map(char => {
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return char;
  }).join("");
}

/**
 * Creates a tree from the given data.
 * @param {Array<Object>} data - array of objected with a name, sequence, and children.
 * @param {string} originalSequence - The root sequence used to reconstruct and format mutations.
 * @return {HTMLElement} the root element of the created tree structure.
 */
function makeTree(data, originalSequence) {
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
    if (!originalSequence) {
      throw new Error("originalSequence is undefined in makeTree()");
    }    
    itemSequence.innerHTML = applyAndFormatMutations(originalSequence, item.mutations);
    itemSpan.appendChild(itemName);
    itemSpan.appendChild(itemSequence);
    if (item.children) {
      listItem.appendChild(makeTree(item.children, originalSequence));
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
function collectLeafSequences(data, originalSequence) {
  const leaves = [];

  function dfs(nodeList) {
    nodeList.forEach(node => {
      if (!node.children || node.children.length === 0) {
        const corrected = applyMutations(originalSequence, node.mutations || []);
        const cleaned = corrected.replace(/_/g, ''); // optional: remove placeholder deletions
        leaves.push(cleaned);
      } else {
        dfs(node.children);
      }
    });
  }

  dfs(data);
  return leaves;
}

/**
 * Applies mutations to an original sequence while formatting mutations for display.
 * Ensures insertion/splice offset is tracked and only mutated characters are highlighted.
 * @param {string} originalSequence - The starting sequence
 * @param {Array<Object>} mutations - The list of mutations (index, mutation, mutationType)
 * @returns {string} - HTML-formatted sequence string
 */
function applyAndFormatMutations(originalSequence, mutations) {
  const sanitize = (s) => (s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let sequence = originalSequence.split("");
  let formatted = [];
  let offset = 0;

  for (let i = 0; i < mutations.length; i++) {
    const { index, mutationType, mutation } = mutations[i];
    const adjIndex = index + offset;

    if (mutationType === "swap") {
      sequence[adjIndex] = mutation;
      formatted[adjIndex] = `<em>${mutation}</em>`;
    }

    else if (mutationType === "delete") {
      sequence.splice(adjIndex, 1);
      formatted.splice(adjIndex, 1);
      offset -= 1;
    }

    else if (mutationType === "insert") {
      const chars = mutation.split("");
      formatted[adjIndex] = `<em>${chars[0]}</em>`;
      for (let j = 0; j < chars.length; j++) {
        sequence.splice(adjIndex + j, 1, chars[j]);
        formatted.splice(adjIndex + j, 1, `<em>${chars[j]}</em>`);
      }
      offset += chars.length;
    }
  }

  // Sanitize and fill in unformatted characters
  for (let i = 0; i < sequence.length; i++) {
    if (!formatted[i]) {
      formatted[i] = sanitize(sequence[i]);
    }
  }


  return formatted.join("");
}

export {
  applyMutations,
  makeTree,
  formatMutationSequence,
  collectLeafSequences
}
