/**
 * hero-canvas.js
 * Interactive canvas grid warp animation for the hero section.
 * Single responsibility: renders and animates the background grid.
 * Scoped with IIFE to avoid global namespace pollution.
 */
(function initHeroCanvas() {
    const canvas = document.getElementById('grid-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const SPACING = 60;
    const MAX_DIST = 250;
    const STRETCH_FORCE = 60;

    let width, height, rows, cols;
    const points = [];
    const mouse = { x: -1000, y: -1000 };

    function init() {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        cols = Math.ceil(width / SPACING) + 1;
        rows = Math.ceil(height / SPACING) + 1;
        points.length = 0;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                points.push({ x: j * SPACING, y: i * SPACING, originX: j * SPACING, originY: i * SPACING, vx: 0, vy: 0 });
            }
        }
    }

    function getStrokeColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-secondary') || '#0058be';
    }

    function updatePoints() {
        points.forEach(p => {
            const dx = mouse.x - p.originX;
            const dy = mouse.y - p.originY;
            const dist = Math.hypot(dx, dy);

            if (dist < MAX_DIST) {
                const force = (MAX_DIST - dist) / MAX_DIST;
                const angle = Math.atan2(dy, dx);
                p.vx += (p.originX + Math.cos(angle) * force * STRETCH_FORCE - p.x) * 0.1;
                p.vy += (p.originY + Math.sin(angle) * force * STRETCH_FORCE - p.y) * 0.1;
            } else {
                p.vx += (p.originX - p.x) * 0.05;
                p.vy += (p.originY - p.y) * 0.05;
            }

            p.vx *= 0.8;
            p.vy *= 0.8;
            p.x += p.vx;
            p.y += p.vy;
        });
    }

    function drawGrid(color) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols - 1; j++) {
                const p1 = points[i * cols + j];
                const p2 = points[i * cols + j + 1];
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
        }
        for (let j = 0; j < cols; j++) {
            for (let i = 0; i < rows - 1; i++) {
                const p1 = points[i * cols + j];
                const p2 = points[(i + 1) * cols + j];
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
        }
        ctx.stroke();
    }

    function drawNodes(color) {
        ctx.fillStyle = color;
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        updatePoints();
        const color = getStrokeColor();
        drawGrid(color);
        drawNodes(color);
        requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('resize', init);
    init();
    animate();
})();
