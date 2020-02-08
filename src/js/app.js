App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  balance: '0',


  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("TicketLottery.json", function (TicketLottery) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.TicketLottery = TruffleContract(TicketLottery);
      // Connect provider to interact with contract
      App.contracts.TicketLottery.setProvider(App.web3Provider);

      return App.render();
    });
  },

  render: function () {
    var TicketLotteryInstance;

    // Load account data
    loadAccData()

    // Load contract data
    getPlayers()
    getTicketsCount()
    getContractBalance()
  },

  buy: function () {
    var TicketLotteryInstance;
    App.contracts.TicketLottery.deployed().then(function (instance) {
      TicketLotteryInstance = instance;
      return TicketLotteryInstance.buyTicket({ value: web3.toWei(0.01, 'ether') });
    }).then(function (msg) {
      console.log(msg)
    }).catch(function (error) {
      console.log(error);
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});

function getTicketsCount() {
  App.contracts.TicketLottery.deployed().then(function (instance) {
    TicketLotteryInstance = instance;
    return TicketLotteryInstance.getTicketsCount();
  }).then(function (tickets) {
    $("#tickets").html(tickets.toFixed(0));
  }).catch(function (error) {
    console.log(error);
  });
};

function getContractBalance() {
  App.contracts.TicketLottery.deployed().then(function (instance) {
    TicketLotteryInstance = instance;
    return TicketLotteryInstance.getContractBalance();
  }).then(function (balance) {
    $("#prize").html(web3.fromWei(balance.toNumber(), 'ether') + ' ETH');
  }).catch(function (error) {
    console.log(error);
  });
};

function loadAccData() {
  getAccount()
};

function getAccount() {
  web3.eth.getCoinbase(function (err, account) {
    if (err === null) {
      App.account = account;
      $('#acc-address').html(account);
      getBal()
    }
  });
}

function getBal() {
  web3.eth.getBalance(App.account, function (err, balance) {
    if (err === null) {
      App.balance = balance;
      $('#acc-balance').html((balance.c[0] / 10000).toFixed(2) + ' ETH');
    }
  });
};

$('#buy').click(function () {
  App.buy();
});




