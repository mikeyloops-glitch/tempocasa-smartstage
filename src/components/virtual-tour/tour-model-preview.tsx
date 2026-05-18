"use client";

import { useEffect, useRef } from "react";

type TourPanel = {
  angle: number;
  captured: boolean;
  id: string;
  label: string;
  url?: string;
};

type TourModelPreviewProps = {
  panels: TourPanel[];
  readyCount: number;
};

export function TourModelPreview({ panels, readyCount }: TourModelPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let animationId = 0;
    const cleanup: Array<() => void> = [];

    async function mountPreview() {
      const THREE = await import("three");

      if (disposed || !containerRef.current) {
        return;
      }

      const container = containerRef.current;
      const width = Math.max(container.clientWidth, 320);
      const height = Math.max(container.clientHeight, 280);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#111418");

      const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
      camera.position.set(0, 2.25, 7.2);
      camera.lookAt(0, 1.2, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(4.2, 64),
        new THREE.MeshBasicMaterial({ color: "#0c3f30", transparent: true, opacity: 0.7 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.02;
      group.add(floor);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.75, 3.85, 96),
        new THREE.MeshBasicMaterial({ color: "#80c7ab", transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      group.add(ring);

      const loader = new THREE.TextureLoader();
      const resources: Array<{ dispose: () => void }> = [floor.geometry, floor.material, ring.geometry, ring.material];

      panels.forEach((panel) => {
        const radians = (panel.angle * Math.PI) / 180;
        const radius = 3.25;
        const geometry = new THREE.PlaneGeometry(2.15, 1.45);
        let material: import("three").MeshBasicMaterial;

        if (panel.url) {
          const texture = loader.load(panel.url);
          texture.colorSpace = THREE.SRGBColorSpace;
          material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
          resources.push(texture, material);
        } else {
          material = new THREE.MeshBasicMaterial({
            color: "#1f6a53",
            opacity: 0.3,
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: true
          });
          resources.push(material);
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(Math.sin(radians) * radius, 1.24, -Math.cos(radians) * radius);
        mesh.lookAt(0, 1.24, 0);
        group.add(mesh);
        resources.push(geometry);
      });

      const resizeObserver = new ResizeObserver(() => {
        if (!containerRef.current) {
          return;
        }

        const nextWidth = Math.max(containerRef.current.clientWidth, 320);
        const nextHeight = Math.max(containerRef.current.clientHeight, 280);
        renderer.setSize(nextWidth, nextHeight);
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
      });

      resizeObserver.observe(container);
      cleanup.push(() => resizeObserver.disconnect());
      cleanup.push(() => renderer.dispose());
      cleanup.push(() => {
        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
      });
      cleanup.push(() => resources.forEach((resource) => resource.dispose()));

      const animate = () => {
        group.rotation.y += 0.0022;
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
      };

      animate();
    }

    mountPreview();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      cleanup.forEach((fn) => fn());
    };
  }, [panels]);

  return (
    <div className="relative overflow-hidden rounded-md border border-silver-200 bg-charcoal-950 shadow-panel">
      <div ref={containerRef} className="h-[320px] w-full sm:h-[380px]" />
      <div className="absolute left-3 top-3 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-navy-950">
        3D preview
      </div>
      <div className="absolute bottom-3 left-3 right-3 rounded-md border border-white/15 bg-charcoal-950/78 p-3 text-white backdrop-blur">
        <p className="text-sm font-semibold">{readyCount}/8 capture panels mapped</p>
        <p className="mt-1 text-xs leading-5 text-silver-100">
          This is the live WebGL room-node preview. The production layer can load a SuperSplat or PlayCanvas Gaussian-splat scene from the same capture package.
        </p>
      </div>
    </div>
  );
}
