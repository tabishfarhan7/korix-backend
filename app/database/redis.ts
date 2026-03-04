import { createClient } from 'redis';
import { REDIS_URL } from '../config/env.js';

const redisClient = createClient({
    url: REDIS_URL,
    database: 1,
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export const connectRedis = async (): Promise<void> => {
    await redisClient.connect();
    console.log('Redis connected successfully');
};

export default redisClient;
