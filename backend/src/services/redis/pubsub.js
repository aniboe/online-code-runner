import Redis from 'ioredis'

// Standard connection for publishing messages
export const redisPub = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
})

// Dedicated connection required for entering subscriber mode
export const redisSub = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
})