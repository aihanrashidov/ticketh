pragma solidity >=0.5.0 <0.7.0;

contract TicketLottery {
    address public ownerAddress;
    address payable[] public playersAddress;
    address self = address(this);

    constructor() public {
        ownerAddress = msg.sender;
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
                    abi.encodePacked(
                        block.difficulty,
                        block.timestamp,
                        playersAddress
                    )
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

    function getPlayers() public view returns (address payable[] memory) {
        return playersAddress;
    }

    modifier restricted() {
        require(msg.sender == ownerAddress, "Allowed only by lottery owner.");
        _;
    }
}
