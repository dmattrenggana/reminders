/**
 * QuickNode Console API Utility
 * 
 * QuickNode Console API allows programmatic management of endpoints:
 * - Create new endpoints
 * - List endpoints
 * - Get endpoint details
 * - Monitor usage and metrics
 * - Manage endpoint security
 * 
 * Documentation: https://www.quicknode.com/docs/console-api
 * 
 * Note: Console API is for management, not for RPC calls.
 * For RPC calls, use the endpoint HTTP URL directly.
 */

interface QuickNodeEndpoint {
  id: string;
  label?: string;
  chain: string;
  network: string;
  http_url: string;
  wss_url?: string;
  security?: {
    tokens?: boolean;
    jwts?: boolean;
    domainMasks?: boolean;
    ips?: boolean;
    hosts?: boolean;
    referrers?: boolean;
    validHosts?: boolean;
    requestFilters?: boolean;
    debugAuthErrors?: boolean;
    enforceChainNetwork?: boolean;
    ipCustomHeader?: boolean;
    hsts?: boolean;
    cors?: boolean;
  };
  options?: any;
  rate_limits?: {
    rate_limit_by_ip?: boolean;
    account?: number;
    rps?: number;
    rpm?: number;
    rpd?: number;
  };
}

interface QuickNodeUsage {
  requests: number;
  period: string;
  limit?: number;
}

interface QuickNodeMetrics {
  endpointId: string;
  requests: number;
  errors: number;
  latency: number;
  period: string;
}

interface CreateEndpointParams {
  chain: string;
  network: string;
  label?: string;
}

/**
 * QuickNode Console API Client
 */
export class QuickNodeConsoleClient {
  private apiKey: string;
  private baseUrl = "https://api.quicknode.com/v0";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("QuickNode Console API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated request to QuickNode Console API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "accept": "application/json",
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: response.statusText,
        error: `HTTP ${response.status}` 
      }));
      throw new Error(
        `QuickNode API error: ${error.message || error.error || response.statusText} (${response.status})`
      );
    }

    const data = await response.json();
    // Handle response format: { data: {...} } or direct object
    return (data.data || data) as T;
  }

  /**
   * Create a new endpoint
   * POST /endpoints
   * 
   * @param params - Endpoint creation parameters
   * @returns Created endpoint with http_url and wss_url
   */
  async createEndpoint(params: CreateEndpointParams): Promise<QuickNodeEndpoint> {
    const body = {
      chain: params.chain,
      network: params.network,
      ...(params.label && { label: params.label }),
    };

    return this.request<QuickNodeEndpoint>("/endpoints", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Create Base Mainnet endpoint
   * Convenience method for creating Base Mainnet endpoint
   */
  async createBaseEndpoint(label?: string): Promise<QuickNodeEndpoint> {
    return this.createEndpoint({
      chain: "base",
      network: "mainnet",
      label: label || "Base Mainnet",
    });
  }

  /**
   * List all endpoints
   * GET /endpoints
   */
  async listEndpoints(): Promise<QuickNodeEndpoint[]> {
    const response = await this.request<{ endpoints?: QuickNodeEndpoint[] } | QuickNodeEndpoint[]>("/endpoints");
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    if (typeof response === 'object' && 'endpoints' in response) {
      return (response as any).endpoints || [];
    }
    return [];
  }

  /**
   * Get endpoint details by ID
   * GET /endpoints/{id}
   */
  async getEndpoint(endpointId: string): Promise<QuickNodeEndpoint> {
    return this.request<QuickNodeEndpoint>(`/endpoints/${endpointId}`);
  }

  /**
   * Get RPC usage statistics
   * GET /usage/rpc
   */
  async getUsage(period?: string): Promise<QuickNodeUsage> {
    const params = period ? `?period=${period}` : "";
    return this.request<QuickNodeUsage>(`/usage/rpc${params}`);
  }

  /**
   * Get endpoint metrics
   * GET /endpoints/{id}/metrics
   */
  async getEndpointMetrics(
    endpointId: string,
    period?: string
  ): Promise<QuickNodeMetrics> {
    const params = period ? `?period=${period}` : "";
    return this.request<QuickNodeMetrics>(
      `/endpoints/${endpointId}/metrics${params}`
    );
  }

  /**
   * Find Base Mainnet endpoint
   * Helper to find the Base endpoint from list
   */
  async findBaseEndpoint(): Promise<QuickNodeEndpoint | null> {
    const endpoints = await this.listEndpoints();
    return (
      endpoints.find(
        (ep) =>
          ep.chain?.toLowerCase() === "base" &&
          ep.network?.toLowerCase() === "mainnet"
      ) || null
    );
  }

  /**
   * Get Base Mainnet endpoint HTTP URL
   * Convenience method to get the RPC URL for Base
   * If endpoint doesn't exist, creates one automatically
   */
  async getBaseRpcUrl(createIfNotExists = false): Promise<string | null> {
    let endpoint = await this.findBaseEndpoint();
    
    if (!endpoint && createIfNotExists) {
      // Create Base Mainnet endpoint if it doesn't exist
      endpoint = await this.createBaseEndpoint();
    }
    
    return endpoint?.http_url || null;
  }
}

/**
 * Create QuickNode Console API client from environment variable
 * 
 * Usage:
 * ```typescript
 * const client = createQuickNodeConsoleClient();
 * const endpoint = await client.createBaseEndpoint();
 * const endpoints = await client.listEndpoints();
 * ```
 */
export function createQuickNodeConsoleClient(): QuickNodeConsoleClient {
  const apiKey =
    typeof window !== "undefined"
      ? (process?.env?.QUICKNODE_CONSOLE_API_KEY as string)
      : process.env.QUICKNODE_CONSOLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "QUICKNODE_CONSOLE_API_KEY environment variable is not set"
    );
  }

  return new QuickNodeConsoleClient(apiKey);
}
