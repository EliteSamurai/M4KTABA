type Labels = Record<string, string | number | boolean | undefined>;

class Counter {
  name: string;
  help?: string;
  private value: number = 0;
  private byLabel: Map<string, number> = new Map();
  constructor(name: string, help?: string) {
    this.name = name;
    this.help = help;
  }
  inc(labels?: Labels, amt: number = 1) {
    this.value += amt;
    if (labels) {
      const key = JSON.stringify(labels);
      this.byLabel.set(key, (this.byLabel.get(key) || 0) + amt);
    }
  }
  expose(): string {
    const lines: string[] = [];
    if (this.help) lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} counter`);
    if (this.byLabel.size === 0) {
      lines.push(`${this.name} ${this.value}`);
    } else {
      for (const [k, v] of this.byLabel.entries()) {
        const labels = JSON.parse(k) as Labels;
        const labelStr = Object.entries(labels)
          .map(([lk, lv]) => `${lk}="${String(lv)}"`)
          .join(",");
        lines.push(`${this.name}{${labelStr}} ${v}`);
      }
    }
    return lines.join("\n");
  }
}

class Histogram {
  name: string;
  help?: string;
  private buckets = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10];
  private counts: number[] = Array(this.buckets.length + 1).fill(0);
  private sum = 0;
  private count = 0;
  constructor(name: string, help?: string) {
    this.name = name;
    this.help = help;
  }
  observe(valueSeconds: number) {
    this.sum += valueSeconds;
    this.count += 1;
    let placed = false;
    for (let i = 0; i < this.buckets.length; i++) {
      if (valueSeconds <= this.buckets[i]) {
        this.counts[i]++;
        placed = true;
        break;
      }
    }
    if (!placed) this.counts[this.counts.length - 1]++;
  }
  expose(): string {
    const lines: string[] = [];
    if (this.help) lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} histogram`);
    let acc = 0;
    for (let i = 0; i < this.buckets.length; i++) {
      acc += this.counts[i];
      lines.push(`${this.name}_bucket{le="${this.buckets[i]}"} ${acc}`);
    }
    acc += this.counts[this.counts.length - 1];
    lines.push(`${this.name}_bucket{le="+Inf"} ${acc}`);
    lines.push(`${this.name}_sum ${this.sum}`);
    lines.push(`${this.name}_count ${this.count}`);
    return lines.join("\n");
  }
}

const registry = {
  counters: new Map<string, Counter>(),
  histograms: new Map<string, Histogram>(),
};

export function counter(name: string, help?: string) {
  let c = registry.counters.get(name);
  if (!c) {
    c = new Counter(name, help);
    registry.counters.set(name, c);
  }
  return c;
}

export function histogram(name: string, help?: string) {
  let h = registry.histograms.get(name);
  if (!h) {
    h = new Histogram(name, help);
    registry.histograms.set(name, h);
  }
  return h;
}

export function exposeMetrics(): string {
  const parts: string[] = [];
  for (const c of registry.counters.values()) parts.push(c.expose());
  for (const h of registry.histograms.values()) parts.push(h.expose());
  return parts.join("\n\n") + "\n";
}

export async function withLatency<T>(
  route: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const res = await fn();
    return res;
  } finally {
    const dur = (performance.now() - start) / 1000;
    histogram("api_latency_seconds", "API latency in seconds").observe(dur);
  }
}
