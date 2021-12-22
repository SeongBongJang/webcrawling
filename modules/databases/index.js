'use strict'

/**
 * @databases      modules/databases
 * @since       0.0.1
 * @desc        각 서비스별 비스니스 로직을 정의하는 module<br/>
 *              각 서비스 별로 database connection를 정의하여 사용한다.
 * @date        2020-01-02
*/

Object.defineProperties(
    exports,{
        mariadb: {
            value: require('./mariadb')
        }
})