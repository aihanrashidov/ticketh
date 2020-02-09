var TicketLottery = artifacts.require("./TicketLottery.sol");

module.exports = function (deployer) {
  // deployer.deploy(TicketLottery, 10, 0x190854329C1EdeF8cFC6325FA43f1710b3f73F57, 20000000000000000, { value: 20000000000000000 });
  deployer.deploy(TicketLottery, { value: 20000000000000000 });

};
