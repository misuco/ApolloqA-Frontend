import { aqa } from "./apolloqa.js"
import { mediaRecorder, mic_record_button, mic_stop_button } from "./audiorec.js"
import { updateLabels } from "./worldObjects.js"

export let autoplay=false;
export let tJitter=0;
export let recArmed=false;
export let stopArmed=false;

// current audio engine time in msl
export let engineTime=0;
export let beatNr=0;

export function startSyncTrack() {
    if(syncTrackRunning===false) {
        syncTrackRunning=true;
        tTarget=engineTime*1000;
        syncTrackTimer();
        console.log("startSyncTrack");
    } else {
        console.log("syncTrack running");
    }
}

export function armRec() {
    recArmed=true;
}

export function armStop() {
    stopArmed=true;
}

let tTarget=0;
let tRec=0;
let tRecMax=4;
let nextAutoTriger=0;
let syncTrackRunning=false;

let recording=false;

function syncTrackTimer() {
    aqa.htmlGui.updateHeader();

    if(beatNr===0) {

        if(recording) {
            tRec++;
        }

        if(recArmed) {
            mediaRecorder.start();
            console.log("Recorder started.");
            recArmed=false;
            recording=true;
            tRec=0;
            mic_record_button.style.background = "red";
        }

        if(stopArmed) {
            mediaRecorder.stop();
            console.log(mediaRecorder.state);
            console.log("Recorder stopped.");
            mic_stop_button.style.background = "";
            stopArmed=false;
            recording=false;
            mic_record_button.style.background = "";
            mic_record_button.disabled = false;
        }

        // stop after max rec time
        if(recording && tRec+1>=tRecMax) {
            stopArmed=true;
            mic_record_button.style.background = "";
            mic_record_button.disabled = false;
            mic_stop_button.disabled = true;
            mic_stop_button.style.background = "orange";
        }

        // auto trigger next track calc
        if(autoplay===true) {
            generateNewSound();
        }
    }

    engineTime=aqa.audioEngine.currentTime;

    let tBeat = aqa.beatTime*1000;

    beatNr++;
    if(beatNr >= aqa.beatsPerChord * aqa.chordsLen) {
        beatNr=0;
    }
    tTarget+=tBeat;

    updateLabels();

    let nextSyncInMs = tTarget-engineTime*1000;
    tJitter=nextSyncInMs-tBeat;

    setTimeout(syncTrackTimer, nextSyncInMs);
};
