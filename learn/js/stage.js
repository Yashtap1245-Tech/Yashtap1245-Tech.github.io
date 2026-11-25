/* Isometric stage: cubes, links, and packets that travel. GSAP drives the timeline. */
(function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  const TONES = {
    sand: ["#f7ecd4", "#e7d3a4", "#c9ae78"],
    amber: ["#f6d7a4", "#e4b56a", "#c48a3a"],
    green: ["#d7efe2", "#8fbfa4", "#3f7d5c"],
    blue: ["#d7e8f1", "#9ec4d6", "#5d8ea3"],
    violet: ["#e6def4", "#c4b4e2", "#8c78b4"],
    red: ["#f8ddd8", "#e7a49c", "#c46d64"],
    ink: ["#2a3832", "#1c2b25", "#101815"]
  };
  const DETAILS = {
    browser: "The browser has a name. It still needs an address.",
    resolver: "The recursive resolver walks the DNS tree. Your browser usually asks only this one machine.",
    root: "A root server does not know example.com. It points at the .com servers.",
    tld: "The .com servers point at the domain's own name servers.",
    auth: "Only the authoritative server returns the address.",
    client: "The browser picks a temporary port and a starting sequence number.",
    server: "The server listens on port 443 and answers with its own sequence number.",
    observer: "This machine is on the path. TCP lets it read. TLS is what stops that.",
    leaf: "The leaf certificate names the site and holds the server's public key.",
    intermediate: "The intermediate signs the leaf. Its own certificate is signed by a root.",
    rootca: "The root is trusted because it is already in the browser, not because the server sent it.",
    alice: "Alice keeps her private key. She sends only the public key.",
    bob: "Bob does the same. Both can then compute one shared secret."
  };

  let current = null;
  const offsets = {};

  function svgEl(tag, attrs) {
    const node = document.createElementNS(SVGNS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        node.setAttribute(key, attrs[key]);
      });
    }
    return node;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  const VW = 1200;
  const VH = 680;
  let mapper = function () { return { x: VW / 2, y: VH / 2 }; };

  function makeMapper(nodes) {
    const list = nodes && nodes.length ? nodes : [{ gx: 0, gy: 0 }];
    const xs = list.map(function (node) { return node.gx; });
    const ys = list.map(function (node) { return node.gy; });
    const minX = Math.min.apply(null, xs);
    const maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys);
    const maxY = Math.max.apply(null, ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    return function (gx, gy) {
      const u = (gx - minX) / spanX;
      const v = (gy - minY) / spanY;
      return { x: 200 + u * 800, y: 210 + v * 250 };
    };
  }

  function posOf(node) {
    const p = mapper(node.gx, node.gy);
    const extra = offsets[node.id] || { x: 0, y: 0 };
    return { x: p.x + extra.x, y: p.y + extra.y };
  }

  function curve(a, b) {
    const mx = (a.x + b.x) / 2;
    const my = Math.min(a.y, b.y) - 70;
    return "M " + a.x.toFixed(1) + " " + a.y.toFixed(1) + " Q " + mx.toFixed(1) + " " + my.toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
  }

  function kill() {
    if (current && current.tween) current.tween.kill();
    current = null;
  }

  function stroke(node) {
    node.setAttribute("stroke", "#2a241c");
    node.setAttribute("stroke-width", "1.75");
    node.setAttribute("stroke-linejoin", "round");
    node.setAttribute("stroke-linecap", "round");
    node.setAttribute("vector-effect", "non-scaling-stroke");
  }

  function face(g, d, fill) {
    const path = svgEl("path", { d: d, fill: fill });
    stroke(path);
    g.append(path);
    return path;
  }

  function iso(x, y, z) {
    return [(x - y) * 0.92, (x + y) * 0.46 - z];
  }

  function poly(pts) {
    return pts.map(function (p, i) {
      return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
    }).join(" ") + " Z";
  }

  function drawGrid(svg) {
    const g = svgEl("g", { "aria-hidden": "true" });
    for (let i = -8; i <= 22; i += 1) {
      const a = iso(-520 + i * 56, -360, 0);
      const b = iso(-520 + i * 56, 520, 0);
      const c = iso(-640, -300 + i * 56, 0);
      const d = iso(760, -300 + i * 56, 0);
      [ [a, b], [c, d] ].forEach(function (pair) {
        const path = svgEl("path", {
          d: "M " + (600 + pair[0][0]) + " " + (430 + pair[0][1]) + " L " + (600 + pair[1][0]) + " " + (430 + pair[1][1]),
          fill: "none",
          stroke: "#e6dccb",
          "stroke-width": "1",
          "vector-effect": "non-scaling-stroke"
        });
        g.append(path);
      });
    }
    svg.append(g);
  }

  function icon(g, mark) {
    const key = (mark || "").toLowerCase();
    if (key.indexOf("dns") >= 0 || key === ".") {
      const c = svgEl("circle", { cx: 0, cy: -6, r: 16, fill: "none" });
      stroke(c);
      g.append(c);
      const h = svgEl("path", { d: "M -16 -6 H 16 M 0 -22 V 10", fill: "none" });
      stroke(h);
      g.append(h);
      return;
    }
    if (key.indexOf("443") >= 0 || key === "1.3" || key === "1.2" || key === "lock") {
      const body = svgEl("rect", { x: -12, y: -4, width: 24, height: 18, rx: 3, fill: "#2a241c" });
      g.append(body);
      const shackle = svgEl("path", { d: "M -7 -4 V -12 a 7 7 0 0 1 14 0 V -4", fill: "none" });
      stroke(shackle);
      g.append(shackle);
      return;
    }
    const disc = svgEl("circle", { cx: 0, cy: -4, r: 15, fill: "rgba(42,36,28,0.12)" });
    stroke(disc);
    g.append(disc);
    const label = svgEl("text", { x: 0, y: 1, "text-anchor": "middle", class: "face-mark" });
    label.textContent = (mark || "").slice(0, 3);
    g.append(label);
  }

  function drawServer(g, node) {
    const tone = TONES[node.tone] || TONES.sand;
    g.append(svgEl("ellipse", { cx: 0, cy: 86, rx: 78, ry: 18, fill: "rgba(70,48,24,0.10)" }));
    if (node.hot) g.append(svgEl("ellipse", { cx: 0, cy: 86, rx: 86, ry: 20, fill: "rgba(63,160,96,0.28)" }));
    const w = 86;
    const h = 40;
    const depth = 46;
    face(g, "M " + (-w) + " 0 L 0 " + h + " L 0 " + (h + depth) + " L " + (-w) + " " + depth + " Z", tone[2]);
    face(g, "M " + w + " 0 L 0 " + h + " L 0 " + (h + depth) + " L " + w + " " + depth + " Z", tone[1]);
    face(g, "M 0 " + (-h) + " L " + w + " 0 L 0 " + h + " L " + (-w) + " 0 Z", tone[0]);
    icon(g, node.mark);
  }

  function drawBox(g, w, h, depth, tone, dy) {
    const y = dy || 0;
    face(g, "M " + (-w) + " " + y + " L 0 " + (y + h) + " L 0 " + (y + h + depth) + " L " + (-w) + " " + (y + depth) + " Z", tone[2]);
    face(g, "M " + w + " " + y + " L 0 " + (y + h) + " L 0 " + (y + h + depth) + " L " + w + " " + (y + depth) + " Z", tone[1]);
    face(g, "M 0 " + (y - h) + " L " + w + " " + y + " L 0 " + (y + h) + " L " + (-w) + " " + y + " Z", tone[0]);
  }

  function drawLaptop(g) {
    g.append(svgEl("ellipse", { cx: 8, cy: 118, rx: 130, ry: 22, fill: "rgba(70,48,24,0.12)" }));
    drawBox(g, 78, 32, 110, ["#f4f0e8", "#3a414a", "#22262c"], -18);
    face(g, "M 64 -4 L 14 16 L 14 96 L 64 76 Z", "#f7f4ee");
    const lines = svgEl("path", {
      d: "M 24 30 H 54 M 24 44 H 46",
      fill: "none",
      stroke: "#d5cbbd",
      "stroke-width": "2.2",
      "vector-effect": "non-scaling-stroke"
    });
    g.append(lines);
    drawBox(g, 112, 44, 18, ["#f6ead2", "#e4d0aa", "#c9b48e"], 72);
    const keys = svgEl("path", {
      d: "M -50 90 H 58 M -44 100 H 48",
      fill: "none",
      stroke: "#b7a488",
      "stroke-width": "1.7",
      "vector-effect": "non-scaling-stroke"
    });
    g.append(keys);
  }

  function addDevice(node) {
    const g = svgEl("g", {
      class: "cube" + (node.dim ? " is-dim" : "") + (node.hot ? " is-hot" : ""),
      tabindex: "0",
      role: "button"
    });
    g.dataset.id = node.id;
    const kind = (node.id === "browser" || node.id === "client") ? "laptop" : "cube";
    if (kind === "laptop") drawLaptop(g);
    else drawServer(g, node);
    g.setAttribute("aria-label", node.label + ". " + (DETAILS[node.id] || node.sub || "Show this machine"));
    return g;
  }

  function mountIso(root, scene, hooks) {
    mapper = makeMapper(scene.nodes || []);
    const wrap = el("div", "iso-wrap");
    const chips = el("div", "vchips");
    (scene.chips || []).forEach(function (chip) {
      const card = el("div", "vchip" + (chip.hot ? " is-hot" : ""));
      card.append(el("span", "", chip.k), el("b", "", chip.v));
      chips.append(card);
    });
    const frame = el("div", "iso-frame");
    const svg = svgEl("svg", {
      class: "iso-svg",
      viewBox: "0 0 " + VW + " " + VH,
      preserveAspectRatio: "xMidYMid meet"
    });
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", scene.caption || "Diagram");
    drawGrid(svg);
    const points = {};
    const linkEls = {};
    const linkLabels = [];
    (scene.links || []).forEach(function (link) {
      const path = svgEl("path", {
        class: "iso-link iso-link-" + (link.style || "solid"),
        d: "M0 0",
        fill: "none",
        "vector-effect": "non-scaling-stroke"
      });
      path.dataset.from = link.from;
      path.dataset.to = link.to;
      svg.append(path);
      linkEls[link.from + ">" + link.to] = path;
    });
    const labels = el("div", "iso-labels");
    const nodeEls = {};
    const nameEls = {};
    (scene.nodes || []).forEach(function (node) {
      const g = addDevice(node);
      nodeEls[node.id] = g;
      svg.append(g);
      const name = el("p", "iso-name");
      name.textContent = node.label;
      labels.append(name);
      nameEls[node.id] = name;
      if (node.sub && node.hot) {
        name.textContent = node.label;
      }
      function show() {
        if (hooks.onDetail) hooks.onDetail(node.label + " — " + (DETAILS[node.id] || node.sub || "Show this machine."));
      }
      g.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        g.setPointerCapture(event.pointerId);
        const id = node.id;
        const start = {
          x: event.clientX,
          y: event.clientY,
          ox: (offsets[id] || { x: 0 }).x,
          oy: (offsets[id] || { y: 0 }).y
        };
        let moved = false;
        function move(ev) {
          const rect = svg.getBoundingClientRect();
          const sx = VW / Math.max(1, rect.width);
          const sy = VH / Math.max(1, rect.height);
          const dx = (ev.clientX - start.x) * sx;
          const dy = (ev.clientY - start.y) * sy;
          if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
          offsets[id] = { x: start.ox + dx, y: start.oy + dy };
          layoutNodes();
        }
        function up() {
          g.removeEventListener("pointermove", move);
          g.removeEventListener("pointerup", up);
          if (!moved) show();
        }
        g.addEventListener("pointermove", move);
        g.addEventListener("pointerup", up);
      });
      g.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          show();
        }
      });
    });

    const pktLayer = svgEl("g");
    svg.append(pktLayer);
    const packets = (scene.packets || []).map(function (spec) {
      const g = svgEl("g", { class: "pkt pkt-" + (spec.kind || "req") });
      const circle = svgEl("circle", { r: "11" });
      stroke(circle);
      g.append(circle);
      g.setAttribute("opacity", "0");
      pktLayer.append(g);
      const tag = el("span", "pkt-float pkt-float-" + (spec.kind || "req"));
      tag.textContent = spec.label || "";
      if (!spec.label) tag.hidden = true;
      labels.append(tag);
      return { spec: spec, el: g, tag: tag };
    });

    frame.append(svg, labels);
    wrap.append(chips, frame);
    const legend = el("p", "vlegend");
    legend.append(el("i", "swatch swatch-req"), document.createTextNode(" request "));
    legend.append(el("i", "swatch swatch-res"), document.createTextNode(" response "));
    legend.append(el("i", "swatch swatch-bad"), document.createTextNode(" lost"));
    wrap.append(legend);
    root.replaceChildren(wrap);

    function put(elm, x, y) {
      elm.style.left = (x / VW * 100) + "%";
      elm.style.top = (y / VH * 100) + "%";
    }

    function layoutNodes() {
      (scene.nodes || []).forEach(function (node) {
        points[node.id] = posOf(node);
        const g = nodeEls[node.id];
        const point = points[node.id];
        if (g) g.setAttribute("transform", "translate(" + point.x.toFixed(1) + " " + point.y.toFixed(1) + ")");
        const drop = (node.id === "browser" || node.id === "client") ? 158 : 112;
        if (nameEls[node.id]) put(nameEls[node.id], point.x, point.y + drop);
        if (nameEls[node.id + "-sub"]) put(nameEls[node.id + "-sub"], point.x, point.y + drop + 22);
      });
      (scene.links || []).forEach(function (link) {
        const path = linkEls[link.from + ">" + link.to];
        const a = points[link.from];
        const b = points[link.to];
        if (path && a && b) path.setAttribute("d", curve(a, b));
        if (link.label && path) {
          let text = linkLabels.find(function (item) { return item.link === link; });
          if (!text) {
            text = { link: link, el: el("span", "link-float") };
            text.el.textContent = link.label;
            labels.append(text.el);
            linkLabels.push(text);
          }
        }
      });
      linkLabels.forEach(function (item) {
        const path = linkEls[item.link.from + ">" + item.link.to];
        if (!path) return;
        const len = path.getTotalLength();
        if (!len) return;
        const mid = path.getPointAtLength(len * 0.5);
        put(item.el, mid.x, mid.y - 18);
      });
      drawPackets();
    }

    function ease(u) {
      return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    }

    const clock = { t: 0 };
    function place(packet, u) {
      const path = linkEls[packet.spec.from + ">" + packet.spec.to];
      if (!path) return;
      const len = path.getTotalLength();
      if (!len) return;
      const clamped = Math.max(0, Math.min(1, u));
      const point = path.getPointAtLength(len * ease(clamped));
      packet.el.setAttribute("transform", "translate(" + point.x.toFixed(1) + " " + point.y.toFixed(1) + ")");
      packet.el.setAttribute("opacity", "1");
      put(packet.tag, point.x, point.y - 28);
      packet.tag.style.opacity = "1";
      if (packet.spec.drop && clamped >= 0.62) {
        packet.el.classList.add("is-dropped");
        packet.tag.textContent = "lost";
      } else {
        packet.el.classList.remove("is-dropped");
        packet.tag.textContent = packet.spec.label || "";
      }
    }
    function drawPackets() {
      packets.forEach(function (packet) {
        const t0 = packet.spec.t0;
        const t1 = packet.spec.t1;
        const u = (clock.t - t0) / Math.max(0.001, t1 - t0);
        if (u < 0 || (u > 1 && packet.spec.hideAfter)) {
          packet.el.setAttribute("opacity", "0");
          packet.tag.style.opacity = "0";
          return;
        }
        place(packet, u > 1 ? 1 : u);
      });
    }

    layoutNodes();
    let tween = null;
    if (window.gsap && packets.length && !reduced()) {
      tween = gsap.to(clock, {
        t: 1,
        duration: scene.loop ? 3.4 : 2.8,
        ease: "none",
        repeat: scene.loop ? -1 : 0,
        onUpdate: drawPackets
      });
      gsap.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power1.out" });
    } else {
      clock.t = 1;
      drawPackets();
    }

    current = {
      tween: tween,
      replay: function () {
        clock.t = 0;
        drawPackets();
        if (tween) tween.restart();
      },
      pause: function () {
        if (!tween) return false;
        if (tween.paused()) tween.play();
        else tween.pause();
        return tween.paused();
      },
      scrub: function (progress) {
        const p = Math.max(0, Math.min(1, progress));
        if (tween) {
          tween.pause();
          tween.progress(p);
        }
        clock.t = p;
        drawPackets();
      }
    };
    const capIso = document.getElementById("diagram-caption");
    if (capIso) capIso.textContent = scene.caption || "";
    if (hooks.onReady) hooks.onReady(current);
    return current;
  }


  function mountBits(root, scene) {
    const wrap = el("div", "bit-stage");
    const head = el("div", "bit-head");
    head.append(el("p", "bit-count", scene.count || "Type to see the bits flip"));
    wrap.append(head);
    (scene.rows || []).forEach(function (row) {
      const block = el("div", "bit-row");
      block.append(el("p", "bit-word", row.label));
      const grid = el("div", "bit-grid");
      (row.bits || []).forEach(function (bit, index) {
        const cell = el("span", "bit" + (bit ? " is-on" : "") + (row.diff && row.diff[index] ? " is-diff" : ""));
        cell.title = bit ? "1" : "0";
        grid.append(cell);
      });
      block.append(grid);
      wrap.append(block);
    });
    if (scene.note) wrap.append(el("p", "bit-note", scene.note));
    root.replaceChildren(wrap);
    const capBits = document.getElementById("diagram-caption");
    if (capBits) capBits.textContent = scene.caption || "";
    if (window.gsap && !reduced()) {
      gsap.from(wrap.querySelectorAll(".bit.is-diff"), {
        opacity: 0,
        duration: 0.25,
        stagger: 0.003,
        ease: "power1.out"
      });
    }
    current = { replay: function () {}, pause: function () { return false; }, scrub: function () {} };
    return current;
  }

  function mountBlocks(root, scene) {
    const wrap = el("div", "block-stage");
    wrap.append(el("p", "block-kicker", scene.kicker || ""));
    const row = el("div", "block-row");
    (scene.blocks || []).forEach(function (block) {
      const card = el("div", "plain-block" + (block.bad ? " is-bad" : "") + (block.locked ? " is-locked" : ""));
      card.append(el("span", "", block.text));
      row.append(card);
    });
    wrap.append(row);
    if (scene.banner) wrap.append(el("p", "block-banner" + (scene.bad ? " is-bad" : ""), scene.banner));
    root.replaceChildren(wrap);
    const capBlocks = document.getElementById("diagram-caption");
    if (capBlocks) capBlocks.textContent = scene.caption || "";
    if (window.gsap && !reduced()) {
      gsap.from(row.children, { opacity: 0, duration: 0.35, stagger: 0.06, ease: "power1.out" });
    }
    current = {
      replay: function () {
        if (window.gsap && !reduced()) {
          gsap.fromTo(row.children, { opacity: 0.2 }, { opacity: 1, duration: 0.35, stagger: 0.05 });
        }
      },
      pause: function () { return false; },
      scrub: function () {}
    };
    return current;
  }

  function bitsOf(bytes) {
    const bits = [];
    bytes.forEach(function (byte) {
      for (let i = 7; i >= 0; i -= 1) bits.push((byte >> i) & 1);
    });
    return bits;
  }

  async function digest(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return new Uint8Array(buf);
  }

  function hostLabel(state) {
    const host = (state && state.host) || "example.com";
    return host.length > 18 ? host.slice(0, 18) : host;
  }

  function dnsScene(frame, state) {
    const host = hostLabel(state);
    const hit = state && state.cache === "hit" && frame !== "parse";
    const nodes = [
      { id: "browser", gx: 0, gy: 1.1, label: "Browser", mark: "you", tone: "sand", hot: true },
      { id: "resolver", gx: 2.15, gy: 0.15, label: "Resolver", mark: "DNS", tone: "amber" },
      { id: "root", gx: 4.15, gy: -0.7, label: "Root", mark: ".", tone: "violet", sub: "the dot" },
      { id: "tld", gx: 4.35, gy: 1.35, label: ".com", mark: "TLD", tone: "blue" },
      { id: "auth", gx: 2.2, gy: 2.35, label: host, mark: "A", tone: "green" }
    ];
    if (hit) {
      return {
        caption: "Cache hit. The lookup stops on this machine. Nothing is asked of the resolver.",
        chips: [{ k: "Cache", v: "hit", hot: true }, { k: "Sent", v: "0" }],
        nodes: [
          { id: "browser", gx: 0.4, gy: 1.2, label: "Browser", mark: "you", tone: "sand", hot: true },
          { id: "resolver", gx: 2.6, gy: 0.6, label: "Cache", mark: "TTL", tone: "green", hot: true, sub: host }
        ],
        links: [{ from: "browser", to: "resolver", style: "solid", label: "fresh answer" }],
        packets: [{ from: "resolver", to: "browser", kind: "res", label: host, t0: 0.05, t1: 0.7 }]
      };
    }
    const dim = function (ids) {
      nodes.forEach(function (node) {
        node.dim = ids.indexOf(node.id) === -1;
        node.hot = ids[ids.length - 1] === node.id || (ids.length === 1 && ids[0] === node.id);
      });
    };
    const links = [];
    const packets = [];
    const chips = [{ k: "Name", v: host }];
    if (frame === "parse") {
      dim(["browser"]);
      chips.push({ k: "Sent", v: "0", hot: true });
    } else if (frame === "cache") {
      dim(["browser"]);
      chips.push({ k: "Cache", v: "miss", hot: true });
    } else if (frame === "resolver") {
      dim(["browser", "resolver"]);
      links.push({ from: "browser", to: "resolver", style: "solid" });
      packets.push({ from: "browser", to: "resolver", kind: "req", label: host + "?", t0: 0.05, t1: 0.85 });
      chips.push({ k: "Port", v: "53" });
    } else if (frame === "root") {
      dim(["resolver", "root"]);
      links.push({ from: "resolver", to: "root", style: "solid" });
      packets.push({ from: "resolver", to: "root", kind: "req", label: "who is .com?", t0: 0.02, t1: 0.48 });
      packets.push({ from: "root", to: "resolver", kind: "res", label: "referral", t0: 0.52, t1: 0.95 });
    } else if (frame === "tld") {
      dim(["resolver", "tld"]);
      links.push({ from: "resolver", to: "tld", style: "solid" });
      packets.push({ from: "resolver", to: "tld", kind: "req", label: "who is " + host + "?", t0: 0.02, t1: 0.48 });
      packets.push({ from: "tld", to: "resolver", kind: "res", label: "referral", t0: 0.52, t1: 0.95 });
    } else if (frame === "auth") {
      dim(["resolver", "auth"]);
      links.push({ from: "resolver", to: "auth", style: "solid" });
      packets.push({ from: "resolver", to: "auth", kind: "req", label: "A?", t0: 0.02, t1: 0.45 });
      packets.push({ from: "auth", to: "resolver", kind: "res", label: "203.0.113.10", t0: 0.5, t1: 0.95 });
      chips.push({ k: "TTL", v: "300 s", hot: true });
    } else if (frame === "answer") {
      dim(["resolver", "browser"]);
      links.push({ from: "resolver", to: "browser", style: "solid", label: "cached for TTL" });
      packets.push({ from: "resolver", to: "browser", kind: "res", label: "203.0.113.10", t0: 0.08, t1: 0.8 });
    } else {
      nodes.forEach(function (node) { node.dim = false; node.hot = false; });
      nodes[0].hot = true;
      links.push(
        { from: "browser", to: "resolver", style: "solid" },
        { from: "resolver", to: "root", style: "dashed" },
        { from: "resolver", to: "tld", style: "dashed" },
        { from: "resolver", to: "auth", style: "solid" }
      );
      packets.push({ from: "browser", to: "resolver", kind: "req", label: host, t0: 0.02, t1: 0.28 });
      packets.push({ from: "resolver", to: "auth", kind: "req", label: "A?", t0: 0.32, t1: 0.58 });
      packets.push({ from: "auth", to: "resolver", kind: "res", label: "address", t0: 0.6, t1: 0.82 });
    }
    const captions = {
      parse: "Nothing has been sent. The browser only parsed the URL.",
      cache: "Nearby caches miss. Flip the control to see a hit stop the lookup.",
      resolver: "One query leaves the machine, for the resolver to walk the tree.",
      root: "The resolver asks a root server and gets a referral, not the address.",
      tld: "The resolver asks .com and is pointed at the domain's own servers.",
      auth: "The authoritative server returns the address and a TTL.",
      answer: "The address comes back to the browser. The page has not been fetched.",
      recap: "Name, resolver, referrals, address. Drag a cube. The links follow."
    };
    return { caption: captions[frame] || captions.recap, chips: chips, nodes: nodes, links: links, packets: packets };
  }

  function tcpScene(frame, state) {
    const drop = Boolean(state && state.drop);
    const nodes = [
      { id: "client", gx: 0.2, gy: 1.4, label: "Browser", mark: "you", tone: "sand", hot: true },
      { id: "server", gx: 3.3, gy: 0.3, label: "Server", mark: ":443", tone: "blue", hot: true }
    ];
    const link = [{ from: "client", to: "server", style: "solid" }];
    let packets = [];
    let chips = [{ k: "Tuple", v: "…:51422 → :443" }];
    let caption = "";
    if (frame === "layers") {
      return {
        kind: "blocks",
        kicker: "One payload, four wrappers. Routers read the IP wrapper.",
        blocks: [
          { text: "Link" },
          { text: "IP" },
          { text: "TCP", locked: true },
          { text: "HTTP" }
        ],
        banner: "The HTTP bytes sit in the middle. Each hop rebuilds only the link frame.",
        caption: "Four wrappers. The highlighted idea is the TCP header: ports and sequence numbers."
      };
    }
    if (frame === "ports") {
      chips = [
        { k: "Source", v: "203.0.113.8:51422", hot: true },
        { k: "Dest", v: "203.0.113.10:443" }
      ];
      caption = "The address finds the machine. The port finds the program. Together they name this conversation.";
      packets = [];
    } else if (frame === "syn") {
      packets = [{ from: "client", to: "server", kind: "req", label: "SYN 1000", t0: 0.08, t1: 0.8 }];
      chips = [{ k: "Seq", v: "1000", hot: true }];
      caption = "SYN carries the browser's starting number. 1000 stands in for a random one.";
    } else if (frame === "synack") {
      packets = [
        { from: "client", to: "server", kind: "req", label: "SYN 1000", t0: 0.02, t1: 0.32, hideAfter: true },
        { from: "server", to: "client", kind: "res", label: "SYN-ACK 5000", t0: 0.4, t1: 0.92 }
      ];
      chips = [{ k: "Ack", v: "1001", hot: true }, { k: "Seq", v: "5000" }];
      caption = "The server sends its own number and a receipt: the next byte it expects is 1001.";
    } else if (frame === "ack") {
      packets = [
        { from: "server", to: "client", kind: "res", label: "SYN-ACK", t0: 0.02, t1: 0.28, hideAfter: true },
        { from: "client", to: "server", kind: "req", label: "ACK 5001", t0: 0.38, t1: 0.88 }
      ];
      chips = [{ k: "State", v: "open", hot: true }];
      caption = "The third step is a receipt. The HTTP request has not been sent yet.";
    } else if (frame === "loss") {
      if (drop) {
        packets = [
          { from: "client", to: "server", kind: "bad", label: "seq 1001", t0: 0.02, t1: 0.62, drop: true },
          { from: "client", to: "server", kind: "req", label: "retransmit", t0: 0.55, t1: 0.78 },
          { from: "server", to: "client", kind: "res", label: "ACK 1101", t0: 0.8, t1: 0.98 }
        ];
        chips = [{ k: "Lost", v: "1", hot: true }, { k: "Resent", v: "yes" }];
        caption = "The copy was kept. Drop is on, so the first segment dies and a second copy arrives.";
      } else {
        packets = [
          { from: "client", to: "server", kind: "req", label: "100 bytes", t0: 0.05, t1: 0.48 },
          { from: "server", to: "client", kind: "res", label: "ACK 1101", t0: 0.55, t1: 0.92 }
        ];
        chips = [{ k: "Lost", v: "0" }, { k: "Ack", v: "1101", hot: true }];
        caption = "Turn on Drop a segment. The same bytes will fail, then be sent again.";
      }
    } else if (frame === "close") {
      packets = [
        { from: "client", to: "server", kind: "req", label: "FIN 1101", t0: 0.02, t1: 0.28 },
        { from: "server", to: "client", kind: "res", label: "ACK 1102", t0: 0.32, t1: 0.5 },
        { from: "server", to: "client", kind: "res", label: "FIN 5001", t0: 0.52, t1: 0.72 },
        { from: "client", to: "server", kind: "req", label: "ACK 5002", t0: 0.76, t1: 0.96 }
      ];
      chips = [{ k: "Close", v: "4 steps", hot: true }];
      caption = "Each FIN gets a receipt. The side that started the close waits in TIME-WAIT.";
    } else {
      packets = [
        { from: "client", to: "server", kind: "req", label: "SYN", t0: 0.02, t1: 0.22 },
        { from: "server", to: "client", kind: "res", label: "SYN-ACK", t0: 0.26, t1: 0.46 },
        { from: "client", to: "server", kind: "req", label: "ACK", t0: 0.5, t1: 0.68 },
        { from: "client", to: "server", kind: "req", label: "data", t0: 0.72, t1: 0.9 }
      ];
      caption = "Reliable delivery. Still readable by anyone on the path. Drag either cube.";
    }
    return { caption: caption, chips: chips, nodes: nodes, links: link, packets: packets };
  }

  function tlsScene(frame, state) {
    const v13 = !state || state.version !== "1.2";
    const nodes = [
      { id: "browser", gx: 0.15, gy: 1.5, label: "Browser", mark: "you", tone: "sand", hot: true },
      { id: "observer", gx: 1.9, gy: 1.7, label: "On the path", mark: "see", tone: "red", dim: v13 && frame !== "shared" },
      { id: "server", gx: 3.5, gy: 0.2, label: "Server", mark: v13 ? "1.3" : "1.2", tone: "blue", hot: true }
    ];
    const links = [{ from: "browser", to: "server", style: "solid" }];
    let packets = [];
    let chips = [{ k: "TLS", v: v13 ? "1.3" : "1.2", hot: true }];
    let caption = "";
    if (frame === "shared") {
      nodes[1].dim = false;
      nodes[1].hot = true;
      packets = [{ from: "browser", to: "server", kind: "req", label: "GET /docs", t0: 0.1, t1: 0.85 }];
      chips = [{ k: "Private", v: "no", hot: true }];
      caption = "TCP delivers the bytes. The machine in the middle can read them.";
    } else if (frame === "clienthello") {
      packets = [{ from: "browser", to: "server", kind: "req", label: "ClientHello", t0: 0.08, t1: 0.8 }];
      chips.push({ k: "SNI", v: "visible" });
      caption = "ClientHello offers a key share and the site name. That name is still readable.";
    } else if (frame === "serverhello") {
      packets = [
        { from: "browser", to: "server", kind: "req", label: "key share", t0: 0.02, t1: 0.4 },
        { from: "server", to: "browser", kind: "res", label: "key share", t0: 0.48, t1: 0.9 }
      ];
      chips.push({ k: "Secret", v: "derived", hot: true });
      caption = "Both public shares cross. The private halves never do. Both sides now share a secret.";
    } else if (frame === "cert" || frame === "tls12") {
      const open = !v13 || frame === "tls12";
      packets = open
        ? [
          { from: "server", to: "browser", kind: "req", label: "Certificate", t0: 0.08, t1: 0.7 },
          { from: "server", to: "observer", kind: "bad", label: "visible", t0: 0.2, t1: 0.55 }
        ]
        : [{ from: "server", to: "browser", kind: "lock", label: "Certificate", t0: 0.08, t1: 0.75 }];
      if (!open) links.push({ from: "server", to: "observer", style: "off" });
      chips.push({ k: "Cert", v: open ? "in the clear" : "encrypted", hot: true });
      caption = open
        ? "TLS 1.2 shows the certificate before encryption. Switch back to 1.3 to hide it."
        : "TLS 1.3 encrypts the certificate. The signature proves the server holds the private key.";
    } else if (frame === "finished") {
      packets = [
        { from: "server", to: "browser", kind: "lock", label: "Finished", t0: 0.05, t1: 0.42 },
        { from: "browser", to: "server", kind: "lock", label: "Finished", t0: 0.5, t1: 0.9 }
      ];
      chips.push({ k: "Match", v: "yes", hot: true });
      caption = "Finished checks that both sides saw the same handshake.";
    } else if (frame === "http") {
      packets = [
        { from: "browser", to: "server", kind: "lock", label: "GET /docs", t0: 0.08, t1: 0.48 },
        { from: "server", to: "browser", kind: "lock", label: "200", t0: 0.55, t1: 0.92 }
      ];
      chips.push({ k: "Body", v: "hidden", hot: true });
      caption = "The page rides inside. Sizes and the IP address are still visible.";
    } else {
      packets = [
        { from: "browser", to: "server", kind: "req", label: "Hello", t0: 0.05, t1: 0.3 },
        { from: "server", to: "browser", kind: "lock", label: "cert", t0: 0.35, t1: 0.6 },
        { from: "browser", to: "server", kind: "lock", label: "HTTP", t0: 0.68, t1: 0.92 }
      ];
      caption = "Offer, key shares, encrypted certificate, then the page. Toggle 1.2 to see the older shape.";
    }
    return { caption: caption, chips: chips, nodes: nodes, links: links, packets: packets };
  }

  function certScene(frame, state) {
    const fault = (state && state.fault) || "none";
    const nodes = [
      { id: "leaf", gx: 0.3, gy: 1.6, label: fault === "name" ? "wrong.test" : "example.com", mark: "leaf", tone: fault === "name" || fault === "expired" ? "red" : "green", hot: true, sub: fault === "expired" ? "expired" : "SAN" },
      { id: "intermediate", gx: 2.1, gy: 0.8, label: "Intermediate", mark: "CA", tone: "amber" },
      { id: "rootca", gx: 3.8, gy: 0, label: "Root", mark: "trust", tone: fault === "root" ? "red" : "violet", sub: fault === "root" ? "not installed" : "in the browser" }
    ];
    const broken = fault !== "none";
    const links = [
      { from: "leaf", to: "intermediate", style: fault === "name" || fault === "expired" ? "bad" : "solid", label: "signed by" },
      { from: "intermediate", to: "rootca", style: fault === "root" ? "bad" : "solid", label: "signed by" }
    ];
    const packets = broken
      ? [{ from: "leaf", to: "intermediate", kind: "bad", label: "fail", t0: 0.1, t1: 0.7 }]
      : [{ from: "rootca", to: "intermediate", kind: "res", label: "ok", t0: 0.05, t1: 0.4 }, { from: "intermediate", to: "leaf", kind: "res", label: "ok", t0: 0.45, t1: 0.85 }];
    const chips = [{ k: "Chain", v: broken ? "rejected" : "trusted", hot: true }];
    if (fault === "expired") chips.push({ k: "Date", v: "past" });
    if (fault === "name") chips.push({ k: "Name", v: "mismatch" });
    if (fault === "root") chips.push({ k: "Root", v: "missing" });
    const captions = {
      claim: "A certificate is a signed claim: this key belongs with this name.",
      chain: "Leaf, intermediate, root. The server does not get to appoint the root.",
      signature: "Each signature is checked with the next key up.",
      name: "The name and the dates have to match, or a good signature still fails.",
      revoke: "A leaked key can be revoked before the expiry date.",
      fail: "Pick a fault. The chain picture shows which check stops.",
      recap: "Trust is a chain back to a root the browser already has."
    };
    return {
      caption: fault === "none" ? (captions[frame] || captions.recap) : "This chain fails the " + (fault === "root" ? "trust anchor" : fault) + " check.",
      chips: chips,
      nodes: nodes,
      links: links,
      packets: packets
    };
  }

  async function hashScene(frame, state) {
    const a = (state && state.a) || "connection";
    const b = (state && state.b) || "connexction";
    if (!window.crypto || !crypto.subtle) {
      return { kind: "blocks", kicker: "Web Crypto is unavailable here.", blocks: [{ text: "SHA-256" }], banner: "Open the page on HTTPS or localhost.", caption: "The hash lesson needs Web Crypto." };
    }
    if (frame === "passwords") {
      const pw = a || "secret";
      const left = bitsOf(await digest(state && state.salt ? ("s1:" + pw) : pw));
      const right = bitsOf(await digest(state && state.salt ? ("s2:" + pw) : pw));
      const diff = left.map(function (bit, i) { return bit !== right[i]; });
      const changed = diff.filter(Boolean).length;
      return {
        kind: "bits",
        count: state && state.salt ? changed + " of 256 bits differ once each user has a salt" : "Same password, no salt: the grids match",
        rows: [
          { label: state && state.salt ? "user one + salt" : "user one", bits: left, diff: diff },
          { label: state && state.salt ? "user two + salt" : "user two", bits: right, diff: diff }
        ],
        note: "The salt is not a secret. It only makes the two inputs different. Plain SHA-256 is still too fast for passwords.",
        caption: "Toggle the salt. Equal passwords stop sharing a fingerprint."
      };
    }
    const left = bitsOf(await digest(a));
    const right = bitsOf(await digest(b));
    const diff = left.map(function (bit, i) { return bit !== right[i]; });
    const changed = diff.filter(Boolean).length;
    return {
      kind: "bits",
      count: a === b ? "Same input, same digest. 0 bits differ." : changed + " of 256 bits differ",
      rows: [
        { label: a || "(empty)", bits: left, diff: diff },
        { label: b || "(empty)", bits: right, diff: diff }
      ],
      note: "These are real SHA-256 bits, computed in this browser. Gold cells are 1s. Outlined cells differ.",
      caption: "Change one character. About half the grid should flip, with no pattern to follow."
    };
  }

  function chunk(text, size) {
    const parts = [];
    const raw = text || "";
    for (let i = 0; i < 4; i += 1) parts.push(raw.slice(i * size, (i + 1) * size) || "·");
    return parts;
  }

  async function encScene(frame, state) {
    const text = (state && state.text) || "GET /docs";
    const tamper = Boolean(state && state.tamper);
    if (frame === "jobs" || frame === "pair" || frame === "hybrid" || frame === "recap") {
      if (frame === "jobs") {
        return {
          caption: "Hiding and proving are different jobs. The cubes are not interchangeable.",
          chips: [{ k: "Job", v: "two", hot: true }],
          nodes: [
            { id: "browser", gx: 0.4, gy: 1.3, label: "Hide", mark: "AES", tone: "amber", hot: true, sub: "one shared key" },
            { id: "server", gx: 3.1, gy: 0.4, label: "Prove", mark: "sig", tone: "violet", hot: true, sub: "private key signs" }
          ],
          links: [{ from: "browser", to: "server", style: "dashed", label: "not the same tool" }],
          packets: []
        };
      }
      if (frame === "pair") {
        return {
          caption: "Drag the keys apart. The public one is meant to travel. The private one is not.",
          chips: [{ k: "Private", v: "stays", hot: true }],
          nodes: [
            { id: "alice", gx: 0.5, gy: 1.4, label: "Public key", mark: "pub", tone: "green", hot: true },
            { id: "bob", gx: 3.2, gy: 0.4, label: "Private key", mark: "sec", tone: "ink", hot: true }
          ],
          links: [{ from: "alice", to: "bob", style: "off" }],
          packets: [{ from: "alice", to: "bob", kind: "res", label: "share this", t0: 0.1, t1: 0.8 }]
        };
      }
      if (frame === "hybrid") {
        return {
          caption: "TLS 1.3: Diffie-Hellman for the secret, a signature for identity, AES-GCM for the bytes.",
          chips: [{ k: "TLS", v: "hybrid", hot: true }],
          nodes: [
            { id: "browser", gx: 0.2, gy: 1.6, label: "Key shares", mark: "DH", tone: "amber" },
            { id: "alice", gx: 2, gy: 1, label: "Signature", mark: "sig", tone: "violet" },
            { id: "server", gx: 3.6, gy: 0.2, label: "AES-GCM", mark: "lock", tone: "green", hot: true }
          ],
          links: [
            { from: "browser", to: "alice", style: "solid" },
            { from: "alice", to: "server", style: "solid" }
          ],
          packets: [
            { from: "browser", to: "alice", kind: "req", label: "secret", t0: 0.05, t1: 0.4 },
            { from: "alice", to: "server", kind: "lock", label: "page", t0: 0.5, t1: 0.9 }
          ]
        };
      }
      return {
        caption: "Name, deliver, agree, authenticate, hide. Each cube is one job.",
        chips: [{ k: "Path", v: "complete", hot: true }],
        nodes: [
          { id: "browser", gx: 0, gy: 2, label: "DNS", mark: "1", tone: "sand" },
          { id: "resolver", gx: 1.3, gy: 1.3, label: "TCP", mark: "2", tone: "blue" },
          { id: "alice", gx: 2.5, gy: 0.8, label: "Keys", mark: "3", tone: "amber" },
          { id: "server", gx: 3.7, gy: 0.2, label: "AES", mark: "4", tone: "green", hot: true }
        ],
        links: [
          { from: "browser", to: "resolver", style: "solid" },
          { from: "resolver", to: "alice", style: "solid" },
          { from: "alice", to: "server", style: "solid" }
        ],
        packets: [{ from: "browser", to: "server", kind: "lock", label: "page", t0: 0.05, t1: 0.9 }]
      };
    }
    if (frame === "agree") {
      const secret = state && state.secret;
      return {
        caption: secret ? "Both sides show the same secret. It was never a packet." : "Run the exchange. Only public keys should move.",
        chips: [{ k: "Secret", v: secret ? "match" : "not yet", hot: true }],
        nodes: [
          { id: "alice", gx: 0.3, gy: 1.4, label: "Alice", mark: "A", tone: "sand", hot: true, sub: secret ? secret.slice(0, 8) : "private stays" },
          { id: "bob", gx: 3.3, gy: 0.3, label: "Bob", mark: "B", tone: "blue", hot: true, sub: secret ? secret.slice(0, 8) : "private stays" }
        ],
        links: [{ from: "alice", to: "bob", style: "solid" }],
        packets: [
          { from: "alice", to: "bob", kind: "req", label: "public A", t0: 0.05, t1: 0.42 },
          { from: "bob", to: "alice", kind: "res", label: "public B", t0: 0.48, t1: 0.88 }
        ]
      };
    }
    if (frame === "sign") {
      return {
        kind: "blocks",
        kicker: tamper ? "The message changed. The signature did not." : "The message stays readable. The signature is the tag beside it.",
        blocks: chunk(text, 4).concat([{ text: tamper ? "FAIL" : "SIG", bad: tamper, locked: !tamper }]).map(function (part) {
          return typeof part === "string" ? { text: part } : part;
        }),
        bad: tamper,
        banner: tamper ? "Verification fails. A signature is not encryption." : "Signed with the private key. Anyone can check it with the public key.",
        caption: "Add an exclamation mark or press Tamper. The check should fail."
      };
    }
    let cipher = "················";
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt"]);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const raw = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(text)));
      if (tamper && raw.length) raw[0] ^= 1;
      cipher = Array.from(raw).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("").slice(0, 16);
    }
    const blocks = cipher.match(/.{1,4}/g) || ["····"];
    return {
      kind: "blocks",
      kicker: tamper ? "One byte was flipped." : "Plaintext became ciphertext. New nonce, new bytes.",
      blocks: blocks.map(function (part, index) {
        return { text: part, locked: true, bad: tamper && index === 0 };
      }),
      bad: tamper,
      banner: tamper ? "AES-GCM returns nothing. The tag no longer matches." : "This is real AES-GCM output from this browser, shortened so it fits.",
      caption: "Press Tamper. Decryption does not return almost the message."
    };
  }

  async function scene(lesson, frame, state) {
    if (lesson === "dns") return dnsScene(frame, state);
    if (lesson === "tcp") return tcpScene(frame, state);
    if (lesson === "tls") return tlsScene(frame, state);
    if (lesson === "certificates") return certScene(frame, state);
    if (lesson === "hashing") return hashScene(frame, state);
    if (lesson === "encryption") return encScene(frame, state);
    return { caption: "", nodes: [], links: [], packets: [] };
  }

  async function mount(root, lesson, frame, state, hooks) {
    kill();
    try {
      const built = await scene(lesson, frame, state || {});
      const hooksSafe = hooks || {};
      if (built.kind === "bits") return mountBits(root, built);
      if (built.kind === "blocks") return mountBlocks(root, built);
      return mountIso(root, built, hooksSafe);
    } catch (err) {
      root.textContent = "This picture could not be drawn in this browser.";
      return null;
    }
  }

  window.LearnStage = {
    mount: mount,
    scene: scene,
    replay: function () { if (current && current.replay) current.replay(); },
    pause: function () { return current && current.pause ? current.pause() : false; },
    scrub: function (progress) { if (current && current.scrub) current.scrub(progress); },
    resetDrag: function () {
      Object.keys(offsets).forEach(function (key) { delete offsets[key]; });
    }
  };
})();
