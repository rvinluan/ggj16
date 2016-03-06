//helpers
var randomIn = function(arr) {
  return arr[ Math.floor(Math.random() * arr.length) ];
}

//config
var startingHandSize = 5,
  maxAllowedWordLength = 6,
  minAllowedWordLength = 3,
  startingWords = 5,
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
  timer = maximumTimerLength; //1m

//jquery
var wordlist = $('.word-list');
var letterlist = $('.letter-list');
var addWordButton = $('.add-word');
var addWordInput = $('.word-input');
var addWordError = $('.word-input-error');
var scoreText = $('.score');
var takeWordIndicator = $('.take-word');

//templates
var letter_template = $("<li>").addClass("letter empty");
var word_template = $("<li>").addClass("word empty");

(function () {
  init();
})()

function tick(lastUpdate) {
  var now = new Date().getTime();
  //timer -= (now - lastUpdate);
  var prop = timer / maximumTimerLength*100;
  if(timer <= 0 && !gameOver) {
    alert("you lose");
    gameOver = true;
  }
  $('.timer-inner').width(prop + "%");
  requestAnimationFrame(function () {
    tick(now);
  });
}

function init() {
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
    replacing.removeClass("empty").text(draw("hard"));
  }
  initStage();
  scoreText.text(score);

  //events
  addWordButton.on('click', addWord);
  addWordInput.find('input')
    .on('keyup', function (e) {
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
    .on('keydown', function(e){
      if(e.which == 13 && isAddingWord) {
        //enter key, and input is up
        addWord();
        addWord();
      } else if(e.which == 27) {
        //esc
        endAddWord();
      }
    })
    .on('blur', function (e) {
      var validity = isValidWord($(this).val());
      if(!validity.bool) {
        //endAddWord();
      }
    })
  $('.word-list')
    .on('mouseover', '.word', function (e) {
      if(!$(this).hasClass('empty')) {
        takeWordIndicator.appendTo(this).show();
      }
    })
    .on('mouseout', '.word', function (e) {
      takeWordIndicator.hide();
    })
    .on('click', '.word', function (e) {
      if(!$(this).hasClass('empty') && !isAddingWord) {
        takeWord(this);
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
}

function initStageOld() {
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
      //start the timer!
      requestAnimationFrame(function (e) {
          tick(new Date().getTime());
      });
    }
  })
}

function initStage() {
  $.ajax('/words.txt', {
    dataType: 'text',
    success: function(data) {
      dictionary = data.split('\n');
      // var shortDictionary = dictionary.filter(function (e) {
      //   return e.length == minAllowedWordLength;
      // })
      // for(var i = 0; i < startingWords; i++) {
      //   var replacing = wordlist.find('.empty').first();
      //   var newWord = shortDictionary.randomIn();
      //   replacing
      //     .removeClass('empty loading')
      //     .attr("data-word", newWord)
      //     .html(lettersToHtml(newWord));
      // }
      initStageOld();
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

function draw(difficulty) {
  var letterSets = {
    easy: "rstlne",
    medium: "etaoinshrdlu",
    hard: "abcdefghijklmnopqrstuvwxyz"
  }
  var letters = (letterSets[difficulty]).split('');
  return letters[Math.floor(Math.random()*letters.length)];
}

function addLetter() {
  if(letterlist.find('.empty').length <= 0) {
    return;
  }
  else {
    var replacing = letterlist.find('.empty').first();
    replacing.removeClass("empty").text(draw("medium"));
  }
}

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
    addWordButton.find('span').text("○");
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
    addWordButton.find('span').text("+");
    addWordInput.hide();
    isAddingWord = false;

  }
}

function endAddWord() {
  if(wordlist.find('.word').length < 15) {
    word_template.clone().appendTo(wordlist);
  }
  addWordButton.find('span').text("+");
  addWordInput.hide();
  isAddingWord = false;
}

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
      parent.remove();
      if(wordlist.find('.word').length < 15)
        word_template.clone().appendTo(wordlist);
      score += clearWordPoints;
      scoreText.text(score);
      timer += 10*1000;
      if(timer >= maximumTimerLength) {
        timer = maximumTimerLength;
      }
    }
  }
  letterBlock.remove();
  letter_template.clone().appendTo(letterlist);
  score += arr.length;
  scoreText.text(score);
}

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
  } else {
    //can't
  }
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
