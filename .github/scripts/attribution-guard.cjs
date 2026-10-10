function normalize(value) {
  return String(value ?? '').normalize('NFKC')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/gu, '');
}

function evaluateAttribution(rules, { actor, branch, title, body, commits = [] }) {
  const errors = [];
  const warnings = [];
  if (rules.identity.exempt_actors.includes(actor)) return { errors, warnings };

  function match(patterns, value, label, results) {
    const text = normalize(value);
    for (const pattern of patterns) {
      if (new RegExp(pattern, 'iu').test(text)) results.push(`${label}: matches ${pattern}`);
    }
  }

  function checkText(value, label) {
    match(rules.text.deny, value, label, errors);
    match(rules.text.warn, value, label, warnings);
  }

  match(rules.branch.deny, branch, 'Head branch', errors);
  checkText(title, 'PR title');
  checkText(body, 'PR body');
  for (const { sha, commit } of commits) {
    checkText(commit.message, `Commit ${sha} message`);
    for (const role of ['author', 'committer']) {
      match(rules.identity.deny_name, commit[role].name, `Commit ${sha} ${role} name`, errors);
      match(rules.identity.deny_email, commit[role].email, `Commit ${sha} ${role} email`, errors);
    }
  }
  return { errors, warnings };
}

async function checkPullRequest({ github, context, core, rules }) {
  const params = { ...context.repo, pull_number: context.payload.pull_request.number };
  const { data: pr } = await github.rest.pulls.get(params);
  if (pr.head.sha !== context.payload.pull_request.head.sha) {
    core.setFailed('The pull request head changed; verify the latest revision.');
    return;
  }
  if (rules.identity.exempt_actors.includes(pr.user.login)) {
    core.info('The pull request author is exempt from the attribution rules.');
    return;
  }

  const commits = await github.paginate(github.rest.pulls.listCommits, { ...params, per_page: 100 });
  if (commits.length !== pr.commits || commits.at(-1)?.sha !== pr.head.sha) {
    core.setFailed('Could not verify every commit at the pull request head. The PR API returns at most 250 commits.');
    return;
  }
  const { data: current } = await github.rest.pulls.get(params);
  if (current.head.sha !== pr.head.sha || current.head.ref !== pr.head.ref ||
      current.title !== pr.title || current.body !== pr.body) {
    core.setFailed('The pull request changed during verification; verify the latest revision.');
    return;
  }

  const { errors, warnings } = evaluateAttribution(rules, {
    actor: pr.user.login, branch: pr.head.ref, title: pr.title, body: pr.body, commits,
  });
  for (const warning of warnings) core.warning(warning);
  for (const error of errors) core.error(error);
  if (errors.length) core.setFailed(`Attribution rules rejected ${errors.length} field(s).`);
}

module.exports = { normalize, evaluateAttribution, checkPullRequest };
