import { aqa } from "./apolloqa.js"
import { sendWorldConfig } from "./multiuser-ws.js"
import { initAudio } from "./initScene.js"

export class aqa_menu_start {
    constructor() {

        this.chords_select = document.querySelector("#select_chords");
        this.chords_string = [];
        this.chords_len = [];

        this.display_bpm = document.querySelector("#display_bpm");
        this.range_bpm = document.querySelector("#range_bpm");
        this.range_bpm.addEventListener("input", (event) => this.updateBpmValue(event.target.value));

        this.inc_bpm = document.querySelector("#inc_bpm");
        this.inc_bpm.addEventListener("click", (event) => this.incBpmValue());

        this.dec_bpm = document.querySelector("#dec_bpm");
        this.dec_bpm.addEventListener("click", (event) => this.decBpmValue());

        this.tempo = 120;

        this.select_beats_per_chord = document.querySelector("#select_beats_per_chord");
        [ "1","2","4","8","16" ].forEach((label,n) => {
            let opt=document.createElement('option');
            opt.value=n;
            opt.innerHTML=label;
            this.select_beats_per_chord.appendChild(opt);
        });
        this.select_beats_per_chord.value=0;

        this.initChordsSelect();

        this.new_session_button = document.querySelector("#new_session");
        this.new_session_button.addEventListener("click", (event) => this.newSession());

        this.show_debug_layer=false;
        this.debug_layer_button = document.querySelector("#debug_layer_button");
        this.debug_layer_button.addEventListener("click", (event) => this.toggleDebugLayer());

        this.start_overlay = document.querySelector("#start_overlay");
        this.start_audio_button = document.querySelector("#startAudioButton");
        this.start_audio_button.addEventListener("click", (event) => {
            initAudio()
            this.start_overlay.hidden=true;
        });
    }

    initChordsSelect() {
        const chords = this.chords_select;
        const chords_string = this.chords_string;
        const chords_len = this.chords_len;
        const http_req = new XMLHttpRequest();
        http_req.addEventListener("load", function() {
            if (this.response) {
                const response_data=JSON.parse(this.response);
                response_data.forEach((chord,n) => {
                    let opt=document.createElement('option');
                    opt.value=n;
                    opt.innerHTML=chord.name;
                    chords_string[n]=chord.chords.trim().split(/\s+/).join("_");
                    chords_len[n]=chord.chords.trim().split(/\s+/).length;
                    chords.appendChild(opt);
                });
            } else {
                console.log("initChordsSelect server error!!!");
            }
        });
        console.log("initChordsSelect()");
        http_req.open("GET", aqa.baseUrl + "/data/chords.json");
        http_req.send();
    }

    incBpmValue() {
        const currentBpm=Number(this.display_bpm.textContent);
        if(currentBpm<240) {
            this.updateBpmValue(currentBpm+1);
        }
    }

    decBpmValue() {
        const currentBpm=Number(this.display_bpm.textContent);
        if(currentBpm>40) {
            this.updateBpmValue(currentBpm-1);
        }
    }

    updateBpmValue(newTempo) {
        console.log("updateBpmValue " + newTempo);
        this.tempo=newTempo;
        aqa.tempo=newTempo;
        aqa.beatTime=60/aqa.tempo;
        this.display_bpm.textContent=newTempo;
    }

    newSession() {
        aqa.worldId = aqa.aquid();
        aqa.chords=this.chords_string[this.chords_select.value];
        aqa.chordsLen=this.chords_len[this.chords_select.value];
        aqa.beatsPerChord=Math.pow(2,this.select_beats_per_chord.value);

        let worldConfig={
            "worldId":aqa.worldId,
            "tempo":this.tempo,
            "beatsPerChord":aqa.beatsPerChord,
            "chords":aqa.chords,
            "chordsLen":aqa.chordsLen,
            "creator":aqa.nickname
        };

        console.log("newSession "+JSON.stringify(worldConfig));
        sendWorldConfig(worldConfig);
        window.location.search = "?" + aqa.worldId;
    }

    toggleDebugLayer() {
        console.log("toggleDebugLayer");
        this.show_debug_layer=!this.show_debug_layer;
        if(this.show_debug_layer===true) {
            this.debug_layer_button.style.background="orange";
            aqa.scene.debugLayer.show({
              embedMode: true,
            });
        } else {
            this.debug_layer_button.style.background="#0088cc";
            aqa.scene.debugLayer.hide();
        }
    }
}
