const AMM = artifacts.require('AMM')

module.exports = function (deployer) {
  deployer.deploy(
    AMM,
    '0x2cA48b8c2d574b282FDAB69545646983A94a3286', // TRAX
    '0xC3F72e2D9c0EcE408dCb673452668Cb3F299949a', // PIX
    '0x98dD19075C63D57a8f2109aC8f61aF6aFAFab09b', // DAI
    200,
    800,
    10,
  ); // sigma = 0.2, eta = 0.8, maximum_margin_of_error = 1%
}
