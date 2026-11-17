import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Space3DBackgroundProps {
  opacity?: number;
  showGrid?: boolean;
  interactive?: boolean;
  particleCount?: number;
}

/**
 * Premium 3D Atmospheric Spatial Background
 * Multi-layered dark aesthetic, fine interconnected knowledge nodes,
 * subtle volumetric ambient lighting, and smooth cursor parallax.
 * Designed to provide deep visual richness without cluttering or degrading readability.
 */
export function Space3DBackground({
  opacity = 0.75,
  interactive = true,
  particleCount = 180
}: Space3DBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040711, 0.038);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0.5, 12);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Ambient & Accent Lighting ---
    const ambientLight = new THREE.AmbientLight(0x080f24, 1.5);
    scene.add(ambientLight);

    const cyanPoint = new THREE.PointLight(0x38bdf8, 2.5, 35);
    cyanPoint.position.set(6, 5, 8);
    scene.add(cyanPoint);

    const violetPoint = new THREE.PointLight(0x818cf8, 2.2, 35);
    violetPoint.position.set(-7, -4, 6);
    scene.add(violetPoint);

    // --- 1. Foreground Knowledge Network Particles ---
    const pCount = Math.min(particleCount, 220);
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pVelocities = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    const palette = [
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0x60a5fa), // Blue
      new THREE.Color(0x818cf8), // Soft Violet
      new THREE.Color(0xa5b4fc), // Lavender
      new THREE.Color(0x34d399)  // Mint Accent
    ];

    for (let i = 0; i < pCount; i++) {
      const idx = i * 3;
      pPositions[idx] = (Math.random() - 0.5) * 28;
      pPositions[idx + 1] = (Math.random() - 0.5) * 18;
      pPositions[idx + 2] = (Math.random() - 0.5) * 16 - 2;

      pVelocities[idx] = (Math.random() - 0.5) * 0.0035;
      pVelocities[idx + 1] = (Math.random() - 0.5) * 0.0035;
      pVelocities[idx + 2] = (Math.random() - 0.5) * 0.0025;

      const col = palette[Math.floor(Math.random() * palette.length)];
      pColors[idx] = col.r;
      pColors[idx + 1] = col.g;
      pColors[idx + 2] = col.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    // High-precision circular glowing particle canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(56, 189, 248, 0.85)');
      grad.addColorStop(0.55, 'rgba(99, 102, 241, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const pMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // --- 2. Dynamic Interconnected Knowledge Strands ---
    const maxConnections = 140;
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineColors = new Float32Array(maxConnections * 2 * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const connectionLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(connectionLines);

    // --- 3. Distant Ambient Deep-Space Dust ---
    const starCount = 120;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 45;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      starPos[i * 3 + 2] = -12 - Math.random() * 20;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // --- Interactive Mouse Parallax ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouse.targetX = (clientX / rect.width) * 2 - 1;
      mouse.targetY = -(clientY / rect.height) * 2 + 1;
    };

    if (interactive && !prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // --- Window Resize ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const motionMultiplier = prefersReducedMotion ? 0.05 : 1.0;

      // Smooth camera parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.038;
      mouse.y += (mouse.targetY - mouse.y) * 0.038;

      camera.position.x = mouse.x * 1.4;
      camera.position.y = 0.5 + mouse.y * 0.9;
      camera.lookAt(0, 0, -2);

      // Subtle light drift
      cyanPoint.position.x = 6 + Math.sin(elapsed * 0.5 * motionMultiplier) * 2;
      cyanPoint.position.y = 5 + Math.cos(elapsed * 0.7 * motionMultiplier) * 1.5;
      violetPoint.position.x = -7 + Math.cos(elapsed * 0.4 * motionMultiplier) * 2;

      // Update particle positions
      const posAttr = pGeo.attributes.position;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < pCount; i++) {
        const idx = i * 3;
        positions[idx] += pVelocities[idx] * motionMultiplier;
        positions[idx + 1] += (pVelocities[idx + 1] + Math.sin(elapsed * 0.6 + i) * 0.001) * motionMultiplier;
        positions[idx + 2] += pVelocities[idx + 2] * motionMultiplier;

        // Wrap around bounds
        if (positions[idx] > 15) positions[idx] = -15;
        if (positions[idx] < -15) positions[idx] = 15;
        if (positions[idx + 1] > 10) positions[idx + 1] = -10;
        if (positions[idx + 1] < -10) positions[idx + 1] = 10;
        if (positions[idx + 2] > 6) positions[idx + 2] = -14;
        if (positions[idx + 2] < -14) positions[idx + 2] = 6;
      }
      posAttr.needsUpdate = true;

      // Connect nearby particles with thin strands
      let lineVertexIdx = 0;
      const lPositions = lineGeo.attributes.position.array as Float32Array;
      const lColors = lineGeo.attributes.color.array as Float32Array;

      const connectionDist = 4.2;

      for (let i = 0; i < pCount && lineVertexIdx < maxConnections; i++) {
        const idxI = i * 3;
        const x1 = positions[idxI];
        const y1 = positions[idxI + 1];
        const z1 = positions[idxI + 2];

        for (let j = i + 1; j < pCount && lineVertexIdx < maxConnections; j++) {
          const idxJ = j * 3;
          const x2 = positions[idxJ];
          const y2 = positions[idxJ + 1];
          const z2 = positions[idxJ + 2];

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < connectionDist * connectionDist) {
            const alpha = 1.0 - Math.sqrt(distSq) / connectionDist;
            const lineIdx = lineVertexIdx * 6;

            lPositions[lineIdx] = x1;
            lPositions[lineIdx + 1] = y1;
            lPositions[lineIdx + 2] = z1;
            lPositions[lineIdx + 3] = x2;
            lPositions[lineIdx + 4] = y2;
            lPositions[lineIdx + 5] = z2;

            const c1r = pColors[idxI] * alpha;
            const c1g = pColors[idxI + 1] * alpha;
            const c1b = pColors[idxI + 2] * alpha;

            lColors[lineIdx] = c1r;
            lColors[lineIdx + 1] = c1g;
            lColors[lineIdx + 2] = c1b;
            lColors[lineIdx + 3] = c1r;
            lColors[lineIdx + 4] = c1g;
            lColors[lineIdx + 5] = c1b;

            lineVertexIdx++;
          }
        }
      }

      lineGeo.setDrawRange(0, lineVertexIdx * 2);
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate = true;

      // Distant stars slow drift
      starPoints.rotation.y = elapsed * 0.015 * motionMultiplier;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (interactive && !prefersReducedMotion) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pGeo.dispose();
      pMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      particleTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, particleCount]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: opacity,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    />
  );
}
