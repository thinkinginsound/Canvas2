/*
Purpose: Modal popup when game ends with sheepbehaviour definition.
Asks user to estimate their own sheepbehaviour amount and finaly shows the actual percentage.
Contains a link to google forms.

Functions:
*/

import { DefaultModal } from "./defaultModal.js"

export class EndModal extends DefaultModal {
  constructor(){
    let options = {
      id:"end-modal",
      title:"The end",
      positiveText:"Agree",
      negativeText:"Disagree",
      showHeaderClose:false,
      showFooterClose:false,
      showFooterNegative:false,
      showFooterPositive:false,
    }
    super(options);
    this.setBody($(`
      <div>
        <p>Thank you for your participation!
        </br> While you were playing a game we were analysing your sheepbehaviour.
        </br>
        </br> <b><ins>sheep</ins>·be·hav·iour</b>
        </br> <small> <b> <i>noun</i> </b> UK (US <b> sheepbehavior </b>) </small>
        </br>
        <small>The term sheepbehaviour describes the way humans perform sheep-like herding behaviour,
        where a particular group (herd) tends to (often unconsciously) collectively maneuver with a certain flow.</small>
        </p>
        <div id="page1">
        <p>Do you think you showed sheepbehaviour?</p>
        Never
        <div class="btn-group" role="group" aria-label="First group" id="reviewButtons">
        <button type="button" class="btn btn-primary" value="1">1</button>
        <button type="button" class="btn btn-primary" value="2">2</button>
        <button type="button" class="btn btn-primary" value="3">3</button>
        <button type="button" class="btn btn-primary" value="4">4</button>
        <button type="button" class="btn btn-primary" value="5">5</button>
        </div>
        Constantly
        </div>
        <div id="page2">
        You behaved like a sheep for <span id="sheepPercentage"></span>% of the time.
        </br>
        <p> Please fill in the google forms by clicking the button below to help us further develop out project. </p>
        <a style="padding: 10px 20px; border-radius: 4px; background-color: #1a75ff; color: white"; href="https://forms.gle/yKDw6S2XUV7PY647A">Google forms</a>
        <button  onclick="document.location = 'forms.asp'></button>
        </br>
        </div>
      </div>
    `));
    // Hide dom element with id 'page2'
    this.view.find("#page2").hide();

    // Run function when dom element with type/class 'button' and id 'buttons' is clicked
    this.view.find("#reviewButtons").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page1").hide();
      // Show dom element with id 'page2'
      this.view.find("#page2").show();
      window.socket.emit('selfReflection',$(event.target).val());
    })

    this.setActionPositive((e)=>{
      return true; // Hide model if return true
    })
    this.setActionNegative((e)=>{
      return false; // Hide model if return true
    })
  }
  setSheepPercentage(value){
    this.sheepPercentage = value;
    this.view.find("#sheepPercentage").text(value);
  }
}
