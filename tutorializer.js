//modified version of http://stackoverflow.com/questions/1408289/how-can-i-do-string-interpolation-in-javascript
//using #{} instead of {}
String.prototype.supplant = function (o) {
    return this.replace(/#{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

function Tutorializer() {

  this.allComplete = false;
  this.currentStep = 0; 
  this.steps = [];
  this.overlay = $("<div></div>").addClass("tutorial-area").appendTo(document.body);
  this.messageTemplate = createMessageTemplate();
  this.allCompleteCallback = null;
  this.waiting = false;

  function createMessageTemplate() {
    var m = $("<div></div>").addClass("message off").css("display", "none");
    m.append( $("<span></span>").addClass("message-text") );
    m.append( $("<span></span>").addClass("blink").text("_") );
    m.append( $("<button></button>").text("ok") );
    return m;
  }

  this.bindEvents = function() {
    this.overlay.on("click", ".message button", function (e) {
      this.completeStep(this.currentStep);
      e.stopPropagation();
    }.bind(this));
    this.overlay.on("click", ".message", function(e) {
      if(window.anim) {
        clearInterval(window.anim);
        this.overlay.find(".message-text").text(this.steps[this.currentStep].text);
      }
    }.bind(this));
    $(document.body).on("tutorial:trigger", function (e, stepId, stepData) {
      var stepNo = this.getStepNo(stepId);
      if(this.waiting && stepNo >= this.currentStep) {
        this.currentStep = stepNo;
        this.beginStep(stepNo, stepData);
      }
    }.bind(this));
  }

  this.addStep = function(step) {
    // if(step.cede == undefined) {
    //   step.cede = true;
    // }
    this.steps.push(step);
  }

  this.addSteps = function(stepArray) {
    for(var s in stepArray) {
      this.addStep(stepArray[s]);
    }
  }

  this.getStepNo = function(stepId) {
    for(var s in this.steps) {
      if(this.steps[s].id && this.steps[s].id == stepId) {
        return s;
      }
    }
    return -1;
  }

  this.startTutorial = function() {
    if(localStorage.getItem("tutorialComplete") == "true") {
      return;
    }
    this.overlay.append(this.messageTemplate);
    this.bindEvents();
    this.beginStep(0);
    $(document.body).trigger("tutorial:started");
    $(document.body).addClass("tutorial-in-progress");
  }

  this.openMessageContainer = function(messageText, advanceText) {
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
          clearInterval(this.anim);
        }
      }, 40);
    }
    if(this.overlay.hasClass("up")) {
      animateWords(messageText);
      this.overlay.find("button").text(advanceText);
    } else {
      this.overlay.addClass("up");
      this.overlay.find(".message").show().removeClass("off");
      animateWords(messageText);
      this.overlay.find("button").text(advanceText);
    }
  }

  this.closeMessageContainer = function() {
    this.overlay.removeClass("up");
    this.overlay.find(".message").addClass("off");
    setTimeout(function () {
      this.overlay.find(".message").hide()
    }.bind(this), 1000)
  }

  this.beginStep = function(stepNo, stepData) {
    console.log("sd:"+stepData);
    if(stepNo >= this.steps.length) {
      this.endTutorial();
      return;
    }
    var s = this.steps[stepNo];
    var d = s.delay ? s.delay : 0;
    this.waiting = false;
    if(s.text.indexOf("#{") !== -1) {
      s.text = s.text.supplant(stepData); 
    }
    setTimeout(function () {
      this.openMessageContainer(s.text, s.advanceText ? s.advanceText : "ok");
    }.bind(this), d);
  }

  this.completeStep = function(stepNo) {
    var s = this.steps[this.currentStep];
    $(document.body).trigger("tutorial:stepComplete:" + this.currentStep);
    if(s.callback)
      s.callback.call();
    if(!s.cede) {
      this.beginStep(++this.currentStep);
    } else {
      this.closeMessageContainer();
      this.waiting = true;
    }
  }

  this.endTutorial = function () {
    localStorage.setItem("tutorialComplete", true);
    this.allComplete = true;
    this.closeMessageContainer();
    $(document.body).trigger("tutorial:allComplete");
    $(document.body).removeClass("tutorial-in-progress").addClass("tutorial-complete");
    if(this.allCompleteCallback) {
      this.allCompleteCallback.call();
    }
  }

}
