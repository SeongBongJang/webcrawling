'use strict'

const axios = require('axios'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    logger = require('@amuzlab/logger'),
    TMDB = require('../../modules/worker').tmdb,
    //mariadb = require("../../modules/databases").mariadb,
    { translate } = require('bing-translate-api')

Object.defineProperties(
    exports,
    {
        addition: {
            value: async (req, res, next) => {
                try {
                    // console.log("연결여부 : ", mariadb.isConnected())
                    // await mariadb.connect()                    
                    // console.log("연결여부 : ", mariadb.isConnected())
                    // await mariadb.query('SELECT * FROM tb_person_meta limit 1')                                        
                    // await mariadb.disconnect()
                    // console.log("연결여부 : ", mariadb.isConnected())
                    
                    fs.checkPath(process.env.IMGPATH)
                    .catch(async (err) => {
                        logger.info(`이미지 경로를 생성합니다. : ${process.env.IMGPATH}`)
                        await fs.mkdir(process.env.IMGPATH)
                    })
                    TMDB.person_addition(Array.from({ length: Number(req.query.scope) }, (_, i) => i + Number(req.query.start)), res)                   

                    // let _rex_eng = /[a-zA-Z]/,
                    //     _rex_kor = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/,
                    //     _updates = [],
                    //     _ids = Array.from({ length: Number(req.query.scope) }, (_, i) => i + Number(req.query.start))

                    // await Promise.all(_ids.map(async _id => {                        
                    //     try {                            
                    //         let _person = (await axios.get(`${process.env.TMDBAPI}/person/${_id}?api_key=${process.env.TMDB_API_KEY}`)).data                            

                    //         /** bing 번역 */
                    //         _person.person_name = (await translate(_person.name, null, 'en', true)).translation

                    //         // console.log(_person.also_known_as.filter(_name => _rex_eng.test(_name)))
                    //         // let _konm = await translate(_person.name, null, 'ko', true)
                    //         // console.log(_konm)
                    //     } catch (err) {
                    //         console.error("person not found ", err)
                    //     }
                    // }))

                    //res.sendStatus(200)
                } catch (err) {
                    logger.error(`에러 : ${err}`)                    
                    res.send(err)
                }
            }
        },
        update: {
            value: async (req, res, next) => {
                try {
                    fs.checkPath(process.env.IMGPATH)
                        .catch(async (err) => {
                            logger.info(`이미지 경로를 생성합니다. : ${process.env.IMGPATH}`)
                            await fs.mkdir(process.env.IMGPATH)
                        })

                    // 인물DB 불러오기
                    let _actorList = (await axios.get(`${process.env.VAMSACTORURL}/persons?pageNum=${req.query.pageNum}&pageSize=${req.query.pageSize}`)).data.data
                    _actorList.map(_actor => {
                        _actor.person_id = _actor.personId
                        delete _actor.personId
                        _actor.person_nm = _actor.personNm
                        delete _actor.personNm
                        _actor.person_eng_nm = _actor.personEngNm
                        delete _actor.personEngNm
                        _actor.birthday_yy = _actor.birthdayYy
                        delete _actor.birthdayYy
                        _actor.image_name = _actor.imageName
                        delete _actor.imageName
                        _actor.image_url = _actor.imgUrl
                        delete _actor.imgUrl
                        _actor.expert_yn = _actor.expertYn
                        delete _actor.expertYn
                        _actor.expert_code = _actor.expertCode
                        delete _actor.expertCode
                    })

                    // 생년월일 포멧 확인
                    /*let _rex = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/
                    console.log(_actorList.filter(_actor => !_actor.imgUrl).filter(_actor => !_rex.test(_actor.birthday_yy)))*/

                    // tmdb 크롤링으로 매칭
                    /*_actorList
                        .filter(_actor => _actor.birthday_yy != "") // 생일데이터가 없는 경우 검색이 불가하므로 제외
                        .map(async _actor => {                            
                            _actor.person_nm && TMDB.person_search(_actor, _actor.person_nm)
                            _actor.person_eng_nm && TMDB.person_search(_actor, _actor.person_eng_nm)                      
                        })    */

                    // tmdb API로 매칭 
                    TMDB.person_update(_actorList)
                    /*.filter(_actor => !_actor.imgUrl)
                    .filter(_actor => !_rex.test(_actor.birthday_yy)))*/

                    res.sendStatus(200)
                } catch (err) {
                    logger.error(`에러 : ${err}`)
                    res.send(err)
                }
            }
        },
        delete: {
            value: async (req, res, next) => {
                try {

                    // 인물DB 불러오기
                    let _actorList = (await axios.get(`${process.env.VAMSACTORURL}/persons?pageNum=${req.query.pageNum}&pageSize=${req.query.pageSize}`)).data.data
                    _actorList.map(_actor => {
                        _actor.person_id = _actor.personId
                        delete _actor.personId
                        _actor.person_nm = _actor.personNm
                        delete _actor.personNm
                        _actor.person_eng_nm = _actor.personEngNm
                        delete _actor.personEngNm
                        _actor.birthday_yy = _actor.birthdayYy
                        delete _actor.birthdayYy
                        _actor.expert_yn = _actor.expertYn
                        delete _actor.expertYn
                        _actor.expert_code = _actor.expertCode
                        delete _actor.expertCode
                    })

                    await Promise.all(_actorList.map(async _actor => {
                        try {
                            // TMDB 조회
                            let _person = (await axios.get(`${process.env.TMDBAPI}/person/${_actor.person_id}?api_key=${process.env.TMDB_API_KEY}`)).data
                            console.log(_actor.person_id, _actor.person_nm, _actor.person_eng_nm, _result)
                            // 이름하고, 생일이 동일한지 확인
                            if ((_actor.person_eng_nm == _person.name) && (_actor.birthday == _person.birthday_yy)) {

                            } else {
                                // 아니면 삭제
                                /*let _response = await axios.post(`${process.env.VAMSACTORDELURL}`, {
                                    person_id: _actor.person_id
                                })
                                console.log(_actor.person_id, _actor.person_nm, _actor.person_eng_nm, _response.data)*/
                            }

                        } catch (err) {

                        }

                    }))

                    res.sendStatus(200)
                } catch (err) {
                    console.error(err)
                }
            }
        }
    }
)
