import { getCookie } from "../js/cookies.js"

let checkinButton = document.querySelector("#checkinButton");
let tuneInButton = document.querySelector("#tuneInButton");
let nickname = getCookie("nickname");

if(nickname!=="") {
    checkinButton.hidden=true;
    tuneInButton.hidden=false;
}
