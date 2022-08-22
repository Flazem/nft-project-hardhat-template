// imports
const { ethers, network } = require("hardhat");
const {
  name,
  symbol,
  maxTotalSupply,
  maxPerWallet,
  whitelist,
  allowlist,
} = require("../variables");
const fs = require("fs");
const merkle = require("../merkle_scripts/merkleProof");
async function main() {
  let contractAddress;
  // get current address
  // if a testnet was selected, then the contract is deployed
  if (network.config.chainId === 31337) {
    contractAddress = (await deploy()).address;
  } else {
    let data = fs.readFileSync("deployed_contracts.json", "utf8");
    contractAddress = JSON.parse(data)[network.config.chainId];
  }
  const nft = await ethers.getContractAt("NFT", contractAddress);
  console.log(`Got contract NFT at ${nft.address}`);
  console.log("Got roothash for whitelisters...");
  let rootHashWl = "0x" + merkle.rootHash(whitelist);
  const transactionWl = await nft.setMerkleRootWhitelist(rootHashWl);
  await transactionWl.wait();
  console.log("Done!");
  console.log("Got roothash for allowlisters...");
  let rootHashAl = "0x" + merkle.rootHash(allowlist);
  const transactionAl = await nft.setMerkleRootAllowlist(rootHashAl);
  await transactionAl.wait();
  console.log("Done!");
}

async function deploy() {
  const NFTContract = await ethers.getContractFactory("NFT");
  console.log("Deploying contract...");
  const NFT = await NFTContract.deploy(
    name,
    symbol,
    maxTotalSupply,
    maxPerWallet
  );
  await NFT.deployed();
  return NFT;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
