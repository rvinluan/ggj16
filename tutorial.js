var t = new Tutorializer();

var stepArray = [
  {
    delay: 1000,
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
    cede: false
  }
];
t.addSteps(stepArray);