class defaultNPC {
  constructor(canvaswidth, canvasheight, startX, startY, npcID, username){
    this.type = "normalUser"
    this.npc = true;
    this.npcID = npcID
    this.sessionid = undefined;
    this.canvaswidth = canvaswidth;
    this.canvasheight = canvasheight;
    this.x = startX;
    this.y = startY;
    this.prevX = this.x;
    this.prevY = this.y;
    this.username = username;
  }

  move(){
    //default
  }

  save(groupIndex, userIndex){
    let rad = Math.atan2(this.y - this.prevY, this.prevX - this.x);
    let deg = (rad * (180 / Math.PI) + 180) % 360;
    let sendable = {
      user_game_id: this.sessionID,
      user_loc_x: this.x,
      user_loc_y: this.y,
      angle: deg,
      group_id: groupIndex,
      group_order: userIndex,
      frame_number: global.clockCounter
    }
    return sendable;
  }

  setPosition(x, y){
    this.xPos = x;
    this.yPos = y;
  }
  get xPos(){ return this.x; }
  get yPos(){ return this.y; }
  set xPos(value){
    if(value<0)this.x=0;
    else if(value>this.canvaswidth)this.x=this.canvaswidth;
    else this.x = value;
  }
  set yPos(value){
    if(value<0)this.y=0;
    else if(value>this.canvasheight)this.y=this.canvasheight;
    else this.y = value;
  }

  set sessionID(sessionID){
    this.sessionid = sessionID;
  }

  get sessionID(){
    if(this.sessionid === undefined) return this.npcID;
    else return this.sessionid;
  }

  set npcState(npc){
    this.npc = npc
  }

  get npcState(){
    return this.npc;
  }

  set userName(username){
    this.username = username;
  }

  get userName(){
    return this.username;
  }
}

module.exports = defaultNPC
