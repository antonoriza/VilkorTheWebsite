/**
 * app.js
 * Global application initializer. Runs after DOMContentLoaded.
 * Responsibilities: theme, scroll progress, AOS init, hero parallax, card tilt.
 * Scoped with IIFE to avoid global namespace pollution.
 */
(function initApp() {
    // --- Theme: apply before paint to prevent flash ---
    const html = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');

    // --- Scroll Progress Bar ---
    const scrollBar = document.getElementById('scroll-progress');
    if (scrollBar) {
        window.addEventListener('scroll', () => {
            const scrolled = (document.documentElement.scrollTop / (document.documentElement.scrollHeight - document.documentElement.clientHeight)) * 100;
            scrollBar.style.width = scrolled + '%';
        }, { passive: true });
    }

    document.addEventListener('DOMContentLoaded', () => {
        // --- AOS Animations ---
        if (typeof AOS !== 'undefined') {
            AOS.init({ duration: 800, once: true, easing: 'ease-out-quart', offset: 50, disable: 'mobile' });
        }

        // --- Dark Mode Toggle ---
        initDarkModeToggle();

        // --- Hero Parallax ---
        initHeroParallax();

        // --- Pricing Card Tilt ---
        initCardTilt();
    });

    function initDarkModeToggle() {
        const toggle = document.getElementById('dark-mode-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            const icon = toggle.querySelector('.material-symbols-outlined:not(.hidden)');
            icon.style.transform = 'rotate(360deg) scale(0)';
            icon.style.opacity = '0';

            setTimeout(() => {
                html.classList.toggle('dark');
                localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');

                const newIcon = toggle.querySelector('.material-symbols-outlined:not(.hidden)');
                newIcon.style.transform = 'rotate(-360deg) scale(0)';
                newIcon.style.opacity = '0';

                requestAnimationFrame(() => {
                    newIcon.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    newIcon.style.transform = 'rotate(0deg) scale(1)';
                    newIcon.style.opacity = '1';
                });
            }, 250);
        });
    }

    function initHeroParallax() {
        const heroImage = document.getElementById('hero-image');
        if (!heroImage) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            if (scrolled < 1000) {
                heroImage.style.transform = `translateY(${scrolled * 0.1}px)`;
            }
        }, { passive: true });
    }

    function initCardTilt() {
        const cards = document.querySelectorAll('.pricing-card');
        if (!cards.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(({ target: card, isIntersecting }) => {
                if (isIntersecting) {
                    attachTilt(card);
                } else if (card._tiltHandlers) {
                    detachTilt(card);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => observer.observe(card));
    }

    function attachTilt(card) {
        let frame;
        const handleMove = (e) => {
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const { left, top, width, height } = card.getBoundingClientRect();
                const rotateX = (e.clientY - top - height / 2) / 15;
                const rotateY = (width / 2 - (e.clientX - left)) / 15;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
            });
        };
        const handleLeave = () => {
            cancelAnimationFrame(frame);
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        };
        card.addEventListener('mousemove', handleMove, { passive: true });
        card.addEventListener('mouseleave', handleLeave);
        card._tiltHandlers = { handleMove, handleLeave };
    }

    function detachTilt(card) {
        card.removeEventListener('mousemove', card._tiltHandlers.handleMove);
        card.removeEventListener('mouseleave', card._tiltHandlers.handleLeave);
        delete card._tiltHandlers;
    }
})();
