class aqa_menu {
    constructor() {
        this.menu_hidden=true;

        this.display_header = document.querySelector("#display_header");
        this.display_net_status = document.querySelector("#display_net_status");

        this.range_speed = document.querySelector("#range_speed");
        this.range_speed.addEventListener("input", () => {aqa.speed=event.target.value;});

        this.range_camera = document.querySelector("#range_camera");
        this.range_camera.addEventListener("input", () => {aqa.chaseCameraPosition.position.z=event.target.value*-1;});

        this.menu_navi_button = document.querySelector("#menu_navi");
        this.div_navi = document.querySelector("#config_navi");
        this.menu_navi_button.addEventListener("click", () => {
          this.div_navi.hidden=!this.div_navi.hidden
        });


        this.menu_gen_button = document.querySelector("#menu_gen");
        this.div_step_sequencer = document.querySelector("#step_sequencer");
        this.div_gen = document.querySelector("#config_gen");
        this.menu_gen_button.addEventListener("click", () => {
          this.div_gen.hidden=!this.div_gen.hidden
        });

        this.menu_session_button = document.querySelector("#menu_session");
        this.div_session = document.querySelector("#config_session");
        this.menu_session_button.addEventListener("click", () => {this.div_session.hidden=!this.div_session.hidden});

        this.menu_mic_button = document.querySelector("#menu_mic");
        this.div_mic = document.querySelector("#config_mic");
        this.menu_mic_button.addEventListener("click", () => {this.div_mic.hidden=!this.div_mic.hidden});

        this.menu_autoplay_button = document.querySelector("#menu_autoplay");

        this.menu_main_button = document.querySelector("#menu_main");
        this.menu_main_button.addEventListener("click", () => {this.toggleMenu()});

        this.chords_select = document.querySelector("#select_chords");
        this.display_bpm = document.querySelector("#display_bpm");
        this.range_bpm = document.querySelector("#range_bpm");
        this.range_bpm.addEventListener("input", (event) => this.updateBpmValue(event.target.value));

        this.inc_bpm = document.querySelector("#inc_bpm");
        this.inc_bpm.addEventListener("click", (event) => this.incBpmValue());

        this.dec_bpm = document.querySelector("#dec_bpm");
        this.dec_bpm.addEventListener("click", (event) => this.decBpmValue());

        this.select_len = document.querySelector("#select_len");
        [ "1","2","4","8","16" ].forEach((label,n) => {
            let opt=document.createElement('option');
            opt.value=n;
            opt.innerHTML=label;
            this.select_len.appendChild(opt);
        });
        this.select_len.value=3;

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
        this.initChordsSelect();

        this.sequencer_step = [];
        for(let i=0;i<8;i++) {
            this.sequencer_step[i] = document.querySelector("#step_"+i);
            this.sequencer_step[i].style.background="gray";
            this.sequencer_step[i].addEventListener("click", () => {this.toggleStep(i)});
        }

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
        if(this.sequencer_step[i].style.background=="gray") {
            this.sequencer_step[i].style.background="orange";
        } else {
            this.sequencer_step[i].style.background="gray";
        }
    }

    initChordsSelect() {
        const chords = this.chords_select;
        const http_req = new XMLHttpRequest();
        http_req.addEventListener("load", function() {
            if (this.response) {
                const response_data=JSON.parse(this.response);
                response_data.forEach((inst,n) => {
                    let opt=document.createElement('option');
                    opt.value=n;
                    opt.innerHTML=inst.name;
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

    toggleMenu() {
        this.menu_hidden=!this.menu_hidden;
        this.menu_session_button.hidden=this.menu_hidden;
        this.menu_mic_button.hidden=this.menu_hidden;
        this.menu_gen_button.hidden=this.menu_hidden;
        this.menu_navi_button.hidden=this.menu_hidden;
        this.menu_autoplay_button.hidden=this.menu_hidden;
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
        aqa.tempo=newTempo;
        aqa.cycleTime=aqa.tempo / 60;
        this.display_bpm.textContent=newTempo;
    }

    get chords() {
        return this.chords_select.value;
    }

    instrument(i) {
        return this.select_instrument[i].value;
    }

    len() {
        return this.select_len.value;
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
            steps += this.sequencer_step[i].style.background=="gray" ? "0" : "1";
        }
        return steps;
    }

    alignment(i) {
        let a={
            radius:this.radius[i].value,
            yaw:this.yaw[i].value,
            pitch:this.pitch[i].value,
            rotate_yaw:this.rotate_yaw[i].value,
            rotate_pitch:this.rotate_pitch[i].value
        };
        return a;
    }

    updateHeader() {
        let bars=Math.floor(aqa.cycleNr/4)+1;
        let quarter=aqa.cycleNr%4+1;
        this.display_header.innerHTML = aqa.nickname + " " + bars + ":" + quarter;
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
