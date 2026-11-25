(function () {
  const root = document.documentElement;
  const lessonId = root.dataset.lesson || "";
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const KEY = "yt-learn-progress";

  if (new URLSearchParams(location.search).get("shot") === "mid") {
    root.classList.add("freeze");
  }

  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (err) {
      return {};
    }
  }

  function saveProgress(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (err) {}
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function toHex(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let out = "";
    for (let i = 0; i < bytes.length; i += 1) {
      out += bytes[i].toString(16).padStart(2, "0");
    }
    return out;
  }

  function hamming(a, b) {
    let n = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      let x = a[i] ^ b[i];
      while (x) {
        n += x & 1;
        x >>= 1;
      }
    }
    return n;
  }

  function paintHex(node, hex, other) {
    node.replaceChildren();
    for (let i = 0; i < hex.length; i += 1) {
      const span = document.createElement("span");
      span.textContent = hex[i];
      if (other && hex[i] !== other[i]) span.className = "hex-diff";
      node.append(span);
      if ((i + 1) % 4 === 0 && i !== hex.length - 1) node.append(document.createTextNode(" "));
    }
  }

  const FRAMES = {
    dns: {
      parse: {
        kind: "local",
        title: "Still on this machine",
        rows: [
          { k: "Scheme", v: "https", on: true },
          { k: "Host", v: "example.com", on: true },
          { k: "Port", v: "443, the HTTPS default", on: true },
          { k: "Path", v: "/docs", on: true }
        ],
        caption: "The browser splits the URL before any DNS packet is sent."
      },
      cache: {
        kind: "local",
        title: "Nearby answers",
        rows: [
          { k: "Browser cache", v: "Miss", on: true },
          { k: "OS cache", v: "Miss", on: true },
          { k: "Hosts file", v: "No entry for example.com", on: true }
        ],
        caption: "A fresh cached answer would end the lookup here. This one misses."
      },
      resolver: {
        kind: "exchange",
        left: "Browser",
        right: "Recursive resolver",
        messages: [
          { dir: "forward", label: "Query", detail: "example.com, A and AAAA" }
        ],
        caption: "The computer asks one resolver to do the walking. Classic DNS uses UDP port 53."
      },
      root: {
        kind: "exchange",
        left: "Resolver",
        right: "Root",
        messages: [
          { dir: "forward", label: "Query", detail: "who serves .com?" },
          { dir: "back", label: "Referral", detail: "name servers for .com" }
        ],
        caption: "The root does not know the address. It points at the .com servers."
      },
      tld: {
        kind: "exchange",
        left: "Resolver",
        right: ".com",
        messages: [
          { dir: "forward", label: "Query", detail: "who serves example.com?" },
          { dir: "back", label: "Referral", detail: "authoritative name servers" }
        ],
        caption: "The top-level domain refers the resolver to the domain's own servers."
      },
      auth: {
        kind: "exchange",
        left: "Resolver",
        right: "example.com",
        messages: [
          { dir: "forward", label: "Query", detail: "A and AAAA" },
          { dir: "back", label: "Answer", detail: "203.0.113.10 and 2001:db8::10, TTL 300" }
        ],
        caption: "Only the authoritative server returns the addresses. These two are documentation addresses, not a live site."
      },
      answer: {
        kind: "exchange",
        left: "Resolver",
        right: "Browser",
        messages: [
          { dir: "forward", label: "Answer", detail: "addresses, cached for the TTL" }
        ],
        caption: "The browser holds an address. The page has not been fetched."
      },
      recap: {
        kind: "flow",
        items: [
          "Parse the URL",
          "Check browser cache, OS cache, and the hosts file",
          "Ask a recursive resolver",
          "Root refers the resolver to .com",
          ".com refers the resolver to example.com",
          "Authoritative server returns A and AAAA",
          "Cache the answer for the TTL"
        ],
        hot: "all",
        caption: "DNS answered where. TCP is how the browser talks to that address."
      }
    },
    tcp: {
      layers: {
        kind: "nest",
        hot: "tcp",
        caption: "The same HTTP bytes, wrapped. Routers forward on the IP address."
      },
      ports: {
        kind: "local",
        title: "One connection, four numbers",
        rows: [
          { k: "Source IP", v: "203.0.113.8", on: true },
          { k: "Source port", v: "51422, an ephemeral example", on: true },
          { k: "Destination IP", v: "203.0.113.10", on: true },
          { k: "Destination port", v: "443, the HTTPS listener", on: true }
        ],
        caption: "The address finds the machine. The port finds the program. Together, the four-tuple finds this conversation."
      },
      syn: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "forward", label: "SYN", detail: "seq 1000" }
        ],
        caption: "1000 stands in for a random initial sequence number. A SYN consumes one number."
      },
      synack: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "forward", label: "SYN", detail: "seq 1000" },
          { dir: "back", label: "SYN-ACK", detail: "seq 5000, ack 1001" }
        ],
        caption: "The server sends its own sequence number and a receipt for the SYN."
      },
      ack: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "forward", label: "SYN", detail: "seq 1000" },
          { dir: "back", label: "SYN-ACK", detail: "seq 5000, ack 1001" },
          { dir: "forward", label: "ACK", detail: "seq 1001, ack 5001" }
        ],
        caption: "Both starting numbers are confirmed. The HTTP request has not been sent yet."
      },
      loss: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "forward", label: "Data", detail: "seq 1001, 100 bytes, lost", tone: "lost" },
          { dir: "forward", label: "Retransmit", detail: "seq 1001 again" },
          { dir: "back", label: "ACK", detail: "ack 1101" }
        ],
        caption: "The sender kept a copy. The acknowledgment is the receipt for those 100 bytes."
      },
      close: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "forward", label: "FIN", detail: "seq 1101" },
          { dir: "back", label: "ACK", detail: "ack 1102" },
          { dir: "back", label: "FIN", detail: "seq 5001" },
          { dir: "forward", label: "ACK", detail: "ack 5002" }
        ],
        caption: "Each FIN gets a receipt. The server's ACK and FIN are sometimes a single segment."
      },
      recap: {
        kind: "flow",
        items: [
          "Wrap the bytes: link, IP, TCP, application",
          "Pick ports and form the four-tuple",
          "SYN, SYN-ACK, ACK",
          "Send data, and retransmit what is not acknowledged",
          "FIN, and a receipt from each side"
        ],
        hot: "all",
        caption: "The stream is reliable. It is still readable by anyone on the path."
      }
    },
    tls: {
      shared: {
        kind: "flow",
        items: [
          "Café or company network",
          "Routers along the path",
          "TCP delivers the bytes in order",
          "Nothing in TCP stops those hops from reading them"
        ],
        hot: 3,
        caption: "Reliability and privacy are different jobs."
      },
      clienthello: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "forward", label: "ClientHello", detail: "version, ciphers, key share, SNI" }
        ],
        caption: "The server name in SNI is still visible on a typical handshake."
      },
      serverhello: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "forward", label: "ClientHello", detail: "key share" },
          { dir: "back", label: "ServerHello", detail: "TLS_AES_128_GCM_SHA256, key share" }
        ],
        caption: "Both sides can now derive the same secret. The private key shares were not sent."
      },
      cert: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "back", label: "ServerHello", detail: "key share" },
          { dir: "back", label: "Certificate", detail: "leaf and intermediates", secure: true },
          { dir: "back", label: "CertificateVerify", detail: "signature over the handshake", secure: true }
        ],
        caption: "After ServerHello, TLS 1.3 encrypts the handshake. The root is not what the server sends."
      },
      finished: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "back", label: "Finished", detail: "MAC over the transcript", secure: true },
          { dir: "forward", label: "Finished", detail: "browser confirms", secure: true }
        ],
        caption: "Finished checks that both sides saw the same handshake and hold the same keys."
      },
      http: {
        kind: "exchange",
        left: "Browser",
        right: "Server",
        messages: [
          { dir: "forward", label: "HTTP request", detail: "GET /docs, encrypted", secure: true },
          { dir: "back", label: "HTTP response", detail: "encrypted records", secure: true }
        ],
        caption: "The path and headers are hidden. The IP address, and usually the name in SNI, are not."
      },
      tls12: {
        kind: "split",
        cards: [
          { title: "TLS 1.3", text: "One round trip in the common case. Certificate encrypted. Ephemeral Diffie-Hellman only.", on: true },
          { title: "TLS 1.2", text: "Often two round trips. Certificate in the clear. Some suites encrypted a premaster secret to the server's long-term RSA key, with no forward secrecy.", on: false }
        ],
        caption: "If a diagram shows the certificate in the clear, it is teaching the older handshake."
      },
      recap: {
        kind: "flow",
        items: [
          "ClientHello offers a key share and names the site",
          "ServerHello agrees, and both sides derive keys",
          "Certificate and CertificateVerify arrive encrypted",
          "Finished confirms the transcript",
          "HTTP rides in application records"
        ],
        hot: "all",
        caption: "Next: how the browser decides the certificate is worth trusting."
      }
    },
    certificates: {
      claim: {
        kind: "local",
        title: "example.com leaf, a teaching certificate",
        rows: [
          { k: "Subject", v: "example.com", on: true },
          { k: "Public key", v: "the key the server must prove it holds", on: true },
          { k: "Dates", v: "notBefore and notAfter", on: true },
          { k: "Issuer", v: "Example Intermediate CA", on: true },
          { k: "Signature", v: "over those fields, with the issuer's private key", on: true }
        ],
        caption: "Change one field and the signature no longer matches. This is not a real certificate."
      },
      chain: {
        kind: "chain",
        hot: "all",
        checks: [],
        caption: "The server sends the leaf and intermediates. The root is already in the trust store."
      },
      signature: {
        kind: "chain",
        hot: "intermediate",
        checks: [
          { text: "Leaf signature verifies with the intermediate's public key", on: true },
          { text: "Intermediate signature verifies with the root's public key", on: true },
          { text: "The root is trusted because it is installed locally", on: false }
        ],
        caption: "Each signature is checked with the next key up, not with the key inside the certificate being checked."
      },
      name: {
        kind: "chain",
        hot: "leaf",
        checks: [
          { text: "SAN contains example.com", on: true },
          { text: "Today is inside notBefore and notAfter", on: true },
          { text: "A common name alone is not enough", on: false }
        ],
        caption: "A valid signature for a different name, or an expired date, still fails."
      },
      revoke: {
        kind: "flow",
        items: [
          "Private key leaks before notAfter",
          "CA revokes the certificate",
          "Browsers can read a CRL, or an OCSP status",
          "OCSP stapling attaches a fresh signed status to the handshake"
        ],
        hot: 3,
        caption: "Expiry is a deadline. Revocation is an early withdrawal."
      },
      fail: {
        kind: "flow",
        items: [
          "Name does not match the URL",
          "Outside the validity dates",
          "Chain does not end at a trusted root",
          "Revoked",
          "Self-signed, and not installed as a trust anchor"
        ],
        hot: "all",
        caption: "The warning names a failed check. The lock icon is the result of the checks that passed."
      },
      recap: {
        kind: "flow",
        items: [
          "Chain the leaf to a local root",
          "Verify each signature",
          "Match the SAN to the host",
          "Check the dates",
          "Check revocation"
        ],
        hot: "all",
        caption: "Hashing is the fingerprint inside those signatures."
      }
    },
    hashing: {
      fingerprint: {
        kind: "hashvis",
        mode: "fixed",
        caption: "Same input, same digest. There is no key, and no decrypt operation."
      },
      length: {
        kind: "hashvis",
        mode: "fixed",
        caption: "SHA-256 is specified in FIPS 180-4. The digest is 32 bytes, 64 hex characters."
      },
      avalanche: {
        kind: "hashvis",
        mode: "avalanche",
        caption: "The two words differ by one letter. The live digests below are real SHA-256, computed here."
      },
      properties: {
        kind: "flow",
        items: [
          "Preimage: given the digest, finding an input is infeasible",
          "Second preimage: given an input, finding a twin is infeasible",
          "Collision: finding any two inputs that share a digest is infeasible"
        ],
        hot: "all",
        caption: "Collisions exist in theory because the output is fixed length. SHA-256 is built so you cannot find one."
      },
      passwords: {
        kind: "split",
        cards: [
          { title: "Plain SHA-256", text: "Fast, and the same password always yields the same digest. Guessing is cheap.", on: false },
          { title: "Password hash", text: "A unique salt stored beside the hash, and a slow function such as Argon2. The salt is not a secret.", on: true }
        ],
        caption: "The demo uses PBKDF2 because Web Crypto has it. Argon2 is the better choice for a new system."
      },
      recap: {
        kind: "flow",
        items: [
          "Fingerprint of any length, fixed 256-bit output",
          "Tiny input changes scramble the digest",
          "Preimage, second preimage, collision resistance",
          "Passwords add a salt and a slow hash"
        ],
        hot: "all",
        caption: "A hash fingerprints. Encryption, next, is what a key can undo."
      }
    },
    encryption: {
      jobs: {
        kind: "split",
        cards: [
          { title: "Hide", text: "Encryption. Only a key holder reads the bytes.", on: true },
          { title: "Prove", text: "A signature. The message stays readable. The public key checks it.", on: true }
        ],
        caption: "TLS uses both. Neither job does the other's work."
      },
      symmetric: {
        kind: "local",
        title: "AES-256-GCM",
        rows: [
          { k: "Key", v: "32 bytes, shared by both sides", on: true },
          { k: "Nonce", v: "12 bytes, unique for this key", on: true },
          { k: "Tag", v: "detects a changed ciphertext", on: true }
        ],
        caption: "GCM refuses to return plaintext when the tag does not match."
      },
      aes: {
        kind: "local",
        title: "In this page only",
        rows: [
          { k: "Generate", v: "AES-256-GCM key", on: true },
          { k: "Encrypt", v: "new 96-bit nonce every time", on: true },
          { k: "Flip a byte", v: "decryption returns nothing", on: true }
        ],
        caption: "The key is not sent anywhere. The demo below uses Web Crypto."
      },
      pair: {
        kind: "split",
        cards: [
          { title: "Public key", text: "Share it. Others encrypt to you, or check your signatures.", on: true },
          { title: "Private key", text: "Keep it. You decrypt, or you sign. It is not derived from the public key in practice.", on: true }
        ],
        caption: "RSA and elliptic curves are the two families. TLS 1.3 key shares are elliptic-curve Diffie-Hellman."
      },
      agree: {
        kind: "exchange",
        left: "Alice",
        right: "Bob",
        messages: [
          { dir: "forward", label: "Public key", detail: "Alice's P-256 share" },
          { dir: "back", label: "Public key", detail: "Bob's P-256 share" }
        ],
        caption: "Each side combines its private key with the other's public key. The shared secret is never on the wire."
      },
      sign: {
        kind: "exchange",
        left: "Signer",
        right: "Anyone",
        messages: [
          { dir: "forward", label: "Message", detail: "in the clear" },
          { dir: "forward", label: "Signature", detail: "ECDSA over SHA-256" }
        ],
        caption: "Verification uses the public key. A changed message does not verify."
      },
      hybrid: {
        kind: "flow",
        items: [
          "Diffie-Hellman creates a shared secret",
          "HKDF stretches it into traffic keys",
          "AES-GCM carries the HTTP bytes",
          "A signature ties the handshake to the certified key",
          "A hash sits inside that signature"
        ],
        hot: "all",
        caption: "RSA encryption of the session key is the TLS 1.2 pattern. TLS 1.3 does not do that."
      },
      recap: {
        kind: "flow",
        items: [
          "DNS: a name becomes an address",
          "TCP: a reliable stream",
          "TLS 1.3: keys and a checked certificate",
          "A chain of signatures back to a local root",
          "Hashes fingerprint. AES-GCM hides."
        ],
        hot: "all",
        caption: "Each piece does one job, and none of them substitutes for the others."
      }
    }
  };

  function renderLocal(frame) {
    const card = el("div", "local-card");
    if (frame.title) card.append(el("p", "diagram-kicker", frame.title));
    const list = el("dl", "local-rows");
    (frame.rows || []).forEach(function (row) {
      const item = el("div", row.on ? "is-on" : "");
      item.append(el("dt", "", row.k), el("dd", "", row.v));
      list.append(item);
    });
    card.append(list);
    return card;
  }

  function renderExchange(frame) {
    const wrap = el("div", "exchange");
    const head = el("div", "exchange-head");
    head.append(el("span", "", frame.left), el("span", "", frame.right));
    wrap.append(head);
    let sealed = false;
    (frame.messages || []).forEach(function (msg, index, all) {
      if (msg.secure && !sealed) {
        wrap.append(el("p", "seal", "Encrypted with the handshake keys"));
        sealed = true;
      }
      const last = index === all.length - 1 && msg.tone !== "lost";
      const row = el("div", "msg " + (last ? "is-new" : "is-settled") + (msg.tone === "lost" ? " is-lost" : ""));
      row.dataset.dir = msg.dir === "back" ? "back" : "forward";
      const name = el("p", "msg-name");
      name.append(document.createTextNode(msg.label));
      if (msg.detail) {
        name.append(document.createTextNode(" "));
        name.append(el("span", "msg-detail", msg.detail));
      }
      const track = el("div", "msg-track");
      track.setAttribute("aria-hidden", "true");
      track.append(el("span", "msg-dot"));
      row.append(name, track);
      wrap.append(row);
    });
    return wrap;
  }

  function shell(id, label, child, hot) {
    const node = el("div", "shell" + (hot === id ? " is-hot" : ""));
    node.append(el("span", "", label));
    if (child) node.append(child);
    return node;
  }

  function renderNest(frame) {
    const app = el("div", "shell payload" + (frame.hot === "app" ? " is-hot" : ""));
    app.append(el("span", "", "Application · HTTP GET /docs"));
    const tcp = shell("tcp", "Transport · TCP ports and sequence numbers", app, frame.hot);
    const ip = shell("ip", "Internet · source and destination addresses", tcp, frame.hot);
    return shell("link", "Link · Wi-Fi or Ethernet frame", ip, frame.hot);
  }

  function renderChain(frame) {
    const wrap = el("div", "chain-wrap");
    const list = el("ol", "chain");
    [
      ["leaf", "Leaf", "example.com"],
      ["intermediate", "Intermediate", "Example Intermediate CA"],
      ["root", "Root", "in the trust store, usually not sent"]
    ].forEach(function (item) {
      const hot = frame.hot === "all" || frame.hot === item[0];
      const li = el("li", "sheet" + (hot ? " is-hot" : ""));
      li.append(el("strong", "", item[1]), el("span", "", item[2]));
      list.append(li);
    });
    wrap.append(list);
    if (frame.checks && frame.checks.length) {
      const ul = el("ul", "checks");
      frame.checks.forEach(function (check) {
        ul.append(el("li", check.on ? "is-on" : "", check.text));
      });
      wrap.append(ul);
    }
    return wrap;
  }

  function renderFlow(frame) {
    const list = el("ol", "flow");
    (frame.items || []).forEach(function (item, index) {
      const on = frame.hot === "all" || frame.hot === index;
      list.append(el("li", on ? "is-on" : "", item));
    });
    return list;
  }

  function renderSplit(frame) {
    const wrap = el("div", "split");
    (frame.cards || []).forEach(function (card) {
      const section = el("section", card.on ? "is-on" : "");
      section.append(el("h3", "", card.title), el("p", "", card.text));
      wrap.append(section);
    });
    return wrap;
  }

  function renderHash(frame) {
    const wrap = el("div", "hashvis");
    if (frame.mode === "avalanche") {
      wrap.append(el("p", "hv-label", "One letter changes"));
      wrap.append(el("p", "hv-word", "connection"));
      wrap.append(el("p", "hv-word", "connexction"));
      wrap.append(el("p", "hv-note", "Schematic only. The demo below shows the real SHA-256 digests."));
      return wrap;
    }
    wrap.append(el("p", "hv-label", "Any length in"));
    wrap.append(el("p", "hv-word", "example.com"));
    const rule = document.createElement("hr");
    rule.className = "hv-rule";
    wrap.append(rule);
    wrap.append(el("p", "hv-label", "SHA-256 out"));
    wrap.append(el("p", "hv-word", "256 bits"));
    wrap.append(el("p", "hv-note", "32 bytes. 64 hexadecimal characters. Not a compressed copy of the input."));
    return wrap;
  }

  const BUILDERS = {
    local: renderLocal,
    exchange: renderExchange,
    nest: renderNest,
    chain: renderChain,
    flow: renderFlow,
    split: renderSplit,
    hashvis: renderHash
  };

  const hud = {
    host: "example.com",
    cache: "miss",
    drop: false,
    version: "1.3",
    fault: "none",
    a: "connection",
    b: "connexction",
    salt: true,
    text: "GET /docs",
    tamper: false,
    secret: ""
  };

  function renderFrame(frameId) {
    const diagram = document.getElementById("diagram");
    const scrub = document.getElementById("scrub");
    if (!diagram || !window.LearnStage) return;
    if (scrub) scrub.value = "0";
    const hashA = document.getElementById("hash-input");
    const hashB = document.getElementById("hash-flip");
    if (hashA && document.activeElement !== document.getElementById("hud-a")) hud.a = hashA.value || hud.a;
    if (hashB && document.activeElement !== document.getElementById("hud-b")) hud.b = hashB.value || hud.b;
    window.LearnStage.mount(diagram, lessonId, frameId, hud, {
      onDetail: function (text) {
        const slot = document.getElementById("node-detail");
        if (slot) slot.textContent = text;
      }
    });
  }

  function buildHud(redraw) {
    const panel = document.querySelector(".diagram-panel");
    if (!panel || document.getElementById("stage-hud")) return;
    const hudBar = document.createElement("div");
    hudBar.className = "stage-hud";
    hudBar.id = "stage-hud";
    function btn(id, label, pressed) {
      const button = document.createElement("button");
      button.type = "button";
      button.id = id;
      button.textContent = label;
      if (pressed) button.setAttribute("aria-pressed", "true");
      return button;
    }
    if (lessonId === "dns") {
      const label = document.createElement("label");
      label.setAttribute("for", "hud-host");
      label.textContent = "Name";
      const input = document.createElement("input");
      input.id = "hud-host";
      input.value = hud.host;
      input.autocomplete = "off";
      input.spellcheck = false;
      input.addEventListener("input", function () {
        hud.host = input.value || "example.com";
        redraw();
      });
      const cache = btn("hud-cache", "Cache miss", false);
      cache.addEventListener("click", function () {
        hud.cache = hud.cache === "hit" ? "miss" : "hit";
        cache.textContent = hud.cache === "hit" ? "Cache hit" : "Cache miss";
        cache.setAttribute("aria-pressed", String(hud.cache === "hit"));
        redraw();
      });
      hudBar.append(label, input, cache);
    } else if (lessonId === "tcp") {
      const drop = btn("hud-drop", "Drop a segment", false);
      drop.setAttribute("aria-pressed", "false");
      drop.addEventListener("click", function () {
        hud.drop = !hud.drop;
        drop.setAttribute("aria-pressed", String(hud.drop));
        drop.textContent = hud.drop ? "Dropping a segment" : "Drop a segment";
        redraw();
      });
      hudBar.append(drop);
    } else if (lessonId === "tls") {
      const version = btn("hud-tls", "TLS 1.3", true);
      version.addEventListener("click", function () {
        hud.version = hud.version === "1.3" ? "1.2" : "1.3";
        version.textContent = hud.version === "1.3" ? "TLS 1.3" : "TLS 1.2";
        version.setAttribute("aria-pressed", String(hud.version === "1.2"));
        redraw();
      });
      hudBar.append(version);
    } else if (lessonId === "certificates") {
      ["none", "name", "expired", "root"].forEach(function (fault) {
        const names = { none: "Intact", name: "Wrong name", expired: "Expired", root: "Bad root" };
        const button = btn("hud-fault-" + fault, names[fault], fault === "none");
        button.addEventListener("click", function () {
          hud.fault = fault;
          hudBar.querySelectorAll("button").forEach(function (item) {
            item.setAttribute("aria-pressed", String(item === button));
          });
          redraw();
        });
        hudBar.append(button);
      });
    } else if (lessonId === "hashing") {
      const a = document.createElement("input");
      a.id = "hud-a";
      a.value = hud.a;
      a.setAttribute("aria-label", "First text");
      const b = document.createElement("input");
      b.id = "hud-b";
      b.value = hud.b;
      b.setAttribute("aria-label", "Second text");
      function push() {
        hud.a = a.value;
        hud.b = b.value;
        const labA = document.getElementById("hash-input");
        const labB = document.getElementById("hash-flip");
        if (labA) { labA.value = a.value; labA.dispatchEvent(new Event("input")); }
        if (labB) labB.value = b.value;
        redraw();
      }
      a.addEventListener("input", push);
      b.addEventListener("input", push);
      const salt = btn("hud-salt", "Salt on", true);
      salt.addEventListener("click", function () {
        hud.salt = !hud.salt;
        salt.textContent = hud.salt ? "Salt on" : "Salt off";
        salt.setAttribute("aria-pressed", String(hud.salt));
        redraw();
      });
      hudBar.append(a, b, salt);
    } else if (lessonId === "encryption") {
      const input = document.createElement("input");
      input.id = "hud-text";
      input.value = hud.text;
      input.setAttribute("aria-label", "Message");
      input.addEventListener("input", function () {
        hud.text = input.value;
        const plain = document.getElementById("aes-plain");
        const sign = document.getElementById("sign-msg");
        if (plain) plain.value = input.value;
        if (sign) sign.value = input.value;
        redraw();
      });
      const tamper = btn("hud-tamper", "Tamper", false);
      tamper.setAttribute("aria-pressed", "false");
      tamper.addEventListener("click", function () {
        hud.tamper = !hud.tamper;
        tamper.setAttribute("aria-pressed", String(hud.tamper));
        redraw();
      });
      const agree = btn("hud-agree", "Run the exchange", false);
      agree.addEventListener("click", async function () {
        if (!window.crypto || !crypto.subtle) return;
        agree.disabled = true;
        agree.textContent = "Deriving…";
        try {
          const alice = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
          const bob = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
          const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: bob.publicKey }, alice.privateKey, 256));
          const other = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: alice.publicKey }, bob.privateKey, 256));
          hud.secret = toHex(bits);
          const slot = document.getElementById("node-detail");
          if (slot) slot.textContent = hud.secret === toHex(other) ? "Both secrets match. Neither private key was sent." : "The secrets did not match.";
          redraw();
        } finally {
          agree.disabled = false;
          agree.textContent = "Run the exchange";
        }
      });
      hudBar.append(input, tamper, agree);
    }
    const tools = document.createElement("div");
    tools.className = "stage-tools";
    const replay = btn("stage-replay", "Replay");
    const pause = btn("stage-pause", "Pause");
    pause.setAttribute("aria-pressed", "false");
    replay.addEventListener("click", function () {
      if (window.LearnStage) window.LearnStage.replay();
      const scrub = document.getElementById("scrub");
      if (scrub) scrub.value = "0";
    });
    pause.addEventListener("click", function () {
      const paused = window.LearnStage && window.LearnStage.pause();
      pause.setAttribute("aria-pressed", String(Boolean(paused)));
      pause.textContent = paused ? "Play" : "Pause";
    });
    tools.append(replay, pause);
    const scrubWrap = document.createElement("div");
    scrubWrap.className = "scrub";
    const scrubLabel = document.createElement("label");
    scrubLabel.setAttribute("for", "scrub");
    scrubLabel.textContent = "Timeline";
    const scrub = document.createElement("input");
    scrub.id = "scrub";
    scrub.type = "range";
    scrub.min = "0";
    scrub.max = "100";
    scrub.value = "0";
    scrub.addEventListener("input", function () {
      if (window.LearnStage) window.LearnStage.scrub(Number(scrub.value) / 100);
    });
    scrubWrap.append(scrubLabel, scrub);
    const detail = document.createElement("p");
    detail.id = "node-detail";
    detail.className = "node-detail";
    detail.textContent = "Click a cube, or drag it. The links follow.";
    const diagram = document.getElementById("diagram");
    if (diagram) panel.insertBefore(hudBar, diagram);
    else panel.append(hudBar);
    panel.append(tools, scrubWrap, detail);
  }

  function initChrome() {
    const header = document.getElementById("site-header");
    const nav = document.getElementById("site-nav");
    const toggle = document.getElementById("nav-toggle");
    const themeButton = document.getElementById("theme-toggle");
    if (!header || !nav || !toggle || !themeButton) return;
    const themeLabel = themeButton.querySelector(".theme-toggle-label");
    const desktopNav = window.matchMedia("(min-width: 861px)");

    function setTheme(theme, persist) {
      root.setAttribute("data-theme", theme);
      const light = theme === "light";
      themeButton.setAttribute("aria-pressed", String(light));
      themeButton.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      if (themeLabel) themeLabel.textContent = light ? "Dark" : "Light";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", light ? "#e5eee8" : "#0f1815");
      if (persist) {
        try { localStorage.setItem("yt-theme", theme); } catch (err) {}
      }
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
    }

    function openNav() {
      header.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "Close";
      nav.removeAttribute("inert");
      document.body.classList.add("nav-lock");
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

    const onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const current = document.querySelector(".course-nav a[aria-current='page']");
    if (current && !desktopNav.matches) current.scrollIntoView({ inline: "center", block: "nearest" });
  }

  function initLanding() {
    const list = document.getElementById("lesson-index");
    if (!list) return;
    const progress = loadProgress();
    let done = 0;
    list.querySelectorAll("[data-lesson]").forEach(function (item) {
      const id = item.dataset.lesson;
      const total = Number(item.dataset.steps);
      const state = item.querySelector("[data-state]");
      const record = progress[id];
      if (!state) return;
      if (record && record.cleared) {
        done += 1;
        item.classList.add("is-done");
        state.textContent = "Complete";
      } else if (record && Number.isInteger(record.step)) {
        state.textContent = "Step " + (record.step + 1) + " of " + total;
      }
    });
    const line = document.getElementById("course-progress");
    if (line) {
      line.textContent = done === 0
        ? "No lessons completed on this browser yet."
        : done + " of 6 lessons completed on this browser.";
    }
    const bar = document.getElementById("scroll-progress");
    if (bar) bar.style.transform = "scaleX(" + (done / 6) + ")";
    const preview = document.getElementById("landing-stage");
    if (preview && window.LearnStage) {
      window.LearnStage.mount(preview, "dns", "root", { host: "example.com", cache: "miss" }, {});
    }
  }

  function initPlayer() {
    const steps = Array.prototype.slice.call(document.querySelectorAll("#steps .step"));
    if (!steps.length) return;
    const count = document.getElementById("step-count");
    const stepper = document.getElementById("stepper");
    const prev = document.getElementById("prev");
    const next = document.getElementById("next");
    const replay = document.getElementById("replay");
    const play = document.getElementById("play");
    const quiz = document.getElementById("quiz");
    const takeaways = document.getElementById("takeaways");
    const bar = document.getElementById("scroll-progress");
    let index = 0;
    let playing = false;
    let timer = 0;

    const hash = location.hash.match(/^#step-(\d+)$/);
    if (hash) {
      const fromHash = Number(hash[1]) - 1;
      if (fromHash >= 0 && fromHash < steps.length) index = fromHash;
    } else {
      const saved = loadProgress()[lessonId];
      if (saved && Number.isInteger(saved.step)) {
        index = Math.min(Math.max(saved.step, 0), steps.length - 1);
      }
    }

    function remember(cleared) {
      const all = loadProgress();
      const prevRecord = all[lessonId] || {};
      all[lessonId] = {
        step: Math.max(prevRecord.step || 0, index),
        cleared: Boolean(prevRecord.cleared || cleared)
      };
      saveProgress(all);
    }

    function pause() {
      playing = false;
      if (timer) window.clearInterval(timer);
      timer = 0;
      if (play) {
        play.setAttribute("aria-pressed", "false");
        play.textContent = "Play";
      }
    }

    function show(nextIndex, options) {
      const opts = options || {};
      index = nextIndex;
      steps.forEach(function (step, stepIndex) {
        step.classList.toggle("is-current", stepIndex === index);
      });
      const heading = steps[index].querySelector("h2");
      const title = heading ? heading.textContent : "";
      if (count) count.textContent = "Step " + (index + 1) + " of " + steps.length + ". " + title;
      if (stepper) {
        Array.prototype.forEach.call(stepper.children, function (button, stepIndex) {
          if (stepIndex === index) button.setAttribute("aria-current", "step");
          else button.removeAttribute("aria-current");
          button.classList.toggle("is-done", stepIndex < index);
        });
      }
      if (prev) prev.disabled = index === 0;
      if (next) next.textContent = index === steps.length - 1 ? "Finish" : "Next";
      renderFrame(steps[index].dataset.frame || "");
      document.querySelectorAll(".step").forEach(function (step, stepIndex) {
        const labId = step.dataset.openLab;
        if (!labId || stepIndex > index) return;
        const lab = document.getElementById(labId);
        if (lab) lab.classList.add("is-open");
      });
      const atEnd = index === steps.length - 1;
      if (quiz) quiz.classList.toggle("is-open", atEnd);
      if (takeaways) takeaways.classList.toggle("is-open", atEnd);
      if (bar) bar.style.transform = "scaleX(" + ((index + 1) / steps.length) + ")";
      remember(false);
      if (opts.replaceHash !== false) {
        history.replaceState(null, "", "#step-" + (index + 1));
      }
      if (opts.scroll) {
        const live = document.getElementById("step-live");
        if (live) {
          const rect = live.getBoundingClientRect();
          if (rect.top < 72 || rect.top > window.innerHeight * 0.65) {
            live.scrollIntoView({ block: "start", behavior: reducedQuery.matches ? "auto" : "smooth" });
          }
        }
      }
    }

    if (stepper) {
      steps.forEach(function (step, stepIndex) {
        const heading = step.querySelector("h2");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(stepIndex + 1);
        button.setAttribute("aria-label", "Step " + (stepIndex + 1) + (heading ? ": " + heading.textContent : ""));
        button.addEventListener("click", function () {
          pause();
          show(stepIndex, { scroll: true });
        });
        stepper.append(button);
      });
    }

    if (prev) prev.addEventListener("click", function () {
      if (index === 0) return;
      pause();
      show(index - 1, { scroll: true });
    });
    if (next) next.addEventListener("click", function () {
      pause();
      if (index >= steps.length - 1) {
        const quizTitle = document.getElementById("quiz-title");
        if (quizTitle) quizTitle.focus();
        return;
      }
      show(index + 1, { scroll: true });
    });
    if (replay) replay.addEventListener("click", function () {
      pause();
      renderFrame(steps[index].dataset.frame || "");
    });
    if (play) play.addEventListener("click", function () {
      if (reducedQuery.matches) return;
      if (playing) {
        pause();
        return;
      }
      if (index >= steps.length - 1) show(0, { scroll: false });
      playing = true;
      play.setAttribute("aria-pressed", "true");
      play.textContent = "Pause";
      timer = window.setInterval(function () {
        if (index >= steps.length - 1) {
          pause();
          return;
        }
        show(index + 1, { scroll: false });
      }, 4200);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement;
      if (!active || !active.closest) return;
      if (active.closest("input, textarea, select, [contenteditable='true']")) return;
      if (active.matches && active.matches("input[type='radio']")) return;
      if (!active.closest(".learn-layout")) return;
      event.preventDefault();
      pause();
      if (event.key === "ArrowRight" && index < steps.length - 1) show(index + 1, { scroll: true });
      if (event.key === "ArrowLeft" && index > 0) show(index - 1, { scroll: true });
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause();
    });
    reducedQuery.addEventListener("change", function (event) {
      if (event.matches) pause();
    });

    if (quiz) {
      const button = quiz.querySelector("[data-quiz]");
      const result = quiz.querySelector(".quiz-result");
      if (button) button.addEventListener("click", function () {
        const sets = quiz.querySelectorAll("fieldset");
        let correct = 0;
        sets.forEach(function (set) {
          set.classList.remove("is-right", "is-wrong");
          const old = set.querySelector(".why");
          if (old) old.remove();
          const chosen = set.querySelector("input:checked");
          const note = el("p", "why");
          if (chosen && chosen.value === set.dataset.answer) {
            correct += 1;
            set.classList.add("is-right");
            note.textContent = "Correct. " + (set.dataset.why || "");
          } else {
            set.classList.add("is-wrong");
            note.textContent = "Not this one. " + (set.dataset.why || "");
          }
          set.append(note);
        });
        if (result) {
          if (correct === sets.length) {
            result.textContent = "All " + sets.length + " correct. This lesson is marked complete on this browser.";
            remember(true);
          } else {
            result.textContent = correct + " of " + sets.length + " correct. Adjust the ones marked “Not this one.” and check again.";
          }
        }
      });
    }

    const quizTitle = document.getElementById("quiz-title");
    if (quizTitle && !quizTitle.hasAttribute("tabindex")) quizTitle.tabIndex = -1;

    buildHud(function () {
      renderFrame(steps[index].dataset.frame || "");
    });
    const stageEl = document.querySelector(".stage");
    if (stageEl && stepper && !document.querySelector(".lesson-rail")) {
      const rail = document.createElement("div");
      rail.className = "lesson-rail";
      const railLabel = document.createElement("p");
      railLabel.className = "rail-label";
      railLabel.textContent = "In this lesson";
      rail.append(railLabel, stepper);
      stageEl.append(rail);
    }
    show(index, { scroll: false, replaceHash: true });
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  }

  function cryptoUnavailable(target) {
    if (window.crypto && crypto.subtle) return false;
    if (target) {
      target.textContent = "This browser will not run Web Crypto on this page. Open it over HTTPS or localhost. The lesson text stands without the demo.";
    }
    return true;
  }

  function initLabs() {
    const hashInput = document.getElementById("hash-input");
    const hashFlip = document.getElementById("hash-flip");
    const hashHex = document.getElementById("hash-hex");
    const hashHex2 = document.getElementById("hash-hex-2");
    const hashDistance = document.getElementById("hash-distance");
    if (hashInput && hashFlip && hashHex && hashHex2 && hashDistance) {
      let hashTimer = 0;
      async function runHash() {
        if (cryptoUnavailable(hashDistance)) return;
        try {
          const empty = await sha256("");
          const emptyHex = toHex(empty);
          if (emptyHex !== "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {
            throw new Error("SHA-256 self-check failed");
          }
          const left = await sha256(hashInput.value);
          const right = await sha256(hashFlip.value);
          const leftHex = toHex(left);
          const rightHex = toHex(right);
          paintHex(hashHex, leftHex, rightHex);
          paintHex(hashHex2, rightHex, leftHex);
          if (hashInput.value === hashFlip.value) {
            hashDistance.textContent = "Same input, same digest. 0 of 256 bits differ.";
            return;
          }
          const bits = hamming(left, right);
          const pct = Math.round((bits / 256) * 100);
          hashDistance.textContent = bits + " of 256 bits differ (" + pct + "%). A strong hash usually lands near half when the input changes at all.";
        } catch (err) {
          hashDistance.textContent = "SHA-256 could not be computed in this browser.";
        }
      }
      function schedule() {
        window.clearTimeout(hashTimer);
        hashTimer = window.setTimeout(runHash, 40);
      }
      hashInput.addEventListener("input", schedule);
      hashFlip.addEventListener("input", schedule);
      runHash();
    }

    const pw = document.getElementById("pw");
    const pwOut = document.getElementById("pw-out");
    const pwNew = document.getElementById("pw-new");
    const pwSame = document.getElementById("pw-same");
    const pwFast = document.getElementById("pw-fast");
    let salt = null;
    let lastDigest = "";

    async function pbkdf2(password, saltBytes) {
      const baseKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
      );
      const bits = await crypto.subtle.deriveBits({
        name: "PBKDF2",
        hash: "SHA-256",
        salt: saltBytes,
        iterations: 100000
      }, baseKey, 256);
      return new Uint8Array(bits);
    }

    async function runPassword(reuseSalt) {
      if (!pw || !pwOut) return;
      if (cryptoUnavailable(pwOut)) return;
      if (!pw.value) {
        pwOut.textContent = "Type a throwaway word first. Do not use a real password.";
        return;
      }
      try {
        if (!reuseSalt || !salt) salt = crypto.getRandomValues(new Uint8Array(16));
        const t0 = performance.now();
        const digest = await pbkdf2(pw.value, salt);
        const slow = Math.max(1, Math.round(performance.now() - t0));
        lastDigest = toHex(digest);
        pwOut.textContent = "Salt " + toHex(salt) + ". PBKDF2-HMAC-SHA-256, 100,000 iterations, " + slow + " ms. Digest " + lastDigest + ".";
      } catch (err) {
        pwOut.textContent = "PBKDF2 could not run. " + (err && err.message ? err.message : "");
      }
    }

    if (pwNew) pwNew.addEventListener("click", function () { runPassword(false); });
    if (pwSame) pwSame.addEventListener("click", async function () {
      if (!salt) {
        if (pwOut) pwOut.textContent = "Hash with a new salt first.";
        return;
      }
      const before = lastDigest;
      await runPassword(true);
      if (pwOut && before && lastDigest === before) {
        pwOut.textContent += " Same salt, same digest.";
      }
    });
    if (pwFast) pwFast.addEventListener("click", async function () {
      if (!pw || !pwOut) return;
      if (cryptoUnavailable(pwOut)) return;
      if (!pw.value) {
        pwOut.textContent = "Type a throwaway word first.";
        return;
      }
      const t0 = performance.now();
      const digest = await sha256(pw.value);
      const fast = performance.now() - t0;
      const shown = fast < 1 ? "under 1 ms" : Math.round(fast) + " ms";
      pwOut.textContent = "Plain SHA-256 of that word took " + shown + ". Digest " + toHex(digest) + ". No salt. Equal words would share this digest, and guessing stays cheap. This is not how a password should be stored.";
    });

    const plain = document.getElementById("aes-plain");
    const aesOut = document.getElementById("aes-out");
    const aesEncrypt = document.getElementById("aes-encrypt");
    const aesDecrypt = document.getElementById("aes-decrypt");
    const aesFlip = document.getElementById("aes-flip");
    let aesKey = null;
    let aesIv = null;
    let aesBytes = null;

    async function ensureAes() {
      if (!aesKey) {
        aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
      }
      return aesKey;
    }

    if (aesEncrypt) aesEncrypt.addEventListener("click", async function () {
      if (!aesOut) return;
      if (cryptoUnavailable(aesOut)) return;
      try {
        const key = await ensureAes();
        aesIv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plain ? plain.value : "");
        const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: aesIv }, key, encoded);
        aesBytes = new Uint8Array(cipher);
        const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
        aesOut.textContent = "Key " + toHex(raw) + ". Nonce " + toHex(aesIv) + ". Ciphertext and tag " + toHex(aesBytes) + ". A new nonce was generated for this encryption.";
      } catch (err) {
        aesOut.textContent = "Encryption failed. " + (err && err.message ? err.message : "");
      }
    });

    async function decryptCurrent() {
      const key = await ensureAes();
      const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: aesIv }, key, aesBytes);
      return new TextDecoder().decode(clear);
    }

    if (aesDecrypt) aesDecrypt.addEventListener("click", async function () {
      if (!aesOut) return;
      if (!aesBytes || !aesIv) {
        aesOut.textContent = "Encrypt a message first.";
        return;
      }
      try {
        const text = await decryptCurrent();
        aesOut.textContent = "Decrypted: " + text;
      } catch (err) {
        aesOut.textContent = "AES-GCM rejected this ciphertext. The authentication tag no longer matches, so the browser returns no plaintext.";
      }
    });

    if (aesFlip) aesFlip.addEventListener("click", function () {
      if (!aesOut) return;
      if (!aesBytes) {
        aesOut.textContent = "Encrypt a message first.";
        return;
      }
      aesBytes = new Uint8Array(aesBytes);
      aesBytes[0] ^= 1;
      aesOut.textContent = "Flipped one ciphertext byte. Decrypt to see AES-GCM refuse it. Ciphertext and tag " + toHex(aesBytes) + ".";
    });

    const ecdhButton = document.getElementById("ecdh-run");
    const ecdhOut = document.getElementById("ecdh-out");
    if (ecdhButton) ecdhButton.addEventListener("click", async function () {
      if (!ecdhOut) return;
      if (cryptoUnavailable(ecdhOut)) return;
      ecdhOut.textContent = "Generating two P-256 key pairs…";
      try {
        const alice = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
        const bob = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
        const aliceSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: bob.publicKey }, alice.privateKey, 256));
        const bobSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: alice.publicKey }, bob.privateKey, 256));
        const alicePub = new Uint8Array(await crypto.subtle.exportKey("raw", alice.publicKey));
        const bobPub = new Uint8Array(await crypto.subtle.exportKey("raw", bob.publicKey));
        const match = toHex(aliceSecret) === toHex(bobSecret);
        ecdhOut.textContent = "Alice public " + toHex(alicePub) + ". Bob public " + toHex(bobPub) + ". Alice secret " + toHex(aliceSecret) + ". Bob secret " + toHex(bobSecret) + ". " + (match ? "The secrets match." : "The secrets do not match.") + " Private keys stayed on their own side and are not shown.";
      } catch (err) {
        ecdhOut.textContent = "Key agreement failed. " + (err && err.message ? err.message : "");
      }
    });

    const signMsg = document.getElementById("sign-msg");
    const signButton = document.getElementById("sign-run");
    const verifyButton = document.getElementById("sign-verify");
    const signOut = document.getElementById("sign-out");
    let signPair = null;
    let signature = null;
    let signedText = "";

    if (signButton) signButton.addEventListener("click", async function () {
      if (!signOut) return;
      if (cryptoUnavailable(signOut)) return;
      const message = signMsg ? signMsg.value : "";
      if (!message) {
        signOut.textContent = "Write a message to sign.";
        return;
      }
      try {
        signPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
        signature = new Uint8Array(await crypto.subtle.sign(
          { name: "ECDSA", hash: "SHA-256" },
          signPair.privateKey,
          new TextEncoder().encode(message)
        ));
        signedText = message;
        const pub = new Uint8Array(await crypto.subtle.exportKey("raw", signPair.publicKey));
        signOut.textContent = "Signed with a new P-256 private key. Public key " + toHex(pub) + ". Signature " + toHex(signature) + ". ECDSA includes a random component, so signing again produces a different signature that still verifies. The private key is not shown.";
      } catch (err) {
        signOut.textContent = "Signing failed. " + (err && err.message ? err.message : "");
      }
    });

    if (verifyButton) verifyButton.addEventListener("click", async function () {
      if (!signOut) return;
      if (!signPair || !signature) {
        signOut.textContent = "Sign a message first.";
        return;
      }
      const message = signMsg ? signMsg.value : "";
      try {
        const ok = await crypto.subtle.verify(
          { name: "ECDSA", hash: "SHA-256" },
          signPair.publicKey,
          signature,
          new TextEncoder().encode(message)
        );
        if (ok && message === signedText) {
          signOut.textContent = "Verification passed. The public key matches the private key that signed this exact message.";
        } else if (ok) {
          signOut.textContent = "Verification passed.";
        } else {
          signOut.textContent = "Verification failed. The message does not match the signature. The signature was not updated.";
        }
      } catch (err) {
        signOut.textContent = "Verification failed. " + (err && err.message ? err.message : "");
      }
    });

    const tamper = document.getElementById("sign-tamper");
    if (tamper) tamper.addEventListener("click", function () {
      if (!signMsg) return;
      signMsg.value = signMsg.value + "!";
      if (signOut) signOut.textContent = "Added an exclamation mark. The signature is unchanged. Verify to see it fail.";
    });
  }

  initChrome();
  initLanding();
  initPlayer();
  initLabs();
  root.dataset.ready = "1";
})();
