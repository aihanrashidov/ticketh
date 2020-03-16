App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  balance: 0,

  init: () => {
    return App.initWeb3();
  },

  initWeb3: async () => {
    if (window.ethereum) {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
      if (web3.currentProvider.networkVersion == "1") {
        return App.initContract();
      }
      else {
        stopLoading();
        $('.action').css('display', 'none');
        $('.wrong-provider').css('display', 'flex');
        userData();
      }
    }
    else {
      stopLoading();
      $('.wrong-provider').css('display', 'none');
      $('.acc').css('display', 'none');
      $('.action').css('display', 'none');
      $('.no-metamask').css('display', 'flex');
    }
  },

  initContract: () => {
    $.getJSON("./contracts/Ticketh.json", (Ticketh) => {
      App.contracts.Ticketh = TruffleContract(Ticketh);
      App.contracts.Ticketh.setProvider(App.web3Provider);

      return App.renderUserData();
    });
  },

  renderUserData: () => {
    userData();
    return App.renderContractData(0);
  },

  renderContractData: () => {
    getBlockHeight();
    renderRest();
    stopLoading();
  }
};

$(() => {
  $(window).load(() => {
    App.init();
  });
});

const userData = () => {
  $('.acc').css('display', 'flex');
  web3.eth.getAccounts((err, accounts) => {
    if (err != null) { console.error(err); }
    else if (accounts.length == 0) {
      $('.signed').css('display', 'none');
      $('.unsigned').css('display', 'flex');
      document.getElementById("buy-ticket").disabled = true;
    }
    else {
      $('.signed').css('display', 'flex');
      $('.unsigned').css('display', 'none');
      document.getElementById("buy-ticket").disabled = false;
      loadAccData();
    }
  });
}

const loadAccData = async () => {
  await getAccount();
  await getBalance();
};

const getAccount = async () => {
  try {
    const account = await promisify(cb => web3.eth.getCoinbase(cb))
    App.account = account;
    jdenticon.update("#ic-owner", account);
    $('#address').html(account);
  }
  catch (err) {
  }
}

const getBalance = async () => {
  try {
    const balance = await promisify(cb => web3.eth.getBalance(App.account, cb))
    App.balance = (balance.c[0] / 10000).toFixed(2);
    $('#eth').html((balance.c[0] / 10000).toFixed(2));
  }
  catch (err) {
  }
};

const getPlayers = (lotteryIndex, type, price) => {
  App.contracts.Ticketh.deployed().then((instance) => {
    return instance.getPlayers(lotteryIndex);
  }).then((players) => {
    $('.p-list-' + type).html('');
    for (let i = 0; i < players.length; i++) {
      let participantHtml = '<div id="par"><canvas id="ic-' + i + "-" + type + '" width="25" height="25"></canvas><label id="par-addr">' + players[i] + '</label></div>';
      $('.p-list-' + type).append(participantHtml);
      jdenticon.update("#ic-" + i + "-" + type, players[i]);
    }

    App.contracts.Ticketh.deployed().then((instance) => {
      return instance.getStatus(lotteryIndex);
    }).then((status) => {
      if (players.length < 1 && status == true) {
        $('#prize-' + type).html('At least one entry is required.');
      }
      else if (players.length >= 1 && status == true) {
        let current_prize = (players.length + 1) * price;
        $('#prize-' + type).html((current_prize.toFixed(2) - (current_prize.toFixed(2) * 0.1)).toFixed(4) + ' (including last entry)');
      }
      else if (players.length > 1 && status == false) {
        let current_prize = (players.length) * price;
        $('#prize-' + type).html((current_prize.toFixed(2) - (current_prize.toFixed(2) * 0.1)).toFixed(4) + ' (including last entry)');
      }
    }).catch((error) => {
      console.log(error);
    });
  })
};

const getBlockNumber = (lotteryIndex, type) => {
  App.contracts.Ticketh.deployed().then((instance) => {
    return instance.getBlockNum(lotteryIndex);
  }).then((number) => {
    if (number.toNumber() == 0) {
      $('#block-' + type).html('No entries yet.');
    }
    else {
      $('#block-' + type).html(number.toNumber());
    }
  }).catch((error) => {
    console.log(error);
  });
};

const getStatus = (lotteryIndex, type) => {
  App.contracts.Ticketh.deployed().then((instance) => {
    return instance.getStatus(0);
  }).then((status) => {
    console.log(status);
  }).catch((error) => {
    console.log(error);
  });
};

const getWinners = (lotteryIndex, type) => {
  App.contracts.Ticketh.deployed().then((instance) => {
    return instance.getWinners(lotteryIndex);
  }).then((winners) => {
    $("#round-" + type).html(winners.length + 1);
    $('.w-list-' + type).html('');
    for (let i = 0; i < winners.length; i++) {
      let winnerHtml = '<label>Round <div class="numberCircle" id="round">' + (i + 1) + '</div> <a target="_blank" style="margin-left: 5px;" href="https://etherscan.io/address/' + winners[i] + '">' + winners[i] + '</a></label>';
      $('.w-list-' + type).append(winnerHtml);
    }
  }).catch((error) => {
    console.log(error);
  });
};

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    })
  );

$("#sign-in").click(async () => {
  try {
    await ethereum.enable();
    return App.renderUserData();
  } catch (error) {
    console.log(error);
  }
});

$('#buy-ticket').click(() => {
  let type = 0;
  let price = 0;

  if ($('#game-low').attr('data-selected') == 'selected') {
    type = 0;
    price = 0.03;
  }
  else if ($('#game-medium').attr('data-selected') == 'selected') {
    type = 1;
    price = 0.05;
  }
  else if ($('#game-high').attr('data-selected') == 'selected') {
    type = 2;
    price = 0.1;
  }
  else {
    type = 3;
    price = 0.5;
  }

  App.contracts.Ticketh.deployed().then((instance) => {
    return instance.buyTicket(type, { value: web3.toWei(price, 'ether'), gasPrice: web3.toWei(8, 'gwei') });
  }).then((msg) => {
    loadAccData();
  }).catch((error) => {
    console.log(error);
  });
});

$('#game-low, #game-medium, #game-high, #game-ultra').click((event) => {
  const type = $(event.currentTarget).attr("data-type");

  if (type == 'low') {
    $('.game-data-low').css('display', 'flex');
    $('.game-data-medium').css('display', 'none');
    $('.game-data-high').css('display', 'none');
    $('.game-data-ultra').css('display', 'none');

    $('#game-low').attr("data-selected", "selected");
    $('#game-medium').attr("data-selected", "none");
    $('#game-high').attr("data-selected", "none");
    $('#game-ultra').attr("data-selected", "none");
  }
  else if (type == 'medium') {
    $('.game-data-low').css('display', 'none');
    $('.game-data-medium').css('display', 'flex');
    $('.game-data-high').css('display', 'none');
    $('.game-data-ultra').css('display', 'none');

    $('#game-low').attr("data-selected", "none");
    $('#game-medium').attr("data-selected", "selected");
    $('#game-high').attr("data-selected", "none");
    $('#game-ultra').attr("data-selected", "none");
  }
  else if (type == 'high') {
    $('.game-data-low').css('display', 'none');
    $('.game-data-medium').css('display', 'none');
    $('.game-data-high').css('display', 'flex');
    $('.game-data-ultra').css('display', 'none');

    $('#game-low').attr("data-selected", "none");
    $('#game-medium').attr("data-selected", "none");
    $('#game-high').attr("data-selected", "selected");
    $('#game-ultra').attr("data-selected", "none");
  }
  else {
    $('.game-data-low').css('display', 'none');
    $('.game-data-medium').css('display', 'none');
    $('.game-data-high').css('display', 'none');
    $('.game-data-ultra').css('display', 'flex');

    $('#game-low').attr("data-selected", "none");
    $('#game-medium').attr("data-selected", "none");
    $('#game-high').attr("data-selected", "none");
    $('#game-ultra').attr("data-selected", "selected");
  }

});

$("#how-to").click(async () => {
  $('.how-it-works').css('display', 'block');
  $('.how-to-use').css('display', 'none');
});

$("#useage").click(async () => {
  $('.how-to-use').css('display', 'block');
  $('.how-it-works').css('display', 'none');
});

$("#back1, #back2").click(async () => {
  $('.how-it-works').css('display', 'none');
  $('.how-to-use').css('display', 'none');
});

$("#contract").click(async () => {
  window.open('https://etherscan.io/address/0x7a856a4e0f10f6e7c06d71137c191b8b0980f89f#code', '_blank');
});

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const stopLoading = async () => {
  await sleep(2000);
  $('.loading').css('display', 'none');
}

const getBlockHeight = () => {

  (async () => {
    await web3.eth.getBlockNumber((err, num) => {
      $('#current-block-low').html(num);
      $('#current-block-medium').html(num);
      $('#current-block-high').html(num);
      $('#current-block-ultra').html(num);

      const lotteries = [{ lotteryIndex: 0, type: 'low' }, { lotteryIndex: 1, type: 'medium' }, { lotteryIndex: 2, type: 'high' }, { lotteryIndex: 3, type: 'ultra' }]

      for (let i = 0; i < lotteries.length; i++) {
        App.contracts.Ticketh.deployed().then((instance) => {
          return instance.getStatus(lotteries[i].lotteryIndex);
        }).then((status) => {
          App.contracts.Ticketh.deployed().then((instance) => {
            return instance.getBlockNum(lotteries[i].lotteryIndex);
          }).then((number) => {
            if (Number(number) == 0 && status == true || Number(number) > Number(num)) {
              $("#status-" + lotteries[i].type).html('<span class="badge badge-success">active</span>');
            }
            else if (Number(number) != 0 && status == true && Number(number) < Number(num)) {
              $("#status-" + lotteries[i].type).html('<span class="badge badge-warning">awaiting for last entry</span>');
            }
            else if (Number(number) != 0 && status == false && Number(number) < Number(num)) {
              $("#status-" + lotteries[i].type).html('<span class="badge badge-danger">prize being sent to winner</span>');
            }
            else {
              $("#status-" + lotteries[i].type).html('<span class="badge badge-warning">awaiting for last entry</span>');
            }

          }).catch((error) => {
            console.log(error);
          });
        }).catch((error) => {
          console.log(error);
        });
      }

    })
  })()

  setTimeout(getBlockHeight, 5000);
}

const renderRest = () => {
  const lotteries = [{ lotteryIndex: 0, type: 'low', price: 0.03 }, { lotteryIndex: 1, type: 'medium', price: 0.05 }, { lotteryIndex: 2, type: 'high', price: 0.1 }, { lotteryIndex: 3, type: 'ultra', price: 0.5 }]

  for (let i = 0; i < lotteries.length; i++) {
    getPlayers(lotteries[i].lotteryIndex, lotteries[i].type, lotteries[i].price);
    getWinners(lotteries[i].lotteryIndex, lotteries[i].type);
    getBlockNumber(lotteries[i].lotteryIndex, lotteries[i].type);
  }
  loadAccData();
  setTimeout(renderRest, 3000);
}

