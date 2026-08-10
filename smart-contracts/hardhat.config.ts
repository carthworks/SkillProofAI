import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.21',
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    mumbai: {
      url: process.env.MUMBAI_RPC_URL ?? '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};

export default config;
