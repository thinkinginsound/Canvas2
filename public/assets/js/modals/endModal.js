/*
Purpose: Modal popup when game ends with sheepbehaviour definition.
Asks user to estimate their own sheepbehaviour amount and finaly shows the actual percentage.
Contains a link to google forms.

Functions:
*/

import { DefaultModal } from "./defaultModal.js"
import Store from "../Store.js"

export class EndModal extends DefaultModal {
  constructor(){
    let options = {
      id:"end-modal",
      title:"The End",
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
        <div id="page1">
          <img src="/assets/images/Behn.svg" style="width:50%;height:50%;" class="padding"</img>
          </br>
          <p>Thank you for your participation!
          <div>
            <canvas id="endPieChart" style="width: 100%;"></canvas>
          </div>
          </br>
          <p> <span id="winnerColor"></span> won with a percentage of ${Store.get("session/winnerPercentage").toFixed(2)}% the canvas.</p>
          </br>
          <button type="button" class="btn btn-primary" id="nextButton">Next</button>
        </div>

        <div id="page2">
          <img src="/assets/images/Behn.svg" style="width:50%;height:50%;" class="padding"</img>
          </br> While you were playing a game we were analysing your sheepbehaviour.
          </br>
          </br> <b><ins>sheep</ins>·be·hav·iour</b>
          </br> <small> <b> <i>noun</i> </b> UK (US <b> sheepbehavior </b>) </small>
          </br>
          <small>The term sheepbehaviour describes the way humans perform sheep-like herding behaviour,
          where a particular group (herd) tends to (often unconsciously) collectively maneuver with a certain flow.</small>
          </p>
        </div>

        <div id="page3">
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

        <div id="page4">
          <p>You behaved like a sheep for <span id="sheepPercentage"></span>% of the time.
          </br>
          Please fill in the google forms by clicking the button below to help us further develop out project. </p>
          <a style="padding: 10px 20px; border-radius: 4px; background-color: #1a75ff; color: white"; href="https://forms.gle/j8gUD2mh1HiN743R6">Google forms</a>
          <button  onclick="document.location = 'forms.asp'></button>
          </br>
        </div>
      </div>
    `));

    // Hide dom element with id 'page2' and 'page3'
    this.view.find("#page2").hide();
    this.view.find("#page3").hide();
    this.view.find("#page4").hide();

    this.view.find("#nextButton").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page1").hide();
      // Show dom element with id 'page2'
      this.view.find("#page2").show();
      this.view.find("#page3").show();
    })

    // Run function when dom element with type/class 'button' and id 'buttons' is clicked
    this.view.find("#reviewButtons").click((event)=>{
      // Hide dom element with id 'page1'
      this.view.find("#page3").hide();
      // Show dom element with id 'page2'
      this.view.find("#page4").show();
      window.socket.emit('selfReflection',$(event.target).val());
    })

    this.setActionPositive((e)=>{
      return true; // Hide model if return true
    })
    this.setActionNegative((e)=>{
      return false; // Hide model if return true
    })
  }

  setWinnerColor(){
    let value = Store.get("session/winnerColor")
    console.log(value);
    if(value == 1){
      this.view.find("#winnerColor").text("Red");
    }
    if(value == 2){
      this.view.find("#winnerColor").text("Orange");
    }
    if(value == 3){
      this.view.find("#winnerColor").text("Green");
    }
    if(value == 4){
      this.view.find("#winnerColor").text("Blue");
    }
  }

  setSheepPercentage(value){
    this.sheepPercentage = value;
    this.view.find("#sheepPercentage").text(value);
  }
}
