import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { Loader2, Move3d, Play, Pause, Hand } from "lucide-react";
import * as THREE from "three";

type TourId = "indoor" | "outdoor";
type Mode = "tour" | "explore";

const MODELS: Record<TourId, { url: string; label: string; description: string }> = {
  indoor: {
    url: "/models/indoor-stall.glb",
    label: "Indoor Stalls",
    description:
      "A guided cinematic orbit of our covered stall row. Switch to Explore to take control.",
  },
  outdoor: {
    url: "/models/outdoor-stall.glb",
    label: "Outdoor Stalls",
    description:
      "A guided cinematic orbit of our outdoor stall area. Switch to Explore to take control.",
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

// Cinematic auto-orbit camera rig — only active in "tour" mode
const TourCamera = ({ playing }: { playing: boolean }) => {
  const { camera } = useThree();
  const tRef = useRef(0);

  useFrame((_, delta) => {
    if (!playing) return;
    tRef.current += delta * 0.15; // orbit speed
    const t = tRef.current;
    const radius = 7;
    // Slow orbit with gentle vertical bob for cinematic feel
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = 2.2 + Math.sin(t * 0.5) * 0.6;
    camera.position.set(x, y, z);
    camera.lookAt(0, 1, 0);
  });

  return null;
};

export const StallTour3D = () => {
  const [active, setActive] = useState<TourId>("indoor");
  const [mode, setMode] = useState<Mode>("tour");
  const [playing, setPlaying] = useState(true);
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
            Take a virtual walk through our facilities. Watch the guided video tour or switch
            to explore mode to look around yourself.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-5xl mx-auto"
        >
          {/* Location tabs */}
          <div className="flex justify-center gap-2 mb-4">
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

          {/* Mode toggle */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setMode("tour");
                setPlaying(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                mode === "tour"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Video Tour
            </button>
            <button
              onClick={() => setMode("explore")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                mode === "explore"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              Explore
            </button>
          </div>

          {/* 3D canvas */}
          <div className="relative aspect-[16/10] rounded-lg overflow-hidden card-shadow bg-gradient-to-br from-muted to-secondary">
            <Canvas
              key={`${active}-${mode}`}
              camera={{ position: [7, 2.5, 0], fov: 45 }}
              dpr={[1, 2]}
              gl={{ antialias: true }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Stage
                  environment="sunset"
                  intensity={0.6}
                  adjustCamera={mode === "explore" ? 1.2 : false}
                >
                  <Model url={current.url} />
                </Stage>
              </Suspense>

              {mode === "tour" ? (
                <TourCamera playing={playing} />
              ) : (
                <OrbitControls
                  enablePan
                  enableZoom
                  enableRotate
                  minDistance={1}
                  maxDistance={50}
                  makeDefault
                />
              )}
            </Canvas>

            {/* Mode-specific overlay */}
            {mode === "tour" ? (
              <button
                onClick={() => setPlaying((p) => !p)}
                className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-xs bg-foreground/60 hover:bg-foreground/80 px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
              >
                {playing ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    Pause Tour
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Play Tour
                  </>
                )}
              </button>
            ) : (
              <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 text-white/90 text-xs bg-foreground/50 px-3 py-1.5 rounded-md backdrop-blur-sm">
                <Move3d className="w-3.5 h-3.5" />
                Drag to rotate • Scroll to zoom
              </div>
            )}
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
