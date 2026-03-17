//// OBJECTS
let objectCount = 1;

let tTarget=0;
let tJitter=0;
let tRec=0;
let tRecMax=4;
let nextAutoTriger=0;

aqa.syncTrackTimer = function() {
    aqa.syncTrackRunning=true;
    aqa.htmlGui.updateHeader();
    if(aqa.beatNr===0) {

        if(aqa.recording) {
            tRec++;
        }

        if(aqa.recArmed) {
            aqa.mediaRecorder.start();
            console.log("Recorder started.");
            aqa.recArmed=false;
            aqa.recording=true;
            tRec=0;
            mic_record_button.style.background = "red";
        }

        if(aqa.stopArmed) {
            aqa.mediaRecorder.stop();
            console.log(aqa.mediaRecorder.state);
            console.log("Recorder stopped.");
            mic_stop_button.style.background = "";
            aqa.stopArmed=false;
            aqa.recording=false;
            mic_record_button.style.background = "";
            mic_record_button.disabled = false;
        }

        // stop after max rec time
        if(aqa.recording && tRec+1>=tRecMax) {
            aqa.stopArmed=true;
            mic_record_button.style.background = "";
            mic_record_button.disabled = false;
            mic_stop_button.disabled = true;
            mic_stop_button.style.background = "orange";
        }

        // auto trigger next track calc
        if(aqa.autoplay===true) {
            generateNewSound();
        }
    }

    aqa.engineTime=aqa.audioEngine.currentTime;

    let tCycle = aqa.beatTime*1000;
    if(aqa.syncTrackRunning===false) {
        aqa.syncTrackRunning = true;
        tTarget=aqa.engineTime*1000;
    } else {
        aqa.beatNr++;
        if(aqa.beatNr >= aqa.cycleLen * aqa.chordsLen) {
            aqa.beatNr=0;
        }
        tTarget+=tCycle;
    }

    updateLabels();

    let nextSyncInMs = tTarget-aqa.engineTime*1000;
    aqa.tJitter=nextSyncInMs-tCycle;

    setTimeout(aqa.syncTrackTimer, nextSyncInMs);
};
