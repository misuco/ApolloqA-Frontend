import { aqa } from "./apolloqa.js"

export class aqa_dialog {
    constructor() {
        this.dialog = document.querySelector("#aqa_dialog_loading");
        this.text = document.querySelector("#loading_text");
        this.progress = document.querySelector("#loading_progress");
    }

    setText(text) {
        this.text.innerHTML=text;
    }

    setProgress(value) {
        this.progress.value=value;
    }
}
