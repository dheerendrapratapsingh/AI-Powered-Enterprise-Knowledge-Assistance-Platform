import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Space3DBackgroundProps {
  opacity?: number;
  showGrid?: boolean;
  interactive?: boolean;
  particleCount?: number;
}

export function Space3DBackground({
  opacity = 0.75,
  showGrid = true,
  interactive = true,
  particleCount = 260
}: Space3DBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060a17, 0.045);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 11);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x0b132b, 1.2);
    scene.add(ambientLight);

    const cyanPoint = new THREE.PointLight(0x36d6f5, 3.5, 30);
    cyanPoint.position.set(5, 4, 8);
    scene.add(cyanPoint);

    const violetPoint = new THREE.PointLight(0x9875ff, 3.5, 30);
    violetPoint.position.set(-6, -3, 6);
    scene.add(violetPoint);

    // --- 1. 3D Floating Particle Nebula ---
    const pCount = particleCount;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pBasePositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const pVelocities = new Float32Array(pCount * 3);

    const colorPalette = [
      new THREE.Color(0x36d6f5), // Cyan
      new THREE.Color(0x5577ff), // Electric Blue
      new THREE.Color(0x9875ff), // Purple / Indigo
      new THREE.Color(0x38bdf8), // Sky
      new THREE.Color(0x818cf8)  // Lavender
    ];

    for (let i = 0; i < pCount; i++) {
      const idx = i * 3;
      // Distribute in a 3D box around the camera view
      const x = (Math.random() - 0.5) * 26;
      const y = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 18 - 2;

      pPositions[idx] = x;
      pPositions[idx + 1] = y;
      pPositions[idx + 2] = z;

      pBasePositions[idx] = x;
      pBasePositions[idx + 1] = y;
      pBasePositions[idx + 2] = z;

      pVelocities[idx] = (Math.random() - 0.5) * 0.006;
      pVelocities[idx + 1] = (Math.random() - 0.5) * 0.006;
      pVelocities[idx + 2] = (Math.random() - 0.5) * 0.004;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      pColors[idx] = col.r;
      pColors[idx + 1] = col.g;
      pColors[idx + 2] = col.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    // Circular glowing particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(54, 214, 245, 0.85)');
      grad.addColorStop(0.65, 'rgba(85, 119, 255, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const pMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // --- 2. 3D Neural Constellation Connection Lines ---
    const maxConnections = 180;
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineColors = new Float32Array(maxConnections * 2 * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const connectionLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(connectionLines);

    // --- 3. Undulating 3D Cyber-Grid Horizon (Terrain Floor) ---
    let gridMesh: THREE.Mesh | null = null;
    let gridGeo: THREE.PlaneGeometry | null = null;
    let originalGridY: Float32Array | null = null;

    if (showGrid) {
      gridGeo = new THREE.PlaneGeometry(36, 36, 34, 34);
      gridGeo.rotateX(-Math.PI / 2.2);
      gridGeo.translate(0, -4.8, -4);

      const count = gridGeo.attributes.position.count;
      originalGridY = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        originalGridY[i] = gridGeo.attributes.position.getY(i);
      }

      const gridMat = new THREE.MeshStandardMaterial({
        color: 0x1b2d5a,
        emissive: 0x224888,
        emissiveIntensity: 0.45,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
        roughness: 0.5,
        metalness: 0.8
      });

      gridMesh = new THREE.Mesh(gridGeo, gridMat);
      scene.add(gridMesh);
    }

    // --- Interactive Mouse Dynamics & Parallax ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouse.targetX = (clientX / rect.width) * 2 - 1;
      mouse.targetY = -(clientY / rect.height) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Resize Handler ---
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
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const elapsed = (currentTime - startTime) * 0.001;

      // Smooth camera parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.045;
      mouse.y += (mouse.targetY - mouse.y) * 0.045;

      camera.position.x = mouse.x * 1.6;
      camera.position.y = 1.2 + mouse.y * 1.0;
      camera.lookAt(0, 0, -2);

      // Subtle light oscillation
      cyanPoint.position.x = 5 + Math.sin(elapsed * 0.6) * 2;
      cyanPoint.position.y = 4 + Math.cos(elapsed * 0.8) * 1.5;
      violetPoint.position.x = -6 + Math.cos(elapsed * 0.5) * 2;

      // Update particle positions & gentle drift
      const posAttr = pGeo.attributes.position;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < pCount; i++) {
        const idx = i * 3;
        positions[idx] += pVelocities[idx];
        positions[idx + 1] += pVelocities[idx + 1] + Math.sin(elapsed * 0.8 + i) * 0.002;
        positions[idx + 2] += pVelocities[idx + 2];

        // Wrap around bounds
        if (positions[idx] > 14) positions[idx] = -14;
        if (positions[idx] < -14) positions[idx] = 14;
        if (positions[idx + 1] > 9) positions[idx + 1] = -9;
        if (positions[idx + 1] < -9) positions[idx + 1] = 9;
        if (positions[idx + 2] > 7) positions[idx + 2] = -12;
        if (positions[idx + 2] < -12) positions[idx + 2] = 7;
      }
      posAttr.needsUpdate = true;

      // Connect nearby particles with glowing strands
      let lineVertexIdx = 0;
      const lPositions = lineGeo.attributes.position.array as Float32Array;
      const lColors = lineGeo.attributes.color.array as Float32Array;

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

          // Connect if distance < 2.8 units
          if (distSq < 7.84) {
            const outIdx = lineVertexIdx * 6;
            lPositions[outIdx] = x1;
            lPositions[outIdx + 1] = y1;
            lPositions[outIdx + 2] = z1;
            lPositions[outIdx + 3] = x2;
            lPositions[outIdx + 4] = y2;
            lPositions[outIdx + 5] = z2;

            const strength = Math.max(0, 1 - Math.sqrt(distSq) / 2.8);
            for (let c = 0; c < 6; c += 3) {
              lColors[outIdx + c] = 0.22 * strength;
              lColors[outIdx + c + 1] = 0.84 * strength;
              lColors[outIdx + c + 2] = 0.98 * strength;
            }

            lineVertexIdx++;
          }
        }
      }

      // Clear remaining line slots
      for (let k = lineVertexIdx * 6; k < maxConnections * 6; k++) {
        lPositions[k] = 0;
        lColors[k] = 0;
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate = true;

      // Undulate Cyber Grid Horizon
      if (gridMesh && gridGeo && originalGridY) {
        const gridPos = gridGeo.attributes.position;
        const count = gridPos.count;
        for (let i = 0; i < count; i++) {
          const x = gridPos.getX(i);
          const z = gridPos.getZ(i);
          const wave = Math.sin(x * 0.28 + elapsed * 1.2) * Math.cos(z * 0.28 + elapsed * 0.9) * 0.38;
          gridPos.setY(i, originalGridY[i] + wave);
        }
        gridPos.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup on Unmount ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      pGeo.dispose();
      pMat.dispose();
      particleTexture.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      if (gridGeo) gridGeo.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, particleCount, showGrid]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
        overflow: 'hidden'
      }}
    />
  );
}
