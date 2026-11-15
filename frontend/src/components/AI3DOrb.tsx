import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AI3DOrbProps {
  size?: number;
  className?: string;
  interactive?: boolean;
}

export function AI3DOrb({ size = 260, className = '', interactive = true }: AI3DOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5.2;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x36d6f5, 4, 12);
    cyanLight.position.set(3, 2, 4);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0x9875ff, 4, 12);
    violetLight.position.set(-3, -2, 4);
    scene.add(violetLight);

    const blueLight = new THREE.PointLight(0x5577ff, 3, 10);
    blueLight.position.set(0, 4, -2);
    scene.add(blueLight);

    // --- Core Holographic Inner Sphere ---
    const coreGeo = new THREE.IcosahedronGeometry(1.05, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x111c38,
      emissive: 0x243d78,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // --- Glowing Inner Energy Sphere ---
    const glowGeo = new THREE.SphereGeometry(0.82, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x36d6f5,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // --- Outer Constellation Particles ---
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorCyan = new THREE.Color(0x36d6f5);
    const colorBlue = new THREE.Color(0x5577ff);
    const colorViolet = new THREE.Color(0x9875ff);

    const radius = 1.55;
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * (0.92 + Math.random() * 0.16);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Color variation across the sphere
      const mixRatio = (y / radius + 1) / 2;
      const pointColor = new THREE.Color();
      if (mixRatio < 0.5) {
        pointColor.lerpColors(colorCyan, colorBlue, mixRatio * 2);
      } else {
        pointColor.lerpColors(colorBlue, colorViolet, (mixRatio - 0.5) * 2);
      }

      colors[i * 3] = pointColor.r;
      colors[i * 3 + 1] = pointColor.g;
      colors[i * 3 + 2] = pointColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create a circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(54, 214, 245, 0.8)');
      gradient.addColorStop(0.7, 'rgba(85, 119, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // --- Orbital Energy Ring 1 ---
    const ring1Geo = new THREE.RingGeometry(1.85, 1.88, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x36d6f5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    scene.add(ring1);

    // --- Orbital Energy Ring 2 ---
    const ring2Geo = new THREE.RingGeometry(2.05, 2.07, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x9875ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = -Math.PI / 4;
    scene.add(ring2);

    // --- Mouse Parallax Interaction ---
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotationY = x * 0.8;
      targetRotationX = y * 0.8;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth mouse interpolation (inertia)
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      // Base rotations
      coreMesh.rotation.y = elapsed * 0.25 + currentRotationY;
      coreMesh.rotation.x = elapsed * 0.15 + currentRotationX;

      particleSystem.rotation.y = elapsed * 0.18 + currentRotationY * 0.7;
      particleSystem.rotation.x = elapsed * 0.1 + currentRotationX * 0.7;

      ring1.rotation.z = elapsed * 0.35;
      ring1.rotation.x = Math.PI / 3 + currentRotationX * 0.4;
      ring1.rotation.y = Math.PI / 6 + currentRotationY * 0.4;

      ring2.rotation.z = -elapsed * 0.25;
      ring2.rotation.x = -Math.PI / 4 + currentRotationX * 0.3;
      ring2.rotation.y = -Math.PI / 4 + currentRotationY * 0.3;

      // Breathing / undulating wave on particles
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const currentPos = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        // Wave factor based on angle & time
        const wave = Math.sin(elapsed * 2.2 + ox * 2.0 + oy * 2.0) * 0.06;
        currentPos[i * 3] = ox * (1 + wave);
        currentPos[i * 3 + 1] = oy * (1 + wave);
        currentPos[i * 3 + 2] = oz * (1 + wave);
      }
      posAttr.needsUpdate = true;

      // Inner glow pulsing
      const glowScale = 1 + Math.sin(elapsed * 2.5) * 0.08;
      glowMesh.scale.set(glowScale, glowScale, glowScale);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
    };
  }, [size, interactive]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        position: 'relative',
        filter: 'drop-shadow(0 0 35px rgba(54, 214, 245, 0.28))'
      }}
    />
  );
}
