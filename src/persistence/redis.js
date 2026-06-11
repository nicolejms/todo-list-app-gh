const Redis = require('ioredis');

const {
    REDIS_HOST: HOST = 'redis',
    REDIS_PORT: PORT = 6379,
} = process.env;

const DEFAULT_TTL = 60; // cache TTL in seconds

let client;

function getClient() {
    if (!client) {
        client = new Redis({
            host: HOST,
            port: Number(PORT),
            retryStrategy(times) {
                if (times > 3) return null;
                return Math.min(times * 200, 1000);
            },
            lazyConnect: true,
        });
    }
    return client;
}

async function init() {
    const redis = getClient();
    await redis.connect();
    console.log(`Connected to Redis at ${HOST}:${PORT}`);
}

async function teardown() {
    if (client) {
        await client.quit();
        client = null;
    }
}

async function get(key) {
    try {
        const data = await getClient().get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

async function set(key, value, ttl = DEFAULT_TTL) {
    try {
        await getClient().set(key, JSON.stringify(value), 'EX', ttl);
    } catch {
        // Cache write failures are non-fatal
    }
}

async function del(key) {
    try {
        await getClient().del(key);
    } catch {
        // Cache delete failures are non-fatal
    }
}

async function flush() {
    try {
        await getClient().flushdb();
    } catch {
        // Cache flush failures are non-fatal
    }
}

module.exports = {
    init,
    teardown,
    get,
    set,
    del,
    flush,
};
