const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

const setSessionData = async (sessionId, data, ttl = 3600) => {
  const client = getRedisClient();
  await client.setEx(`session:${sessionId}`, ttl, JSON.stringify(data));
};

const getSessionData = async (sessionId) => {
  const client = getRedisClient();
  const data = await client.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
};

const deleteSessionData = async (sessionId) => {
  const client = getRedisClient();
  await client.del(`session:${sessionId}`);
};

const setCache = async (key, data, ttl = 300) => {
  const client = getRedisClient();
  await client.setEx(key, ttl, JSON.stringify(data));
};

const getCache = async (key) => {
  const client = getRedisClient();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

const clearCache = async (pattern) => {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setSessionData,
  getSessionData,
  deleteSessionData,
  setCache,
  getCache,
  clearCache
}; 