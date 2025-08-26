import HeroSection from "@/components/hero/hero-section";
import Launchpad from "@/components/launchpad/launchpad";
import Section2 from "@/components/section2/section2";

export default function Home() {
  return (
    <div className="flex flex-col relative flex-1 w-full items-center overflow-hidden">
      <HeroSection />
      {/* <Section2 /> */}
      <Launchpad />
    </div>
  );
}