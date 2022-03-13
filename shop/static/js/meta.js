// Global variables
let currentAccount = null;
const contractAddress = "0xB49468A4560f4929211d7E968B8B16f81562831B";
let contract = null;
let web3 = null;

const connectButton = document.getElementById('connectButton');

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        console.log('Please connect to MetaMask.');
        location.reload();
    } else if (accounts[0] !== currentAccount) {

        // Set current account
        currentAccount = accounts[0];

        // Change site layout
        connectButton.removeEventListener('click', login);
        connectButton.innerText = 'Connected to MetaMask';
        connectButton.style.backgroundColor = '#ADFF2F';
        connectButton.style.color = 'black';
        connectButton.style.border = '1px solid black'
        connectButton.style.cursor = 'default';

        
        // Enable interacting with the contract
		if(document.getElementsByClassName('actionButton')[0])
		{
			const buttons = document.getElementsByClassName('actionButton');
			let btn = null;
			for (let i=0; i<buttons.length; i++)
			{
				btn = document.getElementsByClassName('actionButton')[i];
				btn.style.display = 'block';
			}
			
		}
        
    }
}

// Check for a provider
async function init() {
    const provider = await detectEthereumProvider();
    if (provider) {

    // Execute app
    startApp(provider);

    } else {

    // Warn
    console.error('MetaMask is not installed');
    connectButton.innerText = 'Metamask is not available';
    connectButton.style.backgroundColor = "grey";
    connectButton.style.color = 'black';
    connectButton.style.border = '1px solid black'
    connectButton.style.cursor = "not-allowed";
    alert('Please install MetaMask to access the page properly');

    }
}

// Permit connection with MetaMask if it is installed
async function startApp(provider) {

  if (provider !== window.ethereum) {
    console.error('Do you have multiple wallets installed?');
    connectButton.innerText = 'Metamask is not available';
    connectButton.style.backgroundColor = "grey";
    connectButton.style.color = 'black';
    connectButton.style.border = '1px solid black'
    connectButton.style.cursor = "not-allowed";
    alert('Use a single wallet to access the page properly');
  }
  else
  {
	accounts = await ethereum.request({ method: 'eth_accounts' });
	
	if(accounts.length == 0)
	{
		connectButton.addEventListener('click', login);
	}
	else
	{
		login();
	}
	
    
  }

}

// Connect to MetaMask
async function login() {

    await ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(handleAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err);
        }
      });

    try {
        // Initialize web3
        web3 = new Web3(window.ethereum);
        web3.eth.defaultAccount = currentAccount;
		web3.eth.Contract.transactionPollingTimeout = 60*5;

        // Reference to the smart contract
        contract = new web3.eth.Contract(
            abi,
            contractAddress
        );

		contract.transactionPollingTimeout = 60*5;

    }
    catch (error) {
        console.error(error);
    }
}


// Handle events
ethereum.on('chainChanged', handleChainChanged);
ethereum.on('accountsChanged', handleAccountsChanged);
/*
ethereum.on('connect', (info) => {
    console.log(info);
});
*/

function handleChainChanged(_chainId) {
    window.location.reload();
}

// Handle request for contribute contract method
async function bid(auctionID)
{
    const bidForm = document.getElementById(`bidForm${auctionID}`);
    let amount = bidForm.elements['amount'].value;
	amount = web3.utils.toWei(amount, 'gwei');
    
    try {
		const gasPrice = await web3.eth.getGasPrice().then((result) => {
			console.log(`Estimated gas price: ${web3.utils.fromWei(result, 'gwei')}`);
			return web3.utils.fromWei(result, 'gwei')
		})
        await contract.methods.bid(auctionID).send({
            from : currentAccount,
			gas: 150000,
			gasPrice: web3.utils.toWei(gasPrice, 'gwei'), 
            value : amount,
    }).then( (result) => {
		const txReceipt = document.getElementById('txReceipt');
		txReceipt.innerHTML = `
		<hr>
		<h4>See Your Last Transaction:</h4>
		<a href="https://ropsten.etherscan.io/tx/${result.transactionHash}" target="_blank">
			View on etherscan
		</a>
		<hr>
		`
        alert('Your bid was sent correctly. Thank you!');
    });
    }
    catch (error) {
		if(error.code == 4001)
		{
			console.error(error);
		}
		else if (error.code == -32603)
		{
			alert('Transaction failed: Your bid value is lower than the highest bid');
		}
		else if(error.code == -32603)
		{
			alert('Gas price is not sufficient for this transaction');
		}
        else
		{
			console.error(error);
			alert(error.message);
		}
        
    }
    
}

async function newAuction()
{
	let auctionForm = document.getElementById('auctionForm');
	const beneficiary = auctionForm.elements['beneficiary'].value;
	const description = auctionForm.elements['description'].value;
	let startingPrice = auctionForm.elements['startingPrice'].value;

	startingPrice = web3.utils.toWei(startingPrice, 'gwei');

	let biddingTime = auctionForm.elements['biddingTime'].value;
	biddingTime = Math.round(new Date(biddingTime)/1000) - Math.round(new Date().getTime()/1000);
	
	try {
		const gasPrice = await web3.eth.getGasPrice().then((result) => {
				console.log(`Estimated gas price: ${web3.utils.fromWei(result, 'gwei')}`);
				return web3.utils.fromWei(result, 'gwei')
		})
        await contract.methods.newAuction(beneficiary, description, startingPrice, biddingTime).send({
            from: currentAccount,
			gas: 200000,
			gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
    }).then( async (result) => {

		const numAuctions = await contract.methods.numAuctions().call();
		const auction = await contract.methods.auctions(numAuctions - 1).call();
		auctionForm = new FormData(auctionForm);
		auctionForm.append('auctionID', `${numAuctions - 1}`);
		auctionForm.append('auctionEndTime', `${auction.auctionEndTime}`);
		const request = new XMLHttpRequest();
		request.open('POST', '');
		request.send(auctionForm);
		alert(`Your auction was created correctly. Tx hash: ${result.transactionHash}, Thank you!`);
		window.location.replace(`http://${window.location.host}/auctions/list`);
		
    });
    }
    catch (error) {
        if(error.code == 4001)
		{
			console.error(error);
		}
		else if (error.code == 'INVALID_ARGUMENT')
		{
			alert('Some fields are not correct. Try again...');
		}
		else if(error.code == -32603)
		{
			alert('Gas price is not sufficient for this transaction');
		}
        else
		{
			console.error(error);
			alert(error.message);
		}
    }
	
}

async function auctionEnd(auctionID)
{
	try {

		const auction = await contract.methods.auctions(auctionID).call();
		receipt = {
			'auctionID': auctionID,
			'beneficiary': auction.beneficiary,
			'description': auction.description,
			'auctionEndTime': auction.auctionEndTime,
			'numBids': auction.numBids,
			'highestBid': auction.highestBid,
			'highestBidder': auction.highestBidder,
			'completed': auction.completed,
		}
		
		jsonReceipt = JSON.stringify(receipt);
		hashedReceipt = web3.utils.sha3(jsonReceipt);

		const gasPrice = await web3.eth.getGasPrice().then((result) => {
			console.log(`Estimated gas price: ${web3.utils.fromWei(result, 'gwei')}`);
			return web3.utils.fromWei(result, 'gwei')
		})

        await contract.methods.auctionEnd(auctionID, hashedReceipt).send({
            from : currentAccount,
			gas: 150000,
			gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
    }).then( (result) => {
        
		const auctionForm = document.getElementById('endForm');
		const request = new XMLHttpRequest();
		request.open('POST', '');
		response = new FormData(auctionForm);

		response.append('auctionID', auctionID);
		response.append('numBids', auction.numBids);
		response.append('highestBid', auction.highestBid);
		response.append('highestBidder', auction.highestBidder);
		response.append('txReceipt', result.transactionHash);
		request.send(response);
		alert(`Auction ${auctionID} was ended properly. Thank you!`);
		
		location.reload();
    });
    }
    catch (error) {
        if(error.code == 4001)
		{
			console.error(error);
		}
		else if(error.code == -32603)
		{
			alert('Gas price is not sufficient for this transaction');
		}
        else
		{
			console.error(error);
			alert(error.message);
		}
    }
}

async function withdraw() {

	const withdrawForm = document.getElementById('withdrawForm');
	const auctionID = withdrawForm.elements['auctionID'].value

	try {
		const gasPrice = await web3.eth.getGasPrice().then((result) => {
			console.log(`Estimated gas price: ${web3.utils.fromWei(result, 'gwei')}`);
			return web3.utils.fromWei(result, 'gwei')
		})
        await contract.methods.withdraw(auctionID).send({
            from : currentAccount,
			gas: 100000,
			gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
    	});

		alert('Your amount has been sent you back');
    }
    catch (error) {
        if(error.code == 4001)
		{
			console.error(error);
		}
		else if (error.code == -32603)
		{
			alert('Transaction failed: AuctionID is not correct or you don\'t comply with the requirements');
		}
		else if(error.code == -32603)
		{
			alert('Gas price is not sufficient for this transaction');
		}
        else
		{
			console.error(error);
			alert(error.message);
		}
    }
	

}

async function addAuctioneer()
{
	const form = document.getElementById('addAuctioneerForm');
	const address = form.elements['address'].value;

	try {
		const gasPrice = await web3.eth.getGasPrice().then((result) => {
			console.log(`Estimated gas price: ${web3.utils.fromWei(result, 'gwei')}`);
			return web3.utils.fromWei(result, 'gwei')
		})
		await contract.methods.addAuctioneer(address).send({
			from: currentAccount,
			gas: 100000,
			gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
		});

		alert(`Address ${address} is now an auctioneer`);

	}
	catch (error){
		if(error.code == 4001)
		{
			console.error(error);
		}
		else if (error.code == 'INVALID_ARGUMENT')
		{
			alert('Entered address is not correct. Try again...')
		}
		else if(error.code == -32603)
		{
			alert('Gas price is not sufficient for this transaction');
		}
        else
		{
			console.error(error.code);
			alert(error.message);
		}
	}
}

async function removeAuctioneer()
{
	const form = document.getElementById('removeAuctioneerForm');
	const address = form.elements['address'].value;

	try {
		const gasPrice = await web3.eth.getGasPrice().then((result) => {
			console.log(`Estimated gas price: ${web3.utils.fromWei(result, 'gwei')}`);
			return web3.utils.fromWei(result, 'gwei')
		})

		await contract.methods.removeAuctioneer(address).send({
			from: currentAccount,
			gas: 100000,
			gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
		});

		alert(`Address ${address} is not an auctioneer anymore`);

	}
	catch (error){
		if(error.code == 4001)
		{
			console.error(error);
		}
		else if (error.code == 'INVALID_ARGUMENT')
		{
			alert('Entered address is not correct. Try again...')
		}
		else if(error.code == -32603)
		{
			alert('Gas price is not sufficient for this transaction');
		}
        else
		{
			console.error(error);
			alert(error.message);
		}
	}
}

window.addEventListener('DOMContentLoaded', () => {
    init();
});


const abi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_companyName",
				"type": "string"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "auctionID",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "beneficiary",
				"type": "address"
			}
		],
		"name": "AuctionEnded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "AuctioneerAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "AuctioneerRemoved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "auctionID",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "bidder",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "HighestBidIncreased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "auctionID",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "beneficiary",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "auctionEndTime",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "startingPrice",
				"type": "uint256"
			}
		],
		"name": "NewAuctionCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "NewOwnership",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "NewPendingOwnership",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "acceptOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_account",
				"type": "address"
			}
		],
		"name": "addAuctioneer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "auctionID",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			}
		],
		"name": "auctionEnd",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "auctions",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "beneficiary",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "auctionEndTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "numBids",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "highestBid",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "highestBidder",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "completed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "auctionID",
				"type": "uint256"
			}
		],
		"name": "bid",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "companyName",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "governor",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_account",
				"type": "address"
			}
		],
		"name": "isAuctioneer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_beneficiary",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_startingPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_biddingTime",
				"type": "uint256"
			}
		],
		"name": "newAuction",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "numAuctions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "numReceipts",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "pendingGovernor",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "receipts",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_account",
				"type": "address"
			}
		],
		"name": "removeAuctioneer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceAuctioneer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newGovernor",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "auctionID",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]