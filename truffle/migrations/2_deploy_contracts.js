const Auctions = artifacts.require('Auctions.sol');

module.exports = function(deployer) {
    deployer.deploy(Auctions, "EcoSneakers");
};