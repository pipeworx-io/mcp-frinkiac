interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Frinkiac + Morbotron + Master of All Science MCP.
 *
 * Frinkiac (Simpsons), Morbotron (Futurama), Master of All Science (Rick and Morty)
 * all share the same API contract. Auth: none.
 */


const BASES: Record<string, string> = {
  simpsons: 'https://frinkiac.com/api',
  futurama: 'https://morbotron.com/api',
  rickandmorty: 'https://masterofallscience.com/api',
};

const FRAME_HOSTS: Record<string, string> = {
  simpsons: 'https://frinkiac.com',
  futurama: 'https://morbotron.com',
  rickandmorty: 'https://masterofallscience.com',
};

const UA = 'pipeworx-mcp-frinkiac/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search',
    description: 'Find screencaps matching a quote.',
    inputSchema: {
      type: 'object',
      properties: {
        show: { type: 'string', description: 'simpsons | futurama | rickandmorty (default simpsons)' },
        query: { type: 'string', description: 'Quote / keywords' },
        limit: { type: 'number', description: '1-100 (default 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'random',
    description: 'Random screencap + its caption.',
    inputSchema: {
      type: 'object',
      properties: { show: { type: 'string' } },
    },
  },
  {
    name: 'caption',
    description: 'Caption for a specific (episode, timestamp).',
    inputSchema: {
      type: 'object',
      properties: {
        show: { type: 'string' },
        episode: { type: 'string', description: 'Episode key, e.g. "S05E15" (Simpsons).' },
        timestamp: { type: 'number', description: 'Frame timestamp (ms) from search results.' },
      },
      required: ['episode', 'timestamp'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const show = pickShow(args);
  const base = BASES[show];
  switch (name) {
    case 'search': {
      const q = reqStr(args, 'query', '"steamed hams"');
      const limit = Math.min(100, Math.max(1, (args.limit as number) ?? 20));
      const data = (await frinkGet(`${base}/search?q=${encodeURIComponent(q)}`)) as Array<{
        Id: number;
        Episode: string;
        Timestamp: number;
      }>;
      const sliced = (Array.isArray(data) ? data : []).slice(0, limit).map((r) => ({
        ...r,
        frame_url: `${FRAME_HOSTS[show]}/img/${r.Episode}/${r.Timestamp}.jpg`,
        gif_url: `${FRAME_HOSTS[show]}/gif/${r.Episode}/${r.Timestamp}/${r.Timestamp + 5000}.gif`,
      }));
      return { show, count: sliced.length, results: sliced };
    }
    case 'random': {
      const data = (await frinkGet(`${base}/random`)) as {
        Frame?: { Episode?: string; Timestamp?: number };
        Subtitles?: { Content?: string }[];
      };
      const ep = data.Frame?.Episode;
      const ts = data.Frame?.Timestamp;
      return {
        show,
        episode: ep,
        timestamp: ts,
        caption: (data.Subtitles ?? []).map((s) => s.Content).filter(Boolean).join('\n'),
        frame_url: ep && ts != null ? `${FRAME_HOSTS[show]}/img/${ep}/${ts}.jpg` : null,
        raw: data,
      };
    }
    case 'caption': {
      const ep = reqStr(args, 'episode', '"S05E15"');
      const ts = (args.timestamp as number) | 0;
      if (!ts) throw new Error('timestamp must be a positive number (frame ms).');
      return frinkGet(`${base}/caption?e=${encodeURIComponent(ep)}&t=${ts}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function pickShow(args: Record<string, unknown>): 'simpsons' | 'futurama' | 'rickandmorty' {
  const s = ((args.show as string | undefined) ?? 'simpsons').toLowerCase();
  if (s !== 'simpsons' && s !== 'futurama' && s !== 'rickandmorty') {
    throw new Error('show must be simpsons | futurama | rickandmorty.');
  }
  return s;
}

async function frinkGet(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Frinkiac: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
