import { aqa } from "./apolloqa.js"

export let soundMeshes = [];
export function randomMesh() {
    let randMeshNr = Math.random() * 4;
    let randMesh = randMeshNr>3 ? "SphereSoundMesh" :
    randMeshNr>2 ? "SoundMesh" :
    randMeshNr>1 ? "SoundMesh2" : "BarSpectrum";
    console.log("randMeshNr "+randMeshNr+" randMesh "+randMesh);
    return randMesh;
}

class SphereSoundMesh {
    constructor(name,parentMesh,objPath) {
        console.log("new SphereSoundMesh "+name);
        this.sphere = BABYLON.MeshBuilder.CreateSphere(name, {
          diameter: 0.2
        }, aqa.scene);
        this.sphere.parent=parentMesh;
    }

    updateFreqs(freqs) {
        let scaling=0;
        for (let i = 0; i < 16; i++) {
            scaling=Math.max(scaling,freqs[i]);
        }
        scaling=scaling/9;
        this.sphere.scaling.x=scaling;
        this.sphere.scaling.y=scaling;
        this.sphere.scaling.z=scaling;
    }
};

soundMeshes["SphereSoundMesh"]=SphereSoundMesh;

class ObjSoundMesh {
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

class SoundMeshObj1 extends ObjSoundMesh {
    constructor(name,parentMesh) {
        super(name,parentMesh,"obj/Logo-A_001.obj");
    }
}

class SoundMeshObj2 extends ObjSoundMesh {
    constructor(name,parentMesh) {
        super(name,parentMesh,"obj/Logo-A_002.obj");
    }
}

soundMeshes["SoundMesh"]=SoundMeshObj1;

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
            let j=i*1;

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
            this.m[i].scaling.x=freqs[i]/32;
            this.m[i].scaling.y=freqs[i]/32;
            this.m[i].scaling.z=freqs[i]/32;
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
