import { 
  Hero, 
  About,
  FlyingQuote,
  EngineeringHub, 
  Contact, 
  BackgroundCanvas, 
  FloatingDock,
  AeroWireframe
} from "@/components";

export default function Home() {
  return (
    <>
      {/* Global atmospheric background - fixed */}
      <BackgroundCanvas />

      {/* SR-71 Blackbird 3D experience - fixed, scroll-reactive */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <AeroWireframe className="w-full h-full" />
      </div>

      {/* Floating navigation dock */}
      <FloatingDock />

      {/* Main content - flows over background */}
      <main className="relative z-10">
        <Hero />
        <About />
        <FlyingQuote />
        <EngineeringHub />
        <Contact />
      </main>
    </>
  );
}
