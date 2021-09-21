const AMM = artifacts.require('AMM')

module.exports = function (deployer) {
  deployer.deploy(
    AMM,
    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    '0xf76D4a441E4ba86A923ce32B89AFF89dBccAA075',
    '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
    200,
    800,
    10,
  ); // sigma = 0.2, eta = 0.8, maximum_margin_of_error = 1%
}
