let recorder;
let chunks = [];
let webcamStream;
enableSystemAudio = true;

const merger = new VideoStreamMerger({ width: 1280, height: 720 });

async function startCapture(displayMediaOptions) {
    let captureStream;

    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    } catch (err) {
        console.error(`Error: ${err}`);
    }
    return captureStream;
}

const startRecording = async () => {

    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const screenStream = enableSystemAudio ? await startCapture({ audio: enableSystemAudio }) : await startCapture({})
    document.getElementById('message').innerText = 'Recording starts in ';

    let seconds = 5;
    const startInterval = setInterval(() => {
        seconds -= 1;
        document.getElementById('counter').innerText = seconds + ' seconds';
        if (seconds === 0) {
            clearInterval(startInterval)
        }
    }, 1000);

    setTimeout(async () => {

        merger.addStream(screenStream, {
            x: 0, // position of the topleft corner
            y: 0,
            width: merger.width,
            height: merger.height,
            mute: screenStream.getAudioTracks()[0] ? false : true // we don't want sound from the screen (if there is any)
        })

        // Add the webcam stream. Position it on the bottom left and resize it to 100x100.
        merger.addStream(webcamStream, {
            x: 0,
            y: merger.height - 150,
            width: 250,
            height: 150,
            mute: webcamStream?.getAudioTracks()[0] ? false : true
        })
        merger.start();

        recorder = new MediaRecorder(merger.result);

        recorder.onstart = (evt) => {
            console.log('recording started: ', evt)
        }
        recorder.start()
        // console.log('recorder: ', recorder)
        recorder.addEventListener('stop', async (evt) => {
            console.log('stop event fired: ', evt);
            // await stopRecording()
            recorder.ondataavailable = async (blob) => {
                console.log('stream recorded: ', blod)
                await saveRecording(blob['data'])
            }
        })
        console.log('recording started');
    }, 3000);

    // hide start button and display pause and stop button
    document.getElementById('pause-btn').style.display = 'block';
    document.getElementById('stop-btn').style.display = 'block'
    document.getElementById('start-btn').style.display = 'none'
}

const stopRecording = async () => {
    webcamStream.getVideoTracks()[0].stop()
    console.log('stop recording called')
    if (recorder.state === 'recording' || recorder.state === 'paused') {
        recorder.stop();
    }
    recorder.ondataavailable = async (evt) => {
        console.log('stream recorded: ', evt)
        chunks.push(evt.data);

        await saveRecording(evt.data)
    }
    document.getElementById('start-btn').style.display = 'block'
    document.getElementById('pause-btn').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'none'

}

const saveRecording = async (data) => {
    const url = URL.createObjectURL(data);
    const video = document.createElement('video');
    video.controls = true;
    video.src = url;
    document.getElementById('video-container').append(video)
    const blob = new Blob(chunks, { type: "video/mp4;" });
    chunks = [];
    console.log('blob: ', chunks)
    saveAs(blob, "video.mkv");
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

const uploadRecording = async () => {
    console.log('we will upload recording here');
}
const shareSystemAudio = async () => {
    const input = document.getElementById('shareaudio');

    console.log('share audio: ', input.checked)
    enableSystemAudio = input.checked;
}