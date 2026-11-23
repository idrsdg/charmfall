// Pogo's live model (2026-11-24): the 24k-triangle, 47-bone mesh from Blender (pogo-mesh.js) as one GPU-skinned draw inside the P3 stage. The hand-keyed clips in
// pogo-anim.js and every mood in index.html still produce the same small pose ({ hx, lz, ear, eye, ... }); pose() below turns it into bone rotations each screen frame.
// Bones have no rest rotation, so a bone's quaternion is its rotation in model axes. r(b, ax, ay, az) is written in Blender's axes (x right, y back, z up), the rig's own.
window.PogoRig = function (T, fox, carrot) {
  const D = window.POGO_MESH; if (!D) return null;
  try {
    const raw = atob(D.b), u8 = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
    const nv = D.nv, ni = D.ni, dv = new DataView(u8.buffer); let o = 0;
    const pos = new Float32Array(nv * 3); for (let i = 0; i < nv * 3; i++, o += 2) pos[i] = D.lo[i % 3] + dv.getUint16(o, true) / 65535 * D.rg[i % 3];
    const nor = new Int8Array(u8.buffer.slice(o, o + nv * 3)); o += nv * 3;
    const gam = new Float32Array(256); for (let i = 0; i < 256; i++) gam[i] = Math.pow(i / 255, 2.2);
    const col = new Float32Array(nv * 3); for (let i = 0; i < nv * 3; i++) col[i] = gam[u8[o++]];
    const uv = u8.slice(o, o + nv * 2); o += nv * 2; const ji = u8.slice(o, o + nv * 4); o += nv * 4; const jw = u8.slice(o, o + nv * 4); o += nv * 4;
    const idx = new Uint16Array(ni); for (let i = 0; i < ni; i++, o += 2) idx[i] = dv.getUint16(o, true);
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("normal", new T.BufferAttribute(nor, 3, true)); g.setAttribute("color", new T.BufferAttribute(col, 3)); g.setAttribute("uv", new T.BufferAttribute(uv, 2, true)); g.setAttribute("skinIndex", new T.BufferAttribute(ji, 4)); g.setAttribute("skinWeight", new T.BufferAttribute(jw, 4, true)); g.setIndex(new T.BufferAttribute(idx, 1));
    const tr = atob(D.t), tw = D.tw, rgba = new Uint8Array(tw * tw * 4); for (let i = 0; i < tw * tw; i++) { rgba[i * 4] = tr.charCodeAt(i * 3); rgba[i * 4 + 1] = tr.charCodeAt(i * 3 + 1); rgba[i * 4 + 2] = tr.charCodeAt(i * 3 + 2); rgba[i * 4 + 3] = 255; }
    const tex = new T.DataTexture(rgba, tw, tw, T.RGBAFormat, T.UnsignedByteType); tex.encoding = T.sRGBEncoding; tex.generateMipmaps = true; tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter; tex.needsUpdate = true;
    const mesh = new T.SkinnedMesh(g, new T.MeshLambertMaterial({ map: tex, vertexColors: true })); mesh.frustumCulled = false;
    const bones = D.bones.map(() => new T.Bone()), by = {}, rest = {};
    D.bones.forEach(([n, par, x, y, z], i) => { const b = bones[i]; b.name = n; by[n] = b; rest[n] = new T.Vector3(x, y, z); if (par < 0) { b.position.set(x, y, z); mesh.add(b); } else { const q = D.bones[par]; b.position.set(x - q[2], y - q[3], z - q[4]); bones[par].add(b); } });
    // the old sphere-built figure stays in the scene graph only as empty groups (nothing of it is drawn); the carrot moves to the new head
    const inCarrot = new Set(); carrot.traverse((c) => inCarrot.add(c)); fox.traverse((c) => { if (c.isMesh && !inCarrot.has(c)) c.visible = false; });
    fox.add(mesh); fox.updateMatrixWorld(true); const sk = new T.Skeleton(bones); mesh.bind(sk);
    by.head.add(carrot); carrot.position.set(0, .056, .66);
    const X = new T.Vector3(1, 0, 0), Y = new T.Vector3(0, 0, -1), Z = new T.Vector3(0, 1, 0), qa = new T.Quaternion(), qb = new T.Quaternion(), qc = new T.Quaternion();
    const r = (b, ax, ay, az) => { qa.setFromAxisAngle(Z, az); qb.setFromAxisAngle(Y, ay); qc.setFromAxisAngle(X, ax); b.quaternion.copy(qa).multiply(qb).multiply(qc); };
    const DEG = Math.PI / 180, RAISE = 60 * DEG, EK = [.17, .26, .3, .3], ang = (y, z) => Math.atan2(-z, -y);
    // a two-bone leg in the side plane: the foot is lifted by `lift`, the knee stays forward
    const legs = ["L", "R"].map((s) => { const H = rest["thigh." + s], K = rest["shin." + s], A = rest["foot." + s], l1 = Math.hypot(K.y - H.y, K.z - H.z), l2 = Math.hypot(A.y - K.y, A.z - K.z); return { t: by["thigh." + s], n: by["shin." + s], f: by["ik_foot." + s], f0: by["ik_foot." + s].position.y, H, A, l1, l2, t0: ang(K.y - H.y, K.z - H.z), n0: ang(A.y - K.y, A.z - K.z) }; });
    const leg = (L, lift) => { L.f.position.y = L.f0 + lift; const ty = L.A.y + lift - L.H.y, tz = L.A.z - L.H.z, d = Math.min(L.l1 + L.l2 - .001, Math.max(.02, Math.hypot(ty, tz))), a = Math.acos(Math.max(-1, Math.min(1, (L.l1 * L.l1 + d * d - L.l2 * L.l2) / (2 * L.l1 * d)))), th = ang(ty, tz) - a, ky = -Math.cos(th) * L.l1, kz = -Math.sin(th) * L.l1, sn = ang(ty - ky, tz - kz), dt = th - L.t0; r(L.t, dt, 0, 0); r(L.n, sn - L.n0 - dt, 0, 0); };
    // the arm swings in or out first and is then lifted, the order the keyed clips were written for (paws meet at the mouth, the chest, in a clap)
    const arm = (s, x, z, ref) => { let side = -(z - ref); const m = Math.abs(side); side = Math.sign(side) * (m < RAISE ? m : RAISE + (m - RAISE) * .22); const up = Math.min(0, x); r(by["shoulder." + s], 0, side * .24, 0); qb.setFromAxisAngle(Y, side * .76); qc.setFromAxisAngle(X, x); by["upperarm." + s].quaternion.copy(qc).multiply(qb); r(by["forearm." + s], up * .16, side * .08, 0); r(by["hand." + s], up * .08, 0, 0); };
    const pose = (c, E, ey, t, fat) => {
      r(by.spine1, 0, -c.tz * .4, c.ty * .3); r(by.spine2, 0, -c.tz * .3, c.ty * .3); r(by.chest, 0, -c.tz * .3, c.ty * .4); r(by.neck, c.hx * .35, -c.hz * .35, c.hy * .35); r(by.head, c.hx * .65, -c.hz * .65, c.hy * .65);
      const br = 1 + Math.sin(t * 3) * .015, sx = 1 + fat * .13, sy = br * (1 + fat * .08), sz = 1 + fat * .11; by.spine1.scale.set(sx, sy, sz); by.neck.scale.set((1 + fat * .14) / sx, (1 + fat * .06) / sy, (1 + fat * .12) / sz);
      arm("R", c.lx, c.lz, -.3); arm("L", c.rx, c.rz, .3); leg(legs[1], c.fl); leg(legs[0], c.fr);
      const shut = Math.max(0, Math.min(1, 1 - ey)), wide = Math.max(0, ey - 1), up = (Math.pow(shut, 2.2) * 67 - wide * 18) * DEG, lo = (-Math.pow(shut, .9) * 59 + wide * 12) * DEG;
      for (const s of ["L", "R"]) { r(by["lid_up." + s], up, 0, 0); r(by["lid_lo." + s], lo, 0, 0); r(by["eye." + s], -c.gy * .55, 0, c.gx * .62); }
      r(by.jaw, c.mo * 11 * DEG, 0, 0);
      const e = c.ear * 2.27; for (let i = 0; i < 4; i++) { const k = EK[i], back = -Math.abs(c.ear) * .42 * k + E.a * k; r(by["ear.L." + (i + 1)], back - c.ef * .6 * k, (e - E.b * .9 + c.ef * .3) * k, 0); r(by["ear.R." + (i + 1)], back, -(e + E.b) * k, 0); }
      const tw = Math.sin(t * 9) * .25 + E.b; for (let i = 0; i < 3; i++) r(by["tail." + (i + 1)], E.a * (.3 + i * .15), 0, tw * (.25 + i * .15));
      sk.frame = -1;   // the same skeleton is drawn by two renderers and for several Pogos a frame; each draw must re-upload its pose
    };
    const gpuBytes = pos.byteLength + nor.byteLength + col.byteLength + uv.byteLength + ji.byteLength + jw.byteLength + idx.byteLength + Math.round(rgba.byteLength * 4 / 3) + 64 * 64 * 16;
    window.POGO_MESH = null; window.__pogoRig = { tris: ni / 3, joints: bones.length, gpuBytes };
    return { mesh, pose };
  } catch (e) { console.warn("Pogo rig fell back to the old figure", e); return null; }
};
