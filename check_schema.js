const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const info = db.pragma('table_info(users)');
console.log(JSON.stringify(info, null, 2));
db.close();
