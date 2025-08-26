import HeroSection from "@/components/hero/hero-section";
import Launchpad from "@/components/launchpad/launchpad";

export default function Home() {
  return (
    <div className="flex flex-col relative flex-1 w-full items-center overflow-hidden">
      <HeroSection />
      <Launchpad />
    </div>
  );
}