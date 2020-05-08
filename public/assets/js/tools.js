/*
Purpose: this file contains small but necessary functions that are not provided by JavaScript

Functions:

*/

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie(cname) {
  var cookie = getCookie(cname);
  return cookie != "";
}

function removeCookie(cname){
  setCookie(cname, "", -1)
}
function createArray(x, y, fill=undefined) {
  return new Array(x).fill(0).map(() => new Array(y).fill(fill))
}
function randomInt(min, max) {
  if(max === undefined){
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min) ) + min;
}
