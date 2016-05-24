var t = new Tutorializer();

var stepArray = [
  {
    delay: 500,
    text: "Welcome, contestant.",
    advanceText: "hello",
    cede: false
  },
  {
    text: "In front of you are some words. Please consider them carefully.",
    cede: false
  },
  {
    text: "We have also given you some letters to use. Please click one of the letters now to see if everything is working as expected.",
    cede: true
  },
  {
    id: "after-play-letter",
    delay: 400,
    text: "Excellent. Hopefully you've noticed that all the 'E's have turned grey. This was as expected.",
    cede: false
  },
  {
    text: "Try another letter now, if you know what's good for you.",
    cede: true
  },
  {
    id: "after-play-letter-2",
    text: "You get points for doing that.",
    cede: false
  },
  {
    text: "Once all the letters in a word are grey, it becomes eliminated. Please eliminate the word 'STAR'. Go ahead.",
    cede: true
  },
  {
    id: "after-word-elimination",
    delay: 1000,
    text: "More points. How quaint.",
    cede: false
  },
  {
    text: "You might at some point run out of letters to play. Do not be alarmed, this is as expected. When this happens, you can click one of the words.",
    cede: true
  },
  {
    id: "after-take-word",
    text: "Now the letters from this word have been given to you to play. Be careful with them.",
    cede: false
  },
  {
    text: "Please play some more letters and eliminate some more words.",
    cede: true
  },
  {
    id: "after-no-words-left",
    delay: 1000,
    text: "Oh you've run out of words. This is as expected as well. In this scenario, the appropriate reaction is to click the big '+' button on the right-hand side.",
    cede: false
  },
  {
    text: "You can now enter any word you like. Subject to the National Language Board's Approved Diction List, obviously.",
    cede: false
  },
  {
    text: "Please enter a word using the button and then click the check button, or hit ENTER. Choose carefully.",
    cede: true
  },
  {
    id: "after-enter-word",
    text: "Good. Remember you can take the letters of these words into your hand or eliminate them for points.",
    cede: false
  },
  {
    text: "Oh and of course...",
    cede: false
  },
  {
    text: "You have 60 seconds. Get more time by eliminating words. Good luck, contestant.",
    cede: false
  },


];
t.addSteps(stepArray);
