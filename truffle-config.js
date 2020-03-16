const HDWalletProvider = require("truffle-hdwallet-provider");
const MNEMONIC = process.env.MNEMONIC_WALLET_KEY;


module.exports = {
  plugins: ['oneclick'],
  contracts_build_directory: "./public/contracts",
  networks: {
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(MNEMONIC, "https://rinkeby.infura.io/v3/" + process.env.PROJECT_ID)
      },
      network_id: 4,
      gas: 3000000
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(MNEMONIC, "https://mainnet.infura.io/v3/" + process.env.PROJECT_ID)
      },
      network_id: 1,
      gas: 3000000
    }
  }
};
