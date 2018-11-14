'use strict';

const { yargs } = require('./cli-parser');
const getHelp = require('yargs-get-help');

const isTitle = (line) => {
  switch (line) {
    case 'Hubii Blockchain Crawler':
    case 'Syntax':
    case 'Options':
    case 'Examples':
    case 'Option to environment variable correspondence':
      return true;
    default:
      return false;
  }
};

const getMdFormattedHelpText = () => {
  let helpText = getHelp(yargs, [], { normalize: false }).split(/\n/);
  let titleScope = '';

  for (let i = 0; i < helpText.length; ++i) {
    // Remove colon from titles
    helpText[i] = helpText[i].replace(/[ :]+$/, '');

    // Set title scope
    if (isTitle(helpText[i])) {
      titleScope = helpText[i];
    }

    if (titleScope === 'Hubii Blockchain Crawler') {
      if (helpText[i] === 'Hubii Blockchain Crawler') {
        // Highlight title
        helpText[i] = '#### ' + helpText[i];
      }
    }

    if (titleScope === 'Syntax') {
      if (helpText[i] === 'Syntax') {
        // Highlight title
        helpText[i] = '#### ' + helpText[i];
      }
    }

    // Handle options
    if (titleScope === 'Options') {
      if (helpText[i] === 'Options') {
        // Highlight title
        helpText[i] = '#### ' + helpText[i];

        // Prepare table out of options
        helpText = helpText.slice(0, i + 1).concat(
          ['Options | Description', '--- | ---'],
          helpText.slice(i + 1)
        );
      }

      if (helpText[i].match(/[ ]+-[a-zA-Z],/)) {
        helpText[i] = helpText[i].replace(/--[a-zA-Z]+/, s => s + ' |');
        while (!helpText[i].includes(']')) {
          helpText[i] += ' ' + helpText[i + 1];
          helpText = helpText.slice(0, i + 1).concat(helpText.slice(i + 2));
        }
        helpText[i] = helpText[i].replace(/[ ]+/g, ' ');
        helpText[i] = helpText[i].replace(/\[/, s => '<br> ' + s);
      }
    }

    // Handle examples
    if (titleScope === 'Examples') {
      if (helpText[i] === 'Examples') {
        // Highlight title
        helpText[i] = '#### ' + helpText[i];

        // Prepare table out of examples
        helpText = helpText.slice(0, i + 1).concat(
          ['| Example | Description', '--- | ---'],
          helpText.slice(i + 1)
        );
      }

      // Handle example rows
      if (helpText[i].match(/ \$ /)) {
        // Concat example to one line
        while (helpText[i + 1].match(/[a-z]+/) && !helpText[i + 1].match(/ \$ /)) {
          helpText[i] += helpText[i + 1];
          helpText = helpText.slice(0, i + 1).concat(helpText.slice(i + 2));
        }

        // Make table row
        helpText[i] = helpText[i].replace('   ', ' | ');
      }
    }

    if (titleScope === 'Option to environment variable correspondence') {
      if (helpText[i] === 'Option to environment variable correspondence') {
        // Highlight title
        helpText[i] = '#### ' + helpText[i];

        // Prepare table out of environment variables
        helpText = helpText.slice(0, i + 1).concat(
          ['Option | Corresponds to', '--- | ---'],
          helpText.slice(i + 1)
        );
      }

      if (helpText[i].match(/[ ]-/)) {
        helpText[i] = helpText[i].replace('HUBII', '| HUBII');
      }
    }

    // Remove surplus whitespace
    helpText[i] = helpText[i].replace(/[ ]+/g, ' ');
  }

  return helpText.join('\n');
};

module.exports = {
  getMdFormattedHelpText
};
