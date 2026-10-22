(() => {
  const root = document.documentElement;
  const tilt = document.getElementById('camera-tilt');
  const orbit = document.getElementById('camera-orbit');
  const studio = document.getElementById('light-studio');
  const warm = document.getElementById('light-warm');
  let light = 'studio';
  function update() {
    root.style.setProperty('--camera-tilt', tilt.value + 'deg');
    root.style.setProperty('--camera-orbit', orbit.value + 'deg');
    document.getElementById('tilt-value').textContent = tilt.value + '°';
    document.getElementById('orbit-value').textContent = orbit.value + '°';
    root.dataset.light = light;
    studio.setAttribute('aria-pressed', String(light === 'studio'));
    warm.setAttribute('aria-pressed', String(light === 'warm'));
    try { localStorage.setItem('pokemon-chess-camera', JSON.stringify({tilt:tilt.value, orbit:orbit.value, light})); } catch {}
  }
  try {
    const saved = JSON.parse(localStorage.getItem('pokemon-chess-camera'));
    if (saved) {
      tilt.value = Math.max(35, Math.min(62, Number(saved.tilt) || 52));
      orbit.value = Math.max(-90, Math.min(90, Number(saved.orbit) || 0));
      light = saved.light === 'warm' ? 'warm' : 'studio';
    }
  } catch {}
  tilt.addEventListener('input', update);
  orbit.addEventListener('input', update);
  studio.onclick = () => { light = 'studio'; update(); };
  warm.onclick = () => { light = 'warm'; update(); };
  document.getElementById('camera-reset').onclick = () => { tilt.value=52; orbit.value=0; light='studio'; update(); };
  update();
})();

