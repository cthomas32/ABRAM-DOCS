"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function NeuralNetworkOrb() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Configuration derived from user choices
    const config = {
      speed: 0.3,
      density: 2.0,
      noiseIntensity: 0.9,
      noiseFrequency: 1.0,
      colorPalette: "abram",
    };

    let localTime = 0;
    let animationFrameId: number;

    // Mouse drag rotation targets
    let rotationXTarget = 0;
    let rotationYTarget = 0;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 3.9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Node setup
    const maxConnections = 1200;
    const particleCount = Math.floor(45 + config.density * 105); // ~255 particles
    const particles: Array<{ pos: THREE.Vector3; vel: THREE.Vector3 }> = [];

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Color definitions matching ABRAM Cream & Navy
    const c1 = new THREE.Color("#FAFAF9"); // ABRAM Cream
    const c2 = new THREE.Color("#0B2545"); // Dark Navy Blue

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 1.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const speedScale = 0.003;
      particles.push({
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * speedScale,
          (Math.random() - 0.5) * speedScale,
          (Math.random() - 0.5) * speedScale
        ),
      });

      // Distribute colors between cream and navy
      const color = Math.random() > 0.45 ? c1 : c2;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Procedural circle texture
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.12 * (0.4 + config.noiseFrequency * 0.6),
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.9,
    });

    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(pointsMesh);

    // Link/Lines Setup
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineColors = new Float32Array(maxConnections * 2 * 3);

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });

    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(linesMesh);

    // Mouse events for rotation
    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      rotationYTarget += deltaX * 0.005;
      rotationXTarget += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    const clock = new THREE.Clock();

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      localTime += delta;

      const speedMultiplier = config.speed * 2.0;

      const posAttr = pointsGeometry.getAttribute("position") as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      // Update positions
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];

        p.pos.x += p.vel.x * speedMultiplier;
        p.pos.y += p.vel.y * speedMultiplier;
        p.pos.z += p.vel.z * speedMultiplier;

        // Spherical boundary check & bounce
        const dist = p.pos.length();
        if (dist > 1.6) {
          p.vel.reflect(p.pos.clone().normalize().negate());
          p.pos.multiplyScalar(0.99); // boundary damping
        }

        posArray[i * 3] = p.pos.x;
        posArray[i * 3 + 1] = p.pos.y;
        posArray[i * 3 + 2] = p.pos.z;
      }
      posAttr.needsUpdate = true;

      // Dynamic Proximity Link Lines
      const linePosAttr = linesGeometry.getAttribute("position") as THREE.BufferAttribute;
      const linePosArray = linePosAttr.array as Float32Array;
      const lineColAttr = linesGeometry.getAttribute("color") as THREE.BufferAttribute;
      const lineColArray = lineColAttr.array as Float32Array;

      let lineIdx = 0;
      const linkThreshold = 0.4 + config.noiseIntensity * 0.35; // ~0.715

      for (let i = 0; i < particleCount; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particles[j];
          const dist = p1.pos.distanceTo(p2.pos);

          if (dist < linkThreshold && lineIdx < maxConnections) {
            linePosArray[lineIdx * 6] = p1.pos.x;
            linePosArray[lineIdx * 6 + 1] = p1.pos.y;
            linePosArray[lineIdx * 6 + 2] = p1.pos.z;
            linePosArray[lineIdx * 6 + 3] = p2.pos.x;
            linePosArray[lineIdx * 6 + 4] = p2.pos.y;
            linePosArray[lineIdx * 6 + 5] = p2.pos.z;

            // Fade edges on distance
            const alpha = 1.0 - dist / linkThreshold;
            const tempC1 = c1.clone().multiplyScalar(alpha * 0.7);
            const tempC2 = c2.clone().multiplyScalar(alpha * 0.7);

            lineColArray[lineIdx * 6] = tempC1.r;
            lineColArray[lineIdx * 6 + 1] = tempC1.g;
            lineColArray[lineIdx * 6 + 2] = tempC1.b;
            lineColArray[lineIdx * 6 + 3] = tempC2.r;
            lineColArray[lineIdx * 6 + 4] = tempC2.g;
            lineColArray[lineIdx * 6 + 5] = tempC2.b;

            lineIdx++;
          }
        }
      }

      linesGeometry.setDrawRange(0, lineIdx * 2);
      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;

      // Rotation updates (auto spin + drag offset)
      const autoTime = localTime * 0.05;
      pointsMesh.rotation.y += (rotationYTarget + autoTime - pointsMesh.rotation.y) * 0.1;
      pointsMesh.rotation.x += (rotationXTarget - pointsMesh.rotation.x) * 0.1;
      linesMesh.rotation.copy(pointsMesh.rotation);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);

      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      pointsGeometry.dispose();
      linesGeometry.dispose();
      pointsMaterial.dispose();
      linesMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] md:min-h-[400px] cursor-grab active:cursor-grabbing"
    />
  );
}
