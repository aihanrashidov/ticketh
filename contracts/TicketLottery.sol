pragma solidity >=0.5.0 <0.7.0;
import "./OraclizeAPI.sol";

contract TicketLottery is usingOraclize {
    address public contractAddress;
    address payable[] public playersAddress;
    address self = address(this);

    constructor() public {
        contractAddress = msg.sender;
        oraclize_query(1 * day, "URL", "");
    }

    function __callback(bytes32, string memory) public {
        // require(msg.sender == oraclize_cbAddress(), "Addresses not matching.");
        pickWinner();
    }

    function buyTicket() public payable {
        require(
            msg.value >= 0.01 ether,
            "Minimum to enter the lottery is 0.01 ETH"
        );

        playersAddress.push(msg.sender);
    }

    function getRandomPlayer() private view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.difficulty, now, playersAddress)
                )
            );
    }

    function pickWinner() public restricted {
        uint256 index = getRandomPlayer() % playersAddress.length;
        playersAddress[index].transfer(address(this).balance);

        playersAddress = new address payable[](0);
    }

    function getContractBalance() public view returns (uint256) {
        return self.balance;
    }

    function getTicketsCount() public view returns (uint256) {
        return playersAddress.length;
    }

    modifier restricted() {
        require(
            msg.sender == contractAddress,
            "Allowed only by lottery owner."
        );
        _;
    }
}
