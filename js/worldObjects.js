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
            scene
        )
        this.m = result.meshes[0];
        this.m.parent = this.parent;
    }
};
aqa.SoundMeshes["SoundMesh"]=SoundMesh;

class SoundMesh2 {
    constructor(name,mesh) {
        console.log("new SoundMesh "+name);
        this.m=[];
        for(let i=0;i<17;i++) {
            this.m[i] = BABYLON.MeshBuilder.CreateSphere(name, {
              diameter: 0.5
            }, scene);
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
            this.m[i*4+1].position.x=i;
            this.m[i*4+1].position.z=i;
            this.m[i*4+1].parent=mesh;

            this.m[i*4+2].position.x=-i;
            this.m[i*4+2].position.z=i;
            this.m[i*4+2].parent=mesh;

            this.m[i*4+3].position.x=i;
            this.m[i*4+3].position.z=-i;
            this.m[i*4+3].parent=mesh;

            this.m[i*4+4].position.x=-i;
            this.m[i*4+4].position.z=-i;
            this.m[i*4+4].parent=mesh;
        }
    }
    updateFreqs(freqs) {
        for (let i = 0; i < 17; i++) {
            this.m[i].scaling.y=freqs[i]/64;
        }
    }
};
aqa.SoundMeshes["SoundMesh2"]=SoundMesh2;

let objSelect=1;
function newSoundMesh(x,y,z,trackUrl,presetName) {
    console.log("newSoundMesh "+trackUrl+" "+presetName);

    let worldObject = {};
    worldObject.trackUrl=trackUrl;


    let mesh = new BABYLON.TransformNode();
    let objPath="obj/Logo-A_00"+objSelect+".obj";
    objSelect++; if(objSelect>3) {objSelect=1;}
    //let soundMesh = new SoundMesh("mesh_"+trackUrl,mesh,objPath,);
    let soundMesh = new aqa.SoundMeshes["SoundMesh2"]("mesh_"+trackUrl,mesh,objPath);

    mesh.position.x=x;
    mesh.position.y=y;
    mesh.position.z=z;

    worldObject.mesh = mesh;
    worldObject.soundMesh = soundMesh;

    BABYLON.CreateSoundAsync("sound_"+trackUrl, trackUrl, {
        spatialEnabled: true,
        spatialMaxDistance: 100
    }).then(track => {
        const currentTime = track.engine.currentTime;
        const nextCycleTime = (Math.floor(currentTime / (aqa.cycleTime * 8)) + 1)*aqa.cycleTime*8
        const waitTime = nextCycleTime - currentTime;
        console.log("track ready "+ trackUrl + " at " + currentTime + " next cycle " + nextCycleTime + " wait " + waitTime );
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

            aqa.worldObjects.set(trackUrl,worldObject);
        }).catch(err => {
            console.error("cannot analyze sound:" + trackUrl + " " + err);
        });

    }).catch(err => {
        console.error("cannot play sound:" + trackUrl + " " + err);
    });


    if(!aqa.labels) {
        aqa.labels = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        aqa.labels.useInvalidateRectOptimization = false;
    }

    let rect1 = new BABYLON.GUI.Button();
        aqa.labels.addControl(rect1);
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
        text1.text = objectCount + " : " + presetName;
        objectCount++
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

function generateNewSound() {
    let quantize_selected = aqa.htmlGui.quantize(0);
    let quantize_real = Math.pow(2,quantize_selected);

    let len_selected = aqa.htmlGui.len();
    let len_real = Math.pow(2,len_selected);

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
            let randX = aqa.spaceshipMesh.position.x + Math.random() * 20 - 10;
            let randY = aqa.spaceshipMesh.position.y + Math.random() * 10;
            let randZ = aqa.spaceshipMesh.position.z + Math.random() * 10;
            let soundMesh = newSoundMesh(randX,randY,randZ,trackUrl,presetJson.name);
            let trackList=[trackUrl,{"x":randX,"y":randY,"z":randZ,"trackUrl":trackUrl,"trackName":presetJson.name,"creator":aqa.nickname}];
            sendTrackList(trackList);
        }
    });

    oReq.open("GET", aqa.baseUrl + "clipgen"
    + "?id=" + queryId
    + "&tempo=" + aqa.tempo
    + "&chords=" + aqa.htmlGui.chords
    + "&sf2file=" + encodeURIComponent(sf2File)
    + "&presetNr=" + encodeURIComponent(presetJson.nr)
    + "&presetName=" + encodeURIComponent(presetJson.name)
    + "&presetBank=" + encodeURIComponent(presetJson.bank)
    + "&len=" + len_real
    + "&quantize=" + quantize_real
    + "&density=" + aqa.htmlGui.density(0)
    + "&steps=" + aqa.htmlGui.steps()
    + "&sessionId=" + aqa.sessionId);

    oReq.send();
};


function initWorldObjectAnimation() {
    scene.onBeforeRenderObservable.add(() => {
        const uptimeS = (Date.now()-aqa.startTime)/1000;
        try {
            aqa.worldObjects.forEach((worldObject, i) => {
                const frequencies = worldObject.bus.analyzer.getByteFrequencyData();
                worldObject.soundMesh.updateFreqs(frequencies);
                worldObject.mesh.rotation.y=uptimeS;
                //worldObject.mesh.rotation.z=uptimeS;
            });
        } catch(err) {
            console.log("Analyzer error:" + err);
        }
    });
}
