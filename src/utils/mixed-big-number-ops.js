'use strict';

const ethers = require('ethers');

function toBn (n, decimals) {
  return (n instanceof ethers.utils.BigNumber) ? n : ethers.utils.parseUnits(n.toString(), decimals);
}

function addEth (s1, s2) {
  return addUnits(s1, s2, 18);
}

function subEth (s1, s2) {
  return subUnits(s1, s2, 18);
}

function addUnits (s1, s2, decimals) {
  const a = toBn(s1, decimals);
  const b = toBn(s2, decimals);

  return ethers.utils.formatUnits(a.add(b), decimals);
}

function subUnits (s1, s2, decimals) {
  const a = toBn(s1, decimals);
  const b = toBn(s2, decimals);

  return ethers.utils.formatUnits(a.sub(b), decimals);
}

module.exports = {
  addEth, subEth,
  addUnits, subUnits
};
