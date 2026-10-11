# SMART FIT — Professional Training Studio

A responsive React + TypeScript + Vite fitness tracker packaged for Android with Capacitor. Core app features are included without a paid subscription: training levels and courses, exercise guides, V-taper focus, set tracking, hydration, meals, progress, recovery, offline coach guidance, reminders while the app is open, local backup/restore, update checks, and Appearance Studio.

## First-launch training setup

On first launch, SMART FIT asks the user to select a training focus (Full Fitness, V-Taper, Strength, Athletic & Reflex, Fat Loss, or Mobility), experience level (Beginner, Intermediate, Pro), and available equipment. Choices are saved on the current device and used to filter the exercise library. Reopen the setup from **More → Settings → Training preferences → Customize my plan**.

The illustrated muscle figures are lightweight stylized SVG guides, not a medical-grade anatomical model or motion-captured 3D exercise animation.

## Appearance Studio

Open **More → Settings → Appearance studio** to customize:
- Light, dark, or follow-device appearance
- Accent palette (pulse red, electric blue, violet, emerald, amber, rose, silver)
- Liquid-glass intensity
- Glow effects
- Compact or comfortable spacing

Settings are saved locally on the current device. This is a client-side design system; not every individual component can be recolored independently, and reduced-transparency preferences are respected.

## Run on your laptop

Install Node.js LTS and Git, extract/open this folder in VS Code, then:

```powershell
npm install
npm run dev
```

Create a production web build:

```powershell
npm run build
```

## Android APK on your laptop

Install Android Studio and its Android SDK/JDK components. With dependencies installed:

```powershell
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Run `npx cap add android` only the first time (or if the `android` directory does not exist). In Android Studio, wait for Gradle sync, then choose **Build → Build Bundle(s) / APK(s) → Build APK(s)** for a test APK. A signed release APK requires a signing key.

## Publish APK from a phone or laptop using GitHub Actions

You do not need Android Studio on your phone. GitHub Actions can build the APK remotely.

1. Create or use your repository and add the four repository Actions secrets required by `.github/workflows/android-apk.yml`:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_PASSWORD`
2. Keep the same signing key and `appId` (`com.yoursfit.app`) for future updates.
3. Commit and push changes to `main`/`master` or manually run the workflow from **GitHub → Actions → Build and publish Smart Fit APK → Run workflow**.
4. Wait for a green workflow. Download `Smart-Fit.apk` from the latest **Releases** page.
5. Install it on Android. Android may ask to allow installs from the source and confirm installation.

### Safely updating an existing GitHub repository from a downloaded ZIP

Do not initialize a second unrelated Git history and then merge it into the existing repository. Instead, clone the existing repository into a fresh folder first, then copy the new source files over it while keeping that clone's `.git` directory:

```powershell
git clone https://github.com/28vishnu/yours-fit.git smart-fit-github
```

Copy the contents of the extracted Smart Fit project into `smart-fit-github`, **excluding `.git` and `node_modules`**. Then:

```powershell
cd smart-fit-github
npm install
npm run build
git add .
git commit -m "Customize Smart Fit appearance and polish UI"
git push origin main
```

If your branch is not `main`, use the branch shown by `git branch --show-current`. Do not use `git push --force` as a routine fix. Resolve any conflicts before pushing.

## Build entirely from a mobile phone

1. Extract the ZIP with a file manager that supports ZIP archives.
2. Open GitHub in your mobile browser and open your repository.
3. For small edits, use GitHub's web editor or `github.dev` (press `.` while viewing the repository on desktop, or open the repo in a browser editor). Commit changes to `main`.
4. Open the repository's **Actions** tab, run the workflow if it did not start automatically, and monitor it until green.
5. Open **Releases** and download `Smart-Fit.apk`, then install it.

Editing a full React project directly on a phone is less comfortable. The reliable mobile-only workflow is GitHub editing + GitHub Actions remote build. Android itself still asks for confirmation when installing a regular APK. To publish on Google Play, additional Play Console requirements apply.

## Free-use and honest limits

The source project and included core features can be used without a paid app subscription. However, this cannot make every feature from every commercial fitness app available: premium third-party exercise video libraries, paid AI APIs, cloud hosting, SMS/push services, and app-store developer accounts may cost money. The built-in offline coach uses local rule-based guidance; a truly generative AI coach requires a configured model/service. Local data is stored in the browser/app on this device; it does not automatically sync between devices. Export backups regularly.

## Privacy and safety

Do not store production passwords or API secrets in client-side source. Local demo account data is not secure production authentication. For cloud accounts and cross-device sync, integrate a proper auth/backend service. Training suggestions are general information; stop if an exercise causes pain and adapt to your abilities.
