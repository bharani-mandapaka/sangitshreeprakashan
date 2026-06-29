# Git Commit & Push Instructions

Follow these steps every single time you build something. No exceptions.

---

## Before you start any new work

Always do this first:

```bash
git checkout master
git pull origin master
git checkout -b feature/short-description
```

Name your branch after what you're building:

| What you're building | Branch name |
|---|---|
| Adding books to catalog | `feature/add-missing-books` |
| Fixing a broken button | `fix/checkout-button` |
| Razorpay integration | `feature/razorpay-payments` |
| Updating the about page | `feature/about-page-content` |

---

## When you're done building

```bash
# 1. Check what changed
git status

# 2. Verify the build passes — fix any errors before continuing
npm run build

# 3. Add only the files you intentionally changed
git add app/the-file-you-changed.tsx
git add lib/another-file.ts

# 4. Commit with a short message
git commit -m "feat: add missing books to catalog"

# 5. Push your branch
git push origin feature/your-branch-name
```

---

## After pushing — open a Pull Request

1. Go to **github.com/bharani-mandapaka/sangitshreeprakashan**
2. Click the yellow banner: **"Compare & pull request"**
3. Fill in the description (what you changed, why, how to test)
4. Click **"Create pull request"**
5. Message Bharani: *"PR is ready for review"*

Bharani will review and merge. Nothing goes live until he approves.

---

## Commit message format

```
feat: add missing books to catalog
fix: checkout button not responding on mobile
chore: update handover document
```

| Prefix | When to use |
|---|---|
| `feat:` | New feature or new content |
| `fix:` | Bug fix |
| `chore:` | Cleanup, config, docs |

---

## The rules — never break these

- **Never work on `master` directly** — always create a branch first
- **Never push to `master`** — always push to your feature branch
- **Always run `npm run build` before committing** — if it fails, fix it first
- **Never use `git add .` or `git add -A`** — add files by name only
- **Never commit `.env.local`** — that file has secrets, it must stay off GitHub

---

## For Claude Code users

Add this to your `CLAUDE.md` so Claude follows the git rules automatically:

```
## Git workflow (mandatory)

- NEVER commit or push directly to master
- Always start work with: git checkout master && git pull origin master
- Always create a feature branch first: git checkout -b feature/description
- Always run npm run build before committing — fix any errors first
- Push to the feature branch: git push origin feature/branch-name
- After pushing, remind the user to open a Pull Request on GitHub
```

---

## Quick reference

```bash
git checkout master              # go to master
git pull origin master           # get latest code
git checkout -b feature/name     # create your branch
git status                       # see what changed
npm run build                    # verify no errors
git add filename.tsx             # stage a specific file
git commit -m "feat: message"    # commit
git push origin feature/name     # push to GitHub
# then open PR on GitHub and message Bharani
```
