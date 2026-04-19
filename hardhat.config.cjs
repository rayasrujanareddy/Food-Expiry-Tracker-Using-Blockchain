require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/dc343a41f319489083bafc17a5ece6cc",
      accounts: ["4635d1067b67df61d82307966f5c24f23ea6920fa202438d477a5085521777ba"]
    }
  }
};
