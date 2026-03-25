import { aqa } from "./apolloqa.js"
import { tJitter, autoplay, beatNr } from "./syncTrack.js"
import { generateNewSound } from "./worldObjects.js"

export class aqa_menu {
    constructor() {
        this.menu_hidden=true;

        this.display_header = document.querySelector("#display_header");
        this.display_net_status = document.querySelector("#display_net_status");
        this.display_progress = document.querySelector("#display_progress");

        this.range_speed = document.querySelector("#range_speed");
        this.range_speed.addEventListener("input", () => {aqa.speed=event.target.value;});
        this.range_speed.value=0.1;
        aqa.speed=0.1;

        this.range_camera = document.querySelector("#range_camera");
        this.range_camera.addEventListener("input", () => {aqa.chaseCameraPosition.position.z=event.target.value*-1;});
        this.range_camera.value=50;
        aqa.chaseCameraPosition.position.z=-50;

        this.menu_navi_button = document.querySelector("#menu_navi");
        this.div_navi = document.querySelector("#config_navi");
        this.menu_navi_button.addEventListener("click", () => {
            this.setDivsHidden(true);
            this.div_navi.hidden=false;
            this.menu_navi_button.style.background = "orange";
        });


        this.menu_gen_button = document.querySelector("#menu_gen");
        this.div_step_sequencer = document.querySelector("#step_sequencer");
        this.div_gen = document.querySelector("#config_gen");
        this.menu_gen_button.addEventListener("click", () => {
            this.setDivsHidden(true);
            this.div_gen.hidden=false;
            this.div_step_sequencer.hidden=false;
            this.menu_gen_button.style.background = "orange";
        });

        this.menu_session_button = document.querySelector("#menu_session");
        this.div_session = document.querySelector("#config_session");
        this.menu_session_button.addEventListener("click", () => {
            this.setDivsHidden(true);
            this.div_session.hidden=false;
            this.menu_session_button.style.background = "orange";
        });

        this.menu_mic_button = document.querySelector("#menu_mic");
        this.div_mic = document.querySelector("#config_mic");
        this.menu_mic_button.addEventListener("click", () => {
            this.setDivsHidden(true);
            this.div_mic.hidden=false;
            this.menu_mic_button.style.background = "orange";
        });

        this.menu_autoplay_button = document.querySelector("#menu_autoplay");
        this.menu_autoplay_button.onclick = function () {
            autoplay=!autoplay;
            if(autoplay===true) {
                this.style.background = "orange";
            } else {
                this.style.background = "#0088cc";
            }
        }

        this.menu_main_button = document.querySelector("#menu_main");
        this.menu_main_button.addEventListener("click", () => {this.toggleMenu()});

        // populate generator config selects
        this.select_instrument = [];
        this.select_quantize = [];
        this.select_density = [];

        for(let i=0;i<1;i++) {
            this.select_instrument[i] = document.querySelector("#select_instrument_"+i);

            this.select_quantize[i] = document.querySelector("#select_quantize_"+i);
            [ "1","2","4","8","16","32" ].forEach((label,n) => {
                let opt=document.createElement('option');
                opt.value=n;
                opt.innerHTML=label;
                this.select_quantize[i].appendChild(opt);
            });
            this.select_quantize[i].value=4;

            this.select_density[i] = document.querySelector("#select_density_"+i);
            [ "10%","20%","30%","40%","50%","60%","70%","80%","90%","100%" ].forEach((label,n) => {
                let opt=document.createElement('option');
                opt.value=n+1;
                opt.innerHTML=label;
                this.select_density[i].appendChild(opt);
            });
            this.select_density[i].value=10;
        }

        this.initIntrumentSelect();

        this.sequencer_step = [];
        for(let i=0;i<8;i++) {
            this.sequencer_step[i] = document.querySelector("#step_"+i);
            this.sequencer_step[i].style.background="#0088cc";
            this.sequencer_step[i].addEventListener("click", () => {this.toggleStep(i)});
        }

        this.toggleStep(0);
        this.toggleStep(3);
        this.toggleStep(4);
        this.toggleStep(6);
        /*
        this.toggleStep(0);
        this.toggleStep(5);
        */

        this.calc_button = [];
        this.calc_button[0] = document.querySelector("#calcX");

        this.calc_button[0].addEventListener("click", () => this.triggerCalcX());

        this.netSessionMap = new Map();
        this.netSessionList = [];
        this.netSessionList[0] = document.querySelector("#netSession0");
        this.netSessionList[1] = document.querySelector("#netSession1");
        this.netSessionList[2] = document.querySelector("#netSession2");
        this.netSessionList[3] = document.querySelector("#netSession3");
        this.netSessionList[4] = document.querySelector("#netSession4");
    }

    toggleStep(i) {
        console.log("toggleStep "+i);
        if(this.sequencer_step[i].style.background=="#0088cc") {
            this.sequencer_step[i].style.background="orange";
        } else {
            this.sequencer_step[i].style.background="#0088cc";
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
                    for(let i=0;i<1;i++) {
                        let opt=document.createElement('option');
                        opt.value=n;
                        opt.innerHTML=inst.name;
                        instruments[i].appendChild(opt);
                    }

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

        this.menu_navi_button.style.background = "#0088cc";
        this.menu_gen_button.style.background = "#0088cc";
        this.menu_session_button.style.background = "#0088cc";
        this.menu_mic_button.style.background = "#0088cc";
    }

    toggleMenu() {
        this.menu_hidden=!this.menu_hidden;
        this.menu_session_button.hidden=this.menu_hidden;
        this.menu_mic_button.hidden=this.menu_hidden;
        this.menu_gen_button.hidden=this.menu_hidden;
        this.menu_navi_button.hidden=this.menu_hidden;
        this.menu_autoplay_button.hidden=this.menu_hidden;
        this.setDivsHidden(true)
    }

    setCalcButtonColor(i,c) {
        this.calc_button[i].style.background=c;
    }

    triggerCalc(i) {
        this.setCalcButtonColor(i,"orange");
        triggerNewSound(i);
        generateNewSound();
    }

    triggerCalcX() {
        generateNewSound();
    }

    instrument(i) {
        return this.select_instrument[i].value;
    }

    quantize(i) {
        return this.select_quantize[i].value;
    }

    density(i) {
        return this.select_density[i].value;
    }

    steps() {
        let steps = "";
        for(let i=0;i<8;i++) {
            steps += this.sequencer_step[i].style.background=="#0088cc" ? "0" : "1";
        }
        return steps;
    }

    updateHeader() {
        let bars=Math.floor(beatNr/4)+1;
        let quarter=beatNr%4+1;
        // debug header
        // this.display_header.innerHTML = aqa.nickname + " " + bars + ":" + quarter + " tEng: " + aqa.engineTime.toFixed(2) + " jitter: " + aqa.tJitter.toFixed(2) + " fps: " + engine.getFps().toFixed(2);
        this.display_header.innerHTML =
        aqa.nickname + " " +
        bars + ":" + quarter +
        " clips: " + aqa.worldObjects.size +
        " fps: " + aqa.engine.getFps().toFixed(2) +
        " beatTime: " + aqa.beatTime.toFixed(2) +
        " jitter: " + tJitter.toFixed(2) +
        "<br>" +
        " chords: " + aqa.chords +
        " cycle len: " + aqa.cycleLen +
        " tempo: " + aqa.tempo
        ;
        this.display_progress.value = beatNr / (aqa.cycleLen * aqa.chordsLen);
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
