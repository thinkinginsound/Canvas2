/*
Purpose: The sketch contains everything drawing related, and no calculations.
It uses p5 to control the canvas and to draw pixels.

Functions:
  - setup: creates canvas
  - draw: draws pixels and cursor
  - other functions: windowResized and calcPixelSize (re)define pixelsize to match the window size
*/

const container = window.document.getElementById('container'); // Get container in which p5js will run

let sketch = function(p) {
  let pixelSize = 50;
  let padding = 20;
  let offsetX = 0;
  let offsetY = 0;
  let canvasWidth = pixelSize * window.state.server.maxPixelsWidth;
  let canvasHeight = pixelSize * window.state.server.maxPixelsHeight;

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
    if(!window.state.server.ready)return;
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
    for(let xPos in window.state.session.pixelArray){
      for(let yPos in window.state.session.pixelArray[xPos]){
        window.state.session.pixelArray[xPos][yPos].draw(p, offsetX, offsetY, pixelSize);
      }
    }
  }

  function previewPixel() {
    let strokeWeight = pixelSize/20;
    p.noFill();
    p.strokeWeight(strokeWeight);
    p.stroke(0);
    p.rect(offsetX + window.state.session.currentXPos*pixelSize - strokeWeight/2, offsetY + window.state.session.currentYPos*pixelSize - strokeWeight/2, pixelSize+strokeWeight/2, pixelSize+strokeWeight/2);
  }

  function calcPixelSize(){
    if(container.offsetWidth/window.state.server.maxPixelsWidth < container.offsetHeight/window.state.server.maxPixelsHeight){
      pixelSize = (container.offsetWidth - 2*padding)/window.state.server.maxPixelsWidth;
    } else {
      pixelSize = (container.offsetHeight - 2*padding)/window.state.server.maxPixelsHeight;
    }

    if(container.offsetWidth/window.state.server.maxPixelsWidth < container.offsetHeight/window.state.server.maxPixelsHeight){ // Portrait
      offsetY = padding + container.offsetHeight/2 - (window.state.server.maxPixelsHeight/2)*pixelSize;
      offsetX = padding;
    } else { // Landscape
      offsetX = padding + container.offsetWidth/2 - (window.state.server.maxPixelsWidth/2)*pixelSize;
      offsetY = padding;
    }
    canvasWidth = pixelSize*window.state.server.maxPixelsWidth;
    canvasHeight = pixelSize*window.state.server.maxPixelsHeight;
    return pixelSize;
  }
};

new p5(sketch, container);
