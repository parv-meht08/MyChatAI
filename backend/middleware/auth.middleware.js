import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : undefined;

        const token = req.cookies.token || bearerToken;

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized User' });
        }

        // Optional Redis blacklist check: skip if not configured/connected
        try {
            // Only check Redis if it's properly configured
            if (process.env.REDIS_HOST || process.env.REDIS_PORT || process.env.REDIS_PASSWORD) {
                const isBlackListed = await redisClient.get(token);
                if (isBlackListed) {
                    res.cookie('token', '');
                    return res.status(401).send({ error: 'Unauthorized User' });
                }
            }
        } catch (redisError) {
            // Log Redis error but don't fail auth - Redis is optional
            console.warn('Redis connection failed, proceeding without blacklist check:', redisError.message);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        res.status(401).send({ error: 'Unauthorized User' });
    }
}