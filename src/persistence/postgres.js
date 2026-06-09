const waitPort = require('wait-port');
const fs = require('fs');
const { Pool } = require('pg');
const { createClient } = require('redis');

const {
    POSTGRES_HOST: HOST,
    POSTGRES_HOST_FILE: HOST_FILE,
    POSTGRES_USER: USER,
    POSTGRES_USER_FILE: USER_FILE,
    POSTGRES_PASSWORD: PASSWORD,
    POSTGRES_PASSWORD_FILE: PASSWORD_FILE,
    POSTGRES_DB: DB,
    POSTGRES_DB_FILE: DB_FILE,
    REDIS_HOST,
    REDIS_PORT,
} = process.env;

const CACHE_TTL = 60; // seconds
const ITEMS_CACHE_KEY = 'todo:items';

let pool;
let redis;

async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE, 'utf8').trim() : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE, 'utf8').trim() : USER;
    const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE, 'utf8').trim() : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE, 'utf8').trim() : DB;

    await waitPort({
        host,
        port: 5432,
        timeout: 10000,
        waitForDns: true,
    });

    pool = new Pool({
        host,
        user,
        password,
        database,
        max: 5,
    });

    await pool.query(
        `CREATE TABLE IF NOT EXISTS todo_items (
            id varchar(36),
            name varchar(255),
            completed boolean
        )`
    );

    console.log(`Connected to postgres db at host ${host}`);

    // Connect to Redis
    const redisHost = REDIS_HOST || 'redis';
    const redisPort = REDIS_PORT || 6379;
    redis = createClient({ url: `redis://${redisHost}:${redisPort}` });
    redis.on('error', (err) => console.error('Redis error:', err));
    await redis.connect();
    console.log(`Connected to redis at ${redisHost}:${redisPort}`);
}

async function teardown() {
    await redis.quit();
    await pool.end();
}

async function invalidateCache() {
    await redis.del(ITEMS_CACHE_KEY);
}

async function getItems() {
    // Try cache first
    const cached = await redis.get(ITEMS_CACHE_KEY);
    if (cached) {
        return JSON.parse(cached);
    }

    const { rows } = await pool.query('SELECT * FROM todo_items');
    await redis.setEx(ITEMS_CACHE_KEY, CACHE_TTL, JSON.stringify(rows));
    return rows;
}

async function getItem(id) {
    const { rows } = await pool.query('SELECT * FROM todo_items WHERE id=$1', [id]);
    return rows[0];
}

async function storeItem(item) {
    await pool.query(
        'INSERT INTO todo_items (id, name, completed) VALUES ($1, $2, $3)',
        [item.id, item.name, item.completed],
    );
    await invalidateCache();
}

async function updateItem(id, item) {
    await pool.query(
        'UPDATE todo_items SET name=$1, completed=$2 WHERE id=$3',
        [item.name, item.completed, id],
    );
    await invalidateCache();
}

async function removeItem(id) {
    await pool.query('DELETE FROM todo_items WHERE id = $1', [id]);
    await invalidateCache();
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};
