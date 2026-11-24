#!/usr/bin/env python3
"""Authoring helper. GitHub Pages serves the HTML files directly."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = "https://yashtap1245-tech.github.io"
NAV = [
    ("../#about", "About"),
    ("../#skills", "Skills"),
    ("../#experience", "Experience"),
    ("../#projects", "Projects"),
    ("index.html", "Learn with Me"),
    ("../#contact", "Contact"),
]
SIDE = [
    ("dns", "dns.html", "URL lookup"),
    ("tcp", "tcp.html", "TCP"),
    ("tls", "tls.html", "TLS"),
    ("certificates", "certificates.html", "Certificates"),
    ("hashing", "hashing.html", "Hashing"),
    ("encryption", "encryption.html", "Encryption"),
]


def esc(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def chrome(title, description, canonical, lesson_id, body, json_ld, extra_head=""):
    nav = "\n".join(
        f'        <li><a href="{href}"{" aria-current=\"page\"" if label == "Learn with Me" else ""}>{label}</a></li>'
        for href, label in NAV
    )
    side = "\n".join(
        f'          <li><a href="{href}"{" aria-current=\"page\"" if lid == lesson_id else ""}>{label}</a></li>'
        for lid, href, label in SIDE
    )
    lesson_attr = f' data-lesson="{lesson_id}"' if lesson_id else ""
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="dark" class="no-js"{lesson_attr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>
    document.documentElement.classList.remove("no-js");
    try {{
      var savedTheme = localStorage.getItem("yt-theme");
      if (savedTheme === "light" || savedTheme === "dark") {{
        document.documentElement.setAttribute("data-theme", savedTheme);
      }}
    }} catch (err) {{}}
  </script>
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="author" content="Yash Tapadiya">
  <meta name="theme-color" content="#0f1815">
  <link rel="canonical" href="{canonical}">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="Yash Tapadiya">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{SITE}/data/portrait.jpg">
  <meta property="og:image:alt" content="Portrait of Yash Tapadiya">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{SITE}/data/portrait.jpg">
  <link rel="preload" href="../fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../fonts/source-sans-3.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../css/site.css">
  <link rel="stylesheet" href="css/learn.css">
  {extra_head}
  <script type="application/ld+json">
  {json_ld}
  </script>
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="site-header" id="site-header">
    <a class="logo" href="../">Yash Tapadiya</a>
    <nav class="site-nav" id="site-nav" aria-label="Sections">
      <ul class="nav-links">
{nav}
      </ul>
    </nav>
    <div class="nav-actions">
      <button type="button" class="theme-toggle" id="theme-toggle" aria-pressed="false" aria-label="Switch to light mode">
        <span class="theme-toggle-label">Light</span>
      </button>
      <a class="btn btn-primary nav-hire" href="mailto:yashtap1245@gmail.com">Contact Me</a>
      <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
    </div>
    <div class="scroll-progress" aria-hidden="true"><span id="scroll-progress"></span></div>
  </header>
  <main id="content" tabindex="-1">
{body}
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <p>© 2026 Yash Tapadiya · <a href="../">Portfolio</a> · Learn with Me</p>
    </div>
  </footer>
  <script src="js/learn.js"></script>
</body>
</html>
"""


def steps_html(steps):
    parts = []
    for index, step in enumerate(steps):
        current = " is-current" if index == 0 else ""
        lab = f' data-open-lab="{step["lab"]}"' if step.get("lab") else ""
        body = "\n".join(f"            {para}" for para in step["body"])
        parts.append(
            f"""          <section class="step{current}" data-frame="{step["id"]}"{lab}>
            <h2>{esc(step["title"])}</h2>
{body}
            <p class="key-idea"><span class="key-label">Key idea</span> {esc(step["idea"])}</p>
          </section>"""
        )
    return "\n".join(parts)


def quiz_html(questions):
    blocks = []
    for question in questions:
        choices = "\n".join(
            f'            <label><input type="radio" name="{question["name"]}" value="{value}"> {esc(label)}</label>'
            for value, label in question["choices"]
        )
        blocks.append(
            f"""        <fieldset data-answer="{question["answer"]}" data-why="{esc(question["why"])}">
          <legend>{esc(question["q"])}</legend>
{choices}
        </fieldset>"""
        )
    return "\n".join(blocks)


def lesson_page(lesson, labs=""):
    points = "\n".join(f"          <li>{esc(point)}</li>" for point in lesson["points"])
    takeaways = "\n".join(f"          <li>{esc(item)}</li>" for item in lesson["takeaways"])
    sources = " · ".join(
        f'<a href="{href}" target="_blank" rel="noopener noreferrer">{esc(name)}</a>'
        for name, href in lesson["sources"]
    )
    prev_link = f'<a href="{lesson["prev"][0]}">Previous · {esc(lesson["prev"][1])}</a>' if lesson.get("prev") else "<span></span>"
    next_link = f'<a href="{lesson["next"][0]}">Next · {esc(lesson["next"][1])}</a>' if lesson.get("next") else "<span></span>"
    body = f"""    <div class="learn-layout">
      <nav class="course-nav" aria-label="Lessons">
        <p>Lessons</p>
        <ol>
{side_links(lesson["id"])}
        </ol>
      </nav>
      <article>
        <header class="lesson-intro">
          <p class="lesson-kicker">{esc(lesson["kicker"])}</p>
          <h1>{esc(lesson["title"])}</h1>
          <p class="lede">{lesson["lede"]}</p>
          <ul class="learn-points">
{points}
          </ul>
        </header>
        <div class="stage">
          <div class="diagram-panel">
            <div id="diagram" aria-hidden="true"></div>
            <p id="diagram-caption" class="diagram-caption"></p>
          </div>
          <div class="step-column">
            <div id="step-live">
              <p id="step-count" class="step-count" aria-live="polite"></p>
              <div id="steps">
{steps_html(lesson["steps"])}
              </div>
            </div>
            <div class="controls">
              <button type="button" id="prev">Previous</button>
              <button type="button" id="replay">Replay</button>
              <button type="button" id="play" aria-pressed="false">Play</button>
              <button type="button" id="next" class="is-primary">Next</button>
            </div>
            <p class="control-hint">Arrow keys move between steps while a control in this lesson is focused.</p>
            <ol class="stepper" id="stepper" aria-label="Steps"></ol>
          </div>
        </div>
{labs}
        <section class="takeaways" id="takeaways" aria-labelledby="takeaways-title">
          <h2 id="takeaways-title">Takeaways</h2>
          <ul>
{takeaways}
          </ul>
        </section>
        <section class="quiz" id="quiz" aria-labelledby="quiz-title">
          <h2 id="quiz-title" tabindex="-1">Check yourself</h2>
{quiz_html(lesson["quiz"])}
          <button type="button" class="btn btn-primary" data-quiz>Check answers</button>
          <p class="quiz-result" role="status"></p>
        </section>
        <p class="sources">Sources: {sources}. Pictures use small stand-in numbers so the steps are easy to see. They are teaching models, not a packet capture.</p>
        <nav class="pager" aria-label="More lessons">
          {prev_link}
          {next_link}
        </nav>
      </article>
    </div>"""
    data = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": lesson["title"],
        "description": lesson["description"],
        "url": f"{SITE}/learn/{lesson['file']}",
        "isAccessibleForFree": True,
        "inLanguage": "en",
        "learningResourceType": "lesson",
        "teaches": lesson["teaches"],
        "author": {
            "@type": "Person",
            "name": "Yash Tapadiya",
            "url": f"{SITE}/",
        },
    }
    return chrome(
        f"{lesson['title']} — Learn with Me",
        lesson["description"],
        f"{SITE}/learn/{lesson['file']}",
        lesson["id"],
        body,
        json.dumps(data, indent=2),
    )


def side_links(lesson_id):
    return "\n".join(
        f'          <li><a href="{href}"{" aria-current=\"page\"" if lid == lesson_id else ""}>{label}</a></li>'
        for lid, href, label in SIDE
    )


HASH_LABS = """
        <section class="lab" id="lab-hash" aria-labelledby="hash-title">
          <h2 id="hash-title">A real SHA-256</h2>
          <p>Both digests are computed in this browser with Web Crypto. Nothing is uploaded.</p>
          <label for="hash-input">Text</label>
          <input id="hash-input" type="text" value="connection" autocomplete="off" spellcheck="false">
          <output id="hash-hex" class="hex"></output>
          <label for="hash-flip">The same text, with one character changed</label>
          <input id="hash-flip" type="text" value="connexction" autocomplete="off" spellcheck="false">
          <output id="hash-hex-2" class="hex"></output>
          <p id="hash-distance" class="distance" role="status"></p>
        </section>
        <section class="lab" id="lab-password" aria-labelledby="pw-title">
          <h2 id="pw-title">Salt, then slow the hash down</h2>
          <p>Use a throwaway word, not a real password. This field is plain text so the browser does not offer to save it. PBKDF2-HMAC-SHA-256 at 100,000 iterations shows a salt and a time cost. <a href="https://www.rfc-editor.org/rfc/rfc9106" target="_blank" rel="noopener noreferrer">Argon2</a> is the better choice for a new system. OWASP recommends a higher iteration count than this demo uses when PBKDF2 is the tool you have.</p>
          <label for="pw">Throwaway word</label>
          <input id="pw" type="text" autocomplete="off" spellcheck="false" placeholder="not a real password">
          <div class="lab-actions">
            <button type="button" class="btn btn-primary" id="pw-new">Hash with a new salt</button>
            <button type="button" class="btn btn-ghost" id="pw-same">Repeat with the same salt</button>
            <button type="button" class="btn btn-ghost" id="pw-fast">Compare with plain SHA-256</button>
          </div>
          <p id="pw-out" class="lab-out" role="status"></p>
        </section>
"""

ENCRYPT_LABS = """
        <section class="lab" id="lab-aes" aria-labelledby="aes-title">
          <h2 id="aes-title">Encrypt and decrypt with AES-GCM</h2>
          <p>The key is generated in this page and stays here. Each encryption uses a fresh 96-bit nonce. Flipping one ciphertext byte should make decryption return nothing.</p>
          <label for="aes-plain">Message</label>
          <textarea id="aes-plain">GET /docs</textarea>
          <div class="lab-actions">
            <button type="button" class="btn btn-primary" id="aes-encrypt">Encrypt</button>
            <button type="button" class="btn btn-ghost" id="aes-decrypt">Decrypt</button>
            <button type="button" class="btn btn-ghost" id="aes-flip">Flip one ciphertext byte</button>
          </div>
          <p id="aes-out" class="lab-out" role="status"></p>
        </section>
        <section class="lab" id="lab-ecdh" aria-labelledby="ecdh-title">
          <h2 id="ecdh-title">Agree on a secret with ECDH</h2>
          <p>Alice and Bob each generate a P-256 key pair. Only the public keys are shown. TLS 1.3 often uses X25519 for this step. P-256 is the same Diffie-Hellman shape, and Web Crypto can run it here.</p>
          <div class="lab-actions">
            <button type="button" class="btn btn-primary" id="ecdh-run">Derive a shared secret</button>
          </div>
          <p id="ecdh-out" class="lab-out" role="status"></p>
        </section>
        <section class="lab" id="lab-sign" aria-labelledby="sign-title">
          <h2 id="sign-title">Sign, then change one character</h2>
          <p>ECDSA P-256 signs a SHA-256 hash of the message. The message itself is not hidden. Signing the same words again produces a different signature, because ECDSA uses a random component, and both signatures still verify.</p>
          <label for="sign-msg">Message</label>
          <textarea id="sign-msg">example.com</textarea>
          <div class="lab-actions">
            <button type="button" class="btn btn-primary" id="sign-run">Sign</button>
            <button type="button" class="btn btn-ghost" id="sign-verify">Verify</button>
            <button type="button" class="btn btn-ghost" id="sign-tamper">Add an exclamation mark</button>
          </div>
          <p id="sign-out" class="lab-out" role="status"></p>
        </section>
"""


def P(*paragraphs):
    return [f"<p>{paragraph}</p>" for paragraph in paragraphs]


LESSONS = [
    {
        "id": "dns",
        "file": "dns.html",
        "title": "What happens when you type a URL",
        "description": "Follow a browser from the address bar through caches, a recursive resolver, the root, a top-level domain, and the authoritative DNS server that returns an IP address.",
        "teaches": "DNS resolution from the address bar to an IP address",
        "kicker": "Lesson 1 of 6",
        "lede": "You press Enter on <code>https://example.com/docs</code>. The browser has a name. The internet routes by number. DNS is the lookup that connects the two, and it does not fetch the page.",
        "points": [
            "How a URL splits into scheme, host, port, and path",
            "Why caches and the TTL stop a lookup from running every time",
            "How a resolver walks root, top-level domain, and authoritative server",
        ],
        "steps": [
            {
                "id": "parse",
                "title": "A name, not a number",
                "body": P(
                    "You type <code>https://example.com/docs</code> and press Enter. The browser splits that string before it talks to anyone. The scheme is <code>https</code>. The host is <code>example.com</code>. The path is <code>/docs</code>. No port is written, and the scheme is HTTPS, so the port is 443.",
                    "Machines on the internet forward packets by IP address. The host is a name for people. The next job is to find an address for it.",
                ),
                "idea": "The address bar is for people. Routing uses numbers.",
            },
            {
                "id": "cache",
                "title": "Look nearby first",
                "body": P(
                    "The browser checks its own DNS cache. A fresh answer for <code>example.com</code> ends the lookup. On a miss, the operating system checks its cache and the hosts file, a local list of names written by hand.",
                    "A cached answer stays fresh only for its TTL, a lifetime in seconds published with the record. When that lifetime is up, the answer is not reused.",
                ),
                "idea": "Many lookups never leave the machine. A cache hit is limited by the TTL.",
            },
            {
                "id": "resolver",
                "title": "Hand the job to a resolver",
                "body": P(
                    "On a miss, a stub resolver on the computer sends one question to a recursive resolver. The network usually provides that resolver. Some people set a public one, such as <code>1.1.1.1</code> or <code>8.8.8.8</code>. A classic query is DNS on UDP port 53.",
                    "If the browser is configured for DNS over HTTPS, it asks a resolver itself, inside HTTPS, and may skip the operating system's resolver. Either way, the browser does not normally walk the hierarchy. It asks one resolver to do that walking.",
                ),
                "idea": "Your computer asks a resolver. The resolver does the searching.",
            },
            {
                "id": "root",
                "title": "The root only knows the top-level domain",
                "body": P(
                    "The resolver starts at the root zone. Resolver software ships with a list of root servers, the root hints, so it knows where to send this first question.",
                    "A root server does not know the address of <code>example.com</code>. It knows who serves <code>.com</code>. The reply is a referral: name servers for <code>.com</code>, not the address you asked for.",
                ),
                "idea": "The root refers. It does not return the final address.",
            },
            {
                "id": "tld",
                "title": ".com knows who owns the name",
                "body": P(
                    "The resolver asks a <code>.com</code> server. That server does not return the address either. It refers the resolver to the authoritative name servers for <code>example.com</code>, the ones the domain owner configured.",
                    "Each level of the name points at the next level. The packets go from the resolver to that level and back. The root does not call <code>.com</code> on your behalf.",
                ),
                "idea": "Each level refers the resolver onward. The resolver makes every query.",
            },
            {
                "id": "auth",
                "title": "The authoritative server has the address",
                "body": P(
                    "The resolver asks a server that is authoritative for <code>example.com</code>. An <code>A</code> record is an IPv4 address. An <code>AAAA</code> record is an IPv6 address. Both can exist. The answer includes a TTL.",
                    "In this picture the addresses are <code>203.0.113.10</code> and <code>2001:db8::10</code>, and the TTL is 300 seconds. Those addresses are reserved for documentation by RFC 5737 and RFC 3849. They are not a live site. A real zone owner chooses the real records and the real TTL.",
                ),
                "idea": "Only the authoritative server answers with the address. The TTL says how long to remember it.",
            },
            {
                "id": "answer",
                "title": "Back to the browser, then into a cache",
                "body": P(
                    "The resolver caches the answer for the TTL and returns it to the computer. The browser can open a connection to one of those addresses on port 443.",
                    "If both IPv6 and IPv4 come back, the browser may try them together and keep the one that connects first. That race is Happy Eyeballs, RFC 8305. If a UDP answer is too big, the server can set a truncation flag and the resolver retries over TCP. DNS is not UDP-only.",
                ),
                "idea": "The lookup is finished when the browser holds an address. The page has not been fetched.",
            },
            {
                "id": "recap",
                "title": "A name became a number",
                "body": P(
                    "Parse the URL, check the caches, ask a recursive resolver, follow referrals from the root to <code>.com</code> to the authoritative server, and remember the answer for the TTL.",
                    "DNS answered where to connect. It did not load <code>/docs</code>, and it did not make the connection private. The next lesson is the reliable pipe to that address.",
                ),
                "idea": "DNS answers where. TCP is how the bytes get there.",
            },
        ],
        "takeaways": [
            "The browser splits a URL, then looks for an IP address. DNS does not return the page.",
            "Caches are limited by the TTL. A recursive resolver walks the hierarchy. The browser usually does not.",
            "Root and top-level servers refer. The authoritative server returns A and AAAA records.",
        ],
        "quiz": [
            {
                "name": "dns-q1",
                "q": "What does a successful DNS lookup give the browser?",
                "answer": "ip",
                "why": "DNS returns records such as IP addresses. Fetching the page is a later connection.",
                "choices": [
                    ("page", "The HTML of the page"),
                    ("ip", "An IP address it can connect to"),
                    ("key", "A TLS session key"),
                ],
            },
            {
                "name": "dns-q2",
                "q": "Who walks from the root to the authoritative server in a normal lookup?",
                "answer": "resolver",
                "why": "A stub on your computer asks a recursive resolver. That resolver queries root, the top-level domain, and the authoritative server.",
                "choices": [
                    ("browser", "The browser itself asks the root, the top-level domain, and the authoritative server"),
                    ("resolver", "A recursive resolver the computer is configured to use"),
                    ("push", "The authoritative server pushes the address out in advance"),
                ],
            },
            {
                "name": "dns-q3",
                "q": "What stops a cached DNS answer from being reused forever?",
                "answer": "ttl",
                "why": "The zone publishes a TTL. After that many seconds, the cached answer is stale.",
                "choices": [
                    ("ttl", "The TTL published with the record"),
                    ("tcp", "TCP retransmission"),
                    ("cert", "The certificate expiry date"),
                ],
            },
        ],
        "sources": [
            ("RFC 1034", "https://www.rfc-editor.org/rfc/rfc1034"),
            ("RFC 1035", "https://www.rfc-editor.org/rfc/rfc1035"),
            ("RFC 8305", "https://www.rfc-editor.org/rfc/rfc8305"),
            ("RFC 7766", "https://www.rfc-editor.org/rfc/rfc7766"),
        ],
        "next": ("tcp.html", "How TCP carries a conversation"),
    },
    {
        "id": "tcp",
        "file": "tcp.html",
        "title": "How TCP carries a conversation",
        "description": "See the TCP/IP layers, ports, the three-way handshake, retransmission, and connection teardown, with the sequence numbers shown.",
        "teaches": "TCP connections, the three-way handshake, retransmission, and teardown",
        "kicker": "Lesson 2 of 6",
        "lede": "DNS found an address. TCP opens a reliable, ordered byte stream to it, notices when a segment goes missing, and closes the conversation with receipts. It does not hide the bytes.",
        "points": [
            "The four TCP/IP layers, and the four-tuple that names a connection",
            "SYN, SYN-ACK, and ACK, including what the sequence numbers mean",
            "Retransmission when an acknowledgment does not arrive, then a clean close",
        ],
        "steps": [
            {
                "id": "layers",
                "title": "Four wrappers around the same bytes",
                "body": P(
                    "The internet's working model has four layers. The HTTP request is application data. TCP adds ports and sequence numbers. IP adds the source and destination addresses. The link layer, Wi-Fi or Ethernet, carries that packet across the local network.",
                    "A router forwards on the IP address. It does not have to understand HTTP. Each hop removes the link frame and builds a new one for the next link. This is the model in RFC 1122. The seven-layer OSI picture is a teaching map. Packets on the wire follow these four.",
                ),
                "idea": "A packet is the same payload, wrapped. Each layer reads its own wrapper.",
            },
            {
                "id": "ports",
                "title": "Ports choose the program",
                "body": P(
                    "An IP address identifies a machine. A port identifies a program on that machine. Ports are numbers from 0 to 65535. HTTPS servers listen on 443. Ordinary HTTP uses 80. DNS uses 53.",
                    "The browser also picks a temporary source port, often called an ephemeral port. <code>51422</code> in the picture is an example, and both IP addresses are documentation addresses. A connection is the four-tuple: source IP, source port, destination IP, destination port. That is how two tabs can talk to the same site at once.",
                ),
                "idea": "The address finds the machine. The port finds the program. The four-tuple finds the conversation.",
            },
            {
                "id": "syn",
                "title": "SYN starts the handshake",
                "body": P(
                    "TCP does not put the page in the first packet. Each side needs the other's initial sequence number. Those numbers let the receiver put bytes back in order and notice a gap.",
                    "The browser sends a segment with the SYN flag. Its initial sequence number is written here as 1000. Real initial sequence numbers are unpredictable. 1000 is a small stand-in so the arithmetic stays visible. A SYN consumes one sequence number, so the next byte the browser sends will be numbered 1001.",
                ),
                "idea": "SYN means: I want a connection, and my byte count starts here.",
            },
            {
                "id": "synack",
                "title": "SYN-ACK answers",
                "body": P(
                    "The server replies with SYN and ACK both set. SYN carries the server's own initial sequence number, 5000 in this picture. ACK 1001 means the server has the browser's SYN, and the next byte it expects is 1001.",
                    "The server's SYN consumes one sequence number too. Its next send will be 5001. RFC 9293 is the current TCP specification. The plus-one rule is the same one older books taught from RFC 793.",
                ),
                "idea": "SYN-ACK is the server's sequence number, plus a receipt for yours.",
            },
            {
                "id": "ack",
                "title": "ACK opens the connection",
                "body": P(
                    "The browser sends an acknowledgment of 5001. It is saying it has the server's SYN, and the next byte it expects from the server is 5001. This segment's own sequence number is 1001.",
                    "The handshake is finished. Both starting numbers are confirmed, and the connection is established. The HTTP request still has not been sent. It can ride next, as ordinary data, starting at sequence 1001.",
                ),
                "idea": "The third step is a receipt. After it, either side may send data.",
            },
            {
                "id": "loss",
                "title": "A lost segment is sent again",
                "body": P(
                    "IP is allowed to drop packets. TCP plans for that. Suppose the browser sends 100 bytes at sequence 1001 and that segment disappears. The browser keeps a copy until those bytes are acknowledged. If the acknowledgment does not arrive in time, it sends the same bytes again. The wait is the retransmission timeout, computed from the round-trip time (RFC 6298).",
                    "If later bytes do arrive, the receiver repeats an acknowledgment of the byte it is still missing. After duplicate acknowledgments, the sender can retransmit without waiting out the full timer. That is fast retransmit (RFC 5681). A bad checksum is dropped too, which looks like a loss, and the sender tries again.",
                ),
                "idea": "Reliability is a copy kept until it is acknowledged, and a resend when it is not.",
            },
            {
                "id": "close",
                "title": "Four steps to hang up",
                "body": P(
                    "Either side can close. Here the browser is finished, after the 100 data bytes from the previous step. It sends a FIN at sequence 1101. A FIN consumes one sequence number.",
                    "The server acknowledges 1102, then sends its own FIN at sequence 5001, because this picture's server never sent application data. The browser acknowledges 5002. The server's acknowledgment and FIN are sometimes combined into one segment. The side that sent the first FIN waits in TIME-WAIT, so a delayed duplicate from this connection cannot be mistaken for a new one that reused the same four-tuple.",
                ),
                "idea": "Closing is its own handshake. Each side gets a receipt for its FIN.",
            },
            {
                "id": "recap",
                "title": "Reliable, and still readable",
                "body": P(
                    "TCP gave the browser a byte stream that arrives in order, fills gaps by retransmission, and closes with receipts. Anyone on the path can still read a plain TCP payload.",
                    "UDP, which ordinary DNS queries often use, skips this handshake and does not retransmit for you. That is why a DNS answer can finish in one round trip, and why DNS has to cope with loss itself. Privacy for the HTTP bytes is the next lesson.",
                ),
                "idea": "TCP is reliable delivery. It is not encryption.",
            },
        ],
        "takeaways": [
            "A TCP connection is the four-tuple of two IP addresses and two ports.",
            "The handshake is SYN, SYN-ACK, ACK. Each SYN consumes a sequence number, so the acknowledgments are those numbers plus one.",
            "The sender keeps data until it is acknowledged and resends if it is not. Closing uses FIN segments and receipts.",
        ],
        "quiz": [
            {
                "name": "tcp-q1",
                "q": "What is the point of the three-way handshake?",
                "answer": "open",
                "why": "Each side learns the other's initial sequence number and confirms it. Encryption is TLS, and the address lookup was DNS.",
                "choices": [
                    ("open", "To agree on initial sequence numbers and open a connection both sides accept"),
                    ("encrypt", "To encrypt the first HTTP request"),
                    ("dns", "To look up the IP address"),
                ],
            },
            {
                "name": "tcp-q2",
                "q": "A segment is lost. What does TCP do?",
                "answer": "resend",
                "why": "The sender keeps unacknowledged bytes and retransmits. The receiver does not invent the missing bytes.",
                "choices": [
                    ("skip", "It delivers what arrived and ignores the gap"),
                    ("resend", "The sender retransmits if the acknowledgment does not arrive"),
                    ("dns", "DNS looks the address up again"),
                ],
            },
            {
                "name": "tcp-q3",
                "q": "Which values identify one TCP connection?",
                "answer": "tuple",
                "why": "Source IP, source port, destination IP, and destination port. The URL and the TLS keys are different layers.",
                "choices": [
                    ("tuple", "Source IP, source port, destination IP, and destination port"),
                    ("url", "The URL, a cookie, the TLS version, and the cipher"),
                    ("mac", "The MAC address alone"),
                ],
            },
        ],
        "sources": [
            ("RFC 9293", "https://www.rfc-editor.org/rfc/rfc9293"),
            ("RFC 1122", "https://www.rfc-editor.org/rfc/rfc1122"),
            ("RFC 6298", "https://www.rfc-editor.org/rfc/rfc6298"),
            ("RFC 5681", "https://www.rfc-editor.org/rfc/rfc5681"),
        ],
        "prev": ("dns.html", "What happens when you type a URL"),
        "next": ("tls.html", "How TLS builds a private channel"),
    },
]


def tls_and_rest():
    return [
        {
            "id": "tls",
            "file": "tls.html",
            "title": "How TLS builds a private channel",
            "description": "Walk the TLS 1.3 handshake: ClientHello, ServerHello, encrypted certificates, Finished, and how that differs from TLS 1.2.",
            "teaches": "The TLS 1.3 handshake and what it hides",
            "kicker": "Lesson 3 of 6",
            "lede": "TCP can deliver every byte in order while anyone on the path reads or changes it. TLS 1.3 turns that pipe into an encrypted, integrity-checked channel, and the server proves its name. This is the current version of the protocol, RFC 8446.",
            "points": [
                "What ClientHello and ServerHello actually exchange",
                "Why the TLS 1.3 certificate is encrypted, and what Finished checks",
                "What a network observer can still see, including SNI",
            ],
            "steps": [
                {
                    "id": "shared",
                    "title": "The path is shared",
                    "body": P(
                        "Between your machine and the server are routers, and often a café network or a company proxy. TCP does not stop those machines from reading the payload. The IP address is on every packet. DNS has already turned the name into that address.",
                        "TLS has three jobs: hide the contents, detect tampering, and check that the server is the one named in the URL. This lesson follows HTTPS on TCP, still a common path. HTTP/3 carries the same TLS ideas inside QUIC, on UDP, rather than as a separate layer on top of TCP.",
                    ),
                    "idea": "A reliable connection is not a private one.",
                },
                {
                    "id": "clienthello",
                    "title": "ClientHello offers the terms",
                    "body": P(
                        "The browser sends ClientHello first. It carries a random nonce, the TLS versions it will accept, a list of cipher suites, a Diffie-Hellman key share (often the group X25519), the signature algorithms it can check, and the server name in the SNI extension.",
                        "SNI tells a server that hosts many sites which certificate to present. In the usual handshake that name is readable on the network. Encrypted Client Hello exists, and most connections do not use it yet. TLS hides the page. It does not, by itself, hide which site you asked for.",
                    ),
                    "idea": "ClientHello is an offer: versions, ciphers, a key share, and the site name.",
                },
                {
                    "id": "serverhello",
                    "title": "ServerHello locks in a shared secret",
                    "body": P(
                        "The server chooses a version and a cipher and sends its own key share in ServerHello. TLS 1.3 requires implementations to support <code>TLS_AES_128_GCM_SHA256</code>. A typical handshake selects that suite, or another AEAD suite such as AES-256-GCM or ChaCha20-Poly1305.",
                        "Each side combines its private key share with the other side's public key share. Ephemeral Diffie-Hellman gives them the same shared secret, and the private shares are never sent. If those private shares are thrown away, a recording of today's handshake does not reveal the secret later. That is forward secrecy. TLS then stretches the secret with HKDF into separate keys, so handshake messages and application data do not share a key.",
                    ),
                    "idea": "The two key shares create one shared secret. The private halves never cross the network.",
                },
                {
                    "id": "cert",
                    "title": "The certificate arrives encrypted",
                    "body": P(
                        "Everything after ServerHello is encrypted with the handshake keys. The server sends EncryptedExtensions, including ALPN, where the two sides can agree on HTTP/2 or another application protocol. Then it sends Certificate, CertificateVerify, and Finished.",
                        "Certificate carries the leaf and, usually, the intermediates. It does not need to carry the root. The browser already has roots in its trust store, and a root that arrives in the handshake is not what makes a root trusted. CertificateVerify is a signature over the handshake transcript, made with the private key that matches the certificate. Possessing a copy of the certificate is not enough. The server has to prove it holds the private key.",
                    ),
                    "idea": "In TLS 1.3 the certificate is encrypted, and a signature proves the server holds the private key.",
                },
                {
                    "id": "finished",
                    "title": "Finished locks the transcript",
                    "body": P(
                        "The server's Finished is a MAC over everything in the handshake so far, using a key derived from the shared secret. The browser checks it, then sends its own Finished. If the transcripts match, both sides are confirmed to hold the same keys.",
                        "In the common case this is one round trip: ClientHello out, the server's flight back, and the browser's Finished, which can travel with the first HTTP request. There is also a 0-RTT mode that sends application data with ClientHello. Those early bytes are not forward secret, and they can be replayed. A normal page load does not need that mode.",
                    ),
                    "idea": "Finished means both sides saw the same handshake and hold the same keys.",
                },
                {
                    "id": "http",
                    "title": "The request rides inside",
                    "body": P(
                        "The browser now sends the request for <code>/docs</code>, headers included, as TLS application data under the application traffic keys. The response comes back the same way. An observer can see sizes and timing. They cannot read the path, the headers, or the body, and a changed byte fails the authentication tag.",
                        "When the session ends, TLS sends <code>close_notify</code> so a cutoff is not mistaken for a clean end. TCP then runs the shutdown from the previous lesson.",
                    ),
                    "idea": "HTTP is the message. TLS is the sealed envelope it travels in.",
                },
                {
                    "id": "tls12",
                    "title": "What TLS 1.2 did differently",
                    "body": P(
                        "Older write-ups describe a different handshake. TLS 1.2 often took two round trips, and the certificate was visible before encryption began. Some suites used RSA key transport: the client encrypted a premaster secret to the server's long-term public key. Those suites have no forward secrecy.",
                        "TLS 1.3 removes static RSA key transport. Key agreement is ephemeral Diffie-Hellman, and the records use an AEAD cipher. If a picture shows the certificate in the clear, check which version it is teaching.",
                    ),
                    "idea": "TLS 1.3 encrypts the certificate and drops key exchange that cannot provide forward secrecy.",
                },
                {
                    "id": "recap",
                    "title": "Keys, then proof, then the page",
                    "body": P(
                        "ClientHello offers a key share and names the site. ServerHello answers with a key share. Both sides derive keys. The certificate and a signature arrive encrypted. Finished confirms the transcript. HTTP follows inside.",
                        "The next lesson is the certificate itself: the chain, the name check, the dates, and revocation.",
                    ),
                    "idea": "The handshake agrees on keys and checks the server. The page comes after.",
                },
            ],
            "takeaways": [
                "TLS 1.3 hides bytes, detects changes, and authenticates the server. TCP did none of those.",
                "Key shares create a shared secret that is never sent. The certificate and CertificateVerify come after, already encrypted.",
                "SNI usually still reveals the site name. TLS 1.2 diagrams that show a cleartext certificate are teaching the older handshake.",
            ],
            "quiz": [
                {
                    "name": "tls-q1",
                    "q": "In TLS 1.3, when does the server send its certificate?",
                    "answer": "after",
                    "why": "Messages after ServerHello are encrypted with the handshake keys. A cleartext certificate is the TLS 1.2 picture.",
                    "choices": [
                        ("clear", "In the clear, before any keys exist"),
                        ("after", "After the key shares, encrypted under the handshake keys"),
                        ("click", "Only after the user clicks the lock icon"),
                    ],
                },
                {
                    "name": "tls-q2",
                    "q": "What produces the shared secret in a typical TLS 1.3 handshake?",
                    "answer": "dh",
                    "why": "Each side combines its private key share with the peer's public key share. The secret is not sent, and it is not a hash of the URL.",
                    "choices": [
                        ("password", "The server encrypts a session key with the user's password"),
                        ("dh", "Ephemeral Diffie-Hellman from the two key shares"),
                        ("hash", "SHA-256 of the URL"),
                    ],
                },
                {
                    "name": "tls-q3",
                    "q": "What does Finished check?",
                    "answer": "transcript",
                    "why": "Finished is a MAC over the handshake. Both sides must have seen the same messages and derived the same keys.",
                    "choices": [
                        ("transcript", "That both sides saw the same handshake and hold the same keys"),
                        ("ttl", "That the DNS TTL has not expired"),
                        ("images", "That the page contains no images"),
                    ],
                },
            ],
            "sources": [
                ("RFC 8446", "https://www.rfc-editor.org/rfc/rfc8446"),
                ("MDN: TLS", "https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security"),
                ("RFC 6066", "https://www.rfc-editor.org/rfc/rfc6066"),
            ],
            "prev": ("tcp.html", "How TCP carries a conversation"),
            "next": ("certificates.html", "How a certificate earns trust"),
        },
        {
            "id": "certificates",
            "file": "certificates.html",
            "title": "How a certificate earns trust",
            "description": "Learn how browsers check a certificate chain: signatures, subject alternative names, dates, revocation, and the local root store.",
            "teaches": "Certificate chains, signatures, names, expiry, and revocation",
            "kicker": "Lesson 4 of 6",
            "lede": "TLS asked the server to prove its name. The proof is a certificate chain the browser can check on its own. A certificate is a signed claim about a public key. It is not a review of the website.",
            "points": [
                "What a leaf, an intermediate, and a root each do",
                "How a signature, a name, and a pair of dates are checked",
                "Why a certificate can be rejected while it still looks official",
            ],
            "steps": [
                {
                    "id": "claim",
                    "title": "A certificate is a signed claim",
                    "body": P(
                        "A certificate binds a public key to a name, for a span of dates, and carries the issuer's signature over those fields. It says this issuer asserts that this public key belongs with this name. It does not say the page is honest, fast, or free of bugs.",
                        "The check uses the subject alternative name, the validity dates, the public key, the issuer, and the signature. The signed body is fixed before the signature is attached. Change a letter and the signature fails. The names in this lesson are a teaching chain, not a real certificate.",
                    ),
                    "idea": "A certificate says a key belongs with a name. It is not a review of the page.",
                },
                {
                    "id": "chain",
                    "title": "Leaf, intermediate, root",
                    "body": P(
                        "The server presents the leaf for <code>example.com</code> and one or more intermediates. The leaf is signed by an intermediate. That intermediate is signed by a root. The root is in the browser or the operating-system trust store.",
                        "The server usually does not send the root. Sending a root in the handshake would not make it trusted. Trust starts from a root the browser already has, then follows signatures down to the leaf.",
                    ),
                    "idea": "Trust runs from a root you already have, through signatures, to the leaf.",
                },
                {
                    "id": "signature",
                    "title": "Check the signatures upward",
                    "body": P(
                        "The browser hashes the certificate body and checks the signature with the issuer's public key. It does this for the leaf, using the intermediate's key, then for the intermediate, using the root's key. RFC 5280 is the certificate profile these checks follow.",
                        "The root is trusted because it was installed, not because a server vouched for it just now. A normal leaf is not allowed to sign other certificates. An intermediate carries a basic constraint that marks it as a CA, and that flag is part of the check.",
                    ),
                    "idea": "Each signature must verify with the next key up. The root is local trust.",
                },
                {
                    "id": "name",
                    "title": "The name and the dates have to match",
                    "body": P(
                        "A real CA's signature is not enough. The certificate has to name the host in the URL. Modern browsers compare that host to the subject alternative name. A common name by itself does not pass.",
                        "A wildcard such as <code>*.example.com</code> covers one label, for example <code>www.example.com</code>. It does not cover <code>example.com</code>, and it does not cover <code>a.b.example.com</code>. The dates have to contain the current time. Outside <code>notBefore</code> and <code>notAfter</code>, the browser rejects the certificate even when the signature is perfect.",
                    ),
                    "idea": "The chain can be valid and still be the wrong name, or the right name at the wrong time.",
                },
                {
                    "id": "revoke",
                    "title": "A certificate can be withdrawn early",
                    "body": P(
                        "A private key can leak while the dates are still valid. The CA revokes the certificate. Browsers learn that from a certificate revocation list, or from OCSP, a status check defined in RFC 6960.",
                        "Asking the CA about every site would be slow, and it would tell the CA which sites you open. OCSP stapling lets the server attach a fresh signed status to the handshake, so the browser can check revocation without a separate call.",
                    ),
                    "idea": "Expiry is a deadline. Revocation is an early withdrawal, and it has to be signed.",
                },
                {
                    "id": "fail",
                    "title": "When the browser stops",
                    "body": P(
                        "The usual failures are specific. The name does not match. The certificate is outside its dates. The chain does not end at a trusted root. The certificate is revoked. A self-signed certificate is signed by its own key. Unless you installed that key as a trust anchor, there is no path to a root you trust.",
                        "Clicking through the warning tells the browser to accept an unauthenticated server for that site. The channel is then private only to whoever presented the certificate, which may not be the site you wanted.",
                    ),
                    "idea": "The warning means a check failed. The lock icon is those checks, not a general promise.",
                },
                {
                    "id": "recap",
                    "title": "A chain back to a root you have",
                    "body": P(
                        "Build a chain to a local root, verify each signature, match the name, check the dates, and check revocation. TLS used that result when it accepted CertificateVerify.",
                        "Signatures are computed over a hash of the certificate body. The next lesson is what a hash promises, and what it does not.",
                    ),
                    "idea": "Trust is a chain of signatures back to a root the browser already has.",
                },
            ],
            "takeaways": [
                "A certificate binds a public key to a name and a pair of dates. The issuer signs that claim.",
                "Browsers trust a root because it is in the local trust store, then check each signature down to the leaf.",
                "The name has to match the URL, the dates have to be current, and revocation can withdraw a certificate early.",
            ],
            "quiz": [
                {
                    "name": "cert-q1",
                    "q": "Why does a browser trust a root CA?",
                    "answer": "store",
                    "why": "The root is a trust anchor installed in the browser or the operating system. A website cannot appoint its own root by sending one.",
                    "choices": [
                        ("store", "Because that root's certificate is in the local trust store"),
                        ("says", "Because the website says the issuer is trustworthy"),
                        ("never", "Because root certificates never expire"),
                    ],
                },
                {
                    "name": "cert-q2",
                    "q": "Which name does a modern browser compare with the host in the URL?",
                    "answer": "san",
                    "why": "The subject alternative name is the name that has to match. A common name alone is not enough.",
                    "choices": [
                        ("cn", "Only the common name"),
                        ("san", "The subject alternative name"),
                        ("org", "The issuer's organization field"),
                    ],
                },
                {
                    "name": "cert-q3",
                    "q": "A certificate signature proves which statement?",
                    "answer": "signed",
                    "why": "The issuer's private key signed this certificate body. It does not review the site's contents or make the connection faster.",
                    "choices": [
                        ("signed", "The issuer's private key signed this certificate body"),
                        ("malware", "The site contains no malware"),
                        ("fast", "The connection will be fast"),
                    ],
                },
            ],
            "sources": [
                ("RFC 5280", "https://www.rfc-editor.org/rfc/rfc5280"),
                ("RFC 6125", "https://www.rfc-editor.org/rfc/rfc6125"),
                ("RFC 6960", "https://www.rfc-editor.org/rfc/rfc6960"),
                ("MDN: Certificate authority", "https://developer.mozilla.org/en-US/docs/Glossary/Certificate_authority"),
            ],
            "prev": ("tls.html", "How TLS builds a private channel"),
            "next": ("hashing.html", "What a hash actually promises"),
        },
        {
            "id": "hashing",
            "file": "hashing.html",
            "title": "What a hash actually promises",
            "description": "See what SHA-256 guarantees, watch the avalanche effect with a real digest, and why password storage needs a salt and a slow hash.",
            "teaches": "Cryptographic hashing, the avalanche effect, and password salts",
            "kicker": "Lesson 5 of 6",
            "lede": "Certificates and TLS keep using a hash. A cryptographic hash is a fingerprint of some bytes. It is not a lock, and by itself it is not a way to store a password.",
            "points": [
                "What SHA-256 promises, and why you cannot decrypt a hash",
                "The avalanche effect, computed in your browser",
                "Why a password hash needs a unique salt and a slow function",
            ],
            "steps": [
                {
                    "id": "fingerprint",
                    "title": "A fingerprint, not a lock",
                    "body": P(
                        "SHA-256 takes any bytes and returns 256 bits. The same input always produces the same digest. There is no key, and there is no reverse step. You do not decrypt a hash. You recompute it and compare.",
                        "TLS uses hashes inside key derivation and inside signatures. A certificate signature covers a hash of the certificate. It is not a second, hidden copy of the certificate.",
                    ),
                    "idea": "A hash is a fingerprint you can recompute. It has no key to unlock.",
                },
                {
                    "id": "length",
                    "title": "Any length in, 256 bits out",
                    "body": P(
                        "A short name and a disk image both become 32 bytes under SHA-256. That fixed size is why hashes can name large objects. It is also why a hash is not a compressed copy. Information is discarded on purpose, so many inputs could in theory share a digest.",
                        "SHA-256 is specified in FIPS 180-4. The digest is 64 hexadecimal characters. SHA-1 is retired for signatures because collisions were found. A cryptographic hash is built so that finding two inputs with the same digest is not practical.",
                    ),
                    "idea": "The output length never grows with the input. Collision resistance is what makes that usable.",
                },
                {
                    "id": "avalanche",
                    "title": "One character should scramble the digest",
                    "lab": "lab-hash",
                    "body": P(
                        "Change one character and about half of the output bits should flip, with no pattern you can follow back to the edit. That is the avalanche effect. You cannot nudge a hash toward a target by tweaking the input.",
                        "The demo under the controls computes real SHA-256 with Web Crypto, in this browser. Nothing is sent to a server. Edit either line. Differing hex digits are marked, and the bit count is measured, not guessed.",
                    ),
                    "idea": "A tiny input change produces a digest that looks unrelated. You can measure that here.",
                },
                {
                    "id": "properties",
                    "title": "Three things a cryptographic hash resists",
                    "body": P(
                        "Preimage resistance: given only a digest, finding an input that produces it is infeasible. Second-preimage resistance: given an input, finding a different input with the same digest is infeasible. Collision resistance: finding any two different inputs with the same digest is infeasible, even if you chose both.",
                        "These are statements about cost, not a claim that no second input exists. The output is 256 bits long, so collisions exist in theory. Nobody has a practical way to find a SHA-256 collision.",
                    ),
                    "idea": "The three resistances are: can't find the input, can't find a twin, can't find any colliding pair.",
                },
                {
                    "id": "passwords",
                    "title": "Passwords need a salt and a slow hash",
                    "lab": "lab-password",
                    "body": P(
                        "People reuse short passwords. SHA-256 is fast on purpose, so a fast hash lets an attacker try an enormous number of guesses. Equal passwords also produce equal digests, which is why a precomputed table works against them.",
                        "A salt is a unique random value stored next to each password hash. It is not a secret. It makes each input unique, so one table cannot be reused across users. The function should also be slow. Argon2 is the current first choice for new systems (RFC 9106). scrypt and bcrypt are in wide use. PBKDF2 is an older slowdown that Web Crypto can run here, at 100,000 iterations so the page stays responsive. That count is for the demo. It is not a production setting, and Argon2 is the stronger default.",
                    ),
                    "idea": "Store passwords with a unique salt and a slow password hash. Do not store them with plain SHA-256.",
                },
                {
                    "id": "recap",
                    "title": "A fingerprint with sharp edges",
                    "body": P(
                        "SHA-256 is deterministic, fixed length, and sensitive to small changes. It resists finding an input, a twin, or any collision. Password storage adds a salt and a function that is expensive to compute.",
                        "None of that hides a message behind a key. Encryption can be reversed by someone who should reverse it. That is the last lesson.",
                    ),
                    "idea": "Hashing fingerprints. Password hashing slows guessing. Encryption is a different tool.",
                },
            ],
            "takeaways": [
                "SHA-256 maps any input to 256 bits. The same input always matches. There is no key and no decryption.",
                "A small change should flip about half the bits. The demo measures a real digest, including the empty-input self-check inside the page.",
                "Password storage wants a unique salt and a slow hash such as Argon2. Plain SHA-256 is the wrong tool for that job.",
            ],
            "quiz": [
                {
                    "name": "hash-q1",
                    "q": "What should a cryptographic hash show after one character changes?",
                    "answer": "half",
                    "why": "Avalanche means the digest looks unrelated. It does not change only at the end, and it does not stay put.",
                    "choices": [
                        ("half", "The digest changes in about half its bits"),
                        ("tail", "Only the last four hex characters change"),
                        ("same", "Nothing, because hashes ignore small edits"),
                    ],
                },
                {
                    "name": "hash-q2",
                    "q": "Why is plain SHA-256 a poor way to store a password?",
                    "answer": "fast",
                    "why": "SHA-256 is fast, so guessing is cheap, and identical passwords share a digest unless a salt makes them unique. It is not decrypted with a private key.",
                    "choices": [
                        ("slow", "Because it is slow and already salted"),
                        ("fast", "Because it is fast, and equal passwords share a digest unless you salt them"),
                        ("decrypt", "Because it can be decrypted with the server's private key"),
                    ],
                },
                {
                    "name": "hash-q3",
                    "q": "What is a salt?",
                    "answer": "unique",
                    "why": "A salt is unique per password and stored with the hash. It is not secret, and it is not derived by reversing the password.",
                    "choices": [
                        ("unique", "A unique value stored with the hash. It is not a secret"),
                        ("shared", "One secret value reused for every user and kept only in memory"),
                        ("reverse", "The password spelled backward"),
                    ],
                },
            ],
            "sources": [
                ("FIPS 180-4", "https://csrc.nist.gov/pubs/fips/180-4/upd1/final"),
                ("RFC 9106", "https://www.rfc-editor.org/rfc/rfc9106"),
                ("RFC 8018", "https://www.rfc-editor.org/rfc/rfc8018"),
                ("MDN: SubtleCrypto.digest", "https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest"),
            ],
            "prev": ("certificates.html", "How a certificate earns trust"),
            "next": ("encryption.html", "Hiding data, and proving who sent it"),
        },
        {
            "id": "encryption",
            "file": "encryption.html",
            "title": "Hiding data, and proving who sent it",
            "description": "Compare symmetric AES-GCM with public-key pairs, try Diffie-Hellman and ECDSA in the browser, and see how TLS 1.3 combines them.",
            "teaches": "Symmetric encryption, Diffie-Hellman, and digital signatures",
            "kicker": "Lesson 6 of 6",
            "lede": "A hash cannot be unlocked. Encryption can, by someone with the right key. A signature does not hide the message. It lets anyone with the public key check that the private key was used on these exact bytes.",
            "points": [
                "AES-GCM, including what a flipped ciphertext byte does",
                "A Diffie-Hellman secret that is never transmitted",
                "A signature that verifies, then fails when the message changes",
            ],
            "steps": [
                {
                    "id": "jobs",
                    "title": "Two jobs",
                    "body": P(
                        "Hiding and proving are different jobs. Encryption hides bytes so a key holder can read them. A signature leaves the message readable and lets other people check that a specific private key produced a tag over this exact message.",
                        "TLS uses both. Ephemeral Diffie-Hellman agrees on a secret. AES-GCM hides the HTTP bytes and detects changes. The certificate signature proves the server holds the certified private key.",
                    ),
                    "idea": "Encryption hides. Signatures prove. A protocol that needs both uses both.",
                },
                {
                    "id": "symmetric",
                    "title": "One shared key",
                    "body": P(
                        "Symmetric encryption uses the same key to encrypt and to decrypt. AES is the standard block cipher. AES-GCM is an authenticated mode: it encrypts, and it attaches a tag. If the ciphertext or the tag changes, decryption fails closed and returns no plaintext.",
                        "The hard operational rule is the nonce. GCM wants a 96-bit nonce, and that nonce must not be reused with the same key. NIST SP 800-38D is the specification for GCM. The demo generates a new nonce every time you encrypt.",
                    ),
                    "idea": "One shared key locks and unlocks. The nonce must be unique for that key, and the tag detects tampering.",
                },
                {
                    "id": "aes",
                    "title": "Watch AES-GCM refuse a flipped byte",
                    "lab": "lab-aes",
                    "body": P(
                        "The panel below generates an AES-256-GCM key in this page and keeps it here. Encrypt a line, decrypt it, then flip one ciphertext byte and decrypt again.",
                        "The second decryption does not return a slightly wrong message. Web Crypto rejects the operation. That is the integrity half of an AEAD cipher, the same family TLS 1.3 uses for application data.",
                    ),
                    "idea": "With an AEAD cipher, a changed byte means no plaintext at all.",
                },
                {
                    "id": "pair",
                    "title": "A public key and a private key",
                    "body": P(
                        "Asymmetric keys are generated as a pair. The public key can be shared. The private key stays with its owner. You do not derive the private key from the public key in practice.",
                        "RSA uses large integers. Elliptic-curve keys, such as P-256 and X25519, are shorter at comparable strength, and TLS 1.3 key shares are elliptic-curve Diffie-Hellman. The pair is used in two directions, and mixing them up is a common mistake. Encrypt to a public key and decrypt with the private key. Sign with the private key and verify with the public key.",
                    ),
                    "idea": "The public key is for other people. The private key stays with its owner.",
                },
                {
                    "id": "agree",
                    "title": "Agree on a secret without sending it",
                    "lab": "lab-ecdh",
                    "body": P(
                        "TLS 1.3 does not encrypt the session key to the server's long-term RSA key. That was RSA key transport in TLS 1.2, and it was removed. Each side sends a public key share. Each combines its own private share with the other's public share and arrives at the same secret.",
                        "The demo uses P-256, which Web Crypto supports broadly. TLS often uses X25519. The shape is the same: public keys cross the network, private keys do not, and a listener who saved both public keys still does not have the secret.",
                    ),
                    "idea": "Diffie-Hellman exchanges public keys and ends with a shared secret. The secret itself is not transmitted.",
                },
                {
                    "id": "sign",
                    "title": "Sign with the private key",
                    "lab": "lab-sign",
                    "body": P(
                        "A signature is produced with the private key over a hash of the message. This demo uses ECDSA with P-256 and SHA-256, the same shape as many certificate signatures. Anyone with the public key can verify. The signature does not reveal the private key.",
                        "ECDSA includes a random value, so signing the same sentence twice yields two different signatures, and both still verify. Change one character of the message and verification fails. The message sits beside the signature in the clear. This is not encryption.",
                    ),
                    "idea": "Verification uses the public key. A changed message, or the wrong key, does not verify.",
                },
                {
                    "id": "hybrid",
                    "title": "How TLS combines them",
                    "body": P(
                        "Bulk data uses the fast symmetric cipher. The handshake uses Diffie-Hellman so that cipher's key is never sent, and a signature to tie the handshake to the certified private key. Hashing sits inside the signature, inside Finished, and inside HKDF.",
                        "RSA encryption of a small secret still exists in other systems, as RSA-OAEP. It is not how TLS 1.3 moves the session key. A diagram that shows the server's long-term public key encrypting that key is teaching the older handshake.",
                    ),
                    "idea": "TLS 1.3 is hybrid: Diffie-Hellman for the secret, a signature for identity, AES-GCM for the bytes.",
                },
                {
                    "id": "recap",
                    "title": "One job each",
                    "body": P(
                        "A name becomes an address. TCP opens a reliable stream. TLS 1.3 agrees on keys and checks a certificate. The certificate is a chain of signatures back to a local root. Hashes fingerprint the signed bytes. AES-GCM carries the page.",
                        "Each piece is checkable on its own, and none of them stands in for the others. That is the whole path from the address bar to a private page.",
                    ),
                    "idea": "The connection is a stack of specific jobs: name, deliver, agree, authenticate, hide.",
                },
            ],
            "takeaways": [
                "AES-GCM uses one shared key and a unique nonce. A bad tag means the browser returns no plaintext.",
                "Diffie-Hellman sends public keys and finishes with a shared secret that never traveled. TLS 1.3 uses that pattern.",
                "A signature is checked with the public key and does not hide the message. Change the message and the check fails.",
            ],
            "quiz": [
                {
                    "name": "enc-q1",
                    "q": "AES-GCM refuses to decrypt after one flipped ciphertext byte. What does that show?",
                    "answer": "tag",
                    "why": "The authentication tag no longer matches, so an AEAD cipher returns no plaintext. The cipher is doing the check it was built to do.",
                    "choices": [
                        ("broken", "The cipher is broken"),
                        ("tag", "The authentication tag no longer matches, so no plaintext is returned"),
                        ("expired", "The public key has expired"),
                    ],
                },
                {
                    "name": "enc-q2",
                    "q": "In the ECDH demo, what crosses to the other party?",
                    "answer": "public",
                    "why": "Each side sends its public key. The private keys stay put, and the shared secret is computed locally.",
                    "choices": [
                        ("private", "The private key"),
                        ("public", "The public key"),
                        ("wrapped", "The private key, encrypted with AES"),
                    ],
                },
                {
                    "name": "enc-q3",
                    "q": "Which key checks a digital signature?",
                    "answer": "public",
                    "why": "The signer used the private key. Everyone else uses the matching public key. A shared AES key is a different tool.",
                    "choices": [
                        ("public", "The signer's public key"),
                        ("private", "The signer's private key"),
                        ("aes", "A shared AES key"),
                    ],
                },
            ],
            "sources": [
                ("NIST SP 800-38D", "https://csrc.nist.gov/pubs/sp/800/38/d/final"),
                ("RFC 8446", "https://www.rfc-editor.org/rfc/rfc8446"),
                ("MDN: SubtleCrypto.encrypt", "https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt"),
                ("MDN: SubtleCrypto.sign", "https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign"),
            ],
            "prev": ("hashing.html", "What a hash actually promises"),
        },
    ]


def landing():
    items = [
        ("dns", "8", "dns.html", "What happens when you type a URL", "A name in the address bar becomes an IP address."),
        ("tcp", "8", "tcp.html", "How TCP carries a conversation", "Layers, ports, the three-way handshake, retransmission, and close."),
        ("tls", "8", "tls.html", "How TLS builds a private channel", "The TLS 1.3 handshake, and what an observer can still see."),
        ("certificates", "7", "certificates.html", "How a certificate earns trust", "Chains, signatures, names, dates, and revocation."),
        ("hashing", "6", "hashing.html", "What a hash actually promises", "SHA-256, the avalanche effect, salts, and slow password hashes."),
        ("encryption", "8", "encryption.html", "Hiding data, and proving who sent it", "AES-GCM, Diffie-Hellman, and digital signatures."),
    ]
    lis = []
    for index, (lid, steps, href, name, blurb) in enumerate(items, start=1):
        lis.append(
            f"""        <li data-lesson="{lid}" data-steps="{steps}">
          <a href="{href}">
            <span class="lesson-num">{index}</span>
            <span>
              <span class="lesson-name">{esc(name)}</span>
              <span class="lesson-blurb">{esc(blurb)}</span>
            </span>
            <span class="lesson-state" data-state>Not started</span>
          </a>
        </li>"""
        )
    body = f"""    <div class="learn-home">
      <div class="wrap">
        <h1>Learn with Me</h1>
        <p class="lede">Six short lessons on how a connection is made, and how it becomes private. Each one is a picture you step through. The cryptography runs in your browser.</p>
        <p class="course-note">No account. No install. Progress stays in this browser. The numbers in the diagrams are teaching stand-ins, and each lesson links the specification it follows.</p>
        <p class="course-progress" id="course-progress">No lessons completed on this browser yet.</p>
        <ol class="lesson-index" id="lesson-index">
{chr(10).join(lis)}
        </ol>
      </div>
    </div>"""
    data = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "Learn with Me",
        "description": "A free visual course on DNS, TCP, TLS, certificates, hashing, and encryption.",
        "url": f"{SITE}/learn/",
        "isAccessibleForFree": True,
        "inLanguage": "en",
        "provider": {"@type": "Person", "name": "Yash Tapadiya", "url": f"{SITE}/"},
    }
    return chrome(
        "Learn with Me — Yash Tapadiya",
        "A free visual course on DNS, TCP, TLS, certificates, hashing, and encryption. Step through each idea in the browser.",
        f"{SITE}/learn/",
        "",
        body,
        json.dumps(data, indent=2),
    )


def main():
    lessons = LESSONS + tls_and_rest()
    labs_for = {"hashing": HASH_LABS, "encryption": ENCRYPT_LABS}
    for lesson in lessons:
        html = lesson_page(lesson, labs_for.get(lesson["id"], ""))
        (ROOT / lesson["file"]).write_text(html, encoding="utf-8")
        print(lesson["file"], len(html))
    page = landing()
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    print("index.html", len(page))


if __name__ == "__main__":
    main()
