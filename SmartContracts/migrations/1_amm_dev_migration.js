const AMM = artifacts.require('AMM')
const ERC20PresetMinterPauser = artifacts.require('@openzeppelin/contracts/token/presets/ERC20PresetMinterPauser');

module.exports = async function (deployer) {
  let tokenA = await ERC20PresetMinterPauser.new("tokenA", "TKN"); 
  let tokenB = await ERC20PresetMinterPauser.new("tokenB", "TKN"); 
  let tokenC = await ERC20PresetMinterPauser.new("tokenC", "TKN"); 
  
  await deployer.deploy(AMM, tokenA.address, tokenB.address, tokenC.address, 200, 800, 10);
};
