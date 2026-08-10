import { ethers } from 'hardhat';

async function main() {
  const TalentForgeBadges = await ethers.getContractFactory('TalentForgeBadges');
  const contract = await TalentForgeBadges.deploy();
  await contract.deployed();
  console.log('TalentForgeBadges deployed to:', contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
