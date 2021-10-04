const NestedAMMFactory = artifacts.require('NestedAMMFactory')

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(NestedAMMFactory, accounts[5]);
};
