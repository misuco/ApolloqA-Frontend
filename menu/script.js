import { getCookie } from "../js/cookies.js"

let vimeoPlayer = document.querySelector("#vimeo-player");

function resizeIFrameToFitContent( iFrame ) {
    vimeoPlayer.width  = document.documentElement.clientWidth;
    vimeoPlayer.height = document.documentElement.clientWidth*0.56;
}

window.addEventListener('DOMContentLoaded', function(e) {
    resizeIFrameToFitContent( vimeoPlayer );
} );

window.addEventListener("resize", function() {
    resizeIFrameToFitContent( vimeoPlayer );
});
