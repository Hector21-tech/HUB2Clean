import { Redis } from '@upstash/redis';

// Only initialize Redis if proper credentials are provided
export const redis = process.env.KV_REST_API_URL &&
                     process.env.KV_REST_API_TOKEN &&
                     process.env.KV_REST_API_URL !== "https://example.upstash.io" ?
  new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN
  }) : null;

// Helper function to check if Redis is available
export const isRedisAvailable = () => redis !== null;
