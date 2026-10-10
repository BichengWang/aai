# Main branch checks

After these workflows merge and both checks have reported on a new PR, KW should
enable the main branch ruleset in [main-ruleset.json](main-ruleset.json):

- Require a pull request and an up-to-date branch before merging.
- Require `ci-gate` and `attribution-guard`, each pinned to the GitHub Actions
  integration (ID `15368`).
- Keep the bypass list empty, including for repository administrators.
- Block force pushes and branch deletion.

From the repository root, this command creates the ruleset. It is an operator
step; adding the file does not apply it:

```sh
gh api --method POST repos/BichengWang/aai/rulesets \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  --input .github/main-ruleset.json
```

The [ruleset API](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset)
defines the required check contexts and their integration IDs. No review approval
is required, so the existing `auto-merge` label flow remains available.

`ci-gate` runs on every PR and merge group. It replays the attribution rules and
calls the homepage and turo checks only for relevant paths. `attribution-guard`
runs on PR metadata changes using only the base checkout and read-only API data.
It normalizes text, rejects forbidden attribution and identities, and annotates
ordinary vendor mentions as warnings. The exemption follows the PR author login,
not the user who triggered the workflow. PRs with more than 250 commits fail
closed because the PR commits API cannot return their complete history.

Run the offline replay with:

```sh
node --test .github/scripts/attribution-guard.test.cjs
```

The snapshot covers the last 30 PRs in local first-parent history at #190 through
#158. Branch names and author logins come from PR metadata; messages and git
identities are read from those local commits. The expected branch rejections are
#160, #175, #186, #187 and #188; their commit attribution still passes. The test
output lists each branch and its expected result. The replay needs full git
history, which the gate checkout fetches. Merge queue enablement is a separate
step: the attribution guard would also need a check on each merge group.
