require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routers');
const mongoose = require('mongoose');
const fileupload = require('express-fileupload');

const https = require('https');
const fs = require('fs');

mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.Promise = global.Promise;
mongoose.connection.on('error', (error) => {
    console.log("Error ", error.message);
})

const server = express();
const options = {
  key: fs.readFileSync("./certificado.key"),
  cert: fs.readFileSync("./certificado.cert")
};

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({extended: true}));
server.use(fileupload());

server.use(express.static(__dirname+'/public'));

server.use('/', apiRoutes);

https.createServer(options, server).listen(3000 , () => {
    console.log(`Rodando na porta ${process.env.BASE}`);
});
