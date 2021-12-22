'use strict'

/**
 * @module      modules/crawler
 * @since       0.0.1
 * @desc        crawling 사이트 별 비스니스 로직을 정의하는 worker<br/>
 
 * @date        2021-11-08
*/

const axios = require('axios'),
    util = require('util'),
    cheerio = require('cheerio'),
    path = require('path'),
    FormData = require('form-data'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    logger = require('@amuzlab/logger'),
    uuid = require('uuid'),
    mariadb = require("../../modules/databases").mariadb,
    { translate } = require('bing-translate-api');

const _rex_eng = /[a-zA-Z]/,
    _rex_kor = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/,
    _rex_bir = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/,
    _rex_spechr = /[~!@#\#$%<>^&*]/, //특수문자
    _rex_num = /[0-9]/

let _cnt = 218249, _imgCnt = 134185
Object.defineProperties(
    exports,
    {
        person_addition: {
            value: async (_ids, res) => {
                try {
                    let _updateList = [], _formData = new FormData()
                    
                    await Promise.all(_ids.map(async _id => {
                        try {
                            let _person
                            try {
                                _person = (await axios.get(`${process.env.TMDBAPI}/person/${_id}?api_key=${process.env.TMDB_API_KEY}`)).data
                            } catch (err) {
                                throw "person not found."
                            }

                            if (_person.birthday && _rex_bir.test(_person.birthday)) { // 생년월일 있는지 판별                                
                                _person.person_id = uuid.v1()
                                _person.tmdb_id = _person.id
                                
                                //이름 업데이트                                                                
                                _person.person_eng_nm = _person.also_known_as.filter(_name => _rex_eng.test(_name)).shift()                                             
                                _person.person_nm = _person.also_known_as.filter(_name => _rex_kor.test(_name)).shift()
                                
                                if(_person.person_eng_nm){
                                    _person.person_eng_nm = String(_person.person_eng_nm).replace(/\'/gi,'')                                                       
                                }else {
                                    _person.person_eng_nm = String(_person.name).replace(/\'/gi,'')
                                }

                                if (!_person.person_nm) { // 한글이름이 없는 경우
                                    //let _konm = await translate(_person.person_eng_nm, null, 'ko', true) // 영어 이름 번역
                                    //_person.person_nm = _konm.translation 
                                    _person.person_nm = _person.person_eng_nm
                                }
                                // let _name = await translate(_person.name, null, 'en', true),                                    
                                //     _engNames = _person.also_known_as.filter(_name => _rex_eng.test(_name))
                                // console.error("번역 전 : ", _person.name, "번역후 : " ,_name)
                                // _person.person_eng_nm = (_name.language.from === _name.language.to ? _person.name // 이름이 영어인 경우 원래 이름 사용
                                //     : _engNames > 0 ? _engNames.shift()  // 원래 이름이 아닌경우 영어 이름을 검색하여 사용
                                //         : _name.translation)    // 영어이름이 없는 경우 번역 된 이름 사용
                                                                                              

                                if (_person.profile_path) { // 이미지가 있는 경우                                    
                                    _person.image_name = `${_person.person_eng_nm}_${_person.person_id}.jpg`
                                    _person.image_url = process.env.TMDBIMGURL + process.env.TMDBIMGSIZE + _person.profile_path
                                    let _writer = fs.fs.createWriteStream(path.join(process.env.IMGPATH, _person.image_name)), // 이미지 다운로드
                                        _response = await axios({ //이미지 호출
                                            method: 'GET',
                                            url: _person.image_url,
                                            responseType: 'stream'
                                        })
                                    _response.data.pipe(_writer) //이미지 쓰기                                     
                                }
                                
                                _person.sexval = _person.gender == 0 ? _person.gender : _person.gender == 1 ? 'F' : 'M'
                                _person.birthday_yy = _person.birthday
                                _person.expert_yn = 'N'

                                delete _person.id
                                delete _person.name
                                delete _person.adult
                                delete _person.gender
                                delete _person.birthday
                                delete _person.profile_path

                            } else {
                                throw "person without date of birth"
                            }
                            _updateList.push(_person)
                            mariadb.isConnected() || await mariadb.connect()
                            //db 업로드               
                            if(_person.image_name) {
                                await mariadb.query(`INSERT INTO tb_person_meta (person_id, person_nm, person_eng_nm, sexval, birthday_yy, image_name, image_url, expert_yn) VALUES ('${_person.person_id}', '${_person.person_nm.trim()}', '${_person.person_eng_nm.trim()}', '${_person.sexval}', '${_person.birthday_yy}', '${_person.image_name}','${_person.image_url}','N')`)                    
                            }else {
                                await mariadb.query(`INSERT INTO tb_person_meta (person_id, person_nm, person_eng_nm, sexval, birthday_yy, expert_yn) VALUES ('${_person.person_id}', '${_person.person_nm.trim()}', '${_person.person_eng_nm.trim()}', '${_person.sexval}', '${_person.birthday_yy}','N')`)                    
                            }
                            //console.log(`INSERT INTO tb_person_meta (person_id, person_nm, person_eng_nm, sexval, birthday_yy, image_name, image_url, expert_yn) VALUES ('${_person.person_id}', '${_person.person_nm.trim()}', '${_person.person_eng_nm.trim()}', '${_person.sexval}', '${_person.birthday_yy}', '${_person.image_name}','${_person.image_url}','N')`)             
                            
                            
                        } catch (err) {
                            console.error(`${_id} : ${err}`)
                        }
                    }))
                    
                    _cnt += _updateList.length
                    _imgCnt += _updateList.filter(_person => _person.image_url).length

                    console.log(`start : ${_ids[0]}, end : ${_ids[_ids.length - 1]}`)
                    console.log("Added new Characters.", _updateList.length)
                    console.log("with images.", _updateList.filter(_person => _person.image_url).length)
                    console.log("without images.", _updateList.filter(_person => !_person.image_url).length)
                    console.log("누적 개수 : ", _cnt)
                    console.log("누적 이미지 : ", _imgCnt)

                    /*
                    _formData.append('personInfo', JSON.stringify({
                        person_list: _updateList
                    }))

                    let _response = await axios.post(process.env.VAMSACTORUPURL, _formData, {
                        headers: {
                            ..._formData.getHeaders()
                        },
                        raxConfig: {
                            retry: 3,
                            retryDelay: 4000
                        }
                    })
                    console.log("업데이트 결과 : ", _response.data)*/

                    res.send({
                        start: _ids[0],
                        end: _ids[_ids.length - 1],
                        newCharacters: _updateList.length,
                        withImgs: _updateList.filter(_person => _person.image_url).length,
                        Cumulative: _cnt,
                        CumulativeImgs: _imgCnt,
                        withoutImgs: _updateList.filter(_person => !_person.image_url).length,
                        updateList: _updateList
                    })
                    //await mariadb.disconnect()
                } catch (err) {
                    if (typeof err == String) {
                        console.error("string error => ", err)
                    } else {
                        console.error("Object error => ", err)
                    }
                }
            }
        },
        on_crawlling: {
            value: async (_actor, name) => {
                try {
                    let _nameSearch = await axios.get(`${process.env.TMDBURL}/search/person?&query=${encodeURI(name)}`),
                        $nameSearchData = cheerio.load(_nameSearch.data),
                        _searchList = $nameSearchData('.results.flex').children('.item.profile.list_item').toArray()

                    // 이름 검색 결과 확인 및 업데이트
                    await Promise.all(_searchList
                        .map(async _searchActor => {
                            let _actorDetailPage = await axios.get(`${process.env.TMDBURL}${$nameSearchData(_searchActor).find('.image_content.profile a').attr('href')}`),
                                $_actorDetailData = cheerio.load(_actorDetailPage.data),
                                _actorProfiles = $_actorDetailData('.grey_column .column .full_wrapper.facts.left_column section').children('p').toArray(),
                                _person = { // 검색 한 인물 데이터
                                    personNm: $_actorDetailData('.white_column .title a').text(),
                                    imgsrc: $_actorDetailData('.grey_column #original_header .poster_wrapper.profile .image_content img').attr('data-src')
                                }
                            // 검색한 인물 프로필 가져오기                                    
                            await Promise.all(_actorProfiles.map(_actorProfile => {
                                let _title = $_actorDetailData(_actorProfile).find('strong').text()
                                _person[_title.replace(/\s/gi, '').toLowerCase()] = String($_actorDetailData(_actorProfile).text()).split(_title)[1].trim()
                            }))

                            // 생일이 같은지 확인
                            if (
                                ((_person.birthday != undefined) && _person.birthday.split(' ')[0] == _actor.birthdayYy) &&
                                ((_person.gender != undefined) && _person.gender[0] == _actor.sexval)
                            ) {
                                if (_person.imgsrc != undefined) { // 이미지가 있는 경우
                                    _actor.imgUrl = process.env.TMDBURL + _person.imgsrc // 인물 이미지 url 업데이트
                                    _actor.imageName = _actor.personNm + '.jpg'   // 인물 이미지 파일 이름 업데이트
                                    let _writer = fs.fs.createWriteStream(path.join(process.env.IMGPATH, _actor.imageName)), // 다운로드 스트림 생성
                                        _response = await axios({ //이미지 호출
                                            method: 'GET',
                                            url: _actor.imgUrl,
                                            responseType: 'stream'
                                        })

                                    _response.data.pipe(_writer) //이미지 쓰기

                                    console.log("이미지 확인 : ", _actor)
                                    //console.log([...new Set(_updateList)])
                                    return

                                } else { //이미지가 없는 경우                                            
                                    _actor.imgUrl = ""
                                    _actor.imageName = ""
                                    console.log("이미지 없음 : ", _actor)
                                    return
                                }
                            }
                        }))
                } catch (err) {
                    console.error(_actor.personNm, err)
                }
            }
        },
        person_search: {
            value: async (_actor, name) => {
                try {

                    // 이름으로 검색
                    let _url = `${process.env.TMDBAPI}/search/person?api_key=${process.env.TMDB_API_KEY}&query=${encodeURI(name)}`,
                        _totalPages = (await axios.get(_url)).data.total_pages

                    // 검색 결과 페이지를 순서대로 확인
                    for (let _cntPage = 1; _cntPage <= _totalPages; _cntPage++) {
                        let _personInfos = ((await axios.get(`${_url}&page=${_cntPage}`)).data.results) // 페이지의 인물 정보 가져오기

                        for (const _personInfo of _personInfos) {
                            // 인물 상세 정보 조회
                            let _personDetailInfo = (await axios.get(`${process.env.TMDBAPI}/person/${_personInfo.id}?api_key=${process.env.TMDB_API_KEY}`)).data,
                                _formData = new FormData()

                            // 생일이 일치 하는 경우
                            if (_personDetailInfo.birthday == _actor.birthday_yy) {

                                // 이미지가 있는지 확인
                                if (_personDetailInfo.profile_path) {
                                    _actor.image_url = process.env.TMDBIMGURL + process.env.TMDBIMGSIZE + _personInfo.profile_path // 인물 이미지 url 업데이트
                                    _actor.image_name = `${_actor.person_nm}_${_actor.person_id}.jpg` // 인물 이미지 파일 이름 업데이트

                                    let _writer = fs.fs.createWriteStream(path.join(process.env.IMGPATH, _actor.image_name)), // 이미지 다운로드
                                        _response = await axios({ //이미지 호출
                                            method: 'GET',
                                            url: _actor.image_url,
                                            responseType: 'stream'
                                        })

                                    _response.data.pipe(_writer) //이미지 쓰기 
                                    _writer
                                        .on('error', err => {
                                            logger.error(`에러 : ${JSON.stringify(_actor)}`)
                                        })
                                        .on('finish', async () => {
                                            _formData.append(path.basename(_actor.image_name, path.extname(_actor.image_name)), fs.fs.createReadStream(path.join(process.env.IMGPATH, _actor.image_name)))

                                            //업데이트 요청 
                                            _formData.append('personInfo', JSON.stringify({
                                                person_list: [_actor]
                                            }))

                                            let _response = await axios.post(process.env.VAMSACTORUPURL, _formData, {
                                                headers: {
                                                    ..._formData.getHeaders()
                                                },
                                                timeout: 3000
                                            })
                                            logger.info(`${_actor.person_nm} ${_actor.person_id} ${JSON.stringify(_response.data)}`)
                                        })
                                }
                                return
                            }
                        }
                    }
                } catch (err) {
                    logger.error(`${JSON.stringify(_actor)}`)
                }
            }
        },
        person_update: {
            value: async (_actorList) => {
                try {
                    let _formData = new FormData()

                    await Promise.all(_actorList.map(async _actor => {
                        let _nonUpdate = true;
                        if (_actor.person_nm) {
                            let _url = `${process.env.TMDBAPI}/search/person?api_key=${process.env.TMDB_API_KEY}&query=${encodeURI(_actor.person_nm)}`,
                                _totalPages = (await axios.get(_url)).data.total_pages

                            console.error(_actor.person_nm, (await axios.get(_url)).data.total_results)

                            // 검색 결과 페이지를 순서대로 확인
                            for (let _cntPage = 1; _cntPage <= _totalPages; _cntPage++) {
                                let _personInfos = ((await axios.get(`${_url}&page=${_cntPage}`)).data.results) // 페이지의 인물 정보 가져오기

                                for (const _personInfo of _personInfos) {
                                    // 인물 상세 정보 조회
                                    let _personDetailInfo = (await axios.get(`${process.env.TMDBAPI}/person/${_personInfo.id}?api_key=${process.env.TMDB_API_KEY}`)).data

                                    // 생일이 일치 하고 이미지가 있는 경우
                                    if ((_personDetailInfo.birthday == _actor.birthday_yy) && _personDetailInfo.profile_path) {
                                        let _delResult = await axios.post(`${process.env.VAMSACTORDELURL}`, { person_id: _actor.person_id })
                                        console.log(_actor.person_id, _actor.person_nm, _actor.person_eng_nm, _delResult.data)
                                        //추가
                                        _actor.person_id = _personDetailInfo.id
                                        _actor.image_url = process.env.TMDBIMGURL + process.env.TMDBIMGSIZE + _personInfo.profile_path // 인물 이미지 url 업데이트
                                        _actor.image_name = `${_actor.person_nm}_${_actor.person_id}.jpg` // 인물 이미지 파일 이름 업데이트

                                        let _writer = fs.fs.createWriteStream(path.join(process.env.IMGPATH, _actor.image_name)), // 이미지 다운로드
                                            _response = await axios({ //이미지 호출
                                                method: 'GET',
                                                url: _actor.image_url,
                                                responseType: 'stream'
                                            })

                                        _nonUpdate = false
                                        _response.data.pipe(_writer) //이미지 쓰기                                                                                             
                                        break
                                    }
                                }
                            }
                        }

                        if (_nonUpdate && _actor.person_eng_nm) {
                            let _engUrl = `${process.env.TMDBAPI}/search/person?api_key=${process.env.TMDB_API_KEY}&query=${encodeURI(_actor.person_eng_nm)}`,
                                _totalEngPages = (await axios.get(_engUrl)).data.total_pages

                            console.error(_actor.person_eng_nm, (await axios.get(_engUrl)).data.total_results)

                            for (let _cntPage = 1; _cntPage <= 20; _cntPage++) {
                                let _personInfos = ((await axios.get(`${_engUrl}&page=${_cntPage}`)).data.results) // 페이지의 인물 정보 가져오기

                                for (const _personInfo of _personInfos) {

                                    // 인물 상세 정보 조회
                                    let _personDetailInfo = (await axios.get(`${process.env.TMDBAPI}/person/${_personInfo.id}?api_key=${process.env.TMDB_API_KEY}`)).data

                                    // 생일이 일치 하고 이미지가 있는 경우
                                    if ((_personDetailInfo.birthday == _actor.birthday_yy) && _personDetailInfo.profile_path) {
                                        let _delResult = await axios.post(`${process.env.VAMSACTORDELURL}`, { person_id: _actor.person_id })
                                        console.log(_actor.person_id, _actor.person_nm, _actor.person_eng_nm, _delResult.data)
                                        //추가
                                        _actor.person_id = _personDetailInfo.id
                                        _actor.image_url = process.env.TMDBIMGURL + process.env.TMDBIMGSIZE + _personInfo.profile_path // 인물 이미지 url 업데이트
                                        _actor.image_name = `${_actor.person_nm}_${_actor.person_id}.jpg` // 인물 이미지 파일 이름 업데이트

                                        let _writer = fs.fs.createWriteStream(path.join(process.env.IMGPATH, _actor.image_name)), // 이미지 다운로드
                                            _response = await axios({ //이미지 호출
                                                method: 'GET',
                                                url: _actor.image_url,
                                                responseType: 'stream'
                                            })

                                        _response.data.pipe(_writer) //이미지 쓰기              
                                        break
                                    }
                                }
                            }
                        }
                    }))

                    _formData.append('personInfo', JSON.stringify({
                        person_list: _actorList
                    }))

                    let _response = await axios.post(process.env.VAMSACTORUPURL, _formData, {
                        headers: {
                            ..._formData.getHeaders()
                        },
                        timeout: 10000
                    })
                    console.log("업데이트 결과 : ", _response.data)
                } catch (err) {
                    console.error(err)
                }
            }
        }
    }
)