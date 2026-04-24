'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fetch = require('node-fetch');
var DataLoader = require('dataloader');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

var fetch__default = /*#__PURE__*/_interopDefault(fetch);
var DataLoader__default = /*#__PURE__*/_interopDefault(DataLoader);

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

const _excluded = ["repo"],
      _excluded2 = ["repo"];
const validRepoNameRegex = /^[\w.-]+\/[\w.-]+$/;

function makeQuery(repos) {
  return `
      query {
        ${Object.keys(repos).map((repo, i) => `a${i}: repository(
            owner: ${JSON.stringify(repo.split("/")[0])}
            name: ${JSON.stringify(repo.split("/")[1])}
          ) {
            ${repos[repo].map(data => data.kind === "commit" ? `a${data.commit}: object(expression: ${JSON.stringify(data.commit)}) {
            ... on Commit {
            commitUrl
            associatedPullRequests(first: 50) {
              nodes {
                number
                url
                mergedAt
                author {
                  login
                  url
                }
              }
            }
            author {
              user {
                login
                url
              }
            }
          }}` : `pr__${data.pull}: pullRequest(number: ${data.pull}) {
                    url
                    author {
                      login
                      url
                    }
                    mergeCommit {
                      commitUrl
                      abbreviatedOid
                    }
                  }`).join("\n")}
          }`).join("\n")}
        }
    `;
} // why are we using dataloader?
// it provides use with two things
// 1. caching
// since getInfo will be called inside of changeset's getReleaseLine
// and there could be a lot of release lines for a single commit
// caching is important so we don't do a bunch of requests for the same commit
// 2. batching
// getReleaseLine will be called a large number of times but it'll be called at the same time
// so instead of doing a bunch of network requests, we can do a single one.


const GHDataLoader = new DataLoader__default["default"](async requests => {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("Please create a GitHub personal access token at https://github.com/settings/tokens/new with `read:user` and `repo:status` permissions and add it as the GITHUB_TOKEN environment variable");
  }

  let repos = {};
  requests.forEach((_ref) => {
    let {
      repo
    } = _ref,
        data = _objectWithoutProperties(_ref, _excluded);

    if (repos[repo] === undefined) {
      repos[repo] = [];
    }

    repos[repo].push(data);
  });
  const data = await fetch__default["default"]("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.GITHUB_TOKEN}`
    },
    body: JSON.stringify({
      query: makeQuery(repos)
    })
  }).then(x => x.json());

  if (data.errors) {
    throw new Error(`An error occurred when fetching data from GitHub\n${JSON.stringify(data.errors, null, 2)}`);
  } // this is mainly for the case where there's an authentication problem


  if (!data.data) {
    throw new Error(`An error occurred when fetching data from GitHub\n${JSON.stringify(data)}`);
  }

  let cleanedData = {};
  Object.keys(repos).forEach((repo, index) => {
    let output = {
      commit: {},
      pull: {}
    };
    cleanedData[repo] = output;
    Object.entries(data.data[`a${index}`]).forEach(([field, value]) => {
      // this is "a" because that's how it was when it was first written, "a" means it's a commit not a pr
      // we could change it to commit__ but then we have to get new GraphQL results from the GH API to put in the tests
      if (field[0] === "a") {
        output.commit[field.substring(1)] = value;
      } else {
        output.pull[field.replace("pr__", "")] = value;
      }
    });
  });
  return requests.map((_ref2) => {
    let {
      repo
    } = _ref2,
        data = _objectWithoutProperties(_ref2, _excluded2);

    return cleanedData[repo][data.kind][data.kind === "pull" ? data.pull : data.commit];
  });
});
async function getInfo(request) {
  if (!request.commit) {
    throw new Error("Please pass a commit SHA to getInfo");
  }

  if (!request.repo) {
    throw new Error("Please pass a GitHub repository in the form of userOrOrg/repoName to getInfo");
  }

  if (!validRepoNameRegex.test(request.repo)) {
    throw new Error(`Please pass a valid GitHub repository in the form of userOrOrg/repoName to getInfo (it has to match the "${validRepoNameRegex.source}" pattern)`);
  }

  const data = await GHDataLoader.load(_objectSpread2({
    kind: "commit"
  }, request));
  let user = null;

  if (data.author && data.author.user) {
    user = data.author.user;
  }

  let associatedPullRequest = data.associatedPullRequests && data.associatedPullRequests.nodes && data.associatedPullRequests.nodes.length ? data.associatedPullRequests.nodes.sort((a, b) => {
    if (a.mergedAt === null && b.mergedAt === null) {
      return 0;
    }

    if (a.mergedAt === null) {
      return 1;
    }

    if (b.mergedAt === null) {
      return -1;
    }

    a = new Date(a.mergedAt);
    b = new Date(b.mergedAt);
    return a > b ? 1 : a < b ? -1 : 0;
  })[0] : null;

  if (associatedPullRequest) {
    user = associatedPullRequest.author;
  }

  return {
    user: user ? user.login : null,
    pull: associatedPullRequest ? associatedPullRequest.number : null,
    links: {
      commit: `[\`${request.commit.slice(0, 7)}\`](${data.commitUrl})`,
      pull: associatedPullRequest ? `[#${associatedPullRequest.number}](${associatedPullRequest.url})` : null,
      user: user ? `[@${user.login}](${user.url})` : null
    }
  };
}
async function getInfoFromPullRequest(request) {
  if (request.pull === undefined) {
    throw new Error("Please pass a pull request number");
  }

  if (!request.repo) {
    throw new Error("Please pass a GitHub repository in the form of userOrOrg/repoName to getInfo");
  }

  if (!validRepoNameRegex.test(request.repo)) {
    throw new Error(`Please pass a valid GitHub repository in the form of userOrOrg/repoName to getInfo (it has to match the "${validRepoNameRegex.source}" pattern)`);
  }

  const data = await GHDataLoader.load(_objectSpread2({
    kind: "pull"
  }, request));
  let user = data === null || data === void 0 ? void 0 : data.author;
  let commit = data === null || data === void 0 ? void 0 : data.mergeCommit;
  return {
    user: user ? user.login : null,
    commit: commit ? commit.abbreviatedOid : null,
    links: {
      commit: commit ? `[\`${commit.abbreviatedOid.slice(0, 7)}\`](${commit.commitUrl})` : null,
      pull: `[#${request.pull}](https://github.com/${request.repo}/pull/${request.pull})`,
      user: user ? `[@${user.login}](${user.url})` : null
    }
  };
}

exports.getInfo = getInfo;
exports.getInfoFromPullRequest = getInfoFromPullRequest;
