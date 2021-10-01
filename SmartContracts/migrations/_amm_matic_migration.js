const AMM = artifacts.require('AMM')

module.exports = function (deployer) {
  deployer.deploy(
    AMM,
    '0x7B4ff840F174061C22E7F473a4881F68d3C38fc2', // TRAX
    '0x501E02d78c54dd8eA451223cdE11618DDD738bc3', // PIX
    '0x71A38f67493fc8889663024f8F9fae3F36D1AAa5', // DAI
    200,
    800,
    10,
  ); // sigma = 0.2, eta = 0.8, maximum_margin_of_error = 1%
}
