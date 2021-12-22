'use strict'

const
    video = document.querySelector('video'), // 비디오 태그    
    inputBtn = document.getElementById('file-input'), // 파일 입력 버튼
    inputFilePath = document.getElementById('file-path'), // 파일 경로 표시
    currentFrame = document.getElementById('current-frame'), //현재 프레임 번호
    timer = document.getElementById('timer'),    // timer    
    milliseconds = document.getElementById('milli-seconds'),
    prevFBtn = document.getElementById('prev-frame'), // -프레임 
    nextFBtn = document.getElementById('next-frame'), // +프레임
    captureBtn = document.getElementById('capture-btn'), // 캡쳐 버튼
    $capture = document.getElementById('capture'),
    passCaptureBtn = document.getElementById('pass-capture-btn'),
    $thumbnailList = document.getElementById('thumbnail-list'),
    //https://allensarkisyan.github.io/VideoFrameDocs/#!/documentation/seekForward
    videoinfo = VideoFrame({                            // 현재 프레임
        id: 'video-player',
        frameRate: FrameRates.NTSC,
        callback: setTime
    }),
    timelist = [
        2.902912, 
        5.271948, 
        14.781458, 
        18.585261, 
        22.288965, 
        25.425435, 
        31.731741, 
        34.668011, 
        36.970313, 
        43.610286, 
        47.51419, 
        50.817494,
        57.6243,
        95.295305
    ]

let index = 0
    
// 영상 교체
inputBtn.addEventListener("change", () => {
    console.log(inputBtn.files);
    console.log(inputBtn.files[0]);
    console.log('/resource/' + inputBtn.files[0].name);
    if (video.paused) {
        video.play();
    } else {
        video.setAttribute('src', '/resource/' + inputBtn.files[0].name)
        video.pause();
    }
})

// video eventlistener
video.addEventListener('play', () => {
    videoinfo.listen("frame")

})
video.addEventListener('pause', () => {
    videoinfo.stopListen()
    videoinfo.seekBackward(1, setTime)
    videoinfo.seekForward(1, setTime)
})
video.addEventListener('seeked', () => {
    console.info("이동 완료", video.currentTime, videoinfo.toTime())
    setTime()
    capture($thumbnailList)        
    if(video.currentTime != timelist[index] && index < timelist.length){
        video.currentTime = timelist[index++]
    }
})

// 프레임 단위 이동
prevFBtn.addEventListener('click', () => {
    video.pause()
    videoinfo.seekBackward(1, setTime)
})
nextFBtn.addEventListener('click', () => {
    video.pause()
    videoinfo.seekForward(1, setTime)
})
$(document).keydown(event => {
    event.keyCode == 37 ?
        prevFBtn.click() : event.keyCode == 39 ?
            nextFBtn.click() : event.keyCode == 32 ?
                capture() : null
})

// 캡쳐 썸네일 생성
captureBtn.addEventListener('click', () => {
    if (video.paused) {
        capture()
    }
})

// 패스 캡쳐
passCaptureBtn.addEventListener('click', async () => {    
    video.currentTime = timelist[index++]    
})

function setTime() {
    currentFrame.textContent = videoinfo.get()
    timer.textContent = videoinfo.toTime() + "." + (String(video.currentTime).split('.')[1]) // hh:mm:ss:ff
    milliseconds.textContent = videoinfo.toMilliseconds(videoinfo.toSMPTE())
}

function capture($element) {
    let scale = 0.25,
        figure = document.createElement('figure'),
        frameNum = document.createElement("p"),
        canvas = document.createElement("canvas")

    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale

    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

    let img = document.createElement("img")
    img.src = canvas.toDataURL()

    frameNum.appendChild(document.createTextNode("frame : " + currentFrame.textContent))
    frameNum.appendChild(document.createElement("br"))
    frameNum.appendChild(document.createTextNode("timer : " + timer.textContent))
    figure.append(frameNum)

    $element ? $element.append(figure) : $capture.append(figure)
    $element ? $element.append(img) : $capture.append(img)
}


// (async function () {
    
// }())