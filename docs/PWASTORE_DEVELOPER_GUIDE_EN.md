# PWA Store developer guide

This guide explains how to publish a Progressive Web App on PWA Store, from preparation to updates. The developer portal is used on a computer or tablet (at least 768 px wide). A short version is available in the portal: **Developer guide** (`/developer/guide`).

> The example used throughout this guide, **SantéPlus**, is a **fictional** app that finds on-duty pharmacies.

## 1. Becoming a developer

Requirements:

1. A PWA Store account with a **confirmed email address**.
2. An **activated developer profile** (free), as an individual or an organisation: from “My space” or the **Developers** page.
3. A **complete profile** and a **valid identity document** (national ID card, passport, residence permit or driving licence). The document is kept in private storage, readable only by verifiers, and deleted automatically at the end of its retention period.
4. **Verification** of your profile by an administrator. If it is refused, the reason is shown: fix it and submit again.

Until your profile is verified, or if your identity document has expired, you cannot submit an app; your space tells you why.

## 2. The developer portal

| Menu                    | Address               | Content                                                                              |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| Overview                | `/developer`          | Key figures, things to do                                                            |
| **My apps**             | `/developer/apps`     | All your apps, their status, creating an app                                         |
| **Review tracking**     | `/developer/requests` | The latest request of each app and its decision                                      |
| Statistics              | `/developer/stats`    | Views, opens and installs over 7, 30 or 90 days                                      |
| **Install measurement** | `/developer/measure`  | Status of the measurement script and confirmed installs, app by app                  |
| Reviews and feedback    | `/developer/reviews`  | Reviews received, reply (one per review)                                             |
| PWA Lab                 | `/developer/lab`      | Analyses an address: HTTPS, manifest, icons, service worker, installability criteria |
| **Developer guide**     | `/developer/guide`    | This guide, short version                                                            |
| Publishing rules        | `/publishing-rules`   | What is accepted or refused                                                          |

## 3. Information you need

To create the draft, you only need the **name** and the **HTTPS link to your PWA** (the category can be chosen now or later). To submit, **everything** must be filled in:

| Information           | Rule                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Category              | Required                                                                                              |
| Short description     | One sentence, 280 characters at most                                                                  |
| Full description      | At least 30 characters                                                                                |
| **Cover image**       | **Required.** 16:9, at least 1280 × 720 px (1920 × 1080 recommended), JPEG, PNG or WebP, 3 MB at most |
| Icon                  | Square file, at least 192 × 192 px, PNG, JPG or WebP, 1 MB at most                                    |
| Screenshots           | 1 to 8 (phone; tablet optional), PNG, JPG or WebP, 5 MB at most each                                  |
| Languages             | At least one                                                                                          |
| Official PWA link     | Official address of the app or of its presentation site                                               |
| Contact email         | A valid address                                                                                       |
| Privacy policy        | Address (URL) of the page                                                                             |
| Data collected        | At least one choice (“No data” included)                                                              |
| Access for the review | Open access, or instructions and test credentials (App content tab)                                   |
| Ads                   | Yes or no (App content tab)                                                                           |
| Content rating        | Complete questionnaire (App content tab)                                                              |

Optional: sub-category, support page, terms of use, supported devices and features. Images are re-encoded on upload: their metadata (GPS position, device model) is removed.

## 4. Preparing your PWA

An installable PWA needs:

- **HTTPS** on a public address (port 443).
- A **manifest** `manifest.webmanifest` or `manifest.json` declared in the page (`<link rel="manifest">`), with at least `name`, `short_name`, `start_url`, `display` and `icons`.
- A **service worker**.
- **Icons** of at least 192 × 192 and 512 × 512 pixels.
- A `<meta name="viewport">` tag for proper mobile display.

Example manifest for SantéPlus:

```json
{
  "name": "SantéPlus — Pharmacies de garde",
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

Use **PWA Lab** to check your address before submitting.

## 5. Publishing by link (default mode)

Your PWA stays hosted on your own site. Public badge: **“Hosted by the publisher”**.

- The address is checked without running your code: reachability, manifest and the app’s identity (name, icons, start address, scope). The check runs again on each submission, then every 6 hours once the app is live.
- A **manifest change** does not suspend the app: it is flagged to moderators, who may contact you.
- If your site is **unavailable several times in a row**, the app may be suspended automatically; you are notified.
- You update your app’s code on your site, without a new submission. Limit: the check covers the page and the manifest; a script changed after approval is not detected, and you remain responsible for its content.

> **ZIP uploads** are disabled by default on PWA Store. The “Upload my app’s files (ZIP)” choice only appears if the platform has enabled it; sections 12 and 13 then only apply to apps provided as a ZIP.

## 6. Distribution countries

In the **Details** tab, choose **All countries** or **Selected countries**. With a selection, the app only appears for accounts from those countries and for visitors who chose one of them; elsewhere its page answers “This app is not available in your country”.

An account’s country is the one in its profile; it can only change once every 30 days. A visitor who is not signed in chooses a country in the Store (the choice stays in their browser; it is never inferred from the IP address). Without a country, only apps available everywhere are shown.

## 7. App content tab

- **Access for the review**: if part of the app requires signing in, give instructions and **test credentials** (never a personal account). They are **encrypted**, visible only to you and the review team, and every reading by a moderator is logged.
- **Ads**: say whether the app contains ads, including from third-party ad networks. The listing shows “Contains ads”.
- **Content rating**: answer the questionnaire (violence, sexual content, language, drugs, gambling, frightening content, and interactive elements: users interact, location sharing, digital purchases). The minimum age (3+, 7+, 12+, 16+ or 18+) is **computed by PWA Store** from your answers: it is **not** an official rating (IARC, PEGI, ESRB). The review team checks it; a misleading statement may lead to suspension.

## 8. Measuring installs

In the app’s **Version** tab (and on the **Install measurement** page), copy the measurement line and paste it into your PWA’s HTML, just before `</body>`:

```html
<script
  src="https://pwastore.online/api/sdk.js"
  data-app="YOUR_KEY"
  async
></script>
```

Then click **Check my site**: PWA Store reads your page and tells you whether the line is in place, whether the key is right, whether it points to another PWA Store address, or whether your Content Security Policy (CSP) blocks it. In that case, allow the PWA Store address for `script-src` and `connect-src`.

The script only sends two events: **install** and **launch from the home screen**, with a pseudonymous device identifier, and only from the declared address of the published app. It collects nothing your users do. You must **inform your users** about this measurement in your privacy policy. The figures are indicators, not accounting proof.

Two counters coexist: **declared installs** (Store accounts that said they installed the app, counted once per account) and **confirmed installs** (signals from the script).

## 9. Common errors

| Message                                    | Fix                                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| A public HTTPS URL on port 443 is required | Use your PWA’s public `https://` address, without a port or credentials.                       |
| No PWA manifest declared                   | Add `<link rel="manifest" href="...">` to the home page.                                       |
| The PWA manifest is incomplete             | Fill in `name`, `start_url` and `icons`.                                                       |
| Link check failed                          | Check that the address answers, without redirecting to a private network, in under 2 MB.       |
| Cover refused                              | 16:9 image of at least 1280 × 720 px, JPEG/PNG/WebP, 3 MB at most.                             |
| Icon refused                               | Square image of at least 192 px, PNG/JPG/WebP, 1 MB at most.                                   |
| “Check my site” does not find the script   | The line must be in the HTML sent by your server; a script added by JavaScript cannot be seen. |

## 10. Checklist before submitting

- [ ] Developer profile verified, valid identity document
- [ ] Category, short description, full description (≥ 30 characters)
- [ ] 16:9 cover, square icon, at least one screenshot
- [ ] At least one language, distribution countries
- [ ] Official PWA link, contact email
- [ ] Privacy policy and data collected
- [ ] App content tab: access for the review, ads, content rating
- [ ] HTTPS link that answers, with a complete manifest
- [ ] (Recommended) Measurement line in place and “Check my site” green

The **Summary** tab shows your listing as visitors will see it and lists what is missing, with a link to the relevant tab.

## 11. Review and decisions

Click **Submit for review**. Your dossier is frozen: a moderator reviews exactly what you sent. During the review the app cannot be changed; you can **withdraw your request** to change it.

| Decision              | What happens                                                                  |
| --------------------- | ----------------------------------------------------------------------------- |
| **Approved**          | The app is **published automatically**, with nothing more to do on your side. |
| **Changes requested** | The reason is shown at the top of your space. Fix it, then submit again.      |
| **Rejected**          | The reason is kept. You can fix things and submit a new request.              |

You are notified in the app and by email. All your requests are visible in **Review tracking** and in each app’s **Tracking** tab. If automatic publication failed, a message says so and the **Publish now** button appears.

### Suspended app

An app can be suspended by moderation (with a reason) or after repeated unavailability. You can **ask for a re-examination** by submitting from the **Summary** tab, even without any change. A moderator can **reinstate** it directly or approve the re-examination; lifting a suspension is always an explicit, logged decision.

### Archived app

You can archive an app (it leaves the Store, its data is kept), then **restore it as a draft**.

## 12. Updating the listing

- **Your app stays live** as it was approved.
- Edit the listing (texts, images, content…): changes are saved **as pending**. You can discard them (“Discard my changes”).
- Submit the update from **Summary**. On approval, the changes replace the public listing.

## 13. Apps provided as a ZIP (if uploads are enabled)

Upload the **build output** (never the sources): `index.html` at the root, manifest, service worker, icons. Limits: 50 MB for the ZIP (default), 200 MB uncompressed, 10,000 files; executable files (`.php`, `.exe`, `.sh`…) are refused.

| Tool    | Command               | Folder to compress        |
| ------- | --------------------- | ------------------------- |
| Quasar  | `quasar build -m pwa` | `dist/pwa/`               |
| Vite    | `npm run build`       | `dist/`                   |
| Angular | `ng build`            | `dist/<project>/browser/` |

Each ZIP is analysed on upload, without running your code: **Ready to submit**, **Sensitive functions found** (`eval()`, `new Function()`, `document.write()`: not blocking, reviewed by a moderator) or **Refused** with the reason. External domains (fonts, APIs, CDNs, WebSockets…) are **detected automatically**; you have nothing to declare. The app is served from an isolated origin, badge **“Hosted by PWA Store”**. A new version goes through an update request; the previous one stays live until approval.

## 14. Full example: SantéPlus (fictional)

1. **Creation**: name “SantéPlus”, link `https://santeplus.example/`. The draft is created.
2. **Details**: category “Health”; short description “Find the nearest on-duty pharmacy”; full description; languages French and English; official link; email `contact@santeplus.example`; selected countries: Côte d’Ivoire and Senegal.
3. **Images**: 1920 × 1080 cover, 512 × 512 PNG icon, three phone screenshots.
4. **Privacy**: policy `https://santeplus.example/confidentialite`; data collected: Location.
5. **App content**: open access; no ads; questionnaire: all “No” except location sharing → rating 3+.
6. **Version**: measurement line pasted into `index.html`, **Check my site** → “Script detected”.
7. **Summary**: everything is green; **Submit for review**.
8. **Decision**: the moderator requests a change: “Screenshot 2 shows real patient data.” The screenshot is replaced, the app is submitted again and **approved**: SantéPlus is live with the “Hosted by the publisher” badge, visible in Côte d’Ivoire and Senegal.
