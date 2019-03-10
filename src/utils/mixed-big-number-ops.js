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

module.exports = {
  addEth, subEth
};
