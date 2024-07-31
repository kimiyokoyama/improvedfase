import { mutateAminoAcid, mutateNucleotide, mutateSequence } from "./modules/mutators.js";
import { getThemeIconData, setupTheme, toggleTheme } from "./modules/theme.js";
import { makeTree } from "./modules/treeview.js";
/**
 * What type of generation to use (and display)
 * @type {"tree" | "mutator"}
 * @default "tree"
 */
let generationType = "tree";
/**
 * The sequence type to be mutated
 * @type {"peptide" | "nucleotide"}
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
 * Generates a mutation list based on a given sequence and mutation function
 * @param {string} sequence - the sequence to be mutated.
 * @param {(string) => string} mutateFn - the function used to mutate a single nucleotide
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

function formatMutationSequence(sequence, mutations) {
  // put em's around mutated characters, mutations happen in order
  let formattedSequence = sequence.split("");
  mutations.forEach((mutation) => {
    const { index, mutationType, mutation: mutationString } = mutation;
    // for now, deletes are just empty strings
    formattedSequence[index] = mutationType !== "delete" ? `<em>${mutationString}</em>` :  "<em></em>" ;
  });
  return formattedSequence.join("");
}

function renderMutationList(mutationListElement, sequence) {
  mutationListElement.innerHTML = "";
  const mutationFunction = sequenceType === "peptide" ? mutateAminoAcid : mutateNucleotide;
  const mutations = generateMutationList(sequence, mutationFunction, divergencePercentage, maxChildren);
  // for each mutation, add the previous mutations to its own mutation list
  const modifiedMutations = [...mutations];
  modifiedMutations.slice(1).forEach((mutation, i) => {
    mutation.mutations = [...modifiedMutations[i].mutations, ...mutation.mutations];
  });
  // render original sequence
  const originalSequenceElement = document.createElement("div");
  originalSequenceElement.innerHTML = `>Sequence.${sequence.slice(0, 3)}:<br>${sequence}`;
  mutationListElement.appendChild(originalSequenceElement);
  // render each mutation
  modifiedMutations.forEach((mutation, i) => {
    const mutationElement = document.createElement("div");
    // first three chars in new sequence are the name
    mutationElement.innerHTML = `
      >Sequence.${mutation.sequence.slice(0, 3)}${i}:<br>
      ${formatMutationSequence(sequence, mutation.mutations)}`;
    mutationListElement.appendChild(mutationElement);
  });
}

function generateTreeData(depth, sequence) {
  // choose random child count from 0 to maxChildren
  // recurse until depth is 0
  if (depth === 0) {
    return { name: sequence };
  }
  const mutationFunction = sequenceType === "peptide" ? mutateAminoAcid : mutateNucleotide;
  const currentMaxChildren = Math.floor(Math.random() * maxChildren);
  const mutations = generateMutationList(sequence, mutationFunction, divergencePercentage, currentMaxChildren);
  const tempChildren = mutations.map((mutation) => generateTreeData(depth - 1, mutation.sequence));
  return {
    name: sequence,
    children: tempChildren,
  };
}

function renderTree(treeElement) {
  treeElement.innerHTML = "";
  const newData = generateTreeData(maxChildren, originalSequence);
  const printSequences = (node) => {
    if (node.children) {
      node.children.forEach((child) => {
        printSequences(child);
      });

    }
    console.log(node.name);
  }
  treeData = newData;
  printSequences(newData);
  tree = makeTree(treeData);
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
  // generation type
  const generationTypeFieldset = document.getElementById("generation-type");
  setupRadioGroup(generationTypeFieldset, (value) => {
    if (value) generationType = value;
    return generationType;
  });
  // sequence type
  const sequenceTypeFieldset = document.getElementById("sequence-type");
  setupRadioGroup(sequenceTypeFieldset, (value) => {
    if (value) sequenceType = value;
    return sequenceType;
  });

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
  const mutuateForm = document.getElementById("mutate-form");
  mutuateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    originalSequence = originalSequence.toUpperCase();
    if (generationType === "mutator") {
      renderMutationList(mutationList, originalSequence);
    } else {
      renderTree(mutationList, originalSequence);
    }
  });

  // --- theme events ---
  setupTheme();
  document.getElementById("theme-icon-path").setAttribute("d", getThemeIconData());

  document.getElementById("theme-toggle").addEventListener("click", () => {
    toggleTheme();
    document.getElementById("theme-icon-path").setAttribute("d", getThemeIconData());
  });
}

main();
