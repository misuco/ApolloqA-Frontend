import { aqa } from "./apolloqa.js"
import { tJitter, autoplay, beatNr, toggleAutoPlay } from "./syncTrack.js"
import { worldObjects, generateNewSound } from "./worldObjects.js"
import { chaseCameraPosition, setSpeed } from "./camera.js"
import { mediaRecorder, initMediaRecorder } from "./audiorec.js"

export class aqa_menu {
    constructor() {
        this.menu_hidden=true;

        this.display_header = document.querySelector("#display_header");
        this.display_chords = document.querySelector("#display_chords");
        this.display_net_status = document.querySelector("#display_net_status");
        this.display_net_status_loading = document.querySelector("#display_net_status_loading");
        this.display_progress = document.querySelector("#display_progress");

        this.range_speed = document.querySelector("#range_speed");
        this.range_speed.addEventListener("input", () => { setSpeed(event.target.value); });
        this.range_speed.value=0;
        setSpeed(0);

        this.range_camera = document.querySelector("#range_camera");
        this.range_camera.addEventListener("input", () => { chaseCameraPosition.position.z=event.target.value*-1;} );
        this.range_camera.value=50;

        this.menu_navi_button = document.querySelector("#menu_navi");
        this.div_navi = document.querySelector("#config_navi");
        this.menu_navi_button.addEventListener("click", () => {
            if(this.div_navi.hidden===false) {
                this.div_navi.hidden=true;
                this.menu_navi_button.style.background = "#7c70e0";
            } else {
                this.setDivsHidden(true);
                this.div_navi.hidden=false;
                this.menu_navi_button.style.background = "orange";
            }
        });

        this.menu_gen_button = document.querySelector("#menu_gen");
        this.div_step_sequencer = document.querySelector("#step_sequencer");
        this.div_gen = document.querySelector("#config_gen");
        this.menu_gen_button.addEventListener("click", () => {
            if(this.div_gen.hidden===false) {
                this.div_gen.hidden=true;
                this.div_step_sequencer.hidden=true;
                this.menu_gen_button.style.background = "#7c70e0";
            } else {
                this.setDivsHidden(true);
                this.div_gen.hidden=false;
                this.div_step_sequencer.hidden=false;
                this.menu_gen_button.style.background = "orange";
            }
        });

        this.menu_exit_button = document.querySelector("#menu_exit");
        this.div_session = document.querySelector("#config_session");
        this.menu_exit_button.addEventListener("click", () => {
            window.location = "menu";
        });

        this.menu_mic_button = document.querySelector("#menu_mic");
        this.div_mic = document.querySelector("#config_mic");
        this.menu_mic_button.addEventListener("click", () => {
            if(this.div_mic.hidden===false) {
                this.div_mic.hidden=true;
                this.menu_mic_button.style.background = "#7c70e0";
            } else {
                this.setDivsHidden(true);
                this.div_mic.hidden=false;
                this.menu_mic_button.style.background = "orange";
                if(mediaRecorder===null) {
                    console.log("initMediaRecorder");
                    initMediaRecorder();
                }
            }
        });

        this.menu_autoplay_button = document.querySelector("#menu_autoplay");
        this.menu_autoplay_button.onclick = function () {
            toggleAutoPlay();
            if(autoplay===true) {
                this.style.background = "orange";
            } else {
                this.style.background = "#7c70e0";
            }
        }

        this.menu_main_button = document.querySelector("#menu_main");
        this.menu_main_button.addEventListener("click", () => {this.toggleMenu()});

        // populate generator config selects

        // populate instrument select
        this.select_instrument = document.querySelector("#select_instrument");

        // populate quantize select
        this.select_quantize = document.querySelector("#select_quantize");
        [ "8","16","32","64" ].forEach((label,n) => {
            let opt=document.createElement('option');
            opt.value=n;
            opt.innerHTML=label;
            this.select_quantize.appendChild(opt);
        });
        this.select_quantize.value=0;

        // populate octave range selects
        this.select_min_octave = document.querySelector("#select_min_octave");
        this.select_max_octave = document.querySelector("#select_max_octave");
        [ "0","1","2","3","4","5","6","7","8","9" ].forEach((label,n) => {
            if(n<9) {
                let opt1=document.createElement('option');
                opt1.value=n;
                opt1.innerHTML=label;
                this.select_min_octave.appendChild(opt1);
            }
            if(n>0) {
                let opt2=document.createElement('option');
                opt2.value=n;
                opt2.innerHTML=label;
                this.select_max_octave.appendChild(opt2);
            }
        });

        this.select_min_octave.value=3;
        this.select_min_octave.addEventListener("change", (event) => {
            // shift max value if min value >=
            if(event.target.value>=this.select_max_octave.value) {
                this.select_max_octave.value=parseInt(this.select_min_octave.value)+1;
            }
        });

        this.select_max_octave.value=5;
        this.select_max_octave.addEventListener("change", (event) => {
            // shift min value if max value <=
            if(event.target.value<=this.select_min_octave.value) {
                this.select_min_octave.value=parseInt(this.select_max_octave.value)-1;
            }
        });

        this.initIntrumentSelect();

        this.sequencer_button = [];
        this.sequencer_step = [];
        for(let i=0;i<4;i++) {
            this.sequencer_step[i]=[];
            this.sequencer_button[i]=[];
            for(let j=0;j<8;j++) {
                this.sequencer_step[i][j] = false;
                console.log("#step_"+i+"_"+j);
                this.sequencer_button[i][j] = document.querySelector("#step_"+i+"_"+j);
                this.sequencer_button[i][j].style.background="#7c70e0";
                this.sequencer_button[i][j].addEventListener("click", () => {this.toggleStep(i,j)});
            }
        }

        this.toggleStep(0,0);
        this.toggleStep(1,1);
        this.toggleStep(2,2);
        this.toggleStep(3,3);
        this.toggleStep(0,4);
        this.toggleStep(1,5);
        this.toggleStep(2,6);
        this.toggleStep(3,7);

        this.calc_button = [];
        this.calc_button[0] = document.querySelector("#calc_button");

        this.calc_button[0].addEventListener("click", () => this.triggerCalc());

        this.netSessionMap = new Map();
        this.netSessionList = [];
        this.netSessionList[0] = document.querySelector("#netSession0");
        this.netSessionList[1] = document.querySelector("#netSession1");
        this.netSessionList[2] = document.querySelector("#netSession2");
        this.netSessionList[3] = document.querySelector("#netSession3");
        this.netSessionList[4] = document.querySelector("#netSession4");
    }

    toggleStep(i,j) {
        console.log("toggleStep "+i+" "+j);
        this.sequencer_step[i][j]=!this.sequencer_step[i][j];
        if(this.sequencer_step[i][j]===true) {
            this.sequencer_button[i][j].style.background="orange";
        } else {
            this.sequencer_button[i][j].style.background="#7c70e0";
        }
    }

    initIntrumentSelect() {
        const instruments = this.select_instrument;
        const http_req = new XMLHttpRequest();
        const preset_keywords = new Map();
        http_req.addEventListener("load", function() {
            if (this.response) {
                aqa.instruments=JSON.parse(this.response);
                aqa.instruments.forEach((inst,n) => {

                    let opt=document.createElement('option');
                    opt.value=n;
                    opt.innerHTML=inst.name;
                    instruments.appendChild(opt);

                    inst.presets.forEach((preset, i) => {
                        preset.name.split(/[^a-zA-Z]+/).forEach((presetPart, i) => {
                            if(presetPart!="") {
                                let presetPartLower=presetPart.toLowerCase();
                                if(preset_keywords.has(presetPartLower)) {
                                    let newCount = preset_keywords.get(presetPartLower)+1;
                                    preset_keywords.set(presetPartLower,newCount);
                                } else {
                                    preset_keywords.set(presetPartLower,1);
                                }
                            }
                            //console.log("--" + presetPart);
                        });
                    });

                });
                for(let i=0;i<1;i++) {
                    instruments[i].value=i;
                }

                /* output all keywords

                preset_keywords.forEach((value,key,map) => {
                    console.log(key+":"+value);
                }
                );
                */

            } else {
                console.log("initIntrumentSelect server error!!!");
            }
        });
        console.log("initIntrumentSelect()");
        http_req.open("GET", aqa.baseUrl + "/data/instruments.json");
        http_req.send();
    }

    setDivsHidden(v) {
        this.div_gen.hidden=v;
        this.div_mic.hidden=v;
        this.div_navi.hidden=v;
        this.div_session.hidden=v;
        this.div_step_sequencer.hidden=v;

        this.menu_navi_button.style.background = "#7c70e0";
        this.menu_gen_button.style.background = "#7c70e0";
        this.menu_mic_button.style.background = "#7c70e0";
    }

    toggleMenu() {
        this.menu_hidden=!this.menu_hidden;
        this.menu_mic_button.hidden=this.menu_hidden;
        this.menu_gen_button.hidden=this.menu_hidden;
        //this.menu_navi_button.hidden=this.menu_hidden;
        //this.menu_autoplay_button.hidden=this.menu_hidden;
        this.setDivsHidden(true)
    }

    triggerCalc() {
        generateNewSound();
    }

    instrument() {
        return this.select_instrument.value;
    }

    quantize() {
        return this.select_quantize.value;
    }

    steps() {
        let steps = "";
        for(let i=0;i<4;i++) {
            for(let j=0;j<8;j++) {
                steps += this.sequencer_step[i][j]===true ? "1" : "0";
            }
        }
        return steps;
    }

    updateHeader() {
        let bars=Math.floor(beatNr/4)+1;
        let quarter=beatNr%4+1;

        this.display_header.innerHTML =
        aqa.nickname + " | " +
        bars + ":" + quarter +
        " | clips: " + worldObjects.size +
        " | fps: " + aqa.engine.getFps().toFixed(0) +
        " | tempo: " + aqa.tempo
        ;
        this.display_chords.innerHTML = aqa.chordsDisplay;
        this.display_progress.value = (beatNr+0.5) / (aqa.beatsPerChord * aqa.chordsLen);
    }

    updateNetStatus(messageCount) {
        let status="";
        switch (Math.floor(messageCount/10)%4) {
            case 1:
                status="◓";
                break;
            case 2:
                status="◑";
                break;
            case 3:
                status="◒";
                break;
            default:
                status="◐";
        }
        this.display_net_status.innerHTML = status;
        this.display_net_status_loading.innerHTML = status;
    }

    setNetSessionEntry(key,name) {
        this.netSessionMap.set(key,name);
        this.updateNetSessionList();
    }

    deleteNetSessionEntry(key) {
        this.netSessionMap.delete(key);
        this.updateNetSessionList();
    }

    updateNetSessionList() {
        let i=0;
        this.netSessionMap.forEach((name, key) => {
            this.netSessionList[i].innerHTML=name;
            this.netSessionList[i].hidden=false;
            i++;
        });
        for(;i<5;i++) {
            this.netSessionList[i].innerHTML="";
            this.netSessionList[i].hidden=true;
        }
    }
}
