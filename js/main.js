import { mutateAminoAcid, mutateNucleotide, mutateSequence } from "./modules/mutators.js";
import { getThemeIconData, setupTheme, toggleTheme } from "./modules/theme.js";

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
let sequence = "";
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
 * Generates a mutation list based on a given sequence and mutation function
 * @param {string} sequence - the sequence to be mutated.
 * @param {(string) => string} mutateFn - the function used to mutate a single nucleotide
 * @param {number} divergencePercentage - the percentage of the sequence to be mutated
 * @param {number} maxChildren - the maximum number of children in the mutation list
 * @return {Array} the mutation list, condensed if it exceeds the maximum number of children
 */
function generateMutationList(sequence, mutateFn, divergencePercentage, maxChildren) {
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
    formattedSequence[index] = mutationType === "delete" ? "<em>_</em>" : `<em>${mutationString}</em>`;
  });
  return formattedSequence.join("");
}

function main() {
  // --- form events ---
  // sequence type
  const sequenceTypeFieldset = document.getElementById("sequence-type");
  const sequenceTypeRadios = sequenceTypeFieldset.querySelectorAll("input[type='radio']");
  sequenceTypeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      sequenceType = e.target.value;
    });
  });
  // set default value, find by value
  sequenceTypeRadios.forEach((radio) => {
    if (radio.value === sequenceType) {
      radio.checked = true;
    }
  });

  // sequence input
  const sequenceInput = document.getElementById("sequence");
  sequenceInput.addEventListener("input", (e) => {
    sequence = e.target.value;
    sequenceInput.style.height = "";
    sequenceInput.style.height = `${Math.min(sequenceInput.scrollHeight, 200)}px`;
  });
  sequenceInput.value = sequence;

  // divergence percentage
  const divergencePercentageRange = document.getElementById("divergence-percentage");
  const divergencePercentageInput = document.getElementById("divergence-percentage-value");
  const divergenceChange = (e) => {
    divergencePercentage = e.target.value;
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
    maxChildren = e.target.value;
  });
  maxChildrenInput.value = maxChildren;

  // mutation list display on form submit
  const mutationList = document.getElementById("mutation-list");
  const mutuateForm = document.getElementById("mutate-form");
  mutuateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    mutationList.innerHTML = "";
    const mutationFunction = sequenceType === "peptide" ? mutateAminoAcid : mutateNucleotide;
    const mutations = generateMutationList(sequence, mutationFunction, divergencePercentage, maxChildren);
    // for each mutation, add the previous mutations to its own mutation list
    const modifiedMutations = [...mutations];
    modifiedMutations.slice(1).forEach((mutation, i) => {
      mutation.mutations = [...modifiedMutations[i].mutations, ...mutation.mutations];
    });

    modifiedMutations.forEach((mutation, i) => {
      const mutationElement = document.createElement("li");
      mutationElement.innerHTML = `
        <b>Mutation ${i + 1}</b>: ${mutation.mutations.map((m) => `(${m.index}, ${m.mutation}, ${m.mutationType})`).join(", ")}<br>
        <i>Result</i>: ${formatMutationSequence(sequence, mutation.mutations)}<br>`;
      mutationList.appendChild(mutationElement);
    });
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
