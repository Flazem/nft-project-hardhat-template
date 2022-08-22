const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const merkle = require("../merkle_scripts/merkleProof");
const {
  name,
  symbol,
  maxTotalSupply,
  allowlistPrice,
  publicPrice,
  baseURI,
} = require("../variables");

describe("NFT contract", function () {
  async function deployContractFixture() {
    const NFTContract = await ethers.getContractFactory("NFT");
    const NFT = await NFTContract.deploy(name, symbol, maxTotalSupply, 200);
    await NFT.deployed();
    const [owner, account1, account2, ...accounts] = await ethers.getSigners();
    const addresses = accounts.map((acc) => acc.address);

    let rootHashWl = "0x" + merkle.rootHash(addresses);
    const transactionWl = await NFT.setMerkleRootWhitelist(rootHashWl);
    await transactionWl.wait();

    let rootHashAl = "0x" + merkle.rootHash(addresses);
    const transactionAl = await NFT.setMerkleRootAllowlist(rootHashAl);
    await transactionAl.wait();

    let setAlPrice = await NFT.setAllowlistPrice(allowlistPrice);
    await setAlPrice.wait();

    let setPbPrice = await NFT.setPublicPrice(publicPrice);
    await setPbPrice.wait();

    let setBaseUri = await NFT.setBaseURI(baseURI);
    await setBaseUri.wait();

    return { NFT, owner, account1, account2, accounts, addresses };
  }
  /*-----------------------------------------------------------------*/
  describe("Whitelist mint", function () {
    it("Before the start of sales can't mint", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      let proofForAddress = merkle.getProofForAddress(addresses[0], addresses);
      await expect(
        NFT.connect(accounts[0]).mintWhitelist(1, proofForAddress)
      ).to.be.revertedWith("Whitelist mint is closed!");
    });
    it("Check that limit is exceeded", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openWl = await NFT.turnWhitelistMint();
      await openWl.wait();
      let proofForAddress = merkle.getProofForAddress(addresses[0], addresses);
      await expect(
        NFT.connect(accounts[0]).mintWhitelist(201, proofForAddress)
      ).to.be.revertedWith("You have reached the mint limit per address!");
    });
    it("Check that mint impossible for user not from white list", async function () {
      const { NFT, account1, addresses } = await loadFixture(
        deployContractFixture
      );
      const openWl = await NFT.turnWhitelistMint();
      await openWl.wait();
      let proofForAddress = merkle.getProofForAddress(addresses[0], addresses);
      await expect(
        NFT.connect(account1).mintWhitelist(1, proofForAddress)
      ).to.be.revertedWith("You are not in whitelist!");
    });
    it("Mint for whitelisters is succesful", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openWl = await NFT.turnWhitelistMint();
      await openWl.wait();
      for (let account of accounts) {
        let proofForAddress = merkle.getProofForAddress(
          account.address,
          addresses
        );
        let mintTrans = await NFT.connect(account).mintWhitelist(
          10,
          proofForAddress
        );
        await mintTrans.wait();
      }
      expect(await NFT.ownerOf(1)).to.equal(addresses[0]);
      expect(await NFT.ownerOf(13)).to.equal(addresses[1]);
      expect(await NFT.tokenURI(13)).to.equal(baseURI + "13");
    });

    it("Check that more mint impossible", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openWl = await NFT.turnWhitelistMint();
      await openWl.wait();
      for (let i = 0; i <= 5; i++) {
        let proofForAddress = merkle.getProofForAddress(
          accounts[i].address,
          addresses
        );
        if (i < 5) {
          let mintTrans = await NFT.connect(accounts[i]).mintWhitelist(
            200,
            proofForAddress
          );
          await mintTrans.wait();
        } else {
          await expect(
            NFT.connect(accounts[i]).mintWhitelist(1, proofForAddress)
          ).to.be.revertedWith("Whitelist limit is reached!");
        }
      }
      expect(await NFT.totalSupply()).to.equal(1000);
    });
  });
  /*-----------------------------------------------------------------*/
  describe("Allowlist mint", function () {
    it("Before the start of sales can't mint", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      let proofForAddress = merkle.getProofForAddress(addresses[0], addresses);
      await expect(
        NFT.connect(accounts[0]).mintAllowlist(1, proofForAddress, {
          value: ethers.utils.parseEther("0.003"),
        })
      ).to.be.revertedWith("Allowlist mint is closed!");
    });
    it("Check that limit is exceeded", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openAl = await NFT.turnAllowlistMint();
      await openAl.wait();
      let proofForAddress = merkle.getProofForAddress(addresses[0], addresses);
      await expect(
        NFT.connect(accounts[0]).mintAllowlist(201, proofForAddress, {
          value: ethers.utils.parseEther("1"),
        })
      ).to.be.revertedWith("You have reached the mint limit per address!");
    });
    it("Check that mint impossible for user not from allowlist", async function () {
      const { NFT, account1, addresses } = await loadFixture(
        deployContractFixture
      );
      const openAl = await NFT.turnAllowlistMint();
      await openAl.wait();
      let proofForAddress = merkle.getProofForAddress(addresses[0], addresses);
      await expect(
        NFT.connect(account1).mintAllowlist(1, proofForAddress, {
          value: ethers.utils.parseEther("0.003"),
        })
      ).to.be.revertedWith("You are not in allowlist!");
    });
    it("Check that not enough money", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openAl = await NFT.turnAllowlistMint();
      await openAl.wait();
      let proofForAddress = merkle.getProofForAddress(addresses[0], addresses);
      await expect(
        NFT.connect(accounts[0]).mintAllowlist(1, proofForAddress, {
          value: ethers.utils.parseEther("0.002"),
        })
      ).to.be.revertedWith("Not enough ETH!");
    });
    it("Mint for allowlisters is succesful", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openAl = await NFT.turnAllowlistMint();
      await openAl.wait();
      for (let account of accounts) {
        let proofForAddress = merkle.getProofForAddress(
          account.address,
          addresses
        );
        let mintTrans = await NFT.connect(account).mintAllowlist(
          10,
          proofForAddress,
          {
            value: ethers.utils.parseEther("0.03"),
          }
        );
        await mintTrans.wait();
      }
      expect(await NFT.ownerOf(1)).to.equal(addresses[0]);
      expect(await NFT.ownerOf(13)).to.equal(addresses[1]);
      expect(await NFT.tokenURI(13)).to.equal(baseURI + "13");
    });

    it("Check that more mint impossible", async function () {
      const { NFT, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openAl = await NFT.turnAllowlistMint();
      await openAl.wait();
      for (let i = 0; i <= 5; i++) {
        let proofForAddress = merkle.getProofForAddress(
          accounts[i].address,
          addresses
        );
        if (i < 5) {
          let mintTrans = await NFT.connect(accounts[i]).mintAllowlist(
            200,
            proofForAddress,
            {
              value: ethers.utils.parseEther("1"),
            }
          );
          await mintTrans.wait();
        } else {
          await expect(
            NFT.connect(accounts[i]).mintAllowlist(1, proofForAddress, {
              value: ethers.utils.parseEther("0.03"),
            })
          ).to.be.revertedWith("Allowlist limit is reached!");
        }
      }
    });
    it("Check that withdraw correct", async function () {
      const { NFT, owner, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openAl = await NFT.turnAllowlistMint();
      await openAl.wait();
      let proofForAddress = merkle.getProofForAddress(addresses[0], addresses);
      let mintTrans = await NFT.connect(accounts[0]).mintAllowlist(
        1,
        proofForAddress,
        {
          value: ethers.utils.parseEther("0.003"),
        }
      );
      await mintTrans.wait();
      await expect(NFT.connect(accounts[0]).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(await NFT.withdraw()).to.changeEtherBalance(
        owner,
        3000000000000000
      );
    });
  });
  /*-----------------------------------------------------------------*/
  describe("Public mint", function () {
    it("Before the start of sales can't mint", async function () {
      const { NFT, accounts } = await loadFixture(deployContractFixture);
      await expect(
        NFT.connect(accounts[0]).mintPublic(1, {
          value: ethers.utils.parseEther("0.009"),
        })
      ).to.be.revertedWith("Public mint is not started!");
    });
    it("Check that limit is exceeded", async function () {
      const { NFT, accounts } = await loadFixture(deployContractFixture);
      const openPb = await NFT.turnPublicMint();
      await openPb.wait();
      await expect(
        NFT.connect(accounts[0]).mintPublic(201, {
          value: ethers.utils.parseEther("2"),
        })
      ).to.be.revertedWith("You have reached the mint limit per address!");
    });
    it("Check that not enough money", async function () {
      const { NFT, accounts } = await loadFixture(deployContractFixture);
      const openPb = await NFT.turnPublicMint();
      await openPb.wait();
      await expect(
        NFT.connect(accounts[0]).mintPublic(1, {
          value: ethers.utils.parseEther("0.008"),
        })
      ).to.be.revertedWith("Not enough ETH!");
    });
    it("Public mint  is succesful", async function () {
      const { NFT, accounts } = await loadFixture(deployContractFixture);
      const openPb = await NFT.turnPublicMint();
      await openPb.wait();
      for (let account of accounts) {
        let mintTrans = await NFT.connect(account).mintPublic(10, {
          value: ethers.utils.parseEther("0.09"),
        });
        await mintTrans.wait();
      }
      expect(await NFT.ownerOf(1)).to.equal(accounts[0].address);
      expect(await NFT.ownerOf(13)).to.equal(accounts[1].address);
      expect(await NFT.tokenURI(13)).to.equal(baseURI + "13");
      expect(await NFT.totalSupply()).to.equal(170);
    });

    it("Check that more mint impossible", async function () {
      const { NFT, accounts } = await loadFixture(deployContractFixture);
      const openPb = await NFT.turnPublicMint();
      await openPb.wait();
      for (let i = 0; i <= 16; i++) {
        if (i < 16) {
          let mintTrans = await NFT.connect(accounts[i]).mintPublic(200, {
            value: ethers.utils.parseEther("2"),
          });
          await mintTrans.wait();
        } else {
          await expect(
            NFT.connect(accounts[i]).mintPublic(134, {
              value: ethers.utils.parseEther("2"),
            })
          ).to.be.revertedWith(
            "You can't mint more than maximum total supply!"
          );
        }
      }
    });
    it("Check that withdraw correct", async function () {
      const { NFT, owner, accounts, addresses } = await loadFixture(
        deployContractFixture
      );
      const openPb = await NFT.turnPublicMint();
      await openPb.wait();
      let mintTrans = await NFT.connect(accounts[0]).mintPublic(1, {
        value: ethers.utils.parseEther("0.009"),
      });
      await mintTrans.wait();
      await expect(await NFT.withdraw()).to.changeEtherBalance(
        owner,
        9000000000000000
      );
    });
  });
  /*-----------------------------------------------------------------*/
  describe("Tresuare mint", function () {
    it("Only owner can mint", async function () {
      const { NFT, accounts } = await loadFixture(deployContractFixture);
      await expect(NFT.connect(accounts[0]).tresuareMint(1)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    it("Check that limit is exceeded", async function () {
      const { NFT } = await loadFixture(deployContractFixture);
      await expect(NFT.tresuareMint(3334)).to.be.revertedWith(
        "You reached maxtotal supply"
      );
    });
    it("Tresuare mint is succesful", async function () {
      const { NFT, owner } = await loadFixture(deployContractFixture);
      let mintTrans = await NFT.tresuareMint(100);
      await mintTrans.wait();

      expect(await NFT.ownerOf(1)).to.equal(owner.address);
      expect(await NFT.tokenURI(13)).to.equal(baseURI + "13");
      expect(await NFT.totalSupply()).to.equal(100);
    });
  });
});
