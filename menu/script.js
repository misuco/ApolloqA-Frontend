import { getCookie } from "../js/cookies.js"

let vimeoPlayer = document.querySelector("#vimeo-player");

function resizeIFrameToFitContent( iFrame ) {
    console.log("onresize " + document.documentElement.clientWidth);
    vimeoPlayer.width  = document.documentElement.clientWidth;
    vimeoPlayer.height = document.documentElement.clientWidth*0.56;
}

window.addEventListener('DOMContentLoaded', function(e) {
    let checkinButton = document.querySelector("#checkinButton");
    let tuneInButton = document.querySelector("#tuneInButton");
    let nickname = getCookie("nickname");

    resizeIFrameToFitContent( vimeoPlayer );

    if(nickname!=="") {
        checkinButton.hidden=true;
        tuneInButton.hidden=false;
    }

} );

window.addEventListener("resize", function() {
    resizeIFrameToFitContent( vimeoPlayer );
});
