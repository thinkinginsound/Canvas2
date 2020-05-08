/*
Purpose:

Functions:
 
*/

import { DefaultModal } from "./defaultModal.js"

export class ErrorModal extends DefaultModal {
  constructor(errorTitle = "Error", errorMessage="Message"){
    let options = {
      id:"error-modal",
      title:"Error",
      positiveText:"Agree",
      negativeText:"Disagree",
      showHeaderClose:true,
      showFooterClose:true,
      showFooterPositive:false,
      showFooterNegative:false,
    }
    super(options);
    this.errorTitle = errorTitle;
    this.errorMessage = errorMessage;
    this.setBody($(`
      <div>
        <h4 id="error_title">${this.errorTitle}</h4>
        <p id="error_message">${this.errorMessage}</p>
      </div>
    `));
  }
  setSetErrorTitle(errorTitle){
    this.errorTitle = errorTitle;
    this.view.find("#error_title").text(errorTitle);
  }
  setSetErrorMessage(errorMessage){
    this.errorMessage = errorMessage;
    this.view.find("#error_message").text(errorMessage);
  }
}
