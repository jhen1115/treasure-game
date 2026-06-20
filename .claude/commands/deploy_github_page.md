Deploy this project to GitHub Pages. Work through each phase below, running all shell commands via Bash. Communicate clearly with the user at each step.

---

## Phase 1 — Verify prerequisites

Run the following checks and handle any failures before moving on:

```bash
git --version
node --version
npm --version
gh --version
```

- **git / node / npm missing**: tell the user to install the missing tool and stop.
- **gh (GitHub CLI) missing**: tell the user to run `brew install gh` (macOS) or visit https://cli.github.com, then stop.

Check GitHub CLI auth status:
```bash
gh auth status
```
- If not authenticated, tell the user to type `! gh auth login` in this chat prompt and follow the prompts, then re-run this command once logged in.

---

## Phase 2 — Install dependencies

Check whether `node_modules` exists:
```bash
ls node_modules 2>/dev/null | head -1 || echo "MISSING"
```
If missing, run:
```bash
npm install
```

---

## Phase 3 — Ensure git is initialised and committed

```bash
git status
```
- If "not a git repository": run `git init`
- Stage and commit any uncommitted changes so the working tree is clean:
  ```bash
  git add -A
  git commit -m "chore: prepare for GitHub Pages deployment" --allow-empty
  ```

---

## Phase 4 — Create or link a GitHub repository

Check for an existing remote:
```bash
git remote get-url origin 2>/dev/null || echo "NO_REMOTE"
```

**If no remote exists:**

1. Determine the repo name — use the current directory name as the default:
   ```bash
   basename "$PWD"
   ```
2. Create a public GitHub repo, set it as `origin`, and push:
   ```bash
   gh repo create <repo-name> --public --source=. --remote=origin --push
   ```
   (Replace `<repo-name>` with the actual name.)

**If a remote already exists**, just push the current branch:
```bash
git push -u origin HEAD
```

---

## Phase 5 — Set the Vite base URL for GitHub Pages

GitHub Pages serves the site at `https://<username>.github.io/<repo-name>/`, so Vite must know the sub-path.

1. Get the repo name and owner:
   ```bash
   gh repo view --json name,owner --jq '"/" + .owner.login + "/" + .name + "/"'
   ```
   Wait — GitHub Pages base is just `/<repo-name>/`, not the full path. Derive it:
   ```bash
   gh repo view --json name --jq '"/" + .name + "/"'
   ```

2. Open `vite.config.ts` and add `base: '/<repo-name>/',` inside `defineConfig({`. For example:
   ```ts
   export default defineConfig({
     base: '/my-repo-name/',
     plugins: [react()],
     ...
   })
   ```
   Edit the file with the correct value. If a `base` line already exists, update it.

3. Commit the change:
   ```bash
   git add vite.config.ts
   git commit -m "chore: set Vite base for GitHub Pages"
   git push
   ```

---

## Phase 6 — Build the project

```bash
npm run build
```

If the build fails, read the error output, fix the issue, and retry before continuing.

---

## Phase 7 — Deploy to GitHub Pages

Use the `gh-pages` package (already in devDependencies) to push the `build/` folder to the `gh-pages` branch:

```bash
npx gh-pages -d build
```

This may take up to a minute. Wait for the command to exit successfully.

---

## Phase 8 — Enable GitHub Pages in repo settings (if needed)

Check whether Pages is already configured:
```bash
gh api repos/{owner}/{repo}/pages 2>/dev/null || echo "PAGES_NOT_CONFIGURED"
```

If not configured, enable it from the `gh-pages` branch:
```bash
gh api repos/{owner}/{repo}/pages \
  --method POST \
  -f build_type=legacy \
  -f source.branch=gh-pages \
  -f source.path=/
```

Replace `{owner}` and `{repo}` with the actual values from `gh repo view --json owner,name`.

---

## Phase 9 — Report the URL to the user

Get the deployed URL:
```bash
gh api repos/{owner}/{repo}/pages --jq .html_url
```

Tell the user:
- The live URL (e.g. `https://<username>.github.io/<repo-name>/`)
- GitHub Pages can take **1–3 minutes** to go live after the first deployment. If they see a 404, wait a moment and refresh.

---

## Important limitations to communicate

This app has a Node.js backend (`server.cjs`) that handles authentication and score saving. **GitHub Pages only serves static files**, so:

- The game UI will work fully (chests, scoring, animations).
- Login / sign-up and score history **will not work** on the GitHub Pages deployment — those features require the backend.
- If the user wants full functionality online, suggest deploying to a platform like **Vercel**, **Railway**, or **Render** that can run Node.js.
