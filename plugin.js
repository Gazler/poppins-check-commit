var util = require('util');

var checkCommit;

module.exports = function (poppins) {
  var plugins = poppins.plugins;

  if (!plugins.prChecklist) {
    throw new Error('poppins-check-commit requires poppins-pr-checklist to be loaded first');
  }

  checkCommit = plugins.checkCommit = {
    message: "PR's commit messages follow the [commit message format]" +
        "(https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit-message-format)",

    condition: function (pr) {
      return poppins.
          getCommits(pr.number).
          then(function (commits) {
            var problem;
            commits.some(function (data) {
              return (problem = plugins.checkCommit.check(data.commit.message)).length > 0;
            });
            return problem;
          });
    },

    check: getFeedbackForMessage,

    maxLength: 100,
    pattern: /^(?:fixup!\s*)?(\w*)(\(([\w\$\.\-\*/]*)\))?\: (.*)$/,
    types: [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'chore',
      'revert'
    ],
  };


  plugins.prChecklist.checks.push(plugins.checkCommit);
};




function getFeedbackForMessage (message) {
  message = message.split('\n')[0];

  if (message.length > checkCommit.maxLength) {
    return util.format('`%s` is longer than %d characters', message, checkCommit.maxLength);
  }

  var match = checkCommit.pattern.exec(message);

  if (!match) {
    return util.format('`%s` does not match `<type>(<scope>): <subject>`', message);
  }

  var type = match[1];

  if (checkCommit.types.indexOf(type) === -1) {
    return util.format('`%s` is not an allowed type; allowed types are %s.',
        type, checkCommit.types.map(backtick).join(', '));
  }

  return '';
}

function backtick (str) {
  return '`' + str + '`';
}
