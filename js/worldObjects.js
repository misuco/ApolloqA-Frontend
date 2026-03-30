import { aqa } from "./apolloqa.js"
import { startSyncTrack } from "./syncTrack.js"
import { sendTrackList } from "./multiuser-ws.js"
import { initCamera, spaceshipMesh } from "./camera.js"

export let worldObjects = new Map();

let labels = null;
let soundMeshes = [];

class SoundMesh {
    constructor(name,parentMesh,objPath) {
        console.log("new SoundMesh "+name);
        this.parent = parentMesh;
        this.importMesh(objPath);
    }
    updateFreqs(freqs) {
        if(this.m) {
            let scaling=0;
            for (let i = 0; i < 16; i++) {
                scaling=Math.max(scaling,freqs[i]);
            }
            scaling=scaling/10000;
            this.m.scaling.x=scaling;
            this.m.scaling.y=scaling;
            this.m.scaling.z=scaling;
        }
    }
    async importMesh(objPath) {
        let result = await BABYLON.ImportMeshAsync(
            objPath,
            aqa.scene
        )
        this.m = result.meshes[0];
        this.m.parent = this.parent;
    }
};
soundMeshes["SoundMesh"]=SoundMesh;

class SoundMesh2 {
    constructor(name,mesh) {
        console.log("new SoundMesh "+name);
        this.m=[];
        for(let i=0;i<17;i++) {
            this.m[i] = BABYLON.MeshBuilder.CreateSphere(name, {
              diameter: 0.5
          }, aqa.scene);
            /*
            this.m[i].position.x=i%4-1.5;
            this.m[i].position.z=Math.floor(i/4)-1.5;
            this.m[i].parent=mesh;
            */
        }
        this.m[0].position.x=0;
        this.m[0].position.z=0
        this.m[0].parent=mesh;
        for(let i=0;i<4;i++) {
            let j=i*0.5;
            this.m[i*4+1].position.x=j;
            this.m[i*4+1].position.y=j;
            this.m[i*4+1].parent=mesh;

            this.m[i*4+2].position.x=-j;
            this.m[i*4+2].position.y=j;
            this.m[i*4+2].parent=mesh;

            this.m[i*4+3].position.x=j;
            this.m[i*4+3].position.y=-j;
            this.m[i*4+3].parent=mesh;

            this.m[i*4+4].position.x=-j;
            this.m[i*4+4].position.y=-j;
            this.m[i*4+4].parent=mesh;
        }
    }
    updateFreqs(freqs) {
        for (let i = 0; i < 17; i++) {
            this.m[i].scaling.y=freqs[i]/64;
        }
    }
};
soundMeshes["SoundMesh2"]=SoundMesh2;

class BarSpectrum {
    constructor(name,mesh) {
        console.log("new SoundMesh "+name);

        const myMaterial = new BABYLON.StandardMaterial("myMaterial", aqa.scene);

        myMaterial.specularColor = new BABYLON.Color3(0.6, 1.0, 0.6);
        myMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);

        mesh.material = myMaterial;

        this.m=[];
        for(let i=0;i<16;i++) {
            this.m[i] = BABYLON.MeshBuilder.CreateBox(name, {
              height: 0.3, width: 0.3, depth: 0.3
          }, aqa.scene);

            this.m[i].material = myMaterial;

            this.m[i].position.x=i*0.5-4;
            this.m[i].parent=mesh;
        }
    }
    updateFreqs(freqs) {
        for (let i = 0; i < 16; i++) {
            this.m[i].scaling.y=freqs[i]/8;
        }
    }
};
soundMeshes["BarSpectrum"]=BarSpectrum;

let objSelect=1;
let objectCount=0;

export function newSoundMesh(x,y,z,trackUrl,presetName) {
    console.log("newSoundMesh "+trackUrl+" "+presetName);

    let worldObject = {};
    worldObject.url=trackUrl;


    let mesh = new BABYLON.TransformNode();

    /*
    let objPath="obj/Logo-A_00"+objSelect+".obj";
    objSelect++; if(objSelect>3) {objSelect=1;}
    let soundMesh = new soundMeshes["SoundMesh"]("mesh_"+trackUrl,mesh,objPath);
    */

    let soundMesh = new soundMeshes["BarSpectrum"]("mesh_"+trackUrl,mesh);

    mesh.position.x=x;
    mesh.position.y=y;
    mesh.position.z=z;

    worldObject.mesh = mesh;
    worldObject.soundMesh = soundMesh;

    BABYLON.CreateSoundAsync("sound_"+trackUrl, trackUrl, {
        spatialEnabled: true,
        spatialMaxDistance: 100
    }).then(track => {
        startSyncTrack();
        const currentTime = track.engine.currentTime; // s
        const loopLen = aqa.beatTime * aqa.beatsPerChord * aqa.chordsLen;
        const loopNumber = Math.floor(currentTime / loopLen);
        const nextLoopTime = (loopNumber + 1) * loopLen;
        const waitTime = nextLoopTime - currentTime;
        console.log("track ready "+ trackUrl + " at " + currentTime + " next loop " + nextLoopTime + " wait " + waitTime );
        track.spatial.attach(worldObject.mesh);
        track.play({
            loop: true,
            waitTime: waitTime
        });
        worldObject.track=track;

        BABYLON.CreateAudioBusAsync("analyzer_" + trackUrl, {
            analyzerEnabled: true
        }).then(bus => {
            bus.analyzer.fftSize=64;
            worldObject.bus = bus;
            worldObject.track.outBus=worldObject.bus;
            console.log("analyzer bus ready: " + trackUrl);

            worldObjects.set(trackUrl,worldObject);
        }).catch(err => {
            console.error("cannot analyze sound:" + trackUrl + " " + err);
        });

    }).catch(err => {
        console.error("cannot play sound:" + trackUrl + " " + err);
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
        worldObject.labelBaseText = objectCount + " : " + presetName;
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
            let soundMesh = newSoundMesh(randX,randY,randZ,trackUrl,presetJson.name);

            let worldObject={"url":trackUrl,"name":presetJson.name,"creator":aqa.nickname,"x":randX,"y":randY,"z":randZ};
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
};

export function initWorldObjectAnimation() {
    aqa.scene.onBeforeRenderObservable.add(() => {
        try {
            worldObjects.forEach((worldObject, i) => {
                const frequencies = worldObject.bus.analyzer.getByteFrequencyData();
                worldObject.soundMesh.updateFreqs(frequencies);
                //worldObject.mesh.rotation.y=aqa.audioEngine.currentTime;
                //worldObject.mesh.rotation.z=aqa.audioEngine.currentTime;
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
