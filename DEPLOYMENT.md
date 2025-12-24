# 雙 Repo 部署設定指南 (Dual Repo Deployment Guide)

這個指南將協助您設定將私有倉庫 (Private Repo) 的程式碼自動編譯並部署到公開倉庫 (Public Repo) 的 GitHup Pages。

## 步驟 1: 建立公開倉庫 (Public Repository)

1.  在 GitHub 上建立一個新的 **Public** Repository。
    *   如果您希望網址是 `username.github.io`，請將倉庫命名為 `username.github.io`。
    *   如果是專案頁面 `username.github.io/project-name`，可命名為任意名稱 (例如 `pickleball-public`)。
2.  此倉庫可以是空的，Actions 會自動推送內容。

## 步驟 2: 產生 Personal Access Token (PAT)

為了讓私有倉庫的 Action 能推送程式碼到公開倉庫，我們需要一個權杖。

1.  前往 GitHub 的 [Personal Access Tokens (Tokens (classic))](https://github.com/settings/tokens).
2.  點擊 **Generate new token (classic)**.
3.  **Note**: 填寫描述 (例如: `Deploy Pickleball to Public`).
4.  **Select scopes**: 勾選 `repo` (包含全選 `repo` 下的所有權限).
5.  點擊 **Generate token** 並複製那一串字串 (離開頁面後就看不到了)。

## 步驟 3: 設定私有倉庫的 Secrets

1.  回到您的 **Private Repository** (目前存放程式碼的倉庫)。
2.  前往 **Settings** > **Secrets and variables** > **Actions**.
3.  點擊 **New repository secret**.
4.  **Name**: `API_TOKEN_GITHUB` (這必須跟 `deploy.yml` 裡的變數名稱一致).
5.  **Secret**: 貼上剛剛複製的 Token 字串。
6.  點擊 **Add secret**.

## 步驟 4: 修改 deploy.yml

開啟 `.github/workflows/deploy.yml` 並修改以下內容：

```yaml
external_repository: your-username/your-public-repo-name
```
*   將 `your-username/your-public-repo-name` 替換成步驟 1 建立的公開倉庫完整名稱 (例如 `Zutaas/pickleball-site`)。

## 步驟 5: 啟用 GitHub Pages (在公開倉庫)

Action 第一次跑完後：

1.  前往您的 **Public Repository**。
2.  前往 **Settings** > **Pages**.
3.  在 **Build and deployment** 下的 **Source** 選擇 `Deploy from a branch`.
4.  **Branch** 選擇 `main` (或是您在 yml 設定的 `publish_branch`) / `/ (root)`.
5.  點擊 **Save**.

現在，每次您推送到 Private Repo 的 main 分支，GitHub Actions 就會自動編譯並更新 Public Repo 的內容。
