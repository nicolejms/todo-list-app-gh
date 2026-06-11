const mysql = require('./mysql');
const cache = require('./redis');

const ITEMS_KEY = 'todo:items:all';
const ITEM_KEY_PREFIX = 'todo:items:';

async function init() {
    await mysql.init();
    await cache.init();
}

async function teardown() {
    await cache.teardown();
    await mysql.teardown();
}

async function getItems() {
    const cached = await cache.get(ITEMS_KEY);
    if (cached) return cached;

    const items = await mysql.getItems();
    await cache.set(ITEMS_KEY, items);
    return items;
}

async function getItem(id) {
    const key = ITEM_KEY_PREFIX + id;
    const cached = await cache.get(key);
    if (cached) return cached;

    const item = await mysql.getItem(id);
    if (item) await cache.set(key, item);
    return item;
}

async function storeItem(item) {
    await mysql.storeItem(item);
    await cache.del(ITEMS_KEY);
}

async function updateItem(id, item) {
    await mysql.updateItem(id, item);
    await cache.del(ITEMS_KEY);
    await cache.del(ITEM_KEY_PREFIX + id);
}

async function removeItem(id) {
    await mysql.removeItem(id);
    await cache.del(ITEMS_KEY);
    await cache.del(ITEM_KEY_PREFIX + id);
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
