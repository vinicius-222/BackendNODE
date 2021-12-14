const sql = require('mssql');
require('dotenv').config();

sql.Promise = global.Promise;
let config = {
    user:'DEFAULTUSER',
    password:'772150',
    server:'179.191.219.222',
    database:'Salato',
    options:{
        encrypt: true,
        trustServerCertificate: true
    }
}

module.exports = {
    getConnection:async () =>{
        const pool = await sql.connect(config);
        return pool;
    }
}