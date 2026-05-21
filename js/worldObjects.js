import { aqa } from "./apolloqa.js"
import { soundMeshes, randomMesh } from "./worldObjectsMeshes.js"
import { startSyncTrack, syncTrackRunning } from "./syncTrack.js"
import { sendTrackList, loadingTarget, loadingCount, updateLoadingProgress, resetLoadingProgress, incLoadingTarget } from "./multiuser-ws.js"
import { initCamera, spaceshipMesh } from "./camera.js"

export let worldObjects = new Map();

let labels = null;

let objSelect=1;
let objectCount=0;

let soundMeshQueue=[];

export async function initAudio() {
    if (navigator.userActivation.hasBeenActive) {
        aqa.audioEngine = await BABYLON.CreateAudioEngineAsync({
            volume: 0.9,
            listenerAutoUpdate: true,
            listenerEnabled: true,
            resumeOnInteraction: true
        });

        aqa.audioEngine.listener.attach(spaceshipMesh);
        console.log("wo: audioEngine ready")
        initNextInQueue();

    } else {
        aqa.htmlGuiStart.start_overlay.hidden=false;
        aqa.htmlGuiStart.start_audio_button.disabled=false;
        aqa.htmlGuiStart.start_audio_button.innerHTML="Press to start audio";
    }
}

export function newSoundMesh(t) {
    console.log("wo: newSoundMesh "+t.url+" "+t.name);
    soundMeshQueue.push(t);
    initNextInQueue();
}

function initNextInQueue() {
    console.log("wo: initNextInQueue length "+soundMeshQueue.length);

    if(soundMeshQueue.length<=0) {
        return;
    }

    if(!aqa.audioEngine) {
        initAudio();
        return;
    }

    let worldObject = soundMeshQueue.pop();

    let rootMesh = new BABYLON.TransformNode();
    let mesh = new BABYLON.TransformNode();
    mesh.parent = rootMesh;

    let soundMesh = new soundMeshes[worldObject.mesh]("mesh_"+worldObject.url,mesh);

    rootMesh.position.x=worldObject.x;
    rootMesh.position.y=worldObject.y;
    rootMesh.position.z=worldObject.z;

    worldObject.mesh = mesh;
    worldObject.rootMesh = rootMesh;
    worldObject.soundMesh = soundMesh;

    if(!aqa.audioEngine) { initAudio(); }

    BABYLON.CreateSoundAsync("sound_"+worldObject.url, worldObject.url, {
        spatialEnabled: true,
        spatialMaxDistance: 100
    }).then(track => {

        // sample accurate sync of samples is calculated here
        const currentTime = track.engine.currentTime; // float, seconds
        if(syncTrackRunning===false) {
            aqa.beatSyncTimeOffsetS=currentTime;
        }
        const loopLen = aqa.beatTimeMs/1000 * aqa.beatsPerChord * aqa.chordsLen;
        const loopNumber = Math.floor((currentTime-aqa.beatSyncTimeOffsetS) / loopLen);
        const nextLoopTime = aqa.beatSyncTimeOffsetS + (loopNumber + 1) * loopLen;

        let waitTime = syncTrackRunning ? nextLoopTime - currentTime : 0;

        console.log("wo: track ready "+ worldObject.url + " at " + currentTime + " loopNr " + loopNumber + " next loop " + nextLoopTime + " wait " + waitTime );
        track.spatial.attach(worldObject.mesh);
        track.play({
            loop: true,
            waitTime: waitTime
        });
        worldObject.track=track;

        // sync track is used to trigger audio recording and update header text
        if(syncTrackRunning===false) {
            startSyncTrack();
        }

        // update the loading status
        updateLoadingProgress(1);

        if(loadingCount>=loadingTarget) {
            aqa.htmlGui.footer_text.innerHTML="";
            resetLoadingProgress();
        }

        BABYLON.CreateAudioBusAsync("analyzer_" + worldObject.url, {
            analyzerEnabled: true
        }).then(bus => {
            bus.analyzer.fftSize=64;
            worldObject.bus = bus;
            worldObject.track.outBus=worldObject.bus;
            console.log("wo: analyzer bus ready: " + worldObject.url);

            worldObjects.set(worldObject.url,worldObject);
        }).catch(err => {
            console.error("wo: cannot analyze sound:" + worldObject.url + " " + err);
        });

    }).catch(err => {
        console.error("wo: cannot play sound:" + worldObject.url + " " + err);
    });

    if(!labels) {
        labels = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        labels.useInvalidateRectOptimization = false;
    }

    let rect1 = new BABYLON.GUI.Button();
        labels.addControl(rect1);
        rect1.width = "200px";
        rect1.height ="50px";
        rect1.thickness = 2;
        //rect1.linkOffsetX = "150px";
        //rect1.linkOffsetY = "-100px";
        rect1.transformCenterX = 0;
        rect1.transformCenterY = 1;
        rect1.background = "grey";
        rect1.alpha = 0.2;
        //rect1.scaleX = 0;
        //rect1.scaleY = 0;
        rect1.cornerRadius = 30
        rect1.linkWithMesh(worldObject.mesh);

    let text1 = new BABYLON.GUI.TextBlock();
        objectCount++
        worldObject.labelBaseText = objectCount + " : " + worldObject.name;
        text1.text = worldObject.labelBaseText;
        text1.color = "White";
        text1.fontSize = 14;
        text1.textWrapping = true;
        text1.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text1.background = '#006994'
        rect1.addControl(text1)
        text1.alpha = (1/text1.parent.alpha);
        text1.paddingTop = "5px";
        text1.paddingBottom = "5px";
        text1.paddingLeft = "5px";
        text1.paddingRight = "5px";

        worldObject.button = rect1;
        worldObject.label = text1;

    if(soundMeshQueue.length>0) {
        console.log("wo: reschedule initNextInQueue");
        setTimeout(initNextInQueue,1000);
    }

    console.log("wo: initNextInQueue done");
}

export function generateNewSound() {
    let quantize_selected = aqa.htmlGui.quantize();
    let quantize_real = Math.pow(2,quantize_selected)*8;

    let trackId=0;

    const sf2Nr = aqa.htmlGui.instrument();
    const sf2Json = aqa.instruments[sf2Nr];
    const sf2File = sf2Json.soundfont;
    const instrumentPresCount = sf2Json.presets.length;
    if(instrumentPresCount<=0) {
        console.log("wo: Instrument preset count <=0");
        return;
    }

    const presetJson = sf2Json.presets[aqa.getRandomInt(instrumentPresCount-1)];
    const presetName = presetJson.name;

    console.log("wo: presetJson.name " + presetJson.name + " presetJson.nr " + presetJson.nr + " presetJson.bank " + presetJson.bank);
    console.log("wo: trigger new sound trackId " + trackId + " quantize " + quantize_selected + " " + quantize_real );

    var queryId = trackId + "_" + aqa.tempo + "_" + Date.now();

    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function() {
        if (this.response.includes("Error")) {
            console.log("wo: server error!!!");
        } else {
            const trackUrl=this.response + ".ogg";
            let randX = spaceshipMesh.position.x + Math.random() * 20 - 10;
            let randY = spaceshipMesh.position.y + Math.random() * 10;
            let randZ = spaceshipMesh.position.z + Math.random() * 10;
            let randRadius = Math.random() * 10;
            let randRotate = 1.5 - Math.random() * 3;

            let worldObject={
                "url":trackUrl,
                "name":presetJson.name,
                "creator":aqa.nickname,
                "mesh":randomMesh(),
                "x":randX,
                "y":randY,
                "z":randZ,
                "follow": false,
                "angleX": 0,
                "angleY": 0,
                "angleZ": 0,
                "radiusL": randRadius,
                "radiusF": randRadius,
                "radiusR": randRadius,
                "radiusB": randRadius,
                "rotate": randRotate };

            // a copy of worldObject is passed to the newSoundMesh function
            let soundMesh = newSoundMesh(Object.create(worldObject));

            sendTrackList(worldObject);

            var xmlhttp = new XMLHttpRequest();
            xmlhttp.addEventListener("load", function() {
                console.log("sendTrackList response " + this.response);
            });

            xmlhttp.open("POST", aqa.baseUrl + "api/worldObjects");
            xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xmlhttp.send(JSON.stringify(worldObject));

        }
    });

    oReq.open("GET", aqa.baseUrl + "clipgen"
    + "?id=" + queryId
    + "&tempo=" + aqa.tempo
    + "&chords=" + aqa.chords
    + "&minOctave=" + aqa.htmlGui.select_min_octave.value
    + "&maxOctave=" + aqa.htmlGui.select_max_octave.value
    + "&sf2file=" + encodeURIComponent(sf2File)
    + "&presetNr=" + encodeURIComponent(presetJson.nr)
    + "&presetName=" + encodeURIComponent(presetJson.name)
    + "&presetBank=" + encodeURIComponent(presetJson.bank)
    + "&beatsPerChord=" + aqa.beatsPerChord
    + "&quantize=" + quantize_real
    + "&steps=" + aqa.htmlGui.steps()
    + "&worldId=" + aqa.worldId);

    oReq.send();

    incLoadingTarget();
};

export function initWorldObjectAnimation() {
    aqa.scene.onBeforeRenderObservable.add(() => {
        try {
            worldObjects.forEach((worldObject, i) => {
                const frequencies = worldObject.bus.analyzer.getByteFrequencyData();
                worldObject.soundMesh.updateFreqs(frequencies);

                if(worldObject.follow===true) {
                    worldObject.rootMesh.position.x=spaceshipMesh.position.x;
                    worldObject.rootMesh.position.y=spaceshipMesh.position.y;
                    worldObject.rootMesh.position.z=spaceshipMesh.position.z;
                }

                worldObject.mesh.position.z=worldObject.radiusL;
                worldObject.rootMesh.rotation.x=worldObject.angleX;
                worldObject.rootMesh.rotation.y=aqa.audioEngine.currentTime*worldObject.rotate+worldObject.angleY;
                worldObject.rootMesh.rotation.z=worldObject.angleZ;

            });
        } catch(err) {
            console.log("Analyzer error:" + err);
        }
    });
}

export function updateLabels() {
    worldObjects.forEach((object, i) => {
        let objectTime = object.track.currentTime.toFixed(2);
        if(objectTime<0) {
            object.label.text = object.labelBaseText + "\nstart in " + objectTime + " s";
            object.label.color = "Orange";
        } else {
            object.label.text = object.labelBaseText;
            object.label.color = "White";
        }
    });
}
