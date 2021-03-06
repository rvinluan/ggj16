//helpers
var randomIn = function(arr) {
  return arr[ Math.floor(Math.random() * arr.length) ];
}

//config
var startingHandSize = 5,
  maxAllowedWordLength = 6,
  minAllowedWordLength = 3,
  startingWords = 4,
  clearWordPoints = 10,
  maximumTimerLength = 1000*60; //1m

//globals
var stage = {
    words: []
  },
  isAddingWord = false,
  score = 0,
  gameOver = false,
  dictionary = [],
  timer = maximumTimerLength, //1m
  scoreQueue = [],
  scoreCheck = null,
  screenList = ["main-menu", "gameplay", "game-over"],
  currentScreen = 0;

//jquery
var wordlist = $('.word-list');
var letterlist = $('.letter-list');
var addWordButton = $('.add-word');
var addWordInput = $('.word-input');
var addWordError = $('.word-input-error');
var scoreText = $('.score');
var takeWordIndicator = $('.take-word');
var scoreArea = $('.score-queue');

//templates
var letter_template = $("<li>").addClass("letter empty");
var word_template = $("<li>").addClass("word empty");
var score_item_template = $("<li>").addClass("scoreItem");

(function () {
  init();
})()

function tick(lastUpdate) {
  var now = new Date().getTime();
  timer -= (now - lastUpdate);
  var prop = timer / maximumTimerLength*100;
  if(timer <= 0 && !gameOver) {
    // alert("you lose");
    gameOver = true;
    endTheGame();
  } else {
    $('.timer-inner').width(prop + "%");
    requestAnimationFrame(function () {
      tick(now);
    });
  }
}

function init() {
  loadDictionary();
  resetStage();
  resetScore();

  //main menu events
  $(document.body).on('keydown', function (e) {
    if(e.which == 187) {
      currentScreen++;
      if(currentScreen >= screenList.length) {
        currentScreen = 0;
      }
      $(document.body).removeClass(screenList.join(" ")).addClass(screenList[currentScreen]);
    }
  })

  $("#main-menu button").on('click', function () {
    currentScreen = 1;
    $(document.body).removeClass(screenList.join(" ")).addClass(screenList[currentScreen]);
    $(this).blur();
    if(localStorage.getItem("tutorialComplete") == "true") {
      resetTimer();
      t.allComplete = true;
    } else {
      t.allCompleteCallback = function () {
        resetTimer();
      }
      t.startTutorial();
    }
  })

  //gameplay events
  $(document.body).on('keydown', function (e) {
    //don't go back on backspace
    if(e.which == 8) {
      e.preventDefault();
    }
    //esc
    if(e.which == 27) {
      if(isAddingWord && !addWordInput.find('input').is(":focus")) {
        endAddWord();
      }
    }
  })
  addWordButton.on('click', addWord);
  $('.word-list')
    .on('keyup', 'input', function (e) {
      if($(this).val().length > maxAllowedWordLength) {
        $(this).addClass('invalid');
        console.log('invalid!');
      } else {
        $(this).removeClass('invalid');
        if(e.which !== 13) {
          addWordError.hide();
        }
      }
    })
    .on('keydown', 'input', function(e){
      if(e.which == 13 && isAddingWord) {
        //enter key, and input is up
        addWord();
        console.log('enter key hit!');
        console.log(t.allComplete);
        if(t.allComplete) {
          addWord();
        }
      } else if(e.which == 27) {
        //esc
        endAddWord();
      } else if(e.which == 8) {
        //backspace
        //stop prop to prevent hitting the preventDefault that is on the body
        e.stopPropagation();
      }
    })
    .on('blur', 'input', function (e) {
      var validity = isValidWord($(this).val());
      if(!validity.bool) {
        // endAddWord();
      }
    })
    .on('mouseover', '.word', function (e) {
      if($(document.body).hasClass("no-word-taking")) {
        return;
      }
      if(!$(this).hasClass('empty')) {
        takeWordIndicator.appendTo(this).show();
      }
    })
    .on('mouseout', '.word', function (e) {
      takeWordIndicator.hide();
    })
    .on('click', '.word', function (e) {
      if($(document.body).hasClass("no-word-taking")) {
        return;
      }
      if(!$(this).hasClass('empty')) {
        takeWord(this);
        if(isAddingWord) {
          endAddWord();
        }
      } else {
        addWord();
      }
    });
  $('.letter-list')
    .on('mouseover', '.letter', function(e){
      if(!$(this).hasClass('empty')) {
        letterHighlight($(this).text());
      }
    })
    .on('mouseout', '.letter', function (e) {
      $('.highlighted').removeClass('highlighted');
    })
    .on('click', '.letter', function (e) {
      if(!$(this).hasClass('empty')) {
        playLetter(this);
      }
    });
  $('.add-letter')
    .on('click', function (e) {
      addLetter();
    });

  //restart
  $("#game-over button").on('click', function () {
    gameOver = false;
    currentScreen = 1;
    $(document.body).removeClass(screenList.join(" ")).addClass(screenList[currentScreen]);
    $(this).blur();
    resetStage();
    resetScore();
    resetTimer();
  })
}

//reset functions
function resetStage() {
  letterlist.empty();
  wordlist.find(".word").remove();
  stage.words = [];
  for(var i = 0; i < 15; i++) {
    if(i < 10) {
      letter_template.clone().appendTo(letterlist);
    }
    if(i < startingWords) {
      word_template.clone().addClass('loading').appendTo(wordlist);
    } else {
      word_template.clone().appendTo(wordlist);
    }
  }
  for(var i = 0; i < startingHandSize; i++) {
    var replacing = letterlist.find('.empty').first();
    if(t.allComplete || localStorage.getItem("tutorialComplete") == "true") {
      replacing.removeClass("empty").text(draw("easy"));
    } else {
      //start with the letters S-T-A-R-T
      replacing.removeClass("empty").text("start".split("")[i]);
    }
  }
  if(t.allComplete || localStorage.getItem("tutorialComplete") == "true") {
    loadStageRandom();
  } else {
    loadStageTutorial();
  }
  endAddWord();
}

function resetScore() {
  score = 0;
  scoreQueue = [];
  scoreArea.empty();
  scoreText.text(score);
  clearInterval(scoreCheck);
  scoreCheck = setInterval(processScoreQueue, 600);
}

function resetTimer() {
  timer = maximumTimerLength;
  //start the timer!
  requestAnimationFrame(function (e) {
      tick(new Date().getTime());
  });
}

function loadStageRandom() {
  $.getJSON({
    url: 'http://api.wordnik.com:80/v4/words.json/randomWords',
    data: {
      hasDictionaryDef: true,
      minDictionaryCount: 2,
      minLength: 3,
      maxLength: 5,
      minCorpusCount: 10000,
      limit: startingWords,
      api_key: "ac26403960617da7fc7050444990a02bf0ea9df7a294ce8bc"
    },
    success: function (data) {
      for(var i = 0; i < data.length; i++) {
        var replacing = wordlist.find('.empty').first();
        replacing
          .removeClass('empty loading')
          .attr("data-word", data[i].word)
          .html(lettersToHtml(data[i].word));
        stage.words.push(data[i].word);
      }
    }
  })
}

function loadStageTutorial() {
  var tutorialWords = 'star,diets,die,tied'.split(',');
  for(var i = 0; i < tutorialWords.length; i++) {
    var replacing = wordlist.find('.empty').first();
    replacing
      .removeClass('empty loading')
      .attr("data-word", tutorialWords[i])
      .html(lettersToHtml(tutorialWords[i]));
    stage.words.push(tutorialWords[i]);
  }
}

function loadDictionary() {
  $.ajax('words.txt', {
    dataType: 'text',
    success: function(data) {
      dictionary = data.split('\n');
      var shortDictionary = dictionary.filter(function (e) {
        return e.length == minAllowedWordLength;
      })
    }
  })
}

function lettersToHtml(str) {
  var letters = str.split('');
  var finalString = "";
  for( var l in letters ) {
    if(letters.hasOwnProperty(l)) {
      finalString += "<span>" + letters[l] + "</span>";
    }
  }
  return finalString;
}

//generate a random letter
function draw(difficulty) {
  var letterSets = {
    easy: "rstlne",
    medium: "etaoinshrdlu",
    hard: "abcdefghijklmnopqrstuvwxyz"
  }
  var letters = (letterSets[difficulty]).split('');
  return letters[Math.floor(Math.random()*letters.length)];
}

//when the plus button is clicked, add a random letter
function addLetter() {
  if(letterlist.find('.empty').length <= 0) {
    return;
  }
  else {
    var replacing = letterlist.find('.empty').first();
    replacing.removeClass("empty").text(draw("medium"));
  }
}

//either:
//show the form for inputting a word into the list
//or
//close the form and add the word
function addWord() {
  if(!isAddingWord) {
    var firstEmptySpace = wordlist.find('.empty').first();
    if(firstEmptySpace.length == 0) {
      endAddWord();
      return;
    }
    addWordInput.insertAfter(firstEmptySpace);
    firstEmptySpace.remove();
    addWordInput.show().find('input').val('').focus();
    addWordButton.find('.check-icon').show();
    addWordButton.find('.plus-icon').hide();
    isAddingWord = true;
  } else {
    var wordContent = addWordInput.find('input').val();
    var validityObject = isValidWord(wordContent);
    if(!validityObject.bool) { 
      addWordError.show().text(validityObject.reason);
      return; 
    } else {
      addWordError.hide();
    }
    stage.words.push(wordContent);
    var newWord = $("<li>")
      .addClass("word")
      .attr("data-word", wordContent)
      .html(lettersToHtml(wordContent));
    newWord.insertAfter(addWordInput);
    addWordButton.find('.plus-icon').show();
    addWordButton.find('.check-icon').hide();
    addWordInput.hide();
    isAddingWord = false;
    //tutorial trigger
    if(!t.allComplete && t.waiting){
      $(document.body).trigger("tutorial:trigger", "after-enter-word");
    }
  }
}

//close the form without adding a word to the word list
function endAddWord() {
  if(wordlist.find('.word').length < 15) {
    word_template.clone().appendTo(wordlist);
  }
  addWordButton.find('.plus-icon').show();
  addWordButton.find('.check-icon').hide();
  addWordInput.hide();
  isAddingWord = false;
}

//find all the letter in all the words
function findMatchingLetters(ltr) {
  var words = wordlist.find('.word').not('.empty');
  var results = [];
  for( var i = 0; i < words.length; i++ ) {
    var letters = $(words[i]).find('span').not('.played');
    for( var j = 0; j < letters.length; j++ ) {
      if($(letters[j]).text().toLowerCase() == ltr.toLowerCase()) {
        results.push(letters[j]);
      }
    }
  }
  return results;
}

function letterHighlight(ltr) {
  var arr = findMatchingLetters(ltr);
  $(arr).addClass('highlighted');
}

//happens when you click a letter from  your hand.
function playLetter(letterBlock) {
  var arr = findMatchingLetters($(letterBlock).text());
  if(arr.length <= 0) {
    return;
  }
  $(arr).addClass('played');
  $(arr).removeClass('highlighted');
  for(var l in arr) {
    var parent = $(arr[l]).parent();
    var wordLength = parent.attr("data-word").length;
    var played = parent.find(".played");
    if(played.length == wordLength) {
      scoreWord(parent);
    }
  }
  letterBlock.remove();
  letter_template.clone().appendTo(letterlist);
  addScoreToQueue(arr.length);

  //tutorial trigger if appropriate
  if(!t.allComplete && t.waiting){
    if(score == 0) {
      var playedLetter = $(letterBlock).text().toUpperCase();
      $(document.body).trigger("tutorial:trigger", ["after-play-letter",  {letter: playedLetter}]);
    } else {
      $(document.body).trigger("tutorial:trigger", "after-play-letter-2");
    }
  }

}

function scoreWord(wordElem) {
  wordElem.addClass("strikethrough");
  wordElem.on("animationend webkitAnimationEnd", function(){
    wordElem.remove();
    if(wordlist.find('.word').length < 15)
      word_template.clone().appendTo(wordlist);
    //score queue
    addScoreToQueue(clearWordPoints);
    //add timer
    timer += 10*1000;
    if(timer >= maximumTimerLength) {
      timer = maximumTimerLength;
    }
    //tutorial trigger
    if(!t.allComplete && t.waiting){
      if(wordlist.find("li:not(.empty)").length > 0) {
        $(document.body).trigger("tutorial:trigger", "after-word-elimination");
      } else {
        $(document.body).trigger("tutorial:trigger", "after-no-words-left");
      }
    }
  })
}

//take the word's unplayed letters into your hand.
function takeWord(wordElem) {
  var ltrs = $(wordElem).find('span').not('.played').not('.take-word');
  var emptyHandSpots = letterlist.find('.empty').length;
  if(ltrs.length <= emptyHandSpots) {
    ltrs.each(function (e) {
      var replacing = letterlist.find('.empty').first();
      replacing.removeClass("empty").text($(this).text());
    })
    wordElem.remove();
    word_template.clone().appendTo(wordlist);
    if(!t.allComplete && t.waiting){
      $(document.body).trigger("tutorial:trigger", "after-take-word");
    }
  } else {
    //can't
  }
}

function addScoreToQueue(pts) {
  var newScore = score_item_template.clone().text(pts);
  scoreQueue.push(pts);
  scoreArea.append(newScore);
  setTimeout( () => {newScore.addClass("in-queue")} , 1);
  //these happen too much
  // setTimeout( processScoreQueue, 2000 );
}

function processScoreQueue() {
  if(scoreQueue.length == 0) {
    return;
  }
  var pts = scoreQueue.shift();
  var removed = scoreArea.find("li:first-child");
  score += pts;
  scoreText.text(score);
  removed.addClass("out-of-queue");
  removed.on("transitionend webkitTransitionend", function () {
    $(this).remove();
  });
}

function isValidWord(word) {
  var ro = {
    bool: true,
    reason: ""
  }
  if(!word) {
    ro.bool = false;
    ro.reason = "Can't be empty";
  } else
  if(word.length < minAllowedWordLength) { 
    ro.bool = false;
    ro.reason = "Too short";
  } else
  if(word.length > maxAllowedWordLength) {
    ro.bool = false;
    ro.reason = "Too long";
  } else
  if(word.match(/^\w*$/g) === null) {
    ro.bool = false;
    ro.reason = "Contains invalid characters";
  } else
  if(stage.words.indexOf(word) !== -1) {
    ro.bool = false;
    ro.reason = "Already used";
  } else
  if(dictionary.indexOf(word) == -1) {
    ro.bool = false;
    ro.reason = "Not a word";
  }
  return ro;
}

function resetGameOverScreen() {
  $("#high-score-text").show();
  $("#game-over h2").text("Oh Dear.");
  $("#new-high-score-text").hide();
}

function endTheGame() {
  resetGameOverScreen();
  currentScreen = 2;
  var hs = parseInt(localStorage.getItem("high-score"), 10);
  $(document.body).removeClass(screenList.join(" ")).addClass(screenList[currentScreen]);
  if(score > hs || isNaN(hs)) {
    localStorage.setItem("high-score", score);
    $("#high-score-text").hide();
    $("#game-over h2").text("Rejoice!");
    $("#new-high-score-text").show();
  } else {
    $("#high-score").text(localStorage.getItem("high-score"));
  }
  $("#final-score").text(score);
}
