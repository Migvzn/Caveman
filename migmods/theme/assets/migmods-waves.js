/* MIGMODS — vagues lumineuses en WebGL, sans dépendance (DESIGN-SYSTEM.md §7.9). Usage : <div data-waves data-waves-gain="0.6"></div>
   (data-waves-dim="off" pour ne pas assombrir le centre). Chargé seulement sur l'accueil et la page mot de passe.
   - canvas rendu à 0,6 × la taille du conteneur, agrandi en CSS ; devicePixelRatio plafonné à 1 (l'effet est flou par nature) ;
   - 30 images/s au doigt (pointer: coarse), 60 sinon ; contexte « low-power » ;
   - redimensionnement temporisé (150 ms) et seulement si la largeur change de plus de 2 px (la barre d'adresse d'iOS ne réalloue rien) ;
   - visible = onglet actif ET conteneur dans l'écran ; une seule image en mouvement réduit ou sous html.is-still (événement mig:still) ;
   - perte du contexte WebGL : arrêt et repli sur un dégradé statique (.is-lost), reprise au rétablissement. */
(function () {
  'use strict';
  var SCALE = 0.6;
  var VERT = 'attribute vec2 p; varying vec2 vUv; void main() { vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 iResolution; uniform float iTime; uniform float uDim; uniform float uGain;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec2 fragCoord = vUv * iResolution;',
    '  vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);',
    '  float dist = distance(fragCoord, iResolution.xy * .5);',
    '  float radius = min(iResolution.x, iResolution.y) * .5;',
    '  float centerDim = mix(1.0, smoothstep(radius * .3, radius * .5, dist), uDim);',
    '  for (float i = 1.0; i < 10.0; i++) {',
    '    uv.x += .6 / i * cos(i * 2.5 * uv.y + iTime);',
    '    uv.y += .6 / i * cos(i * 1.5 * uv.x + iTime);',
    '  }',
    '  vec3 c = vec3(.1) / abs(sin(iTime - uv.y - uv.x));',
    '  c = min(c * uGain, vec3(1.0));',
    '  c = mix(c * .3, c, mix(1.0, centerDim, uDim));',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
  var coarse = matchMedia('(pointer: coarse)').matches;
  function still() { return window.Mig && window.Mig.isStill ? window.Mig.isStill() : (mqReduced.matches || document.documentElement.classList.contains('is-still')); }

  function Waves(host) {
    this.host = host;
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.gain = parseFloat(host.getAttribute('data-waves-gain')) || 0.8;
    this.dim = host.getAttribute('data-waves-dim') === 'off' ? 0 : 1;
    this.frameMs = 1000 / (coarse ? 30 : 60);
    this.t0 = performance.now() - 4000;
    this.raf = 0; this.last = 0; this.width = 0;
    this.heroVisible = false; this.lost = false;
    var self = this;
    this.loop = function (now) { self.frame(now); };
    this.canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); self.lost = true; self.stop(); host.classList.add('is-lost');
    });
    this.canvas.addEventListener('webglcontextrestored', function () {
      self.lost = false; host.classList.remove('is-lost');
      if (self.setup()) { self.resize(true); self.draw(performance.now()); self.update(); }
    });
    if (!this.setup()) return;
    host.appendChild(this.canvas);
    this.resize(true);
    this.draw(performance.now());
    host.classList.add('is-on');

    var timer = 0;
    addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(function () { self.resize(false); }, 150); }, { passive: true });
    document.addEventListener('visibilitychange', function () { self.update(); });
    document.addEventListener('mig:still', function () { self.update(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { self.heroVisible = es[0].isIntersecting; self.update(); }).observe(host);
    } else { this.heroVisible = true; this.update(); }
  }

  Waves.prototype.setup = function () {
    var gl = this.canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    if (!gl) return false;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.uRes = gl.getUniformLocation(prog, 'iResolution');
    this.uTime = gl.getUniformLocation(prog, 'iTime');
    gl.uniform1f(gl.getUniformLocation(prog, 'uDim'), this.dim);
    gl.uniform1f(gl.getUniformLocation(prog, 'uGain'), this.gain);
    this.gl = gl;
    return true;
  };

  Waves.prototype.resize = function (force) {
    var r = this.host.getBoundingClientRect();
    if (!force && Math.abs(r.width - this.width) <= 2) return;   // barre d'adresse d'iOS : hauteur seule, on ne réalloue pas
    this.width = r.width;
    var dpr = Math.min(window.devicePixelRatio || 1, 1);
    var w = Math.max(1, Math.round(r.width * dpr * SCALE)), h = Math.max(1, Math.round(r.height * dpr * SCALE));
    this.canvas.width = w; this.canvas.height = h;
    if (!this.gl || this.lost) return;
    this.gl.viewport(0, 0, w, h);
    this.gl.uniform2f(this.uRes, w, h);
    if (!this.raf) this.draw(performance.now());
  };

  Waves.prototype.draw = function (now) {
    if (!this.gl || this.lost) return;
    this.gl.uniform1f(this.uTime, (now - this.t0) / 1000 * 0.6);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  };

  Waves.prototype.frame = function (now) {
    this.raf = 0;
    if (!this.running()) return;
    if (now - this.last >= this.frameMs - 1) { this.last = now; this.draw(now); }
    this.raf = requestAnimationFrame(this.loop);
  };

  Waves.prototype.running = function () { return this.heroVisible && !document.hidden && !still() && !this.lost; };
  Waves.prototype.stop = function () { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; };
  Waves.prototype.update = function () {
    if (this.running()) { if (!this.raf) this.raf = requestAnimationFrame(this.loop); }
    else this.stop();
  };

  function boot() { Array.prototype.forEach.call(document.querySelectorAll('[data-waves]'), function (el) { if (!el._migWaves) el._migWaves = new Waves(el); }); }
  // la compilation du shader attend que la page soit peinte (le poster du héros reste l'élément LCP)
  function later() { if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1200 }); else setTimeout(boot, 200); }
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
  document.addEventListener('shopify:section:load', function (e) { if (e.target && e.target.querySelector('[data-waves]')) boot(); });
})();
