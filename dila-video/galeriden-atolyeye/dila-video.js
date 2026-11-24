for (const clip of document.querySelectorAll('video')) {
  const output = clip.parentElement.querySelector('output');
  let requestTime;
  clip.addEventListener('play', () => {
    if (requestTime === undefined) requestTime = performance.now();
  });
  clip.addEventListener('playing', () => {
    if (requestTime === undefined) return;
    const fire = Math.round(performance.now() - requestTime);
    output.textContent = 'İlk oynatma: ' + fire.toLocaleString('tr-TR') + ' ms (bu oturum).';
  }, { once: true });
  clip.addEventListener('error', () => {
    output.textContent = 'Video açılamadı. Dosyayı ve bağlantıyı kontrol edin.';
  });
}
