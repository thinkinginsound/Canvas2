/*
Purpose: The sketch contains everything drawing related, and no calculations.
It uses p5 to control the canvas and to draw pixels.

Functions:
  - setup: creates canvas
  - draw: draws pixels and cursor
  - other functions: windowResized and calcPixelSize (re)define pixelsize to match the window size
*/

import Store from "./Store.js"

const container = window.document.getElementById('container'); // Get container in which p5js will run

const sketch = function(p) {
  let pixelSize = 50;
  let padding = 20;
  let offsetX = 0;
  let offsetY = 0;
  let canvasWidth = pixelSize * Store.get("server/canvaswidth", 40);
  let canvasHeight = pixelSize * Store.get("server/canvasheight", 30);

  p.setup = function(){
    // Create canvas with the size of the container and fill with bgcolor
    p.createCanvas(container.offsetWidth, container.offsetHeight);
    p.background(window.uiHandler.bgcolor);
    p.frameRate(10);
    calcPixelSize();
    // console.log(sheepPercentage);
  }

  p.draw = function() {
    // Don't draw if server is not ready yet
    p.background(window.uiHandler.bgcolor);
    p.fill("white")

    p.rect(offsetX, offsetY, canvasWidth , canvasHeight)
    if(!Store.get("server/ready"))return;
    drawPixels();
    previewPixel();
  };
  p.windowResized = function() {
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    calcPixelSize();
  }

  // Handle mouse click events. Set 'MOUSEARMED' to true if mouse clicked, and false on mouse release OR end of draw function
  // p.mousePressed = function() {
  //   p.userStartAudio();
  // }

  function drawPixels() {
    // Create square with pixelSize width
    for(let xPos in Store.get("session/pixelArray")){
      for(let yPos in Store.get("session/pixelArray")[xPos]){
        Store.get("session/pixelArray")[xPos][yPos].draw(p, offsetX, offsetY, pixelSize);
      }
    }
  }

  function previewPixel() {
    let strokeWeight = pixelSize/20;
    p.noFill();
    p.strokeWeight(strokeWeight);
    p.stroke(0);
    p.rect(offsetX + Store.get("session/currentXPos")*pixelSize - strokeWeight/2, offsetY + Store.get("session/currentYPos")*pixelSize - strokeWeight/2, pixelSize+strokeWeight/2, pixelSize+strokeWeight/2);
  }

  function calcPixelSize(){
    if(container.offsetWidth/Store.get("server/canvaswidth") < container.offsetHeight/Store.get("server/canvasheight")){
      pixelSize = (container.offsetWidth - 2*padding)/Store.get("server/canvaswidth");
    } else {
      pixelSize = (container.offsetHeight - 2*padding)/Store.get("server/canvasheight");
    }

    if(container.offsetWidth/Store.get("server/canvaswidth") < container.offsetHeight/Store.get("server/canvasheight")){ // Portrait
      offsetY = padding + container.offsetHeight/2 - (Store.get("server/canvasheight")/2)*pixelSize;
      offsetX = padding;
    } else { // Landscape
      offsetX = padding + container.offsetWidth/2 - (Store.get("server/canvaswidth")/2)*pixelSize;
      offsetY = padding;
    }
    canvasWidth = pixelSize*Store.get("server/canvaswidth");
    canvasHeight = pixelSize*Store.get("server/canvasheight");
    return pixelSize;
  }
};

let Sketch = new p5(sketch, container);

export default Sketch;
