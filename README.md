# FKNGROUP site

Public corporate website and company information for FKNGROUP, the parent brand
of FKNGYM, FKNCOIN, and four upcoming mobile apps. The registered company is
FKN COMPANY LLC.

## Pages

The following URLs are intended for the production deployment:

- `https://fkngroup.pro/` — company overview and product portfolio
- `https://fkngroup.pro/company/` — registration details and business contact
- `https://fkngroup.pro/privacy/` — website privacy notice
- `https://fkngroup.pro/terms/` — website terms

The website uses the same static HTML/CSS/JavaScript architecture and 29 locales
as FKNGYM-site, including Arabic/Hebrew RTL and both Chinese scripts. Full English
content and links are embedded in HTML for readers without JavaScript. Other
dictionaries load on demand from `locales/`.

Choose a language in the header or use `?lang=ru`, `?lang=pt-BR`, or
`?lang=zh-Hant`. The searchable language picker supports keyboard navigation and
falls back to a native select when the Popover API is unavailable. Browser
matching preserves Chinese script and supports regional variants. The selected
language is saved locally when browser storage is available.

## Local development

Node.js 22+ is required; there are no npm dependencies or install step.

```sh
npm run dev
npm run sync
npm run sync:check
npm test
npm run build
```

- `dev` serves `http://127.0.0.1:8766/`, watches website files, and reloads the
  browser after edits. Generator changes are loaded automatically; restart it after changing server code.
- `sync` regenerates the English HTML fallback from company data and translations.
- `sync:check` fails when the checked-in HTML is stale.
- `test` checks translations, locale matching, company data validation, generated
  HTML, local links, portfolio content, and development server path handling.
- `build` validates the site and copies allowlisted public files to `dist/` for
  preview. It does not require a sibling app checkout or credentials.
- `build:release` additionally requires complete, confirmed company information
  and privacy handling, and generates the production sitemap and `robots.txt`.

## Site structure

- `scripts/render-html.mjs` — source markup for all four pages. Generated HTML is
  committed in `index.html`, `company/`, `privacy/`, and `terms/`.
- Legal documents are stored in `locales/` and follow the selected site language.
  Generated pages include a complete English fallback when JavaScript is unavailable.
- `styles.css` — responsive layout, RTL support, and reduced-motion styles.
- `script.js`, `i18n.js` — language selection, dictionary loading, and locale matching.
- `locales/` — 29 translation dictionaries with 59 matching keys each.
- `data/company.json` — company details, domain, and product availability. The JSON
  file is not copied to `dist/`; public details are embedded in generated HTML.
- `assets/` — FKNGYM icon and mascot. The hero uses an Icon Composer export; the
  product card uses a separate transparent mascot over the product lettering.
  Both are precompressed WebP assets with transparency and embedded color profiles
  preserved: 384 × 384 for the hero icon and 768 × 768 for the product mascot.
  Original PNGs are kept locally in the ignored `docs/asset-originals/` directory;
  the deployed site does not include them.

The unapproved FKNCOIN artwork is blurred in both the hero and product card.
The portfolio shows only FKNGYM and FKNCOIN; unreleased product cards are omitted.
Hero tiles have fixed square dimensions. The language picker includes decorative
country flags alongside native language names, including the native-select fallback.
The public brand is FKNGROUP, with FKN highlighted and G occasionally flickering in the same color. Company
registration details consistently use the legal name FKN COMPANY LLC.

## Repository contents

Commit the site source, public assets, company data, translations, generated HTML,
tests, build scripts, and GitHub Actions workflow. Generated HTML stays versioned
so the English fallback is available directly from a checkout and can be checked
with `npm run sync:check`.

Build output, dependencies, logs, caches, test artifacts, editor settings, local
research in `docs/`, reports in `reports/` and root `*_report.md` files, local
`AGENTS.md` rules, one-off scripts in `scripts/local/` and `scripts/optimize-images.mjs`,
environment files, and signing keys are ignored. Shared development, build,
validation, synchronization, and CI tools remain versioned. Environment
example files may be committed only with placeholder values. Keep private company
documents and credentials outside public asset and translation directories.

Before committing, review `git status --short` and `git diff --cached`. Ignore
rules do not apply to files already tracked by Git; remove accidentally tracked
local files with `git rm --cached <path>` to keep the local copy. The deployment
build separately allowlists the files copied to `dist/`.

## Company data and release preparation

Update `data/company.json` before publication:

- Match `legalName`, `legalForm`, `identificationNumber`, and `legalAddress` to the
  registration extract.
- Set a working business `email` and verify incoming mail and replies.
- Set `siteUrl` to the complete HTTPS base URL, including any subdirectory when
  using a GitHub Pages project URL. The configured domain is `https://fkngroup.pro/`.
- Set each product's `status` to `development` or `available`. Available products
  require a verified `appStoreUrl` on `apps.apple.com`. The optional `url` points
  to the product website.
- Keep `georgian.legalForm` and `georgian.legalAddress` consistent with the registration
  extract and the English fields; the current Georgian wording needs native legal review.
- Set `detailsConfirmed` to `true` after checking company details and product status.
- Set `privacyConfirmed` to `true` after reviewing the actual email and hosting
  practices. Update every translation first if further disclosures are needed.

The configured business email is `support@fkngroup.pro`. GitHub Pages and iCloud Mail
were confirmed by the owner during the 25 October 2026 review. The owner approved
publication and setting `privacyConfirmed` to true on 26 October 2026.
CI runs tests, a release build, and deployment on every push to `main`, following
the same flow as FKNGYM-site. Invalid release data fails the build instead of
reporting success while skipping publication. The earlier review remains recorded
in the local, ignored `security_best_practices_report.md` (not included in a fresh
checkout). FKNGYM and FKNCOIN remain
marked as in development. Review these settings when the business details,
product availability, or data handling change.

Keep the registered company name consistent across languages. When FKNCOIN
becomes available, also update descriptions that currently say it is in development.

```sh
npm run sync
npm test
npm run build:release
```

An unconfirmed site includes a `noindex` directive. Preview builds also include `robots.txt` with `Disallow: /`; these are indexing instructions,
not access controls. Release builds include a sitemap and allow indexing.

The website has no analytics, advertising cookies, contact forms, or payments.
The language preference is stored in localStorage. Confirm that published privacy
text matches the chosen hosting and email services before release.

## Editing translations

Website dictionaries live in `locales/<BCP47-tag>.json`. All dictionaries must
contain the same nonempty, plain-text keys; HTML is not allowed in translation
values. Build validation checks all 29 dictionaries.

Update English text in `locales/en.json`, translate the corresponding values in
all other locale files, and run `npm run sync` to refresh the English HTML fallback.
Review translations and check responsive layouts, RTL pages, and document links
after changing longer text. Registration details come from `data/company.json`
and should not be independently translated or renamed in dictionaries.

## GitHub Pages

The **Pages build deployment** workflow follows the same deployment structure as
FKNGYM-site: every push to `main` runs tests and builds the website from committed public data.
After a successful release build, it uploads `dist/` and deploys to GitHub
Pages. It also supports manual runs on `main`. This repository uses
`npm run build:release` to validate
company data and generate the sitemap and indexing rules before deployment.
No publication variable or private app checkout is required.

After confirming the company information:

1. Set Settings → Pages → Source to **GitHub Actions**.
2. Configure `fkngroup.pro` in Settings → Pages → Custom domain, set the DNS records
   at the registrar, and enable HTTPS. Both `CNAME` and `siteUrl` contain this domain;
   Actions deployments do not configure the custom domain from `CNAME` alone.
3. Push to `main` or run the workflow manually on `main`.
4. Verify all public pages, translations, and the business email link without
   authentication. Separately confirm that the mailbox receives mail and can reply.

The workflow deploys only `dist/` from this repository. It does not need access to
private app repositories or App Store Connect credentials, and has no recurring
schedule.

Repository: [johnnieWa1ker/FKNGROUP-site](https://github.com/johnnieWa1ker/FKNGROUP-site).

## Appearance

The header theme button cycles System → Light → Dark, as on FKNGYM-site.
The default follows the operating system; an explicit choice is stored under
`fkngroup-site-theme`. `theme-init.js` runs before CSS to apply the saved theme
without a light flash and is included in both preview and deployment allowlists.
The picker label follows the selected language. All four pages share the palette.

## Shared navigation layout

FKNGROUP and FKNGYM use an 80px desktop header and a second navigation row at
1100px and below. Header and footer height grows with wrapped translations.
Keep the shared chrome sizing rules in both repositories aligned when editing.
