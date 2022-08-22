// imports
const { ethers, run, network } = require("hardhat");
const { name, symbol, maxTotalSupply, maxPerWallet } = require("../variables");
const fs = require("fs");
// async main
async function main() {
  let nft = await deploy();
  // Verification
  if (network.config.chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    saveContractAddress(network.config.chainId, nft.address);
    console.log("Waiting for block confirmations...");
    await nft.deployTransaction.wait(6);
    await verify(nft.address, [name, symbol, maxTotalSupply, maxPerWallet]);
  }
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

// async function verify(contractAddress, args) {
const verify = async (contractAddress, args) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!");
    } else {
      console.log(error);
    }
  }
};

const saveContractAddress = (chainId, address) => {
  let data = fs.readFileSync("deployed_contracts.json", "utf8");
  let obj = JSON.parse(data);
  obj[chainId] = address;
  fs.writeFileSync("deployed_contracts.json", JSON.stringify(obj));
};

// main
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
