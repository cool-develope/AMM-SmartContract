const NestedAMMFactory = artifacts.require('NestedAMMFactory')

module.exports = async function (deployer) {
  await deployer.deploy(NestedAMMFactory, "0xdf4DedE67d9A086ad7EDeC69886101bE8D2CEa35");
  const instance = await NestedAMMFactory.deployed()

  await instance.setFeeTo("0xdf4DedE67d9A086ad7EDeC69886101bE8D2CEa35");
};
