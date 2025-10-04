//check if something is a text box
function checkTextBox(thing) {
  return thing.tagName === 'INPUT' || 
         thing.tagName === 'TEXTAREA' || 
         thing.contentEditable === 'true';
}

//get text from a text box
function getText(textBox) {
  if (textBox.contentEditable === 'true') {
    return textBox.textContent;
  } else {
    return textBox.value;
  }
}

//put new text in a text box
function giveBack(textBox, newText) {
  if (textBox.contentEditable === 'true') {
    textBox.textContent = newText;
  } else {
    textBox.value = newText;
  }
}

//ask background to hide personal info
function askBG(textBox) {
  //get what user typed
  var userText = getText(textBox);
  
  //skip if too short
  if (!userText || userText.length < 3) {
    return;
  }

  //ask background script for help
  chrome.runtime.sendMessage({
    action: 'hidePII',
    text: userText
  })
  .then(function(response) {
    if (response && response.success) {
      giveBack(textBox, response.hiddenText);
    }
  })
  .catch(function(error) {
    console.log('Error:', error);
  });
}

//user types something
function userIsTyping(event) {
  var textBox = event.target;
  
  //only care about text boxes
  if (checkTextBox(textBox)) {
    //delete old timer
    if (textBox.waitTimer) {
      clearTimeout(textBox.waitTimer);
    }
    
    //wait 1 second, then check
    textBox.waitTimer = setTimeout(function() {
      askBG(textBox);
    }, 1000);
  }
}

//start watching for typing
document.addEventListener('input', userIsTyping);
