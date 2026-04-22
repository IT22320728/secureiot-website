(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var canvas = document.createElement("canvas");
    canvas.className = "bg-3d-canvas";

    var overlay = document.createElement("div");
    overlay.className = "bg-3d-overlay";

    document.body.prepend(overlay);
    document.body.prepend(canvas);

    if (typeof window.THREE === "undefined") {
      startFallback2D(canvas, reduceMotion);
      return;
    }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
      });
    } catch (error) {
      startFallback2D(canvas, reduceMotion);
      return;
    }

    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x050e1b, 0.96);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 120;

    var particleCount = reduceMotion
      ? (width <= 640 ? 220 : 320)
      : (width <= 640 ? 640 : (width <= 980 ? 980 : 1500));
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);
    var baseY = new Float32Array(particleCount);
    var speeds = new Float32Array(particleCount);

    for (var i = 0; i < particleCount; i++) {
      var x = (Math.random() - 0.5) * 260;
      var y = (Math.random() - 0.5) * 160;
      var z = (Math.random() - 0.5) * 260;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      baseY[i] = y;
      speeds[i] = 0.6 + Math.random() * 1.35;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    var pointsMaterial = new THREE.PointsMaterial({
      color: 0x8fd4ff,
      size: width <= 768 ? 1.6 : 1.25,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var points = new THREE.Points(geometry, pointsMaterial);
    scene.add(points);

    var strandDefs = [
      { radius: 28, height: 18, speed: 0.35, color: 0x4fa3ff, opacity: 0.28 },
      { radius: 38, height: 24, speed: -0.28, color: 0x63f0cd, opacity: 0.22 }
    ];

    var strands = strandDefs.map(function (def, strandIndex) {
      var segCount = 170;
      var strandGeometry = new THREE.BufferGeometry();
      var strandPositions = new Float32Array(segCount * 3);
      strandGeometry.setAttribute("position", new THREE.BufferAttribute(strandPositions, 3));

      var strand = new THREE.Line(
        strandGeometry,
        new THREE.LineBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: reduceMotion ? def.opacity * 0.55 : def.opacity
        })
      );

      strand.position.z = -72 - strandIndex * 16;
      scene.add(strand);

      return {
        mesh: strand,
        geometry: strandGeometry,
        def: def,
        segCount: segCount,
        phase: strandIndex * 1.9
      };
    });

    var glowA = new THREE.Mesh(
      new THREE.SphereGeometry(34, 28, 28),
      new THREE.MeshBasicMaterial({ color: 0x2c79ff, transparent: true, opacity: 0.14 })
    );
    glowA.position.set(-52, 18, -90);
    scene.add(glowA);

    var glowB = new THREE.Mesh(
      new THREE.SphereGeometry(30, 28, 28),
      new THREE.MeshBasicMaterial({ color: 0x26d3ad, transparent: true, opacity: 0.12 })
    );
    glowB.position.set(58, -24, -100);
    scene.add(glowB);

    var pointerX = 0;
    var pointerY = 0;
    var smoothX = 0;
    var smoothY = 0;

    function onPointerMove(event) {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    var frameId = 0;
    function animate(time) {
      var t = time * 0.001;
      var arr = geometry.attributes.position.array;
      var motionFactor = reduceMotion ? 0.42 : 1;

      for (var j = 0; j < particleCount; j++) {
        arr[j * 3 + 1] = baseY[j] + Math.sin(t * speeds[j] + j * 0.16) * (3.2 * motionFactor);
      }

      geometry.attributes.position.needsUpdate = true;

      for (var s = 0; s < strands.length; s++) {
        var item = strands[s];
        var strandArr = item.geometry.attributes.position.array;
        for (var k = 0; k < item.segCount; k++) {
          var ratio = k / (item.segCount - 1);
          var angle = ratio * Math.PI * 4 + t * item.def.speed + item.phase;
          var wobble = Math.sin(t * 0.62 + ratio * 7 + item.phase) * 6;

          strandArr[k * 3] = Math.cos(angle) * (item.def.radius + wobble);
          strandArr[k * 3 + 1] = Math.sin(angle * 1.2) * item.def.height;
          strandArr[k * 3 + 2] = -84 + ratio * 168;
        }

        item.geometry.attributes.position.needsUpdate = true;
        item.mesh.rotation.y = t * 0.12 + smoothX * 0.22;
        item.mesh.rotation.x = Math.sin(t * 0.18 + item.phase) * 0.08 + smoothY * 0.08;
      }

      smoothX += (pointerX - smoothX) * 0.035;
      smoothY += (pointerY - smoothY) * 0.035;

      points.rotation.y = t * 0.04 + smoothX * 0.18;
      points.rotation.x = Math.sin(t * 0.23) * 0.04 + smoothY * 0.12;

      glowA.position.x = -52 + Math.sin(t * 0.45) * 9;
      glowA.position.y = 18 + Math.cos(t * 0.4) * 6;
      glowB.position.x = 58 + Math.cos(t * 0.38) * 9;
      glowB.position.y = -24 + Math.sin(t * 0.34) * 6;

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    }

    function onResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      renderer.setSize(width, height, false);
    }

    window.addEventListener("resize", onResize);
    frameId = window.requestAnimationFrame(animate);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        window.cancelAnimationFrame(frameId);
      } else {
        frameId = window.requestAnimationFrame(animate);
      }
    });

    function startFallback2D(targetCanvas, lowMotion) {
      var ctx = targetCanvas.getContext("2d");
      if (!ctx) {
        return;
      }

      var dots = [];
      var dotCount = lowMotion ? 60 : 120;
      var w = window.innerWidth;
      var h = window.innerHeight;

      function resizeFallback() {
        w = window.innerWidth;
        h = window.innerHeight;
        targetCanvas.width = w;
        targetCanvas.height = h;
      }

      resizeFallback();

      for (var d = 0; d < dotCount; d++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * (lowMotion ? 0.2 : 0.45),
          vy: (Math.random() - 0.5) * (lowMotion ? 0.2 : 0.45),
          r: 0.6 + Math.random() * 1.8
        });
      }

      function drawFallback() {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(7, 17, 32, 0.95)";
        ctx.fillRect(0, 0, w, h);

        for (var i = 0; i < dots.length; i++) {
          var dot = dots[i];
          dot.x += dot.vx;
          dot.y += dot.vy;

          if (dot.x < 0 || dot.x > w) dot.vx *= -1;
          if (dot.y < 0 || dot.y > h) dot.vy *= -1;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? "rgba(97, 193, 255, 0.75)" : "rgba(99, 240, 205, 0.72)";
          ctx.fill();
        }

        frameId = window.requestAnimationFrame(drawFallback);
      }

      window.addEventListener("resize", resizeFallback);
      frameId = window.requestAnimationFrame(drawFallback);
    }
  });
})();
