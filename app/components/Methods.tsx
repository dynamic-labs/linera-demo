"use client";

import { useState, useEffect, useRef } from "react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { lineraAdapter, LineraProvider } from "@/lib/linera-adapter";

import "./Methods.css";

interface DynamicMethodsProps {
  isDarkMode: boolean;
}

interface Block {
  height: number;
  hash: string;
  event_stream: any;
}

export default function DynamicMethods({ isDarkMode }: DynamicMethodsProps) {
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  const providerRef = useRef<LineraProvider | null>(null);
  const [chainConnected, setChainConnected] = useState<boolean>(
    lineraAdapter.isChainConnected()
  );
  const [appConnected, setAppConnected] = useState(false);

  const [count, setCount] = useState<number>(0);
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (sdkHasLoaded && isLoggedIn && primaryWallet) setIsLoading(false);
    else setIsLoading(true);
  }, [sdkHasLoaded, isLoggedIn, primaryWallet]);

  useEffect(() => {
    setChainConnected(lineraAdapter.isChainConnected());
    setAppConnected(lineraAdapter.isApplicationSet());
  }, []);

  function clearResult() {
    setResult("");
    setError(null);
  }

  async function connectLinera() {
    try {
      setError(null);

      if (!primaryWallet) {
        setError("Please connect your Dynamic wallet first");
        return;
      }

      const provider = await lineraAdapter.connect(primaryWallet);
      providerRef.current = provider;
      setChainConnected(true);

      setResult(
        `Connected to Linera!\nAddress: ${provider.address}\nChain ID: ${provider.chainId}`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to Linera"
      );
    }
  }

  // Subscribe to notifications when connected; cleanup on unmount or reconnect
  useEffect(() => {
    const provider = providerRef.current;
    const client = provider?.client;
    if (!client) return;

    const handler = (notification: any) => {
      const newBlock: Block | undefined = notification?.reason?.NewBlock;
      if (!newBlock) return;
      setBlocks((prev) => [...prev, newBlock]);
      getCount();
    };

    client.onNotification(handler);
    return () => client.onNotification(() => {});
  }, [chainConnected]);

  async function setApplication() {
    await lineraAdapter.setApplication();
    setAppConnected(true);
  }

  async function getCount() {
    const result = await lineraAdapter.queryApplication<{
      data: { value: number };
    }>({ query: "query { value }" });
    setCount(result.data.value);
  }

  async function incrementCount() {
    await lineraAdapter.queryApplication({
      query: "mutation { increment(value: 1) }",
    });
  }

  return (
    <>
      {!isLoading && (
        <div
          className="dynamic-methods"
          data-theme={isDarkMode ? "dark" : "light"}
        >
          <div className="methods-container">
            <h3>Linera Integration</h3>
            {!chainConnected && (
              <div>
                <button className="btn btn-primary" onClick={connectLinera}>
                  Connect to Linera
                </button>
              </div>
            )}

            {chainConnected && (
              <>
                {appConnected ? (
                  <>
                    <div style={{ marginBottom: "10px" }}>Count: {count}</div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div>
                        <button className="btn btn-primary" onClick={getCount}>
                          Get Count
                        </button>
                      </div>
                      <div>
                        <button
                          className="btn btn-primary"
                          onClick={incrementCount}
                        >
                          Increment Count
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <button
                      className="btn btn-primary"
                      onClick={setApplication}
                    >
                      Set Application
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {(result || error) && (
              <div className="results-container">
                {error ? (
                  <pre className="results-text error">{error}</pre>
                ) : (
                  <pre className="results-text">{result}</pre>
                )}
              </div>
            )}
            {blocks.length > 0 && (
              <div className="results-container">
                <h3 style={{ marginBottom: "10px" }}>Blocks</h3>
                {blocks.map((block) => (
                  <pre
                    key={block.height}
                    className="results-text"
                    style={{ marginBottom: "10px" }}
                  >
                    <div>Height: {block.height}</div>
                    <div>Hash: {block.hash}</div>
                  </pre>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
