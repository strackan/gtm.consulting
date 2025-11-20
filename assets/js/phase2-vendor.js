/**
 * Vendor utilities and optimizations
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Obfuscated resource mapping (base path encoded)
  const _bp = 'assets/img/v/';
  const _m = {
    'h': ['ph1a', 'ph2a', 'ph3a', 'ph4a', 'ph5a', 'ph6a'],  // hero videos (array for random selection)
    'l': 'ph1b',    // logo
    't1': 'ph1c',   // tabs instance 1
    't2': 'ph1d'    // tabs instance 2
  };

  // Video configuration
  const _cfg = {
    hero: {
      fadeIn: 250,         // 0.25s fade in
      fadeOut: 250,        // 0.25s fade out
      playDuration: 500,   // 0.5s playback (total 1s)
      playbackRate: 0.5    // Half speed for more subtle effect
    },
    logo: {
      fadeIn: 500,          // 0.5s fade in
      fadeOut: 500,         // 0.5s fade out
      playDuration: 1000,   // 1s playback (total 2s)
      playbackRate: 0.5,    // Half speed
      maxOpacity: 1.0,      // Full opacity (100%)
      crossfadeDuration: 300 // 0.3s crossfade at loop point
    },
    tabs: {
      fadeIn: 500,
      fadeOut: 500,
      playDuration: 1000,
      playbackRate: 1.0
    }
  };

  // Target element mapping (selectors)
  const _targets = {
    'h': '#hero',  // Hero section (background video)
    'l': '.logo a', // Logo link
    't1': 'img[src*="tabs-1.jpg"]', // First tabs-1 image
    't2': null  // Will be set to second tabs-1 after first
  };

  // Active video references
  const _active = {};

  /**
   * Create video overlay element
   */
  function _cv(key) {
    const video = document.createElement('video');
    // Set muted as both property AND attribute for maximum compatibility
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity ${_cfg.fadeIn}ms ease-in-out;
      pointer-events: none;
      z-index: 10;
    `;

    const source = document.createElement('source');
    // Handle array (for hero random selection) or string
    let videoFile = _m[key];
    if (Array.isArray(videoFile)) {
      // Random selection from array
      videoFile = videoFile[Math.floor(Math.random() * videoFile.length)];
    }
    source.src = _bp + videoFile + '.mp4';
    source.type = 'video/mp4';
    video.appendChild(source);

    return video;
  }

  /**
   * Swap image with video (crossfade)
   */
  function _swapImg(target, key) {
    if (!target) {
      console.log('No target found for', key);
      return;
    }

    const cfg = _cfg.tabs;
    const container = target.parentElement;

    console.log('Setting up video for', key, 'target:', target);

    // Make container relative if not already
    const pos = window.getComputedStyle(container).position;
    if (pos === 'static') {
      container.style.position = 'relative';
    }

    // Create video overlay with exact dimensions (456x342)
    const video = document.createElement('video');
    // Set muted as both property AND attribute for autoplay
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'auto');
    video.src = _bp + _m[key] + '.mp4';  // Set src directly on video element
    video.playbackRate = cfg.playbackRate;
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 456px;
      height: 342px;
      object-fit: cover;
      opacity: 0;
      transition: opacity ${cfg.fadeIn}ms ease-in-out;
      pointer-events: none;
      z-index: 100;
      border-radius: 8px;
    `;

    container.appendChild(video);

    console.log('Video added for', key, 'src:', video.src);

    // Store reference
    _active[key] = { video, target, container };

    // Add error handler
    video.addEventListener('error', function(e) {
      console.error('Video error for', key, e);
    });

    // Wait for video to load - use canplay instead of loadeddata
    video.addEventListener('canplay', function() {
      console.log('Video ready for', key);
      // Start playback
      video.play().then(() => {
        console.log('Playing', key);
        // Fade in
        requestAnimationFrame(() => {
          video.style.opacity = '1';
        });

        // Only schedule fade out if not continuous (playDuration > 0)
        if (cfg.playDuration > 0) {
          setTimeout(() => {
            video.style.opacity = '0';

            // Remove after fade completes
            setTimeout(() => {
              video.pause();
              video.currentTime = 0;
              if (container.contains(video)) {
                container.removeChild(video);
              }
              delete _active[key];
            }, cfg.fadeOut);
          }, cfg.playDuration);
        } else {
          // Continuous playback - loop video
          video.setAttribute('loop', '');
        }
      }).catch(err => console.error('Playback prevented for', key, ':', err));
    }, { once: true });

    video.load();
  }

  /**
   * Swap hero background with video (dreamy blur transition, multi-video support)
   */
  function _swapHero(key) {
    const hero = document.querySelector(_targets[key]);
    if (!hero) return;

    const cfg = _cfg.hero;

    // Initialize hero video collection if not exists
    if (!_active[key]) {
      _active[key] = {
        target: hero,
        videos: {},  // Store all video instances by filename
        currentVideo: null  // Track which is currently playing
      };
    }

    // Randomly pick a video filename
    const videoFiles = _m[key];
    const randomFile = Array.isArray(videoFiles)
      ? videoFiles[Math.floor(Math.random() * videoFiles.length)]
      : videoFiles;

    console.log('Random hero video selected:', randomFile);

    // Hide all other videos before showing the selected one
    const previousVideo = _active[key].currentVideo;
    if (previousVideo && previousVideo !== randomFile && _active[key].videos[previousVideo]) {
      const prevVid = _active[key].videos[previousVideo];
      prevVid.style.opacity = '0';
      prevVid.style.filter = 'blur(20px)';
      prevVid.pause();
      console.log('Hiding previous video:', previousVideo);
    }

    // Update current video
    _active[key].currentVideo = randomFile;

    // Check if this video already exists
    if (_active[key].videos[randomFile]) {
      // Video exists - resume it
      const video = _active[key].videos[randomFile];
      console.log('Resuming existing video from', video.currentTime);

      video.play().then(() => {
        requestAnimationFrame(() => {
          video.style.opacity = '1';
          video.style.filter = 'blur(0px)';
        });
      }).catch(err => console.error('Resume failed:', err));
    } else {
      // Create new video element
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        filter: blur(20px);
        transition: opacity ${cfg.fadeIn}ms ease-in-out, filter ${cfg.fadeIn}ms ease-in-out;
        z-index: 1;
      `;

      const source = document.createElement('source');
      source.src = _bp + randomFile + '.mp4';
      source.type = 'video/mp4';
      video.appendChild(source);

      // Insert into hero
      hero.insertBefore(video, hero.firstChild);

      // Store in collection
      _active[key].videos[randomFile] = video;

      // Add error handling
      video.addEventListener('error', function(e) {
        console.error('Video load error for', randomFile, ':', e);
      }, { once: true });

      // Load and play
      video.addEventListener('loadeddata', function() {
        video.playbackRate = cfg.playbackRate;
        console.log('New hero video loaded:', randomFile);

        video.play().then(() => {
          requestAnimationFrame(() => {
            video.style.opacity = '1';
            video.style.filter = 'blur(0px)';
          });

          // Loop if video ends
          video.addEventListener('ended', function() {
            video.currentTime = 0;
            video.play();
          });
        }).catch(err => console.log('Playback prevented:', err));
      }, { once: true });

      console.log('Loading new video:', _bp + randomFile + '.mp4');
      video.load();
    }
  }

  /**
   * Swap logo with video (continuous loop with crossfade)
   */
  function _swapLogo(key) {
    const logo = document.querySelector(_targets[key]);
    console.log('_swapLogo called for', key, 'logo element:', logo);
    if (!logo) {
      console.error('Logo element not found!');
      return;
    }

    const cfg = _cfg.logo;
    const container = logo.parentElement;
    console.log('Container:', container);

    // Hide the original logo image
    logo.style.opacity = '0';
    logo.style.visibility = 'hidden';

    const pos = window.getComputedStyle(container).position;
    if (pos === 'static') {
      container.style.position = 'relative';
    }
    // Set container height
    container.style.height = '75px';
    container.style.margin = '0';
    container.style.padding = '0';

    // Add fade mask overlay to soften edges (no overflow:hidden needed)
    const maskOverlay = document.createElement('div');
    maskOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 20;
      background: linear-gradient(to right,
        rgba(255,255,255,0.3) 0%,
        transparent 5%,
        transparent 95%,
        rgba(255,255,255,0.3) 100%);
    `;
    container.appendChild(maskOverlay);

    let currentVideo = null;
    let nextVideo = null;
    let crossfadeTriggered = false;

    // Function to setup crossfade monitoring for a video
    function setupCrossfade(video) {
      video.addEventListener('timeupdate', function() {
        const crossfadePoint = video.duration - 0.25; // Start 250ms before end

        // Trigger crossfade when approaching the end
        if (video.currentTime >= crossfadePoint && !crossfadeTriggered) {
          crossfadeTriggered = true;
          console.log('Triggering crossfade at', video.currentTime);

          // Create next video instance
          nextVideo = _cv(key);
          nextVideo.style.cssText = `
            position: absolute;
            left: 0;
            width: 242px;
            height: 75px;
            object-fit: contain;
            opacity: 0;
            transition: opacity ${cfg.crossfadeDuration}ms ease-in-out;
            pointer-events: none;
            z-index: 11;
            margin: 0;
            padding: 0;
          `;

          container.appendChild(nextVideo);

          nextVideo.addEventListener('loadeddata', function() {
            nextVideo.playbackRate = 0.8;
            nextVideo.currentTime = 0;
            nextVideo.play().then(() => {
              console.log('Next video playing, crossfading...');
              // Fade in next video
              requestAnimationFrame(() => {
                nextVideo.style.opacity = cfg.maxOpacity.toString();
                video.style.opacity = '0';
              });

              // After crossfade, remove old video and set up for next loop
              setTimeout(() => {
                if (container.contains(video)) {
                  container.removeChild(video);
                }
                // Swap references and setup next crossfade
                currentVideo = nextVideo;
                nextVideo = null;
                crossfadeTriggered = false;
                _active[key].video = currentVideo;

                // Setup crossfade for the new current video
                setupCrossfade(currentVideo);
                console.log('Ready for next crossfade cycle');
              }, cfg.crossfadeDuration);
            });
          }, { once: true });

          nextVideo.addEventListener('error', function(e) {
            console.error('Next video error:', e);
          });

          nextVideo.load();
        }
      });
    }

    // Initialize first video
    currentVideo = _cv(key);
    currentVideo.style.cssText = `
      position: absolute;
      left: 0;
      width: 242px;
      height: 75px;
      object-fit: contain;
      opacity: 0;
      transition: opacity ${cfg.fadeIn}ms ease-in-out;
      pointer-events: none;
      z-index: 10;
      margin: 0;
      padding: 0;
    `;

    container.appendChild(currentVideo);
    console.log('Video element appended to container, src:', currentVideo.querySelector('source')?.src);
    _active[key] = { video: currentVideo, target: logo, container };

    currentVideo.addEventListener('loadeddata', function() {
      console.log('Initial video loaded');
      currentVideo.playbackRate = 0.8;

      // Setup crossfade monitoring
      setupCrossfade(currentVideo);

      currentVideo.play().then(() => {
        // Fade in and stay at max opacity
        requestAnimationFrame(() => {
          currentVideo.style.opacity = cfg.maxOpacity.toString();
        });
      }).catch(err => {
        console.log('Playback prevented:', err);
        // Clean up if playback fails
        if (container.contains(currentVideo)) {
          container.removeChild(currentVideo);
        }
        delete _active[key];
      });
    }, { once: true });

    currentVideo.addEventListener('error', function(e) {
      console.error('Video load error:', e, 'src:', currentVideo.querySelector('source')?.src);
    });

    console.log('Calling video.load()...');
    currentVideo.load();
  }

  /**
   * Main trigger function
   * @param {string} key - Resource key (h, l, t1, t2)
   */
  function _trigger(key) {
    if (!_m[key]) {
      console.warn('Invalid key:', key);
      return;
    }

    // Prevent duplicate triggers (but allow hero to re-trigger for random selection)
    if (_active[key] && key !== 'h') {
      console.log('Already active:', key);
      return;
    }

    // Route to appropriate handler
    switch(key) {
      case 'h':
        _swapHero(key);
        break;
      case 'l':
        _swapLogo(key);
        break;
      case 't1':
      case 't2':
        // Find tabs-1 images
        const imgs = document.querySelectorAll('img[src*="tabs-1.jpg"]');
        if (key === 't1' && imgs[0]) {
          _swapImg(imgs[0], key);
        } else if (key === 't2' && imgs[1]) {
          _swapImg(imgs[1], key);
        }
        break;
    }
  }

  /**
   * Configuration adjustment function
   * @param {string} target - 'hero', 'logo', or 'tabs'
   * @param {object} settings - { opacity, playbackRate, length }
   *   - opacity: 0-1 (e.g., 0.6 for 60%)
   *   - playbackRate: speed multiplier (e.g., 0.5 for half speed)
   *   - length: duration in ms (0 = continuous loop)
   */
  function _adjust(target, settings) {
    if (!_cfg[target]) {
      console.warn('Invalid target:', target, '(use: hero, logo, tabs)');
      return;
    }

    if (settings.opacity !== undefined) {
      if (target === 'logo') {
        _cfg[target].maxOpacity = settings.opacity;
      }
      console.log(`${target} opacity set to:`, settings.opacity);
    }

    if (settings.playbackRate !== undefined) {
      _cfg[target].playbackRate = settings.playbackRate;
      console.log(`${target} playbackRate set to:`, settings.playbackRate);
    }

    if (settings.length !== undefined) {
      if (settings.length === 0) {
        _cfg[target].playDuration = 0; // continuous
        console.log(`${target} set to continuous playback`);
      } else {
        _cfg[target].playDuration = settings.length;
        console.log(`${target} playDuration set to:`, settings.length, 'ms');
      }
    }

    console.log(`${target} config:`, _cfg[target]);
  }

  /**
   * Stop an active video effect
   * @param {string} key - Resource key (h, l, t1, t2)
   */
  function _stop(key) {
    if (!_active[key]) {
      console.log('Not active:', key);
      return;
    }

    // Hero video: Add blur and fade out (dreamy exit), keep all videos in memory
    if (key === 'h') {
      const currentFile = _active[key].currentVideo;
      if (currentFile && _active[key].videos[currentFile]) {
        const video = _active[key].videos[currentFile];
        video.style.opacity = '0';
        video.style.filter = 'blur(20px)';

        setTimeout(() => {
          video.pause();
          console.log('Hero video paused at', video.currentTime, '(file:', currentFile, ')');
        }, 250);
      }
    } else {
      // Other videos: Regular fade out and remove
      const { video, container } = _active[key];
      video.style.opacity = '0';

      setTimeout(() => {
        video.pause();
        video.currentTime = 0;
        if (container && container.contains(video)) {
          container.removeChild(video);
        } else if (video.parentElement) {
          video.parentElement.removeChild(video);
        }
        delete _active[key];
        console.log('Stopped:', key);
      }, 250);
    }
  }

  /**
   * Lazy load hero background image
   */
  function _loadHeroBackground() {
    const hero = document.querySelector('#hero');
    if (!hero) return;

    // Preload the image
    const img = new Image();
    img.onload = function() {
      hero.classList.add('loaded');
      console.log('Hero background loaded');
    };
    img.src = 'assets/img/priscilla-du-preez-XkKCui44iM0-unsplash.jpg';
  }

  // Initialize on DOM ready
  function _init() {
    // Update t2 target after finding second instance
    const tabs = document.querySelectorAll('img[src*="tabs-1.jpg"]');
    if (tabs.length >= 2) {
      _targets.t2 = tabs[1];
    }

    // Expose functions globally (for testing)
    window._t = _trigger;
    window._adjust = _adjust;
    window._stop = _stop;

    // Lazy load hero background after initial page load
    setTimeout(_loadHeroBackground, 100);

    // Delay logo video to reduce initial lag (start after 1.5s)
    console.log('Logo video will start after page settles...');
    setTimeout(() => {
      const logoTarget = document.querySelector(_targets['l']);
      if (logoTarget) {
        console.log('Starting logo video...');
        _trigger('l');
      }
    }, 1500);

    // Hero video: Light switch on hover over "Book A Meeting" button
    const heroBtn = document.querySelector('#hero-trigger-btn');
    if (heroBtn) {
      heroBtn.addEventListener('mouseenter', function() {
        console.log('Hero button hover - picking random video');
        // _swapHero now handles random selection and resume logic
        _trigger('h');
      });

      heroBtn.addEventListener('mouseleave', function() {
        console.log('Hero button leave - pausing current video');
        _stop('h');
      });
    }

    // Log ready state (remove in production)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Video system ready.');
      console.log('Trigger: _t("h"), _t("l"), _t("t1"), _t("t2")');
      console.log('Adjust: _adjust("hero", { opacity: 0.8, playbackRate: 0.5, length: 1000 })');
      console.log('Stop: _stop("l")');
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
