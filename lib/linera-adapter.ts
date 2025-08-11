import initLinera, {
  Faucet,
  Client,
  Wallet,
  Application,
} from "@linera/client";
import { Wallet as DynamicWallet } from "./dynamic";
import { DynamicSigner } from "./dynamic-signer";

const LINERA_RPC_URL = "https://faucet.devnet-2025-08-04.linera.net/";
const COUNTER_APP_ID =
  "74ed6624d053ea5b551dbe39398752ed570928937a02ee95e0baccae0b41ad00";

export interface LineraProvider {
  client: Client;
  wallet: Wallet;
  faucet: Faucet;
  address: string;
  chainId: string;
}

export class LineraAdapter {
  private static instance: LineraAdapter | null = null;
  private provider: LineraProvider | null = null;
  private application: Application | null = null;

  private constructor() {}

  static getInstance(): LineraAdapter {
    if (!LineraAdapter.instance) LineraAdapter.instance = new LineraAdapter();
    return LineraAdapter.instance;
  }

  async connect(
    dynamicWallet: DynamicWallet,
    rpcUrl?: string
  ): Promise<LineraProvider> {
    if (this.provider) return this.provider;

    if (!dynamicWallet) {
      throw new Error("Dynamic wallet is required for Linera connection");
    }

    try {
      const { address } = dynamicWallet;
      console.log("🔗 Connecting with Dynamic wallet:", address);

      await initLinera();
      console.log("✅ Linera WASM modules initialized successfully");

      const faucet = await new Faucet(rpcUrl || LINERA_RPC_URL); // This must be awaited
      const wallet = await faucet.createWallet();
      const chainId = await faucet.claimChain(wallet, address);
      console.log("Chain ID:", chainId);

      const signer = await new DynamicSigner(dynamicWallet); // This must be awaited
      const client = await new Client(wallet, signer); // This must be awaited
      console.log("✅ Linera wallet created successfully!");

      this.provider = {
        client,
        wallet,
        faucet,
        chainId,
        address: dynamicWallet.address,
      };

      return this.provider;
    } catch (error) {
      console.error("Failed to connect to Linera:", error);
      throw new Error(
        `Failed to connect to Linera network: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async setApplication(appId?: string) {
    console.log("Setting Linera Application");
    if (!this.provider) throw new Error("Not connected to Linera");

    const application = await this.provider.client
      .frontend()
      .application(appId || COUNTER_APP_ID);

    if (!application) throw new Error("Failed to get application");
    console.log("✅ Linera application set successfully!");
    this.application = application;
  }

  async queryApplication<T>(query: object): Promise<T> {
    console.log("Querying Linera Application");
    if (!this.application) throw new Error("Application not set");

    const result = await this.application.query(JSON.stringify(query));
    const response = JSON.parse(result);

    console.log("✅ Linera application queried successfully!");
    return response as T;
  }

  getProvider(): LineraProvider {
    if (!this.provider) throw new Error("Provider not set");
    return this.provider;
  }

  getFaucet(): Faucet {
    if (!this.provider?.faucet) throw new Error("Faucet not set");
    return this.provider.faucet;
  }

  getWallet(): Wallet {
    if (!this.provider?.wallet) throw new Error("Wallet not set");
    return this.provider.wallet;
  }

  getApplication(): Application {
    if (!this.application) throw new Error("Application not set");
    return this.application;
  }

  isChainConnected(): boolean {
    return this.provider !== null;
  }

  isApplicationSet(): boolean {
    return this.application !== null;
  }
}

// Export singleton instance
export const lineraAdapter = LineraAdapter.getInstance();
