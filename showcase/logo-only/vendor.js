// Logo-only vendor.js - Just replaces the logo with video overlay
(function() {
    const _basePath = 'assets/img/v/';
    const logoVideo = 'ph1b';

    function createVideoOverlay() {
        const logoLink = document.querySelector('.logo a');
        if (!logoLink) return;

        // Store original text
        const originalText = logoLink.innerHTML;

        // Create container
        const container = document.createElement('div');
        container.style.cssText = 'position: relative; display: inline-block;';

        // Create video element
        const video = document.createElement('video');
        video.src = _basePath + logoVideo + '.mp4';
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            min-width: 150%;
            min-height: 150%;
            width: auto;
            height: auto;
            opacity: 0;
            transition: opacity 0.5s ease;
            pointer-events: none;
            mix-blend-mode: screen;
        `;

        // Wrap logo content
        const textSpan = document.createElement('span');
        textSpan.innerHTML = originalText;
        textSpan.style.cssText = 'position: relative; z-index: 1;';

        container.appendChild(textSpan);
        container.appendChild(video);

        logoLink.innerHTML = '';
        logoLink.appendChild(container);
        logoLink.style.overflow = 'hidden';

        // Show video on hover
        logoLink.addEventListener('mouseenter', () => {
            video.style.opacity = '1';
            video.currentTime = 0;
            video.play();
        });

        logoLink.addEventListener('mouseleave', () => {
            video.style.opacity = '0';
        });
    }

    // Initialize after DOM loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createVideoOverlay);
    } else {
        createVideoOverlay();
    }
})();
