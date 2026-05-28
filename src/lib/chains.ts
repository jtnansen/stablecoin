export interface ChainConfig {
  chain: string;
  address: string;
  label: string;
  color: string;
  shortLabel: string;
}

export const USDC_CHAINS: ChainConfig[] = [
  { chain: 'ethereum', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', label: 'Ethereum', shortLabel: 'ETH', color: '#627EEA' },
  { chain: 'arbitrum', address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', label: 'Arbitrum', shortLabel: 'ARB', color: '#28A0F0' },
  { chain: 'base', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', label: 'Base', shortLabel: 'BASE', color: '#0052FF' },
  { chain: 'optimism', address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', label: 'Optimism', shortLabel: 'OP', color: '#FF0420' },
  { chain: 'polygon', address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', label: 'Polygon', shortLabel: 'POL', color: '#8247E5' },
  { chain: 'avalanche', address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', label: 'Avalanche', shortLabel: 'AVAX', color: '#E84142' },
  { chain: 'bnb', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', label: 'BNB Chain', shortLabel: 'BNB', color: '#F3BA2F' },
  { chain: 'solana', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'Solana', shortLabel: 'SOL', color: '#9945FF' },
];

export const CHAIN_MAP = Object.fromEntries(USDC_CHAINS.map((c) => [c.chain, c]));
