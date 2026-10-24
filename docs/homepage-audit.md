# Homepage audit — 2026-10-24

The homepage keeps its existing text, links, fonts, colors, and desktop layout. As approved, the profile and publication columns stack at widths of 600 CSS pixels or less. Original PNG images remain available; the page serves optimized versions.

## Lighthouse results

Local tests used Lighthouse 13.5.0, Chrome 155, the default mobile configuration, and the desktop preset. These are lab measurements against a Python HTTP server, not measurements of the deployed GitHub Pages site or real visitors.

| Category | Mobile before | Mobile after | Desktop before | Desktop after |
| --- | ---: | ---: | ---: | ---: |
| Performance | 75 | 100 | 81 | 100 |
| Accessibility | 98 | 100 | 98 | 100 |
| Best practices | 96 | 96 | 96 | 96 |
| SEO | 100 | 100 | 100 | 100 |

| Measurement | Mobile before | Mobile after | Desktop before | Desktop after |
| --- | ---: | ---: | ---: | ---: |
| Largest Contentful Paint | 20.4 s | 1.9 s | 3.4 s | 0.4 s |
| Transferred resources | 3,786 KiB | 455 KiB | 3,786 KiB | 418 KiB |
| Cumulative Layout Shift | 0 | 0 | 0 | 0 |

The measured mobile payload decreased by about 88%. Lazy loading can change which images count toward the initial page load.

Google Tag Manager failed DNS resolution in both baseline and final tests. That network error accounts for the remaining best-practices deduction. Analytics was retained. Its successful loading could affect deployed performance, so repeat the audit after deployment. The local server also lacks production compression and cache headers; Lighthouse flags these. GitHub Pages response headers cannot be configured through this page's HTML or CSS.

Full HTML reports from this session are temporary local files:

- [Mobile before](/private/tmp/homepage-audit-20261024/before-mobile.html)
- [Mobile after](/private/tmp/homepage-audit-20261024/after-mobile.html)
- [Desktop before](/private/tmp/homepage-audit-20261024/before-desktop.html)
- [Desktop after](/private/tmp/homepage-audit-20261024/after-desktop.html)

## Changes

- Added a main landmark and marked the existing layout tables as presentational for screen readers.
- Added BibTeX dialog focus management, Tab containment, Escape dismissal, focus restoration, an inert background, Space activation, and citation-specific accessible names. The citation text is keyboard-scrollable on narrow screens.
- Corrected missing closing tags in the Talks list without changing its text.
- Added responsive WebP portrait variants at 240, 480, and 720 pixels, using quality 90. The full-size PNG remains linked from the portrait.
- Converted both publication figures to lossless WebP at their original resolutions, preserving detail for desktop hover zoom.
- Added image dimensions, prioritized the portrait, and lazy-loaded and asynchronously decoded publication figures. This follows Google's guidance on [reserving image space](https://web.dev/articles/optimize-cls/) and [prioritizing LCP resources](https://web.dev/articles/optimize-lcp).
- Added phone-only column stacking, disabled hover magnification on phones and devices without a precise hover pointer, and respected reduced-motion preferences.
- Kept the existing title, description, canonical URL, and crawl rules. Added social-image descriptions and dimensions, the Chinese alternate name in Person structured data, and the current sitemap modification date.

The dialog behavior follows the [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Verification

Playwright 1.64.1 and axe-core 4.14.0 checks passed:

- Same visible text at widths of 320, 375, 390, 600, 768, and 1280 pixels, normalizing whitespace introduced by line wrapping.
- No horizontal page overflow at those widths; columns stack on phones.
- Desktop element geometry matches the baseline within 0.5 CSS pixels at 768 and 1280 pixels. Computed fonts and colors match exactly.
- No axe violations in the tested default phone and desktop states or either settled, open citation dialog, using WCAG 2 A/AA, WCAG 2.1 AA, and best-practice rules.
- Both dialogs receive focus, contain forward and reverse Tab navigation, show the correct citation, and restore focus and scrolling after Escape. Space activation and the close button work.
- The citation dialog fits a 320 × 568 viewport and scrolls its long code independently.
- Increased text spacing causes no horizontal page overflow on a 320-pixel viewport. Browser zoom remains enabled.
- Reduced-motion preferences disable the relevant transitions.
- Both lossless WebP figures decode to exactly the same RGBA pixels as their original PNGs.
- Local resource paths, fragment targets, structured-data JSON, sitemap XML, the robots sitemap reference, and Git whitespace checks pass.

Automated checks do not establish complete WCAG conformance. In particular, the existing orange link hover/focus color (`#f09228`) has a calculated contrast ratio of 2.37:1 against white, below the [4.5:1 requirement for ordinary text](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). It was preserved under the instruction to retain the styles. The existing 14-pixel body text and compact inline links were also retained; larger type and more generous touch spacing would require a separate visual change. No manual screen-reader session or physical-device test was performed.

## Further image optimization with avifenc and cwebp

This second pass changes image delivery only. Text, layout, fonts, colors, and interaction styles remain as in the first pass.

| Measurement | Previous WebP pass | AVIF + responsive WebP pass |
| --- | ---: | ---: |
| Mobile transferred resources | 455 KiB | 162 KiB |
| Desktop transferred resources | 418 KiB | 213 KiB |
| Mobile Largest Contentful Paint | 1.9 s | 1.7 s |
| Desktop Largest Contentful Paint | 0.4 s | 0.4 s |

The mobile payload decreased by a further 64%; the desktop payload decreased by 49%. Performance, accessibility, and SEO remain 100 on both Lighthouse configurations. Best practices remains 96 because the same Analytics DNS failure persists. These remain local lab results subject to the limitations above.

- Used `avifenc` 1.4.2 with libaom 3.14.1 to generate 240-, 480-, and 720-pixel portrait AVIFs directly from resized original PNG data. Quality is 70, chroma is 4:4:4, alpha quality is 100, and encoder speed is 2. The [libavif encoder manual](https://github.com/AOMediaCodec/libavif/blob/main/doc/avifenc.1.md) describes these options. The AVIFs are 16.7%, 18.4%, and 16.6% smaller than their respective quality-90 WebP fallbacks. Both formats use lossy color encoding; the portrait was visually compared at enlarged size, and the AVIF alpha channels match the resized source exactly.
- Added AVIF portrait sources in a `picture` element. Existing responsive WebP sources remain the fallback, with the same dimensions and loading priority.
- Tested lossless AVIF for both paper figures. It was larger than WebP, so the figures remain WebP.
- Used `cwebp` 1.6.0 with `-lossless -z 9 -exact` to recompress the full figures. Hyper-SET decreased from 355,190 to 349,500 bytes; the NeurIPS figure decreased from 7,118 to 6,928 bytes. Both still decode to exactly the original RGBA pixels.
- Added 480- and 768-pixel lossless WebP versions of the resized Hyper-SET figure. Phones at Lighthouse's 1.75 pixel density select the 65,504-byte version instead of the previous 355,190-byte image. Desktop source sizing accounts for the existing 5× hover zoom: ordinary-density displays select the 768-pixel image, while higher-density displays retain the full-resolution source. A tested 1536-pixel lossless version was larger than the full-resolution WebP and was omitted.

Additional browser checks passed at mobile pixel densities of 1.75 and 3, and desktop densities of 1, 2, and 3. They verified image decoding, AVIF selection, simulated AVIF-unsupported fallback, one request per displayed image, and sufficient figure resolution for hover magnification. The fully enlarged hover image was also checked. All prior content-preservation, geometry, keyboard, mobile, and axe checks passed against a fresh snapshot of the page before this second pass.

Latest temporary reports:

- [Mobile with AVIF](/private/tmp/homepage-audit-20261024/avif-mobile.html)
- [Desktop with AVIF](/private/tmp/homepage-audit-20261024/avif-desktop.html)

### Rebuild the optimized assets

The offline script [scripts/optimize-images.cjs](../scripts/optimize-images.cjs) rebuilds the AVIF portraits and lossless WebP figures from the original PNGs. It also renders the VPFlow teaser from `data/arxiv/value-equivalence-crop.pdf` with Poppler and generates 480-, 768-, and 2400-pixel lossless WebP versions. It requires Node.js compatible with Sharp 0.35.5, `avifenc`, `cwebp`, and Poppler's `pdftoppm`; these tools are not loaded by the homepage. The earlier portrait WebP fallbacks are retained.

With `avifenc` and `cwebp` on the command path, install Sharp into a temporary tools directory and run:

```sh
npm install --prefix /tmp/homepage-image-tools --no-save sharp@0.35.5
NODE_PATH=/tmp/homepage-image-tools/node_modules node scripts/optimize-images.cjs
```

## Repeat the Lighthouse audit

From the repository root, start a preview server:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

In another terminal with Node.js and Chrome available:

```sh
npx --yes lighthouse http://127.0.0.1:8765/ --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=/tmp/homepage-mobile.html
npx --yes lighthouse http://127.0.0.1:8765/ --preset=desktop --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=/tmp/homepage-desktop.html
```

For a production audit after deployment, replace the local URL with `https://huyunzhe.github.io/`. Scores can vary with browser versions, network conditions, and machine load, as explained in [Lighthouse's scoring guidance](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).
