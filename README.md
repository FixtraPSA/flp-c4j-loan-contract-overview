## Commit Message Guidelines

We follow the **Conventional Commits** format, enforced by Commitlint.

#### Format

`<type>(<jira-ticket>): <short description>`

Example:

`feat(CPP-123): add user onboarding flow`

#### 🔧 Commit Types

- `feat` – New feature
- `fix` – Bug fix
- `docs` – Documentation-only changes
- `style` – Code style changes (formatting, linting, etc)
- `refactor` – Code change that doesn’t fix a bug or add a feature
- `test` – Adding or updating tests
- `chore` – Maintenance tasks (e.g. bumping dependencies, build configs)

#### 🎯 Scope (JIRA Ticket)

- **Required** for `feat` and `fix`
- Use the related JIRA ticket ID (e.g., `CPP-123`, `CPPJSW-456`)
- Optional (but encouraged) for other types

#### ✅ Examples

- `feat(CPP-101): support multi-tenant login`
- `fix(CPPJSW-202): handle null pointer in user service`
- `docs: update API usage in README`
- `chore: update dependencies`

#### 🛠 Best Practices

- Use imperative tone: “add” not “added”
- Keep it concise and meaningful
- Use `git commit` or CLI tools with the correct format

## Branching and Release Workflow

This repository uses a simplified Git workflow with two long-lived branches: `main` and `development`.

### Branch Roles

| Branch            | Purpose                      | Deployment Target |
| ----------------- | ---------------------------- | ----------------- |
| `development`     | Active development, unstable | _None_            |
| `main`            | Release candidate, QA-tested | QA                |
| Git tag on `main` | Verified release             | Production        |

---

### Workflow

#### 1. Feature Development

- New features or fixes are developed in branches like `feat/*` or `fix/*`.
- These are merged into `development` using either squash or merge commits.
- `development` contains work in progress and is not deployed.

#### 2. QA Release

- When ready for QA testing:
  - Merge `development` into `main` using a **merge commit**.
  - This triggers a QA deployment from the latest commit on `main`.

#### 3. Production Release

- After QA passes, `release-please` opens a PR on `main`:
  - Updates the changelog
  - Bumps the version
- Merge the `release-please` PR into `main` using a **merge commit**.
- A Git tag (e.g., `v1.3.0`) is created automatically, triggering a production deployment.

#### 4. Post-Release Sync

- Merge `main` back into `development` using a **merge commit** to sync version and changelog updates.

---

### Hotfixes

- Create a hotfix branch from `main` (e.g., `hotfix/issue-id`).
- Apply the fix and merge it into `main` using a **merge commit**.
- `release-please` will tag the fix (e.g., `v1.3.1`) and trigger a production deployment.
- Merge `main` back into `development` to keep branches aligned.

---

### Merge Strategy Summary

| Source        | Target        | Purpose             | Strategy        |
| ------------- | ------------- | ------------------- | --------------- |
| `feat/*`      | `development` | Feature development | Squash or Merge |
| `development` | `main`        | QA release          | Merge commit    |
| `main`        | `development` | Post-release sync   | Merge commit    |
| `hotfix/*`    | `main`        | Critical fix        | Merge commit    |
| `main`        | `development` | Sync after hotfix   | Merge commit    |
