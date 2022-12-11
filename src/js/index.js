let recorder;
let chunks = [];
let webcamStream;
let enableSystemAudio = true;
let videoBlob = null
let source = 'screenwebcam';
let screenStream;
let timerInterval;
let counter = 0;
const merger = new VideoStreamMerger({ width: 1280, height: 720 });

async function startCapture(displayMediaOptions) {
    console.log('capture screen: ', source);

    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
    } catch (err) {
        console.error(`Error: ${err}`);
    }

}

const recordBoth = async () => {
    enableSystemAudio ? await startCapture({ audio: enableSystemAudio }) : await startCapture({});
    try {
        console.log('screen stream: ', screenStream);
        if (screenStream) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                webcamStream = stream;
                // processRecording();
                previewVideo()
            })
            console.log('recording both');
        } else { console.log('screen media empty'); }
    } catch (error) {
        console.log('Error recording both: ', error);
    }

    console.log('source both: ', source);
}
const recordOnlyWebcam = async () => {
    console.log('source cam: ', source);
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    if (webcamStream) {
        // processRecording();
        previewVideo();
    }

}

const recordOnlyScreen = async () => {
    console.log('source sc: ', source);
    enableSystemAudio ? await startCapture({ audio: enableSystemAudio }) : await startCapture({})
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    console.log('only screen media: ', screenStream)
    if (screenStream && webcamStream) {
        // processRecording();
        previewVideo()
    } else {
        alert('could not start recording. Seems camera or microphone access was denied')
    }
}

const previewVideo = async () => {
    console.log('previewing shortly');
    document.getElementById('actions').hidden = false;

    if (source === 'screenwebcam' || source === 'screen') {
        console.log('merging shortly');
        merger.addStream(screenStream, {
            x: 0,
            y: 0,
            width: merger.width,
            height: merger.height,
            mute: screenStream.getAudioTracks()[0] ? false : true // we don't want sound from the screen (if there is any)
        })
        merger.addStream(webcamStream, {
            x: 0,
            y: merger.height - 150,
            width: 250,
            height: 150,
            mute: webcamStream?.getAudioTracks()[0] ? false : true
        })
        merger.start();
        //   preview the video
        document.querySelector('.player').hidden = false;
        document.querySelector('video').srcObject = merger.result;
        document.querySelector('video').play();
        document.querySelector('video').muted = true;
    } else {
        console.log('webcam video previewing shortly');
        document.querySelector('.player').hidden = false;
        document.querySelector('video').srcObject = webcamStream;
        document.querySelector('video').play();
    }
}
const startRecording = async () => {

    switch (source) {
        case 'screenwebcam':
            recordBoth();
            break;
        case 'webcam':
            recordOnlyWebcam();
            break;
        case 'screen':
            recordOnlyScreen();
            break;
        default:
            break;
    }

}
const processRecording = async () => {
    document.getElementById('message').innerText = 'Recording starts in ';

    let seconds = 5;
    const startInterval = setInterval(() => {
        seconds -= 1;
        document.getElementById('counter').innerText = seconds + ' seconds';
        if (seconds === 0) {
            clearInterval(startInterval)
            document.getElementById('message').style.display = 'none';
            document.getElementById('counter').style.display = 'none';
        }
    }, 1000);

    setTimeout(async () => {

        console.log('reaching timeout')

        switch (source) {
            case 'screenwebcam':
                console.log('source all: ', source);
                recorder = new MediaRecorder(merger.result);
                break;
            case 'webcam':
                console.log('source web: ', source);
                recorder = new MediaRecorder(webcamStream);
                break;
            case 'screen':
                recorder = new MediaRecorder(merger.result);
                console.log('source screen: ', source, 'recorder: ', recorder);
                break;
            default:
                break;
        }


        // recorder.onstart = (evt) => {
        //     console.log('recording started: ', evt);
        //     document.getElementById('pause-btn').style.display = 'block';
        //     document.getElementById('stop-btn').style.display = 'block'
        //     document.getElementById('start-btn').style.display = 'none';
        //     document.getElementById('download').style.display = 'none';

        //     // start counter
        //     timerInterval = setInterval(countTimer, 1000);
        //     document.getElementById('timer').hidden = false;
        //     document.getElementById('timer').style.display = 'inline';


        // }

        document.getElementById('pause-btn').style.display = 'block';
        document.getElementById('stop-btn').style.display = 'block'
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('download').style.display = 'none';

        // start counter
        timerInterval = setInterval(countTimer, 1000);
        document.getElementById('timer').hidden = false;
        document.getElementById('timer').style.display = 'inline';

        recorder.start();

        console.log('recorder after start: ', recorder)
        recorder.addEventListener('stop', async (evt) => {
            console.log('stop event fired: ', evt);
            document.querySelector('video').play();
            document.querySelector('video').muted = false;
            // await stopRecording()
            recorder.ondataavailable = async (blob) => {
                console.log('stream recorded: ', blod)
                await saveRecording(blob['data'])
            }
        })
        console.log('recording started');
    }, 5000);

    // hide start button and display pause and stop button

}
const countTimer = () => {

    ++counter;
    var hour = Math.floor(counter / 3600);
    var minute = Math.floor((counter - hour * 3600) / 60);
    var seconds = counter - (hour * 3600 + minute * 60);
    if (hour < 10)
        hour = "0" + hour;
    if (minute < 10)
        minute = "0" + minute;
    if (seconds < 10)
        seconds = "0" + seconds;
    document.getElementById("timer").innerHTML = hour + ":" + minute + ":" + seconds;
    // console.log("timer: ", hour + ":" + minute + ":" + seconds);

}
const stopRecording = async () => {
    webcamStream?.getVideoTracks()[0]?.stop();
    webcamStream?.getAudioTracks()[0]?.stop()
    console.log('stop recording called')
    if (recorder?.state === 'recording' || recorder?.state === 'paused') {
        recorder.stop();
    }
    recorder.ondataavailable = async (evt) => {
        console.log('stream recorded: ', evt)
        chunks.push(evt.data);

        await saveRecording(evt.data)
    }
    // document.getElementById('start-btn').style.display = 'block'
    document.getElementById('pause-btn').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'none'
    document.getElementById('download').style.display = 'block';
    resetTimer();
}
const resetTimer = () => {
    clearInterval(timerInterval);
    counter = 0;
}
const saveRecording = async (data) => {
    const url = URL.createObjectURL(data);
    // const video = document.createElement('video');
    // video.controls = true;
    // video.src = url;
    // video.classList = 'col-md-7'
    document.querySelector('video').srcObject = null;
    document.querySelector('video').src = url;
    videoBlob = new Blob(chunks, { type: "video/mp4;" });
    chunks = [];
    console.log('blob: ', chunks)

}

const pauseRecording = async () => {
    console.log('recorder: ', recorder)
    if (recorder.state === "recording") {
        recorder.pause();
        document.getElementById('pause-btn').style.display = 'none';
        document.getElementById('continue-btn').style.display = 'block';
        console.log('pausing recording')

    } else if (recorder.state === "paused") {
        recorder.resume();
        document.getElementById('pause-btn').style.display = 'block';
        document.getElementById('continue-btn').style.display = 'none';
        console.log('resuming recording')
    }


}

const resumeRecording = async () => {
    pauseRecording();
}

const downloadRecording = async () => {
    if (videoBlob != null) {
        saveAs(videoBlob, "video.mp4");
    } else {
        alert('No recently recorded video')
    }
}
const shareRecording = () => {
    if (navigator.share) {
        navigator.share({
            title: 'Share Video',
            url: 'https://www.youtube.com/channel/UCFJYtyy0ss3B9FHQWZHxegg'
        }).then(() => {
            console.log('Thanks for sharing!');
        })
            .catch(console.error);
    } else {
        // fallback
    }
}
const shareSystemAudio = async () => {
    const input = document.getElementById('shareaudio');

    console.log('share audio: ', input.checked)
    enableSystemAudio = input.checked;
}
const toggleSource = async (option) => {

    switch (option) {
        case 'screenwebcam':

            source = 'screenwebcam';
            startRecording();
            break;
        case 'webcam':

            source = 'webcam';
            startRecording();
            break
        case 'screen':

            source = 'screen';
            startRecording();
    }
}

const openSettings = () => {
    // const myModal = new bootstrap.Modal(document.getElementById('exampleModal'), { backtrop: true })
    console.log('modal: ', bootstrap)
    const myModalAlternative = $('#exampleModal').modal({ backdrop: true })
}