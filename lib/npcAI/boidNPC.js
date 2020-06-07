/**
 @class boidNPC
 @augments defaultNPC
 @property {number} canvaswidth width of the canvas in witch the NPC may move
 @property {number} canvasheight height of the canvas in witch the NPC may move
 @property {number} startX start x position of the NPC
 @property {number} startY start y position of the NPC
 @property {string} npcID ID of the NPC
 @property {string} nameListIndex Name of the NPC
*/

let defaultNPC = require("./defaultNPC.js");

class boidNPC extends defaultNPC {
    constructor(canvaswidth,canvasheight,startX,startY,npcID,nameListIndex){
      super(canvaswidth,canvasheight,startX,startY,npcID,nameListIndex)
      this.type = "boidNPC"
      this.innerCircle = 2;
      this.outerCircle = 12;
    }

    moveSpace(directionX,directionY){
        let newX = this.x;
        let newY = this.y;
        this.prevX = this.x;
        this.prevY = this.y;
        if(this.x < this.canvaswidth-1 && this.x >= 1){
            newX += directionX;
        } else if(this.x >= this.canvaswidth-1){
            newX += (Math.round(Math.random())-1);
        } else {
            newX += (Math.round(Math.random()));
        }
        if(this.y < this.canvasheight-1 && this.y >= 1){
            newY += directionY;
        } else if(this.y >= this.canvasheight-1){
            newY += (Math.round(Math.random())-1);
        } else {
            newY += (Math.round(Math.random()));
        }
        this.setPosition(newX,newY)
    }

    randomNPCMove(){
        let percentage = Math.floor(Math.random()*100);
        let directionX = 0;
        let directionY = 0;
        if(percentage <= 60){
            directionX = this.x-this.prevX;
        } else {
            percentage = Math.floor(Math.random()*100);
            if(percentage <= 40){
                directionX = 1
            } else if(percentage > 40 && percentage <=80){
                directionX = -1
            } else {
                directionX = 0
            }
        }
        percentage = Math.floor(Math.random()*100);
        if(percentage <= 60){
            directionY = this.y-this.prevY;
        } else {
            percentage = Math.floor(Math.random()*100);
            if(percentage <= 40){
                directionY = 1
            } else if(percentage > 40 && percentage <=80){
                directionY = -1
            } else {
                directionY = 0
            }
        }
        this.moveSpace(directionX,directionY);
    }

    move(listofNPC){
        if(!this.npc)return;
        let chanceOfunhearding = Math.floor(Math.random()*100);
        if(chanceOfunhearding <= 90){
            let selfIndex = listofNPC.indexOf(this);
            let generalDirectionX = 0;
            let generalDirectionY = 0;
            listofNPC.forEach((singleNPC,index) => {
                if(index != selfIndex){
                    if(this.x+this.outerCircle >= singleNPC.x && this.x-this.outerCircle <= singleNPC.x &&
                        this.y+this.outerCircle >= singleNPC.y && this.y-this.outerCircle <= singleNPC.y){
                        if(this.x+this.innerCircle <= singleNPC.x && this.x-this.innerCircle >= singleNPC.x &&
                            this.y+this.innerCircle <= singleNPC.y && this.y-this.innerCircle >= singleNPC.y){
                            let xDirection = singleNPC.x - this.x;
                            let yDirection = singleNPC.y - this.y;
                            if(xDirection < 0){
                                generalDirectionX += -1;
                            } else if(xDirection > 0){
                                generalDirectionX += 1;
                            } else {
                                generalDirectionX = 0;
                            }
                            if(yDirection < 0){
                                generalDirectionY += -1;
                            } else if (yDirection > 0) {
                                generalDirectionY += 1;
                            } else {
                                generalDirectionY = 0;
                            }
                        }
                    }
                }
            });
            if(generalDirectionX == 0 && generalDirectionY == 0){
                this.randomNPCMove();
            } else {
                if(generalDirectionX > 1){
                    generalDirectionX = 1;
                }
                if (generalDirectionX < -1){
                    generalDirectionX = -1;
                }
                if(generalDirectionY > 1){
                    generalDirectionY = 1;
                }
                if(generalDirectionY < -1){
                    generalDirectionY = -1;
                }
                this.moveSpace(generalDirectionX,generalDirectionY);
            }
        } else {
            this.randomNPCMove();
        }
        return [this.x, this.y];
    }
}

module.exports = {
    boidNPC: boidNPC
}
