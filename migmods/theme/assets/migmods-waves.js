/* MIGMODS — vagues lumineuses en WebGL (sans dépendance).
   Repris du shader « flowing waves » : lignes en noir et blanc, centre assombri
   pour laisser respirer ce qui est posé dessus. Usage : <div data-waves></div>
   (data-waves-dim="off" pour ne pas assombrir le centre). */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function start(host) {
    var canvas = document.createElement('canvas');
    canvas.className = 'waves__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;                                   // pas de WebGL : le fond noir reste
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'iResolution'), uTime = gl.getUniformLocation(prog, 'iTime');
    gl.uniform1f(gl.getUniformLocation(prog, 'uDim'), host.getAttribute('data-waves-dim') === 'off' ? 0 : 1);
    gl.uniform1f(gl.getUniformLocation(prog, 'uGain'), parseFloat(host.getAttribute('data-waves-gain')) || .8);
    host.appendChild(canvas);

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = 0, h = 0;
    function resize() {
      var r = host.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr)); h = Math.max(1, Math.round(r.height * dpr));
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
    var t0 = performance.now() - 4000, raf = 0, visible = true;
    function frame(now) {
      gl.uniform1f(uTime, (now - t0) / 1000 * .6);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = visible && !reduced ? requestAnimationFrame(frame) : 0;
    }
    resize();
    addEventListener('resize', function () { resize(); if (!raf) frame(performance.now()); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(host);
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible && !raf) raf = requestAnimationFrame(frame); });
    frame(performance.now());
    host.classList.add('is-on');
  }

  document.querySelectorAll('[data-waves]').forEach(start);
})();
