import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

interface ConnectionPoolConfig {
  maxConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
  retryAttempts?: number;
}

class ConnectionPool {
  private connections: Map<string, { client: SupabaseClient; lastUsed: number; inUse: boolean }> =
    new Map();
  private config: Required<ConnectionPoolConfig>;
  private static instance: ConnectionPool;

  private constructor(config: ConnectionPoolConfig = {}) {
    this.config = {
      maxConnections: config.maxConnections || 10,
      idleTimeout: config.idleTimeout || 300000, // 5 minutes
      connectionTimeout: config.connectionTimeout || 10000, // 10 seconds
      retryAttempts: config.retryAttempts || 3,
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  static getInstance(config?: ConnectionPoolConfig): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool(config);
    }
    return ConnectionPool.instance;
  }

  async getConnection(): Promise<SupabaseClient<Database>> {
    // Find available connection
    for (const [id, conn] of this.connections) {
      if (!conn.inUse && Date.now() - conn.lastUsed < this.config.idleTimeout) {
        conn.inUse = true;
        conn.lastUsed = Date.now();
        return conn.client;
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      const client = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          db: {
            schema: 'public',
          },
          global: {
            headers: {
              'x-connection-pool': 'true',
            },
          },
        }
      );

      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.connections.set(connectionId, {
        client,
        lastUsed: Date.now(),
        inUse: true,
      });

      return client;
    }

    // Wait for available connection
    return this.waitForConnection();
  }

  private async waitForConnection(): Promise<SupabaseClient<Database>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout: No available connections'));
      }, this.config.connectionTimeout);

      const checkInterval = setInterval(() => {
        for (const [id, conn] of this.connections) {
          if (!conn.inUse) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            conn.inUse = true;
            conn.lastUsed = Date.now();
            resolve(conn.client);
            return;
          }
        }
      }, 100);
    });
  }

  releaseConnection(client: SupabaseClient): void {
    for (const [id, conn] of this.connections) {
      if (conn.client === client) {
        conn.inUse = false;
        conn.lastUsed = Date.now();
        break;
      }
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const toRemove: string[] = [];

      for (const [id, conn] of this.connections) {
        if (!conn.inUse && now - conn.lastUsed > this.config.idleTimeout) {
          toRemove.push(id);
        }
      }

      toRemove.forEach((id) => {
        this.connections.delete(id);
      });

      if (toRemove.length > 0) {
        console.log(`ConnectionPool: Cleaned up ${toRemove.length} idle connections`);
      }
    }, 60000); // Check every minute
  }

  getStats(): { total: number; active: number; idle: number } {
    let active = 0;
    let idle = 0;

    for (const conn of this.connections.values()) {
      if (conn.inUse) {
        active++;
      } else {
        idle++;
      }
    }

    return {
      total: this.connections.size,
      active,
      idle,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getConnection();
      const { data, error } = await client.from('gift_items').select('id').limit(1);
      this.releaseConnection(client);
      return !error;
    } catch (error) {
      console.error('ConnectionPool health check failed:', error);
      return false;
    }
  }
}

// Optimized database client factory
export function createOptimizedClient(): Promise<SupabaseClient<Database>> {
  const pool = ConnectionPool.getInstance({
    maxConnections: parseInt(process.env.DB_POOL_MAX_CONNECTIONS || '10'),
    idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '300000'),
    connectionTimeout: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000'),
  });

  return pool.getConnection();
}

export function releaseClient(client: SupabaseClient): void {
  const pool = ConnectionPool.getInstance();
  pool.releaseConnection(client);
}

export function getPoolStats() {
  const pool = ConnectionPool.getInstance();
  return pool.getStats();
}

export async function checkPoolHealth(): Promise<boolean> {
  const pool = ConnectionPool.getInstance();
  return pool.healthCheck();
}
