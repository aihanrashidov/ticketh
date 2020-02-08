var TicketLottery = artifacts.require("./TicketLottery.sol");

module.exports = function (deployer) {
  deployer.deploy(TicketLottery);
};
