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
      positiveText:"Close",
      showHeaderClose:false,
      showFooterClose:false,
      showFooterPositive:true,
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
    this.setActionPositive(()=>{
      window.location.replace("https://tinyurl.com/2fcpre6");
    })
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
