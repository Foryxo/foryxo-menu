"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";

export function CulinaryScene({ variant = "hero" }: { variant?: "hero" | "demo" }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};
    void (async () => {
      try {
        const THREE = await import("three");
        if (disposed || !hostRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const host = hostRef.current;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        camera.position.set(0, 0.15, variant === "hero" ? 7.3 : 6.4);
        const group = new THREE.Group();
        scene.add(group);
        const teal = new THREE.MeshPhysicalMaterial({ color: 0x03c4d8, metalness: 0.72, roughness: 0.2, clearcoat: 1 });
        const blue = new THREE.MeshPhysicalMaterial({ color: 0x3563e9, metalness: 0.55, roughness: 0.25, clearcoat: 0.8 });
        const pearl = new THREE.MeshPhysicalMaterial({ color: 0xf5f7ff, metalness: 0.08, roughness: 0.18, clearcoat: 1 });
        const warm = new THREE.MeshStandardMaterial({ color: 0xffb13b, metalness: 0.2, roughness: 0.35 });
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.25, 0.22, 48), teal);
        plate.position.y = -1.25;
        group.add(plate);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.75, 48, 26, 0, Math.PI * 2, 0, Math.PI / 2), pearl);
        dome.position.y = -1.05;
        group.add(dome);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.83, 0.075, 16, 64), blue);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = -1.05;
        group.add(rim);
        const handle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), warm);
        handle.position.y = 0.78;
        group.add(handle);
        const cards: import("three").Mesh[] = [];
        for (let i = 0; i < 5; i += 1) {
          const card = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.02, 0.08, 4, 4, 1), i % 2 ? blue : teal);
          const angle = (i / 5) * Math.PI * 2;
          card.position.set(Math.cos(angle) * 2.75, Math.sin(angle) * 1.5 + 0.15, -0.35 + i * 0.08);
          card.rotation.set(0.15 * Math.sin(angle), angle * 0.25, angle + 0.2);
          cards.push(card);
          group.add(card);
        }
        scene.add(new THREE.HemisphereLight(0xffffff, 0x0b153d, 2.6));
        const key = new THREE.DirectionalLight(0xffffff, 4.2);
        key.position.set(3, 5, 5);
        scene.add(key);
        const edge = new THREE.PointLight(0x00e5ff, 18, 10);
        edge.position.set(-3, -1, 4);
        scene.add(edge);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        let visible = true;
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "120px" });
        observer.observe(host);
        const resize = () => {
          const width = Math.max(host.clientWidth, 1);
          const height = Math.max(host.clientHeight, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();
        renderer.render(scene, camera);
        if (!disposed) setReady(true);
        const render = (time = 0) => {
          if (disposed) return;
          if (visible && document.visibilityState === "visible") {
            const t = time * 0.00055;
            group.rotation.y = reduced.matches ? -0.28 : Math.sin(t) * 0.25 - 0.15;
            group.rotation.x = reduced.matches ? 0.05 : Math.sin(t * 0.7) * 0.06;
            cards.forEach((card, index) => { card.rotation.z += reduced.matches ? 0 : 0.0008 * (index % 2 ? 1 : -1); });
            renderer.render(scene, camera);
          }
          frame = requestAnimationFrame(render);
        };
        frame = requestAnimationFrame(render);
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          resizeObserver.disconnect();
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
            }
          });
          renderer.dispose();
        };
      } catch { if (!disposed) setFailed(true); }
    })();
    return () => { disposed = true; cleanup(); };
  }, [variant]);

  if (failed) return null;
  return (
    <div ref={hostRef} className={`relative ${variant === "hero" ? "h-[360px] w-full md:h-[470px]" : "h-52 w-full"}`} aria-hidden="true">
      <div className={`absolute inset-0 grid place-items-center transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}>
        <span className="absolute size-24 animate-ping rounded-full bg-brand/15 motion-reduce:animate-none" />
        <BrandMark size={variant === "hero" ? 84 : 64} className="brand-loader-mark opacity-70" />
      </div>
      <canvas ref={canvasRef} className={`relative block size-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
