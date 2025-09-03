import Redis from 'ioredis';

let redisClient = null;

// Check if Redis is properly configured with valid values
const isRedisConfigured = () => {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;
    const password = process.env.REDIS_PASSWORD;
    
    // Only proceed if we have valid host and port
    return host && port && host.trim() !== '' && port.trim() !== '';
};

// Only create Redis client if properly configured
if (isRedisConfigured()) {
    try {
        console.log('Initializing Redis connection...');
        console.log('Redis Host:', process.env.REDIS_HOST);
        console.log('Redis Port:', process.env.REDIS_PORT);
        
        redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD || undefined,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true, // Don't connect immediately
            connectTimeout: 5000, // 5 second timeout
            enableOfflineQueue: false, // Don't queue commands when disconnected
            maxRetriesPerRequest: 0, // Don't retry failed requests
        });

        redisClient.on('connect', () => {
            console.log('Redis connected successfully');
        });

        redisClient.on('error', (error) => {
            console.warn('Redis connection error:', error.message);
            // Set client to null on error to disable Redis operations
            redisClient = null;
        });

        redisClient.on('close', () => {
            console.warn('Redis connection closed');
            redisClient = null;
        });

        redisClient.on('end', () => {
            console.warn('Redis connection ended');
            redisClient = null;
        });

        // Connect to Redis with timeout
        const connectPromise = redisClient.connect();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
        });

        Promise.race([connectPromise, timeoutPromise])
            .then(() => {
                console.log('Redis connection established successfully');
            })
            .catch(error => {
                console.warn('Failed to connect to Redis:', error.message);
                redisClient = null;
            });

    } catch (error) {
        console.warn('Failed to initialize Redis client:', error.message);
        redisClient = null;
    }
} else {
    console.log('Redis not configured - skipping Redis initialization');
    console.log('To enable Redis, set REDIS_HOST and REDIS_PORT environment variables');
}

// Create a wrapper that handles Redis being unavailable
const redisWrapper = {
    async get(key) {
        if (!redisClient || !redisClient.status === 'ready') {
            return null;
        }
        try {
            return await redisClient.get(key);
        } catch (error) {
            console.warn('Redis get error:', error.message);
            return null;
        }
    },

    async set(key, value, mode, duration) {
        if (!redisClient || !redisClient.status === 'ready') {
            return;
        }
        try {
            await redisClient.set(key, value, mode, duration);
        } catch (error) {
            console.warn('Redis set error:', error.message);
        }
    },

    async del(key) {
        if (!redisClient || !redisClient.status === 'ready') {
            return;
        }
        try {
            await redisClient.del(key);
        } catch (error) {
            console.warn('Redis del error:', error.message);
        }
    },

    // Check if Redis is available
    isAvailable() {
        return redisClient && redisClient.status === 'ready';
    }
};

export default redisWrapper;