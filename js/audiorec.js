import { aqa } from "./apolloqa.js"
import { startSyncTrack, armRec, armStop } from "./syncTrack.js"
import { sendTrackList } from "./multiuser-ws.js"
import { newSoundMesh } from "./worldObjects.js"
import { spaceshipMesh } from "./camera.js"

export let mediaRecorder = null;

// Set up basic variables for app
export const mic_record_button = document.querySelector("#record");
export const mic_stop_button = document.querySelector("#stop");

const canvasAudio = document.querySelector("#visualizer");

// Disable stop button while not recording
mic_stop_button.disabled = true;

// Visualiser setup - create web audio api context and canvas
let audioCtx;
const canvasCtx = canvasAudio.getContext("2d");
let uploadId = 0;

async function sendData(uploadFile) {
    console.log("sendData "+uploadId);
    var formData = new FormData();
    formData.append('worldId', aqa.worldId);
    formData.append('uploadId', uploadId);
    formData.append('nickname', aqa.nickname);
    formData.append('file', uploadFile);

    try {
        const response = await fetch(aqa.baseUrl+"upload", {
            method: "POST",
            body: formData,
        });
        console.log(await response.json());

        const trackUrl="loops/"+aqa.worldId+"/u"+uploadId+".ogg";

        let randX = spaceshipMesh.position.x + Math.random() * 20 - 10;
        let randY = spaceshipMesh.position.y + Math.random() * 10;
        let randZ = spaceshipMesh.position.z + Math.random() * 10;
        let trackName = aqa.nickname+" "+uploadId;
        newSoundMesh(randX,randY,randZ,trackUrl,trackName);

        let trackList={"url":trackUrl,"name":trackName,"creator":aqa.nickname,"x":randX,"y":randY,"z":randZ};
        sendTrackList(trackList);

        uploadId++;
    } catch (e) {
        console.error(e);
    }
}

function startMicRecording() {
    startSyncTrack();
    console.log(mediaRecorder.state);
    console.log("Recorder armed.");
    armRec();
    mic_record_button.style.background = "orange";
    mic_record_button.disabled = true;
    mic_stop_button.disabled = false;
}

export function initMediaRecorder() {
    // Main block for doing the audio recording
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("The mediaDevices.getUserMedia() method is supported.");

        const constraints = { audio: true };
        let chunks = [];

        let onSuccess = function (stream) {
            mediaRecorder = new MediaRecorder(stream);

            visualize(stream);

            mic_record_button.onclick = function () { startMicRecording() };

            mic_stop_button.onclick = function () {
                armStop();
                mic_stop_button.disabled = true;
                mic_stop_button.style.background = "orange";
                mic_record_button.style.background = "orange";
            };

            mediaRecorder.onstop = function (e) {
                console.log("recorder stopped");

                let blob = new Blob(chunks, { type: "audio/ogg" });
                let uploadFile = new File([blob], 'recording.ogg');

                sendData(uploadFile);
                chunks = [];
            };

            mediaRecorder.ondataavailable = function (e) {
                chunks.push(e.data);
            };
        };

        let onError = function (err) {
            console.log("The following error occured: " + err);
        };

        navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
    } else {
        console.log("MediaDevices.getUserMedia() not supported on your browser!");
    }
}

function visualize(stream) {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }

    const source = audioCtx.createMediaStreamSource(stream);

    const bufferLength = 2048;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = bufferLength;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    draw();

    function draw() {
        const WIDTH = canvasAudio.width;
        const HEIGHT = canvasAudio.height;

        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = "rgb(200, 200, 200)";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(0, 0, 0)";

        canvasCtx.beginPath();

        let sliceWidth = (WIDTH * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            let v = dataArray[i] / 128.0;
            let y = (v * HEIGHT) / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(aqa.canvas.width, aqa.canvas.height / 2);
        canvasCtx.stroke();
    }
}
