# Yours Fit

A responsive, Apple-inspired liquid-glass fitness companion built with React, TypeScript and Vite. Core tracking features work offline in the browser.

## Included
- Responsive Apple-inspired liquid-glass interface for phone, tablet and desktop
- Dashboard, workouts, nutrition, hydration, progress, recovery, AI Coach and settings navigation
- Local persistence for water, meals, workout completion, profile, goals, recovery and coaching history (local to this device/browser)
- Daily water quick-add and undo
- Meal logging with editable calorie/protein values
- Workout set check-offs and session completion
- Progress summaries based on recorded daily data (no invented historical records)
- Configurable calorie/protein/water goals and personal fitness focus
- Offline contextual fitness coach; optional secure server-side AI endpoint
- JSON backup export for moving or archiving local records
- Gemini server-side integration blueprint and Supabase SQL starter

## Run locally
1. Install Node.js 20 or newer.
2. Extract this ZIP and open the project folder in a terminal.
3. Run `npm install`
4. Run `npm run dev`
5. Open the local URL printed by Vite.

## Build
`npm run build`

## Apple-inspired motion and notification behavior
The UI uses restrained motion, translucent surfaces, responsive layout, and reduced-motion support. Browser notification permission is requested only after you press the enable button. Reminders can fire while the app is open and the browser has permission. Scheduled delivery while the browser is closed requires a real Web Push service and backend; a static GitHub Pages site cannot reliably run timers in the background.

## PWA / offline use
The manifest and service worker support installation as a web app and best-effort offline shell caching after an online visit. Tracking records remain in local storage; clearing site data removes them. Browser reminders require the app to be open, and reliable closed-app scheduled notifications need a push backend or native Android scheduling.

## Data persistence
The app saves fitness records in browser local storage, so it survives refreshes and browser restarts on the same browser profile. It is not cloud sync or guaranteed permanent storage: clearing browser data, using another device, or browser storage eviction can remove it. For durable cross-device storage, configure Supabase, apply the migration, and replace local demo storage with authenticated database reads/writes. Do not store sensitive private records in a public deployment until real authentication and RLS policies are verified.

## AI connection
Set `VITE_FITNESS_AI_ENDPOINT` in your local `.env` to the URL of your deployed `fitness-ai` server function. If no endpoint is configured, the built-in question-matched offline coach responds locally about your selected daily workout, exact weekly plan, exercise technique, equipment substitutions, reflex drills, meals/protein/calories, hydration, muscle gain, recovery, missed days and logged progress. It uses your current app data where relevant. This is a local rule-based coach, not a generative language model. If a configured endpoint fails, the app returns the local answer as a fallback rather than leaving the user without guidance. The included edge function is a starter and must be completed with authenticated caller validation, a single-user allowlist, rate limits, and CORS restrictions before deployment. Keep `GEMINI_API_KEY` server-side only.

## Important security note
This ZIP is a functional offline-first frontend, not a production-secure private deployment. It intentionally opens without a fake demo login. Do not deploy private fitness data publicly until you configure a real auth provider and server-side authorization. Never put a Gemini API key in `VITE_*` variables or frontend code.

## Configure Gemini securely
A Supabase Edge Function starter is in `supabase/functions/fitness-ai/index.ts`. Set the secret server-side:
`supabase secrets set GEMINI_API_KEY=your_key_here`
Then deploy the function and add authentication/authorization checks before using it with private data. The starter returns a clear setup/error response if the secret is absent; it does not fake a Gemini response.

## Supabase database
Review and run `supabase/migrations/001_initial_schema.sql` in your own Supabase project. The schema enables Row Level Security, but production use still requires configuring Supabase Auth and policies to match the single authorized account. Do not assume a hidden UI control is security.

## Workout plan
The Workouts screen includes the user-provided six-day plan exactly by day: Monday chest + shoulders, Tuesday back + arms, Wednesday legs + abs, Thursday reflex + athletic, Friday upper body + V-taper, Saturday full body + athletic with a reflex finisher, and Sunday recovery. Tap the numbered circles to record set completion. Exercise lists are stored in `src/data.ts` so they can be edited later.

## Publish to GitHub
1. Create a new empty repository on GitHub.
2. Extract this ZIP.
3. In the project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial Yours Fit app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```
4. For GitHub Pages, add a deployment workflow and configure the Vite base path for your repository, or deploy through a host that supports Vite. For private records and Gemini, use a backend; GitHub Pages alone is static hosting.

## Automatic Android APK releases and in-app update alerts

This repository includes `.github/workflows/android-apk.yml`. After the first-time signing setup below, every push to `main` or `master` (and every manual workflow run) builds a signed APK, increases the Android version code, and publishes `Yours-Fit.apk` as a GitHub Release. The release version is `1.0.<GitHub Actions run number>`. Keep this workflow and the app ID `com.yoursfit.app` stable.

### One-time Android signing key setup (Windows)

Android only allows an installed app to update in place when the new APK has the same app ID and is signed with the same signing key. Create this key once and keep a secure offline backup. If you lose it, future APKs cannot update the current installation in place. **Never commit the keystore or passwords to GitHub.**

1. In PowerShell, run the following and follow the prompts. Remember the passwords and alias you choose:

   ```powershell
   keytool -genkeypair -v -keystore yours-fit-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias yours-fit
   ```

2. Convert the keystore to Base64 and copy it to the clipboard:

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\yours-fit-release.jks")) | Set-Clipboard
   ```

3. On GitHub, open your repository → **Settings → Secrets and variables → Actions → New repository secret**. Add these four secrets:

   | Secret name | Value |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | The Base64 text copied above |
   | `ANDROID_KEY_ALIAS` | `yours-fit` (or your chosen alias) |
   | `ANDROID_KEYSTORE_PASSWORD` | The keystore password you chose |
   | `ANDROID_KEY_PASSWORD` | The key password you chose |

4. Make the repository **public** if you want the app to check public GitHub Releases without requiring sign-in. Do not place signing credentials in source code, `.env`, or a committed file.

### Push the project to GitHub

Create a new empty GitHub repository (for example `yours-fit`) and, in the extracted project folder, run:

```bash
git init
git add .
git commit -m "Add Yours Fit and automated Android releases"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yours-fit.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. If `origin` already exists, use `git remote set-url origin https://github.com/YOUR_USERNAME/yours-fit.git` instead of adding it again.

### Download the APK and receive update prompts

1. After the push, open the repository's **Actions** tab and wait for **Build and publish Yours Fit APK** to finish successfully.
2. Open **Releases** and download `Yours-Fit.apk` from the latest release. Install it on your Android phone. On first install, Android may ask you to allow installation from the browser or file manager you used.
3. The installed app checks the latest public GitHub Release when opened and approximately every six hours while it remains open. When it finds a newer APK, it displays a glass-style **Update app** banner. Tap it, download the APK, then approve the Android installation prompt.
4. To publish changes, edit the code and push the commit to `main`. GitHub Actions builds and publishes the next version automatically. You can also run the workflow manually from **Actions → Build and publish Yours Fit APK → Run workflow**.

**Notification limitation:** the in-app banner appears when the app is open and has checked GitHub, or the next time you open it. It does not send an operating-system push notification while the app is fully closed. Closed-app update notifications require a push service (such as Firebase Cloud Messaging) plus a backend. Android also requires the user to approve normal APK installation; this workflow does not silently install updates.

**First run:** the workflow intentionally fails until the four signing secrets are configured. Keep the same keystore for every release, or Android will reject updates over the installed app.

## Next production steps
- Add Supabase Auth with a single pre-created account and disable public sign-ups.
- Add authenticated Edge Function checks, request validation and rate limiting.
- Add private storage policies for progress photos.
- Replace localStorage demo persistence with Supabase queries.
- Add tests for authorization and core flows.

## Responsive design and mobile packaging

The interface includes responsive layouts for desktop, tablet, compact phones (320px and up), safe-area padding for modern phones, touch-friendly controls, and Apple-inspired liquid-glass surfaces with graceful fallbacks when blur/transparency is reduced. Check the UI at 320px, 375px, 430px, 768px, 1024px and wide desktop widths before release.

For Android packaging on Windows, install Android Studio and its recommended Android SDK. Then run `npm install`, `npm run build`, `npx cap add android` (once), `npm run android:sync`, and `npm run android:open`. In Android Studio choose **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The debug APK is normally under `android/app/build/outputs/apk/debug/app-debug.apk`. Android reminders and notifications must be tested on-device; the web notification timer is not a reliable native background scheduler.


## Recent UI update

- Mobile navigation is simplified to Home, Train, Coach, and More.
- Exercise names open a glass-style guide with purpose, instructions, benefits, and form tips.
- Added light/dark appearance toggle in Settings.
- Added local account creation and sign-in screens.

### Account security note

The username/password feature is a local demo stored in this browser/device's local storage. It is not secure authentication, password storage is not suitable for production, and accounts do not sync between devices. Do not use a real/reused password. Production authentication requires a secure backend provider such as Supabase Auth or Firebase Authentication.
