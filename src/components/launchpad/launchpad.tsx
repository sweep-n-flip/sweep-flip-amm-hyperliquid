import FlickeringGrid from "../ui/flickering-grid";
import MintPanel from "./mint-panel";

function Launchpad() {
  return (
    <div id="launchpad" className="flex relative flex-col flex-1 max-w-[1600px] py-24 w-full p-4">
      <FlickeringGrid
        className="z-0 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(950px_circle_at_center,white,transparent)]"
        squareSize={4}
        gridGap={6}
        color="#96FCE4"
        maxOpacity={0.5}
        flickerChance={0.1}
        height={1100}
        width={1600}
      />
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="font-syne font-bold sm:text-6xl xs:text-4xl text-3xl uppercase z-20">
          Nft <span className="text-primary">Launchpad</span>
        </h1>
        <h2 className="md:text-2xl text-xl font-medium text-[#434343]">
          One collection at once
        </h2>
      </div>
      <MintPanel />
    </div>
  );
}

export default Launchpad;
