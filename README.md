# Yash Tapadiya

Personal site for Yash Tapadiya, a software engineer in Seattle. The page is a static site: HTML, CSS, and JavaScript, with no build step.

## Preview locally

From the repository root:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Deploy on GitHub Pages

This repository is published as a user site at [yashtap1245-tech.github.io](https://yashtap1245-tech.github.io/). GitHub Pages serves the files at the root of the default branch. There is no install, bundler, or GitHub Actions workflow.

1. Push to the branch Pages is configured to publish (typically `main`).
2. In the repository settings, under Pages, set the source to that branch and the folder to `/ (root)`.
3. `.nojekyll` is included so Jekyll does not process `fonts/` or `vendor/`.

Fonts (Fraunces and Source Sans 3, SIL Open Font License), GSAP (GreenSock standard license), and Lenis (MIT) are stored in the repo so the site does not depend on a CDN at runtime.

## Motion and accessibility

Smooth scrolling (Lenis), the hero canvas, the pinned skills reel, project tilt, magnetic buttons, and the custom cursor run on desktop when the visitor has not asked for reduced motion. Phones get the same content with those heavier effects turned off. `prefers-reduced-motion: reduce` leaves the page static and readable. A light and dark theme toggle is in the header.

## Still worth adding

The redesign keeps the existing copy, projects, experience, and links. A few things are not in the repository yet:

- A resume PDF. There is no file to link, so the page does not pretend there is a download. Add `resume.pdf` at the root and a “Resume” link in the hero when it exists.
- Project images, live URLs, and repository links for the four projects.
- The current portrait (`data/dp.jpg`) is a casual outdoor photo. A tighter headshot will read more clearly at small sizes.
