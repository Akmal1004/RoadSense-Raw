# Repository Configuration Guide — GitHub Pages & CI/CD Environment

This guide provides instructions for configuring your GitHub repository to support automated deployment to GitHub Pages and live Selenium E2E execution.

---

## 1. Enabling GitHub Pages

1. Navigate to your repository on GitHub: `https://github.com/<username>/<repository-name>`
2. Click **Settings** (top navigation tab).
3. In the left sidebar under **Code and automation**, click **Pages**.
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch` (or `GitHub Actions`).
   - **Branch**: Select `gh-pages` / `/ (root)`.
5. Click **Save**.

---

## 2. Workflow Permissions Configuration

1. In repository **Settings**, select **Actions** -> **General** from the left sidebar.
2. Scroll to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Check **Allow GitHub Actions to create and approve pull requests**.
5. Click **Save**.

---

## 3. Environment Variables & Secrets (Optional)

The workflow automatically detects your GitHub username and repository name using GitHub standard environment variables:
- `BASE_URL`: Defaults to `https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/`

If custom domain or secrets are required:
1. Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
2. Add Repository Variable `BASE_URL` with your target URL.
