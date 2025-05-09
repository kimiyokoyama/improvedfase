import { mutateAminoAcid, mutateNucleotide, mutateSequence } from "./modules/mutators.js";
import { getThemeIconData, setupTheme, toggleTheme } from "./modules/theme.js";
import { makeTree, formatMutationSequence } from "./modules/treeview.js";
import DropdownButton from "./modules/dropdownButton.js";
/**
 * What type of generation to use (and display)
 * @type {"tree" | "mutator"}
 * @default "tree"
 */
let generationType = "tree";
/**
 * The sequence type to be mutated
 * @type {"peptide"}
 * @default "peptide"
 */
let sequenceType = "peptide";
/**
 * The sequence to be mutated
 * @type {string}
 * @default ""
 */
let originalSequence = "";
/**
 * The maximum number of children per parent sequence
 * @type {number}
 * @default 2
 */
let maxChildren = 2;
/**
 * The depth of the tree to be generated
 * @type {number}
 * @default 3
 */
let generationDepth = 3;
/**
 * The percentage of the sequence to be mutated
 * @type {number}
 * @default 0.1
 */
let divergencePercentage = 0.1;
/**
 * The tree object to be rendered
 * @type {HTMLElement | null}
 */
let tree = null;
/**
 * The tree data to be rendered
 * @type {Object | null}
 */
let treeData = null;
/**
 * List of all sequences currently displayed, used for exporting
 * @type {Array<{name: string, sequence: string}>}
 */
let displayedSequences = [];
/**
 * Current fullscreen state
 * @type {boolean}
 */
let mainIsFullscreen = false;
/**
 * The export dropdown button
 * @type {DropdownButton}
 */
let exportDropdown = new DropdownButton(document.getElementById("export-button"), [
  { text: "Export as FASTA", callback: () => exportToFASTA() },
  { text: "Open data in new tab", link: true, callback: () => exportToNewTab() },
], { closeOnClick: true, above: false, left: true });

/**
 * Generates a mutation list based on a given sequence and mutation function
 * @param {string} sequence - the sequence to be mutated.
 * @param {(string) => string} mutateFn - the function used to mutate a single base
 * @param {number} divergencePercentage - the percentage of the sequence to be mutated
 * @param {number} maxChildren - the maximum number of children in the mutation list
 * @return {Array} the mutation list, condensed if it exceeds the maximum number of children
 */
function generateMutationList(sequence, mutateFn, divergencePercentage, maxChildren) {
  if (maxChildren < 1) { return []; }
  const { sequence: mutatedSequence, mutationList } = mutateSequence(sequence, mutateFn, divergencePercentage);

  // if more than maxChildren, condense the list to fit (flatten the mutations into last one)
  if (mutationList.length > maxChildren) {
    let condensedMutationList = [...mutationList.slice(0, maxChildren - 1)];
    let lastMutation = {
      mutations: mutationList.slice(maxChildren - 1).map((m) => m.mutations).flat(),
      sequence: mutatedSequence,
    }
    condensedMutationList.push(lastMutation);
    return condensedMutationList;
  }

  return mutationList;
}

function sanatize(s) {
  return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMutationList(mutationListElement, sequence) {
  const mutationFunction = sequenceType === "peptide" ? mutateAminoAcid : mutateNucleotide;
  const mutations = generateMutationList(sequence, mutationFunction, divergencePercentage, maxChildren);
  // for each mutation, add the previous mutations to its own mutation list
  const modifiedMutations = [...mutations];
  modifiedMutations.slice(1).forEach((mutation, i) => {
    mutation.mutations = [...modifiedMutations[i].mutations, ...mutation.mutations];
  });
  // render original sequence
  const originalSequenceElement = document.createElement("pre");
  originalSequenceElement.textContent = `>Sequence.${sequence.slice(0, 3)}:\r\n${sequence}`;
  mutationListElement.appendChild(originalSequenceElement);
  displayedSequences = [{ name: `Sequence.${sequence.slice(0, 3)}`, sequence }];
  // render each mutation
  modifiedMutations.forEach((mutation, i) => {
    const mutationElement = document.createElement("pre");
    // first three chars in new sequence are the name
    mutationElement.innerHTML = sanatize(`>Sequence.${mutation.sequence.slice(0, 3)}${i}:\r\n`) + `${formatMutationSequence(sequence, mutation.mutations)}`;
    mutationListElement.appendChild(mutationElement);
    displayedSequences.push({ name: `Sequence.${mutation.sequence.slice(0, 3)}${i}`, sequence: mutation.sequence });
  });
}

function exportToFASTA() {
  if (displayedSequences.length === 0) return;
  const fasta = displayedSequences.map((sequence) => `>${sequence.name}\n${sequence.sequence}`).join("\n");
  const blob = new Blob([fasta], { type: "text/plain" });
  // download the file using a temporary link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sequences.fasta";
  a.click();
  URL.revokeObjectURL(url);
}

function exportToNewTab() {
  if (displayedSequences.length === 0) return;
  const fasta = displayedSequences.map((sequence) => `>${sequence.name}\n${sequence.sequence}`).join("\n");
  const blob = new Blob([fasta], { type: "text/plain" });
  // open a new tab with the file
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

// use excel-like column names, i.e. Z then AA then AB
function numToChars(num) {
  let chars = "";
  while (num >= 0) {
    chars = String.fromCharCode(num % 26 + 65) + chars;
    num = Math.floor(num / 26) - 1;
  }
  return chars;
}

function generateTreeData(depth, sequence, i = 0, mutationList = []) {
  // choose random child count from 0 to maxChildren
  // recurse until depth is 0
  if (depth === 0) {
    return { sequence, mutations: mutationList };
  }
  const mutationFunction = sequenceType === "peptide" ? mutateAminoAcid : mutateNucleotide;
  const currentMaxChildren = Math.floor(Math.random() * maxChildren) + 1;
  const children = [];
  for (let j = 0; j < currentMaxChildren; j++) {
    const { sequence: childSequence, mutationList: childMutations } = mutateSequence(sequence, mutationFunction, divergencePercentage);
    children.push(generateTreeData(
      depth - 1,
      childSequence,
      i * maxChildren + j,
      [...mutationList, ...childMutations.flatMap(m => m.mutations)]
    ));
  }
  return {
    sequence,
    mutations: mutationList,
    children
  };
}

function renderTree(treeElement) {
  const newData = generateTreeData(generationDepth, originalSequence);
  let nodeNum = 0;
  displayedSequences = [];
  const updateSequences = (node, childNum = 0) => {
    node.name = `Sequence.${nodeNum}.${numToChars(childNum)}`;
    displayedSequences.push({ name: `Sequence.${nodeNum}`, sequence: node.sequence });
    nodeNum++;
    if (node.children) {
      node.children.forEach((child, i) => {
        updateSequences(child, i);
      });
    }
  }
  updateSequences(newData);
  treeData = newData;
  tree = makeTree([newData]);
  treeElement.appendChild(tree);
}

function setupRadioGroup(radioGroup, valueFn) {
  const radios = radioGroup.querySelectorAll("input[type='radio']");
  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      valueFn(e.target.value);
    });
  });
  radios.forEach((radio) => {
    if (radio.value === valueFn()) {
      radio.checked = true;
    }
  });
  return radios;
}

function main() {
  // --- form events ---
  // sequence input
  const sequenceInput = document.getElementById("sequence");
  sequenceInput.addEventListener("input", (e) => {
    originalSequence = e.target.value;
    sequenceInput.style.height = "";
    sequenceInput.style.height = `${Math.min(sequenceInput.scrollHeight, 200)}px`;
  });
  sequenceInput.value = originalSequence;

  // divergence percentage
  const divergencePercentageRange = document.getElementById("divergence-percentage");
  const divergencePercentageInput = document.getElementById("divergence-percentage-value");
  const divergenceChange = (e) => {
    divergencePercentage = parseFloat(e.target.value);
    divergencePercentageRange.value = e.target.value;
    divergencePercentageInput.value = e.target.value;
  }
  divergencePercentageRange.addEventListener("input", divergenceChange);
  divergencePercentageInput.addEventListener("input", divergenceChange);
  divergencePercentageRange.value = divergencePercentage;
  divergencePercentageInput.value = divergencePercentage;

  // max children
  const maxChildrenInput = document.getElementById("max-children");
  maxChildrenInput.addEventListener("input", (e) => {
    maxChildren = parseInt(e.target.value);
  });
  maxChildrenInput.value = maxChildren;

  // mutation list display on form submit
  const mutationList = document.getElementById("mutation-list");
  const mutationTree = document.getElementById("mutation-tree");
  const mutuateForm = document.getElementById("mutate-form");
  mutuateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    originalSequence = originalSequence.toUpperCase();
    const noDataMessage = document.getElementById("no-data-message");
    if (noDataMessage) noDataMessage.style.display = "none";
    mutationList.innerHTML = "";
    mutationTree.innerHTML = "";
    renderTree(mutationTree);
  });

  // --- theme events ---
  setupTheme();
  document.getElementById("theme-icon-path").setAttribute("d", getThemeIconData());

  document.getElementById("theme-toggle").addEventListener("click", () => {
    toggleTheme();
    document.getElementById("theme-icon-path").setAttribute("d", getThemeIconData());
  });

  // --- resize events ---
  const separators = document.querySelectorAll(".card-separator");
  separators.forEach((separator) => {
    // if separator has data-horizontal attribute, resize horizontally
    const horizontal = separator.getAttribute("data-horizontal") !== null;
    const previousElement = document.getElementById(separator.getAttribute("data-previous"));
    const nextElement = document.getElementById(separator.getAttribute("data-next"));
    const resize = (e) => {
      // make width of previous element equal to mouse x position and width of next element equal to total width - mouse x position
      const totalWidth = previousElement.offsetWidth + nextElement.offsetWidth;
      const previousWidth = horizontal ? e.clientX : e.clientY;
      const previousElementMinWidth = parseInt(getComputedStyle(previousElement.querySelector(".card-content")).minWidth.replace("px", ""));
      const nextWidth = totalWidth - previousWidth;
      const nextElementMinWidth = parseInt(getComputedStyle(nextElement.querySelector(".card-content")).minWidth.replace("px", ""));
      if (previousWidth < previousElementMinWidth) {
        previousElement.style.width = `${previousElementMinWidth}px`;
        nextElement.style.width = `${totalWidth - previousElementMinWidth}px`;
      } else if (nextWidth < nextElementMinWidth) {
        previousElement.style.width = `${totalWidth - nextElementMinWidth}px`;
        nextElement.style.width = `${nextElementMinWidth}px`;
      }
      else {
        previousElement.style.width = `${previousWidth - 10}px`;
        nextElement.style.width = `${nextWidth + 10}px`;
      }
    }
    separator.addEventListener("mousedown", (e) => {
      e.preventDefault();
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resize);
      }, { once: true });
      // if window is resized, reset the flex basis of the elements
      window.addEventListener("resize", () => {
        previousElement.style.width = "";
        nextElement.style.width = "";
      });
    });
  });

  // --- tree view drag events ---
  const mutationContent = document.getElementById("mutation-content");
  mutationContent.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const initialX = e.pageX - mutationContent.offsetLeft;
    const initialY = e.pageY - mutationContent.offsetTop;
    const initialScrollLeft = mutationContent.scrollLeft;
    const initialScrollTop = mutationContent.scrollTop;
    // set tree to dragging
    mutationTree.style.cursor = "grabbing";
    const handleTreeDrag = (e) => {
      e.preventDefault();
      const currentX = e.pageX - mutationContent.offsetLeft;
      const currentY = e.pageY - mutationContent.offsetTop;
      mutationContent.scrollLeft = Math.max(initialScrollLeft - (currentX - initialX), 0);
      mutationContent.scrollTop = Math.max(initialScrollTop - (currentY - initialY), 0);
    };
    document.addEventListener("mousemove", handleTreeDrag);
    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", handleTreeDrag);
      mutationTree.style.cursor = "";
    }, { once: true })
  });

  // --- main fullscreen events ---
  const fullscreenButton = document.getElementById("main-fullscreen-button");
  fullscreenButton.addEventListener("click", (e) => {
    // select all panels that aren't the main panel (and the separators)
    const panels = document.querySelectorAll(".card-panel:not(#main-panel), .card-separator");
    if (mainIsFullscreen) {
      fullscreenButton.querySelector('path').setAttribute("d", "M6 14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H7v-2c0-.55-.45-1-1-1m0-4c.55 0 1-.45 1-1V7h2c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1m11 7h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1zM14 6c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1");
      panels.forEach((panel) => {
        panel.style.display = "flex";
      });
    } else {
      fullscreenButton.querySelector('path').setAttribute("d", "M6 16h2v2c0 .55.45 1 1 1s1-.45 1-1v-3c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1m2-8H6c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1s-1 .45-1 1zm7 11c.55 0 1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1m1-11V6c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1z");
      panels.forEach((panel) => {
        panel.style.display = "none";
      });
    }
    mainIsFullscreen = !mainIsFullscreen;
  });
}

main();
