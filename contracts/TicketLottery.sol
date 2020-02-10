pragma solidity >=0.4.24 <0.7.0;
import "./OraclizeAPI.sol";

contract TicketLottery is usingOraclize {
    event Render(uint256 contractBalance, uint256 ticketsLeft);

    address payable public contractAddress;
    address payable[] public playersAddress;
    address self = address(this);
    uint256 tickets;
    uint256 schedulerAmount;

    constructor() public payable {
        contractAddress = msg.sender;
        tickets = 0;
        oraclize_query(60, "URL", "");
        schedulerAmount = self.balance;
    }

    function __callback(bytes32, string memory, bytes memory) public {
        require(msg.sender == oraclize_cbAddress(), "Failed.");
        if (playersAddress.length != 0) {
            uint256 index = getRandomPlayer() % playersAddress.length;
            playersAddress[index].transfer(
                self.balance - schedulerAmount - 0.005 ether
            );
            playersAddress = new address payable[](0);
        }
        oraclize_query(60, "URL", "");
        schedulerAmount = self.balance;
        tickets = 0;
        emit Render(self.balance - schedulerAmount, tickets);
    }

    function buyTicket() public payable {
        require(
            msg.value >= 0.02 ether,
            "Minimum to enter the lottery is 0.01 ETH"
        );
        playersAddress.push(msg.sender);
        tickets++;
        emit Render(self.balance - schedulerAmount, tickets);
    }

    function getRandomPlayer() private view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.difficulty, now, playersAddress)
                )
            );
    }

    function getContractBalance() public view returns (uint256) {
        return self.balance - schedulerAmount;
    }

    function getTicketsCount() public view returns (uint256) {
        return tickets;
    }

    function getSchedulerAmount() public view returns (uint256) {
        return schedulerAmount;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return playersAddress;
    }
}
