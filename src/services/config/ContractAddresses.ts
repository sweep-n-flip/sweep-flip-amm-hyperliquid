//  Centralized contract addresses per chain
// Based on official deployment documentation from uniswap-v2-nft repo

import { type Address } from 'viem';

export interface ChainAddresses {
  readonly router: Address;
  readonly factory: Address;
  readonly weth: Address;
  readonly multicall?: Address;
}

export const CONTRACT_ADDRESSES: Record<number, ChainAddresses> = {
  // Ethereum
  1: {
    router: '0x151522484121f4e28eA24c8b5d827132775a93FE',
    factory: '0x16eD649675e6Ed9F1480091123409B4b8D228dC1',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
  },
  
  // Goerli Testnet
  5: {
    router: '0x151522484121f4e28eA24c8b5d827132775a93FE',
    factory: '0x16eD649675e6Ed9F1480091123409B4b8D228dC1',
    weth: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
  },
  
  // BNB Smart Chain
  56: {
    router: '0x790488868E4b2eDb166778D67142035091eb130A',
    factory: '0x1fC0D65ae98F69cD8DCDA4ec0F6155A5F2a7b0ab',
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    multicall: '0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb',
  },
  
  // Polygon
  137: {
    router: '0x151522484121f4e28eA24c8b5d827132775a93FE',
    factory: '0x16eD649675e6Ed9F1480091123409B4b8D228dC1',
    weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Polygon Mumbai Testnet
  80001: {
    router: '0x151522484121f4e28eA24c8b5d827132775a93FE',
    factory: '0x16eD649675e6Ed9F1480091123409B4b8D228dC1',
    weth: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889', // WMATIC
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Arbitrum One
  42161: {
    router: '0x46ed13B4EdDa147fA7eF018FB178300FA24C4Efc',
    factory: '0xFc42221594c07F2EFCEDfb11f4763FCa03248B5A',
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Avalanche
  43114: {
    router: '0x46ed13B4EdDa147fA7eF018FB178300FA24C4Efc',
    factory: '0xFc42221594c07F2EFCEDfb11f4763FCa03248B5A',
    weth: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Avalanche Fuji Testnet
  43113: {
    router: '0x151522484121f4e28eA24c8b5d827132775a93FE',
    factory: '0x16eD649675e6Ed9F1480091123409B4b8D228dC1',
    weth: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c', // WAVAX
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Base
  8453: {
    router: '0x46ed13B4EdDa147fA7eF018FB178300FA24C4Efc',
    factory: '0xFc42221594c07F2EFCEDfb11f4763FCa03248B5A',
    weth: '0x4200000000000000000000000000000000000006',
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Linea
  59144: {
    router: '0x46ed13B4EdDa147fA7eF018FB178300FA24C4Efc',
    factory: '0xFc42221594c07F2EFCEDfb11f4763FCa03248B5A',
    weth: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Blast
  81457: {
    router: '0x151522484121f4e28eA24c8b5d827132775a93FE',
    factory: '0x16eD649675e6Ed9F1480091123409B4b8D228dC1',
    weth: '0x4300000000000000000000000000000000000004',
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Optimism
  10: {
    router: '0xB18e06D9eBC9dBa28D56C112D44c6AC9b343E2Cb',
    factory: '0x7962223D940E1b099AbAe8F54caBFB8a3a0887AB',
    weth: '0x4200000000000000000000000000000000000006',
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Mode
  34443: {
    router: '0xB18e06D9eBC9dBa28D56C112D44c6AC9b343E2Cb',
    factory: '0x7962223D940E1b099AbAe8F54caBFB8a3a0887AB',
    weth: '0x4200000000000000000000000000000000000006',
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Moonbeam
  1284: {
    router: '0xB18e06D9eBC9dBa28D56C112D44c6AC9b343E2Cb',
    factory: '0x7962223D940E1b099AbAe8F54caBFB8a3a0887AB',
    weth: '0xAcc15dC74880C9944775448304B263D191c6077F', // WGLMR
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Berachain
  80084: {
    router: '0x2C4F3f0EEB169BaE301151FbFa99B4c82438F4FD',
    factory: '0x65624436e377c8A4A6918B69927e56982331b590',
    weth: '0x7507c1dc16935B82698e4C63f2746A5fCf994dF8', // WBERA
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Apechain
  33139: {
    router: '0x4C91AE2260c713EE61b7094141E9494fA7947Cfe',
    factory: '0x58ac416c2A8A217f3aF4acb1F5490efd2bE4652a',
    weth: '0x48b62137EdfA95a428D35C09E44256a739F6B557', // WAPE
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
  
  // Hyperliquid
  999: {
    router: '0x1c865C75ab96aEbe4F3beEb4388036047240096b',
    factory: '0xa575959Ab114BF3a84A9B7D92838aC3b77324E65',
    weth: '0x5555555555555555555555555555555555555555', // WHYPE
    multicall: '0x1F98415757620B543A52E61c46B32eB19261F984',
  },
};

//  Utility functions for contract addresses
export function getContractAddresses(chainId: number): ChainAddresses {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[1]; // Fallback to Ethereum
}

export function getRouterAddress(chainId: number): Address {
  return getContractAddresses(chainId).router;
}

export function getFactoryAddress(chainId: number): Address {
  return getContractAddresses(chainId).factory;
}

export function getWETHAddress(chainId: number): Address {
  return getContractAddresses(chainId).weth;
}

export function getMulticallAddress(chainId: number): Address | undefined {
  return getContractAddresses(chainId).multicall;
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}

export function getSupportedChains(): number[] {
  return Object.keys(CONTRACT_ADDRESSES).map(Number);
}
