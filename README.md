## Linera + Dynamic POC

This project is a proof-of-concept demonstrating how to integrate the Linera Web client with Dynamic (wallet auth) in a Next.js app.

Based on the Linera Web hosted example: [hosted-counter-metamask](https://github.com/linera-io/linera-web/tree/main/examples/hosted-counter-metamask), adapted to use Dynamic and Next.js.

### What this shows

- Loading the Linera Web WASM bundle from `public` with the headers required for SharedArrayBuffer and workers
- Using Dynamic for wallet connection and a custom Signer bridge so Linera can request signatures from the connected wallet
- Small glue code to make Linera’s worker module resolve correctly inside a Next.js environment

### Key pieces

- `next.config.ts`: sets COEP/COOP response headers required by Linera Web
- `public/js/@linera/client/`: Linera assets are copied here and served directly from `public`
- `app/layout.tsx`: injects a small iframe shim required by Dynamic under these headers
- `lib/dynamic-signer.ts`: implements Linera’s `Signer` interface using the connected Dynamic wallet
- `public/js/@linera/client/`: the Linera Web bundle (JS, WASM, and worker snippets)

## Prerequisites

- Node 18+
- pnpm (recommended)
- Optional (only if rebuilding Linera Web locally): Rust toolchain and whatever `linera-protocol/linera-web` requires

## Setup

1. Clone and initialize the Linera submodule

```bash
git clone <this-repo>
cd linera-poc
git submodule update --init --recursive
```

2. Provide the Dynamic environment ID

Create `.env.local` with:

```bash
NEXT_PUBLIC_DYNAMIC_ENV_ID=your_dynamic_environment_id
```

3. Install and run the app

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## How the integration works

- Linera Web assets are copied into `public/js/@linera/client/` and served as static files by Next.js

- The app sets response headers via `next.config.ts` to enable COEP/COOP for Linera Web:

  - `Cross-Origin-Embedder-Policy: credentialless`
  - `Cross-Origin-Opener-Policy: same-origin`

- Dynamic is initialized in `lib/providers.tsx` via `DynamicContextProvider`. The signer bridge in `lib/dynamic-signer.ts` implements Linera’s `Signer` by delegating to the connected wallet via EIP-191 `personal_sign`.

- The small `dynamic-iframe-shim.js` is loaded in `app/layout.tsx` before interactive scripts. This marks Dynamic-hosted iframes as `credentialless`, which is required when COEP/COOP are enabled.

- Optionally, `app/components/WasmPreload.tsx` shows how to preload the Linera JS/WASM for faster startup.

## Known issues and workarounds

1. Dynamic iframe + COEP/COOP headers

   - Because Linera requires `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin`, third‑party iframes need to be marked `credentialless` too. We add a small shim loaded in `app/layout.tsx`:
   - File: `public/js/dynamic-iframe-shim.js` (referenced in `app/layout.tsx`)

2. Do not call `dynamicWallet.signMessage(msgHex)`

   - The value passed from Linera is already pre-hashed; using a typical `signMessage` flow will hash it again. In `lib/dynamic-signer.ts` we instead call the wallet client’s JSON‑RPC directly with `personal_sign` and the message hex.

3. Linera worker module URL must be absolute
   - The generated worker snippet may embed a `ROOT`/relative URL at build time. In this POC we explicitly set the worker to import from the Next.js `public` path so it resolves correctly:
   - File: `public/js/@linera/client/snippets/.../web_worker_module.js` → `const mainModuleUrl = "/js/@linera/client/linera_web.js";`

## Scripts

```bash
pnpm dev     # start Next.js
pnpm build   # production build
pnpm start   # run production build
```
