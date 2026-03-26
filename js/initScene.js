/*

ApolloqA - Sound Co-Lab

Sound generator:
by c1Audio

3D World:
Based on series of articles at https://medium.com/@joelmalone
and GFX by https://quaternius.com/packs/ultimatespacekit.html

*/
import { aqa } from "./apolloqa.js"
import { initStarfield } from "./starfield.js"
import { initGround } from "./ground.js"
import { initCamera, spaceshipMesh } from "./camera.js"
import { initMediaRecorder } from "./audiorec.js"
import { aqa_menu } from "./htmlGui.js"
import { aqa_menu_start } from "./htmlGuiStart.js"
import { initMultiuser } from "./multiuser-ws.js"
import { initWorldObjectAnimation } from "./worldObjects.js"

const {
  DirectionalLight,
  Engine,
  Scene,
  Vector3
} = BABYLON;

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
    aqa.engine = new Engine(aqa.canvas, true);

    // Create a BabylonJS scene
    let scene = new Scene(aqa.engine);
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
    const sunLight = new DirectionalLight("sun light", new Vector3(1, -1, -1));
    sunLight.intensity = 5;

    /*
    scene.debugLayer.show({
      embedMode: true,
    });
    */

    aqa.audioEngine = await BABYLON.CreateAudioEngineAsync({
        volume: 0.9,
        listenerAutoUpdate: true,
        listenerEnabled: true,
        resumeOnInteraction: true
    });
    console.log("audioEngine ready")

    return scene;
}

async function boot() {
    console.log("boot: createScene");
    aqa.scene = await createScene();
    //console.log("boot: initColors");
    //initColors();
    console.log("boot: initCamera");

    console.log("boot: initStarfield");
    initStarfield();

    console.log("boot: initGround");
    initGround();

    await initCamera();
    aqa.audioEngine.listener.attach(spaceshipMesh);

    console.log("boot: initMediaRecorder");
    initMediaRecorder();

    aqa.htmlGui=new aqa_menu();
    aqa.htmlGui.updateHeader();
    aqa.htmlGuiStart=new aqa_menu_start();

    console.log("boot: initMultiuser");
    initMultiuser();

    console.log("boot: initWorldObjectAnimation");
    initWorldObjectAnimation()

    console.log("boot: runRenderLoop");
    // Start a render loop
    // - basically, this will instruct BabylonJS to continuously re-render the scene
    aqa.engine.runRenderLoop(() => {
        aqa.scene.render();
    });
}

boot();
