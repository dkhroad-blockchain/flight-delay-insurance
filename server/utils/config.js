require('dotenv').config();
const PORT = process.env.ORACLE_SERVER_PORT;
const WEB3_URL = process.env.ORACLE_WEB3_URL;
const WEB3_WS_URL = WEB3_URL.replace(/https?/,'ws');
const ORACLE_ACCOUNTS_STARTING_INDEX = Number(process.env.ORACLE_ACCOUNTS_STARTING_INDEX);

module.exports = {
  WEB3_WS_URL,
  PORT,
  ORACLE_ACCOUNTS_STARTING_INDEX
}
