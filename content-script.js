/* global browser */

let DEFAULT_LANGUAGE = "en",
  DEFAULT_TRIGGER_KEY = "none",
  LANGUAGE,
  TRIGGER_KEY,
  CONFIRM;

async function showMeaning(event) {
  let info = getSelectionInfo(event);
  if (!info) {
    return;
  }

  let response = await retrieveMeaningFromCache(info);

  if (response === null) {
    if (TRIGGER_KEY === "none" && CONFIRM === true) {
      if (window.confirm("Lookup definition for '" + info.word + "'?")) {
        response = await retrieveMeaning(info);
      } else {
        return;
      }
    } else {
      response = await retrieveMeaning(info);
    }
  }
  // create defintion container
  let createdDiv = createDiv(info);

  if (response.content) {
    appendToDiv(createdDiv, response.content);
  } else {
    noMeaningFound(createdDiv);
  }
}

function getSelectionInfo(event) {
  let word;

  let selection = null;

  try {
    if (window.getSelection) {
      selection = window.getSelection();
    } else if (typeof document.selection != "undefined") {
      selection = document.selection;
    }

    let selectedRange = selection.getRangeAt(0);
    word = selectedRange.toString();

    if (word.length < 1) {
      return null;
    }

    return {
      word: word,
    };
  } catch (e) {
    return null; // selection not available
  }
}

function retrieveMeaningFromCache(info) {
  return browser.runtime.sendMessage({
    cmd: "cache",
    word: info.word.toLowerCase(),
    lang: LANGUAGE,
    time: Date.now(),
  });
}

function retrieveMeaning(info) {
  return browser.runtime.sendMessage({
    cmd: "remote",
    word: info.word.toLowerCase(),
    lang: LANGUAGE,
    time: Date.now(),
  });
}

function createDiv(info) {
  let hostDiv = document.createElement("div");

  hostDiv.className = "dictionaryDiv";

  hostDiv.style.position = "absolute";
  hostDiv.style.zIndex = "1000000";
  hostDiv.attachShadow({ mode: "open" });

  const isDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  let shadow = hostDiv.shadowRoot;
  let style = document.createElement("style");
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

  return {
    heading,
    meaning,
    moreInfo,
    audio,
  };
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

(async function () {
  let results = await browser.storage.local.get();

  let interaction = results.interaction || {
    dblClick: { key: DEFAULT_TRIGGER_KEY },
  };

  LANGUAGE = results.language || DEFAULT_LANGUAGE;
  TRIGGER_KEY = interaction.dblClick.key;
  CONFIRM = typeof results.confirm === "boolean" ? results.confirm : false;

  delete Hammer.defaults.cssProps.userSelect;
  var mc = new Hammer.Manager(document.body);

  // Tap recognizer with minimal 2 taps
  mc.add(new Hammer.Tap({ event: "doubletap", taps: 2 }));
  // Single tap recognizer
  mc.add(new Hammer.Tap({ event: "singletap" }));

  // we want to recognize this simulatenous, so a quadrupletap will be detected even while a tap has been recognized.
  mc.get("doubletap").recognizeWith("singletap");
  // we only want to trigger a tap, when we don't have detected a doubletap
  mc.get("singletap").requireFailure("doubletap");

  mc.on("doubletap", function (ev) {
    showMeaning(ev);
  });

  mc.on("singletap", function (ev) {
    removeMeaning(ev);
  });
})();

// this makes the setting change immediately usable instead of having to reload the tab first
browser.runtime.onMessage.addListener((data, sender) => {
  // update TRIGGER_KEY
  if (data.cmd === "showMeaning") {
    showMeaning(null);
    return;
  }
  if (data.cmd === "updateSettings") {
    // from background script
    TRIGGER_KEY = data["TRIGGER_KEY"];
    LANGUAGE = data["LANGUAGE"];
    CONFIRM = data["CONFIRM"];
  }
});
