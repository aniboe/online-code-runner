import { Queue } from 'bullmq'
import redis from '../redis/redis.js'

export const codeQueue = new Queue('code-execution-queue', {
    connection: redis
})