import { 
  Hero, 
  About,
  FlyingQuote,
  EngineeringHub, 
  Contact, 
  BackgroundCanvas, 
  FloatingDock 
} from "@/components";

export default function Home() {
  return (
    <>
      {/* Global atmospheric background - fixed */}
      <BackgroundCanvas />

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
