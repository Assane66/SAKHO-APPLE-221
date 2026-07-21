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
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const frameMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

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

    // 1. Phone Body Outer Frame
    const phoneWidth = 2.4;
    const phoneHeight = 4.9;
    const phoneDepth = 0.32;
    const cornerRadius = 0.45;

    const shape = new THREE.Shape();
    const x = -phoneWidth / 2;
    const y = -phoneHeight / 2;
    const w = phoneWidth;
    const h = phoneHeight;
    const r = cornerRadius;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings = {
      depth: phoneDepth,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Metallic Titanium Material
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: activeFinish.metalColor,
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.5,
    });
    frameMaterialRef.current = frameMaterial;

    const phoneMesh = new THREE.Mesh(geometry, frameMaterial);
    phoneMesh.castShadow = true;
    phoneMesh.receiveShadow = true;
    phoneGroup.add(phoneMesh);

    // 2. Screen Glass Front
    const screenGeo = new THREE.PlaneGeometry(phoneWidth - 0.16, phoneHeight - 0.16);
    const canvasScreen = document.createElement('canvas');
    canvasScreen.width = 512;
    canvasScreen.height = 1024;
    const ctx = canvasScreen.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 512, 1024);
      grad.addColorStop(0, '#0d0d0f');
      grad.addColorStop(0.3, '#1c160c');
      grad.addColorStop(0.7, '#382a13');
      grad.addColorStop(1, '#08080a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1024);

      // Gold Glow Ring in canvas
      ctx.beginPath();
      ctx.arc(256, 400, 180, 0, Math.PI * 2);
      ctx.strokeStyle = '#c9a84c';
      ctx.lineWidth = 12;
      ctx.shadowColor = '#f5d78e';
      ctx.shadowBlur = 40;
      ctx.stroke();

      // Screen Text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('iPhone 17 Pro Max', 256, 680);
      ctx.fillStyle = '#c9a84c';
      ctx.font = '500 24px sans-serif';
      ctx.fillText('Khalil Apple Luxe', 256, 730);
    }

    const screenTexture = new THREE.CanvasTexture(canvasScreen);
    const screenMaterial = new THREE.MeshStandardMaterial({
      map: screenTexture,
      roughness: 0.1,
      metalness: 0.1,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMaterial);
    screenMesh.position.z = phoneDepth / 2 + 0.081;
    phoneGroup.add(screenMesh);

    // 3. Dynamic Island Notch
    const notchGeo = new THREE.PlaneGeometry(0.7, 0.18);
    const notchMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const notchMesh = new THREE.Mesh(notchGeo, notchMat);
    notchMesh.position.set(0, phoneHeight / 2 - 0.35, phoneDepth / 2 + 0.082);
    phoneGroup.add(notchMesh);

    // 4. Back Camera Bump & 3 Metallic Lens Rings
    const bumpGeo = new THREE.BoxGeometry(0.9, 0.9, 0.12);
    const bumpMesh = new THREE.Mesh(bumpGeo, frameMaterial);
    bumpMesh.position.set(-0.55, 1.6, -(phoneDepth / 2 + 0.081));
    phoneGroup.add(bumpMesh);

    // Lenses
    const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 32);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.9,
      roughness: 0.1,
    });
    lensGeo.rotateX(Math.PI / 2);

    const lensPositions = [
      [-0.72, 1.8],
      [-0.72, 1.4],
      [-0.38, 1.6],
    ];

    lensPositions.forEach(([lx, ly]) => {
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(lx, ly, -(phoneDepth / 2 + 0.14));
      phoneGroup.add(lens);
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
      geometry.dispose();
      frameMaterial.dispose();
      renderer.dispose();
    };
  }, [autoRotate, isDragging]);

  // Handle finish switch
  const handleFinishChange = (finish: FinishOption) => {
    setActiveFinish(finish);
    if (frameMaterialRef.current) {
      frameMaterialRef.current.color.setHex(finish.metalColor);
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
