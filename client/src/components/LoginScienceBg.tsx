import { useEffect, useRef } from "react";
import * as THREE from "three";

const TEAL = 0x5ec8c0;
const GOLD = 0xd4b06a;
const CHAMP = 0xf0e0b8;
const EMBER = 0xe07a5f;
const INK = 0x07121c;

function makeGlowSprite(color: number, size = 128) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const hex = `#${color.toString(16).padStart(6, "0")}`;
  grd.addColorStop(0, hex);
  grd.addColorStop(0.35, hex + "88");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Sprite(mat);
}

function createDNA(): THREE.Group {
  const group = new THREE.Group();
  const pairs = 22;
  const height = 7.5;
  const radius = 0.85;
  const turns = 2.6;
  const backboneA: THREE.Vector3[] = [];
  const backboneB: THREE.Vector3[] = [];

  for (let i = 0; i < pairs; i++) {
    const u = i / (pairs - 1);
    const y = -height / 2 + u * height;
    const ang = u * turns * Math.PI * 2;
    const a = new THREE.Vector3(Math.cos(ang) * radius, y, Math.sin(ang) * radius);
    const b = new THREE.Vector3(Math.cos(ang + Math.PI) * radius, y, Math.sin(ang + Math.PI) * radius);
    backboneA.push(a);
    backboneB.push(b);

    const rungGeo = new THREE.CylinderGeometry(0.04, 0.04, a.distanceTo(b), 6);
    const rungMat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? TEAL : EMBER,
      emissive: i % 2 === 0 ? TEAL : EMBER,
      emissiveIntensity: 0.35,
      metalness: 0.2,
      roughness: 0.4,
    });
    const rung = new THREE.Mesh(rungGeo, rungMat);
    rung.position.copy(a).add(b).multiplyScalar(0.5);
    rung.lookAt(b);
    rung.rotateX(Math.PI / 2);
    group.add(rung);

    for (const p of [a, b]) {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({
          color: p === a ? TEAL : EMBER,
          emissive: p === a ? TEAL : EMBER,
          emissiveIntensity: 0.5,
        })
      );
      node.position.copy(p);
      group.add(node);
    }
  }

  const tubeMatA = new THREE.MeshStandardMaterial({
    color: TEAL,
    emissive: TEAL,
    emissiveIntensity: 0.25,
    metalness: 0.3,
    roughness: 0.35,
  });
  const tubeMatB = new THREE.MeshStandardMaterial({
    color: EMBER,
    emissive: EMBER,
    emissiveIntensity: 0.25,
    metalness: 0.3,
    roughness: 0.35,
  });
  const curveA = new THREE.CatmullRomCurve3(backboneA);
  const curveB = new THREE.CatmullRomCurve3(backboneB);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curveA, 64, 0.06, 8, false), tubeMatA));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curveB, 64, 0.06, 8, false), tubeMatB));
  return group;
}

function createMolecule(): THREE.Group {
  const group = new THREE.Group();
  const R = 1.1;
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    positions.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0));
  }
  positions.push(new THREE.Vector3(R + 0.9, 0.1, 0.2));
  positions.push(new THREE.Vector3(-(R + 0.9), -0.15, -0.15));
  positions.push(new THREE.Vector3(0.2, R + 0.85, 0.1));

  const colors = [GOLD, TEAL, GOLD, TEAL, GOLD, TEAL, EMBER, CHAMP, TEAL];
  const bonds: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
    [0, 6],
    [3, 7],
    [4, 8],
  ];

  for (const [i, j] of bonds) {
    const a = positions[i]!;
    const b = positions[j]!;
    const geo = new THREE.CylinderGeometry(0.05, 0.05, a.distanceTo(b), 8);
    const mat = new THREE.MeshStandardMaterial({
      color: CHAMP,
      emissive: GOLD,
      emissiveIntensity: 0.15,
      metalness: 0.4,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.lookAt(b);
    mesh.rotateX(Math.PI / 2);
    group.add(mesh);
  }

  positions.forEach((p, i) => {
    const col = colors[i] ?? GOLD;
    const atom = new THREE.Mesh(
      new THREE.SphereGeometry(i < 6 ? 0.28 : 0.22, 16, 16),
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.4,
        metalness: 0.35,
        roughness: 0.3,
      })
    );
    atom.position.copy(p);
    group.add(atom);
    const glow = makeGlowSprite(col);
    glow.scale.setScalar(1.1);
    glow.position.copy(p);
    group.add(glow);
  });

  return group;
}

function createAtom(): THREE.Group {
  const group = new THREE.Group();
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 24, 24),
    new THREE.MeshStandardMaterial({
      color: GOLD,
      emissive: GOLD,
      emissiveIntensity: 0.7,
      metalness: 0.5,
      roughness: 0.25,
    })
  );
  group.add(nucleus);
  const coreGlow = makeGlowSprite(GOLD);
  coreGlow.scale.setScalar(2.2);
  group.add(coreGlow);

  const orbitData = [
    { rx: 1.4, ry: 0.55, color: TEAL, speed: 1.1 },
    { rx: 1.9, ry: 0.7, color: GOLD, speed: -0.75 },
    { rx: 2.4, ry: 0.9, color: CHAMP, speed: 0.55 },
  ];

  for (const o of orbitData) {
    const curve = new THREE.EllipseCurve(0, 0, o.rx, o.ry, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(64).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const loop = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: o.color, transparent: true, opacity: 0.45 })
    );
    group.add(loop);

    const electron = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({
        color: o.color,
        emissive: o.color,
        emissiveIntensity: 0.8,
      })
    );
    electron.userData = { rx: o.rx, ry: o.ry, speed: o.speed, phase: Math.random() * Math.PI * 2 };
    group.add(electron);

    const eg = makeGlowSprite(o.color);
    eg.scale.setScalar(0.7);
    electron.add(eg);
  }

  return group;
}

/**
 * Full WebGL 3D STEM scene behind the login form.
 */
export function LoginScienceBg() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(INK, 0.045);
    scene.background = new THREE.Color(INK);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.6, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(INK, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      zIndex: "0",
      pointerEvents: "none",
    });

    // Lights
    scene.add(new THREE.AmbientLight(0x6a8090, 0.55));
    const key = new THREE.PointLight(TEAL, 2.2, 40);
    key.position.set(-4, 3, 6);
    scene.add(key);
    const fill = new THREE.PointLight(GOLD, 1.8, 40);
    fill.position.set(5, -2, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(CHAMP, 0.6);
    rim.position.set(0, 4, -6);
    scene.add(rim);

    // Floor grid (subtle lab plane)
    const grid = new THREE.GridHelper(40, 40, 0x1a3040, 0x122030);
    grid.position.y = -4.2;
    scene.add(grid);

    // STEM objects
    const dna = createDNA();
    dna.position.set(-4.2, 0.2, -1);
    dna.rotation.z = -0.25;
    scene.add(dna);

    const molecule = createMolecule();
    molecule.position.set(4.4, 1.1, -0.5);
    scene.add(molecule);

    const atom = createAtom();
    atom.position.set(0, 0.3, -2.5);
    scene.add(atom);

    // Math: icosahedron + torus knot
    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({
        color: TEAL,
        emissive: TEAL,
        emissiveIntensity: 0.2,
        wireframe: true,
        metalness: 0.5,
        roughness: 0.3,
      })
    );
    ico.position.set(3.2, -2.2, 0.5);
    scene.add(ico);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.7, 0.18, 100, 16),
      new THREE.MeshStandardMaterial({
        color: GOLD,
        emissive: GOLD,
        emissiveIntensity: 0.25,
        metalness: 0.6,
        roughness: 0.25,
      })
    );
    knot.position.set(-3.4, -2.4, 1);
    scene.add(knot);

    // Floating particles
    const pCount = 400;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 28;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 2;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const points = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: CHAMP,
        size: 0.05,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(points);

    // Connecting energy lines (DNA ↔ atom ↔ molecule)
    const lineMat = new THREE.LineBasicMaterial({
      color: TEAL,
      transparent: true,
      opacity: 0.25,
    });
    const linkGeo = new THREE.BufferGeometry().setFromPoints([
      dna.position.clone(),
      atom.position.clone(),
      molecule.position.clone(),
      knot.position.clone(),
      ico.position.clone(),
      dna.position.clone(),
    ]);
    const links = new THREE.Line(linkGeo, lineMat);
    scene.add(links);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMove(e: PointerEvent) {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const clock = new THREE.Clock();
    let alive = true;

    function tick() {
      if (!alive) return;
      const t = clock.getElapsedTime();
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      dna.rotation.y = t * 0.35;
      molecule.rotation.y = t * 0.55;
      molecule.rotation.x = Math.sin(t * 0.4) * 0.25;
      atom.rotation.y = t * 0.25;
      atom.rotation.x = t * 0.12;
      ico.rotation.x = t * 0.4;
      ico.rotation.y = t * 0.55;
      knot.rotation.x = t * 0.6;
      knot.rotation.y = t * 0.35;
      points.rotation.y = t * 0.03;

      // Orbit electrons
      atom.children.forEach((child) => {
        const d = child.userData as { rx?: number; ry?: number; speed?: number; phase?: number };
        if (d.rx != null && d.ry != null && d.speed != null) {
          const ang = t * d.speed + (d.phase ?? 0);
          child.position.set(Math.cos(ang) * d.rx, Math.sin(ang) * d.ry, Math.sin(ang * 0.5) * 0.2);
        }
      });

      // Camera parallax orbit
      const camR = 11;
      camera.position.x = Math.sin(pointer.x * 0.45) * camR * 0.22;
      camera.position.y = 0.6 + pointer.y * 0.9;
      camera.position.z = camR - Math.abs(pointer.x) * 0.8;
      camera.lookAt(atom.position.x * 0.3, 0.2, -1);

      key.intensity = 2.0 + Math.sin(t * 2) * 0.3;
      fill.intensity = 1.6 + Math.cos(t * 1.6) * 0.25;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}

export default LoginScienceBg;
