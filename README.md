# The Works of Rebecca Newman

Rebecca's portfolio site, served by GitHub Pages at **https://rebecca.snewman.net**
(also https://plasticine-apps.github.io/rebecca-gallery/). It replaced the
Squarespace site on 2026-11-01.

Everything on the site comes from a few plain files in this repo. Pushing to
`main` rebuilds and publishes the site automatically (about one minute).

| What | Where |
|---|---|
| The list of paintings, in display order | `paintings.json` |
| The painting images (full resolution) | `originals/` |
| The raps | `raps.json` and `audio/` |
| The About page text | `content/about.md` |
| Page layout, styling, lightbox | `src/` |

A painting entry looks like this; `size` and `sold` are optional:

```json
{ "file": "ruby-girls.jpg", "title": "Ruby Girls", "medium": "Acrylic on canvas", "size": "30 × 40", "sold": true }
```

## Updating the site with Claude Code

Open Claude Code anywhere and paste one of these. Nothing else is needed; the
session clones the repo if it has to, makes the change, pushes, and confirms
the deploy finished.

- **Add a painting:** *"In github.com/plasticine-apps/rebecca-gallery, add a
  painting titled 'Blue Dawn', acrylic on canvas, 24x18, not sold. The image
  is in my Google Drive folder 'Rebecca paintings to add' (file blue-dawn.jpg).
  (Folder: https://drive.google.com/drive/folders/1_9p8FwlULwXrqJrRlpgnompDxfyzJC9r)
  Put it first."* — The image can also be given as a path, a URL, or dragged
  into the prompt.
- **Retitle / mark sold / resize:** *"...mark 'Heart' as sold"*, *"...retitle
  'Untitled 2' to 'Morning Garden'"*.
- **Rearrange:** *"...move 'Adele' to the top"*, *"...sort the paintings so the
  sold ones come last"*.
- **Replace an image:** *"...replace the image for 'Quilt' with the new photo
  in the Drive folder"*.
- **Remove:** *"...remove 'Untitled 50'"*.
- **Edit the About text or add a rap:** say what to change; the text is
  `content/about.md`, the raps are `raps.json` + `audio/`.

Without Claude Code: edit `paintings.json` and add files under `originals/`
directly on GitHub (the web editor and "Upload files" button both work). The
deploy runs a check that every listed painting has its image and every image
is listed, so a typo fails the build rather than publishing a broken page;
GitHub emails the failure.

## Working locally

```
npm ci
npm run build    # writes dist/
npm run check    # consistency checks (also run on every deploy)
npm run serve    # preview at http://localhost:3000
```

Images are resized at build time (700 px thumbnails, 1800 px lightbox
versions, cached in `.cache/`). Originals are committed at full resolution so
the site can be regenerated at any size later.

## Hosting

GitHub Pages, deployed by `.github/workflows/pages.yml` on every push to
`main`. Custom domain `rebecca.snewman.net` is a CNAME at Namecheap pointing at
`plasticine-apps.github.io`; HTTPS is GitHub's. The old Squarespace site
(https://rebecca-newman-portfolio.squarespace.com/) is kept for now as a
forwarding link.
