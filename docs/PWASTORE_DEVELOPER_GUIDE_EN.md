# PWA Store developer guide

This guide explains how to publish a Progressive Web App on PWA Store, from preparation to updates. The developer portal is used on a computer or tablet (at least 768 px wide).

> The example used throughout this guide, **SantéPlus**, is a **fictional** app that finds on-duty pharmacies.

## 1. Becoming a developer

Requirements:

1. A PWA Store account with a **confirmed email address**.
2. An **activated developer profile** (free), as an individual or an organisation: from “My space” or the **Developers** page.
3. A **complete profile** and a **valid identity document** (national ID card, passport, residence permit or driving licence).
4. **Verification** of your profile by an administrator. If it is refused, the reason is shown: fix it and submit again.

Until your profile is verified, or if your identity document has expired, you cannot submit an app; your space tells you why.

## 2. Information you need

To create the draft, you only need the **name**, the **category** and your choice of **ZIP or link**. To submit, **everything** must be filled in:

| Information       | Rule                                                               |
| ----------------- | ------------------------------------------------------------------ |
| Category          | Required                                                           |
| Short description | One sentence, up to 280 characters                                 |
| Full description  | At least 30 characters                                             |
| Icon              | Square file, at least 192 × 192 px, PNG, JPG or WebP, 1 MB max.    |
| Screenshots       | At least one (phone; tablet optional), PNG, JPG or WebP, 5 MB max. |
| Languages         | At least one                                                       |
| Official PWA link | The official address of the app or of its landing site             |
| Contact email     | A valid address                                                    |
| Privacy policy    | The page’s URL                                                     |
| Data collected    | At least one choice (“No data” counts)                             |

Optional: subcategory, countries of availability, support page, terms of use, supported devices and features.

## 3. Preparing your PWA

An installable PWA needs:

- **HTTPS** (required for a listing by link; provided by PWA Store for a hosted ZIP).
- A **manifest**, `manifest.webmanifest` or `manifest.json`, with at least `name`, `short_name`, `start_url`, `display` and `icons`. Every icon it lists must exist in the files.
- A **service worker**, `sw.js` or `service-worker.js`, at the root.
- **Icons** of at least 192 × 192 and 512 × 512 pixels.
- A `<meta name="viewport">` tag in `index.html` so the app displays properly on phones.

Example manifest for SantéPlus:

```json
{
  "name": "SantéPlus — On-duty pharmacies",
  "short_name": "SantéPlus",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0b7a5c",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## 4. Building for production

Always upload the **build output**, never the source code. For example:

| Tool    | Command               | Folder to zip             |
| ------- | --------------------- | ------------------------- |
| Quasar  | `quasar build -m pwa` | `dist/pwa/`               |
| Vite    | `npm run build`       | `dist/`                   |
| Angular | `ng build`            | `dist/<project>/browser/` |

Zip the **contents** of the folder (or the folder itself): `index.html` must sit at the root of the build.

## 5. Expected ZIP layout

```
santeplus-1.0.0.zip
├── index.html
├── manifest.webmanifest
├── sw.js
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── assets/
    ├── index-3f9a1c.js
    └── index-8b2e44.css
```

Limits: 50 MB for the ZIP (platform default), 200 MB once unzipped, 10,000 files.

## 6. Link (URL) or files (ZIP)?

|               | Link to your PWA                                    | Files (ZIP)                                            |
| ------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Hosting       | On your own website                                 | By PWA Store, on a dedicated, isolated address         |
| Public badge  | **“Hosted by the publisher”**                       | **“Hosted by PWA Store”**                              |
| Checks        | Address checked at every submission, then regularly | Full analysis of the build on every upload             |
| Updating code | You update your website                             | You upload a new version, reviewed before it goes live |

You choose when creating the app, and the choice cannot be changed after the first submission. A tooltip on the badge explains the difference to visitors.

For an app listed by link: if your site is unreachable twice in a row, or its content changes unexpectedly, the app may be suspended automatically; you will be notified.

## 7. Automatic analysis

Every ZIP is analysed as soon as it is uploaded (your code is never run). Possible outcomes:

| Outcome                                    | What it means                                                                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ready to submit**                        | All good.                                                                                                                                                       |
| **Sensitive functions found** (quarantine) | `eval()`, `new Function()` or `document.write()` were found, often inside a well-known library. **This does not block you**: an administrator will review them. |
| **Refused**                                | The file has a real error (see §9). It is refused on upload, with the reason.                                                                                   |

The analysis reduces risks but is not a security certification.

## 8. External domains

External services used by your build (fonts, APIs, CDNs, WebSockets…) are **detected automatically**. You have **nothing to declare**. After the upload you see how many domains were detected, and the detailed report in the **Version** tab. An administrator may leave a note there or request a correction; a requested correction must be dealt with before approval.

Once live, your app can call any service over **HTTPS** or **WSS**. HTTP calls are upgraded to HTTPS: a service that does not support it will not respond. Plugins (`<object>`, `<embed>`) and embedding your app inside another page are blocked.

## 9. Common errors

The messages below are currently shown in French.

| Message                                                            | Fix                                                                                                                                    |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html est absent de la racine du build` (index.html missing) | You zipped the wrong folder (source code, or one level too high). Zip the production folder.                                           |
| `Fichier exécutable interdit` (executable file not allowed)        | Remove `.php`, `.exe`, `.sh`, `.bat`, `.apk`, `.dll`… files. Only web files are accepted.                                              |
| Missing manifest or service worker                                 | Add them (§3). Otherwise PWA Store offers to **generate them**: accept in the “PWA files missing” window so the app stays installable. |
| `Champ manifest manquant` / icon not found                         | Complete the manifest; check each icon’s path.                                                                                         |
| File too large / excessive compression                             | Remove unneeded files (source maps, heavy videos) and check the ZIP size.                                                              |
| Icon refused                                                       | Square image of at least 192 px, PNG/JPG/WebP, 1 MB max.                                                                               |
| Link check failed                                                  | Make sure the address is public, uses HTTPS and responds.                                                                              |

## 10. Pre-submission checklist

- [ ] Developer profile verified, identity document valid
- [ ] Category, short description, full description (≥ 30 characters)
- [ ] Square icon uploaded, at least one screenshot
- [ ] At least one language
- [ ] Official PWA link, contact email
- [ ] Privacy policy and data collected
- [ ] ZIP: a version analysed as “Ready to submit” or with sensitive functions to review — or an HTTPS link that responds

The **Summary** tab shows your listing as visitors will see it and lists what is missing, with a link to the right tab.

## 11. Review and decisions

Click **Submit for review**. Your submission is frozen: an administrator reviews exactly what you sent. During the review the app cannot be edited; you can **withdraw your request** to change it.

| Decision              | What happens                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| **Approved**          | The app is published immediately.                                       |
| **Changes requested** | The reason appears at the top of your space. Fix it, then submit again. |
| **Rejected**          | The reason is kept. You can fix things and submit a new request.        |

You are notified in the app and by email (emails are in French for now). Every request and decision is kept in the **Tracking** tab.

## 12. Publication

Approval puts the app online straight away. If going live could not happen automatically (for example, build hosting temporarily unavailable), a message tells you so: choose **Publish now** in the app’s space.

## 13. Updating the listing or shipping a new version

- **Your app stays online** exactly as it was approved.
- Edit the listing (texts, icon, screenshots…): changes are saved as **pending**. You can drop them (“Discard my changes”).
- ZIP: in the **Version** tab, choose **Upload a version** (use a new number, for example `1.1.0`). The previous version keeps being served during the review.
- Submit the update from **Summary**. Once approved, the changes replace the public listing and the new version goes live.
- An earlier approved version can be put back online if needed.

## 14. Full example: SantéPlus (fictional)

1. **Creation**: name “SantéPlus”, category “Health”, provided as a **ZIP**. The draft is created.
2. **Details**: short description “Find the nearest on-duty pharmacy”; full description; languages French and English; official link `https://santeplus.example`; email `contact@santeplus.example`.
3. **Images**: 512 × 512 PNG icon, three phone screenshots.
4. **Privacy**: policy at `https://santeplus.example/privacy`; data collected: Location.
5. **Version**: `quasar build -m pwa`, zip `dist/pwa/`, upload version `1.0.0`. Analysis: “Ready to submit”, 2 external domains detected (a web font and a maps API).
6. **Summary**: everything is green; **Submit for review**.
7. **Decision**: the administrator requests changes: “Screenshot 2 shows real patient data.” The screenshot is replaced, the app is resubmitted and **approved**: SantéPlus is online with the “Hosted by PWA Store” badge.
8. **Update**: version `1.1.0` adds a dark mode and a new screenshot. Version 1.0.0 stays online until the update is approved.
