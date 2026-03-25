export const aqa={};

aqa.uuidv4 = function() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

aqa.getRandomInt = function(max) {
    return Math.floor(Math.random() * max);
}

// url
aqa.windowUrl = window.location;

aqa.htmlGui={};     // guiHtml.js
aqa.sessionId = aqa.uuidv4();

if(worldIdHash) {
    aqa.worldId = worldIdHash.replace("#","");
} else {
    aqa.worldId = aqa.uuidv4();
    aqa.windowUrl.hash = aqa.worldId;
    window.location.href = aqa.windowUrl;
}

// syncTrack.js
aqa.labels=null;

// initScene.js, syncTrack.js
aqa.audioEngine = null;
aqa.instruments=[];

aqa.canvas = null;
aqa.engine = null;
aqa.scene = null;

// camera.js
aqa.spaceshipMesh = null;
aqa.chaseCameraPosition = null;
aqa.chaseCameraLookAt = null;
aqa.mouseState = null;
aqa.speed = 0;

// multiuser-ws.js
aqa.ws = null;
aqa.otherUsers = new Map();
aqa.wsUrl = "ws://"+aqa.windowUrl.hostname+":3038/"
//aqa.wsUrl = "wss://ws.apolloqa.net/"

// syncTrack.js / htmlGui Header
aqa.syncTrackRunning = false;
aqa.engineTime = 0;

// worldObjects.js
aqa.worldObjects = new Map();
aqa.SoundMeshes = [];

aqa.nickname=nickname;

aqa.tempo=120;
aqa.beatTime=60/aqa.tempo;
aqa.cycleLen=4;
aqa.chords="C_D_E_F";
aqa.chordsLen=4;

aqa.baseUrl = aqa.windowUrl.protocol + "//" + aqa.windowUrl.host + "/";

aqa.avatarId=aqa.getRandomInt(4);
aqa.avatarUrl=function(id) {
    switch(id) {
        case 0:
            return "obj/Spaceship_FinnTheFrog.gltf";
            break;
        case 1:
            return "obj/Spaceship_FernandoTheFlamingo.gltf";
            break;
        case 2:
            return "obj/Spaceship_BarbaraTheBee.gltf";
            break;
        default:
            return "obj/Spaceship_RaeTheRedPanda.gltf";
            break;
    }
}
