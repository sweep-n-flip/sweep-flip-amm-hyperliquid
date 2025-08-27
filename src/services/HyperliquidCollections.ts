import { type TokenData } from "@/hooks/api/useTokensFromDatabase";

// Hyperliquid collections from hplist.json
const HYPERLIQUID_COLLECTIONS = [
  {
    address: "0xfbE0fF52E2079501c0BB3bC215fdd7dA89338437",
    logo: "https://bafybeibaue7rwfi43jo4ebb65dv7b2t355b6osqa3zuzcrhxoav4ws2h3i.ipfs.w3s.link/mockdrop.jpg",
    symbol: "MOCK",
    name: "Mockdrop"
  },
    {
    address: "0xE967D204922aac2b8D9e7838850Cb0b67BF63F0e",
    logo: "https://bafybeialsxqvna5fqc43epcllw4l7ltt7yvzysuk2efdeczv3ekaqeughe.ipfs.w3s.link/GenesisHLOgs-icon.png",
    symbol: "GHLOG",
    name: "Genesis HL-OGs"
  },
  {
    address: "0xA24dB49Ba893A5DbB50Ac67D41BDC0955d193cA7",
    logo: "https://static.drip.trade/collections/illiquid_pfp.png",
    symbol: "ILIQ",
    name: "Illiquid"
  },
  {
    address: "0x63eb9d77d083ca10c304e28d5191321977fd0bfb",
    logo: "https://static.drip.trade/collections/hypio_pfp.png",
    symbol: "hypio",
    name: "Hypio"
  },
  {
    address: "0xcc3d60ff11a268606c6a57bd6db74b4208f1d30c",
    logo: "https://static.drip.trade/collections/tiny-hyper-cat_pfp.jpg",
    symbol: "THC",
    name: "TinyHyperCats"
  },
  {
    address: "0xbc4a26ba78ce05e8bcbf069bbb87fb3e1dac8df8",
    logo: "https://static.drip.trade/collections/pip_pfp.jpg",
    symbol: "PIPF",
    name: "PiP & Friends"
  },
  {
    address: "0x8a3bda085fd13e71fa2851d7a4b4b8af9671c5ab",
    logo: "https://static.drip.trade/collections/hypers_pfp.png",
    symbol: "HYPR",
    name: "Hypers"
  },
  {
    address: "0xedb90b35d9ec8a215e41913300e005c35ecbaeab",
    logo: "https://static.drip.trade/collections/hypao_pfp.png",
    symbol: "HYPS",
    name: "Hypaos"
  },
  {
    address: "0x43a9652e2b3ce8970e8d33d8c34252a59a6596aa",
    logo: "https://static.drip.trade/collections/odd-otties_pfp.png",
    symbol: "ODD",
    name: "Odd Otties"
  },
  {
    address: "0xa24db49ba893a5dbb50ac67d41bdc0955d193ca7",
    logo: "https://static.drip.trade/collections/illiquid_pfp.png",
    symbol: "ILIQ",
    name: "Illiquid"
  },
  {
    address: "0x7d87ffb185fc27cbee62468a9b5ea00d538b74a6",
    logo: "https://static.drip.trade/collections/bald-brothers_pfp.png",
    symbol: "BALD",
    name: "bald bröthers"
  },
  {
    address: "0x04483d877e95ce182e8595a3f67fdccc7b55a676",
    logo: "https://static.drip.trade/collections/spazio-brothers_pfp.png",
    symbol: "SPBZ",
    name: "Spazio Brothers"
  },
  {
    address: "0xfd43e36a9d4002c54a84dab089a2ede92ffb5c60",
    logo: "https://static.drip.trade/collections/lqna_pfp.png",
    symbol: "LQNIANS",
    name: "LQnians"
  },
  {
    address: "0xe9223f562c63dc06a8aedae30411209907e9bd18",
    logo: "https://static.drip.trade/collections/nations-on-hl_pfp.gif",
    symbol: "NHL",
    name: "Nations on HL"
  },
  {
    address: "0x9be117d27f8037f6f549903c899e96e5755e96db",
    logo: "https://static.drip.trade/collections/hypers_pfp.png",
    symbol: "HYPR",
    name: "Hypers"
  },
  {
    address: "0xc6ddba999a1eb608b0cc59c87985ac51ff75ade9",
    logo: "https://static.drip.trade/collections/hybra-pass_pfp.gif",
    symbol: "HYCP",
    name: "Hybra Hyperliquid Community Pass"
  },
  {
    address: "0x90df79459afc5fc58b7bfdca3c27c18b03a29d66",
    logo: "https://static.drip.trade/collections/parodee_pfp.gif",
    symbol: "PAR",
    name: "Parodee"
  },
  {
    address: "0xeef94bf4a8efe6492cbc303c750ce8cef1488a07",
    logo: "https://static.drip.trade/collections/horsy_pfp.png",
    symbol: "HORSY NFT",
    name: "HORSY NFT Collection"
  },
  {
    address: "0x4414c32982b4cf348d4fdc7b86be2ef9b1ae1160",
    logo: "https://static.drip.trade/collections/hyperians_pfp.png",
    symbol: "HPRN",
    name: "Hyperian"
  },
  {
    address: "0xdd59ac38cb15f688c18909ba1ca708a76cc351f5",
    logo: "https://static.drip.trade/collections/gems_pfp.png",
    symbol: "GEM",
    name: "Gems"
  },
  {
    address: "0xdabd0b0c873f047287df602a865282f7115c8592",
    logo: "https://static.drip.trade/collections/derivatives_pfp.gif",
    symbol: "DERV",
    name: "Derivatives"
  },
  {
    address: "0x7bbbf65dabb0efcbe92ba434ba198487fc1f8a32",
    logo: "https://static.drip.trade/collections/octis-divers_pfp.png",
    symbol: "OCTIS",
    name: "OCTIS NFT"
  },
  {
    address: "0xea8cc2a7da4e91c559514b8192ef1cfe1497ac74",
    logo: "https://static.drip.trade/collections/mechacats_pfp.png",
    symbol: "MCT",
    name: "MechaCats"
  }
];

export class HyperliquidCollectionsService {
  /**
   * Get all Hyperliquid collections in TokenData format
   */
  static getCollections(): TokenData[] {
    return HYPERLIQUID_COLLECTIONS.map(collection => ({
      _id: collection.address,
      address: collection.address,
      name: collection.name,
      symbol: collection.symbol,
      logo: collection.logo,
      isCollection: true,
      isErc20: false,
      nativeChain: 999, // Hyperliquid chain ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collection: {
        id: collection.address,
        name: collection.name,
        symbol: collection.symbol,
        address: collection.address,
      },
      tokenIds: [], // Will be loaded when user selects NFTs
    } as TokenData));
  }

  /**
   * Search collections by name or symbol
   */
  static searchCollections(query: string): TokenData[] {
    const lowercaseQuery = query.toLowerCase();
    const allCollections = this.getCollections();
    
    return allCollections.filter(collection => 
      collection.name.toLowerCase().includes(lowercaseQuery) ||
      collection.symbol.toLowerCase().includes(lowercaseQuery) ||
      collection.address.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Check if chain is Hyperliquid
   */
  static isHyperliquidChain(chainId: number): boolean {
    return chainId === 999;
  }
}
