Phase 1 Transformation - "Something's Wrong"

CONTEXT:
This morning I posted that I'm NOT doing the text adventure (misdirection).
This afternoon I'm posting "something's wrong with my site" and pushing this live.

OBJECTIVE:
Add subtle glitches that make the site feel "off" without breaking it.
People should think: "Is this a bug? Did he get hacked? What's happening?"

SPECIFIC CHANGES:

1. LOGO GLITCH
- Add CSS animation: subtle flicker/static effect
- Frequency: every 3-5 seconds, lasts 0.1 seconds
- Not constant, just occasional "wrongness"

2. TYPOGRAPHY SHIFT
- Body text: Change from current font to 'Courier New', monospace
- Headers can stay normal (for now)
- Letter spacing slightly increased (+0.5px)
- Line height slightly off (1.7 instead of 1.5)

3. COLOR DESATURATION
- Apply filter: saturate(0.8) to everything
- Colors should look slightly washed out
- Barely noticeable but contributes to "sick" feeling

4. SPACING ANOMALY
- Pick ONE random element (maybe a service card or testimonial)
- Give it weird margin/padding that breaks the grid slightly
- Should look like a CSS bug, not intentional design

5. RANDOM ELEMENT FLICKER
- Add occasional opacity flicker to navigation items
- Very subtle: opacity 1 → 0.95 → 1
- Happens randomly, not on hover

6. OPTIONAL: Hidden Message
- In HTML comments: <!-- initialization sequence started -->
- Or in console.log: "System status: INITIALIZING"
- For people who inspect element

CODE REQUIREMENTS:
- All changes via CSS (easy to expand tomorrow)
- Minimal JS if needed for random animations
- Keep it performant (no janky animations)
- Should work on mobile too

TESTING:
- View on desktop and mobile
- Check that glitches are noticeable but not broken
- Site should still be functional, just... wrong

The vibe: "My site has a virus" or "Something is trying to break through"
NOT: "I redesigned my site"

Ready to deploy by 2pm tomorrow.