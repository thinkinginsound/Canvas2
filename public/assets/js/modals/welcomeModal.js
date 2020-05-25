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
      title:"The Black Sheep Digital",
      positiveText:"Agree",
      negativeText:"Disagree",
      showHeaderClose:false,
      showFooterClose:false,
      showFooter:false,

    }

    super(options);
    this.setBody($(`
      <div>
        <div id="page1">
          <img src="/assets/images/Behn.svg" style="width:50%;height:50%;" class="padding"</img>
          <p> Hi stranger, my name is Bêhn. I’m here to introduce you to my latest game. We’ll call you [generated username]. Would you like to change that?</p>
          </br>
          <button type="button" class="btn btn-primary" id="nextButton">Next</button>
        </div>

        <div id="page2">
          <img src="/assets/images/Behn.svg" style="width:30%;height:30%;" class="padding"</img>
          <p>Hello [username]! Welcome to the Black Sheep Digital. Here are some instructions:
          </br>
          When you start, your cursor will appear on the canvas. </br>
          You can now either place a pixel, or move your cursor. You place a pixel by pressing the spacebar.</p>
          <img src="/assets/images/tutorial1.svg" style="width:80%;height:80%;" class="padding"</img>
          </br>
          <button type="button" class="btn btn-primary" id="nextButton2">Next</button>
        </div>

        <div id="page3">
          <img src="/assets/images/Behn.svg" style="width:30%;height:30%;" class="padding"</img>
          <p>You move using the arrow keys.</p>
          <img src="/assets/images/tutorial2.svg" style="width:80%;height:80%;" class="padding"</img>
          <p>You can only move one block away from your last position.</p>
          </br>
          <button type="button" class="btn btn-primary" id="nextButton3">Next</button>
        </div>

        <div id="page4">
          <img src="/assets/images/Behn.svg" style="width:30%;height:30%;" class="padding"</img>
          <p>You can also move diagonally.</p>
          <img src="/assets/images/tutorial3.svg" style="width:40%;height:40%;" class="padding"</img>
          </br>
          <button type="button" class="btn btn-primary" id="nextButton4">Next</button>
        </div>

        <div id="page5">
          <img src="/assets/images/Behn.svg" style="width:30%;height:30%;" class="padding"</img>
          <p>You can only draw when the blue bar on the right is 100% full.</p>
          <div class="progress">
            <div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow= "100" aria-valuemin="0" aria-valuemax="100" style="width:70%; transition:width 0.05s ease;" id="drawPercentage">
            </div>
          </div>
          </br>
          </br>
          <button type="button" class="btn btn-primary" id="nextButton5">Next</button>
        </div>

        <div id="page6">
          <img src="/assets/images/Behn.svg" style="width:30%;height:30%;" class="padding"</img>
          <p>Check the pie chart on the left to keep track of your team's progress.</p>
          <img src="/assets/images/PieExample.svg" style="width:40%;height:40%;" class="padding"</img>
          </br>
          <button type="button" class="btn btn-primary" id="nextButton6">Next</button>
        </div>

        <div id="page7">
          <img src="/assets/images/Behn.svg" style="width:30%;height:30%;" class="padding"</img>
          <p>When the timer in the right upper corner reaches 0:00, the game is over. Please stick until the end for a quick survey to help us further develop the Black Sheep Digital.</p>
          </br>
          <button type="button" class="btn btn-primary" id="nextButton7">Next</button>
        </div>

        <div id="page8">
          <img src="/assets/images/Behn.svg" style="width:30%;height:30%;" class="padding"</img>
          <p>Before we start, please test your audio by clicking the button below.
          </br>
          </br>
          <button type="button" class="btn btn-primary" id="playButton">Play Audio</button>
          </br>
          </br> If the sound isn't working, please check the volume of your computer and the sound of your browser.</p>
          <button type="button" class="btn btn-primary" id="nextButton8">Next</button>
        </div>

        <div id="page9">
          <img src="/assets/images/Behn.svg" style="width:30%;height:30%;" class="padding"</img>
          </br> We use functional cookies for temporary storage of your impersonal id. If you continue you agree to the <a href="terms.html">terms</a> and indicate that you are over 13 years old.</p>
        </div>

      </div>
    `));
    this.player = new Tone.Player({
    	"url" : "/assets/sound/beh.wav",
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
    // Hide dom element with id 'page...'
    this.view.find("#page2").hide();
    this.view.find("#page3").hide();
    this.view.find("#page4").hide();
    this.view.find("#page5").hide();
    this.view.find("#page6").hide();
    this.view.find("#page7").hide();
    this.view.find("#page8").hide();
    this.view.find("#page9").hide();

    this.view.find("#nextButton").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page1").hide();
      // Show dom element with id 'page2'
      this.view.find("#page2").show();
    })
    this.view.find("#nextButton2").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page2").hide();
      // Show dom element with id 'page2'
      this.view.find("#page3").show();
    })
    this.view.find("#nextButton3").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page3").hide();
      // Show dom element with id 'page2'
      this.view.find("#page4").show();
    })

    this.view.find("#nextButton4").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page4").hide();
      // Show dom element with id 'page2'
      this.view.find("#page5").show();
    })

    this.view.find("#nextButton5").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page5").hide();
      // Show dom element with id 'page2'
      this.view.find("#page6").show();
    })

    this.view.find("#nextButton6").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page6").hide();
      // Show dom element with id 'page2'
      this.view.find("#page7").show();
    })

    this.view.find("#nextButton7").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page7").hide();
      // Show dom element with id 'page2'
      this.view.find("#page8").show();
    })

    this.view.find("#nextButton8").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page8").hide();
      // Show dom element with id 'page2'
      this.view.find("#page9").show();
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
