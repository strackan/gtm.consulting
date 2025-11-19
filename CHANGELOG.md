# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Phase 1.5 - Video Animations (Planned)
- Crossfade animation system for "living paintings" effect
- Time-based triggers (11:11, Fibonacci sequence, prime numbers)
- Interactive triggers (mail icon progression, hover duration, tab visibility)
- Smooth transitions between static images and video clips

## [0.1.0] - 2024-11-19

### Added - True Clean Static Site
- **Actual source HTML** from https://gtm.consulting (not a rebuild!)
- All CDN dependencies (Bootstrap 5, AOS, Swiper, GLightbox, Remixicon)
- **Real assets downloaded from live site:**
  - Presento template CSS (style.css, ~24KB)
  - Presento template JS (main.js)
  - Hero background image (priscilla-du-preez unsplash, 2.4MB)
  - 7 client logos (Stylo, Cast, Zoee, Eva, Replayz, SL, Techvestor)
  - 5 real testimonial photos (Jeff Swearingen, Nichole Lowe, Austin Emser, Channing Moreland, Lindsey Scott)
  - 4 service tab images (tabs-1 through tabs-4)

### Features (from original site)
- Bootstrap 5 responsive layout
- Fixed header with dropdown navigation
- Full-screen hero section with background image
- Swiper.js client logo carousel
- Tabbed services interface (4 offerings with icons)
- 6-step process section (2-column layout)
- Swiper.js testimonials carousel
- About section with modal for founder bio
- Contact modal with embedded Calendly iframe
- Social links footer with animations
- Back-to-top button
- Mobile navigation toggle

### Project Setup
- Initialized Git repository
- Directory structure: assets/css/, assets/js/, assets/img/
- Added .gitignore for development files
- Created README.md and CHANGELOG.md

### Technical Details
- Pure HTML with Bootstrap 5 framework
- Presento corporate template (v3.9.1)
- CDN dependencies (no local vendor files)
- Font Awesome icons (CDN)
- Google Fonts (Open Sans, Raleway, Poppins)
- Mobile responsive via Bootstrap grid
- AOS scroll animations

### Notes
- This is a pixel-perfect copy of the live site
- Removed incorrect rebuild from earlier attempt
- Ready for Phase 1.5: video animation integration

---

## Version Tags

- `v0.1-clean-base` - Actual source from live site with all real assets
- `v1.0-phase-1` - (Upcoming) First phase with video animations
