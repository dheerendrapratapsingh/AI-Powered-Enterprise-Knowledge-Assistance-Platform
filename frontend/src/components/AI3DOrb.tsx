import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AI3DOrbProps {
  size?: number;
  className?: string;
  interactive?: boolean;
}

/**
 * Premium 3D Institutional Intelligence Core (VIT-AP Knowledge Prism)
 * Designed with optical glass refraction, brushed titanium kernel,
 * precision concentric gimbal rings, and orbiting knowledge anchor nodes.
 * Inspired by Apple product presentation & Linear design refinement.
 */
export function AI3DOrb({ size = 260, className = '', interactive = true }: AI3DOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check for user's reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.3, 5.6);

    // --- High-Fidelity Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- Lighting Architecture ---
    // 1. Deep Midnight Indigo Ambient Fill
    const ambientLight = new THREE.AmbientLight(0x0c152e, 1.8);
    scene.add(ambientLight);

    // 2. Main Key Directional Light (Crisp cool specular highlights)
    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.6);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // 3. Cyan Rim Light (Subtle back edge definition)
    const cyanRim = new THREE.PointLight(0x38bdf8, 3.2, 14);
    cyanRim.position.set(-3.5, -2, 3.5);
    scene.add(cyanRim);

    // 4. Soft Violet Secondary Fill
    const violetFill = new THREE.PointLight(0x818cf8, 2.4, 12);
    violetFill.position.set(3, -3.5, -2);
    scene.add(violetFill);

    // --- Master Object Hierarchy ---
    const coreRoot = new THREE.Group();
    scene.add(coreRoot);

    // --- 1. Central Translucent Optical Prism (Knowledge Core) ---
    // Refractive faceted icosahedron
    const glassGeo = new THREE.IcosahedronGeometry(1.08, 1);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f1d38,
      metalness: 0.1,
      roughness: 0.12,
      transmission: 0.88,
      ior: 1.52,
      thickness: 1.4,
      transparent: true,
      opacity: 0.92,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xbae6fd),
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    coreRoot.add(glassMesh);

    // Precision hairline facet lattice (Wireframe overlay)
    const wireGeo = new THREE.IcosahedronGeometry(1.082, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreRoot.add(wireMesh);

    // --- 2. Inner Polished Titanium Kernel ---
    const kernelGeo = new THREE.OctahedronGeometry(0.58, 0);
    const kernelMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      metalness: 0.92,
      roughness: 0.22,
      emissive: 0x0284c7,
      emissiveIntensity: 0.38
    });
    const kernelMesh = new THREE.Mesh(kernelGeo, kernelMat);
    coreRoot.add(kernelMesh);

    // --- 3. Precision Concentric Gimbal / Orbital Rings ---
    // Ring A: Equator Latitude Ring
    const ringAGeo = new THREE.TorusGeometry(1.78, 0.015, 16, 120);
    const ringAMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4
    });
    const ringA = new THREE.Mesh(ringAGeo, ringAMat);
    ringA.rotation.x = Math.PI / 2.8;
    ringA.rotation.y = Math.PI / 8;
    coreRoot.add(ringA);

    // Ring B: Orthogonal Polar Ring
    const ringBGeo = new THREE.TorusGeometry(2.05, 0.013, 16, 120);
    const ringBMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.32
    });
    const ringB = new THREE.Mesh(ringBGeo, ringBMat);
    ringB.rotation.x = -Math.PI / 3.2;
    ringB.rotation.z = Math.PI / 5;
    coreRoot.add(ringB);

    // Delicate Calibration Hash Marks on Ring A
    const hashGroup = new THREE.Group();
    const hashGeo = new THREE.BoxGeometry(0.012, 0.06, 0.012);
    const hashMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const hashMesh = new THREE.Mesh(hashGeo, hashMat);
      hashMesh.position.set(Math.cos(angle) * 1.78, Math.sin(angle) * 1.78, 0);
      hashMesh.rotation.z = angle + Math.PI / 2;
      hashGroup.add(hashMesh);
    }
    ringA.add(hashGroup);

    // --- 4. Four Institutional Knowledge Anchor Nodes (Satellites) ---
    // Represents: 1. Academics, 2. Regulations, 3. Hostels, 4. Directory
    const satellitesGroup = new THREE.Group();
    coreRoot.add(satellitesGroup);

    const satelliteColors = [0x38bdf8, 0x34d399, 0xa78bfa, 0xfbbf24];
    const satelliteMeshes: THREE.Mesh[] = [];
    const satelliteRadius = 1.92;

    for (let i = 0; i < 4; i++) {
      const satGeo = new THREE.OctahedronGeometry(0.08, 0);
      const satMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.15,
        emissive: satelliteColors[i],
        emissiveIntensity: 0.75
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satelliteMeshes.push(satMesh);
      satellitesGroup.add(satMesh);
    }

    // Hairline connection rays between anchors and core
    const rayGeo = new THREE.BufferGeometry();
    const rayPositions = new Float32Array(4 * 2 * 3);
    rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
    const rayMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const rayLines = new THREE.LineSegments(rayGeo, rayMat);
    coreRoot.add(rayLines);

    // --- 5. Micro Dust Field (Ambient Knowledge Constellation) ---
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.2 + Math.random() * 0.9;
      dustPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.05,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    coreRoot.add(dustPoints);

    // --- Mouse Parallax & Interaction Dynamics ---
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetTiltY = x * 0.55;
      targetTiltX = y * 0.55;
    };

    if (interactive && !prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // --- Animation Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const motionMultiplier = prefersReducedMotion ? 0.05 : 1.0;

      // Smooth inertia parallax
      currentTiltX += (targetTiltX - currentTiltX) * 0.045;
      currentTiltY += (targetTiltY - currentTiltY) * 0.045;

      coreRoot.rotation.x = currentTiltX;
      coreRoot.rotation.y = currentTiltY;

      // Gentle floating levitation
      coreRoot.position.y = Math.sin(elapsed * 0.7 * motionMultiplier) * 0.08;

      // Slow, majestic rotations of inner prism and kernel
      glassMesh.rotation.y = elapsed * 0.16 * motionMultiplier;
      glassMesh.rotation.x = elapsed * 0.09 * motionMultiplier;

      wireMesh.rotation.y = glassMesh.rotation.y;
      wireMesh.rotation.x = glassMesh.rotation.x;

      kernelMesh.rotation.y = -elapsed * 0.22 * motionMultiplier;
      kernelMesh.rotation.z = elapsed * 0.14 * motionMultiplier;

      // Concentric gimbal counter-rotations
      ringA.rotation.z = elapsed * 0.2 * motionMultiplier;
      ringB.rotation.z = -elapsed * 0.16 * motionMultiplier;

      dustPoints.rotation.y = elapsed * 0.05 * motionMultiplier;

      // Orbiting satellites
      const rayPosArray = rayGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < 4; i++) {
        const satAngle = elapsed * 0.35 * motionMultiplier + (i * Math.PI) / 2;
        const x = Math.cos(satAngle) * satelliteRadius;
        const y = Math.sin(satAngle * 0.8) * 0.45;
        const z = Math.sin(satAngle) * satelliteRadius;

        satelliteMeshes[i].position.set(x, y, z);
        satelliteMeshes[i].rotation.y = elapsed * 0.6;
        satelliteMeshes[i].rotation.x = elapsed * 0.4;

        // Update ray connecting satellite to center
        const rayIdx = i * 6;
        rayPosArray[rayIdx] = 0;
        rayPosArray[rayIdx + 1] = 0;
        rayPosArray[rayIdx + 2] = 0;
        rayPosArray[rayIdx + 3] = x * 0.92;
        rayPosArray[rayIdx + 4] = y * 0.92;
        rayPosArray[rayIdx + 5] = z * 0.92;
      }
      rayGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive && !prefersReducedMotion) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      renderer.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      kernelGeo.dispose();
      kernelMat.dispose();
      ringAGeo.dispose();
      ringAMat.dispose();
      ringBGeo.dispose();
      ringBMat.dispose();
      hashGeo.dispose();
      hashMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      rayGeo.dispose();
      rayMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
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
        position: 'relative'
      }}
    />
  );
}
