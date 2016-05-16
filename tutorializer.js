function Tutorializer() {

  this.allComplete = false;
  this.currentStep = 0; 
  this.steps = [];
  this.overlay = $("<div></div>").addClass("tutorial-area").appendTo(document.body);
  this.messageTemplate = createMessageTemplate();

  function createMessageTemplate() {
    var m = $("<div></div>").addClass("message");
    m.append( $("<span></span>").addClass("message-text").text("test") );
    m.append( $("<span></span>").addClass("blink").text("_") );
    m.append( $("<button></button>").text("ok") );
    return m;
  }

  this.bindEvents = function() {
    this.overlay.on("click", ".message button", function (e) {
      this.completeStep(this.currentStep);
    }.bind(this));
  }

  this.addStep = function(step) {
    step.completed = false;
    if(step.cede == undefined) {
      step.cede = true;
    }
    this.steps.push(step);
  }

  this.addSteps = function(stepArray) {
    for(var s in stepArray) {
      this.addStep(stepArray[s]);
    }
  }

  this.startTutorial = function() {
    this.overlay.append(this.messageTemplate);
    this.beginStep(0);
    this.bindEvents();
  }

  this.openMessageContainer = function(messageText) {
    function animateWords(t) {
      var msg = $('.message-text');
      msg.text("");
      if(this.anim) {
        clearInterval(this.anim);
      }
      var tstring = "";
      var arr = t.split("");
      msg.text("");
      this.anim = setInterval(function(){
        if(arr.length > 0) {
          let a = arr.shift();
          tstring += a;
          msg.text(tstring);
        } else {
          clearInterval(anim);
        }
      }, 40);
    }
    if(this.overlay.hasClass("up")) {
      animateWords(messageText);
    } else {
      this.overlay.addClass("up");
      this.overlay.find(".message").show().removeClass("off");
      animateWords(messageText);
    }
  }

  this.closeMessageContainer = function() {
    this.overlay.removeClass("up");
    this.overlay.find(".message").addClass("off");
    setTimeout(function () {
      this.overlay.find(".message").hide()
    }.bind(this), 1000)
  }

  this.beginStep = function(stepNo) {
    if(stepNo >= this.steps.length) {
      this.endTutorial();
      return;
    }
    var s = this.steps[this.currentStep];
    this.openMessageContainer(s.text);
  }

  this.completeStep = function(stepNo) {
    var s = this.steps[this.currentStep];
    $(document.body).trigger("tutorial:stepComplete:" + this.currentStep);
    s.completed = true;
    if(s.callback)
      s.callback.call();
    if(!s.cede) {
      this.beginStep(++this.currentStep);
    } else {
      this.closeMessageContainer();
    }
  }

}