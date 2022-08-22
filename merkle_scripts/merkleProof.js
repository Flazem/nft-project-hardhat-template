const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require("fs");

const makeMerkleTree = (data) => {
  if (typeof data === typeof "") {
    // get addresses from file
    let addresses = fs.readFileSync(data, "utf8").split("\n");
    // Hash leaves
    let leaves = addresses.map((addr) => keccak256(addr));
    // Create tree
    let merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    //let rootHash = merkleTree.getRoot().toString("hex");
    return merkleTree;
  } else if (typeof data == typeof []) {
    // Hash leaves
    let leaves = data.map((addr) => keccak256(addr));
    // Create tree
    let merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    //let rootHash = merkleTree.getRoot().toString("hex");
    return merkleTree;
  } else {
    throw "Invalid input data. You need to pass the file name or an array.";
  }
};

const rootHash = (data) => makeMerkleTree(data).getRoot().toString("hex");

const getProofForAddress = (address, data) =>
  makeMerkleTree(data).getHexProof(keccak256(address));

/*
console.log(makeMerkleTree("whitelist_address.txt").toString("hex"));
console.log(rootHash("whitelist_address.txt"));

console.log(
  getProofForAddress(
    "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
    "whitelist_address.txt"
  )
);
*/
module.exports = { rootHash, getProofForAddress };
