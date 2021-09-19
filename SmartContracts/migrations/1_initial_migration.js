const AMM = artifacts.require("AMM");

module.exports = function (deployer) {
  deployer.deploy(AMM, 200, 800);
};
