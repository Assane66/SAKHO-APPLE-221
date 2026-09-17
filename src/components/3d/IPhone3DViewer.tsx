'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IPhone3DViewer({ onBuyClick }: { onBuyClick?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [is3DActiveMobile, setIs3DActiveMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Détection du tactile
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
  }, []);

  // Timer d'inactivité pour le mode 3D mobile
  useEffect(() => {
    if (!is3DActiveMobile) return;
    const timer = setTimeout(() => {
      setIs3DActiveMobile(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [is3DActiveMobile]);

  // Détection du double tap sans bloquer le scroll naturel
  const lastTapRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // Si l'utilisateur a glissé pour faire défiler la page (> 12px), ce n'est pas un tap
    if (dx > 12 || dy > 12) return;

    const now = Date.now();
    if (now - lastTapRef.current < 380) {
      // Double tap détecté !
      setIs3DActiveMobile(prev => !prev);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let isMounted = true;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // === SCENE, CAMERA, RENDERER ===
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    container.appendChild(renderer.domElement);

    // === LIGHTING FOR LUXURY TITANIUM REFLECTIONS ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcde0ff, 2.0);
    fillLight.position.set(-6, -2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    rimLight.position.set(0, 6, -5);
    scene.add(rimLight);

    const frontLight = new THREE.PointLight(0xffffff, 1.2, 12);
    frontLight.position.set(0, 0, 6);
    scene.add(frontLight);

    // === 3D PHONE GROUP ===
    const phoneGroup = new THREE.Group();
    scene.add(phoneGroup);

    let controlsInstance: any = null;
    let animationFrameId: number;
    const clock = new THREE.Clock();

    // Dynamically load GLTFLoader and OrbitControls
    Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/controls/OrbitControls.js'),
    ])
      .then(([{ GLTFLoader }, { OrbitControls }]) => {
        if (!isMounted) return;

        // Setup OrbitControls for butter-smooth 360 rotation without gimbal lock
        const controls = new OrbitControls(camera, renderer.domElement);
        controlsInstance = controls;
        controlsRef.current = controls;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.enableZoom = false; // Keep hero phone perfectly framed without hijacking page scroll
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;

        // Prevent flipping upside-down or flattening against camera
        controls.minPolarAngle = Math.PI / 4; // ~45 deg
        controls.maxPolarAngle = (Math.PI * 3) / 4; // ~135 deg

        const loader = new GLTFLoader();
        loader.load(
          'https://res.cloudinary.com/dm6yuokre/image/upload/v1785360868/iphone_17_pro_max_1_vznyvo.glb',
          (gltf) => {
            if (!isMounted) return;
            const model = gltf.scene;

            // Center model perfectly in its bounding box
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            // Scale model proportionally to comfortably fill view
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5.2 / maxDim;
            model.scale.setScalar(scale);

            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
              }
            });

            phoneGroup.add(model);
            setIsLoading(false);
          },
          undefined,
          (error) => {
            console.error('Error loading GLTF model:', error);
            if (isMounted) setIsLoading(false);
          }
        );
      })
      .catch((err) => {
        console.error('Failed to load Three.js addons:', err);
      });

    // Initial slight tilt
    phoneGroup.rotation.y = -Math.PI / 8;

    // === ANIMATION LOOP ===
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle floating levitation
      phoneGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      if (controlsInstance) {
        controlsInstance.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // === RESIZE HANDLER ===
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
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (controlsInstance) {
        controlsInstance.dispose();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className={cn(
        "relative w-full max-w-xl mx-auto flex flex-col items-center rounded-3xl transition-all duration-300",
        is3DActiveMobile && "ring-2 ring-amber-400/50 shadow-[0_0_35px_rgba(245,158,11,0.2)] bg-black/20"
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Canvas Container
          Sur mobile : si non actif, pointer-events-none permet au défilement tactile de glisser librement sans blocage.
          Sur Desktop (md:) : toujours interactif à la souris */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-[440px] md:h-[540px] select-none touch-pan-y transition-all",
          is3DActiveMobile ? "cursor-grab active:cursor-grabbing pointer-events-auto" : "pointer-events-none md:pointer-events-auto cursor-default md:cursor-grab"
        )}
      >
        {/* Glow backdrop behind 3D phone */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="w-10 h-10 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-xs text-zinc-400 font-medium tracking-wide">
              Chargement de l'iPhone 17 Pro Max...
            </span>
          </div>
        )}
      </div>

      {/* ── Badge & Contrôles Interactifs ── */}
      {/* Sur Desktop : Badge d'information standard */}
      <div className="hidden md:flex absolute top-4 left-4 z-10 items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-amber-300 pointer-events-none select-none shadow-lg">
        <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '7s' }} />
        Glissez pour pivoter à 360°
      </div>

      {/* Sur Mobile : Bouton d'activation / désactivation élégant */}
      <div className="flex md:hidden absolute top-4 z-20 items-center justify-center w-full px-4 pointer-events-auto">
        {is3DActiveMobile ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400 text-black font-bold text-xs shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Mode 3D Actif (Tournez avec le doigt)</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIs3DActiveMobile(false);
              }}
              className="ml-2 px-2 py-0.5 rounded-full bg-black/20 hover:bg-black/30 text-[10px] uppercase font-black tracking-wide"
            >
              Fermer ✕
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIs3DActiveMobile(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/40 text-amber-300 font-semibold text-xs shadow-lg hover:bg-black/90 active:scale-95 transition-all"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Double-cliquez ou touchez pour pivoter en 3D</span>
          </button>
        )}
      </div>

      {/* Indication sous l'iPhone sur mobile quand inactif */}
      {!is3DActiveMobile && (
        <div className="md:hidden absolute bottom-3 z-10 text-[10px] text-zinc-400 bg-black/50 px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-sm">
          ↓ Faites défiler la page librement
        </div>
      )}
    </div>
  );
}
