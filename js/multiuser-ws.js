/// Multiuser Websocket Feature
var allUsers;
let messageCount=0;

function initMultiuser() {
    console.log("Connecting ws to "+aqa.wsUrl)
    aqa.ws = new WebSocket(aqa.wsUrl);

    // Handle errors
    aqa.ws.onerror = (error) => {
        console.log("WS Error "+error);
    };

    // Connection opened
    aqa.ws.onopen = () => {
        console.log("Connected to server");
    };

    // Listen for messages
    aqa.ws.onmessage = (event) => {

        //console.log("onmessage");
        messageCount++;
        aqa.htmlGui.updateNetStatus(messageCount);

        const m=JSON.parse(event.data);

        if(m.trackList) {
            console.log("onmessage: tracklist "+m.trackList);
            if(m.worldId!==aqa.worldId) {
                let list = m.trackList;
                console.log("get other user tracklist "+list);
                list.forEach((track, i) => {
                    let trackUrl=track[0];
                    if(aqa.worldObjects.has(trackUrl)) {
                        console.log("existing trackUrl "+trackUrl);
                    } else {
                        console.log("new trackUrl "+trackUrl);
                        let t=track[1];
                        let soundMesh = newSoundMesh(t.x,t.y,t.z,t.trackUrl,t.trackName);
                    }
                });
            }
            sendPosition();
            return;
        }

        allUsers = new Map(m);
        let iOtherUser=0;

        allUsers.forEach((value, key) => {
            if(key==aqa.sessionId) {
                return;
            }

            let otherUser=aqa.otherUsers.get(key);

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
                aqa.otherUsers.set(key,{});

                let spaceshipUrl=aqa.avatarUrl(value.avatarId);

                SceneLoader.ImportMeshAsync(
                  null,
                  spaceshipUrl,
                  null,
                  scene
                ).then(({ meshes }) => {
                  console.log("New user created "+value.nickname+" "+key);
                  scene.stopAllAnimations();
                  const newUser = meshes[0];
                  newUser.position.x = value.x;
                  newUser.position.y = value.y;
                  newUser.position.z = value.z;
                  newUser.rotation = new BABYLON.Vector3(value.rx,value.ry,value.rz);

                  aqa.otherUsers.set(key,newUser);
                  aqa.htmlGui.setNetSessionEntry(key,value.nickname);
                });
            }
        });
        sendPosition();
    };

    // Handle connection close
    aqa.ws.onclose = () => {
        console.log("DISConnected from server");
    };

    setTimeout(removeInactiveClients, 1000);

}

// Send own position to web socket server
function sendPosition() {
    if(aqa.spaceshipMesh) {
        let rq=aqa.spaceshipMesh.rotationQuaternion.toEulerAngles();
        let x = aqa.spaceshipMesh.position.x;
        let y = aqa.spaceshipMesh.position.y;
        let z = aqa.spaceshipMesh.position.z;
        let message=JSON.stringify(
            {"sessionId":aqa.sessionId,
            "nickname":aqa.nickname,
            "x":x,"y":y,"z":z,
            "rx":rq.x,"ry":rq.y,"rz":rq.z,
            "avatarId":aqa.avatarId
            }
        );
        aqa.ws.send(message);
    } else {
        aqa.ws.send("{}");
    }
}

function sendTrackList(list) {
    let message=JSON.stringify({"worldId":aqa.worldId,"sessionId":aqa.sessionId,"trackList":[list]});
    //console.log("sendTrackList "+message);
    aqa.ws.send(message);
}

function removeInactiveClients() {
    //console.log("removeInactiveClients")
    aqa.otherUsers.forEach((value, key) => {
        //console.log("- "+key);
        let otherUser=allUsers.get(key);
        if(!otherUser) {
            console.log("-> removeInactiveClient "+key);
            value.dispose();
            aqa.otherUsers.delete(key);
            aqa.htmlGui.deleteNetSessionEntry(key);
        }
    });
    setTimeout(removeInactiveClients, 1000);
}
