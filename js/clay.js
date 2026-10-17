/* Soft clay study for the hero.
   Desktop only, started from site.js. Inspired by Vedant Hegde's
   "3D Animation Exploration" (Dribbble 26539235): matte primitives,
   a sage studio light, and a slow drift. */
(function () {
  var VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uTime;",
    "uniform vec2 uPointer;",
    "uniform float uScroll;",
    "uniform float uLight;",
    "mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}",
    "float sdSphere(vec3 p,float r){return length(p)-r;}",
    "float sdCapsule(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-ba*h)-r;}",
    "float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}",
    "float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);}",
    "float sdRibbon(vec3 p){float tw=p.x*1.35;p.yz=rot(tw)*p.yz;return sdBox(p,vec3(0.62,0.045,0.18))-0.04;}",
    "vec2 u2(vec2 a,vec2 b){return a.x<b.x?a:b;}",
    "vec2 map(vec3 p){",
    "  float t=uTime;",
    "  float drift=t*0.32+uScroll*1.2;",
    "  vec3 q=p-vec3(-0.48+sin(t*0.31)*0.04,0.62+sin(t*0.62)*0.03,0.0);",
    "  q.xy=rot(0.7+drift*0.5)*q.xy;",
    "  q.xz=rot(drift*0.28)*q.xz;",
    "  vec2 d=vec2(sdCapsule(q,vec3(-0.55,0.0,0.0),vec3(0.55,0.0,0.0),0.26),1.0);",
    "  vec3 s=p-vec3(0.46+cos(t*0.27)*0.03,0.52+sin(t*0.5+1.1)*0.025,0.06);",
    "  s.yz=rot(drift*0.2)*s.yz;",
    "  d=u2(d,vec2(sdSphere(s,0.38),2.0));",
    "  vec3 o=p-vec3(0.02,1.12+cos(t*0.4)*0.025,-0.04);",
    "  o.xy=rot(1.2)*o.xy;",
    "  o.xz=rot(0.45+drift*0.55)*o.xz;",
    "  d=u2(d,vec2(sdTorus(o,vec2(0.36,0.1)),3.0));",
    "  vec3 r=p-vec3(-0.12,1.38+sin(t*0.46+0.4)*0.025,0.08);",
    "  r.xz=rot(-0.35+drift*0.4)*r.xz;",
    "  r.xy=rot(0.5)*r.xy;",
    "  d=u2(d,vec2(sdRibbon(r),4.0));",
    "  vec3 m=p-vec3(-0.95+sin(t*0.34)*0.02,1.02+cos(t*0.48)*0.02,0.18);",
    "  d=u2(d,vec2(sdSphere(m,0.13),5.0));",
    "  float gy=p.y+0.02;",
    "  float gd=length(p.xz-vec2(-0.05,0.02))-1.15;",
    "  d=u2(d,vec2(max(gy,gd),0.0));",
    "  return d;",
    "}",
    "vec3 calcN(vec3 p){",
    "  vec2 e=vec2(0.0016,0.0);",
    "  return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));",
    "}",
    "float shadow(vec3 ro,vec3 rd){",
    "  float res=1.0;float t=0.04;",
    "  for(int i=0;i<16;i++){",
    "    float h=map(ro+rd*t).x;",
    "    res=min(res,14.0*h/t);",
    "    t+=clamp(h,0.02,0.18);",
    "    if(res<0.04||t>3.2)break;",
    "  }",
    "  return clamp(res,0.0,1.0);",
    "}",
    "vec3 shade(vec3 p,vec3 n,vec3 ro,float id){",
    "  vec3 alb=vec3(0.80,0.84,0.82);",
    "  if(id>4.5)alb=vec3(0.29,0.68,0.34);",
    "  else if(id>3.5)alb=vec3(0.33,0.40,0.37);",
    "  else if(id>2.5)alb=vec3(0.70,0.74,0.79);",
    "  else if(id>1.5)alb=vec3(0.13,0.21,0.18);",
    "  else if(id>0.5)alb=vec3(0.41,0.54,0.51);",
    "  vec3 L1=normalize(vec3(-0.55,0.9,0.32));",
    "  vec3 L2=normalize(vec3(0.7,0.35,0.45));",
    "  float sh=id<0.5?1.0:shadow(p+n*0.03,L1);",
    "  float diff=clamp(dot(n,L1),0.0,1.0);",
    "  float wrap=clamp(dot(n,L1)*0.45+0.55,0.0,1.0);",
    "  float fill=clamp(dot(n,L2),0.0,1.0);",
    "  float ao=1.0;float sca=1.0;",
    "  for(int i=0;i<4;i++){float h=0.03+0.09*float(i);float dd=map(p+n*h).x;ao-=clamp(h-dd,0.0,1.0)*sca*0.42;sca*=0.75;}",
    "  ao=clamp(ao,0.35,1.0);",
    "  vec3 col=alb*(0.34+1.05*diff*sh+0.08*wrap+0.16*fill);",
    "  vec3 V=normalize(ro-p);",
    "  float spec=pow(clamp(dot(reflect(-L1,n),V),0.0,1.0),32.0)*sh;",
    "  col+=vec3(1.0,0.98,0.94)*spec*0.14;",
    "  float fre=pow(1.0-clamp(dot(n,V),0.0,1.0),2.4);",
    "  col+=vec3(0.85,0.9,0.88)*fre*0.1;",
    "  col*=ao;",
    "  if(id<0.5){",
    "    float shg=shadow(p+vec3(0.0,0.02,0.0),L1);",
    "    col=vec3(0.80,0.85,0.83)*mix(0.78,1.0,shg);",
    "  }",
    "  return col;",
    "}",
    "void main(){",
    "  vec2 uv=(gl_FragCoord.xy/uRes)*2.0-1.0;",
    "  uv.x*=uRes.x/max(uRes.y,1.0);",
    "  vec2 pxy=(uPointer-0.5);",
    "  vec3 ro=vec3(-0.06+pxy.x*0.26,0.86+pxy.y*0.1-uScroll*0.14,1.55);",
    "  vec3 ta=vec3(-0.02,0.78,0.0);",
    "  vec3 ww=normalize(ta-ro);",
    "  vec3 uu=normalize(cross(vec3(0.0,1.0,0.0),ww));",
    "  vec3 vv=cross(ww,uu);",
    "  vec3 rd=normalize(uv.x*uu+uv.y*vv+1.7*ww);",
    "  float t=0.0;float id=-1.0;vec3 pos;",
    "  for(int i=0;i<48;i++){",
    "    pos=ro+rd*t;",
    "    vec2 h=map(pos);",
    "    if(h.x<0.002){id=h.y;break;}",
    "    t+=h.x;",
    "    if(t>8.0)break;",
    "  }",
    "  vec2 suv=gl_FragCoord.xy/uRes;",
    "  vec2 stageUv=(suv-vec2(0.40,0.60))*vec2(1.25,1.05);",
    "  float stage=smoothstep(0.50,0.30,length(stageUv));",
    "  vec3 studio=mix(vec3(0.73,0.79,0.77),vec3(0.90,0.93,0.91),uLight);",
    "  vec3 col=studio;",
    "  float alpha=stage*0.96;",
    "  if(id>=0.0){",
    "    vec3 n=calcN(pos);",
    "    col=shade(pos,n,ro,id);",
    "    float fog=exp(-0.045*t*t);",
    "    col=mix(studio,col,fog);",
    "    if(id<0.5){",
    "      float fade=smoothstep(1.35,0.12,length(pos.xz-vec2(-0.1,0.05)));",
    "      alpha=stage*fade;",
    "    }else{",
    "      alpha=max(alpha,0.98);",
    "    }",
    "  }",
    "  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);",
    "  col+=(grain-0.5)*0.012;",
    "  gl_FragColor=vec4(col,alpha);",
    "}"
  ].join("");

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      return { shader: null, log: log };
    }
    return { shader: sh, log: "" };
  }

  window.initClay = function (canvas) {
    if (!canvas) return null;
    var gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    if (!gl) return null;
    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs.shader || !fs.shader) {
      window.__clayError = (vs.log || "") + (fs.log || "");
      return null;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs.shader);
    gl.attachShader(prog, fs.shader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      window.__clayError = gl.getProgramInfoLog(prog);
      return null;
    }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var uRes = gl.getUniformLocation(prog, "uRes");
    var uTime = gl.getUniformLocation(prog, "uTime");
    var uPointer = gl.getUniformLocation(prog, "uPointer");
    var uScroll = gl.getUniformLocation(prog, "uScroll");
    var uLight = gl.getUniformLocation(prog, "uLight");

    var pointer = { x: 0.62, y: 0.45 };
    var target = { x: 0.62, y: 0.45 };
    var alive = true;
    var visible = true;
    var hero = canvas.closest(".hero") || canvas.parentElement;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.2);
      var rect = canvas.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      if (w < 2 || h < 2) return;
      var W = Math.floor(w * dpr);
      var H = Math.floor(h * dpr);
      var cap = 780 * 900;
      if (W * H > cap) {
        var s = Math.sqrt(cap / (W * H));
        W = Math.floor(W * s);
        H = Math.floor(H * s);
      }
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = Math.max(1, W);
        canvas.height = Math.max(1, H);
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function onPointer(e) {
      target.x = e.clientX / Math.max(window.innerWidth, 1);
      target.y = 1 - e.clientY / Math.max(window.innerHeight, 1);
    }
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", resize);
    var observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.02 });
    observer.observe(hero);

    document.documentElement.classList.add("is-clay");
    resize();

    function draw(time) {
      if (!alive || !visible || document.hidden) return;
      pointer.x += (target.x - pointer.x) * 0.05;
      pointer.y += (target.y - pointer.y) * 0.05;
      var rect = hero.getBoundingClientRect();
      var scroll = rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
      var light = document.documentElement.getAttribute("data-theme") === "light" ? 1 : 0;
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uScroll, scroll);
      gl.uniform1f(uLight, light);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    var ticker = null;
    if (window.gsap) {
      ticker = function (time) { draw(time); };
      window.gsap.ticker.add(ticker);
    } else {
      var loop = function (now) {
        draw(now / 1000);
        if (alive) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    return function stop() {
      alive = false;
      document.documentElement.classList.remove("is-clay");
      if (ticker && window.gsap) window.gsap.ticker.remove(ticker);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      var ctx = gl.getExtension("WEBGL_lose_context");
      if (ctx) ctx.loseContext();
    };
  };
})();
