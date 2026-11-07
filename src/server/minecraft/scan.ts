import minecraftProtocol from 'minecraft-protocol';

// `minecraft-protocol` is a CommonJS module. Importing it as the default export
// (and destructuring) is the reliable way to access `ping` both when the module
// is bundled and when it is left external and resolved by Node at runtime.
const { ping } = minecraftProtocol;

/**
 * Server-side Minecraft discovery.
 *
 * Discovers Minecraft servers on a fixed LAN host by pinging a range of ports
 * with the `minecraft-protocol` library (the Node.js equivalent of Python's
 * `mcstatus`). The list of candidate ports is cached for 24h; the live status
 * (MOTD, player counts, ping, version, favicon) is always re-fetched.
 *
 * This module only ever runs in the Node.js server bundle (see `server.ts`),
 * never in the browser.
 */

const HOST = '192.168.0.11';
const PORT_START = 25566;
const PORT_END = 25666;
// How often the *full* port range is re-probed. This is deliberately separate
// from the per-request status refresh: a status-only request must never push
// this clock forward, otherwise a port that was missed (e.g. a server that was
// restarting) during a full scan would stay undiscovered forever.
const FULL_SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CONCURRENCY = 20;
const PING_CLOSE_TIMEOUT_MS = 2000;
const PING_NO_PONG_TIMEOUT_MS = 1000;

export interface MinecraftServerDto {
  host: string;
  port: number;
  motd: string;
  playersOnline: number;
  playersMax: number;
  version: string;
  pingMs: number;
  favicon?: string;
}

interface PortScanCache {
  ports: number[];
}

let portScanCache: PortScanCache | null = null;
// When the last *full* rescan of the entire port range ran. Unlike the cache
// timestamp, this is only advanced by a full rescan — never by a status-only
// refresh — so it drives how often we re-discover the whole range.
let lastFullScanAt = 0;

function allPorts(): number[] {
  const ports: number[] = [];
  for (let p = PORT_START; p <= PORT_END; p++) {
    ports.push(p);
  }
  return ports;
}

/** True when the whole port range needs to be re-probed. */
function isFullScanDue(): boolean {
  return Date.now() - lastFullScanAt >= FULL_SCAN_INTERVAL_MS;
}

function storeCache(ports: number[]): void {
  portScanCache = { ports };
}

function invalidateCache(): void {
  portScanCache = null;
}

/**
 * Ping a single port. Resolves to a `MinecraftServerDto` when the port answers
 * as a Minecraft server, rejects otherwise (closed port, timeout, or a
 * non-Minecraft service).
 */
function pingPort(port: number): Promise<MinecraftServerDto> {
  return new Promise((resolve, reject) => {
    ping(
      {
        host: HOST,
        port,
        closeTimeout: PING_CLOSE_TIMEOUT_MS,
        noPongTimeout: PING_NO_PONG_TIMEOUT_MS,
      },
      (err: Error | null, data: any) => {
        if (err) {
          return reject(err);
        }
        resolve(toDto(port, data));
      },
    );
  });
}

function toDto(port: number, data: any): MinecraftServerDto {
  return {
    host: HOST,
    port,
    motd: extractMotd(data?.description),
    playersOnline: data?.players?.online ?? 0,
    playersMax: data?.players?.max ?? 0,
    version: data?.version?.name ?? 'unknown',
    pingMs: Math.round(data?.latency ?? 0),
    favicon: data?.favicon,
  };
}

/**
 * Normalize the server `description` (MOTD) into a plain string, preserving
 * any `§` color/formatting codes for the frontend to render.
 */
function extractMotd(description: any): string {
  if (typeof description === 'string') {
    return description;
  }
  if (Array.isArray(description)) {
    return description.map(extractMotd).join('\n');
  }
  if (description && typeof description === 'object') {
    // Formatted-text object: { text, extra?: [...] }
    const parts: string[] = [];
    if (typeof description.text === 'string') {
      parts.push(description.text);
    }
    if (Array.isArray(description.extra)) {
      parts.push(description.extra.map(extractMotd).join(''));
    }
    return parts.join('');
  }
  return '';
}

/**
 * Run `fn` over `items` with bounded concurrency, preserving input order.
 * Failed items are collected (not thrown) so a single bad port never rejects
 * the whole batch.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit: number,
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index++;
      try {
        results[current] = await fn(items[current]);
      } catch {
        results[current] = null;
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * Ping every port in the range and return the DTOs for the ones that answer as
 * Minecraft servers, sorted by player count (descending, ties by port).
 */
async function scanAllPorts(): Promise<MinecraftServerDto[]> {
  const results = await mapWithConcurrency(allPorts(), pingPort, CONCURRENCY);
  const servers = results.filter(
    (r): r is MinecraftServerDto => r !== null,
  );
  return sortServers(servers);
}

function sortServers(servers: MinecraftServerDto[]): MinecraftServerDto[] {
  return [...servers].sort((a, b) => {
    if (b.playersOnline !== a.playersOnline) {
      return b.playersOnline - a.playersOnline;
    }
    return a.port - b.port;
  });
}

/**
 * Run a full rescan of the whole port range, record when it happened, and cache
 * the discovered ports (an empty result is not cached, so a server that starts
 * later is re-discovered on the next request).
 */
async function runFullScan(): Promise<MinecraftServerDto[]> {
  const servers = await scanAllPorts();
  lastFullScanAt = Date.now();
  if (servers.length > 0) {
    storeCache(servers.map((s) => s.port));
  }
  return servers;
}

/**
 * Discover Minecraft servers.
 *
 * 1. Status is always live (never cached).
 * 2. A full rescan of the whole port range runs when it is due (every
 *    `FULL_SCAN_INTERVAL_MS`, driven by `lastFullScanAt` — NOT by request
 *    activity), when there is no cached port list yet, or when `forceFull` is
 *    set (the UI "Re-scan" button).
 * 3. When the full scan is not due, only the cached candidate ports are
 *    pinged. If any of them fails to answer, the cache is stale and a full
 *    rescan runs immediately.
 *
 * The key invariant: a status-only refresh must never postpone the next full
 * rescan. Otherwise a port missed during one full scan (e.g. a server that was
 * restarting) would stay undiscovered for the whole life of the process.
 */
export async function scanMinecraftServers(
  forceFull = false,
): Promise<MinecraftServerDto[]> {
  if (forceFull || isFullScanDue() || portScanCache === null) {
    return runFullScan();
  }

  const cachedPorts = portScanCache.ports;
  const results = await mapWithConcurrency(cachedPorts, pingPort, CONCURRENCY);
  const successes = results.filter((r): r is MinecraftServerDto => r !== null);
  const failedCount = results.length - successes.length;

  if (failedCount > 0) {
    // A previously-known port stopped answering -> full rescan.
    invalidateCache();
    return runFullScan();
  }

  // All cached ports still answer -> return live status. `lastFullScanAt` is
  // intentionally left untouched so the periodic full rescan still comes due.
  return sortServers(successes);
}
