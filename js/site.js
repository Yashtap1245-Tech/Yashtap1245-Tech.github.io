(function () {
  const root = document.documentElement;
  const header = document.getElementById("site-header");
  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("nav-toggle");
  const themeButton = document.getElementById("theme-toggle");
  const themeLabel = themeButton.querySelector(".theme-toggle-label");
  const progress = document.getElementById("scroll-progress");
  const desktopNav = window.matchMedia("(min-width: 861px)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)");
  let lenis = null;

  function setTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    const light = theme === "light";
    themeButton.setAttribute("aria-pressed", String(light));
    themeButton.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    themeLabel.textContent = light ? "Dark" : "Light";
    const color = light ? "#e5eee8" : "#0f1815";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
    if (persist) {
      try { localStorage.setItem("yt-theme", theme); } catch (err) {}
    }
    root.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  setTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark", false);
  themeButton.addEventListener("click", function () {
    setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light", true);
  });

  function closeNav() {
    header.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
    document.body.classList.remove("nav-lock");
    if (!desktopNav.matches) nav.setAttribute("inert", "");
    if (lenis) lenis.start();
  }

  function openNav() {
    header.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "Close";
    nav.removeAttribute("inert");
    document.body.classList.add("nav-lock");
    if (lenis) lenis.stop();
    const first = nav.querySelector("a");
    if (first) first.focus();
  }

  function syncNav() {
    if (desktopNav.matches) {
      header.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
      nav.removeAttribute("inert");
      document.body.classList.remove("nav-lock");
      return;
    }
    if (!header.classList.contains("is-open")) nav.setAttribute("inert", "");
  }

  toggle.addEventListener("click", function () {
    if (header.classList.contains("is-open")) closeNav();
    else openNav();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      closeNav();
      toggle.focus();
    }
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a") && !desktopNav.matches) closeNav();
  });

  desktopNav.addEventListener("change", syncNav);
  syncNav();

  document.body.classList.add("nav-ready");

  const headerOnScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  headerOnScroll();
  window.addEventListener("scroll", headerOnScroll, { passive: true });

  function initCursor() {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || !motionQuery.matches) return;
    const cursor = document.querySelector(".cursor");
    if (!cursor) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;
    let shown = false;
    window.addEventListener("pointermove", function (event) {
      x = event.clientX;
      y = event.clientY;
      if (!shown) {
        shown = true;
        root.classList.add("has-cursor");
        cursor.style.opacity = "1";
      }
    }, { passive: true });
    const hot = "a, button, .project";
    document.querySelectorAll(hot).forEach(function (node) {
      node.addEventListener("pointerenter", function () { cursor.classList.add("is-hot"); });
      node.addEventListener("pointerleave", function () { cursor.classList.remove("is-hot"); });
    });
    const tick = function () {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(tick);
    };
    tick();
  }

  function initMagnetic() {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || !motionQuery.matches || typeof gsap === "undefined") return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
      el.addEventListener("pointermove", function (event) {
        const rect = el.getBoundingClientRect();
        xTo((event.clientX - rect.left - rect.width / 2) * 0.28);
        yTo((event.clientY - rect.top - rect.height / 2) * 0.4);
      });
      el.addEventListener("pointerleave", function () {
        xTo(0);
        yTo(0);
      });
    });
  }

  function initSounding() {
    const canvas = document.getElementById("sounding");
    const hero = document.querySelector(".hero");
    if (!canvas || !hero) return function () {};
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power"
    });
    if (!gl) return function () {};

    const vertSrc = "attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}";
    const fragSrc = [
      "precision mediump float;",
      "uniform vec2 uRes;uniform float uTime;uniform vec2 uPointer;uniform float uLight;",
      "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
      "void main(){",
      "vec2 uv=gl_FragCoord.xy/uRes.xy;",
      "float aspect=uRes.x/max(uRes.y,1.0);",
      "vec2 p=vec2(uv.x*aspect,uv.y);",
      "vec2 ptr=(uPointer-0.5)*0.15;",
      "float t=uTime*0.07;",
      "float n=noise(p*1.7+vec2(t,-t*0.55)+ptr);",
      "float n2=noise(p*3.3+vec2(-t*0.35,t*0.45));",
      "float ridges=sin(uv.y*15.0+n*3.2+t*1.5);",
      "float threads=smoothstep(0.8,1.0,sin(uv.y*50.0+n2*6.5+ridges));",
      "float right=smoothstep(0.12,0.9,uv.x);",
      "float pool=exp(-dot(uv-vec2(0.8,0.46),uv-vec2(0.8,0.46))*5.5);",
      "vec3 col;",
      "if(uLight<0.5){",
      "vec3 deep=vec3(0.059,0.094,0.082);",
      "vec3 lift=vec3(0.12,0.19,0.16);",
      "vec3 brass=vec3(0.89,0.77,0.54);",
      "col=mix(deep,lift,n*0.65+uv.y*0.22);",
      "col+=brass*threads*0.32*right;",
      "col+=vec3(0.15,0.24,0.2)*pool;",
      "}else{",
      "vec3 paper=vec3(0.898,0.933,0.91);",
      "vec3 pine=vec3(0.16,0.29,0.24);",
      "vec3 brass=vec3(0.55,0.35,0.13);",
      "col=paper-n*0.04;",
      "col=mix(col,pine,threads*0.14*right+pool*0.05);",
      "col+=brass*threads*0.07*right;",
      "}",
      "gl_FragColor=vec4(col,1.0);}"
    ].join("");

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vert = compile(gl.VERTEX_SHADER, vertSrc);
    const frag = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) return function () {};
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return function () {};
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uPointer = gl.getUniformLocation(program, "uPointer");
    const uLight = gl.getUniformLocation(program, "uLight");

    let pointer = { x: 0.72, y: 0.48 };
    let target = { x: 0.72, y: 0.48 };
    let light = root.getAttribute("data-theme") === "light" ? 1 : 0;
    let running = true;
    let alive = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      const rect = hero.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const onPointer = function (event) {
      target.x = event.clientX / Math.max(window.innerWidth, 1);
      target.y = 1 - event.clientY / Math.max(window.innerHeight, 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", resize);
    root.addEventListener("themechange", function (event) {
      light = event.detail === "light" ? 1 : 0;
    });

    const observer = new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(hero);

    resize();
    const lightNow = root.getAttribute("data-theme") === "light";
    gl.clearColor(lightNow ? 0.898 : 0.059, lightNow ? 0.933 : 0.094, lightNow ? 0.91 : 0.082, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    root.classList.add("is-live");

    const draw = function (time) {
      if (!alive) return;
      if (running && !document.hidden) {
        pointer.x += (target.x - pointer.x) * 0.04;
        pointer.y += (target.y - pointer.y) * 0.04;
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, time);
        gl.uniform2f(uPointer, pointer.x, pointer.y);
        gl.uniform1f(uLight, light);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    };

    let ticker = null;
    if (typeof gsap !== "undefined") {
      ticker = function (time) { draw(time); };
      gsap.ticker.add(ticker);
    } else {
      const loop = function (now) {
        draw(now / 1000);
        if (alive) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    return function stop() {
      alive = false;
      root.classList.remove("is-live");
      if (ticker && typeof gsap !== "undefined") gsap.ticker.remove(ticker);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }

  function bootMotion() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", function () {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const updateProgress = function () {
        const value = Math.min(1, Math.max(0, window.scrollY / max));
        progress.style.transform = "scaleX(" + value + ")";
      };

      gsap.fromTo(".timeline-fill", { scaleY: 0, transformOrigin: "top center" }, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".timeline-wrap",
          start: "top 75%",
          end: "bottom 70%",
          scrub: 0.7
        }
      });

      gsap.utils.toArray(".job").forEach(function (job) {
        gsap.from(job.querySelector(".job-body"), {
          y: 28,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: job,
            start: "top 84%",
            toggleActions: "play none none none"
          }
        });
      });

      ScrollTrigger.batch(".skill-group, .project, .edu, .about-copy p, .pullquote", {
        start: "top 88%",
        once: true,
        onEnter: function (batch) {
          gsap.from(batch, {
            y: 22,
            opacity: 0,
            duration: 0.75,
            stagger: 0.06,
            ease: "power3.out",
            overwrite: "auto"
          });
        }
      });

      return function () {
        gsap.set(".timeline-fill", { clearProps: "transform" });
        progress.style.transform = "scaleX(0)";
      };
    });

    const onScrollProgress = function () {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      progress.style.transform = "scaleX(" + Math.min(1, window.scrollY / max) + ")";
    };
    if (!motionQuery.matches) {
      onScrollProgress();
      window.addEventListener("scroll", onScrollProgress, { passive: true });
    } else {
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: function (self) {
          progress.style.transform = "scaleX(" + self.progress + ")";
        }
      });
    }

    document.querySelectorAll("section[id]").forEach(function (section) {
      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onToggle: function (self) {
          if (!self.isActive) return;
          document.querySelectorAll(".nav-links a").forEach(function (link) {
            if (link.getAttribute("href") === "#" + section.id) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        }
      });
    });

    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 861px)", function () {
      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        anchors: { offset: -72 }
      });
      lenis.on("scroll", ScrollTrigger.update);
      const ticker = function (time) { lenis.raf(time * 1000); };
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      gsap.to(".hero-portrait", {
        y: -36,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

      const reel = document.getElementById("skills-reel");
      const groups = Array.prototype.map.call(document.querySelectorAll(".skill-group"), function (group) {
        return {
          name: group.querySelector("h3").textContent,
          items: Array.prototype.map.call(group.querySelectorAll("li"), function (item) {
            return item.textContent;
          })
        };
      });
      const reelName = document.getElementById("reel-name");
      const reelItems = document.getElementById("reel-items");
      const reelTicks = document.getElementById("reel-ticks");
      groups.forEach(function () {
        const tick = document.createElement("span");
        reelTicks.appendChild(tick);
      });

      let current = -1;
      function renderGroup(index) {
        if (index === current) return;
        current = index;
        reelName.textContent = groups[index].name;
        reelItems.replaceChildren();
        groups[index].items.forEach(function (name) {
          const li = document.createElement("li");
          li.textContent = name;
          reelItems.appendChild(li);
        });
        Array.prototype.forEach.call(reelTicks.children, function (tick, tickIndex) {
          tick.classList.toggle("is-on", tickIndex <= index);
        });
        gsap.fromTo(reelItems.children, { y: 10, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.35,
          stagger: 0.025,
          overwrite: "auto",
          ease: "power2.out"
        });
      }

      reel.hidden = false;
      renderGroup(0);
      ScrollTrigger.create({
        trigger: reel,
        start: "top top",
        end: "bottom bottom",
        pin: ".skills-reel-sticky",
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          const index = Math.round(self.progress * (groups.length - 1));
          renderGroup(index);
        }
      });

      const stopShader = initSounding();

      document.querySelectorAll(".project").forEach(function (card) {
        const xTo = gsap.quickTo(card, "rotateY", { duration: 0.45, ease: "power3.out" });
        const yTo = gsap.quickTo(card, "rotateX", { duration: 0.45, ease: "power3.out" });
        card.addEventListener("pointermove", onMove);
        card.addEventListener("pointerleave", onLeave);
        function onMove(event) {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          card.style.setProperty("--mx", (px * 100) + "%");
          card.style.setProperty("--my", (py * 100) + "%");
          xTo((px - 0.5) * 7);
          yTo((0.5 - py) * 6);
        }
        function onLeave() {
          xTo(0);
          yTo(0);
        }
        card._tiltOff = function () {
          card.removeEventListener("pointermove", onMove);
          card.removeEventListener("pointerleave", onLeave);
        };
      });

      return function () {
        if (lenis) {
          lenis.destroy();
          lenis = null;
        }
        gsap.ticker.remove(ticker);
        reel.hidden = true;
        reelTicks.replaceChildren();
        current = -1;
        if (stopShader) stopShader();
        document.querySelectorAll(".project").forEach(function (card) {
          if (card._tiltOff) card._tiltOff();
          gsap.set(card, { clearProps: "transform" });
        });
        gsap.set(".hero-portrait", { clearProps: "transform" });
      };
    });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  initCursor();
  initMagnetic();
  bootMotion();

  if (!motionQuery.matches) {
    const maxScroll = function () {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      progress.style.transform = "scaleX(" + Math.min(1, window.scrollY / max) + ")";
    };
    maxScroll();
    window.addEventListener("scroll", maxScroll, { passive: true });
  }
})();
