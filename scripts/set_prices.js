// imports
const { ethers, network } = require("hardhat");
const {
  name,
  symbol,
  maxTotalSupply,
  maxPerWallet,
  allowlistPrice,
  publicPrice,
} = require("../variables");
const fs = require("fs");

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
  console.log("Set price for allowlisters...");
  const transactionAl = await nft.setAllowlistPrice(allowlistPrice);
  await transactionAl.wait();
  console.log("Done!");
  console.log("Set price for public sale...");
  const transactionPb = await nft.setPublicPrice(publicPrice);
  await transactionPb.wait();
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
