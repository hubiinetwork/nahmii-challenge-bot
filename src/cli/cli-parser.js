'use strict';

const envPrefix = 'HUBII_NCP';

const yargs = require('yargs')
  .env(envPrefix)
  .scriptName('index.js')
  .strict()
  .usage('\n$0\n' +
    '============\n' +
    '\n' +
    'Nahmii challenge bot\n' +
    '\n' +
    'The $0 script is a bot that challenges nahmii settlements. ' +
    '\n' +
    'Syntax\n' +
    '\n' +
    'Usage: `node $0 `\n')
  .alias('h', 'help')
  .alias('v', 'version')
  .option('H', {
    alias: 'Help',
    describe: 'Write help information in markdown format (md) and terminate. That output can be uses as content of README.md on GitHub.',
    type: 'boolean',
    nargs: 0,
    default: false
  })
  .epilog(
    'Option to environment variable correspondence\n' +
    `\n`
  );

const parse = (processArgv) => {
  return yargs.parse(processArgv);
};

module.exports = {
  parse,
  yargs
};
