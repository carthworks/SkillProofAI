// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract TalentForgeBadges is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721('TalentForge Badge', 'TFB') {}

    function mintBadge(address recipient) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId += 1;
        _safeMint(recipient, tokenId);
        return tokenId;
    }
}
