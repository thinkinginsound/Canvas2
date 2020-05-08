/*
Purpose:

Functions:

*/

class DefaultModal {
  constructor(options){
    this.options = {
      id:"default_modal",
      title:"Default Modal",
      showHeader:true,
      showHeaderClose:true,
      showFooter:true,
      showFooterPositive:true,
      showFooterNegative:false,
      showFooterClose:true,
      showBody:true,
      body:$(`<span>default content</span>`),
      positiveText:"Understood",
      negativeText:"Decline",
      closeText:"Close",
      actionPositive:function(e){console.log("Default action positive"); return false},
      actionNegative:function(e){console.log("Default action negative"); return true},
      ...options
    }
    this.build();
  }
  build(){
    this.view = $(`
      <div class="modal fade" id="${this.options.id}" data-backdrop="static" tabindex="-1" role="dialog" aria-labelledby="" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="staticBackdropLabel"></h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer">
              <button type="button" id="actionclose" class="btn btn-secondary" data-dismiss="modal">Close</button>
              <button type="button" id="actionnegative" class="btn btn-danger" data-dismiss="modal">Decline</button>
              <button type="button" id="actionpositive" class="btn btn-primary">Understood</button>
            </div>
          </div>
        </div>
      </div>
    `);
    this.setShowHeader(this.options.showHeader);
    this.setShowHeaderClose(this.options.showHeaderClose);
    this.setShowBody(this.options.showBody);
    this.setShowFooter(this.options.showFooter);

    this.setShowFooterPositive(this.options.showFooterPositive);
    this.setShowFooterNegative(this.options.showFooterNegative);
    this.setShowFooterClose(this.options.showFooterClose);

    this.setBody(this.options.body);
    this.setTitle(this.options.title);
    this.setPositiveText(this.options.positiveText);
    this.setNegativeText(this.options.negativeText);

    this.setActionPositive(this.options.actionPositive);
    this.setActionNegative(this.options.actionNegative);
    this.view.find(".modal-footer button#actionpositive").click((e)=>this.actionPositive(e));
    this.view.find(".modal-footer button#actionnegative").click((e)=>this.actionNegative(e));
    this.view.on('hidden.bs.modal', (e) => {
      this.view.remove();
    })
  }
  show(parent){
    if(typeof parent == "undefined")parent = $('body');
    parent.append(this.view);
    this.view.modal('show')
  }

  setShowHeader(state){
    this.options.showHeader = state;
    if(this.options.showHeader)this.view.find(".modal-header").show()
    else this.view.find(".modal-header").hide()
  }
  setShowHeaderClose(state){
    this.options.showHeaderClose = state;
    if(this.options.showHeaderClose)this.view.find(".modal-header button.close").show()
    else this.view.find(".modal-header button.close").hide()
  }
  setShowBody(state){
    this.options.showBody = state;
    if(this.options.showBody)this.view.find(".modal-body").show()
    else this.view.find(".modal-body").hide()
  }
  setShowFooter(state){
    this.options.showFooter = state;
    if(this.options.showFooter)this.view.find(".modal-footer").show()
    else this.view.find(".modal-footer").hide()
  }

  setShowFooterPositive(state){
    this.options.showFooterPositive = state;
    if(this.options.showFooterPositive)this.view.find(".modal-footer button#actionpositive").show()
    else this.view.find(".modal-footer button#actionpositive").hide()
  }
  setShowFooterNegative(state){
    this.options.showFooterNegative = state;
    if(this.options.showFooterNegative)this.view.find(".modal-footer button#actionnegative").show()
    else this.view.find(".modal-footer button#actionnegative").hide()
  }
  setShowFooterClose(state){
    this.options.showFooterClose = state;
    if(this.options.showFooterClose)this.view.find(".modal-footer button#actionclose").show()
    else this.view.find(".modal-footer button#actionclose").hide()
  }

  setBody(data){
    this.options.body = data;
    this.view.find(".modal-body").empty()
    this.view.find(".modal-body").append(this.options.body);
  }
  setTitle(title){
    this.options.title = title;
    this.view.find(".modal-title").text(this.options.title);
  }
  setPositiveText(text){
    this.options.positiveText = text;
    this.view.find(".modal-footer button#actionpositive").text(this.options.positiveText);
  }
  setNegativeText(text){
    this.options.negativeText = text;
    this.view.find(".modal-footer button#actionnegative").text(this.options.negativeText);
  }
  setActionPositive(action){
    this.options.actionPositive = action;
  }
  setActionNegative(action){
    this.options.actionNegative = action;
  }

  actionPositive(e){
    e.preventDefault();
    let response = this.options.actionPositive(e)
    if(response){
      this.view.modal('hide');
    }
    return response;
  }
  actionNegative(e){
    e.preventDefault();
    return this.options.actionNegative(e);
  }
}

export { DefaultModal };
