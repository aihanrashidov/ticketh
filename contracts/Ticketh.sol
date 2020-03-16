pragma solidity >=0.4.24 <0.7.0;

import "./SafeMath.sol";
import "../node_modules/@chainlink/contracts/src/v0.5/ChainlinkClient.sol";

contract Ticketh is ChainlinkClient {
    using SafeMath for uint256;

    uint256 oraclePrice;
    bytes32 jobId;
    address oracleAddress;

    struct Lottery {
        uint256 lotteryId;
        uint256 ticketPrice;
        uint256 currentSum;
        uint256 blockNumber;
        uint256 endBlocks;
        bool lotteryStatus;
        address payable[] participatingPlayers;
        address[] roundWinners;
    }

    mapping(uint256 => Lottery) lotteries;

    struct ChainlinkCallbackDetails {
        uint256 lotteryId;
    }

    mapping(bytes32 => ChainlinkCallbackDetails) chainlinkDetails;

    address payable public ownerAddress;
    address self = address(this);

    modifier onlyOwner() {
        require(msg.sender == ownerAddress, "Not authorized.");
        _;
    }

    constructor() public payable {
        setPublicChainlinkToken();
        ownerAddress = msg.sender;

        oraclePrice = 100000000000000000;
        jobId = "85e21af0bcfb45d5888851286d57ce0c";
        oracleAddress = 0x89f70fA9F439dbd0A1BC22a09BEFc56adA04d9b4;

        lotteries[0] = Lottery(
            0,
            0.001 ether,
            0,
            0,
            10,
            true,
            new address payable[](0),
            new address[](0)
        );
        lotteries[1] = Lottery(
            1,
            0.05 ether,
            0,
            0,
            17280,
            true,
            new address payable[](0),
            new address[](0)
        );
        lotteries[2] = Lottery(
            2,
            0.1 ether,
            0,
            0,
            28800,
            true,
            new address payable[](0),
            new address[](0)
        );
        lotteries[3] = Lottery(
            3,
            0.5 ether,
            0,
            0,
            40320,
            true,
            new address payable[](0),
            new address[](0)
        );
    }

    function buyTicket(uint256 lotteryId) public payable {
        Lottery storage lottery = lotteries[lotteryId];

        require(
            msg.value >= lottery.ticketPrice && lottery.lotteryStatus == true,
            "Error on buying a ticket!"
        );

        lottery.participatingPlayers.push(msg.sender);
        lottery.currentSum = lottery.currentSum + msg.value;

        if (lottery.participatingPlayers.length == 1) {
            lottery.blockNumber = block.number + lottery.endBlocks;
        }

        if (lottery.blockNumber != 0 && block.number >= lottery.blockNumber) {
            lottery.lotteryStatus = false;
            requestRandomNumber(lotteryId);
        }
    }

    function requestRandomNumber(uint256 lotteryId) internal {
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.distributePrize.selector
        );
        req.addUint("min", 0);
        req.addUint(
            "max",
            (lotteries[lotteryId].participatingPlayers.length - 1)
        );
        bytes32 requestId = sendChainlinkRequestTo(oracleAddress, req, oraclePrice);
        chainlinkDetails[requestId] = ChainlinkCallbackDetails(lotteryId);
    }

    function distributePrize(bytes32 _requestId, uint256 _number)
        public
        recordChainlinkFulfillment(_requestId)
    {
        ChainlinkCallbackDetails storage details = chainlinkDetails[_requestId];
        Lottery storage lottery = lotteries[details.lotteryId];

        lottery.participatingPlayers[_number].transfer(
            lottery.currentSum - ((lottery.currentSum * 10) / 100)
        );
        lottery.roundWinners.push(lottery.participatingPlayers[_number]);
        resetLottery(lottery);
    }

    function resetLottery(Lottery storage lottery) internal {
        lottery.participatingPlayers = new address payable[](0);
        lottery.currentSum = 0;
        lottery.blockNumber = 0;
        lottery.lotteryStatus = true;
    }

    // Owner functions.
    function withdraw(uint256 amount) public onlyOwner {
        uint256 totalSum = 0;
        for (uint256 i = 0; i < 3; i++) {
            totalSum = totalSum + lotteries[i].currentSum;
        }

        require(amount <= (self.balance - totalSum), "Wrong amount!");
        ownerAddress.transfer(amount);
    }

    function endManually(uint256 lotteryId) public onlyOwner {
        requestRandomNumber(lotteryId);
    }

    // Change lottery details if necessary.
    function changeEndBlocks(uint256 lotteryId, uint256 numberOfBlocks)
        public
        onlyOwner
    {
        lotteries[lotteryId].endBlocks = numberOfBlocks;
    }
    
    function changeTicketPrice(uint256 lotteryId, uint256 ticketPrice)
        public
        onlyOwner
    {
        lotteries[lotteryId].ticketPrice = ticketPrice;
    }

    // Change chainlink details if necessary.
    function changeOraclePrice(uint256 newPrice)
        public
        onlyOwner
    {
        oraclePrice = newPrice;
    }

    function changeOracleAddress(address newAddress)
        public
        onlyOwner
    {
        oracleAddress = newAddress;
    }

    function changeJobId(bytes32 newJobId)
        public
        onlyOwner
    {
        jobId = newJobId;
    }

    //Ticketh information functions.
    function getPlayers(uint256 lotteryId)
        public
        view
        returns (address payable[] memory)
    {
        return lotteries[lotteryId].participatingPlayers;
    }

    function getWinners(uint256 lotteryId)
        public
        view
        returns (address[] memory)
    {
        return lotteries[lotteryId].roundWinners;
    }

    function getStatus(uint256 lotteryId) public view returns (bool) {
        return lotteries[lotteryId].lotteryStatus;
    }

    function getBlockNum(uint256 lotteryId) public view returns (uint256) {
        return lotteries[lotteryId].blockNumber;
    }

    function getOraclePrice() public view returns (uint256) {
        return oraclePrice;
    }

    function getOracleAddress() public view returns (address) {
        return oracleAddress;
    }

    function getJobId() public view returns (bytes32) {
        return jobId;
    }

    function getLotteryTicketPrice(uint256 lotteryId) public view returns (uint256) {
        return lotteries[lotteryId].ticketPrice;
    }

    function getLotteryEndBlocks(uint256 lotteryId) public view returns (uint256) {
        return lotteries[lotteryId].endBlocks;
    }
}
