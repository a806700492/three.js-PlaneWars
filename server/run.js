const express = require('express')
const path = require('path')
const app = express()
const fs = require("fs");
const url = '*'

app.use(express.static(path.join(__dirname, '../')))

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", url);
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", '3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});


app.listen(7000)

console.log('game start!')

