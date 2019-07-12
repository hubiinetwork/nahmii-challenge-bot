'use strict';

const ethers = require('ethers');


function addEth (s1, s2) {
  const a = (typeof s1 === 'string') ? ethers.utils.parseEther(s1) : s1;
  const b = (typeof s2 === 'string') ? ethers.utils.parseEther(s2) : s2;

  return ethers.utils.formatEther(a.add(b));
}

function subEth (s1, s2) {
  const a = (typeof s1 === 'string') ? ethers.utils.parseEther(s1) : s1;
  const b = (typeof s2 === 'string') ? ethers.utils.parseEther(s2) : s2;

  return ethers.utils.formatEther(a.sub(b));
}

function addUnits (s1, s2, decimals) {
  const a = (typeof s1 === 'string') ? ethers.utils.parseUnits(s1, decimals) : s1;
  const b = (typeof s2 === 'string') ? ethers.utils.parseUnits(s2, decimals) : s2;

  return ethers.utils.formatUnits(a.add(b), decimals);
}

function subUnits (s1, s2, decimals) {
  const a = (typeof s1 === 'string') ? ethers.utils.parseUnits(s1, decimals) : s1;
  const b = (typeof s2 === 'string') ? ethers.utils.parseUnits(s2, decimals) : s2;

  return ethers.utils.formatUnits(a.sub(b), decimals);
}

module.exports = {
  addEth, subEth,
  addUnits, subUnits
};
