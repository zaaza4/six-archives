# SIX ARCHIVES

An immersive, messy-scrapbook memory archive. Plain HTML, CSS and vanilla JavaScript: no build step, no dependencies, works on any static host (Vercel, GitHub Pages, Netlify).

## Files

- `index.html` — all content and structure
- `assets/css/style.css` — the whole visual design (sections are numbered at the top)
- `assets/js/main.js` — interactions (gallery filters, memory viewer, random memory, timeline pins, soundtrack renderer, secrets)
- `assets/js/data.js` — **the soundtrack list** (edit this to add songs)

## Run locally

Open `index.html` in a browser, or use VS Code Live Server.

## Add your own photos

1. Put photos in `assets/images/` (about 1200px on the long edge, JPG/WebP).
2. In `index.html`, inside a `.card-image`, replace the placeholder `<span class="ph">…</span>` with:

   `<img src="assets/images/classroom.jpg" alt="Describe the photo" width="1200" height="900" loading="lazy" decoding="async">`

The memory viewer and the timeline thumbnails pick the image up automatically. For a larger version in the viewer add `data-full="assets/images/classroom-large.jpg"` to the card.

## Add another memory

Duplicate one `<button class="memory-card">` inside `#memory-grid`.

- Required: `data-category` (`class`, `friends` or `events`), `data-title`, `data-date` (format `12 September 2023`), `data-story`
- Optional: `data-note` (handwritten caption), `data-location` (shown in the viewer), `data-full`

Counters, numbering, layout, filters, film date stamp, viewer navigation and the timeline (grouped by the year in `data-date`) update by themselves.

## Add songs to the soundtrack

Open `assets/js/data.js`, copy an object in the `soundtrack` array, and paste any normal Spotify share link into `spotify` (track, album, playlist or episode). Set `memory` to a memory card title to link the song to that memory (the link shows in both the soundtrack and the memory viewer). Leave `spotify: ''` for an empty "tape not inserted yet" slot.

## Secrets

Five small hidden things: the hero star, the loose tape, the HANDLE WITH CARE stamp, the footer ®, and the date line at the bottom of the letter.
