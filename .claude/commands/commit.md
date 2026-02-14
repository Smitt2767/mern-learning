Commit the currently staged changes.

1. Run `git diff --cached` to see all staged changes
2. Run `git log --oneline -5` to see recent commit style
3. Craft a commit message following https://commitlint.js.org/ conventional commit format:
   - **Title**: Very minimal, use format `type(scope): short description` (e.g. `feat(auth): add login endpoint`)
   - Types: feat, fix, chore, refactor, docs, style, test, perf, ci, build
   - **Body**: Brief description summarizing what changed and why — cover all staged changes but keep it concise (2-4 lines max)
4. Commit using a HEREDOC for proper formatting
5. Run `git status` after to verify success
