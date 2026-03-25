import { aqa } from "./apolloqa.js"

export function initGround() {
    try {
        //var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground",
        //"js/groundMap.png", 1000, 1000, 1000, 0, 10, aqa.scene, false);

        var ground = BABYLON.MeshBuilder.CreateGround("ground", {height:10000,subdivisions:1000,subdivisionsX:1000,subdivisionsY:1000,updatable:true,width:10000}, aqa.scene);
        ground.material = new BABYLON.GridMaterial("groundMaterial", aqa.scene);
        ground.material.minorUnitVisibility=false;
    } catch(err) {
        console.log("Ground error:" + err);
    }
}
