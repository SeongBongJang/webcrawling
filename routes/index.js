'use strict'

/**
 * @module      routes
 * @since       0.0.1
 * @desc        서버 API Router 정보를 정의하는 module<br/>
 *              각 서비스 별로 sub module을 만들어서 관리한다
 * @date        2020-01-02
*/

const express = require('express'),
    router = express.Router()

module.exports = exports = router

exports.use('/vams', require('./vams'))