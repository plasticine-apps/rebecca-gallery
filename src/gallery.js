// Lightbox for the paintings page: click a painting to view it large,
// arrow keys / buttons to move between paintings, Escape or click outside to close.
(function () {
  const dialog = document.querySelector('dialog.lightbox');
  if (!dialog || !dialog.showModal) return; // very old browser: links fall back to the image file
  const works = Array.from(document.querySelectorAll('.work'));
  const img = dialog.querySelector('img');
  const cap = dialog.querySelector('figcaption');
  let current = -1;

  function show(i) {
    current = (i + works.length) % works.length;
    const work = works[current];
    const a = work.querySelector('a');
    img.src = a.dataset.full;
    img.alt = work.querySelector('img').alt;
    cap.innerHTML = work.querySelector('figcaption').innerHTML;
    if (!dialog.open) dialog.showModal();
    // Prefetch neighbours so arrowing feels instant.
    [1, -1].forEach((d) => { new Image().src = works[(current + d + works.length) % works.length].querySelector('a').dataset.full; });
  }

  works.forEach((w, i) => w.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); show(i); }));
  dialog.querySelector('.prev').addEventListener('click', () => show(current - 1));
  dialog.querySelector('.next').addEventListener('click', () => show(current + 1));
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
  });
  dialog.addEventListener('close', () => { img.src = ''; });
})();
