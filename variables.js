const { ethers } = require("hardhat");
/*
In this file, you can specify all the variables that are necessary 
to deploy the contract on the network
*/

// This variable is responsible for the name of the project.
// For example "Bored Ape Yacht Club"
const name = "Test";
// This variable is responsible for the symbol of the project.
// For example "BAYC"
const symbol = "tst";
// This variable is responsible for the maximum number of
// tokens that can be minted.
const maxTotalSupply = 3333;
// This variable is responsible for the maximum number of
// tokens that a user can mint.
const maxPerWallet = 2;
// These variables are responsible for the prices
// you want to set for different phases of the mint
const allowlistPrice = ethers.utils.parseEther("0.003");
const publicPrice = ethers.utils.parseEther("0.009");
// Number of tokens you want to mint for a team
const tresuareAmount = 100;
// This variable must be assigned the base URI
const baseURI = "google.com/";
// Whitelist addresses. Either the names of the
// file in which they are located (the file must be
// in the root of the project), or an array with addresses.
whitelist = "merkle_scripts/whitelist_address.txt";
// or ['0x5B38Da6a701c568545dCfcB03FcB875f56beddC4','0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2'...]

// Allowlist addresses.
allowlist = "merkle_scripts/allowlist_address.txt";
// or ['0x5B38Da6a701c568545dCfcB03FcB875f56beddC4','0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2'...]
module.exports = {
  name,
  symbol,
  maxTotalSupply,
  maxPerWallet,
  allowlistPrice,
  publicPrice,
  tresuareAmount,
  baseURI,
  whitelist,
  allowlist,
};
