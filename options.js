/*global browser */

const DEFAULT_LANGUAGE = "en",
  DEFAULT_TRIGGER_KEY = "none",
  IS_HISTORY_ENABLED_BY_DEFAULT = true,
  IS_CONFIRM_ENABLED_BY_DEFAULT = false,
  SAVE_STATUS = document.querySelector("#save-status"),
  SAVE_OPTIONS_BUTTON = document.querySelector("#save-btn"),
  RESET_OPTIONS_BUTTON = document.querySelector("#reset-btn"),
  CLEAR_HISTORY_BUTTON = document.querySelector("#clear-history-btn"),
  DOWNLOAD_HISTORY_BUTTON = document.querySelector("#download-history-btn"),
  OS_MAC = "mac",
  KEY_COMMAND = "Command",
  KEY_META = "meta";

async function saveOptions(e) {
  e.preventDefault();
  //
  const LANGUAGE = document.querySelector("#language-selector").value;
  const TRIGGER_KEY = document.querySelector("#popup-dblclick-key").value;
  await browser.storage.local.set({
    language: LANGUAGE,
    interaction: {
      dblClick: {
        key: TRIGGER_KEY,
      },
    },
    history: {
      enabled: document.querySelector("#store-history-checkbox").checked,
    },
    confirm: {
      enabled: document.querySelector("#store-confirm-checkbox").checked,
    },
  });

  const tabs = await browser.tabs.query({});
  for (const t of tabs) {
    try {
      await browser.tabs.sendMessage(t.id, {
        cmd: "updateSettings",
        TRIGGER_KEY: document.querySelector("#popup-dblclick-key").value,
        LANGUAGE: document.querySelector("#language-selector").value,
        CONFIRM: document.querySelector("#store-confirm-checkbox").checked,
      });
    } catch (e) {
      console.error(e);
      // noop
    }
  }

  showSaveStatusAnimation();
}

async function restoreOptions() {
  let results = await browser.storage.local.get();

  results = results || {};

  results = results || {};

  let language = results.language || DEFAULT_LANGUAGE,
    interaction = results.interaction || {},
    history = results.history || { enabled: IS_HISTORY_ENABLED_BY_DEFAULT },
    definitions = results.definitions || {},
    confirm = results.confirm || { enabled: IS_CONFIRM_ENABLED_BY_DEFAULT };

  // language
  document.querySelector("#language-selector").value =
    language || DEFAULT_LANGUAGE;

  // interaction
  document.querySelector("#popup-dblclick-key").value =
    (interaction.dblClick && interaction.dblClick.key) || DEFAULT_TRIGGER_KEY;

  // history
  document.querySelector("#store-history-checkbox").checked = history.enabled;

  // confirm
  document.querySelector("#store-confirm-checkbox").checked = confirm.enabled;

  let ret = 0;
  for (const lang in definitions) {
    if (Object.hasOwn(definitions, lang)) {
      ret = ret + Object.keys(definitions[lang]).length;
    }
  }
  document.querySelector("#num-words-in-history").innerText = ret;
}

async function downloadHistory(e) {
  let fileContent = "";
  let anchorTag = document.querySelector("#download-history-link");

  let results = await browser.storage.local.get("definitions");

  let definitions = results.definitions || {};

  for (const lang in definitions) {
    if (Object.hasOwn(definitions, lang)) {
      fileContent += "\n";
      fileContent += "LANGUAGE: " + lang;
      fileContent += "\n";
      fileContent += "\n";

      for (const definition in definitions[lang]) {
        if (Object.hasOwn(definitions[lang], definition)) {
          fileContent += definition;
          fileContent += "\t";
          fileContent += JSON.parse(definitions[lang][definition]).meaning;
          fileContent += "\n";
        }
      }
    }
  }

  anchorTag.href = window.URL.createObjectURL(
    new Blob([fileContent], {
      type: "text/plain",
    })
  );

  anchorTag.dispatchEvent(new MouseEvent("click"));

  e.preventDefault();
}

async function resetOptions(e) {
  await browser.storage.local.set({
    language: DEFAULT_LANGUAGE,
    interaction: {
      dblClick: {
        key: DEFAULT_TRIGGER_KEY,
      },
    },
    history: {
      enabled: IS_HISTORY_ENABLED_BY_DEFAULT,
    },
    confirm: {
      enabled: IS_CONFIRM_ENABLED_BY_DEFAULT,
    },
  });

  restoreOptions();

  e.preventDefault();
}

function clearHistory(e) {
  e.preventDefault();
  browser.storage.local.set({ definitions: {} });
}

function showSaveStatusAnimation() {
  SAVE_STATUS.style.setProperty("-webkit-transition", "opacity 0s ease-out");
  SAVE_STATUS.style.opacity = 1;
  window.setTimeout(function () {
    SAVE_STATUS.style.setProperty(
      "-webkit-transition",
      "opacity 0.4s ease-out"
    );
    SAVE_STATUS.style.opacity = 0;
  }, 1500);
}

document.addEventListener("DOMContentLoaded", restoreOptions);

CLEAR_HISTORY_BUTTON.addEventListener("click", clearHistory);
DOWNLOAD_HISTORY_BUTTON.addEventListener("click", downloadHistory);

SAVE_OPTIONS_BUTTON.addEventListener("click", saveOptions);
RESET_OPTIONS_BUTTON.addEventListener("click", resetOptions);

if (window.navigator.platform.toLowerCase().includes(OS_MAC)) {
  document.getElementById("popup-dblclick-key-ctrl").textContent = KEY_COMMAND;
  document.getElementById("popup-dblclick-key-ctrl").value = KEY_META;
}
