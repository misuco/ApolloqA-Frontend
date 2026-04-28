/*

ApolloqA - Sound Co-Lab

Sound generator:
by c1Audio

3D World:
Based on series of articles at https://medium.com/@joelmalone
and GFX by https://quaternius.com/packs/ultimatespacekit.html

*/

// global application object to share common properties
export const aqa={};

aqa.aquid = function() {
    let charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from([0,0,0,0], () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

aqa.getRandomInt = function(max) {
    return Math.floor(Math.random() * max);
}

aqa.htmlGui={};
aqa.sessionId = uuidv4();

if(worldIdHash) {
    aqa.worldId = worldIdHash.replace("#","");
    console.log("Existing worldId: " + aqa.worldId);
} else {
    aqa.worldId = aqa.aquid();
    window.location.hash = aqa.worldId;
    console.log("New worldId: " + aqa.worldId);
}


// initScene.js, syncTrack.js
aqa.audioEngine = null;
aqa.instruments = [];

// Get a reference to the <canvas>
aqa.canvas = document.querySelector(".apolloqa");
aqa.engine = null;
aqa.scene = null;

aqa.nickname=nickname;

aqa.tempo=120;
aqa.beatTime=60/aqa.tempo;
aqa.beatsPerChord=4;
aqa.chords="C_D_E_F";
aqa.chordsLen=4;

aqa.baseUrl = window.location.protocol + "//" + window.location.host + "/";

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
