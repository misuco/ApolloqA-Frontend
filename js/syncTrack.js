//// OBJECTS
let objectCount = 1;

const autoplayButton = document.querySelector("#menu_autoplay");
autoplayButton.onclick = function () {
    aqa.autoplay=!aqa.autoplay;
    if(aqa.autoplay===true) {
        autoplayButton.style.background = "orange";
    } else {
        autoplayButton.style.background = "gray";
    }
}

let tTarget=0;
let tJitter=0;
let tRec=0;
let tRecMax=4;
let nextAutoTriger=0;

aqa.syncTrackTimer = function() {
    aqa.htmlGui.updateHeader();
    if(aqa.cycleNr===0) {

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

    let tCycle=6e4 / aqa.tempo;
    if(aqa.syncTrackRunning===false) {
        aqa.syncTrackRunning = true;
        tTarget=Date.now();
    } else {
        aqa.cycleNr++;
        if(aqa.cycleNr>15) {
            aqa.cycleNr=0;
        }
        tTarget+=tCycle;
    }

    updateLabels();

    aqa.now=Date.now();
    aqa.engineTime=aqa.audioEngine.currentTime;
    let nextSyncInMs = tTarget-aqa.now;
    aqa.tJitter=nextSyncInMs-tCycle;

    setTimeout(aqa.syncTrackTimer, nextSyncInMs);
};
