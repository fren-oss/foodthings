---
version: alpha
name: FoodThings
description: A warm, calm calorie-tracking interface where a single photo is the only way in. Lime-green accents (Fresh Lime), soft white rounded cards on a warm off-white canvas, oversized calorie numerals, and a friendly lime mascot (Limo) who appears at key moments.

colors:
  primary: "#8CCB2F"
  on-primary: "#12210A"
  primary-strong: "#3A730E"
  primary-soft: "#E6F5C9"
  primary-tint: "#CFE8A0"
  background: "#F4F4F1"
  card: "#FFFFFF"
  foreground: "#12150F"
  muted-foreground: "#5B6356"
  border: "#E7E9E2"
  ring: "#3F7D0F"
  destructive: "#DC2626"
  on-destructive: "#FFFFFF"
  warning: "#92400E"
  warning-soft: "#FEF3C7"
  carb: "#F59E0B"
  protein: "#3B82F6"
  fat: "#EF4444"
  mascot-body: "#B0D030"
  mascot-outline: "#18301F"

typography:
  headline-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 52px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.5
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
  numeral:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1
    fontFeature: tnum

rounded:
  sm: 12px
  md: 20px
  lg: 28px
  full: 999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  xxxl: 32px
  huge: 48px

components:
  app-background:
    backgroundColor: "{colors.background}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    typography: "{typography.label-lg}"
    height: 48px
    padding: 24px
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    typography: "{typography.label-lg}"
    height: 48px
    padding: 24px
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.on-destructive}"
    rounded: "{rounded.full}"
    typography: "{typography.label-lg}"
    height: 48px
  button-ghost-icon:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    size: 44px
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 16px
  card-hero:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 20px
  card-metric:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 16px
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 12px
  chip-idle:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.full}"
    padding: 12px
  chip-macro-protein:
    backgroundColor: "{colors.card}"
    textColor: "{colors.protein}"
    rounded: "{rounded.full}"
  chip-macro-carb:
    backgroundColor: "{colors.card}"
    textColor: "{colors.carb}"
    rounded: "{rounded.full}"
  chip-macro-fat:
    backgroundColor: "{colors.card}"
    textColor: "{colors.fat}"
    rounded: "{rounded.full}"
  input-field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: 12px
  badge-confidence-high:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-strong}"
    rounded: "{rounded.full}"
    padding: 8px
  badge-confidence-medium:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: 8px
  banner-estimate:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-strong}"
    rounded: "{rounded.md}"
    padding: 16px
  progress-ring-track:
    backgroundColor: "{colors.primary-tint}"
  progress-ring-fill:
    backgroundColor: "{colors.primary}"
  nav-bottom-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  mascot-sm:
    size: 64px
  mascot-md:
    size: 120px
  mascot-lg:
    size: 180px
  mascot-bubble:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    typography: "{typography.body-md}"
    padding: 12px
  mascot-stage:
    backgroundColor: "{colors.primary-soft}"
    rounded: "{rounded.lg}"
    padding: 20px
---

# FoodThings Design System

**UI language:** Indonesian. All tokens below are normative; the prose explains intent.

## Overview

FoodThings is a calorie and nutrition tracker where a **photo is the only input**. The layout is mobile-first and built around a single, oversized calorie number that the eye can read in a glance.

The mood is **warm, friendly, and uncluttered**: generous white space, flat white cards floating on a warm off-white canvas, and no heavy shadows. Lime green ("Fresh Lime") is the one meaningful accent — it marks progress and the primary action and nothing else. Everything reads as an *estimate*, never a verdict, so the interface stays gentle and non-judgmental.

A friendly lime mascot named **Limo** (a round green lime with a leaf, sneakers, and big expressive eyes) gives the product personality. Limo shows up at key moments (welcome, loading, success, empty, error) with one of 10 fixed poses. He is a companion, never a judge: he cheers, waits, and shrugs, but never scolds. All information is still carried by text; Limo only adds warmth.

The reference look is "FitBite": rounded cards, a lime progress ring, a 7-day bar chart, a horizontal date strip, and a bottom navigation with a prominent round scan button in the center. Keep it flat, modern, and rounded, with outline SVG icons (Lucide/Phosphor) — never emoji.

## Colors

- **Fresh Lime (#8CCB2F) — primary:** the single accent. Primary buttons, active bars, the progress ring fill, the center scan button. Always pair with the dark **Ink Forest** on-primary (#12210A), never white text.
- **Ink Forest (#12210A) — on-primary:** text and icons placed on top of lime. Guarantees WCAG contrast.
- **Forest Deep (#3A730E) — primary-strong:** green text on white surfaces and on lime-soft (badges, banners), links, and active tab labels. Darkened slightly from #3F7D0F so it clears WCAG AA (≥4.5:1) on the lime-soft `{colors.primary-soft}` surface.
- **Mist Lime (#E6F5C9) — primary-soft:** hero cards, selected chips, estimate banner, initial-letter circles.
- **Pale Lime (#CFE8A0) — primary-tint:** inactive bars and the ring track.
- **Warm Canvas (#F4F4F1) — background:** page background, softer than pure white.
- **Pure White (#FFFFFF) — card:** every card surface.
- **Near-Black Ink (#12150F) — foreground:** primary text.
- **Stone Gray (#5B6356) — muted-foreground:** secondary text, units, dates.
- **Hairline (#E7E9E2) — border:** thin dividers and input strokes.
- **Focus ring (#3F7D0F) — ring:** visible keyboard focus outline.
- **Alert Red (#DC2626) — destructive:** delete and error only, always with a visible text label.
- **Amber Warning (#92400E) on Cream (#FEF3C7):** medium/low confidence badges and error banners.

- **Limo body (#B0D030) and outline (#18301F) — mascot-body / mascot-outline:** the mascot's own palette, sampled from the artwork. It is an illustration, so it is **exempt from the "lime only for progress and primary action" rule**, but these two colors are never reused for UI elements (buttons, chips, text, borders). The dark outline is what keeps Limo legible on light surfaces.

**Data category colors** (always accompanied by a text label, never color alone): carbohydrate Amber `{colors.carb}`, protein Blue `{colors.protein}`, fat Red `{colors.fat}`.

**Dark mode** (optional, later phase): background `#0F130B`, card `#1A2014`, foreground `#F2F5EC`, muted `#A3AC98`, primary stays lime. Re-check contrast before release.

## Typography

One family throughout: **Plus Jakarta Sans** (weights 400–800), imported from Google Fonts. Fallback: `system-ui, -apple-system, 'Segoe UI', sans-serif`.

- **headline-display (52px, 800, tight):** the big calorie total on the hero and history cards.
- **headline-lg (36px, 700):** welcome screen headline.
- **headline-md (24px, 700):** section titles.
- **headline-sm (18px, 600):** card titles, item names.
- **body-lg (16px, 400):** general body copy. Never below 16px for reading text.
- **body-md (15px, 500):** denser secondary copy.
- **label-lg (14px, 600):** buttons and prominent labels.
- **label-md (13px, 500):** units ("kkal", "g"), dates, captions. Never below 12px.
- **numeral (48px, 800, tabular figures):** any large number that changes — calorie totals. Always `font-feature-settings: tnum` so digits don't jump.

Numbers use **Indonesian formatting**: period for thousands, comma for decimals (1.250 kkal, 2,5 g).

## Layout

Mobile-first, single column. Spacing scale on a 4px base: `{spacing.xs}` 4, `{spacing.sm}` 8, `{spacing.md}` 12, `{spacing.lg}` 16, `{spacing.xl}` 20, `{spacing.xxl}` 24, `{spacing.xxxl}` 32, `{spacing.huge}` 48.

- **Breakpoints:** 375 / 768 / 1024 / 1440px.
- **< 768px:** one column, bottom navigation, 16px page padding, sticky full-width primary action at the bottom.
- **768–1023px:** metric grid becomes 2 columns; Scan and Result screens go two-column; bottom navigation stays.
- **≥ 1024px:** compact left sidebar (Today, History, Settings with a large "Scan makanan" button at top) and two-column content, max content width 1120px.
- **Mascot placement:** sizes `mascot-sm` 64px (inline, next to a toast or error banner), `mascot-md` 120px (state cards, loading), `mascot-lg` 180px (welcome and full-page empty states; 220px max at ≥ 1024px). On mobile Limo sits above or beside the message, never between the user and the primary action; on ≥ 768px he sits beside the text (left or right) inside a `mascot-stage` card.
- Card padding is 16px on mobile, 20–24px on desktop. No horizontal scroll ever. Use `aspect-ratio` for photo/image areas to avoid layout shift. Respect `env(safe-area-inset-bottom)` for the bottom bar and sticky buttons.

## Elevation & Depth

The system is **almost entirely flat**. Cards have no shadow at all and sit directly on the warm background, separated by color and radius instead of depth. A shadow is used only for temporarily floating layers such as dropdowns and dialogs: `0 8px 24px rgba(18,21,15,0.08)`.

## Shapes

Rounded and soft, never sharp:

- `{rounded.sm}` 12px — chips, inputs, textareas.
- `{rounded.md}` 20px — standard cards.
- `{rounded.lg}` 28px — hero cards and the photo dropzone.
- `{rounded.full}` 999px — all buttons, chips, badges, avatars, and the center scan button.

## Components

- **Buttons:** pill-shaped (`{rounded.full}`), 48px tall, dark Ink Forest text on Fresh Lime. Primary = lime fill; Secondary = white with a hairline border; Destructive = red fill with white text (confirmation dialogs only); Ghost/icon buttons are circular 44×44px. States: hover darken 6%, pressed scale 0.98, disabled 0.5 opacity with `aria-disabled`, loading spinner with the label preserved.
- **Cards:** white, `{rounded.md}`, no shadow, 16–24px padding. The **hero card** uses `{colors.primary-soft}` at `{rounded.lg}` and holds a small label, a title, and the progress ring on the right. **Metric cards** are two-column: a soft colored circle icon + big number + small unit.
- **Progress ring:** an SVG circle with a 10–12px stroke, rounded caps, `{colors.primary-tint}` track, `{colors.primary}` fill. Center shows the big calorie number and a caption ("dari 2.000 kkal"). If over target, the ring stays full and the caption becomes neutral ("110% dari target") — never red.
- **7-day bar chart:** seven equal bars (Mon–Sun), fully rounded tops. Selected day = solid `{colors.primary}`, other days = `{colors.primary-tint}`, days with no data = diagonal hatch pattern. Each bar is focusable and selectable; percentage shown as text above the bar. Always offer a "Lihat sebagai tabel" alternative.
- **Date strip:** a row of the last 7 days; today is a lime pill with dark text; 44px left/right arrows; header shows month and year ("Oktober 2026").
- **Meal cards:** four fixed cards — Sarapan, Makan Siang, Makan Malam, Camilan. Each row: small flame icon + that meal's calorie total + a stack of small initial-letter circles on `{colors.primary-soft}` + a round `+` button. Photos are never shown. Empty state: "Belum ada catatan" + `+`.
- **Photo dropzone:** `{rounded.lg}`, 4:3 ratio, dashed `{colors.primary-tint}` border on a soft `{colors.primary-soft}` field when empty, with a large camera icon and two buttons: **Foto Makanan** (primary) and **Pilih dari Galeri** (secondary). When filled, show a downscaled preview, a "Ganti foto" icon button, and the final file size.
- **Segmented control:** two options — **Makanan/Piring** and **Label Gizi**. Selected pill = lime fill with dark text; unselected = white with border. A hint line below changes with the choice.
- **Confidence badge:** always icon + text, never color alone. "Yakin tinggi" (lime soft), "Yakin sedang" (cream), "Perlu dicek" (cream/warning).
- **Macro chips:** small pills with a category-colored dot + label + value ("Protein 24 g"). The dot is decorative; the label is required.
- **Estimate banner:** a thin `{colors.primary-soft}` card with an info icon reading "Hasil dari foto hanyalah perkiraan, bukan saran medis." Always present on the Result screen and in Settings, and cannot be dismissed.
- **Item result card:** editable name with a pencil, confidence badge on the right; a big calorie number and a **Berat** (weight) stepper (`−`/`+` with `inputmode="decimal"`, unit "g"); three macro chips; a delete (trash) icon. Changing weight recalculates calories and macros proportionally with a soft 200ms highlight on the changed numbers.
- **Inputs:** visible labels (never placeholder-only), 12px radius, `{colors.border}` stroke, focus outline `{colors.ring}`. Number steppers for calorie target (step 50); radio group for sex; select for activity; error text directly under the field.
- **Navigation:** mobile bottom bar has **3 items only** — Hari Ini, Scan (large round lime button, prominent center), Riwayat — with icon + text label; active item in `{colors.primary-strong}`. A gear icon in the header opens Settings. Desktop uses a compact left sidebar.
- **Status messages:** pill-shaped dark toast for success ("Tersimpan", auto-dismiss 3s, `role="status"`); inline error banner above the affected content with a "Coba lagi" button; delete confirmation dialog with Batal/Hapus, focus trapped, Esc to close.

## Mascot (Limo)

**Source art.** One sprite sheet (1536×1024 px, transparent background, 5 × 2 poses) is cut into 10 separate files and exported as transparent WebP (≤ 25 KB each, PNG fallback), stored in `web/assets/mascot/`. The sprite sheet itself is not shipped. Always set explicit `width` and `height` (or `aspect-ratio`) so loading never shifts the layout.

**Poses and states**

| File | Pose | When to use | Companion text (Indonesian) |
|---|---|---|---|
| `limo-salam` | Waving, smiling | First open; Today when nothing is logged yet | "Halo! Yuk catat makanan pertamamu hari ini." |
| `limo-senang` | Fists raised, eyes closed laughing | "Tersimpan" confirmation; daily target reached | "Tersimpan! Mantap." |
| `limo-santai` | Hands on hips, calm smile | **Default pose**; Today with entries; Settings | "Kamu sudah 85% dari target hari ini." |
| `limo-mikir` | Finger on chin, looking up | Analysis loading; "Perlu dicek" items | "Memperkirakan porsi…" |
| `limo-kaget` | Hands up, exclamation marks | Soft errors (busy server, AI failure, network, non-JSON) | "Waduh, ada kendala. Coba lagi ya." |
| `limo-semangat` | Fist up, determined | Call to action near **Analisis**; empty History | "Siap analisis?" |
| `limo-loncat` | Jumping with joy | Analysis succeeded, results shown | "Ketemu! Cek hasilnya dulu ya." |
| `limo-makan` | Fork in hand, plate of salad, chicken, avocado | Empty photo dropzone; "Mengenali makanan…" loading | "Foto makananmu, aku siap." |
| `limo-bingung` | Question mark, head tilted | Not food, empty items, blurry photo, unsupported image, invalid input | "Hmm, ini kurang jelas. Coba foto ulang?" |
| `limo-tidur` | Sitting, eyes closed, "Zzz" | Daily quota used up; empty History | "Limo istirahat dulu. Analisis bisa dicoba lagi besok." |

**Rules**
- **One pose per screen state**, and only one Limo visible at a time. A state is chosen by a single mapping in `mascot.js`; screens never pick poses ad hoc.
- **Text carries the message.** Limo is decorative whenever a text message sits next to him: `alt=""` and `aria-hidden="true"`. Only when Limo appears alone (never recommended) does the image get a meaningful `alt`, e.g. "Limo sedang tidur".
- **Hierarchy.** Limo must never out-shout the primary action. On the Scan and Result screens he stays smaller than the dropzone/result cards and never sits between the user and **Analisis** / **Simpan**.
- **Non-judgmental.** Going over the calorie target never triggers a negative pose. Use `limo-santai` with the neutral caption ("110% dari target"). Limo never comments on weight, body, or diet and gives no medical advice.
- **Static copy only.** Mascot captions are constants in `mascot.js`, not text generated by the AI model, so they cannot be influenced by notes or photos.
- **Surface.** Place Limo on White card, Warm Canvas, or a `{colors.primary-soft}` stage (his dark outline keeps contrast). Never place him on a solid `{colors.primary}` fill, where body and background blend together.
- **Not an icon.** The center Scan button in the bottom navigation stays an outline camera/scanner icon on the round lime button. Limo is not used as a navigation icon, tab, or button label.
- **Speech bubble** (`mascot-bubble`): white card, `{rounded.md}`, `body-md` text, 12px padding, a small tail pointing at Limo. Max 2 short lines. Optional; the plain caption beside Limo is the default.
- **Failure-safe.** If the image fails to load, hide it silently (no broken-image icon) and show the text alone.
- **Photos are still never shown** to the user after analysis; the mascot does not change this.

## Do's and Don'ts

**Do**
- Make the Scan / "Analisis" action the single most prominent element on every relevant screen.
- Keep calorie numbers huge, bold, and tabular so they read at a glance.
- Label every photo-derived number as an *estimate*; keep confidence badges as icon + text.
- Use lime only for progress and primary action; use category colors only as data accents.
- Keep surfaces flat, cards white, corners generous.
- Use SVG outline icons only.
- Use Limo sparingly, at key moments, with one clear pose per state and text beside him.

**Don't**
- Don't use heavy shadows, 3D effects, or busy gradients.
- Don't put white text on lime, or pale gray text on gray.
- Don't use emoji as icons.
- Don't use red/green as the only way to signal status.
- Don't rely on placeholders as the only input label.
- Don't put more than 3 items in the bottom navigation (Scan is the center).
- Don't animate `width`/`height`, and always honor `prefers-reduced-motion`.
- Don't show photo results as exact numbers without the word "perkiraan".
- Don't use Limo as a button, tab, icon, or the only carrier of a message.
- Don't show a sad, angry, or disappointed Limo when the user exceeds their target or makes a mistake.
- Don't stretch, recolor, rotate, crop, or add shadows to Limo; don't put him on solid lime.
- Don't show more than one Limo on screen, and don't animate him with `width`/`height`.
- Don't add manual food search, autocomplete, food databases, wearable data, or any photo storage — these are explicitly out of scope.

## Icons

Outline style only (Lucide or Phosphor), consistent stroke width, rendered as inline SVG. Every icon-only button needs an `aria-label`; decorative icons use `aria-hidden="true"`. Used icons: camera, calendar, gear, plus, minus, trash, pencil, info, check, warning, question, flame, left/right chevrons, scanner. The mascot is an illustration, not part of the icon set, and is never used in place of an icon.

## Motion

Hover/press transitions 150ms; card/panel transitions 200–250ms; bar chart grows in 400ms `ease-out`. Elements exit faster than they enter. Animate only `transform` and `opacity`. **Limo animations.** Limo's poses are static images except for the greeting, which reuses the transparent animated WebP shown on the splash screen. Only these named animations exist:

| Name | Where | Motion | Duration / repeat |
|---|---|---|---|
| `limo-wave` | Splash screen and Home (Hari Ini) on app open, pose `limo-salam` | HD transparent greeting animation, then matching static rest frame | ~2.4s, **plays once** per screen open, then rests |
| `limo-think` | Analysis loading, pose `limo-mikir` | Slow head-tilt sway (rotate ±3°) with a 3px `translateY` bob, while the caption rotates "Mengenali makanan…" → "Memperkirakan porsi…" → "Menghitung gizi…" and three trailing dots pulse in sequence | Loops while loading, 2.4s per cycle; stops the moment results or an error arrive |
| `limo-hop` | "Tersimpan" confirmation, pose `limo-senang` | One small bounce (`translateY` 0 → −10px → 0, with a slight `scale` 1 → 1.04 → 1) | ~500ms, once |
| `limo-shake` | Soft errors, pose `limo-kaget` | Quick side shake (`translateX` ±4px, three times) | ~400ms, once |
| `limo-bob` | Empty states (`limo-salam`, `limo-semangat`, `limo-tidur`) | Idle `translateY` ±4px | 2.4s ease-in-out, loops at most ~10s then rests |
| pose swap | Any pose change | `opacity` cross-fade between two stacked images | 200ms |

The think animation is an approximation made by moving the whole mascot; it does not move the arm on its own. A true arm wave or a blinking face needs extra frames (see PRD Open Questions). Animations never run on screens where the user is entering data, never run at the same time as a second Limo animation, and never delay the primary action. Under `prefers-reduced-motion`, bars/ring appear instantly, Limo is static, and loading animation becomes static text.

## Accessibility

Text contrast ≥ 4.5:1. Visible focus: `outline: 3px solid {colors.ring}; outline-offset: 2px`. Minimum touch target 44×44px with ≥ 8px spacing. Charts and the ring provide text/table alternatives. Loading and toast messages announced via `aria-live`. Mascot images are decorative (`alt=""`, `aria-hidden="true"`) whenever text accompanies them; the text itself meets contrast requirements, independent of the image. Respect `prefers-reduced-motion` and `prefers-color-scheme`. In dark mode keep Limo on a card or `mascot-stage` surface so his dark outline stays visible.

## Content & Language

Indonesian UI, unit "kkal" / "g" / "porsi". Warm, brief, non-judgmental tone ("Kamu sudah 85% dari target hari ini"). Local food examples (nasi putih, tempe goreng, soto ayam, gado-gado). Key strings: primary button "Analisis", save "Simpan", retry "Foto ulang", banner "Hasil dari foto hanyalah perkiraan, bukan saran medis.", success "Tersimpan". Loading states rotate: "Mengenali makanan…", "Memperkirakan porsi…", "Menghitung gizi…". Limo speaks in short, warm, first-person-light lines ("Siap analisis?", "Tersimpan! Mantap.") and uses "kamu" like the rest of the UI; see the pose table in **Mascot (Limo)** for the exact strings. The name "Limo" is provisional and can be changed in one place (`mascot.js`).
