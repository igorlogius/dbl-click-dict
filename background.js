/* global browser */

const GOOGLE_SPEECH_URI = "https://www.google.com/speech-api/v1/synthesize",
  DEFAULT_HISTORY_SETTING = {
    enabled: true,
  };

browser.runtime.onMessage.addListener(
  async (request, sender) => {
    const { word, lang } = request;

    let results = await browser.storage.local.get("definitions");

    let definitions = results.definitions || {};
    if (typeof definitions[lang] !== "object") {
      definitions[lang] = {};
    }

    if (typeof definitions[lang][word] === "string") {
      let content = JSON.parse(definitions[lang][word]);
      return { content };
    }

    url = `https://www.google.com/search?hl=${lang}&q=define+${word}&gl=US`;

    let headers = new Headers({
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0",
    });

    let response = await fetch(url, {
      method: "GET",
      credentials: "omit",
      headers,
    });
    let text = await response.text();
    const document = new DOMParser().parseFromString(text, "text/html"),
      content = extractMeaning(document, { word, lang });

    results = await browser.storage.local.get();
    if (content && results) {
      let history = results.history || DEFAULT_HISTORY_SETTING;

      if (history.enabled) {
        content.word = word.toLowerCase();
        saveWord(lang, content);
      }
    }
    return { content };
  }
);

function extractMeaning(document, context) {
  if (!document.querySelector("[data-dobid='hdw']")) {
    return null;
  }

  var word = document.querySelector("[data-dobid='hdw']").textContent,
    definitionDiv = document.querySelector("div[data-dobid='dfn']"),
    meaning = "";

  if (definitionDiv) {
    definitionDiv.querySelectorAll("span").forEach(function (span) {
      if (!span.querySelector("sup")) meaning = meaning + span.textContent;
    });
  }

  meaning = meaning[0].toUpperCase() + meaning.substring(1);

  var audio = document.querySelector("audio[jsname='QInZvb']"),
    source = document.querySelector("audio[jsname='QInZvb'] source"),
    audioSrc = source && source.getAttribute("src");

  if (audioSrc) {
    !audioSrc.includes("http") &&
      (audioSrc = audioSrc.replace("//", "https://"));
  } else if (audio) {
    let exactWord = word.replace(/·/g, ""), // We do not want syllable seperator to be present.
      queryString = new URLSearchParams({
        text: exactWord,
        enc: "mpeg",
        lang: context.lang,
        speed: "0.4",
        client: "lr-language-tts",
        use_google_only_voices: 1,
      }).toString();

    audioSrc = `${GOOGLE_SPEECH_URI}?${queryString}`;
  }

  return { word: word, meaning: meaning, audioSrc: audioSrc };
}

async function saveWord(lang, content) {
  let word = content.word;
  let meaning = content.meaning;
  let results = await browser.storage.local.get("definitions");

  let definitions = results.definitions;
  if (typeof definitions !== "object") {
    definitions = {};
  }
  if (typeof definitions[lang] !== "object") {
    definitions[lang] = {};
  }

  definitions[lang][word] = JSON.stringify(content);

  browser.storage.local.set({
    definitions,
  });
}
