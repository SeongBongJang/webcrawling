'use strict'

Object.defineProperties(
    exports,
    {
        addition: {
            value: (req, res, next) => {                    
                Number(req.query.start) >= 0 && Number(req.query.scope) ? next() : res.status(400).send('please checking arguments')
            }
        },
        update: {
            value: (req, res, next) => {                
                req.query.pageNum && req.query.pageSize ?
                    next() : res.status(400).send('please checking arguments')
            }
        },
        updateName:{
            value: (req, res, next) => {
                Number(req.query.start) >= 0 && Number(req.query.scope) ? next() : res.status(400).send('please checking arguments')                    
            }
        }
    }
)