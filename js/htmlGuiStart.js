class aqa_menu_start {
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

        this.select_len = document.querySelector("#select_len");
        [ "1","2","4" ].forEach((label,n) => {
            let opt=document.createElement('option');
            opt.value=n;
            opt.innerHTML=label;
            this.select_len.appendChild(opt);
        });
        this.select_len.value=0;
        this.select_len.addEventListener("input", this.updateLen);

        this.initChordsSelect();

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
        aqa.tempo=newTempo;
        aqa.beatTime=60/aqa.tempo;
        this.display_bpm.textContent=newTempo;
    }

    updateLen(event) {
        aqa.cycleLen=Math.pow(2,event.target.value)*aqa.htmlGui.chords_len[aqa.htmlGui.chords_select.value];
        console.log("cycleLen: "+aqa.cycleLen);
    }

    get chords() {
        //return this.chords_select.value;
        return this.chords_string[this.chords_select.value];
    }

    get chordsLen() {
        return this.chords_len[this.chords_select.value];
    }

    len() {
        return this.select_len.value;
    }

}
