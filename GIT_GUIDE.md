# Git Guide — How to Make Changes & Get Them Reviewed

Follow these steps every single time you build something. No exceptions.

---

## The Full Flow (start to finish)

### Step 1 — Get the latest code

Before you start anything, always pull the latest version from GitHub.

```bash
git checkout master
git pull origin master
```

---

### Step 2 — Create your own branch

Never work directly on `master`. Create a branch for whatever you're building.

```bash
git checkout -b feature/short-description
```

Name it something that describes the work:

| What you're building | Branch name |
|---|---|
| Adding books to catalog | `feature/add-missing-books` |
| Fixing a broken button | `fix/checkout-button` |
| Updating the about page | `feature/about-page-content` |
| Razorpay integration | `feature/razorpay-payments` |

---

### Step 3 — Build your feature

Open Claude Code and do your work as normal.

```bash
claude
```

Test it locally at `http://localhost:3000` before moving on.

---

### Step 4 — Check what changed

```bash
git status
```

This shows you every file that was modified or added.

---

### Step 5 — Verify the build passes

```bash
npm run build
```

Must complete with no errors. Fix any errors before committing.

---

### Step 6 — Commit your changes

Add only the files you intentionally changed (don't blindly add everything):

```bash
git add app/the-file-you-changed.tsx
git add lib/another-file.ts
```

Then commit with a short message:

```bash
git commit -m "feat: add missing books to catalog"
```

**Message format:**

| Prefix | When to use |
|---|---|
| `feat:` | New feature or new content |
| `fix:` | Bug fix |
| `chore:` | Cleanup, config, docs |

---

### Step 7 — Push your branch to GitHub

```bash
git push origin feature/your-branch-name
```

---

### Step 8 — Open a Pull Request on GitHub

1. Go to **github.com/bharani-mandapaka/sangitshreeprakashan**
2. You'll see a yellow banner: **"Compare & pull request"** — click it
3. Fill in the PR description (see the template — it will auto-appear)
4. Click **"Create pull request"**
5. Message Bharani: "PR is ready for review"

Bharani will review, leave comments if needed, and merge when it's good to go.
Nothing goes live until the PR is approved and merged.

---

## Quick Reference

```bash
git checkout master              # go to master
git pull origin master           # get latest
git checkout -b feature/name     # create branch
git status                       # see what changed
npm run build                    # verify no errors
git add filename.tsx             # stage a file
git commit -m "feat: message"    # commit
git push origin feature/name     # push to GitHub
# then open PR on GitHub
```

---

## Common Mistakes to Avoid

| Mistake | What to do instead |
|---|---|
| Working directly on `master` | Always create a branch first (Step 2) |
| Pushing to `master` | Always push to your feature branch |
| Committing without building | Always run `npm run build` first |
| Using `git add .` or `git add -A` | Add specific files by name |
| Forgetting to pull before starting | Always start with `git pull origin master` |
| Committing `.env.local` | Never commit it — it holds secrets and must stay off GitHub. Use `.env.example` as the reference for which variables are needed. |

---

## For Claude Code users

The rules above are already encoded in `CLAUDE.md` under **Git workflow (mandatory)**, so
Claude Code follows them automatically. If you start a new project from this one, copy that
section across.
