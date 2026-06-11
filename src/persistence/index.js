if (process.env.MYSQL_HOST && process.env.REDIS_HOST)
    module.exports = require('./mysql-cached');
else if (process.env.MYSQL_HOST) module.exports = require('./mysql');
else module.exports = require('./sqlite');
