# /images

Reserved for real game screenshots, concept art, maps, character designs,
and environment art.

The live site currently renders every visual as an inline SVG gradient
placeholder (see the gallery() function and world-map markup in
index.html / js/main.js) so the project ships with zero binary
dependencies and works immediately on GitHub Pages.

When real art is ready, drop files here using a clear naming convention,
for example:

    images/screenshots/aurelia-dawn.jpg
    images/concept-art/forgotten-king.jpg
    images/maps/elysium-continents.jpg
    images/characters/ranger-concept.jpg
    images/environment/vethmoor-ridgeline.jpg

Then update the corresponding <img> or <svg> reference in index.html
or the items array in js/main.js. See pages/documentation.html for
the full walkthrough.
