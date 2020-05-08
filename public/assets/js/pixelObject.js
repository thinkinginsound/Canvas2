/*
Purpose: a PixelObject stores all information about a Pixel and its direct surroundings (also diagonal).

Functions:
*/

class PixelObject {
  constructor(xIndex, yIndex){
    this.xIndex = xIndex;
    this.yIndex = yIndex;
    this.group = -1;
    this.pixelcolor = "white";
  }
  draw(p, offsetX, offsetY, pixelSize){
    p.fill(this.pixelcolor);
    p.stroke(this.pixelcolor);
    p.rect(offsetX+this.xIndex*pixelSize, offsetY+this.yIndex*pixelSize, pixelSize, pixelSize);
  }
  setGroup(group){
    this.group = group;
    this.pixelcolor = window.uiHandler.colorlist[group];
  }
}

export { PixelObject };
