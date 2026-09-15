'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Sparkles, RotateCw, ShieldCheck, Zap } from 'lucide-react';

interface FinishOption {
  id: string;
  name: string;
  color: string;
  metalColor: number;
}

const TITANIUM_FINISHES: FinishOption[] = [
  { id: 'orange', name: 'Titane Orange Cosmic', color: '#e07a3c', metalColor: 0xe07a3c },
  { id: 'natural', name: 'Titane Naturel', color: '#979188', metalColor: 0x979188 },
  { id: 'desert', name: 'Titane Désert', color: '#c3b091', metalColor: 0xc3b091 },
  { id: 'black', name: 'Titane Noir', color: '#2b2a29', metalColor: 0x2b2a29 },
  { id: 'white', name: 'Titane Blanc', color: '#e3e2dd', metalColor: 0xe3e2dd },
];

export function IPhone3DViewer({ onBuyClick }: { onBuyClick?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFinish, setActiveFinish] = useState<FinishOption>(TITANIUM_FINISHES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const phoneGroupRef = useRef<THREE.Group | null>(null);


  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // === SCENE, CAMERA, RENDERER ===
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // === LIGHTING ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 3.5);
    keyLight.position.set(5, 5, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 2.0);
    fillLight.position.set(-5, -2, -4);
    scene.add(fillLight);

    const goldRimLight = new THREE.PointLight(0xc9a84c, 4, 15);
    goldRimLight.position.set(0, 4, 3);
    scene.add(goldRimLight);

    // === 3D PHONE GROUP ===
    const phoneGroup = new THREE.Group();
    phoneGroupRef.current = phoneGroup;
    scene.add(phoneGroup);

    // Import and use GLTFLoader dynamically or use it if imported at top
    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(
        'https://res.cloudinary.com/dm6yuokre/image/upload/v1785360868/iphone_17_pro_max_1_vznyvo.glb',
        (gltf) => {
          const model = gltf.scene;

          // Center the model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);

          // Scale the model to fit well (approx height 5)
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 5 / maxDim;
          model.scale.setScalar(scale);
          
          // Add environment mapping and shadows
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              // We could change material color here if we identify the frame material
            }
          });

          phoneGroup.add(model);
        },
        undefined,
        (error) => {
          console.error('Error loading GLTF model:', error);
        }
      );
    });

    // Initial Angle
    phoneGroup.rotation.y = -Math.PI / 6;
    phoneGroup.rotation.x = Math.PI / 16;

    // === ANIMATION LOOP ===
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (autoRotate && phoneGroupRef.current) {
        phoneGroupRef.current.rotation.y += 0.008;
        phoneGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    // === INTERACTION HANDLERS ===
    let previousMouseX = 0;
    let previousMouseY = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      setIsDragging(true);
      setAutoRotate(false);
      const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
      const pageY = 'touches' in e ? e.touches[0].pageY : e.pageY;
      previousMouseX = pageX;
      previousMouseY = pageY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !phoneGroupRef.current) return;
      const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
      const pageY = 'touches' in e ? e.touches[0].pageY : e.pageY;
      const deltaX = pageX - previousMouseX;
      const deltaY = pageY - previousMouseY;

      phoneGroupRef.current.rotation.y += deltaX * 0.01;
      phoneGroupRef.current.rotation.x += deltaY * 0.01;

      previousMouseX = pageX;
      previousMouseY = pageY;
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domEl.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domEl.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(domEl)) container.removeChild(domEl);
      renderer.dispose();
    };
  }, [autoRotate, isDragging]);

  // Handle finish switch
  const handleFinishChange = (finish: FinishOption) => {
    setActiveFinish(finish);
    if (phoneGroupRef.current) {
      phoneGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.MeshStandardMaterial;
          // Attempt to change color of materials that might be the frame/body
          // Without knowing the exact material name, we can check for names like "body", "frame", "metal", etc.
          // Or we just change materials that are not completely black or white, or we change everything for a tint.
          // For now, if the material name includes 'frame' or 'body', we apply it.
          if (material.name && (material.name.toLowerCase().includes('frame') || material.name.toLowerCase().includes('body'))) {
            material.color.setHex(finish.metalColor);
          }
        }
      });
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[420px] md:h-[520px] cursor-grab active:cursor-grabbing select-none"
      >
        {/* Glow backdrop behind 3D phone */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-amber-500/20 rounded-full blur-[90px] pointer-events-none" />

        {/* 3D Instructions Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-amber-300">
          <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          Glissez pour pivoter à 360°
        </div>
      </div>

      {/* Titanium Finish Swatches Selector */}
      <div className="relative z-10 -mt-6 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Finition Titane 17 Pro Max : <span className="text-foreground font-bold">{activeFinish.name}</span>
        </p>

        <div className="flex items-center gap-3 p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl">
          {TITANIUM_FINISHES.map((finish) => (
            <button
              key={finish.id}
              onClick={() => handleFinishChange(finish)}
              className={`relative w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center ${
                activeFinish.id === finish.id
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black scale-110'
                  : 'hover:scale-105 opacity-80'
              }`}
              style={{ backgroundColor: finish.color }}
              title={finish.name}
            >
              {activeFinish.id === finish.id && (
                <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
