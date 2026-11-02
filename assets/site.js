(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Planet: a sphere of dots, lit from the upper left, turning slowly. */
  function planet(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var N = 1500, pts = [], i;
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var th = golden * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    var tilt = -0.41, ca = Math.cos(tilt), sa = Math.sin(tilt);
    var L = [-0.45, -0.38, 0.81], ln = Math.sqrt(L[0] * L[0] + L[1] * L[1] + L[2] * L[2]);
    L = [L[0] / ln, L[1] / ln, L[2] / ln];
    var t = 0.6, size = 0, dpr = 1, running = false, raf = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      size = Math.max(1, Math.round(rect.width));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#ffffff';
      var R = size * 0.46, cx = size / 2, cy = size / 2;
      var base = R / 23;
      var ct = Math.cos(t), st = Math.sin(t);
      var k, p, x, z, x2, y2, b, rad, a;
      for (k = 0; k < N; k++) {
        p = pts[k];
        x = p[0] * ct + p[2] * st;
        z = -p[0] * st + p[2] * ct;
        x2 = x * ca - p[1] * sa;
        y2 = x * sa + p[1] * ca;
        if (z < 0) {
          ctx.globalAlpha = 0.07;
          ctx.beginPath();
          ctx.arc(cx + x2 * R, cy + y2 * R, base * 0.32, 0, 6.2832);
          ctx.fill();
          continue;
        }
        b = x2 * L[0] + y2 * L[1] + z * L[2];
        if (b < 0) b = 0;
        rad = base * (0.22 + 0.78 * b) * (1 + z * 0.06);
        a = 0.14 + 0.86 * b;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(cx + x2 * R, cy + y2 * R, rad, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      if (!running) return;
      t += 0.0028;
      draw();
      raf = window.requestAnimationFrame(frame);
    }
    function start() { if (reduced || running) return; running = true; raf = window.requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) window.cancelAnimationFrame(raf); raf = 0; }

    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { threshold: 0.05 }).observe(canvas);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  }


  /* Brain: a brain-shaped field of dots; clusters light up like memories being written. */
  function brain(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx || !window.Path2D) return;
    var W = 320, H = 260;
    var outline = new Path2D('M 54 148 C 34 112, 58 70, 100 54 C 140 40, 186 18, 226 36 C 262 52, 296 86, 292 128 C 290 156, 278 174, 258 184 C 274 196, 272 222, 250 230 C 236 236, 222 230, 214 220 L 210 224 C 212 240, 216 250, 222 258 L 206 258 C 198 248, 196 236, 198 224 C 170 230, 128 226, 98 210 C 76 198, 58 178, 54 148 Z');
    var grooves = [new Path2D('M 70 150 C 110 138, 150 118, 200 118'), new Path2D('M 168 42 C 160 70, 158 95, 150 118'), new Path2D('M 240 150 C 236 170, 232 182, 226 196')];
    var pts = [], s = 11, j, i, row = 0, ok, g;
    ctx.lineWidth = 9;
    for (j = 0; j < H; j += s * 0.866, row++) {
      for (i = (row % 2 ? s / 2 : 0); i < W; i += s) {
        if (!ctx.isPointInPath(outline, i, j)) continue;
        ok = true;
        for (g = 0; g < grooves.length; g++) { if (ctx.isPointInStroke(grooves[g], i, j)) { ok = false; break; } }
        if (ok) pts.push([i, j, 0]);
      }
    }
    var pulses = [], scale = 1, dpr = 1, running = false, raf = 0, last = 0;
    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      scale = w / W;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * H / W * dpr);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      draw(0);
    }
    function spawn() {
      var q = pts[Math.floor(Math.random() * pts.length)];
      pulses.push({ x: q[0], y: q[1], t: 0, r: 34 + Math.random() * 16 });
    }
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      var k, p, b, q, d, a;
      for (k = 0; k < pts.length; k++) {
        p = pts[k]; b = 0;
        for (q = 0; q < pulses.length; q++) {
          d = Math.hypot(p[0] - pulses[q].x, p[1] - pulses[q].y);
          if (d < pulses[q].r) {
            a = (1 - d / pulses[q].r) * Math.sin(Math.PI * Math.min(1, pulses[q].t));
            if (a > b) b = a;
          }
        }
        ctx.globalAlpha = 0.3 + 0.7 * b;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3.2 + 1.6 * b, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (q = pulses.length - 1; q >= 0; q--) {
        pulses[q].t += dt / 1400;
        if (pulses[q].t >= 1) pulses.splice(q, 1);
      }
    }
    function frame(ts) {
      if (!running) return;
      var dt = last ? Math.min(50, ts - last) : 16;
      last = ts;
      if (Math.random() < dt / 650) spawn();
      draw(dt);
      raf = window.requestAnimationFrame(frame);
    }
    function start() { if (reduced || running) return; running = true; last = 0; raf = window.requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) window.cancelAnimationFrame(raf); raf = 0; }
    resize();
    if (reduced) { pulses.push({ x: 120, y: 110, t: 0.5, r: 48 }, { x: 230, y: 150, t: 0.5, r: 40 }); draw(0); }
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { threshold: 0.05 }).observe(canvas);
    } else { start(); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  }

  /* Wires: lines from the input chips into the brain and out to the AI chips, drawn to the real layout. */
  function wires(flow) {
    var svg = flow.querySelector('.wires');
    var tile = flow.querySelector('.braintile');
    var ai = flow.querySelector('.ainode');
    var ins = flow.querySelectorAll('.flow-side.in .chip');
    var outs = flow.querySelectorAll('.flow-side.out .chip');
    if (!svg || !tile || !ai || !ins.length || !outs.length) return;
    function curve(a, b, horizontal) {
      if (horizontal) {
        var dx = (b[0] - a[0]) * 0.5;
        return 'M' + a[0] + ' ' + a[1] + ' C ' + (a[0] + dx) + ' ' + a[1] + ', ' + (b[0] - dx) + ' ' + b[1] + ', ' + b[0] + ' ' + b[1];
      }
      var dy = (b[1] - a[1]) * 0.5;
      return 'M' + a[0] + ' ' + a[1] + ' C ' + a[0] + ' ' + (a[1] + dy) + ', ' + b[0] + ' ' + (b[1] - dy) + ', ' + b[0] + ' ' + b[1];
    }
    function draw() {
      var fr = flow.getBoundingClientRect();
      var w = Math.round(fr.width), h = Math.round(fr.height);
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var tr = tile.getBoundingClientRect();
      var horizontal = ins[0].getBoundingClientRect().right <= tr.left + 1;
      /* Anchor on an element's edge: exit side for the source, entry side for the target, shifted along the edge by `off`. */
      function edge(el, which, off) {
        var r = el.getBoundingClientRect();
        var x = r.left - fr.left, y = r.top - fr.top;
        if (horizontal) return which === 'out' ? [x + r.width, y + r.height / 2 + off] : [x, y + r.height / 2 + off];
        return which === 'out' ? [x + r.width / 2 + off, y + r.height] : [x + r.width / 2 + off, y];
      }
      function fan(list, i, step) { return (i - (list.length - 1) / 2) * step; }
      /* In the stacked layout only the first row of output chips gets a wire; the rows below sit under it. */
      var outList = [], i, firstTop = null, t;
      for (i = 0; i < outs.length; i++) {
        t = Math.round(outs[i].getBoundingClientRect().top);
        if (firstTop === null) firstTop = t;
        if (horizontal || t === firstTop) outList.push(outs[i]);
      }
      var paths = [];
      for (i = 0; i < ins.length; i++) paths.push(curve(edge(ins[i], 'out', 0), edge(tile, 'in', fan(ins, i, 36)), horizontal));
      paths.push(curve(edge(tile, 'out', 0), edge(ai, 'in', 0), horizontal));
      for (i = 0; i < outList.length; i++) paths.push(curve(edge(ai, 'out', fan(outList, i, horizontal ? 16 : 36)), edge(outList[i], 'in', 0), horizontal));
      var html = '';
      for (i = 0; i < paths.length; i++) html += '<path class="wire" d="' + paths[i] + '"/>';
      for (i = 0; i < paths.length; i++) html += '<path class="pulse" style="animation-delay:' + (i * 0.3) + 's" d="' + paths[i] + '"/>';
      svg.innerHTML = html;
    }
    draw();
    window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    window.addEventListener('load', draw);
  }

  /* The gap: 100 dots. 76 use AI, 14 of them have it embedded. They appear when the block scrolls into view. */
  function gapDots(grid) {
    var i, dot, html = '';
    for (i = 0; i < 100; i++) {
      html += '<i class="' + (i < 14 ? 'core' : i < 76 ? 'use' : '') + '" style="transition-delay:' + (i * 14) + 'ms"></i>';
    }
    grid.innerHTML = html;
    if (reduced || !('IntersectionObserver' in window)) { grid.classList.add('on'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { grid.classList.add('on'); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(grid);
  }

  /* Resi demo: the conversation is typed, the orb structures it, the record fills in, the doctor signs. Loops while visible. */
  function resiDemo(root) {
    var lines = [
      ['doc', 'What brings you in today?'],
      ['pat', 'Pressure in my chest since Friday. Sometimes it goes to my left arm.'],
      ['doc', 'Are you taking anything for blood pressure?'],
      ['pat', 'I stopped the pills a few months ago.'],
      ['doc', 'Your pressure is 140 over 90. I will order an ECG and troponins.']
    ];
    var fields = [
      ['reason', 'Chest pressure since Friday, radiating to the left arm'],
      ['vitals', 'BP 140/90'],
      ['history', 'Hypertension, off treatment'],
      ['plan', 'ECG. Troponins.']
    ];
    var talk = root.querySelector('.r-lines'), status = root.querySelector('.r-status');
    if (!talk || !status) return;
    var vals = {}, k;
    for (k = 0; k < fields.length; k++) vals[fields[k][0]] = root.querySelector('[data-field="' + fields[k][0] + '"]');
    var timer = 0, active = false, visible = false;
    function later(fn, ms) { timer = window.setTimeout(fn, ms); }
    function setState(s) { root.classList.remove('listening', 'thinking', 'signed'); if (s) root.classList.add(s); }
    function lineRow(who, text) {
      var row = document.createElement('div');
      row.className = 'r-line ' + who;
      row.innerHTML = '<span class="who">' + (who === 'doc' ? 'Doctor' : 'Patient') + '</span><span class="txt"></span>';
      row.lastChild.textContent = text;
      return row;
    }
    function reset() {
      root.classList.remove('fade');
      talk.innerHTML = '';
      for (var f = 0; f < fields.length; f++) { vals[fields[f][0]].textContent = ''; vals[fields[f][0]].parentNode.classList.remove('on'); }
    }
    function typeInto(el, text, speed, done) {
      var i = 0;
      el.classList.add('typing');
      (function tick() {
        if (!active) return;
        i++;
        el.textContent = text.slice(0, i);
        if (i < text.length) later(tick, speed); else { el.classList.remove('typing'); done(); }
      })();
    }
    function sayLine(n) {
      if (!active) return;
      if (n >= lines.length) {
        setState('thinking'); status.textContent = 'Structuring';
        later(function () { fillField(0); }, 1500);
        return;
      }
      var row = lineRow(lines[n][0], '');
      talk.appendChild(row);
      typeInto(row.lastChild, lines[n][1], 26, function () { later(function () { sayLine(n + 1); }, 420); });
    }
    function fillField(n) {
      if (!active) return;
      if (n >= fields.length) {
        setState('signed'); status.textContent = 'Signed';
        later(function () { root.classList.add('fade'); later(start, 600); }, 3600);
        return;
      }
      var el = vals[fields[n][0]];
      el.parentNode.classList.add('on');
      typeInto(el, fields[n][1], 18, function () { later(function () { fillField(n + 1); }, 280); });
    }
    function start() {
      if (!active) return;
      reset();
      setState('listening'); status.textContent = 'Listening';
      later(function () { sayLine(0); }, 500);
    }
    function finalState() {
      reset();
      for (var l = 0; l < lines.length; l++) talk.appendChild(lineRow(lines[l][0], lines[l][1]));
      for (var f = 0; f < fields.length; f++) { vals[fields[f][0]].textContent = fields[f][1]; vals[fields[f][0]].parentNode.classList.add('on'); }
      setState('signed'); status.textContent = 'Signed';
    }
    function play() { if (active) return; active = true; start(); }
    function pause() { active = false; window.clearTimeout(timer); }
    if (reduced) { finalState(); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible = e.isIntersecting; if (visible) play(); else pause(); });
      }, { threshold: 0.25 }).observe(root);
    } else { visible = true; play(); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else if (visible) play(); });
  }

  /* Copy buttons: copy the text in data-copy, fall back to selecting it. */
  function copyButtons() {
    var buttons = document.querySelectorAll('[data-copy]');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var label = btn.textContent;
        function done() { btn.textContent = 'Copied'; window.setTimeout(function () { btn.textContent = label; }, 1600); }
        function fallback() {
          var target = document.getElementById(btn.getAttribute('data-target'));
          if (!target || !window.getSelection) return;
          var range = document.createRange();
          range.selectNodeContents(target);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else {
          fallback();
        }
      });
    });
  }

  /* Current page in the nav. */
  function currentLink() {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var links = document.querySelectorAll('.nav .links a[href]');
    Array.prototype.forEach.call(links, function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase();
      if (href === file) a.setAttribute('aria-current', 'page');
    });
  }

  function init() {
    var c = document.getElementById('planet');
    if (c) planet(c);
    Array.prototype.forEach.call(document.querySelectorAll('canvas.brain'), brain);
    Array.prototype.forEach.call(document.querySelectorAll('[data-flow]'), wires);
    Array.prototype.forEach.call(document.querySelectorAll('[data-dots]'), gapDots);
    Array.prototype.forEach.call(document.querySelectorAll('[data-resi-demo]'), resiDemo);
    copyButtons();
    currentLink();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
