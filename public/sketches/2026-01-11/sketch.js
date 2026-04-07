let currentKey = "";
let prevKey = "";
const charList = [];
let textArea;

function setup() {
  createCanvas(400, 400);
  textArea = document.getElementById("textarea");
}

function draw() {
  clear();
  if(keyIsPressed) currentKey = key;
  if(currentKey) {
    if (currentKey !== prevKey) {
      
    if(["Shift", "Tab", "Meta", "Control", "Alt", "CapsLock"].find((elem) => elem === currentKey)) return;
      
    if(currentKey === "Backspace") {
      charList.pop();
    } else {charList.push({char: currentKey, count: 1})}
    } else {
      if(charList.length > 0 && key !== "Backspace") charList[charList.length-1].count++;
    }
    currentKey = key;
  }
  
  prevKey = currentKey;
  currentKey = "";
  
  let currentText = "";
  for(let i=0; i<charList.length; i++) {
    const char = charList[i];
    currentText += char.char === "Enter" ? `<br/>` : `<span id="char-${i}">${char.char}</span>`;
  }
  
  textArea.innerHTML = currentText;
  
  for(let i=0; i<charList.length; i++) {
    if(charList[i].char === "Enter") continue;
    const weightOffset = charList[i].count * 100;
    const charSpan = document.getElementById(`char-${i}`);
    charSpan.style = `font-weight: ${min(900, 100+weightOffset)}`;
  }
}