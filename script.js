/* script.js — Explosion mejorada */

(() => {
  const btn = document.getElementById("nukeBtn");
  const canvas = document.getElementById("blastCanvas");
  const final = document.getElementById("finalMessage");

  const ctx = canvas.getContext("2d", { alpha: true });

  /* ---------------------------
        Canvas Size
  ---------------------------- */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  /* ---------------------------
        Utilidades
  ---------------------------- */
  const rand = (a, b) => Math.random() * (b - a) + a;

  let animating = false;
  let start = 0;

  // partículas fuego/humo
  const particles = [];

  // Perlin Noise (simple, rápido)
  const noiseSize = 256;
  const noise = new Uint8Array(noiseSize);

  for (let i = 0; i < noiseSize; i++) noise[i] = Math.floor(Math.random() * 255);

  const perlin = (x) => noise[Math.floor(x) % noiseSize] / 255;

  /* ---------------------------
        Explosion "realista"
  ---------------------------- */
  function triggerExplosion() {
    if (animating) return;
    animating = true;
    start = performance.now();
    particles.length = 0;

    canvas.classList.add("active");

    // Flash blanco fuerte
    flashWhite();

    // Cámara shake fuerte
    shake(1200, 16);

    // Crear partículas
    createParticles();

    // Mostrar frase al final
    setTimeout(() => {
      final.classList.add("show");
    }, 3500);

    // Terminar animación
    setTimeout(() => {
      animating = false;
      canvas.classList.remove("active");
    }, 6000);
  }

  /* ---------------------------
         Flash inicial
  ---------------------------- */
  function flashWhite() {
    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.inset = "0";
    flash.style.background = "white";
    flash.style.opacity = "1";
    flash.style.zIndex = "999";
    flash.style.transition = "opacity 700ms ease-out";
    document.body.appendChild(flash);

    setTimeout(() => (flash.style.opacity = "0"), 50);
    setTimeout(() => flash.remove(), 800);
  }

  /* ---------------------------
      Shake de pantalla
  ---------------------------- */
  function shake(duration, magnitude) {
    const start = performance.now();

    function update(now) {
      let elapsed = now - start;
      if (elapsed > duration) {
        document.body.style.transform = "";
        return;
      }

      const intensity = magnitude * (1 - elapsed / duration);
      const x = rand(-intensity, intensity);
      const y = rand(-intensity, intensity);

      document.body.style.transform = `translate(${x}px, ${y}px)`;

      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ---------------------------
         Partículas
  ---------------------------- */
  function createParticles() {
    const cx = innerWidth / 2;
    const cy = innerHeight * 0.65;

    for (let i = 0; i < 400; i++) {
      particles.push({
        x: cx + rand(-20, 20),
        y: cy + rand(-10, 10),
        vx: rand(-1.5, 1.5),
        vy: rand(-7, -2),
        size: rand(4, 18),
        life: rand(1200, 2800),
        born: performance.now(),
        heat: 1,
      });
    }
  }

  /* ---------------------------
        Dibujar Frame
  ---------------------------- */
  function draw(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (animating) {
      const cx = innerWidth / 2;
      const cy = innerHeight * 0.65;

      const t = now - start;

      // Luz inicial
      if (t < 800) {
        ctx.fillStyle = `rgba(255,200,120,${1 - t / 900})`;
        ctx.fillRect(0, 0, innerWidth, innerHeight);
      }

      // Shockwave circular
      if (t < 1500) {
        const r = t * 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.lineWidth = 14 - t / 160;
        ctx.strokeStyle = `rgba(255,220,180,${1 - t / 1500})`;
        ctx.stroke();
      }

      // Dibujar partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.born;

        if (age > p.life) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravedad
        p.vx *= 0.98;

        const lifeRatio = 1 - age / p.life;

        // Color estilo fuego → humo oscuro
        const r = 255;
        const g = Math.floor(180 * lifeRatio);
        const b = Math.floor(60 * lifeRatio);

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${lifeRatio})`;
        ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
        ctx.fill();
      }

      // Humo volumétrico usando Perlin noise
      drawSmoke(t, cx, cy);
    }

    requestAnimationFrame(draw);
  }

  /* ---------------------------
           Humo
  ---------------------------- */
  function drawSmoke(t, cx, cy) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 20; i++) {
      const w = 350 + Math.sin((t + i * 80) / 600) * 40;
      const h = 120 + i * 15;
      const y = cy - 200 - i * 12;

      const noiseVal = perlin((t / 200 + i * 3) % noiseSize);

      ctx.beginPath();
      ctx.fillStyle = `rgba(50,40,30,${0.06 + noiseVal * 0.12})`;
      ctx.ellipse(cx, y, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /* ---------------------------
     Loop
  ---------------------------- */
  requestAnimationFrame(draw);

  btn.addEventListener("click", triggerExplosion);
})();
