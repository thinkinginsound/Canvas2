let defaultNPC = require("./normalUser.js");

class simpleNPC extends defaultNPC{
    constructor(canvaswidth,canvasheight,startX,startY, npcID,nameListIndex){
      super(canvaswidth,canvasheight,startX,startY,npcID,nameListIndex)
      this.type = "simpleNPC"
    }

    move(){
        if(!this.npc)return;
        this.prevX = this.x;
        this.prevY = this.y;
        let percentage = Math.floor(Math.random()*100);
        let direction = 0;
        if(percentage <= 10){
            direction = 1
        } else if(percentage > 10 && percentage <=20){
            direction = -1
        } else {
            direction = 0
        }
        if(this.x < this.canvaswidth-1 && this.x > 1){
            this.x += direction;
        } else if(this.x >= this.canvaswidth-1){
            this.x += (Math.round(Math.random())-1);
        } else {
            this.x += (Math.round(Math.random()));
        }
        percentage = Math.floor(Math.random()*100);
        if(percentage <= 10){
            direction = 1
        } else if(percentage > 10 && percentage <=20){
            direction = -1
        } else {
            direction = 0
        }
        if(this.y < this.canvasheight-1 && this.y > 1){
            this.y += direction;
        } else if(this.y >= this.canvasheight-1){
            this.y += (Math.round(Math.random())-1);
        } else {
            this.y += (Math.round(Math.random()));
        }
        return [this.x, this.y];
    }
}

module.exports = {
    simpleNPC: simpleNPC
}
