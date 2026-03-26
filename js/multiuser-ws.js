/// Multiuser Websocket Feature
import { aqa } from "./apolloqa.js"
import { worldObjects, newSoundMesh } from "./worldObjects.js"
import { spaceshipMesh } from "./camera.js"

var allUsers;
let messageCount=0;
let otherUsers = new Map();
let ws = null;
let wsUrl = window.location==="apolloqa.net" ?
            "wss://ws.apolloqa.net/" :
            "ws://"+window.location.hostname+":3038/"

export function initMultiuser() {
    console.log("Connecting ws to "+wsUrl)
    ws = new WebSocket(wsUrl);

    // Handle errors
    ws.onerror = (error) => {
        console.log("WS Error "+error);
    };

    // Connection opened
    ws.onopen = () => {
        console.log("Connected to server");
    };

    // Listen for messages
    ws.onmessage = (event) => {

        //console.log("onmessage");
        messageCount++;
        aqa.htmlGui.updateNetStatus(messageCount);

        const m=JSON.parse(event.data);

        if(m.trackList) {
            console.log("onmessage: tracklist "+m.trackList);
            if( m.worldId===aqa.worldId ) {
                let list = m.trackList;
                console.log("get other user tracklist "+list);
                list.forEach((track, i) => {
                    if(track) {
                        let trackUrl=track.url;
                        if(worldObjects.has(trackUrl)) {
                            console.log("existing trackUrl "+trackUrl);
                        } else {
                            console.log("new trackUrl "+trackUrl);
                            let t=track;
                            let soundMesh = newSoundMesh(t.x,t.y,t.z,t.url,t.name);
                        }
                    } else {
                        console.log("NULL track in list");
                    }
                });
            }
            return;
        }

        if(m.chords) {
            console.log("onmessage: chords "+m.chords);
            aqa.chords=m.chords;
            aqa.cycleLen=m.cycleLen;
            aqa.chordsLen=m.chordsLen;
            aqa.tempo=m.tempo;
            aqa.beatTime=60/aqa.tempo;
            aqa.htmlGui.updateHeader();
            return;
        }

        allUsers = new Map(m);
        let iOtherUser=0;

        allUsers.forEach((value, key) => {
            if(key==aqa.sessionId) {
                return;
            }

            let otherUser=otherUsers.get(key);

            if(otherUser) {
                if(otherUser.position) {
                    otherUser.position.x = value.x;
                    otherUser.position.y = value.y;
                    otherUser.position.z = value.z;
                    otherUser.rotation.x = value.rx;
                    otherUser.rotation.y = value.ry;
                    otherUser.rotation.z = value.rz;
                }
            } else {
                if(value.worldId==aqa.worldId) {
                    otherUsers.set(key,{});

                    let spaceshipUrl=aqa.avatarUrl(value.avatarId);

                    BABYLON.SceneLoader.ImportMeshAsync(
                      null,
                      spaceshipUrl,
                      null,
                      aqa.scene
                    ).then(({ meshes }) => {
                      console.log("New user created "+value.nickname+" "+key);
                      aqa.scene.stopAllAnimations();
                      const newUser = meshes[0];
                      newUser.position.x = value.x;
                      newUser.position.y = value.y;
                      newUser.position.z = value.z;
                      newUser.rotation = new BABYLON.Vector3(value.rx,value.ry,value.rz);

                      otherUsers.set(key,newUser);
                      aqa.htmlGui.setNetSessionEntry(key,value.nickname);
                    });
                } else {
                    //console.log("ship from another world "+value.worldId);
                }
            }
        });
        sendPosition();
    };

    // Handle connection close
    ws.onclose = () => {
        console.log("DISConnected from server");
    };

    setTimeout(removeInactiveClients, 1000);

}

// Send own position to web socket server
function sendPosition() {
    if(spaceshipMesh) {
        let rq = spaceshipMesh.rotationQuaternion.toEulerAngles();
        let x = spaceshipMesh.position.x;
        let y = spaceshipMesh.position.y;
        let z = spaceshipMesh.position.z;
        let message=JSON.stringify(
            {
                "sessionId":aqa.sessionId,
                "worldId":aqa.worldId,
                "nickname":aqa.nickname,
                "x":x,"y":y,"z":z,
                "rx":rq.x,"ry":rq.y,"rz":rq.z,
                "avatarId":aqa.avatarId
            }
        );
        ws.send(message);
    } else {
        ws.send("{}");
    }
}

export function sendTrackList(list) {
    let message=JSON.stringify({"worldId":aqa.worldId,"sessionId":aqa.sessionId,"trackList":[list]});
    //console.log("sendTrackList "+message);
    ws.send(message);
}

export function sendWorldConfig(obj) {
    let message=JSON.stringify(obj);
    ws.send(message);
}

function removeInactiveClients() {
    //console.log("removeInactiveClients")
    otherUsers.forEach((value, key) => {
        //console.log("- "+key);
        let otherUser=allUsers.get(key);
        if(!otherUser) {
            console.log("-> removeInactiveClient "+key);
            value.dispose();
            otherUsers.delete(key);
            aqa.htmlGui.deleteNetSessionEntry(key);
        }
    });
    setTimeout(removeInactiveClients, 1000);
}
