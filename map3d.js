// Charmfall: the map as a flyover (2026-11-11, İdris: "o mapi bu tarz bir animasyon ve tema olarak değiştir... araba değil, raylarımız var").
// The same idea as his İstanbul → Urfa route film, made for our own world: real relief under a chase camera, the route drawn on the land (gold
// where the train has been, pale ahead), stops on the rails, a height profile of the whole line at the bottom. No map tiles and no network:
// the land is made here from noise (one height function of x and z), so it works inside the phone app and stays the game's own nature world.
// Every place keeps its own ground colour, sky and trees (the tables the old map used); the land ahead of the player is the same land in ash grey.
// Uses three.js r149 (window.THREE). index.html calls MAP3D.sync(api) whenever the map is shown; MAP3D.still(i) paints a level's backdrop.
(() => {
  const T3 = window.THREE; if (!T3) return;
  const SEG = 46, NX = 96, NZ = 52, CW = 4.95, TX = 72, TZ = 40, TW = 6.6, CHS = 4, CHZ = SEG * CHS, CZ = CHZ / NZ, HALF = NX * CW / 2, TAU = Math.PI * 2;
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x, lerp = (a, b, k) => a + (b - a) * k, sstep = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, eio = (x) => { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v); };
  const fbm = (x, y, o) => { let s = 0, a = .5, n = 0; for (let i = 0; i < o; i++) { s += a * vn(x, y); n += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; a *= .5; } return s / n; };
  const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255], mix3 = (a, b, k, o) => { o[0] = lerp(a[0], b[0], k); o[1] = lerp(a[1], b[1], k); o[2] = lerp(a[2], b[2], k); return o; };
  const css = (c) => "rgb(" + Math.round(c[0] * 255) + "," + Math.round(c[1] * 255) + "," + Math.round(c[2] * 255) + ")";

  // ---- the places: forty chapters of ten stops. Some lie on the coast (the sea on the right of the line), some are high and snowy.
  const COAST = new Set([2, 10, 11, 12, 13, 14, 30, 32, 34, 35]), SNOW = new Set([21, 22, 23, 29, 38]), NIGHT = (sky) => { const c = hex(sky[0]); return 1 - sstep((c[0] * .3 + c[1] * .59 + c[2] * .11 - .16) / .3); };
  const ALT = [], RGH = []; for (let c = 0; c < 42; c++) { ALT.push(COAST.has(c) ? 3.4 : SNOW.has(c) ? 52 + 14 * hash(c, 5) : 9 + 30 * (.5 + .5 * Math.sin(c * .9 + .4)) * (.35 + .65 * hash(c, 7))); RGH.push(COAST.has(c) ? 15 : SNOW.has(c) ? 46 : 13 + 24 * hash(c, 3)); }
  const chapMix = (u, tab) => { const f = u / 10 - .5, i = clamp(Math.floor(f), 0, 40), k = sstep(f - i);   // a whole place's length to climb to the next, so the rails never go steeper than a train would
    return lerp(tab[Math.max(0, i)], tab[Math.min(41, i + 1)], f < 0 ? 0 : k); };
  const coastAmt = (u) => { const f = u / 10 - .5, i = clamp(Math.floor(f), 0, 40), k = sstep((f - i - .25) / .5); return lerp(COAST.has(i) ? 1 : 0, COAST.has(Math.min(39, i + 1)) ? 1 : 0, f < 0 ? 0 : k); };
  // the line: it runs away from the viewer (−z), swinging left and right; ty is the height of the rails
  const cx = (u) => 34 * Math.sin(u * .52) + 60 * Math.sin(u * .11 + 1.3) + 16 * Math.sin(u * .23 + .5), cz = (u) => -u * SEG;
  const ty = (u) => Math.max(3.2, chapMix(u, ALT) + 1.6 * Math.sin(u * .8) + 1.2 * Math.sin(u * .37 + 2));
  const P = (u, o) => { o.x = cx(u); o.y = ty(u); o.z = cz(u); return o; };
  function Hgt(x, z) { const u = -z / SEG, d = x - cx(u), ad = Math.abs(d), base = ty(u), a = sstep((ad - 7) / 72), r = chapMix(u, RGH);
    let h = base + a * (fbm(x * .0105, z * .0105, 4) - .43) * r * 2.3 + a * (vn(x * .06 + 3, z * .06) - .5) * 2.2;
    const cs = coastAmt(u); if (cs > 0) h -= cs * sstep((d - 15) / 62) * (base + 13 + r * .35);
    return h; }

  let api = null, R = null, scene, cam, host, cv, wrap, sun, hemi, water, waterTex, info, tl, tlc, tlStatic = null, ok = true;
  let zoom = 1.22, fc = 0, pinch = null; const ptrs = new Map();
  let cur = 0, N = 400, f = 0, fv = 0, yaw = 0, trainU = 0, ride = null, raf = 0, last = 0, clock = 0, builtCur = -1, W = 0, Hh = 0, dpr = 1;
  const chunks = new Map(), stopPool = [], stopTex = new Map(), stations = new Map(), smoke = [], clouds = [], V = new T3.Vector3(), V2 = new T3.Vector3(), V3 = new T3.Vector3(), M4 = new T3.Matrix4(), Q = new T3.Quaternion(), S3 = new T3.Vector3(), E = new T3.Euler(), C = new T3.Color();
  const GREY = [.62, .6, .57], SAND = hex("#e9d7a4"), ROCK = hex("#8d8679"), SNOWC = [.96, .97, 1], BED = hex("#2f7f93");
  const ground = (u, o) => { const f = clamp(u / 10 - .5, 0, 39), i = Math.floor(f), k = sstep((f - i - .25) / .5); return mix3(api.G[i], api.G[Math.min(39, i + 1)], k, o); };
  const lockAmt = (u) => sstep((u - (cur + .55)) / 1.5);
  const tA = [0, 0, 0], tB = [0, 0, 0];
  function landColour(x, z, h, ny, o) { const u = -z / SEG, base = ty(u), g = ground(u, tA), ch = clamp(Math.floor(u / 10), 0, 39), snow = SNOW.has(ch);
    const m = .78 + .36 * fbm(x * .05, z * .05, 2), p = sstep((vn(x * .017 + 40, z * .017) - .5) / .2);
    o[0] = lerp(g[0], .46, .42) * m * lerp(1, .66, p); o[1] = lerp(g[1], .58, .42) * m * lerp(1, .8, p); o[2] = lerp(g[2], .3, .42) * m * lerp(1, .62, p);
    const sl = sstep((1 - ny - .1) / .22); mix3(o, ROCK, sl * .8, o);
    const e = h - base; if (snow) mix3(o, SNOWC, sstep((e - 4) / 14) * (1 - sl * .5), o); else if (e > 22) mix3(o, ROCK, sstep((e - 22) / 26) * .55, o);
    if (h < 2.4) mix3(o, SAND, 1 - sstep((h - .5) / 1.9), o); if (h < 0) mix3(o, BED, sstep(-h / 7), o);
    const lk = lockAmt(u); if (lk > 0) { const l = (o[0] * .3 + o[1] * .59 + o[2] * .11) * .9 + .12; tB[0] = l * 1.02; tB[1] = l; tB[2] = l * .96; mix3(o, tB, lk * .86, o); }
    return o; }

  // ---- land in chunks of four stops, made as the camera comes near
  function grain() { const n = 256, k = document.createElement("canvas"); k.width = k.height = n; const x = k.getContext("2d"), id = x.createImageData(n, n), per = (a, b, f) => { const X = a / n * f, Y = b / n * f, xi = Math.floor(X), yi = Math.floor(Y), xf = X - xi, yf = Y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), h = (i, j) => hash((i % f + f) % f + f * 3.1, (j % f + f) % f); return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); };
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const v = .3 * per(i, j, 8) + .34 * per(i, j, 24) + .36 * per(i, j, 64) + (hash(i, j) - .5) * .2, o = (j * n + i) * 4, g = clamp(186 + v * 120, 0, 255); id.data[o] = g * 1.0; id.data[o + 1] = g; id.data[o + 2] = g * .97; id.data[o + 3] = 255; } x.putImageData(id, 0, 0);
    const t = new T3.CanvasTexture(k); t.wrapS = t.wrapT = T3.RepeatWrapping; t.anisotropy = 4; return t; }
  const landMat = () => landMat.m || (landMat.m = new T3.MeshLambertMaterial({ vertexColors: true, map: grain() })), railMat = () => railMat.m || (railMat.m = new T3.MeshLambertMaterial({ vertexColors: true }));
  const GEO = {}, SWAY = { value: 0 }; function geos() { if (GEO.pine) return; // soft shapes: every vertex is pushed by a smooth function of its direction (so the copies of a corner stay together) and keeps the normal of
    // the lump it sits on, which shades as one rounded mass instead of cut facets
    const lump = (geo, amp, fq, sy) => { const q = geo.attributes.position, nr = geo.attributes.normal; for (let n = 0; n < q.count; n++) { const x = q.getX(n), y = q.getY(n), z = q.getZ(n), l = Math.hypot(x, y, z) || 1, dx = x / l, dy = y / l, dz = z / l;
        const m = 1 - amp * .5 + amp * (.6 * vn(dx * fq + 5.1 + dy * 1.3, dz * fq + 2.7 - dy * .9) + .4 * vn(dx * fq * 2.3 + 11, dz * fq * 2.3 + dy * 2.1 + 3)); q.setXYZ(n, x * m, y * m * sy, z * m); nr.setXYZ(n, dx, dy / sy, dz); } geo.normalizeNormals(); return geo; };
    { const pts = [[0, 7.6], [.5, 6.7], [1.15, 5.5], [.62, 5.35], [1.7, 3.8], [.95, 3.62], [2.3, 1.75], [1.2, 1.5], [0, 1.5]].map(([r, y]) => new T3.Vector2(r, y)); GEO.pine = new T3.LatheGeometry(pts, 9); }
    GEO.round = lump(new T3.IcosahedronGeometry(2.6, 2), .34, 1.9, .9); GEO.round.translate(0, 3.5, 0);
    GEO.trunk = new T3.CylinderGeometry(.34, .62, 2.6, 7); GEO.trunk.translate(0, 1.1, 0); GEO.rock = lump(new T3.IcosahedronGeometry(1.5, 2), .5, 1.4, .82); GEO.sleeper = new T3.BoxGeometry(4.6, .28, .72);
    GEO.leaf = new T3.MeshLambertMaterial({ color: 0xffffff }); GEO.leaf.onBeforeCompile = (sh) => { sh.uniforms.uT = SWAY; sh.vertexShader = "uniform float uT;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph = instanceMatrix[3].x * .31 + instanceMatrix[3].z * .23; float bend = max(0., position.y - 1.4) * .018; transformed.x += sin(uT * 1.5 + ph) * bend; transformed.z += cos(uT * 1.1 + ph * 1.7) * bend * .7;\n#endif"); }; GEO.wood = new T3.MeshLambertMaterial({ color: 0x7a5a3c }); GEO.stone = new T3.MeshLambertMaterial({ color: 0xffffff }); GEO.tie = new T3.MeshLambertMaterial({ color: 0x6b4a32 }); }
  const TREEC = { pine: "#2f7a4a", snowpine: "#cfe6e0", round: "#4fae55", tree: "#3f9a48", maple: "#e0762a", blossom: "#f3a3c4", cactus: "#5aa860", deadtree: "#7a6a58" };
  function makeChunk(k) { geos(); const g = new T3.Group(), u0 = k * CHS, um = u0 + CHS / 2, x0 = Math.round(cx(um) / CW) * CW - HALF, z0 = -k * CHZ, nv = (NX + 1) * (NZ + 1);
    const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint16Array(NX * NZ * 6); let p = 0;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = x0 + i * CW, z = z0 - j * CZ; uv[p / 3 * 2] = x / 38; uv[p / 3 * 2 + 1] = z / 38; pos[p++] = x; pos[p++] = Hgt(x, z); pos[p++] = z; }
    p = 0; for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx[p++] = a; idx[p++] = b; idx[p++] = c; idx[p++] = b; idx[p++] = d; idx[p++] = c; }
    const geo = new T3.BufferGeometry(); geo.setAttribute("position", new T3.BufferAttribute(pos, 3)); geo.setIndex(new T3.BufferAttribute(idx, 1)); geo.computeVertexNormals(); geo.setAttribute("color", new T3.BufferAttribute(col, 3)); geo.setAttribute("uv", new T3.BufferAttribute(uv, 2));
    const land = new T3.Mesh(geo, landMat()); g.add(land);
    // trees and rocks: where the land is dry, not steep and away from the rails; thicker where the forest noise is high
    const ch = clamp(Math.floor(um / 10), 0, 39), kind = api.tree[ch] || "round", pine = /pine|cactus/.test(kind), spots = [], rocks = []; const nrm = geo.attributes.normal;
    for (let j = 0; j < TZ; j++) for (let i = 0; i < TX; i++) { const r = hash(i + k * 91.7, j * 3.1 + k), x = x0 + (i + hash(i, j + k * 7)) * TW, z = z0 - (j + hash(j + k, i * 1.7)) * (CHZ / TZ), u = -z / SEG, d = Math.abs(x - cx(u)); if (d < 10) continue;
      const fo = fbm(x * .013 + 80, z * .013, 2), want = sstep((fo - .4) / .2) * .5 + .03; if (r > want && r < .985) continue; const h = Hgt(x, z); if (h < 1.6) continue; const ny = nrm.getY(Math.min(NZ, Math.round(j * NZ / TZ)) * (NX + 1) + Math.min(NX, Math.round(i * NX / TX)));
      if (r >= .985) { if (rocks.length < 40) rocks.push([x, h, z, r]); continue; } if (ny < .86 || h - ty(u) > 34) continue; if (spots.length < (pine ? 200 : 110)) spots.push([x, h, z, r / want]); }
    const mk = (geoK, mat, list, fn) => { if (!list.length) return null; const im = new T3.InstancedMesh(geoK, mat, list.length); list.forEach((s, n) => fn(s, n, im)); im.instanceMatrix.needsUpdate = true; g.add(im); return im; };
    const leaf = mk(pine ? GEO.pine : GEO.round, GEO.leaf, spots, (s, n, im) => { const sc = .75 + s[3] * .7; E.set(0, s[3] * 20, 0); Q.setFromEuler(E); S3.set(sc, sc * (pine ? 1 + s[3] * .3 : 1), sc); V.set(s[0], s[1] - .2, s[2]); M4.compose(V, Q, S3); im.setMatrixAt(n, M4); });
    mk(GEO.trunk, GEO.wood, spots, (s, n, im) => { const sc = .75 + s[3] * .7; Q.identity(); S3.set(sc, sc, sc); V.set(s[0], s[1] - .3, s[2]); M4.compose(V, Q, S3); im.setMatrixAt(n, M4); });
    const rk = mk(GEO.rock, GEO.stone, rocks, (s, n, im) => { const sc = .6 + hash(s[0], s[2]) * 1.6; E.set(s[3] * 9, s[3] * 31, s[3] * 5); Q.setFromEuler(E); S3.set(sc * 1.3, sc * .8, sc); V.set(s[0], s[1], s[2]); M4.compose(V, Q, S3); im.setMatrixAt(n, M4); });
    // the rails: ballast, a route line down the middle, two rails, sleepers
    const SN = 96, quads = SN * 4, rp = new Float32Array(quads * 4 * 3), rc = new Float32Array(quads * 4 * 3), ri = new Uint16Array(quads * 6), rg = new T3.BufferGeometry(); let ii = 0;
    for (let q = 0; q < quads; q++) { const a = q * 4; ri[ii++] = a; ri[ii++] = a + 1; ri[ii++] = a + 2; ri[ii++] = a + 1; ri[ii++] = a + 3; ri[ii++] = a + 2; }
    const rn = new Float32Array(quads * 4 * 3); for (let q = 1; q < rn.length; q += 3) rn[q] = 1; rg.setAttribute("normal", new T3.BufferAttribute(rn, 3)); rg.setAttribute("position", new T3.BufferAttribute(rp, 3)); rg.setAttribute("color", new T3.BufferAttribute(rc, 3)); rg.setIndex(new T3.BufferAttribute(ri, 1));
    const STR = [[-3.5, 3.5, .34], [-.5, .5, .5], [-1.72, -1.3, .78], [1.3, 1.72, .78]]; let v = 0;
    for (let s = 0; s < SN; s++) { const ua = u0 + s * CHS / SN, ub = ua + CHS / SN, xa = cx(ua), xb = cx(ub), za = cz(ua), zb = cz(ub), ya = ty(ua), yb = ty(ub), da = (cx(ua + .01) - cx(ua - .01)) / (.02 * SEG), db = (cx(ub + .01) - cx(ub - .01)) / (.02 * SEG), la = 1 / Math.hypot(1, da), lb = 1 / Math.hypot(1, db);
      for (const [l, r, y] of STR) { for (const [uu, xx, zz, yy, dd, ll, o] of [[ua, xa, za, ya, da, la, l], [ua, xa, za, ya, da, la, r], [ub, xb, zb, yb, db, lb, l], [ub, xb, zb, yb, db, lb, r]]) { rp[v++] = xx + o * ll; rp[v++] = yy + y; rp[v++] = zz + o * dd * ll; } } }
    const rails = new T3.Mesh(rg, railMat()); g.add(rails);
    const ties = []; for (let s = 0; s < 78; s++) ties.push(u0 + (s + .5) * CHS / 78);
    mk(GEO.sleeper, GEO.tie, ties, (u, n, im) => { const d = (cx(u + .01) - cx(u - .01)) / (.02 * SEG); E.set(0, Math.atan2(-d, 1) + 0, 0); Q.setFromEuler(E); S3.set(1, 1, 1); V.set(cx(u), ty(u) + .46, cz(u)); M4.compose(V, Q, S3); im.setMatrixAt(n, M4); });
    const o = { g, k, land, leaf, rk, spots, rocks, rails, u0, kind, ch }; paintChunk(o); scene.add(g); return o; }
  const tc = [0, 0, 0], BAL = hex("#7b6d5c"), STEEL = hex("#444a57"), GOLD = hex("#ffc533"), PALE = hex("#f6f1e4");
  function paintChunk(o) { const pos = o.land.geometry.attributes.position, nrm = o.land.geometry.attributes.normal, col = o.land.geometry.attributes.color;
    for (let n = 0; n < pos.count; n++) { landColour(pos.getX(n), pos.getZ(n), pos.getY(n), nrm.getY(n), tc); col.setXYZ(n, tc[0], tc[1], tc[2]); } col.needsUpdate = true;
    const base = hex(TREEC[o.kind] || TREEC.round); if (o.leaf) { o.spots.forEach((s, n) => { const lk = lockAmt(-s[2] / SEG), m = .78 + hash(s[0], s[2]) * .4; tc[0] = base[0] * m; tc[1] = base[1] * m; tc[2] = base[2] * m; if (lk > 0) { const l = (tc[0] * .3 + tc[1] * .59 + tc[2] * .11) * .8 + .1; mix3(tc, [l, l, l * .96], lk * .9, tc); } C.setRGB(tc[0], tc[1], tc[2]); o.leaf.setColorAt(n, C); }); o.leaf.instanceColor.needsUpdate = true; }
    if (o.rk) { o.rocks.forEach((s, n) => { const m = .5 + hash(s[2], s[0]) * .2; C.setRGB(m * 1.05, m, m * .93); o.rk.setColorAt(n, C); }); o.rk.instanceColor.needsUpdate = true; }
    const rc = o.rails.geometry.attributes.color; let v = 0; for (let s = 0; s < 96; s++) { const u = o.u0 + (s + .5) * CHS / 96, done = u <= cur, m = .86 + hash(s, o.k) * .24, lk = lockAmt(u);
      const cols = [[BAL[0] * m, BAL[1] * m, BAL[2] * m], done ? GOLD : mix3(PALE, GREY, lk * .5, tB), STEEL, STEEL]; for (const c of cols) for (let q = 0; q < 4; q++) { rc.array[v++] = c[0]; rc.array[v++] = c[1]; rc.array[v++] = c[2]; } } rc.needsUpdate = true; }
  function dropChunk(o) { scene.remove(o.g); o.g.traverse((m) => { if (m.geometry && !Object.values(GEO).includes(m.geometry)) m.geometry.dispose(); if (m.isInstancedMesh) m.dispose(); }); }
  function needChunks(all) { const kc = Math.floor(f / CHS), lo = Math.max(0, kc - 1), hi = Math.min(Math.ceil(N / CHS), kc + 4); let made = 0;
    for (let k = lo; k <= hi; k++) if (!chunks.has(k)) { chunks.set(k, makeChunk(k)); if (!all && ++made >= 1) break; }
    for (const [k, o] of chunks) if (k < lo - 1 || k > hi + 1) { dropChunk(o); chunks.delete(k); } }

  // ---- stops: a tile with the level's number above the rails (the old map's tiles, drawn once each), stars over it, Play under the current one
  function tileTex(i) { const st = api.stars(i), state = i < cur ? "won" : i === cur ? (st ? "won cur" : "cur") : "lock", boss = i % 10 === 9, key = i + state + st + (api.lang || ""); let t = stopTex.get(key); if (t) return t;
    const k = document.createElement("canvas"); k.width = 192; k.height = 288; const x = k.getContext("2d"), rr = (a, b, w, h, r) => { x.beginPath(); x.roundRect(a, b, w, h, r); };
    const top = /cur/.test(state) ? ["#ffc59a", "#f0743a"] : state === "lock" ? ["#d6d1c4", "#a9a394"] : boss ? ["#ff9aa8", "#d93654"] : ["#ffeeb0", "#f2b632"], g = x.createLinearGradient(0, 70, 0, 200); g.addColorStop(0, top[0]); g.addColorStop(1, top[1]);
    x.fillStyle = "rgba(40,24,10,.28)"; rr(30, 84, 132, 132, 30); x.fill(); x.fillStyle = "#fff8ea"; rr(26, 70, 140, 140, 32); x.fill(); x.fillStyle = g; rr(34, 78, 124, 124, 26); x.fill();
    x.fillStyle = "rgba(255,255,255,.35)"; rr(42, 84, 108, 40, 18); x.fill();
    x.font = "900 " + (i >= 99 ? 54 : 66) + "px system-ui,-apple-system,'Helvetica Neue',Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round"; x.lineWidth = 8; x.strokeStyle = state === "lock" ? "rgba(90,84,74,.5)" : "rgba(110,52,10,.55)"; x.strokeText(i + 1, 96, 144); x.fillStyle = state === "lock" ? "#ece8dd" : "#fff"; x.fillText(i + 1, 96, 144);
    if (st) for (let s = 0; s < 3; s++) { const sx = 48 + s * 48, sy = 40 - (s === 1 ? 10 : 0); x.beginPath(); for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * Math.PI / 5, r = q % 2 ? 9 : 21; x.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } x.closePath(); x.fillStyle = s < st ? "#ffd23c" : "rgba(60,50,40,.55)"; x.strokeStyle = s < st ? "#8a5a10" : "rgba(255,255,255,.35)"; x.lineWidth = 4; x.stroke(); x.fill(); }
    if (/cur/.test(state)) { x.fillStyle = "#7a4a12"; rr(30, 226, 132, 50, 25); x.fill(); const pg = x.createLinearGradient(0, 222, 0, 268); pg.addColorStop(0, "#ffe07a"); pg.addColorStop(1, "#f0a52a"); x.fillStyle = pg; rr(30, 220, 132, 50, 25); x.fill(); x.font = "italic 900 30px system-ui,-apple-system,Arial"; x.fillStyle = "#5a3408"; x.fillText(api.play || "Play", 96, 246); }
    if (state === "lock") { x.fillStyle = "#3d3f6b"; x.beginPath(); x.arc(150, 84, 20, 0, TAU); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 4; x.beginPath(); x.arc(150, 80, 6, Math.PI, 0); x.stroke(); x.fillStyle = "#fff"; rr(142, 80, 16, 12, 3); x.fill(); }
    t = new T3.CanvasTexture(k); t.anisotropy = 4; if (stopTex.size > 160) { for (const [kk, tt] of stopTex) { tt.dispose(); stopTex.delete(kk); if (stopTex.size < 90) break; } } stopTex.set(key, t); return t; }
  function syncStops() { const lo = Math.max(0, Math.floor(f) - 3), hi = Math.min(N - 1, Math.floor(f) + 11); let n = 0;
    for (let i = lo; i <= hi; i++, n++) { let s = stopPool[n]; if (!s) { s = new T3.Sprite(new T3.SpriteMaterial({ transparent: true, depthWrite: false, fog: false })); s.center.set(.5, .2); scene.add(s); stopPool[n] = s; }
      if (s.userData.i !== i || s.userData.c !== cur || s.userData.st !== api.stars(i)) { s.material.map = tileTex(i); s.material.needsUpdate = true; s.userData.i = i; s.userData.c = cur; s.userData.st = api.stars(i); }
      P(i, V); const far = clamp((i - f) / 11, 0, 1), sc = (i === cur ? 13.5 + Math.sin(clock * 3) * .5 : 11) * (1 + far * .9) * (W < Hh ? 1 : .8); { const dd = (cx(i + .01) - cx(i - .01)) / (.02 * SEG), ll = 1 / Math.hypot(1, dd); s.position.set(V.x - 8.5 * ll, V.y + 2.2 + (i === cur ? .5 + .4 * Math.sin(clock * 3) : 0), V.z - 8.5 * dd * ll); } s.scale.set(sc, sc * 1.5, 1); s.material.opacity = 1 - sstep((i - f - 8.5) / 2.5); s.visible = true; s.renderOrder = 1000 - i; }
    for (; n < stopPool.length; n++) stopPool[n].visible = false; }

  // ---- stations: a little halt beside the rails every twenty stops, and Pogo's burrow halt at the start
  function station(k) { const g = new T3.Group(), u = k ? k * api.every - 1 : 0, side = 1, mat = (c) => new T3.MeshLambertMaterial({ color: c });
    const plat = new T3.Mesh(new T3.BoxGeometry(7, .9, 17), mat(0xcbbd9f)); plat.position.set(side * 7.4, .45, 0); g.add(plat);
    const hs = new T3.Mesh(new T3.BoxGeometry(6.4, 5, 9), mat(0xfff1d6)); hs.position.set(side * 9.6, 3.3, 0); g.add(hs);
    const roof = new T3.Mesh(new T3.CylinderGeometry(.01, 5.2, 3, 4, 1), mat(0xb9503e)); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 1.42); roof.position.set(side * 9.6, 7.3, 0); g.add(roof);
    const aw = new T3.Mesh(new T3.BoxGeometry(4.2, .3, 12), mat(0x2f7a4a)); aw.position.set(side * 5.6, 4.6, 0); aw.rotation.z = side * .16; g.add(aw);
    for (const z of [-5, 5]) { const post = new T3.Mesh(new T3.CylinderGeometry(.18, .18, 3.9, 5), mat(0x5a4632)); post.position.set(side * 4.2, 2.6, z); g.add(post); }
    const door = new T3.Mesh(new T3.BoxGeometry(.2, 2.6, 1.6), mat(0x7a4a2a)); door.position.set(side * 6.35, 2.2, 0); g.add(door);
    for (const z of [-2.9, 2.9]) { const w = new T3.Mesh(new T3.BoxGeometry(.2, 1.3, 1.4), mat(0x9fd8f0)); w.position.set(side * 6.35, 3.5, z); g.add(w); }
    const clockT = new T3.Mesh(new T3.CylinderGeometry(.9, .9, .3, 12), mat(0xffd23c)); clockT.rotation.z = Math.PI / 2; clockT.position.set(side * 6.3, 5.1, 0); g.add(clockT);
    const d = (cx(u + .01) - cx(u - .01)) / (.02 * SEG); g.position.set(cx(u), ty(u), cz(u)); g.rotation.y = Math.atan2(-d, 1); g.userData.u = u; g.userData.k = k; scene.add(g); return g; }
  function syncStations() { const lo = f - 5, hi = f + 13; for (let k = 0; k <= api.stations; k++) { const u = k ? k * api.every - 1 : 0, vis = u >= lo && u <= hi; if (vis && !stations.has(k)) stations.set(k, station(k)); else if (!vis && stations.has(k)) { const g = stations.get(k); scene.remove(g); g.traverse((m) => { if (m.geometry) { m.geometry.dispose(); m.material.dispose(); } }); stations.delete(k); } } }

  // ---- the train: an engine, an open wagon with Pogo in it, a closed wagon. Each car sits on the rails at its own place along the line.
  let train = null; const cars = [], wheels = [];
  function makeTrain() { train = new T3.Group(); const mat = (c) => new T3.MeshLambertMaterial({ color: c }), box = (g, w, h, l, c, x, y, z) => { const m = new T3.Mesh(new T3.BoxGeometry(w, h, l), mat(c)); m.position.set(x, y, z); g.add(m); return m; }, cyl = (g, r, r2, h, c, x, y, z, rx, rz) => { const m = new T3.Mesh(new T3.CylinderGeometry(r, r2, h, 14), mat(c)); m.position.set(x, y, z); m.rotation.x = rx || 0; m.rotation.z = rz || 0; g.add(m); return m; };
    const wh = (g, z, r) => { for (const x of [-1.5, 1.5]) { const w = cyl(g, r, r, .5, 0xc8402e, x, r, z, 0, Math.PI / 2); const hub = cyl(g, r * .42, r * .42, .56, 0xffd23c, x, r, z, 0, Math.PI / 2); const sp = box(g, .58, r * 1.7, .2, 0x8a2a1c, x, r, z); wheels.push([w, sp, r], [hub, null, r]); } };
    const eng = new T3.Group(); box(eng, 3, .7, 8.6, 0x24303a, 0, 1.5, 0); cyl(eng, 1.45, 1.45, 5, 0x2f8a55, 0, 3.2, 1.2, Math.PI / 2); cyl(eng, 1.52, 1.52, .4, 0xffd23c, 0, 3.2, 3.2, Math.PI / 2); cyl(eng, 1.52, 1.52, .4, 0xffd23c, 0, 3.2, .4, Math.PI / 2); cyl(eng, 1.3, 1.3, .3, 0x24303a, 0, 3.2, 3.76, Math.PI / 2);
    cyl(eng, .62, .42, 2.1, 0x24303a, 0, 5.4, 2.6); cyl(eng, .82, .62, .5, 0xffd23c, 0, 6.5, 2.6); cyl(eng, .6, .6, .9, 0xffd23c, 0, 4.9, .9); box(eng, 3.2, 3.6, 3, 0x2f8a55, 0, 3.6, -2.8); box(eng, 3.7, .4, 3.7, 0xc8402e, 0, 5.6, -2.8); box(eng, 3.26, 1.3, 1.5, 0x9fd8f0, 0, 4.2, -2.6);
    const cow = new T3.Mesh(new T3.CylinderGeometry(.2, 1.9, 1.6, 4, 1), mat(0xc8402e)); cow.rotation.x = Math.PI / 2; cow.rotation.y = Math.PI / 4; cow.position.set(0, 1.2, 4.9); cow.scale.set(1, 1, .6); eng.add(cow);
    const lamp = new T3.Mesh(new T3.SphereGeometry(.42, 10, 8), new T3.MeshBasicMaterial({ color: 0xfff3b0 })); lamp.position.set(0, 3.2, 3.95); eng.add(lamp);
    wh(eng, 2.6, .95); wh(eng, .2, .95); wh(eng, -2.8, 1.2); train.add(eng); cars.push([eng, 0]);
    const wag = new T3.Group(); box(wag, 3, .6, 6.4, 0x24303a, 0, 1.5, 0); box(wag, 3.2, 1.7, .3, 0xe0a23a, 0, 2.6, 3.05); box(wag, 3.2, 1.7, .3, 0xe0a23a, 0, 2.6, -3.05); box(wag, .3, 1.7, 6.4, 0xe0a23a, 1.45, 2.6, 0); box(wag, .3, 1.7, 6.4, 0xe0a23a, -1.45, 2.6, 0); box(wag, 3.3, .22, 6.5, 0xffd23c, 0, 3.5, 0).scale.set(1, 1, 1);
    wag.children[wag.children.length - 1].visible = false; wh(wag, 2, .8); wh(wag, -2, .8);
    // Pogo: white, long ears pink inside, red collar; he looks ahead and his ears lean back when the train runs
    const pogo = new T3.Group(), sph = (r, c, x, y, z, sx, sy, sz) => { const m = new T3.Mesh(new T3.SphereGeometry(r, 14, 10), mat(c)); m.position.set(x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); pogo.add(m); return m; };
    sph(1.15, 0xfffaf0, 0, 2.9, 0, 1, 1.05, .95); sph(1.02, 0xfffaf0, 0, 4.5, .15); const earL = new T3.Group(), earR = new T3.Group(); for (const [e, x] of [[earL, -.42], [earR, .42]]) { const a = new T3.Mesh(new T3.SphereGeometry(.34, 10, 8), mat(0xfffaf0)); a.scale.set(1, 3.2, .7); a.position.y = 1.05; e.add(a); const b = new T3.Mesh(new T3.SphereGeometry(.2, 8, 6), mat(0xf7a8bd)); b.scale.set(1, 3.6, .5); b.position.set(0, 1.05, .16); e.add(b); e.position.set(x, 5.25, .05); pogo.add(e); }
    sph(.13, 0x4a2a5a, -.36, 4.62, 1.06); sph(.13, 0x4a2a5a, .36, 4.62, 1.06); sph(.11, 0xf08aa0, 0, 4.36, 1.14); sph(.26, 0xf9c9d4, -.62, 4.3, .8, 1, .7, .5); sph(.26, 0xf9c9d4, .62, 4.3, .8, 1, .7, .5);
    const collar = new T3.Mesh(new T3.TorusGeometry(.72, .13, 6, 14), mat(0xd9432f)); collar.rotation.x = Math.PI / 2; collar.position.y = 3.72; pogo.add(collar); sph(.17, 0xffd23c, 0, 3.6, .74);
    pogo.position.y = -.2; wag.add(pogo); train.userData.ears = [earL, earR]; train.userData.pogo = pogo; train.add(wag); cars.push([wag, 9.1]);
    const van = new T3.Group(); box(van, 3, .6, 6.4, 0x24303a, 0, 1.5, 0); box(van, 3.1, 2.9, 6, 0xd9543c, 0, 3.2, 0); box(van, 3.5, .35, 6.6, 0xfff1d6, 0, 4.85, 0); box(van, 3.16, 1.1, 1.4, 0x9fd8f0, 0, 3.6, 1.4); box(van, 3.16, 1.1, 1.4, 0x9fd8f0, 0, 3.6, -1.4); wh(van, 2, .8); wh(van, -2, .8); train.add(van); cars.push([van, 17]);
    const sh = new T3.Mesh(new T3.PlaneGeometry(6, 28), new T3.MeshBasicMaterial({ color: 0, transparent: true, opacity: .16, depthWrite: false })); sh.rotation.x = -Math.PI / 2; train.userData.sh = sh;
    train.scale.setScalar(1.25); scene.add(train);
    const k = document.createElement("canvas"); k.width = k.height = 64; const x = k.getContext("2d"), g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.55, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const pt = new T3.CanvasTexture(k);
    for (let i = 0; i < 18; i++) { const s = new T3.Sprite(new T3.SpriteMaterial({ map: pt, transparent: true, depthWrite: false, opacity: 0 })); s.userData.life = 9; scene.add(s); smoke.push(s); }
    for (let i = 0; i < 9; i++) { const s = new T3.Sprite(new T3.SpriteMaterial({ map: pt, transparent: true, depthWrite: false, opacity: .5, fog: false })); s.userData.o = [hash(i, 1) * 600 - 300, 95 + hash(i, 2) * 50, hash(i, 3) * 700, 60 + hash(i, 4) * 70]; scene.add(s); clouds.push(s); } }
  let puffT = 0;
  function placeTrain(dt, speed) { const s = train.scale.x; for (const [g, back] of cars) { const u = trainU - .1 - back * s / SEG; P(u, V); P(u + .08, V2); g.position.set(V.x / s, (V.y + .82) / s, V.z / s); g.lookAt(V2.x, V2.y + .82, V2.z); }
    for (const [w, sp, r] of wheels) { const a = speed * SEG * dt / (r * s); if (sp) sp.rotation.x += a; }
    train.userData.pogo.position.y = -.2 + (speed < .05 ? Math.pow(Math.abs(Math.sin(clock * 1.7)), 3) * .22 : 0); const lean = clamp(speed * .5, 0, 1), sw = Math.sin(clock * 9) * .05 * lean; train.userData.ears[0].rotation.x = -(.15 + lean * .75) + sw; train.userData.ears[1].rotation.x = -(.15 + lean * .75) - sw; train.userData.pogo.position.y = -.2 + Math.abs(Math.sin(clock * (speed > .05 ? 11 : 2.2))) * (speed > .05 ? .1 : .05);
    puffT -= dt; if (puffT <= 0) { puffT = speed > .05 ? .09 : .55; const p = smoke.find((q) => q.userData.life >= 1); if (p) { cars[0][0].localToWorld(V.set(0, 6.9, 2.6)); p.position.copy(V); p.userData.life = 0; p.userData.v = [(hash(clock, 1) - .5) * 1.4, 5 + hash(clock, 2) * 2, (hash(clock, 3) - .5) * 1.4]; p.userData.s = 1.6 + hash(clock, 4); } }
    for (const p of smoke) { const L = p.userData; if (L.life >= 1) { p.material.opacity = 0; continue; } L.life += dt / 2.1; p.position.x += L.v[0] * dt; p.position.y += L.v[1] * dt * (1 - L.life * .5); p.position.z += L.v[2] * dt; const sc = L.s * (1 + L.life * 4.2); p.scale.set(sc, sc, 1); p.material.opacity = .62 * (1 - L.life) * sstep(L.life * 8); } }

  // ---- light and air: each place's sky colours; dark-sky places are lit low and blue
  const skyA = [0, 0, 0], skyB = [0, 0, 0]; let nightK = 0;
  function air(u) { const fq = clamp(u / 10 - .5, 0, 39), i = Math.floor(fq), k = sstep((fq - i - .25) / .5), a = api.sky[i], b = api.sky[Math.min(39, i + 1)]; mix3(hex(a[0]), hex(b[0]), k, skyA); mix3(hex(a[1]), hex(b[1]), k, skyB); nightK = lerp(NIGHT(a), NIGHT(b), k);
    const lk = lockAmt(u + 3) * .5; if (lk > 0) { mix3(skyA, [.6, .62, .64], lk, skyA); mix3(skyB, [.8, .8, .78], lk, skyB); }
    scene.fog.color.setRGB(skyB[0], skyB[1], skyB[2]); wrap.style.background = "linear-gradient(" + css(skyA) + " 0%," + css(skyB) + " 34%," + css(skyB) + " 100%)";
    sun.intensity = lerp(.8, .34, nightK); hemi.intensity = lerp(.62, .46, nightK); sun.color.setRGB(lerp(1, .62, nightK), lerp(.96, .72, nightK), lerp(.88, 1, nightK)); hemi.color.setRGB(lerp(skyB[0], 1, .5), lerp(skyB[1], 1, .5), lerp(skyB[2], 1, .5));
    water.material.color.setRGB(lerp(skyA[0], .12, .45), lerp(skyA[1], .55, .45), lerp(skyA[2], .7, .45)); }

  // ---- the camera chases the focus point along the line from behind and above
  function placeCam(ff, t, scenic) { const portrait = W < Hh, back = scenic ? 1.0 : (portrait ? 2.1 : 2.05) / zoom, up = scenic ? 30 : (portrait ? 64 : 52) / zoom; P(ff, V); P(ff - back, V2);
    const a = yaw + (scenic ? .16 : Math.sin(t * .23) * .035), dx = V2.x - V.x, dz = V2.z - V.z, ca = Math.cos(a), sa = Math.sin(a), px = V.x + dx * ca - dz * sa, pz = V.z + dx * sa + dz * ca;
    const gy = Math.max(Hgt(px, pz), 0) + (scenic ? 7 : 16); cam.position.set(px, Math.max(V2.y + up, gy), pz); P(ff + (scenic ? 2.3 : portrait ? .55 : .8), V3); cam.lookAt(V3.x, V3.y + (scenic ? 3 : 1.5), V3.z); }

  // ---- the line's height profile at the bottom: every place in its own colour, gold up to where the train is, stations ticked
  function drawProfile() { if (!tlc) return; const r = tlc.getBoundingClientRect(); if (!r.width) return; const w = r.width, h = r.height, d = Math.min(2, devicePixelRatio || 1); tlc.width = w * d; tlc.height = h * d; tlStatic = document.createElement("canvas"); tlStatic.width = tlc.width; tlStatic.height = tlc.height; const c = tlStatic.getContext("2d"); c.scale(d, d);
    const top = 6, base = h - 4, amax = 70, X = (u) => 4 + u / (N - 1) * (w - 8), Y = (u) => base - (ty(u) + 6) / amax * (base - top), g = [0, 0, 0];
    for (let x = 4; x < w - 4; x++) { const u = (x - 4) / (w - 8) * (N - 1); ground(u, g); const lk = u > cur ? .78 : 0; if (lk) { const l = g[0] * .3 + g[1] * .59 + g[2] * .11; mix3(g, [l, l, l], lk, g); } c.fillStyle = css(g); c.globalAlpha = u > cur ? .55 : .95; c.fillRect(x, Y(u), 1.2, base - Y(u)); }
    c.globalAlpha = 1; c.lineWidth = 1.4; c.strokeStyle = "rgba(255,255,255,.85)"; c.beginPath(); for (let x = 4; x <= w - 4; x++) { const u = (x - 4) / (w - 8) * (N - 1); x === 4 ? c.moveTo(x, Y(u)) : c.lineTo(x, Y(u)); } c.stroke();
    c.strokeStyle = "#ffc533"; c.lineWidth = 2.4; c.beginPath(); for (let x = 4; x <= X(cur); x++) { const u = (x - 4) / (w - 8) * (N - 1); x === 4 ? c.moveTo(x, Y(u)) : c.lineTo(x, Y(u)); } c.stroke();
    c.fillStyle = "rgba(255,255,255,.7)"; for (let k = 1; k <= api.stations; k++) c.fillRect(X(k * api.every - 1) - .5, top, 1, 5);
    tlStatic._ = { X, Y, w, h, d }; drawMarker(); }
  let lastMark = -1;
  function drawMarker() { if (!tlStatic) return; const { X, Y, d } = tlStatic._, c = tlc.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, tlc.width, tlc.height); c.drawImage(tlStatic, 0, 0); c.setTransform(d, 0, 0, d, 0, 0);
    const x = X(f); c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(x - .75, 2, 1.5, tlStatic._.h - 4); c.beginPath(); c.arc(X(trainU), Y(trainU), 4.5, 0, TAU); c.fillStyle = "#f0743a"; c.fill(); c.lineWidth = 2; c.strokeStyle = "#fff"; c.stroke(); lastMark = f; }
  let infoKey = "";
  function drawInfo() { const i = clamp(Math.round(f), 0, N - 1), ch = clamp(Math.floor(i / 10), 0, 39), nk = Math.min(api.stations, Math.floor((i + 1) / api.every) + 1), key = i + "|" + cur; if (key === infoKey) return; infoKey = key;
    info.querySelector("b").textContent = api.chapName(ch); info.querySelector("small").textContent = "Level " + (i + 1) + " · " + Math.round(ty(i) * 17) + " m"; const st = info.querySelector("i"); st.textContent = api.stationName(nk) + " · " + "Level " + (nk * api.every); info.classList.toggle("away", Math.abs(f - cur) > 1.5); }

  let touchT = 0;
  function frame(ts) { raf = 0; if (!host || host.hidden || document.hidden) return;
    // heat (2026-11-18 İdris "telefon ısınıyor"): the land is drawn at the screen's full rate only while something is being pulled, flung or ridden;
    // a still map (water, clouds, birds) is drawn at half rate, and at a quarter after twenty seconds without a touch
    const live = drag || pinch || ride || fv !== 0 || Math.abs(fc - f) > .004 || ts - touchT < 500; if (!live && ts - last < (ts - touchT > 20000 ? 60 : 30)) { raf = requestAnimationFrame(frame); return; }
    const dt = Math.min(live ? .05 : .1, (ts - last) / 1000 || .016); last = ts; clock += dt; let speed = 0;
    if (ride) { ride.t += dt / ride.dur; const e = eio(ride.t), u0 = trainU; trainU = lerp(ride.from, ride.to, e); speed = (trainU - u0) / dt; f = lerp(f, trainU, 1 - Math.exp(-dt / .25)); yaw = Math.sin(ride.t * Math.PI) * .22 * ride.dir; if (ride.t >= 1) { trainU = ride.to; ride = null; yaw = 0; if (api.arrived) api.arrived(); } }
    else { if (!drag) { f += fv * dt; fv *= Math.exp(-dt / .32); if (Math.abs(fv) < .02) fv = 0; yaw *= Math.exp(-dt / .4); } f = clamp(f, 0, N - 1); }
    needChunks(false); air(f); syncStops(); syncStations(); placeTrain(dt, speed); if (Math.abs(fc - f) > 6) fc = f; fc = lerp(fc, f, 1 - Math.exp(-dt / .075)); SWAY.value = clock; placeCam(fc, clock, false); birds(dt);
    water.position.set(cam.position.x, 0, cam.position.z - 300); waterTex.offset.set(clock * .012, clock * .02);
    for (const s of clouds) { const o = s.userData.o; s.position.set(cam.position.x + o[0] + Math.sin(clock * .02 + o[3]) * 40, cam.position.y + o[1], cam.position.z - 250 - o[2]); s.scale.set(o[3] * 2.2, o[3], 1); s.material.opacity = lerp(.55, .14, nightK); }
    R.render(scene, cam); if (Math.abs(f - lastMark) > .05 || ride) drawMarker(); drawInfo(); fps.n++; if (ts - fps.t > 1000) { fps.v = fps.n; fps.n = 0; fps.t = ts; }
    raf = requestAnimationFrame(frame); }
  const fps = { n: 0, t: 0, v: 0 };

  // ---- hands: pull up and down to travel the line, sideways to look round; a tap on a stop opens it
  let drag = null;
  function pick(x, y) { let best = null, bd = 52; 
    for (let i = Math.max(0, Math.floor(f) - 3); i <= Math.min(N - 1, Math.floor(f) + 10); i++) { const dd = (cx(i + .01) - cx(i - .01)) / (.02 * SEG), ll = 1 / Math.hypot(1, dd); V.set(cx(i) - 8.5 * ll, ty(i) + 8, cz(i) - 8.5 * dd * ll).project(cam); if (V.z <= 1) { const sx = (V.x * .5 + .5) * W, sy = (-V.y * .5 + .5) * Hh, d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = { i }; } } } for (const [k, g] of stations) { V.set(9, 4, 0); g.localToWorld(V); V.project(cam); const sx = (V.x * .5 + .5) * W, sy = (-V.y * .5 + .5) * Hh, d = Math.hypot(sx - x, sy - y); if (d < bd - 14) { bd = d + 14; best = { k }; } } return best; }
  // Pogo rides in the open wagon: a tap on him opens his card (stroke and feed), as the rabbit on the painted map did
  function onPogo(x, y) { if (!train || !cars[1]) return false; cars[1][0].localToWorld(V.set(0, 4.2, 0)); V.project(cam); if (V.z > 1) return false; return Math.hypot((V.x * .5 + .5) * W - x, (-V.y * .5 + .5) * Hh - y) < 44; }
  // birds: three small flocks circling ahead of the camera, wings beating; a dozen tiny meshes, placed from the clock
  const flock = []; function birds(dt) { if (!flock.length) { const wg = new T3.BufferGeometry(); wg.setAttribute("position", new T3.BufferAttribute(new Float32Array([0, 0, .5, 0, 0, -.5, 1.9, 0, -.15]), 3)); wg.computeVertexNormals(); const bm = new T3.MeshBasicMaterial({ color: 0x3a3f4a, side: T3.DoubleSide });
      for (let i = 0; i < 12; i++) { const b = new T3.Group(), l = new T3.Mesh(wg, bm), r = new T3.Mesh(wg, bm); r.scale.x = -1; b.add(l); b.add(r); b.userData = { l, r, k: Math.floor(i / 4), p: hash(i, 3) * TAU, o: [hash(i, 7) * 14 - 7, hash(i, 9) * 5, hash(i, 11) * 14 - 7] }; scene.add(b); flock.push(b); } }
    for (const b of flock) { const d = b.userData, a = clock * (.16 + d.k * .05) + d.k * 2.1, rad = 46 + d.k * 22; P(fc + 2.6 + d.k * 1.7, V); const x = V.x + Math.cos(a) * rad + d.o[0], z = V.z + Math.sin(a) * rad * .7 + d.o[2];
      b.position.set(x, V.y + 30 + d.k * 7 + d.o[1] + Math.sin(clock * .7 + d.p) * 1.5, z); b.rotation.y = -a - Math.PI / 2 + Math.PI; const fl = Math.sin(clock * 9 + d.p) * .7; d.l.rotation.z = fl; d.r.rotation.z = -fl; } }
  function hands() { const el = cv; el.addEventListener("pointerdown", (e) => { touchT = performance.now(); ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size >= 2) { const a = [...ptrs.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1, z: zoom }; drag = null; fv = 0; return; } if (ride) return; drag = { x: e.clientX, y: e.clientY, f, yaw, moved: 0, t: performance.now(), ly: e.clientY, lt: performance.now(), v: 0 }; fv = 0; try { el.setPointerCapture(e.pointerId); } catch (_) {} });
    el.addEventListener("pointermove", (e) => { if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (pinch && ptrs.size >= 2) { const a = [...ptrs.values()]; zoom = clamp(pinch.z * Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) / pinch.d, .8, 2.1); return; } if (!drag) return; const dy = e.clientY - drag.y, dx = e.clientX - drag.x, now = performance.now(); drag.moved = Math.max(drag.moved, Math.abs(dx), Math.abs(dy)); if (drag.moved < 7) return; f = clamp(drag.f + dy / 124, 0, N - 1); yaw = clamp(drag.yaw - dx / 260, -.7, .7); if (now > drag.lt) { drag.v = lerp(drag.v, (e.clientY - drag.ly) / 124 / ((now - drag.lt) / 1000), .5); drag.ly = e.clientY; drag.lt = now; } });
    const end = (e) => { touchT = performance.now(); ptrs.delete(e.pointerId); if (pinch) { if (ptrs.size < 2) pinch = null; drag = null; return; } if (!drag) return; const d = drag; drag = null; if (d.moved < 7 && e.type === "pointerup") { const r = el.getBoundingClientRect(); if (onPogo(e.clientX - r.left, e.clientY - r.top)) { if (api.openPet) api.openPet(); return; } const h = pick(e.clientX - r.left, e.clientY - r.top); if (h && h.i != null) api.open(h.i); else if (h) api.openStation(h.k); } else if (performance.now() - d.lt < 90) fv = clamp(d.v, -13, 13); };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end); el.addEventListener("wheel", (e) => { touchT = performance.now(); e.preventDefault(); if (e.ctrlKey) { zoom = clamp(zoom * Math.exp(-e.deltaY / 240), .8, 2.1); return; } if (ride) return; fv = clamp(fv - e.deltaY / 110, -13, 13); }, { passive: false });
    const scrub = (e) => { if (ride || !tlStatic) return; const r = tlc.getBoundingClientRect(); f = clamp((e.clientX - r.left - 4) / (r.width - 8), 0, 1) * (N - 1); fv = 0; }; let sc = false;
    tl.addEventListener("pointerdown", (e) => { sc = true; try { tl.setPointerCapture(e.pointerId); } catch (_) {} scrub(e); }); tl.addEventListener("pointermove", (e) => { if (sc) scrub(e); }); tl.addEventListener("pointerup", () => { sc = false; }); tl.addEventListener("pointercancel", () => { sc = false; });
    info.addEventListener("click", () => { if (!ride) { fv = 0; glide(cur); } }); }
  let glideRaf = 0; function glide(to) { cancelAnimationFrame(glideRaf); const from = f, t0 = performance.now(), dur = Math.min(1600, 500 + Math.abs(to - from) * 60); const st = (ts) => { const k = clamp((ts - t0) / dur, 0, 1); f = lerp(from, to, eio(k)); if (k < 1 && !drag) glideRaf = requestAnimationFrame(st); }; glideRaf = requestAnimationFrame(st); }

  function size() { if (!R) return; W = host.clientWidth || innerWidth; Hh = host.clientHeight || innerHeight; dpr = Math.min(W < 600 ? 1.5 : 2, devicePixelRatio || 1); R.setPixelRatio(dpr); R.setSize(W, Hh, false); cam.aspect = W / Hh; cam.fov = W < Hh ? 56 : 44; cam.updateProjectionMatrix(); drawProfile(); }
  function init(a) { api = a; host = a.host; N = a.N; api.G = a.ground.map(hex);
    try { cv = document.createElement("canvas"); R = new T3.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" }); } catch (e) { ok = false; return false; }
    wrap = document.createElement("div"); wrap.id = "m3d"; wrap.appendChild(cv); host.insertBefore(wrap, host.firstChild); host.classList.add("m3d");
    info = document.createElement("button"); info.type = "button"; info.id = "m3dInfo"; info.className = "m3dGlass"; info.innerHTML = "<b></b><small></small><i></i>"; host.appendChild(info);
    { const pb = document.createElement("button"); pb.type = "button"; pb.id = "m3dPogo"; pb.className = "m3dGlass"; pb.setAttribute("aria-label", "Pogo"); pb.innerHTML = '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><ellipse cx="17" cy="12" rx="4.6" ry="11" fill="#fffaf0"/><ellipse cx="31" cy="12" rx="4.6" ry="11" fill="#fffaf0"/><ellipse cx="17" cy="13" rx="2" ry="7.5" fill="#f6b9c6"/><ellipse cx="31" cy="13" rx="2" ry="7.5" fill="#f6b9c6"/><ellipse cx="24" cy="31" rx="15" ry="13" fill="#fffaf0"/><circle cx="18.5" cy="29" r="1.9" fill="#4a2a5a"/><circle cx="29.5" cy="29" r="1.9" fill="#4a2a5a"/><ellipse cx="24" cy="33.5" rx="1.8" ry="1.3" fill="#f08aa0"/><ellipse cx="14" cy="34" rx="2.8" ry="1.8" fill="#f9c9d4"/><ellipse cx="34" cy="34" rx="2.8" ry="1.8" fill="#f9c9d4"/></svg>'; pb.addEventListener("click", () => { if (api.openPet) api.openPet(); }); host.appendChild(pb); }
    tl = document.createElement("div"); tl.id = "m3dTl"; tl.className = "m3dGlass"; tlc = document.createElement("canvas"); tl.appendChild(tlc); host.appendChild(tl);
    scene = new T3.Scene(); scene.fog = new T3.Fog(0xffffff, 230, 780); cam = new T3.PerspectiveCamera(56, 1, 2, 1500);
    hemi = new T3.HemisphereLight(0xffffff, 0x6a705a, .72); scene.add(hemi); sun = new T3.DirectionalLight(0xffffff, .95); sun.position.set(-.55, .8, .35); scene.add(sun);
    const k = document.createElement("canvas"); k.width = k.height = 256; const x = k.getContext("2d"), id = x.createImageData(256, 256); for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const a = i * TAU / 256, b = j * TAU / 256;
      const w = Math.sin(a * 2 + Math.sin(b * 3) * .9) * .34 + Math.sin(b * 3 + Math.sin(a * 2) * 1.1) * .3 + Math.sin((a + b) * 5 + Math.sin(a * 4) * .6) * .2 + Math.sin((a * 7 - b * 6)) * .1, gl = Math.pow(Math.max(0, w), 2.2) * 26, v = 226 + 16 * w + gl, o = (j * 256 + i) * 4; id.data[o] = id.data[o + 1] = id.data[o + 2] = Math.min(255, v); id.data[o + 3] = 255; } x.putImageData(id, 0, 0);
    waterTex = new T3.CanvasTexture(k); waterTex.wrapS = waterTex.wrapT = T3.RepeatWrapping; waterTex.repeat.set(34, 34); waterTex.anisotropy = 4;
    water = new T3.Mesh(new T3.PlaneGeometry(2400, 2400), new T3.MeshPhongMaterial({ color: 0x2f9ad0, map: waterTex, transparent: true, opacity: .9, shininess: 140, specular: 0xbfd9e6 })); water.rotation.x = -Math.PI / 2; scene.add(water);
    makeTrain(); hands(); addEventListener("resize", () => { clearTimeout(size.t); size.t = setTimeout(size, 120); }); document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
    cur = api.cur(); f = fc = trainU = cur; builtCur = cur; size(); return true; }
  function kick() { if (!raf && host && !host.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  // called whenever the map is shown: takes the player's place in; when it has moved on since last time, the train rides there
  function sync(a) { if (!ok) return false; if (!R) { if (!init(a)) return false; } api = Object.assign(api, a); api.G = a.ground.map(hex); const c = api.cur();
    if (c !== cur) { const from = cur; cur = c; for (const o of chunks.values()) paintChunk(o); infoKey = ""; if (c > from && c - from <= 3 && !window.__fast) { trainU = from; f = from; ride = { from, to: c, t: 0, dur: 2.6 + (c - from) * .5, dir: c % 2 ? 1 : -1 }; } else { trainU = f = c; ride = null; } }
    if (!W || W !== (host.clientWidth || innerWidth)) size(); else drawProfile(); needChunks(true); kick(); return true; }
  // a level's backdrop: the same land from low beside the rails at that stop, as one picture
  function still(i, w, h) { if (!R || !ok) return null; const keep = [f, yaw, W, Hh, cam.aspect, cam.fov]; try { f = i; yaw = 0; W = w; Hh = h; R.setPixelRatio(1); R.setSize(w, h, false); cam.aspect = w / h; cam.fov = 60; cam.updateProjectionMatrix(); needChunks(true); air(i); for (const s of stopPool) s.visible = false; train.visible = false; syncStations(); placeCam(i, 0, true); water.position.set(cam.position.x, 0, cam.position.z - 300);
      for (const s of clouds) { const o = s.userData.o; s.position.set(cam.position.x + o[0], cam.position.y + o[1] * .6, cam.position.z - 250 - o[2]); s.scale.set(o[3] * 2.2, o[3], 1); }
      R.render(scene, cam); const k = document.createElement("canvas"); k.width = w; k.height = h; const x = k.getContext("2d"), g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, css(skyA)); g.addColorStop(.4, css(skyB)); g.addColorStop(1, css(skyB)); x.fillStyle = g; x.fillRect(0, 0, w, h); x.drawImage(cv, 0, 0, w, h); return k; }
    finally { train.visible = true; [f, yaw, W, Hh] = keep; cam.aspect = keep[4]; cam.fov = keep[5]; cam.updateProjectionMatrix(); R.setPixelRatio(dpr); R.setSize(W, Hh, false); } }
  window.MAP3D = { sync, still, get ok() { return ok; }, get fps() { return fps.v; }, state: () => ({ f, cur, trainU, chunks: chunks.size, ride: !!ride, tris: R ? R.info.render.triangles : 0, calls: R ? R.info.render.calls : 0 }), go: (u) => { f = fc = clamp(u, 0, N - 1); fv = 0; }, get zoom() { return zoom; }, onPogo, height: ty, pick };
})();
