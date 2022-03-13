const url = `ws://${window.location.host}/ws/auctions/`;
const auctionSocket = new WebSocket(url);

auctionSocket.onopen = function(e) {
    console.log('Websocket connection established');
}



auctionSocket.onmessage = async function(e) {
    let data = JSON.parse(e.data);
	const auctionsIDs = data.auctionsIDs;
    if (web3) {
		for(i=0; i < auctionsIDs.length; i++) {
		const highestBidSection = document.getElementById(`highestBid${auctionsIDs[i]}`);
		const auction = await contract.methods.auctions(auctionsIDs[i]).call();
		highestBidSection.innerText = `${web3.utils.fromWei(auction.highestBid, 'gwei')} gwei`;
	}
    }
	await new Promise(r => setTimeout(r, 3000));
    auctionSocket.send(JSON.stringify(data));
}



















