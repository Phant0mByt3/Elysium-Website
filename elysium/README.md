# Elysium

Official-style announcement website for **Elysium**, an open-world dark
fantasy RPG. Fully static — HTML, CSS, and vanilla JavaScript only, built
to run directly on GitHub Pages with no build step.

## Structure

```
/index.html            Main entry point
/pages/documentation.html   Site documentation (this content, browsable)
/css/style.css          Design tokens, layout, and component styling
/css/animations.css     Keyframes and motion-only effects
/js/main.js              Navigation, scroll reveals, timeline, map, gallery, easter eggs
/js/particles.js         Canvas ambient particle field behind the hero
/assets/                Reserved for audio
/images/                 Reserved for real screenshots and art
```

## Running locally

No build tools required. Either open `index.html` directly in a browser,
or serve the folder locally to avoid any browser file:// restrictions:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this folder to a repository.
2. In the repository's **Settings → Pages**, set the source to the root
   of your default branch.
3. GitHub Pages will serve `index.html` automatically. All paths in the
   project are relative, so no base-path configuration is needed.

## Notes

- All artwork is currently rendered as inline SVG placeholders so the
  project has no binary dependencies. See `pages/documentation.html`
  for how to swap in real screenshots and concept art.
- Respects `prefers-reduced-motion` throughout.
- A few easter eggs are hidden in the site — click around.
