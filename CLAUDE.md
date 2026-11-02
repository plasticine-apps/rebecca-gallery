# Rebecca's gallery site — notes for Claude Code sessions

This is a plain static site (GitHub Pages), **not** a Plasticine app: no
baselib, no Cloud Run, no Axiom, no fleet conventions. Keep it that simple.
`README.md` explains the files and the pasteable update prompts.

## Doing an update (the whole procedure)

1. Clone or `git pull` (`gh repo clone plasticine-apps/rebecca-gallery` if the
   repo isn't on disk). Work directly on `main`.
2. Make the change:
   - New painting: copy the image to `originals/<slug>.jpg` (lowercase,
     hyphens; convert HEIC/PNG/WebP to JPEG first, e.g. with `sharp` from
     `node_modules` after `npm ci`; keep full resolution, strip nothing else)
     and add an entry to `paintings.json` at the requested position
     (default: first, since the gallery is roughly newest-first).
   - Title case titles ("Rose Garden at Sunset"); `size` is `"W × H"` in
     inches with the multiplication sign; `medium` is normally
     `"Acrylic on canvas"`; include `"sold": true` only when sold.
   - Getting the image: a Google Drive file comes via the Drive connector
     (`download_file_content`); a URL via curl; a dragged-in image is saved
     to disk by the harness and its path is in the prompt. An **email
     attachment** cannot be downloaded through the Gmail connector; fetch it
     from Mirror's archive instead: `gcloud storage ls -l
     gs://plasticine-prod-mirror-email-images/` (platform credential
     `~/secrets/plasticine2/gcp-key.json`), pick the object written within a
     minute or two of the email's arrival and matching its size, download it,
     and confirm by viewing it before using it.
3. `npm ci && npm run build && npm run check` — both must pass.
4. Look at `dist/index.html` for the new entry (and, for a new image, open
   `dist/img/<slug>-thumb.jpg` to confirm orientation — phone photos carry
   EXIF rotation, which the build honours).
5. Commit and push to `main`, then `gh run watch` (or `gh run list --limit 1`
   until it shows `completed success`). The site updates about a minute later;
   confirm with `curl -s https://rebecca.snewman.net/ | grep -c '<figure'`.
6. Report in one or two lines. Don't ask for approval for the change the
   prompt asked for; it is reversible via git.

## Don'ts

- Don't add a framework, a CMS, a database, or a build system beyond
  `src/build.mjs`. The entire value of this setup is that it has no moving
  parts.
- Don't commit `dist/`, `.cache/` or `node_modules/`.
- Don't delete originals when removing a painting from the gallery unless
  asked; `check.mjs` requires every top-level original to be listed, so move
  the file to `originals/retired/` instead.
