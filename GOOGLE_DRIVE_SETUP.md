# Connecting Google Drive

Until this is set up, the app stores uploaded photos/documents locally (in the `uploads/`
folder) instead of Google Drive. Everything else works the same — the vendor upload flow,
the "create folder" prompt, etc. Once you complete the steps below, new uploads
automatically start going to Drive instead — no restart needed. Existing local uploads are
not migrated automatically.

Everything below (Client ID, Client Secret, Refresh Token, destination folder) is entered
directly in the app at **Settings** (log in as Authority → Settings). Nothing needs to be
typed into a config file on the server.

## 1. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and sign in with the
   Google account whose Drive you want to use (e.g. your work Gmail).
2. Click the project dropdown at the top → **New Project**.
3. Name it something like `ppw-lite` → **Create**.

## 2. Enable the Google Drive API

1. In the left sidebar: **APIs & Services → Library**.
2. Search for **Google Drive API** → click it → **Enable**.

## 3. Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen**.
2. User type: **External** (unless you have a Google Workspace org, then **Internal** is fine).
3. Fill in the app name (e.g. "PPW Lite"), your email for support/developer contact → **Save
   and Continue** through the remaining steps.
4. On the **Test users** step, add the Google account email you'll use to own the Drive
   folder (your own email is fine).

## 4. Create OAuth credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorized redirect URIs**, add:
   `https://developers.google.com/oauthplayground`
4. Click **Create**. You'll see a **Client ID** and **Client Secret** — keep this tab open,
   you'll need to copy both in a minute.

## 5. Get a refresh token

We use the [Google OAuth Playground](https://developers.google.com/oauthplayground) to
generate a long-lived refresh token once — the app then uses that token to act as you when
creating folders/uploading files, without needing you to log in again.

1. Go to [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground).
2. Click the gear icon (top right) → check **Use your own OAuth credentials** → paste in the
   Client ID and Client Secret from step 4.
3. In the left panel, find **Drive API v3** → select the scope
   `https://www.googleapis.com/auth/drive.file`.
4. Click **Authorize APIs**, sign in with the Google account from step 3, and allow access.
5. Click **Exchange authorization code for tokens**.
6. Copy the **Refresh token** shown.

## 6. Enter the credentials in the app

Log in as Authority, go to **Settings**, and under **Google OAuth Credentials** paste in:

- **Client ID** (from step 4)
- **Client Secret** (from step 4)
- **Refresh Token** (from step 5)

Click **Save**. These are stored in the app's database — you never need to touch a config
file, and only someone with admin access to the app can see or change them. If you ever need
to rotate credentials, just paste new values in and save again; the old ones are overwritten.

## 7. Pick the destination folder

Still on the Settings page, under **Google Drive Folder**:

1. In [drive.google.com](https://drive.google.com), create (or pick) a folder to hold all
   work order subfolders (e.g. "PPW Work Orders").
2. Open it and copy the link from your browser's address bar (looks like
   `https://drive.google.com/drive/folders/1AbC...`).
3. Paste the link into the Settings page → **Save**.

New "Create Folder to Upload" actions on work orders will now create real folders (named
after the property address) inside that Drive folder, and photo/document uploads will land
there. If you ever want uploads to go to a different folder, just paste a new link on the
Settings page — no restart needed.

## Notes

- The `drive.file` scope only grants access to files/folders the app itself creates — it
  cannot see the rest of your Drive.
- The refresh token doesn't expire unless you revoke it (Google Account → Security → Third
  party access) or leave it unused for 6 months.
- Don't paste these values into chat with an AI assistant or anywhere outside the Settings
  page — they grant write access to the Drive folder you connect.
- (Advanced/production alternative: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
  `GOOGLE_REFRESH_TOKEN` can also be set as environment variables if you're deploying with a
  secrets manager. Values entered in Settings take priority over these if both are set.)
