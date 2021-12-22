'use strict'

/**
 * @module      app
 * @since       0.0.1
 * @desc        서버 routing 등록 및 express 설정 module<br/>
 * @date        2020-01-02
 */

const express = require('express'),    
   path = require('path'),
   bodyParser = require('body-parser'),
   session = require('express-session'),
   logger = require('@amuzlab/logger'),      
   mariadb = require("./modules/databases").mariadb,
   routes = require('./routes')

module.exports = exports = express()

exports
   .use(require('cors')())
   .use(bodyParser.json({
       limit: '10mb'
   }))
   .use(bodyParser.urlencoded({
       limit: '10mb',
       extended: false
   }))
   .use(require('cookie-parser')())
   .use(session({
       secret: 'keyboard cat',
       resave: true,
       saveUninitialized: false,
       cookie: {
           maxAge: null,
           httpOnly: true
       },
       store: new (require('session-memory-store')(session))()
   }))
   .use((err, req, res, next) => {
       logger.error('server error (err : %s)', err.stack)

       if (res.statusCode !== 404) {
           res
               .status(err.statusCode ? err.statusCode : 500)
               .send(err instanceof Error ? err.message : err)
       }
   })
   .use('/page/', express.static(path.join(__dirname, 'public'))) 
   .use('/', routes)
   .use('/resource/', express.static('/mnt/resource'))
/*
databaseConnection()

async function databaseConnection() {
    try {
        await mariadb.connect()
        //console.log(`DB CONNECTED. : `, mariadb.conn()._conn.config)
    }catch (err) {
        console.error(`DB 연결 오류 : ${err}`)
    }    
}*/