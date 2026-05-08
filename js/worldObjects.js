import { aqa } from "./apolloqa.js"
import { soundMeshes, randomMesh } from "./worldObjectsMeshes.js"
import { startSyncTrack } from "./syncTrack.js"
import { sendTrackList, loadingTarget, loadingCount, updateLoadingProgress, resetLoadingProgress, incLoadingTarget } from "./multiuser-ws.js"
import { initCamera, spaceshipMesh } from "./camera.js"

export let worldObjects = new Map();

let labels = null;

let objSelect=1;
let objectCount=0;

export function newSoundMesh(t) {
    console.log("newSoundMesh "+t.url+" "+t.name);

    let worldObject = t;

    let rootMesh = new BABYLON.TransformNode();
    let mesh = new BABYLON.TransformNode();
    mesh.parent = rootMesh;

    let soundMesh = new soundMeshes[t.mesh]("mesh_"+t.url,mesh);

    rootMesh.position.x=t.x;
    rootMesh.position.y=t.y;
    rootMesh.position.z=t.z;

    worldObject.mesh = mesh;
    worldObject.rootMesh = rootMesh;
    worldObject.soundMesh = soundMesh;

    BABYLON.CreateSoundAsync("sound_"+t.url, t.url, {
        spatialEnabled: true,
        spatialMaxDistance: 100
    }).then(track => {

        updateLoadingProgress(1);

        if(loadingCount>=loadingTarget) {
            aqa.htmlGuiDialog.dialog.hidden=true;
            resetLoadingProgress();
            startSyncTrack();
        }

        const currentTime = track.engine.currentTime; // s
        const loopLen = aqa.beatTime * aqa.beatsPerChord * aqa.chordsLen;
        const loopNumber = Math.floor(currentTime / loopLen);
        const nextLoopTime = (loopNumber + 1) * loopLen;
        const waitTime = nextLoopTime - currentTime;
        console.log("track ready "+ t.url + " at " + currentTime + " next loop " + nextLoopTime + " wait " + waitTime );

        track.spatial.attach(worldObject.mesh);
        track.play({
            loop: true,
            waitTime: waitTime
        });
        worldObject.track=track;

        BABYLON.CreateAudioBusAsync("analyzer_" + t.url, {
            analyzerEnabled: true
        }).then(bus => {
            bus.analyzer.fftSize=64;
            worldObject.bus = bus;
            worldObject.track.outBus=worldObject.bus;
            console.log("analyzer bus ready: " + t.url);

            worldObjects.set(t.url,worldObject);
        }).catch(err => {
            console.error("cannot analyze sound:" + t.url + " " + err);
        });

    }).catch(err => {
        console.error("cannot play sound:" + t.url + " " + err);
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
        worldObject.labelBaseText = objectCount + " : " + t.name;
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

}

export function generateNewSound() {
    let quantize_selected = aqa.htmlGui.quantize(0);
    let quantize_real = Math.pow(2,quantize_selected);

    let trackId=0;

    const sf2Nr = aqa.htmlGui.instrument(0);
    const sf2Json = aqa.instruments[sf2Nr];
    const sf2File = sf2Json.soundfont;
    const instrumentPresCount = sf2Json.presets.length;
    if(instrumentPresCount<=0) {
        console.log("Instrument preset count <=0");
        return;
    }

    const presetJson = sf2Json.presets[aqa.getRandomInt(instrumentPresCount-1)];
    const presetName = presetJson.name;

    console.log("presetJson.name " + presetJson.name + " presetJson.nr " + presetJson.nr + " presetJson.bank " + presetJson.bank);
    console.log("trigger new sound trackId " + trackId + " quantize " + quantize_selected + " " + quantize_real );

    var queryId = trackId + "_" + aqa.tempo + "_" + Date.now();

    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function() {
        if (this.response.includes("Error")) {
            console.log("server error!!!");
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
    aqa.htmlGuiDialog.dialog.hidden=false;

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
