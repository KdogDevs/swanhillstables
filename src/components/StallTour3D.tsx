import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { Loader2, Move3d } from "lucide-react";

type TourId = "indoor" | "outdoor";

const MODELS: Record<TourId, { url: string; label: string; description: string }> = {
  indoor: {
    url: "/models/indoor-stall.glb",
    label: "Indoor Stalls",
    description:
      "Step inside our covered stall row. Drag to rotate, scroll to zoom, and right-click to pan.",
  },
  outdoor: {
    url: "/models/outdoor-stall.glb",
    label: "Outdoor Stalls",
    description:
      "Explore our outdoor stall area surrounded by paddocks. Drag to rotate, scroll to zoom.",
  },
};

const Model = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
};

const LoadingFallback = () => (
  <Html center>
    <div className="flex items-center gap-2 text-white/90 text-sm bg-foreground/60 px-4 py-2 rounded-md backdrop-blur-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading 3D scan…
    </div>
  </Html>
);

export const StallTour3D = () => {
  const [active, setActive] = useState<TourId>("indoor");
  const current = MODELS[active];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
            Interactive 3D Tour
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Tour the Stalls in 3D
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Take a virtual walk through our facilities. Switch between the indoor and outdoor
            stalls and explore every angle.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-5xl mx-auto"
        >
          {/* Tab buttons */}
          <div className="flex justify-center gap-2 mb-6">
            {(Object.keys(MODELS) as TourId[]).map((id) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  active === id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {MODELS[id].label}
              </button>
            ))}
          </div>

          {/* 3D canvas */}
          <div className="relative aspect-[16/10] rounded-lg overflow-hidden card-shadow bg-gradient-to-br from-muted to-secondary">
            <Canvas
              key={active}
              camera={{ position: [4, 3, 6], fov: 45 }}
              dpr={[1, 2]}
              gl={{ antialias: true }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Stage environment="sunset" intensity={0.6} adjustCamera={1.2}>
                  <Model url={current.url} />
                </Stage>
              </Suspense>
              <OrbitControls
                enablePan
                enableZoom
                enableRotate
                minDistance={1}
                maxDistance={50}
                makeDefault
              />
            </Canvas>

            {/* Hint overlay */}
            <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 text-white/90 text-xs bg-foreground/50 px-3 py-1.5 rounded-md backdrop-blur-sm">
              <Move3d className="w-3.5 h-3.5" />
              Drag to rotate • Scroll to zoom
            </div>
          </div>

          <p className="text-center text-muted-foreground text-sm mt-4">{current.description}</p>
        </motion.div>
      </div>
    </section>
  );
};

// Preload both models for snappier switching
useGLTF.preload("/models/indoor-stall.glb");
useGLTF.preload("/models/outdoor-stall.glb");
