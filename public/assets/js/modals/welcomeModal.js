/*
Purpose: Modal popup when loading the page. Ask to agree with terms & conditions and tests audio.
Starts game and audioClass after last button is clicked

Functions:
*/

import { DefaultModal } from "./defaultModal.js"

export class WelcomeModal extends DefaultModal {
  constructor(){
    let options = {
      id:"welcome-modal",
      title:"The Black Sheep",
      positiveText:"Next",
      negativeText:"Disagree",
      showHeaderClose:false,
      showFooterClose:false,
      showFooter:false,

    }

    super(options);
    this.setBody($(`
      <div>
        <div id="page1">
          <p> Welcome. Thank you for your participation!
          </br>
          </br><b>Here are some instructions:</b>
          </br> You can use the arrow keys to move one block at a time. Use the spacebar to draw a cube once the bar on the right side of the screen is filled.
          </br> Please stay until the end of the game. When the timer hits 0:00 another popup will appear.
          <img src="/assets/images/movementExample.svg" style="width:100%;height:100%;" class="padding"</img>
          </br> We use functional cookies for temporary storage of your impersonal id. If you continue you agree to the <a href="terms.html">terms</a> and indicate that you are over 13 years old.</p>
          <button type="button" class="btn btn-primary" id="agreeButton">Agree</button>
          </div>
        <div id="page2">
          <p>Click the button to test your audio.
          </br> If the sound isn't working, please check the volume of your computer and the sound of your browser.</p>
          <button type="button" class="btn btn-primary" id="playButton">Play Audio</button>
          </p>
        </div>
      </div>
    `));
    this.player = new Tone.Player({
    	"url" : "/assets/sound/testSound.mp3",
    }).toMaster();

    this.playerTwo = new Tone.Player({
      "url" : "/assets/sound/ping.wav",
    }).toMaster();
    //<script>
    this.view.find("#playButton").click((event)=>{
      this.player.start();
      // console.log("Hier speelt hij het geluid af");
    })

    //</script>
    // Hide dom element with id 'page2'
    this.view.find("#page2").hide();
    this.view.find("#agreeButton").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page1").hide();
      // Show dom element with id 'page2'
      this.view.find("#page2").show();
      this.setShowFooter(true);
    })

    this.setActionPositive((e)=>{
      return true;
    })
    this.setActionNegative((e)=>{
      window.history.back();
      return false;
    })
  }
  actionPositive(e){
    let response = super.actionPositive(e);
    this.playerTwo.start();
    return response;
  }
}
