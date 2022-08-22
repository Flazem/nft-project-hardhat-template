// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract NFT is ERC721, Ownable {
    uint256 public tokenId;
    uint256 public maxForWhitelist;
    uint256 public maxForAllowlist;
    uint256 public immutable maxPerWallet;
    uint256 public immutable maxTotalSupply;
    uint256 public allowlistPrice;
    uint256 public publicPrice;

    bytes32 private MerkleRootWhitelist;
    bytes32 private MerkleRootAllowlist;

    bool public mintWhitelistOpen = false;
    bool public mintAllowlistOpen = false;
    bool public mintPublicOpen = false;

    string private baseURI;

    mapping(address => uint256) public mintedToAddress;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxTotalSupply,
        uint256 _maxPerWallet
    ) ERC721(name, symbol) {
        maxTotalSupply = _maxTotalSupply;
        maxPerWallet = _maxPerWallet;
    }

    function setAllowlistPrice(uint256 _allowlistPrice) external onlyOwner {
        allowlistPrice = _allowlistPrice;
    }

    function setPublicPrice(uint256 _publicPrice) external onlyOwner {
        publicPrice = _publicPrice;
    }

    function setBaseURI(string memory _baseuri) public onlyOwner {
        baseURI = _baseuri;
    }

    function setMerkleRootWhitelist(bytes32 _MerkleRoot) public onlyOwner {
        MerkleRootWhitelist = _MerkleRoot;
    }

    function setMerkleRootAllowlist(bytes32 _MerkleRoot) public onlyOwner {
        MerkleRootAllowlist = _MerkleRoot;
    }

    function turnWhitelistMint() public onlyOwner {
        if (mintWhitelistOpen == false) {
            mintWhitelistOpen = true;
        } else {
            mintWhitelistOpen = false;
        }
    }

    function turnAllowlistMint() public onlyOwner {
        if (mintAllowlistOpen == false) {
            mintAllowlistOpen = true;
        } else {
            mintAllowlistOpen = false;
        }
    }

    function turnPublicMint() public onlyOwner {
        if (mintPublicOpen == false) {
            mintPublicOpen = true;
        } else {
            mintPublicOpen = false;
        }
    }

    function tresuareMint(uint256 _amount) public onlyOwner {
        require(
            tokenId + _amount <= maxTotalSupply,
            "You reached maxtotal supply"
        );
        for (uint256 i; i < _amount; i++) {
            tokenId++;
            _safeMint(msg.sender, tokenId);
        }
    }

    function mintWhitelist(uint256 _amount, bytes32[] calldata _merkleProof)
        public
    {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, MerkleRootWhitelist, leaf),
            "You are not in whitelist!"
        );
        require(mintWhitelistOpen == true, "Whitelist mint is closed!");
        require(
            maxForWhitelist + _amount <= 1000,
            "Whitelist limit is reached!"
        );
        require(
            mintedToAddress[msg.sender] + _amount <= maxPerWallet,
            "You have reached the mint limit per address!"
        );
        require(
            tokenId + _amount <= maxTotalSupply,
            "You can't mint more than maximum total supply!"
        );
        for (uint256 i; i < _amount; i++) {
            tokenId++;
            _safeMint(msg.sender, tokenId);
        }
        mintedToAddress[msg.sender] += _amount;
        maxForWhitelist += _amount;
    }

    function mintAllowlist(uint256 _amount, bytes32[] calldata _merkleProof)
        public
        payable
    {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, MerkleRootAllowlist, leaf),
            "You are not in allowlist!"
        );
        require(msg.value >= allowlistPrice * _amount, "Not enough ETH!");
        require(mintAllowlistOpen == true, "Allowlist mint is closed!");
        require(
            mintedToAddress[msg.sender] + _amount <= maxPerWallet,
            "You have reached the mint limit per address!"
        );
        require(
            maxForAllowlist + _amount <= 1000,
            "Allowlist limit is reached!"
        );
        require(
            tokenId + _amount <= maxTotalSupply,
            "You can't mint more than maximum total supply!"
        );
        for (uint256 i; i < _amount; i++) {
            tokenId++;
            _safeMint(msg.sender, tokenId);
        }
        mintedToAddress[msg.sender] += _amount;
        maxForAllowlist += _amount;
    }

    function mintPublic(uint256 _amount) public payable {
        require(msg.value >= publicPrice * _amount, "Not enough ETH!");
        require(mintPublicOpen == true, "Public mint is not started!");
        require(
            mintedToAddress[msg.sender] + _amount <= maxPerWallet,
            "You have reached the mint limit per address!"
        );
        require(
            tokenId + _amount <= maxTotalSupply,
            "You can't mint more than maximum total supply!"
        );
        for (uint256 i; i < _amount; i++) {
            tokenId++;
            _safeMint(msg.sender, tokenId);
        }
        mintedToAddress[msg.sender] += _amount;
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function totalSupply() external view returns (uint256) {
        return tokenId;
    }

    function burn(uint256 _tokenid) public onlyOwner {
        _burn(_tokenid);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    receive() external payable {}
}
