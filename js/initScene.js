import { aqa } from "./apolloqa.js"
import { getCookie, setCookie } from "./cookies.js"
import { initStarfield } from "./starfield.js"
import { initGround } from "./ground.js"
import { initCamera, spaceshipMesh } from "./camera.js"
import { aqa_menu } from "./htmlGui.js"
import { aqa_menu_start } from "./htmlGuiStart.js"
import { initMultiuser } from "./multiuser-ws.js"
import { initWorldObjectAnimation } from "./worldObjects.js"
import { NeumorphismLoginForm } from "./login.js"

export async function initAudio() {
    aqa.audioEngine = await BABYLON.CreateAudioEngineAsync({
        volume: 0.9,
        listenerAutoUpdate: true,
        listenerEnabled: true,
        resumeOnInteraction: true
    });

    aqa.audioEngine.listener.attach(spaceshipMesh);

    console.log("boot: initMultiuser");
    initMultiuser();

    console.log("boot: initWorldObjectAnimation");
    initWorldObjectAnimation()

    console.log("audioEngine ready")
}

// Bind to the window's resize DOM event, so that we can update the <canvas> dimensions to match;
// this is needed because the <canvas> render context doesn't automaticaly update itself
const onWindowResize = () => {
  aqa.canvas.width = aqa.canvas.clientWidth;
  aqa.canvas.height = aqa.canvas.clientHeight;
};
// You can see the problem if you disable this next line, and then resize the window - the scene will become pixelated
window.addEventListener("resize", onWindowResize);

async function createScene() {
    // Create a BabylonJS engine
    aqa.engine = new BABYLON.Engine(aqa.canvas, true);

    // Create a BabylonJS scene
    let scene = new BABYLON.Scene(aqa.engine);
    // And also, let's set the scene's "clear colour" to black
    scene.clearColor = "green";

    // Create an ambient light with low intensity, so the dark parts of the scene aren't pitch black
    var ambientLight = new BABYLON.HemisphericLight(
      "ambient light",
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    ambientLight.intensity = 0.25;

    // Create a light to simulate the sun's light
    const sunLight = new BABYLON.DirectionalLight("sun light", new BABYLON.Vector3(1, -1, -1));
    sunLight.intensity = 5;

    return scene;
}

async function boot() {
    let display_boot_status = document.querySelector("#startAudioButton");

    aqa.htmlGui=new aqa_menu();
    aqa.htmlGuiStart=new aqa_menu_start();
    aqa.login=new NeumorphismLoginForm();

    if(aqa.worldId==="") {
        initMultiuser();
        aqa.htmlGuiStart.start_overlay.hidden=true;
        aqa.htmlGui.div_session.hidden=false;
    } else {
        display_boot_status.innerHTML="Loading scene";
        aqa.scene = await createScene();

        display_boot_status.innerHTML="Loading starfield";
        initStarfield();

        display_boot_status.innerHTML="Loading ground";
        initGround();

        display_boot_status.innerHTML="Loading camera";
        await initCamera();

        display_boot_status.innerHTML="Start render Loop";

        aqa.htmlGui.updateHeader();
        aqa.htmlGui.menu_main_button.hidden = false;
        aqa.htmlGui.menu_navi_button.hidden = false;
        aqa.htmlGui.toggleMenu();

        aqa.engine.runRenderLoop(() => {
            aqa.scene.render();
        });

        display_boot_status.innerHTML="System ready:<br/>click to connect";
    }
}

aqa.worldId = window.location.search.substr(1);
aqa.nickname = getCookie("nickname");

if (!aqa.worldId && !aqa.nickname) {
    setCookie("nickname", "-", 10);
    window.location = aqa.mainPageUrl;
}

if (!aqa.nickname) {
    aqa.nickname = "GUEST";
}

document.addEventListener('DOMContentLoaded', () => {
    boot();
});
