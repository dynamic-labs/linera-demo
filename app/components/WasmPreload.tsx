export default function WasmPreload() {
  return (
    <>
      <link
        rel="modulepreload"
        href="/js/@linera/client/linera_web.js"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/js/@linera/client/linera_web_bg.wasm"
        as="fetch"
        crossOrigin="anonymous"
        type="application/wasm"
      />
    </>
  );
}
