const { assert } = require("console");

// get the contract to be tested 
const Auctions = artifacts.require('Auctions');

contract("Auctions contract", () => {

    let contract = null;
    let accounts = null;

    // execute before each testing block
    before(async () => {

        // reference to the deployed contract
        contract = await Auctions.deployed();

        // load network accounts 
        accounts = await web3.eth.getAccounts();

    });

    // first block
    it("Deploy the contract and initialize properly", async () => {

        try {
            // check if contract was deployed successfully
            assert(contract.address != '', "Contract address is empty");

            // check for governor (contract owner)
            const governor = await contract.governor();
            assert(governor == accounts[0], "Governor is not the address deployed the contract");

            // check for constructor initilized properly
            const companyName = await contract.companyName();
            assert(companyName == "EcoSneakers", "Company name was not set properly");

            const governorIsAuctioneer = await contract.isAuctioneer(governor);
            assert(governorIsAuctioneer == true, "Governor was not set as an auctioneer");
        }
        catch (error){
            console.log(`*** Contract error ***:\n${error.message}`);
        }
    });

    it("Create and successfully complete an auction", async () => {

        const governor = await contract.governor();
        const pendingAuctioneer = accounts[1];
        const beneficiary = accounts[2];
        const bidder1 = accounts[3];
        const bidder2 = accounts[4]

        try {
            // appoint a new auctioneer
            let isAuctioneer = await contract.isAuctioneer(pendingAuctioneer);
            assert(isAuctioneer == false, "Auctioneers were not initialized properly");

            await contract.addAuctioneer(pendingAuctioneer, {from : governor});
            isAuctioneer = await contract.isAuctioneer(pendingAuctioneer);
            assert(isAuctioneer == true, "Auctioneer were not appointed properly");

            // create a new auction
            const auctioneer = pendingAuctioneer;

            const description = "Unlimited edition Dragon Sneaker";
            const startingPrice = web3.utils.toWei('1', 'gwei');
            const biddingTime = 10;
            const deadline = Date.now() + biddingTime;
            await contract.newAuction(beneficiary, description, startingPrice, biddingTime, {from : auctioneer});
        

            // check for correctness
            const numAuctions = await contract.numAuctions();
            assert(numAuctions.toNumber() == 1, "Auctions counter was not updated");
            const auctionID = numAuctions.toNumber() - 1;
            assert(auctionID == 0, "New auction ID is not correct");
            
            let newAuction = await contract.auctions(auctionID);
            assert(newAuction.beneficiary == beneficiary, "Beneficiary was not set correctly");
            assert(newAuction.description == description, "Description was not set correctly");
            assert(newAuction.highestBid.toNumber() == startingPrice, "Starting price was not set correctly");
            assert(newAuction.highestBidder == "0x0000000000000000000000000000000000000000", "Highest bidder was not set correctly");
            assert(newAuction.completed == false, "Auction state was not set correctly");

            // first bid
            const firstBidValue = web3.utils.toWei('1.1', 'gwei');
            await contract.bid(auctionID, {from : bidder1, value : firstBidValue});
            newAuction = await contract.auctions(auctionID);
            assert(newAuction.highestBid.toNumber() ==  firstBidValue, "Highest bid value was not set correctly");
            assert(newAuction.highestBidder == bidder1, "Highest first bidder address was not set correctly");
            assert(newAuction.numBids == 1, "Number of bids after first bidding was not set correctly");
            assert(newAuction.completed == false, "Auction state after first bidding was not set correctly");

            // second bid
            const secondBidValue = web3.utils.toWei('1.5', 'gwei');
            await contract.bid(auctionID, {from : bidder2, value : secondBidValue});
            newAuction = await contract.auctions(auctionID);
            assert(newAuction.highestBid.toNumber() ==  secondBidValue, "Highest bid value was not set correctly");
            assert(newAuction.highestBidder == bidder2, "Highest second bidder address was not set correctly");
            assert(newAuction.numBids == 2, "Number of bids after second bidding was not set correctly");
            assert(newAuction.completed == false, "Auction state after second bidding was not set correctly");
        

            // withdraw bid value of first beaten bidder 
            await contract.withdraw(auctionID, {from : bidder1});

            // pause to reach auction end time
            ///console.log("Expecting auction end time...");
            await new Promise(res => setTimeout(res, 10000));

            // end auction
            const beneficiaryBalance = await web3.eth.getBalance(beneficiary);

            newAuction = await contract.auctions(auctionID);
            receipt = {
                'auctionID': auctionID,
                'beneficiary': newAuction.beneficiary,
                'description': newAuction.description,
                'auctionEndTime': newAuction.auctionEndTime,
                'numBids': newAuction.numBids,
                'highestBid': newAuction.highestBid,
                'highestBidder': newAuction.highestBidder,
                'completed': newAuction.completed,
            }
            jsonReceipt = JSON.stringify(receipt);
		    hashedReceipt = web3.utils.sha3(jsonReceipt);

            await contract.auctionEnd(auctionID, hashedReceipt, {from : auctioneer});
            newAuction = await contract.auctions(auctionID);
            const receiptRetrieved = await contract.receipts(auctionID);
            const actBeneficiaryBalance = await web3.eth.getBalance(beneficiary);
            assert(newAuction.completed == true, "State auction after ending was not set correctly");
            assert(actBeneficiaryBalance > beneficiaryBalance, "Amount was not sent to beneficiary");
            assert(receiptRetrieved == hashedReceipt, "Hash of json receipt was not store correctly");

        }
        catch (error){
            console.log(`*** Contract error ***:\n${error.message}`);
        }

    });

});