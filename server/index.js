require('dotenv').config();
const http = require('http');
const app = require('./app');
const oracle = require('./oracle');
const config = require('./utils/config');
const logger = require('./utils/logger');



const server = http.createServer(app)
server.listen(config.PORT, () => {
  logger.info(`Oracle Server is running port ${config.PORT}`);
});

