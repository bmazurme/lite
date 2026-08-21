import { Counter, Histogram } from 'prom-client';

export const createRequestCounter = (name: string, help: string) =>
  new Counter({
    name,
    help,
    labelNames: ['method', 'status', 'success'],
  });

export const createRequestDurationHistogram = (name: string, help: string) =>
  new Histogram({
    name,
    help,
    labelNames: ['method', 'operation'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });
