#!/usr/bin/env bash

set -euo pipefail

: "${GH_REPO:?GH_REPO must be set}"
: "${RUNNER_TEMP:?RUNNER_TEMP must be set}"

workflow_file="${DEPENDABOT_WORKFLOW_FILE:-dependabot-auto-merge.yml}"
max_run_attempts="${MAX_RUN_ATTEMPTS:-6}"
release_age_error="ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION"

if ! [[ "$max_run_attempts" =~ ^[1-9][0-9]*$ ]]; then
  printf 'MAX_RUN_ATTEMPTS must be a positive integer, got %q\n' "$max_run_attempts" >&2
  exit 1
fi

github_api_get() {
  gh api \
    --method GET \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$@"
}

record_error() {
  printf '%s\n' "$1" >&2
  errors=$((errors + 1))
}

pull_requests="$(
  gh pr list \
    --repo "$GH_REPO" \
    --state open \
    --author "app/dependabot" \
    --limit 1000 \
    --json number,headRefOid \
    --jq '.[] | [.number, .headRefOid] | @tsv'
)"

checked=0
blocked=0
retried=0
capped=0
errors=0

if [[ -n "$pull_requests" ]]; then
  while IFS=$'\t' read -r pr_number head_sha; do
    checked=$((checked + 1))

    if ! run_details="$(
      github_api_get \
        "repos/$GH_REPO/actions/workflows/$workflow_file/runs" \
        -f event=pull_request \
        -f head_sha="$head_sha" \
        -f per_page=1 \
        --jq '.workflow_runs[0] | if . == null then empty else [.id, .status, (.conclusion // ""), .run_attempt] | @tsv end'
    )"; then
      record_error "PR #${pr_number}: failed to query workflow runs"
      continue
    fi

    if [[ -z "$run_details" ]]; then
      printf 'PR #%s: no %s run found for %s\n' "$pr_number" "$workflow_file" "$head_sha"
      continue
    fi

    IFS=$'\t' read -r run_id run_status conclusion run_attempt <<< "$run_details"

    if [[ "$run_status" != "completed" ]]; then
      printf 'PR #%s: run %s is %s; skipping\n' "$pr_number" "$run_id" "$run_status"
      continue
    fi

    if [[ "$conclusion" != "failure" ]]; then
      printf 'PR #%s: latest run concluded %s; skipping\n' "$pr_number" "$conclusion"
      continue
    fi

    log_file="$RUNNER_TEMP/dependabot-release-age-$run_id.log"
    if ! gh run view "$run_id" --repo "$GH_REPO" --attempt "$run_attempt" --log-failed > "$log_file"; then
      record_error "PR #${pr_number}: failed to read logs for run $run_id"
      rm -f "$log_file"
      continue
    fi

    if ! grep -Fq "$release_age_error" "$log_file"; then
      printf 'PR #%s: run %s did not fail the release-age check; skipping\n' "$pr_number" "$run_id"
      rm -f "$log_file"
      continue
    fi

    rm -f "$log_file"
    blocked=$((blocked + 1))

    if ! current_pr="$(
      gh pr view "$pr_number" \
        --repo "$GH_REPO" \
        --json headRefOid,state \
        --jq '[.state, .headRefOid] | @tsv'
    )"; then
      record_error "PR #${pr_number}: failed to refresh pull request state"
      continue
    fi

    IFS=$'\t' read -r pr_state current_head <<< "$current_pr"
    if [[ "$pr_state" != "OPEN" ]]; then
      printf 'PR #%s: pull request is now %s; skipping\n' "$pr_number" "$pr_state"
      continue
    fi

    if [[ "$current_head" != "$head_sha" ]]; then
      printf 'PR #%s: head changed from %s to %s; skipping stale run %s\n' \
        "$pr_number" "$head_sha" "$current_head" "$run_id"
      continue
    fi

    if ! refreshed_run="$(
      github_api_get \
        "repos/$GH_REPO/actions/runs/$run_id" \
        --jq '[.status, .run_attempt] | @tsv'
    )"; then
      record_error "PR #${pr_number}: failed to refresh run $run_id"
      continue
    fi

    IFS=$'\t' read -r refreshed_status refreshed_attempt <<< "$refreshed_run"
    if [[ "$refreshed_status" != "completed" || "$refreshed_attempt" != "$run_attempt" ]]; then
      printf 'PR #%s: run %s changed while being inspected; skipping\n' "$pr_number" "$run_id"
      continue
    fi

    if ((refreshed_attempt >= max_run_attempts)); then
      capped=$((capped + 1))
      printf 'PR #%s: run %s reached the %s-attempt limit; skipping\n' \
        "$pr_number" "$run_id" "$max_run_attempts"
      continue
    fi

    printf 'PR #%s: retrying failed jobs in run %s (attempt %s of %s)\n' \
      "$pr_number" "$run_id" "$((refreshed_attempt + 1))" "$max_run_attempts"
    if ! gh run rerun "$run_id" --repo "$GH_REPO" --failed; then
      record_error "PR #${pr_number}: failed to request a rerun for $run_id"
      continue
    fi
    retried=$((retried + 1))
  done <<< "$pull_requests"
fi

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  cat >> "$GITHUB_STEP_SUMMARY" <<EOF
### Dependabot release-age retry

- Open Dependabot PRs checked: $checked
- Release-age failures found: $blocked
- Workflow runs retried: $retried
- Runs at retry limit: $capped
- Processing errors: $errors
EOF
fi

if ((errors > 0)); then
  exit 1
fi
