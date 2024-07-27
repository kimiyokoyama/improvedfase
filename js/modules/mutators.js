/**
 * Returns a random item from an array
 * @param {Array<any>} arr - array of items
 * @returns {any} random item from the array
 */
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
/**
 * Denotes common nucleotide swaps
 * @type {Object.<string, string[]>}
 */
const NUCLEOTIDE_COMMON_SWAP = {
  "A": ["G"],
  "C": ["T"],
  "G": ["A"],
  "T": ["C"],
  "N": ["A", "C", "G", "T"],
}
/**
 * Denotes rarer nucleotide swaps
 * @type {Object.<string, string[]>}
 */
const NUCLEOTIDE_ALT_SWAP = {
  "A": ["C", "T"],
  "C": ["A", "G"],
  "G": ["C", "T"],
  "T": ["A", "G"],
  "N": ["A", "C", "G", "T"],
}
/**
 * Relative occurence of amino acid swaps based on BLOSUM62 matrix
 * @type {Object.<string, Object.<string, number>>}
 */
const BLOSUM62_MODIFIED = {
  "A": { "A": 0, "R": 3, "N": 2, "D": 2, "C": 4, "Q": 3, "E": 3, "G": 4, "H": 2, "I": 3, "L": 3, "K": 3, "M": 3, "F": 2, "P": 3, "S": 5, "T": 4, "W": 1, "Y": 2, "V": 4 },
  "R": { "A": 3, "R": 0, "N": 4, "D": 2, "C": 1, "Q": 3, "E": 5, "G": 4, "H": 2, "I": 1, "L": 2, "K": 6, "M": 3, "F": 1, "P": 2, "S": 3, "T": 3, "W": 1, "Y": 2, "V": 1 },
  "N": { "A": 0, "R": 3, "N": 2, "D": 2, "C": 4, "Q": 3, "E": 3, "G": 4, "H": 2, "I": 3, "L": 3, "K": 3, "M": 3, "F": 2, "P": 3, "S": 5, "T": 4, "W": 1, "Y": 2, "V": 4 },
  "D": { "A": 3, "R": 3, "N": 5, "D": 0, "C": 2, "Q": 5, "E": 7, "G": 4, "H": 4, "I": 2, "L": 1, "K": 4, "M": 2, "F": 2, "P": 4, "S": 5, "T": 4, "W": 1, "Y": 2, "V": 2 },
  "C": { "A": 5, "R": 2, "N": 2, "D": 3, "C": 0, "Q": 2, "E": 1, "G": 2, "H": 2, "I": 4, "L": 4, "K": 2, "M": 4, "F": 3, "P": 2, "S": 4, "T": 4, "W": 3, "Y": 3, "V": 4 },
  "Q": { "A": 3, "R": 5, "N": 4, "D": 4, "C": 1, "Q": 0, "E": 6, "G": 2, "H": 4, "I": 1, "L": 2, "K": 5, "M": 4, "F": 1, "P": 3, "S": 4, "T": 3, "W": 2, "Y": 3, "V": 2 },
  "E": { "A": 4, "R": 5, "N": 5, "D": 7, "C": 1, "Q": 7, "E": 0, "G": 3, "H": 5, "I": 2, "L": 2, "K": 6, "M": 3, "F": 2, "P": 4, "S": 5, "T": 4, "W": 2, "Y": 3, "V": 3 },
  "G": { "A": 5, "R": 3, "N": 5, "D": 4, "C": 4, "Q": 3, "E": 3, "G": 0, "H": 3, "I": 1, "L": 1, "K": 3, "M": 2, "F": 2, "P": 3, "S": 5, "T": 3, "W": 3, "Y": 2, "V": 2 },
  "H": { "A": 2, "R": 4, "N": 5, "D": 3, "C": 1, "Q": 4, "E": 4, "G": 2, "H": 0, "I": 1, "L": 1, "K": 3, "M": 2, "F": 3, "P": 2, "S": 3, "T": 2, "W": 2, "Y": 6, "V": 1 },
  "I": { "A": 4, "R": 2, "N": 2, "D": 2, "C": 4, "Q": 2, "E": 2, "G": 1, "H": 2, "I": 0, "L": 7, "K": 2, "M": 6, "F": 5, "P": 2, "S": 3, "T": 4, "W": 2, "Y": 4, "V": 8 },
  "L": { "A": 4, "R": 3, "N": 2, "D": 1, "C": 4, "Q": 3, "E": 2, "G": 1, "H": 2, "I": 7, "L": 0, "K": 3, "M": 7, "F": 5, "P": 2, "S": 3, "T": 4, "W": 3, "Y": 4, "V": 6 },
  "K": { "A": 3, "R": 6, "N": 4, "D": 1, "C": 3, "Q": 5, "E": 5, "G": 2, "H": 3, "I": 1, "L": 2, "K": 0, "M": 3, "F": 1, "P": 3, "S": 4, "T": 3, "W": 1, "Y": 2, "V": 2 },
  "M": { "A": 2, "R": 2, "N": 1, "D": 0, "C": 4, "Q": 3, "E": 1, "G": 0, "H": 1, "I": 4, "L": 5, "K": 2, "M": 0, "F": 3, "P": 1, "S": 2, "T": 2, "W": 2, "Y": 2, "V": 4 },
  "F": { "A": 3, "R": 2, "N": 2, "D": 2, "C": 3, "Q": 2, "E": 2, "G": 2, "H": 4, "I": 5, "L": 5, "K": 2, "M": 5, "F": 0, "P": 1, "S": 3, "T": 3, "W": 6, "Y": 8, "V": 4 },
  "P": { "A": 4, "R": 3, "N": 3, "D": 4, "C": 2, "Q": 4, "E": 4, "G": 3, "H": 3, "I": 2, "L": 2, "K": 4, "M": 7, "F": 1, "P": 0, "S": 4, "T": 4, "W": 1, "Y": 2, "V": 3 },
  "S": { "A": 5, "R": 3, "N": 5, "D": 4, "C": 3, "Q": 4, "E": 4, "G": 4, "H": 3, "I": 2, "L": 2, "K": 4, "M": 3, "F": 2, "P": 3, "S": 0, "T": 5, "W": 1, "Y": 2, "V": 2 },
  "T": { "A": 3, "R": 2, "N": 3, "D": 2, "C": 2, "Q": 2, "E": 2, "G": 1, "H": 1, "I": 2, "L": 2, "K": 2, "M": 1, "F": 2, "P": 2, "S": 4, "T": 0, "W": 1, "Y": 1, "V": 3 },
  "W": { "A": 2, "R": 2, "N": 2, "D": 1, "C": 2, "Q": 3, "E": 2, "G": 1, "H": 6, "I": 3, "L": 3, "K": 2, "M": 3, "F": 7, "P": 1, "S": 2, "T": 2, "W": 6, "Y": 0, "V": 3 },
  "Y": { "A": 2, "R": 2, "N": 2, "D": 1, "C": 2, "Q": 3, "E": 2, "G": 1, "H": 6, "I": 3, "L": 3, "K": 2, "M": 3, "F": 7, "P": 1, "S": 2, "T": 2, "W": 6, "Y": 0, "V": 3 },
  "V": { "A": 4, "R": 1, "N": 1, "D": 1, "C": 3, "Q": 2, "E": 2, "G": 1, "H": 1, "I": 7, "L": 5, "K": 2, "M": 5, "F": 3, "P": 2, "S": 2, "T": 4, "W": 1, "Y": 3, "V": 0 },
}
/**
 * Swaps, deletes, or inserts adjacent to a nucleotide,
 * based on rates from {@link http://www.ncbi.nlm.nih.gov/pmc/articles/PMC203328/}
 * @param {string} nucleotide - amino acid which will be acted on
 * @returns {string} new nucleotide
 */
function mutateNucleotide(nucleotide) {
  nucleotide = nucleotide.toUpperCase();
  // 0.1 chance of indels
  if (Math.random() < 0.1) {
    if (Math.random() < 0.5) {
      return "";
    } else {
      // original nucleotide has random ACGT added to the end
      return nucleotide + randomItem(["A", "C", "G", "T"]);
    }
  }
  // if not a swap key, return the original nucleotide
  if (!NUCLEOTIDE_COMMON_SWAP.hasOwnProperty(nucleotide)) {
    return nucleotide;
  }
  // 2/3 chance of common swap, 1/3 chance of alt swap
  if (Math.random() < 2/3) {
    return randomItem(NUCLEOTIDE_COMMON_SWAP[nucleotide]);
  } else {
    return randomItem(NUCLEOTIDE_ALT_SWAP[nucleotide]);
  }
}
/**
 * Swaps, deletes, or inserts adjacent to an amino acid,
 * estimated rates from {@link http://gbe.oxfordjournals.org/content/7/6/1815.full.pdf+html}
 * @param {string} aminoAcid - amino acid which will be acted on
 * @returns {string} new amino acid
 */
function mutateAminoAcid(aminoAcid) {
  // small chance of indels
  if (Math.random() < 0.075) {
    if (Math.random() < 0.5) {
      return "";
    } else {
      // original amino acid has random amino acid added to the end
      return aminoAcid + randomItem(Object.keys(BLOSUM62_MODIFIED));
    }
  }
  // if not a swap key, return fairly random amino acid
  if (!BLOSUM62_MODIFIED.hasOwnProperty(aminoAcid)) {
    return randomItem(["A", "R", "N", "D", "C", "Q", "E", "G", "H", "I", "L", "K", "M", "F", "P", "S", "T", "W", "Y", "V"]);
  }

  const aminoAcidFrequencySum = Object.values(BLOSUM62_MODIFIED[aminoAcid]).reduce((a, b) => a + b);
  const randomNum = Math.random() * aminoAcidFrequencySum;

  let sum = 0;
  const result = Object.entries(BLOSUM62_MODIFIED[aminoAcid]).find(([key, value]) => {
    sum += value;
    return sum >= randomNum;
  });

  return result ? result[0] : aminoAcid;
}

/**
 * Mutates a sequence
 * @param {string} sequence - sequence to be mutated
 * @param {(string) => string} mutateFn - function to mutate a single nucleotide
 * @param {number} divergencePercentage - percentage of the sequence to be mutated
 */
function mutateSequence(sequence, mutateFn, divergencePercentage) {
  if (sequence.length < 1) return sequence;
  const sequenceArray = sequence.split("");
  const numMutations = Math.max(1, Math.floor(sequenceArray.length * divergencePercentage));
  for (let i = 0; i < numMutations; i++) {
    const index = Math.floor(Math.random() * sequenceArray.length);
    // replace index with mutation
    sequenceArray.splice(index, 1, ...mutateFn(sequenceArray[index]));
  }
  return sequenceArray.join("");
}

export {
  mutateNucleotide,
  mutateAminoAcid,
  mutateSequence,
};
