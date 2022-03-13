const url = `ws://${window.location.host}/ws/auctions/`;
const auctionSocket = new WebSocket(url);

auctionSocket.onopen = function(e) {
    console.log('Websocket connection established');
}



auctionSocket.onmessage = async function(e) {
    let data = JSON.parse(e.data);
    if (web3) {
		let highestBidSection = document.getElementsByClassName('highestBid');
        let numBidsSection = document.getElementsByClassName('numBids');
        let highestBidderSection = document.getElementsByClassName('highestBidder');
		const auction = await contract.methods.auctions(highestBidSection[0].id).call();

        highestBidSection = document.getElementById(highestBidSection[0].id);
		highestBidSection.innerText = `${web3.utils.fromWei(auction.highestBid, 'gwei')} gwei`;

        numBidsSection = document.getElementById('numBids');
        numBidsSection.innerText = `${auction.numBids}`;

        highestBidderSection = document.getElementById('highestBidder');
        if(auction.highestBidder == '0x0000000000000000000000000000000000000000')
        {
            highestBidderSection.innerText = 'Starting Price';
        }
        else
        {
            highestBidderSection.innerHTML = `
            <a href="https://ropsten.etherscan.io/address/${auction.highestBidder}" target="_blank">
            ${auction.highestBidder}
            </a>
            
            `;
        }
        
    }
	await new Promise(r => setTimeout(r, 3000));
    auctionSocket.send(JSON.stringify(data));
}