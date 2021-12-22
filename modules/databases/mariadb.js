'use strict'

/**
 * @mariadb     modules/databases/mariadb
 * @since       0.0.1
 * @desc        mariadb ssh 연결 로직
 * 
 * @date        2021-12-01
 */

const mysqlssh = require('mysql-ssh2')
let _client = undefined

Object.defineProperties(
    exports,
    {
        conn: {
            value: () => {
                if (this.isConnected()) {
                    return mysqlssh
                } else {
                    return false
                }
            }
        },
        connect: {
            value: async () => {
                return new Promise((resolve, reject) => {
                    console.log("Mariadb 연결 시작")
                    mysqlssh.connect(
                        {
                            host: '192.168.0.163',
                            port: '25000',
                            user: 'amuz-user',
                            password: 'djabwm20151214!@'
                        },
                        {
                            host: 'localhost',
                            user: 'root',
                            password: 'djabwmfoq01!!',
                            database: 'vision_internal'
                        }
                    )
                        .then(client => {
                            console.log("Mariadb 연결 완료")
                            _client = client
                            resolve()
                        })
                        .catch(err => {
                            console.error("Mariadb 연결 실패 : ", err)
                            reject()
                        })
                })
            }
        },
        isConnected: {
            value: () => {
                try {
                    return mysqlssh._conn._sshstream._readableState.pipes._readableState.pipes._needContinue ? false : true // 변경해서 전달                    
                } catch (err) {
                    return false
                }
            }
        },
        disconnect: {
            value: () => {
                return new Promise((resolve, reject) => {
                    try {
                        console.log("Mariadb 연결 종료 시작")
                        mysqlssh.close()
                        console.log("Mariadb 연결 종료")
                        resolve()
                    } catch (err) {
                        console.error("Mariadb 연결 종료 실패")
                        reject()
                    }
                })
            }
        },
        query: {
            value: (_sql) => {
                return new Promise((resolve, reject) => {
                    try {
                        _client.query(_sql, (err, results, fiels) => {
                            if (err) throw err
                            console.log(JSON.parse(JSON.stringify(results)))
                            resolve()
                        })
                        /*client.query(`INSERT INTO tb_person_meta (person_id, person_nm, person_eng_nm, sexval, birthday_yy, expert_yn) VALUES ('daw2', '장성봉', 'sungbong', 'M', '1990-04-18', 'N')`,(err, results, fiels) => {
                                if(err) throw err
                                console.log(JSON.parse(JSON.stringify(results)))
                                mysqlssh.close()
                        })*/
                    } catch (err) {
                        console.error(`query error : `, err)
                        reject()
                    }
                })
            }
        }
    }
)