// Subtle spatial parallax — desktop only, respects reduced motion.
function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (reduce || !fine) return;

  const layers = document.querySelectorAll<HTMLElement>('[data-parallax]');
  if (!layers.length) return;

  let raf = 0;

  function onMove(e: MouseEvent) {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      layers.forEach((el) => {
        const depth = parseFloat(el.getAttribute('data-parallax') ?? '1');
        el.style.transform = `translate3d(${nx * depth * -14}px, ${ny * depth * -10}px, 0)`;
      });
    });
  }

  window.addEventListener('mousemove', onMove, { passive: true });
}

init();
