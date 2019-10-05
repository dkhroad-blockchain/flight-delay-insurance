require('dotenv').config();
const PORT = process.env.ORACLE_SERVER_PORT;
const WEB3_URL = process.env.ORACLE_WEB3_URL;
const WEB3_WS_URL = WEB3_URL.replace(/https?/,'ws');
const ORACLE_NUM_ACCOUNTS = Number(process.env.ORACLE_NUM_ACCOUNTS);

module.exports = {
  WEB3_WS_URL,
  PORT,
  ORACLE_NUM_ACCOUNTS
}
