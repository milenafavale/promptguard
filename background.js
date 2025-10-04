//API key
const myApiKey = 'XXX';

//LLM url
const aiWebsite = 'https://api.groq.com/openai/v1/chat/completions';

//ask AI to hide personal information
function hidePII(userText) {
  //start time
  var start = Date.now();
  
  //tell AI what to do
  const instructions = `You are a PII detection system. Replace ALL personally identifiable information with *** in the text below. Return ONLY the modified text with NO explanations.

Replace these with ***:
-NAMES: first names, last names, full names (John, Smith, John Smith, Maria Rossi)
-EMAILS: all email addresses (john@email.com, user@domain.it)
-PHONE NUMBERS: all formats (555-1234, +39 123 456 7890, (555) 123-4567)
-ADDRESSES: street addresses with or without names (123 Main St, Via Giuseppe Verdi 7, John F Kennedy Street 42)
-BIRTH DATES: all date formats (12/25/1990, December 25 1990, 25-12-1990, born on 1990)
-BIRTH PLACES: cities, countries of birth (born in Rome, place of birth Milan)
-CREDIT CARDS: all card numbers, even partial (4532 1234 5678 9012, 1234-5678-9012-3456)
-IBAN: Bank account numbers (IT60 X054 2811 1010 0000 0123 456, GB29 NWBK 6016 1331 9268 19)
-SSN/TAX ID: social security, tax codes (123-45-6789, RSSMRA80A01H501X)
-ID NUMBERS: driver license, passport, ID card numbers
-FINANCIAL INFO: account numbers, routing numbers

THIS IMPORTANT RULES:
1.Replace COMPLETE PII with *** (not partial)
2.If no PII found, return the original text EXACTLY as given
3.DO NOT add explanations like "no PII detected" or "modified text:"
4.Return ONLY the text with PII replaced by ***

Examples:
-"Hi John Smith" -> "Hi ***"
-"My email is john@email.com" -> "My email is ***"
-"Born on 12/25/1990 in Rome" -> "Born on *** in ***"
-"My card is 4532 1234 5678 9012" -> "My card is ***"
-"IBAN: IT60 X054 2811 1010 0000 0123 456" -> "IBAN: ***"
-"Hello friend" -> "Hello friend"
-"How are you?" -> "How are you?"

Text to analyze: ${userText}`;

  //send message to AI
  return fetch(aiWebsite, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + myApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'compound-beta', //other models tested: gemma2-9b-it and llama3-8b-8192
      messages: [{ 
        role: 'user', 
        content: instructions 
      }],
      temperature: 0.1,
      max_tokens: 1000
    })
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    var time = Date.now() - start;
    console.log('Time:', time); //will be used for models comparision
    
    let aiAnswer = data.choices[0].message.content.trim();
    
    //if AI gives explanations, just return original text
    if (aiAnswer.includes('Modified text:') || 
        aiAnswer.includes('No PII') || 
        aiAnswer.includes('detected')) {
      return userText;
    }
    
    return aiAnswer;
  })
  .catch(function(error) { //check AI errors
    console.log('AI error:', error); //if there are errors: log
    return userText; //if not: give back original
  });
}

//listen when webpage asks for help
chrome.runtime.onMessage.addListener(function(message, sender, sendReply) {
  if (message.action === 'hidePII') {
    hidePII(message.text)
      .then(function(hiddenText) {
        sendReply({ success: true, hiddenText: hiddenText });
      })
      .catch(function() {
        sendReply({ success: false });
      });
    return true; //keep connection open
  }
});
