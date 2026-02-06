const stores = {};

function createRateLimiter(name, maxRequests, windowMs) {
    if (!stores[name]) {
        stores[name] = {};
    }
    const store = stores[name];

    return function isRateLimited(key) {
        const now = Date.now();
        if (!store[key]) {
            store[key] = { count: 1, resetTime: now + windowMs };
            return false;
        }
        if (now > store[key].resetTime) {
            store[key] = { count: 1, resetTime: now + windowMs };
            return false;
        }
        store[key].count++;
        return store[key].count > maxRequests;
    };
}

module.exports = { createRateLimiter };
