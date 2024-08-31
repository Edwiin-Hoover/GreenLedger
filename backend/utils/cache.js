const Redis = require('redis');
const { Logger } = require('./logger');

/**
 * Cache utility for Redis-based caching with fallback to in-memory
 */
class CacheManager {
  constructor(options = {}) {
    this.options = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || process.env.REDIS_PORT || 6379,
      password: options.password || process.env.REDIS_PASSWORD,
      db: options.db || 0,
      keyPrefix: options.keyPrefix || 'greenledger:',
      defaultTTL: options.defaultTTL || 3600, // 1 hour
      enableMemoryFallback: options.enableMemoryFallback !== false,
      maxMemoryEntries: options.maxMemoryEntries || 1000,
      ...options
    };

    this.redis = null;
    this.memoryCache = new Map();
    this.memoryTTLs = new Map();
    this.isRedisConnected = false;
    
    this.init();
  }

  async init() {
    try {
      // Try to connect to Redis
      this.redis = Redis.createClient({
        socket: {
          host: this.options.host,
          port: this.options.port,
        },
        password: this.options.password,
        database: this.options.db,
      });

      this.redis.on('error', (err) => {
        Logger.error('Redis connection error:', { error: err.message });
        this.isRedisConnected = false;
      });

      this.redis.on('connect', () => {
        Logger.info('Connected to Redis cache');
        this.isRedisConnected = true;
      });

      this.redis.on('disconnect', () => {
        Logger.warn('Disconnected from Redis cache');
        this.isRedisConnected = false;
      });

      await this.redis.connect();
      
      // Test connection
      await this.redis.ping();
      this.isRedisConnected = true;
      
    } catch (error) {
      Logger.warn('Failed to connect to Redis, using memory cache fallback:', { error: error.message });
      this.isRedisConnected = false;
      
      if (!this.options.enableMemoryFallback) {
        throw new Error('Redis connection failed and memory fallback is disabled');
      }
    }

    // Start memory cache cleanup interval
    if (this.options.enableMemoryFallback) {
      setInterval(() => this.cleanupMemoryCache(), 60000); // Every minute
    }
  }

  generateKey(key) {
    return `${this.options.keyPrefix}${key}`;
  }

  async set(key, value, ttl = null) {
    const cacheKey = this.generateKey(key);
    const expiration = ttl || this.options.defaultTTL;
    
    try {
      const serializedValue = JSON.stringify(value);
      
      if (this.isRedisConnected && this.redis) {
        await this.redis.setEx(cacheKey, expiration, serializedValue);
        Logger.debug('Set cache key in Redis:', { key: cacheKey, ttl: expiration });
        return true;
      }
      
      // Fallback to memory cache
      if (this.options.enableMemoryFallback) {
        this.setMemoryCache(cacheKey, serializedValue, expiration);
        Logger.debug('Set cache key in memory:', { key: cacheKey, ttl: expiration });
        return true;
      }
      
      return false;
    } catch (error) {
      Logger.error('Failed to set cache key:', { key: cacheKey, error: error.message });
      return false;
    }
  }

  async get(key) {
    const cacheKey = this.generateKey(key);
    
    try {
      let value = null;
      
      if (this.isRedisConnected && this.redis) {
        value = await this.redis.get(cacheKey);
        if (value) {
          Logger.debug('Cache hit in Redis:', { key: cacheKey });
          return JSON.parse(value);
        }
      }
      
      // Try memory cache
      if (this.options.enableMemoryFallback) {
        value = this.getMemoryCache(cacheKey);
        if (value !== null) {
          Logger.debug('Cache hit in memory:', { key: cacheKey });
          return JSON.parse(value);
        }
      }
      
      Logger.debug('Cache miss:', { key: cacheKey });
      return null;
    } catch (error) {
      Logger.error('Failed to get cache key:', { key: cacheKey, error: error.message });
      return null;
    }
  }

  async del(key) {
    const cacheKey = this.generateKey(key);
    
    try {
      let deleted = false;
      
      if (this.isRedisConnected && this.redis) {
        const result = await this.redis.del(cacheKey);
        deleted = result > 0;
      }
      
      if (this.options.enableMemoryFallback) {
        const memoryDeleted = this.delMemoryCache(cacheKey);
        deleted = deleted || memoryDeleted;
      }
      
      Logger.debug('Deleted cache key:', { key: cacheKey, deleted });
      return deleted;
    } catch (error) {
      Logger.error('Failed to delete cache key:', { key: cacheKey, error: error.message });
      return false;
    }
  }

  async exists(key) {
    const cacheKey = this.generateKey(key);
    
    try {
      if (this.isRedisConnected && this.redis) {
        const result = await this.redis.exists(cacheKey);
        if (result > 0) return true;
      }
      
      if (this.options.enableMemoryFallback) {
        return this.memoryCache.has(cacheKey) && !this.isMemoryCacheExpired(cacheKey);
      }
      
      return false;
    } catch (error) {
      Logger.error('Failed to check cache key existence:', { key: cacheKey, error: error.message });
      return false;
    }
  }

  async flush() {
    try {
      let flushed = false;
      
      if (this.isRedisConnected && this.redis) {
        await this.redis.flushDb();
        flushed = true;
      }
      
      if (this.options.enableMemoryFallback) {
        this.memoryCache.clear();
        this.memoryTTLs.clear();
        flushed = true;
      }
      
      Logger.info('Cache flushed:', { flushed });
      return flushed;
    } catch (error) {
      Logger.error('Failed to flush cache:', { error: error.message });
      return false;
    }
  }

  async increment(key, value = 1, ttl = null) {
    const cacheKey = this.generateKey(key);
    const expiration = ttl || this.options.defaultTTL;
    
    try {
      if (this.isRedisConnected && this.redis) {
        const result = await this.redis.incrBy(cacheKey, value);
        await this.redis.expire(cacheKey, expiration);
        return result;
      }
      
      // Memory cache fallback
      if (this.options.enableMemoryFallback) {
        const current = this.getMemoryCache(cacheKey);
        const newValue = (current ? parseInt(current) : 0) + value;
        this.setMemoryCache(cacheKey, newValue.toString(), expiration);
        return newValue;
      }
      
      return null;
    } catch (error) {
      Logger.error('Failed to increment cache key:', { key: cacheKey, error: error.message });
      return null;
    }
  }

  async mget(keys) {
    const cacheKeys = keys.map(key => this.generateKey(key));
    
    try {
      const results = [];
      
      if (this.isRedisConnected && this.redis) {
        const values = await this.redis.mGet(cacheKeys);
        return values.map(value => value ? JSON.parse(value) : null);
      }
      
      // Memory cache fallback
      if (this.options.enableMemoryFallback) {
        return cacheKeys.map(key => {
          const value = this.getMemoryCache(key);
          return value ? JSON.parse(value) : null;
        });
      }
      
      return keys.map(() => null);
    } catch (error) {
      Logger.error('Failed to get multiple cache keys:', { keys: cacheKeys, error: error.message });
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs, ttl = null) {
    const expiration = ttl || this.options.defaultTTL;
    
    try {
      if (this.isRedisConnected && this.redis) {
        const pipeline = this.redis.multi();
        
        for (const [key, value] of Object.entries(keyValuePairs)) {
          const cacheKey = this.generateKey(key);
          const serializedValue = JSON.stringify(value);
          pipeline.setEx(cacheKey, expiration, serializedValue);
        }
        
        await pipeline.exec();
        return true;
      }
      
      // Memory cache fallback
      if (this.options.enableMemoryFallback) {
        for (const [key, value] of Object.entries(keyValuePairs)) {
          const cacheKey = this.generateKey(key);
          const serializedValue = JSON.stringify(value);
          this.setMemoryCache(cacheKey, serializedValue, expiration);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      Logger.error('Failed to set multiple cache keys:', { keys: Object.keys(keyValuePairs), error: error.message });
      return false;
    }
  }

  // Memory cache helper methods
  setMemoryCache(key, value, ttl) {
    // Implement LRU eviction if memory cache is full
    if (this.memoryCache.size >= this.options.maxMemoryEntries) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
      this.memoryTTLs.delete(firstKey);
    }
    
    this.memoryCache.set(key, value);
    this.memoryTTLs.set(key, Date.now() + (ttl * 1000));
  }

  getMemoryCache(key) {
    if (!this.memoryCache.has(key)) return null;
    
    if (this.isMemoryCacheExpired(key)) {
      this.memoryCache.delete(key);
      this.memoryTTLs.delete(key);
      return null;
    }
    
    return this.memoryCache.get(key);
  }

  delMemoryCache(key) {
    const deleted = this.memoryCache.has(key);
    this.memoryCache.delete(key);
    this.memoryTTLs.delete(key);
    return deleted;
  }

  isMemoryCacheExpired(key) {
    const expiration = this.memoryTTLs.get(key);
    return expiration && Date.now() > expiration;
  }

  cleanupMemoryCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expiration] of this.memoryTTLs.entries()) {
      if (now > expiration) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.memoryCache.delete(key);
      this.memoryTTLs.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      Logger.debug('Cleaned up expired memory cache entries:', { count: expiredKeys.length });
    }
  }

  // Utility methods for common patterns
  async getOrSet(key, fetchFunction, ttl = null) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    try {
      const value = await fetchFunction();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      Logger.error('Failed to fetch and cache value:', { key, error: error.message });
      throw error;
    }
  }

  async remember(key, fetchFunction, ttl = null) {
    return this.getOrSet(key, fetchFunction, ttl);
  }

  // Statistics and monitoring
  async getStats() {
    const stats = {
      isRedisConnected: this.isRedisConnected,
      memoryCache: {
        size: this.memoryCache.size,
        maxEntries: this.options.maxMemoryEntries,
      },
    };
    
    if (this.isRedisConnected && this.redis) {
      try {
        const info = await this.redis.info('memory');
        stats.redis = this.parseRedisInfo(info);
      } catch (error) {
        Logger.error('Failed to get Redis stats:', { error: error.message });
      }
    }
    
    return stats;
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const stats = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = isNaN(value) ? value : Number(value);
      }
    }
    
    return stats;
  }

  // Graceful shutdown
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
        Logger.info('Redis connection closed');
      }
      
      this.memoryCache.clear();
      this.memoryTTLs.clear();
      
      Logger.info('Cache manager closed');
    } catch (error) {
      Logger.error('Error closing cache manager:', { error: error.message });
    }
  }
}

// Singleton instance
let cacheInstance = null;

const createCacheManager = (options) => {
  if (!cacheInstance) {
    cacheInstance = new CacheManager(options);
  }
  return cacheInstance;
};

const getCacheManager = () => {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
};

module.exports = {
  CacheManager,
  createCacheManager,
  getCacheManager,
  cache: getCacheManager(), // Default instance
};
