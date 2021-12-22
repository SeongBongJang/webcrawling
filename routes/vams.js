'use strict'

const express = require('express'),
    logger = require('@amuzlab/logger'),
    router = express.Router(),
    controller = require('../controller').controller.vams,
    validator = require('../controller').validation.vams

module.exports = exports = router

router.post('/actor',validator.addition, controller.addition)

router.put('/actor', validator.update, controller.update)

router.delete('/actor', controller.delete)