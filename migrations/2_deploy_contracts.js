const Ticketh = artifacts.require("./Ticketh.sol");

module.exports = (deployer) => {
  deployer.deploy(Ticketh);
};
