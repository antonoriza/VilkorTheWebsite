/**
 * pricing-toggle.js
 * Handles monthly/annual billing toggle for pricing cards.
 * Single responsibility: price switching and toggle UI state.
 * Scoped with IIFE to avoid global namespace pollution.
 */
(function initPricingToggle() {
  const toggle = document.getElementById("pricing-toggle");
  if (!toggle) return;

  const knob = document.getElementById("toggle-knob");
  const prices = document.querySelectorAll(".price-value");
  const labelMonthly = document.getElementById("label-monthly");
  const labelAnnual = document.getElementById("label-annual");
  let isAnnual = false;

  function updateKnob() {
    knob.style.transform = isAnnual ? "translateX(28px)" : "translateX(0)";
    toggle.classList.toggle("bg-primary-container/30", isAnnual);
    toggle.classList.toggle("bg-zinc-200", !isAnnual);
  }

  function updateLabels() {
    labelMonthly.classList.toggle("text-on-surface-variant", isAnnual);
    labelMonthly.classList.toggle("dark:text-gray-400", isAnnual);
    labelAnnual.classList.toggle("text-on-surface-variant", !isAnnual);
    labelAnnual.classList.toggle("dark:text-gray-400", !isAnnual);
    labelAnnual.classList.toggle("dark:text-white", isAnnual);
  }

  function updatePrices() {
    prices.forEach((price) => {
      price.style.opacity = "0";
      setTimeout(() => {
        const currency = price.dataset.currency || "$";
        const value = isAnnual ? price.dataset.annual : price.dataset.monthly;
        price.textContent = `${currency}${value}`;
        price.style.opacity = "1";
      }, 150);
    });
  }

  toggle.addEventListener("click", () => {
    isAnnual = !isAnnual;
    updateKnob();
    updateLabels();
    updatePrices();
  });
})();
