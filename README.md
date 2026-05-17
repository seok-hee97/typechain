# typechain

A small TypeScript blockchain example with proof-of-work mining and chain validation.

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Scripts

| Command         | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `npm run dev`   | Run `src/index.ts` with `ts-node` under `nodemon` watch.   |
| `npm run build` | Compile TypeScript to `build/`.                            |
| `npm start`     | Run the compiled output from `build/index.js`.             |

## What it does

- `Block` is immutable (all fields `readonly`).
- `Block.mine()` performs proof-of-work: increments `nonce` until the SHA-256 hash starts with N leading zeros (`difficulty`).
- `Blockchain.validateChain()` verifies prev-hash linkage, height ordering, and per-block PoW.

Tweak the `difficulty` constructor argument in `src/index.ts` to make mining harder.

## Reference

[Nomad Coders](https://nomadcoders.co/) — TypeScript course.
