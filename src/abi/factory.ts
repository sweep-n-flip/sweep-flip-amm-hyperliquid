// AIDEV-NOTE: Factory ABI for pool validation
export const factoryAbi = [
  {
    inputs: [
      { internalType: 'address', name: 'tokenA', type: 'address' },
      { internalType: 'address', name: 'tokenB', type: 'address' },
    ],
    name: 'getPair',
    outputs: [{ internalType: 'address', name: 'pair', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'collection', type: 'address' },
    ],
    name: 'getWrapper',
    outputs: [{ internalType: 'address', name: 'wrapper', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
