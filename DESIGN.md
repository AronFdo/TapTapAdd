# DESIGN.md

Design system for the TapTapAdd builder app and marketing pages. Public portfolio sites use vibe token sets, covered at the end.

## Direction: mission console

The app should feel like a control panel from a 1960s–70s vision of the future, rebuilt with today's polish. Think illuminated push buttons on a mission console, rocker switches, round dials, orbit rings and the optimistic geometry of Space Age design.

The tangible, backlit key is the signature. Everything around it stays calm and orderly so the controls feel satisfying to use.

### Principles

1. **If it's clickable, it's a control.** Only interactive things get the raised, backlit key treatment. Information sits on flat panels.
2. **Depth from hardware, light from status.** Keys sit on a solid base shadow like physical buttons. Glow is reserved for state (active, selected, live), never decoration.
3. **Flat colour, round geometry.** Circles, arcs and capsule shapes come from Space Age design. No gradients except the single soft glow on lit controls.
4. **One playful moment per screen.** An orbit ring, a status light or a small bounce, not all three.
5. **The card is a real object.** Show the physical NFC card in the interface wherever it helps people understand what they're making.

## Colour

All colours are semantic tokens in `app/tokens.css`. Components never use raw hex values. Dark mode is the hero theme; light mode should feel like the same console under daylight.

### Base palette

| Name | Dark | Light | Use |
|---|---|---|---|
| deep-space | `#161A40` | `#E8E6F4` | page background |
| hull | `#22275A` | `#F7F6FC` | panels, inputs, secondary keys |
| hull-line | `#3B4185` | `#C9C6E3` | panel outlines, dividers |
| starlight | `#F1EEFF` | `#1D2150` | text |
| starlight-soft | `#AFAED8` | `#545887` | secondary text |
| base | `#0A0C26` | `#1D2150` | the solid shadow under keys, key outlines |
| thruster | `#FFA23A` | `#FF9A2E` | primary keys |
| comet | `#FF7AA2` | `#FF6F99` | secondary accents, highlights |
| beacon | `#74E4E0` | `#2CB9B3` | focus rings, links, live status |
| saturn | `#F4CB55` | `#F2C141` | selected and lit-up states |
| signal-green | `#5ED39A` | `#239A63` | success |
| alarm | `#FF5C63` | `#D9363F` | errors, destructive keys |

### Colour rules

- Text on thruster, comet, beacon, saturn and signal-green keys is always `#1D2150` in both themes. Never white.
- Keys always carry a 2px `base` outline so they read as objects in either theme. Panels use `hull-line`.
- Use at most two accent colours on one screen besides starlight.
- Glow (`--glow`) appears only on lit states: pressed-and-selected keys, live status lights and focus. A screen should never feel neon.
- Error text on light backgrounds uses `#B0222B` for contrast; alarm is for fills and icons.
- Light-mode beacon (`#2CB9B3`) is only 2:1 against deep-space, too pale for lines and text. Focus rings, live status lights and links use `beacon-ink` instead: `#0F7470` in light, the same `#74E4E0` in dark. Beacon itself stays for fills.
- Text on alarm keys is `#1D2150` in dark mode and white in light mode, where navy on `#D9363F` falls below AA.
- In dark mode, secondary (hull) keys barely separate from the page (1.2:1). This passes WCAG because the label identifies the control, but keep secondary keys inside panels where possible.

### Token names

```css
--bg, --surface, --text, --text-muted, --line, --link, --key-base,
--key-primary, --key-secondary, --key-accent, --key-danger,
--key-text, --key-danger-text, --selected, --focus, --live, --draft, --off,
--success, --error, --error-text, --glow,
--key-highlight, --key-inset, --input-inset
```

`tests/design-tokens.test.ts` checks every text and UI pairing for AA in both themes. Add a row there when you introduce a new pairing.

## Typography

- **Display: Michroma.** A wide, geometric face with a Space Age feel, for page titles, the person's name on card previews and big stats. One weight. Sentence case. Letter-spacing `0.01em`. Its width means display sizes run smaller than usual.
- **UI and body: Jost** at 400, 500 and 600. Its Futura-like geometry pairs with Michroma without competing.

Load both from Google Fonts with fallbacks: `Michroma, "Arial Black", sans-serif` and `Jost, "Century Gothic", system-ui, sans-serif`.

### Scale

A 1.25 ratio scale. Body text is 16px. Display sizes are one step smaller than a normal-width face would need.

| Token | Size / line height | Font | Use |
|---|---|---|---|
| display-xl | 49 / 1.1 | Michroma | marketing hero only |
| display-l | 31 / 1.15 | Michroma | page titles |
| display-m | 25 / 1.2 | Michroma | section titles, card name |
| title | 20 / 1.3 | Jost 600 | panel titles |
| body | 16 / 1.6 | Jost 400 | default text |
| label | 14 / 1.4 | Jost 500 | key labels, form labels |
| small | 13 / 1.45 | Jost 400 | hints, metadata |

### Type rules

- No all-caps labels and no monospace, even though console interfaces tempt both.
- Keep body text under 68 characters per line.
- Don't highlight a single word in a headline with a different colour or style. Michroma's shape carries the personality.

## Shape and space

- Spacing on a 4px grid: 4, 8, 12, 16, 24, 32, 48, 64.
- Outlines are 2px everywhere, matching the icon stroke.
- Radius follows hierarchy, leaning on Space Age capsules and circles:
  - Primary keys and chips: capsule, `999px`
  - Square console keys and segmented keys: `12px`
  - Round keys (icon-only controls, the publish key on mobile): `50%`
  - Panels: `24px`, with an optional single cut corner of 16px on the top right for hero panels only
  - Inputs: `12px`
  - NFC card preview: `16px`, at the real ID-1 card ratio of 85.6 × 54
- **Orbit rings:** thin 2px elliptical outlines in `hull-line`, used sparingly behind the card preview and empty states. Never behind text.

## The backlit key (signature component)

Every button is a console key: a coloured face, a 2px base outline, a solid base underneath, a thin highlight along the top edge and, when lit, a soft glow around the face.

### States

| State | Transform | Shadow |
|---|---|---|
| Rest | `translateY(0)` | `0 4px 0 var(--key-base)`, inset top highlight |
| Hover | `translateY(-1px)` | `0 5px 0 var(--key-base)` |
| Pressed | `translateY(4px)` | none, plus an inset shadow on the face |
| Lit (selected, active toggle) | `translateY(3px)` | `0 1px 0 var(--key-base)`, plus `0 0 16px var(--glow)` |
| Focus visible | as rest | adds a 3px `--focus` ring, offset 3px |
| Disabled | `translateY(2px)` | `0 2px 0`, face becomes `--bg`, text `--text-muted`, no glow |
| Loading | as rest | a small status light on the key pulses; width stays fixed |

```css
.key {
  --lift: 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 22px;
  font: 500 14px/1 Jost, system-ui, sans-serif;
  color: var(--key-text);
  background: var(--key-primary);
  border: 2px solid var(--key-base);
  border-radius: 999px;
  box-shadow:
    0 var(--lift) 0 var(--key-base),
    inset 0 2px 0 rgb(255 255 255 / 0.4);
  transition:
    transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 160ms ease-out;
}
.key:hover { transform: translateY(-1px); --lift: 5px; }
.key:active {
  transform: translateY(4px);
  box-shadow: inset 0 2px 4px rgb(10 12 38 / 0.3);
  transition-duration: 80ms;
}
.key[aria-pressed="true"],
.key[aria-checked="true"] {
  background: var(--selected);
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--key-base), 0 0 16px var(--glow);
}
.key:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .key, .key:hover, .key:active { transition: none; transform: none; }
  .key:active { filter: brightness(0.92); }
}
```

### Variants and sizes

- **Primary:** thruster face. One per view.
- **Secondary:** hull face.
- **Accent:** comet face, for playful optional actions like "Surprise me".
- **Danger:** alarm face, for destructive actions, behind a two-step confirmation styled as a guarded switch (see below).
- **Quiet:** text only, no base, for low-priority actions like "Skip for now".
- Sizes: small 36px (desktop only), medium 44px, large 56px for onboarding answers and the publish key.

### Key rules

- Labels are a verb plus a noun: "Upload CV", "Publish site", "Save contact".
- Leading icons are fine. No trailing arrows.
- Don't put keys inside keys. A clickable card uses the key treatment on the whole card, with no separate button inside.

## Other controls

- **Segmented keys:** a row of square console keys where the selected one stays lit (pressed in, saturn face, glow, plus a check icon). Used for the vibe picker, theme and job type.
- **Rocker switch:** a toggle drawn as a capsule rocker with a small status light that turns beacon when on. The label always states the current value ("Phone number shown" or "Phone number hidden").
- **Guarded switch:** for destructive actions such as "Delete account". A flip-up cover must be opened first, revealing the alarm key underneath.
- **Dial:** a round knob with tick marks, used only where a value genuinely sits on a range, such as bio length (short to detailed). Drag or use arrow keys; the value is always shown as text beside it.
- **Inputs:** recessed into the hull. Surface face, 2px line outline, a 2px inset shadow along the top. Focus adds the beacon ring.
- **Upload bay:** a large circular-cornered recess with a dashed 2px outline and a faint orbit ring behind it. On drag-over the outline becomes solid beacon and the ring slowly turns.
- **Status lights:** 8px circles beside labels. Grey for off, beacon for live, saturn for draft, alarm for problems. Always paired with text such as "Live" or "Draft".

## Surfaces

- **Panels:** hull face, 2px hull-line outline, 24px radius, no shadow. Panels aren't pressable, so they don't look pressable.
- **Clickable cards** (template choices, past versions): full key treatment with a 6px base.
- **Toasts:** a small capsule panel that drops in from the top with a status light. "Published", "CV uploaded".
- **Starfield:** a sparse, static field of small dots is allowed on the marketing hero and the onboarding background only. No twinkling, no parallax.

## Motion

- Press: 80ms in. Release: 140ms with a slight overshoot.
- Interface responses (opening a drawer, revealing a preview) take 180–240ms and show what changed.
- **The one orchestrated moment is publishing, styled as a launch.** The publish key counts down 3, 2, 1 in its own label, the card preview lifts slightly and settles into an orbit ring, and the site's status light switches to live with one soft pulse. The whole sequence stays under two seconds and appears nowhere else.
- No scroll-triggered entrance animations.
- With reduced motion turned on: no countdown, no movement, just the status light changing to live.

## Iconography

A rounded line icon set (Lucide works well) at a 2px stroke, matching the outlines. Use 20px inside keys and 24px elsewhere. Icons always sit beside a text label except on universally understood controls like close.

## Layout

Text is left-aligned throughout. Only the marketing hero headline and the card preview are centred.

### Builder on desktop

```
+------+---------------------------+----------------------+
| rail | editor (max 480px)        |  live preview        |
|  o   |  panels: profile, look,   |      .-~~~~-.        |
| Site |  sections, contact        |   ( +--------+ )     |
| Card |                           |     | phone  |       |
| Stats|                           |     | 390px  |       |
|      |  [ AI edit bar ........ ] |     +--------+       |
|      |  suggestion chips         |  ( Publish site )    |
+------+---------------------------+----------------------+
```

The rail is a vertical strip of round console keys with a status light showing the site's state. The preview sits inside a faint orbit ring.

### Builder on mobile

Editor and preview become two segmented keys at the top ("Edit" and "Preview"). Navigation moves to a bottom bar of three round keys. The AI edit bar stays pinned above it.

## Key screens

- **Onboarding:** one question per screen, answers as large keys, progress shown as a row of status lights that switch on as you go.
- **Upload:** the upload bay fills most of the screen. After upload, a "reading your CV" state shows the card preview with the person's name appearing on it.
- **Vibe picker:** segmented keys, each with a small live thumbnail of the portfolio in that vibe.
- **AI edit:** a chat bar with suggestion chips under it, such as "Shorten my bio", "Lead with projects" and "Warmer tone". Every edit shows a before/after toggle and an "Undo" key.
- **Card page:** a realistic front and back preview of the PVC card on an orbit ring, with the QR code on the back and the card's link.

## Voice and copy

Plain verbs, sentence case, no filler. The visuals carry the space theme; the words stay clear. No "mission", "launchpad" or "houston" puns in functional copy. An action keeps the same name throughout a flow.

| Moment | Copy |
|---|---|
| Upload key | Upload CV |
| Upload success | CV uploaded |
| Publish key and toast | Publish site → Published |
| Empty dashboard | No site yet. Upload your CV to make one. |
| Wrong file type | That file isn't a PDF or Word document. Upload a .pdf or .docx file. |
| Extraction partly failed | Some sections couldn't be read. Check the highlighted fields before you continue. |
| Unassigned card | This card isn't linked yet. Sign in to claim it. |

Errors don't apologise and are never vague. They say what happened and what to do next.

## Accessibility floor

- WCAG AA contrast for all text, including text on coloured keys and in both themes.
- Visible focus on every interactive element.
- Touch targets of at least 44 × 44px.
- Lit, selected and status states always pair colour or glow with an icon or text, never colour alone.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Portfolio vibes (public sites)

Public portfolios are rendered by components in `components/site`, which never import from `components/ui`. Each vibe is a token set that satisfies this contract:

```css
--vibe-bg, --vibe-surface, --vibe-text, --vibe-muted,
--vibe-accent, --vibe-accent-text, --vibe-line,
--vibe-radius, --vibe-shadow, --vibe-glow,
--vibe-font-display, --vibe-font-body
```

The user's accent colour replaces `--vibe-accent`. The renderer computes `--vibe-accent-text` to guarantee AA contrast.

Planned vibes:

- **Orbit:** this app's own language. Deep-space background, Michroma and Jost, backlit contact keys, a faint orbit ring behind the hero photo.
- **Minimal:** quiet and spacious, thin lines, no shadows.
- **Editorial:** large type, magazine-style rhythm, image-led project sections.
- **Technical:** structured grids, compact skill and stack listings, suited to engineers.

Define Minimal, Editorial and Technical deliberately before building them, each with its own typefaces and palette, so the four vibes feel genuinely different rather than recoloured versions of one design.