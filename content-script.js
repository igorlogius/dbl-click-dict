/* global browser */

let DEFAULT_LANGUAGE = "en",
  DEFAULT_TRIGGER_KEY = "none",
  LANGUAGE,
  TRIGGER_KEY,
  showMeaningTID = null;

async function showMeaning(event) {
  let info = getSelectionInfo(event);
  if (!info) {
    return;
  }

  // create defintion container
  let createdDiv = createDiv(info);

  // fill it with data
  let response = await retrieveMeaning(info);

  if (response.content) {
    appendToDiv(createdDiv, response.content);
  } else {
    noMeaningFound(createdDiv);
  }
}

function getSelectionInfo(event) {
  let word;
  let boundingRect;

  let selection = null;

  try {
    if (window.getSelection) {
      selection = window.getSelection();
    } else if (typeof document.selection != "undefined") {
      selection = document.selection;
    }

    boundingRect = getSelectionCoords(selection);
    let selectedRange = selection.getRangeAt(0);
    word = selectedRange.toString();

    if (word.length < 1) {
      return null;
    }

    let top = boundingRect.top + window.scrollY,
      bottom = boundingRect.bottom + window.scrollY,
      left = boundingRect.left + window.scrollX;

    return {
      top: top,
      bottom: bottom,
      left: left,
      word: word,
      //clientY: window.pageYOffset, //event.clientY,
      height: boundingRect.height,
    };
  } catch (e) {
    return null; // selection not available
  }
}

function retrieveMeaning(info) {
  return browser.runtime.sendMessage({
    word: info.word.toLowerCase(),
    lang: LANGUAGE,
    time: Date.now(),
  });
}

function createDiv(info) {
  let hostDiv = document.createElement("div");

  hostDiv.className = "dictionaryDiv";

  /*
  const body_bounding_rect = document.body.getBoundingClientRect();


	if(info.left > body_bounding_rect.width/2){
	  const val = `calc(${info.left - 10}px - 25vw)`;
		console.debug(val);
	  hostDiv.style.left = val;
	}else{
	  hostDiv.style.left = info.left - 10 + "px";
	}
	console.debug(hostDiv.style.left);
	*/

  hostDiv.style.position = "absolute";
  hostDiv.style.zIndex = "1000000";
  hostDiv.attachShadow({ mode: "open" });

  const isDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  let shadow = hostDiv.shadowRoot;
  let style = document.createElement("style");
  //style.textContent = "*{ all: initial}";
  //  style.textContent = ".mwe-popups{background:lightgray;position:absolute;z-index:110;-webkit-box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;padding:0;font-size:14px;min-width:300px;border-radius:2px}.mwe-popups.mwe-popups-is-not-tall{width:320px}.mwe-popups .mwe-popups-container{color:#222;margin-top:-9px;padding-top:9px;text-decoration:none}.mwe-popups.mwe-popups-is-not-tall .mwe-popups-extract{min-height:40px;max-height:140px;overflow:hidden;margin-bottom:47px;padding-bottom:0}.mwe-popups .mwe-popups-extract{margin:16px;display:block;color:#222;text-decoration:none;position:relative} .mwe-popups.flipped_y:before{content:'';position:absolute;border:8px solid transparent;border-bottom:0;border-top: 8px solid #a2a9b1;bottom:-8px;left:10px}.mwe-popups.flipped_y:after{content:'';position:absolute;border:11px solid transparent;border-bottom:0;border-top:11px solid #fff;bottom:-7px;left:7px} .mwe-popups.mwe-popups-no-image-tri:before{content:'';position:absolute;border:8px solid transparent;border-top:0;border-bottom: 8px solid #a2a9b1;top:-8px;left:10px}.mwe-popups.mwe-popups-no-image-tri:after{content:'';position:absolute;border:11px solid transparent;border-top:0;border-bottom:11px solid #fff;top:-7px;left:7px} .audio{background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcUlEQVQ4y2P4//8/AyUYQhAH3gNxA7IAIQPmo/H3g/QA8XkgFiBkwHyoYnRQABVfj88AmGZcTuuHyjlgMwBZM7IE3NlQGhQe65EN+I8Dw8MLGgYoFpFqADK/YUAMwOsFigORatFIlYRElaRMWmaiBAMAp0n+3U0kqkAAAAAASUVORK5CYII=);background-position: center;background-repeat: no-repeat;cursor:pointer;margin-left: 8px;opacity: 0.5; width: 16px; display: inline-block;} .audio:hover {opacity: 1;}";
  style.textContent = `

.mwe-popups {
    background: ${isDarkMode ? "#333" : "white"};
    position:fixed;
    z-index:110;
    -webkit-box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;
    box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;
    padding:0;
    font-size:14px;
    top: 0;
    left:15vw;
    width: 70vw;
    border-radius:2px;
    color: ${isDarkMode ? "#fff" : "#222"};
}
/*
.mwe-popups.mwe-popups-is-not-tall {
    width:320px
}
*/
.mwe-popups .mwe-popups-container{
    margin-top:-9px;
    padding-top:9px;
    text-decoration:none
}
.mwe-popups.mwe-popups-is-not-tall .mwe-popups-extract {
    min-height:40px;
    max-height:140px;
    overflow:hidden;
    margin-bottom:47px;
    padding-bottom:0
}
.mwe-popups .mwe-popups-extract {
    margin:16px;
    display:block;
    text-decoration:none;
    position:relative
}
/*
.mwe-popups.flipped_y:before {
    content:'';
    position:absolute;
    border:8px solid transparent;
    border-bottom:0;
    border-top: 8px solid #a2a9b1;
    bottom:-8px;
    left:10px
}
.mwe-popups.flipped_y:after {
    content:'';
    position:absolute;
    border:11px solid transparent;
    border-bottom:0;
    border-top:11px solid #fff;
    bottom:-7px;
    left:7px
}
 .mwe-popups.mwe-popups-no-image-tri:before {
    content:'';
    position:absolute;
    border:8px solid transparent;
    border-top:0;
    border-bottom: 8px solid #a2a9b1;
    top:-8px;
    left:10px;
}
.mwe-popups.mwe-popups-no-image-tri:after {
    content:'';
    position:absolute;
    border:11px solid transparent;
    border-top:0;
    border-bottom:11px solid #fff;
    top:-7px;
    left:7px;
}
*/
.audio {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcUlEQVQ4y2P4//8/AyUYQhAH3gNxA7IAIQPmo/H3g/QA8XkgFiBkwHyoYnRQABVfj88AmGZcTuuHyjlgMwBZM7IE3NlQGhQe65EN+I8Dw8MLGgYoFpFqADK/YUAMwOsFigORatFIlYRElaRMWmaiBAMAp0n+3U0kqkAAAAAASUVORK5CYII=);
    background-position: center;
    background-repeat: no-repeat;
    cursor:pointer;
    margin-left: 8px;
    width: 16px;
    opacity: 0.5;
    display: inline-block;
    background-color: white;
}
`;
  shadow.appendChild(style);

  let encapsulateDiv = document.createElement("div");
  encapsulateDiv.style =
    "all: initial; text-shadow: transparent 0px 0px 0px, rgba(0,0,0,1) 0px 0px 0px !important;";
  shadow.appendChild(encapsulateDiv);

  let popupDiv = document.createElement("div");
  popupDiv.style =
    "font-family: arial,sans-serif; border-radius: 12px; border: 1px solid #a2a9b1; box-shadow: 0 0 17px rgba(0,0,0,0.5)";
  encapsulateDiv.appendChild(popupDiv);

  let contentContainer = document.createElement("div");
  contentContainer.className = "mwe-popups-container";
  popupDiv.appendChild(contentContainer);

  let content = document.createElement("div");
  content.className = "mwe-popups-extract";
  content.style =
    "line-height: 1.4; margin-top: 0px; margin-bottom: 11px; max-height: none";
  contentContainer.appendChild(content);

  let heading = document.createElement("h3");
  heading.style = "margin-block-end: 0px; display:inline-block;";
  heading.textContent = "Searching";

  let meaning = document.createElement("p");
  meaning.style = "margin-top: 10px";
  meaning.textContent = "Please Wait...";

  let audio = document.createElement("div");
  audio.className = "audio";
  audio.innerHTML = "&nbsp;";
  audio.style.display = "none";

  let moreInfo = document.createElement("a");
  moreInfo.href = `https://www.google.com/search?hl=${LANGUAGE}&q=define+${info.word}`;
  moreInfo.style =
    "float: right; text-decoration: none;background-color:white;opacity: 0.5;";
  moreInfo.target = "_blank";

  content.appendChild(heading);
  content.appendChild(audio);
  content.appendChild(meaning);
  content.appendChild(moreInfo);
  document.body.appendChild(hostDiv);

  popupDiv.className =
    "mwe-popups mwe-popups-no-image-tri mwe-popups-is-not-tall";

  /*
  hostDiv.style.top = 10 + "px";

  if (info.clientY < window.innerHeight / 2) {
    popupDiv.className =
      "mwe-popups mwe-popups-no-image-tri mwe-popups-is-not-tall";
    hostDiv.style.top = info.bottom + 10 + "px";
    if (info.height == 0) {
      hostDiv.style.top = parseInt(hostDiv.style.top) + 8 + "px";
    }
  } else {
    popupDiv.className = "mwe-popups flipped_y mwe-popups-is-not-tall";
    hostDiv.style.top = info.top - 10 - popupDiv.clientHeight + "px";

    if (info.height == 0) {
      hostDiv.style.top = parseInt(hostDiv.style.top) - 8 + "px";
    }
  }
    */

  return {
    heading,
    meaning,
    moreInfo,
    audio,
  };
}

function getSelectionCoords(selection) {
  let oRange = selection.getRangeAt(0); //get the text range
  let oRect = oRange.getBoundingClientRect();
  return oRect;
}

function appendToDiv(createdDiv, content) {
  let hostDiv = createdDiv.heading.getRootNode().host;
  let popupDiv = createdDiv.heading.getRootNode().querySelectorAll("div")[1];

  let heightBefore = popupDiv.clientHeight;
  createdDiv.heading.textContent = content.word;
  createdDiv.meaning.textContent = content.meaning;
  createdDiv.moreInfo.textContent = "More »";

  let heightAfter = popupDiv.clientHeight;
  let difference = heightAfter - heightBefore;

  if (popupDiv.classList.contains("flipped_y")) {
    hostDiv.style.top = parseInt(hostDiv.style.top) - difference + 1 + "px";
  }

  if (content.audioSrc) {
    let sound = document.createElement("audio");
    sound.src = content.audioSrc;
    createdDiv.audio.style.display = "inline-block";
    createdDiv.audio.addEventListener("click", function () {
      sound.play();
    });
  }
}

function noMeaningFound(createdDiv) {
  createdDiv.heading.textContent = "Sorry";
  createdDiv.meaning.textContent = "No definition found.";
}

function removeMeaning(event) {
  let element = event.target;
  if (!element.classList.contains("dictionaryDiv")) {
    document.querySelectorAll(".dictionaryDiv").forEach(function (Node) {
      Node.remove();
    });
  }
}

function delayed_showMeaning(e) {
  clearTimeout(showMeaningTID);

  showMeaningTID = setTimeout(() => {
    showMeaning(e);
  }, 700);
}

document.addEventListener("mouseup", (e) => {
  if (TRIGGER_KEY === "none") {
    delayed_showMeaning(e);
    return;
  }

  //e has property altKey, shiftKey, cmdKey representing they key being pressed while double clicking.
  if (e[`${TRIGGER_KEY}Key`]) {
    delayed_showMeaning(e);
    return;
  }
});

document.addEventListener("touchstart", (e) => {
  if (TRIGGER_KEY === "none") {
    delayed_showMeaning(e);
    return;
  }

  //e has property altKey, shiftKey, cmdKey representing they key being pressed while double clicking.
  if (e[`${TRIGGER_KEY}Key`]) {
    delayed_showMeaning(e);
    return;
  }
});

document.addEventListener("click", removeMeaning);

(async function () {
  let results = await browser.storage.local.get();

  let interaction = results.interaction || {
    dblClick: { key: DEFAULT_TRIGGER_KEY },
  };

  LANGUAGE = results.language || DEFAULT_LANGUAGE;
  TRIGGER_KEY = interaction.dblClick.key;
})();

// this makes the setting change immediately usable instead of having to reload the tab first
browser.runtime.onMessage.addListener((data, sender) => {
  //console.debug("onMessage", data, sender);
  // update TRIGGER_KEY
  if (data.cmd === "showMeaning") {
    showMeaning(null);
    return;
  }
  if (data.cmd === "updateSettings") {
    // from background script
    TRIGGER_KEY = data["TRIGGER_KEY"];
    LANGUAGE = data["LANGUAGE"];
  }
});
