/**
 * nav.js
 * Handles navbar scroll effects and mobile menu toggling.
 * Single responsibility: navigation interactivity only.
 * Scoped with IIFE to avoid global namespace pollution.
 */
(function initNav() {
    const nav = document.getElementById('main-nav');
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    // --- Scroll Effect ---
    let isScrolled = false;

    function onScroll() {
        const scrolled = window.scrollY > 50;
        if (scrolled === isScrolled) return;
        isScrolled = scrolled;
        requestAnimationFrame(() => {
            nav.classList.toggle('glass-nav', isScrolled);
            nav.classList.toggle('py-4', isScrolled);
            nav.classList.toggle('py-6', !isScrolled);
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // --- Mobile Menu ---
    function closeMobileMenu() {
        mobileMenu.classList.add('translate-x-full');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function openMobileMenu() {
        mobileMenu.classList.remove('translate-x-full');
        menuIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const isOpen = !mobileMenu.classList.contains('translate-x-full');
            isOpen ? closeMobileMenu() : openMobileMenu();
        });
    }

    mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));
})();
