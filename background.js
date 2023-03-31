/* global browser */
	// LANG => [lang cache]
const DEFAULT_LANGUAGE = "en";
const DEFAULT_TRIGGER_KEY = "none";
const history_cache = new Map();
let active_lang = 'eng';

const GOOGLE_SPEECH_URI = "https://www.google.com/speech-api/v1/synthesize",
  DEFAULT_HISTORY_SETTING = {
    enabled: true,
  };

browser.runtime.onMessage.addListener(async (request, sender /*, sendResponse*/) => {
  const { word , lang } = request;

  let results = await browser.storage.local.get("definitions");

  let definitions = results.definitions || {};
	if(typeof definitions[lang] !== 'object'){
		//console.debug('creating definition entry for language: ', lang);
  		definitions[lang] = {};
	}

	//console.debug('tmp: ',definitions[lang]);

	if(typeof definitions[lang][word] === 'string'){
		//console.debug(' >>>>>>>>>>     using cached definition ', lang, word);
		let content = JSON.parse(definitions[lang][word]);
		return { content };
	}

    url = `https://www.google.com/search?hl=${lang}&q=define+${word}&gl=US`;
	//console.debug(url);

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
  //console.debug("text", text);
  //console.debug(word, lang);
  const document = new DOMParser().parseFromString(text, "text/html"),
    content = extractMeaning(document, { word, lang});
	//console.debug(content);

  //sendResponse({ content });

  results = await browser.storage.local.get();
  if (content && results) {
    let history = results.history || DEFAULT_HISTORY_SETTING;

    if (history.enabled) {
      saveWord(lang, content);
    }
  }
	return { content };

});

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
	if(typeof definitions  !== 'object'){
		definitions = {};
	}
	if(typeof definitions[lang] !== 'object'){
		definitions[lang]  = {};
	}

  definitions[lang][word] = JSON.stringify(content);

	//console.log(lang, word, content)
  browser.storage.local.set({
    definitions,
  });
}

// todos 
//
(async () => {
	// 1. load cache from storage 
	// 1. load cache active_lang from storage  

})();

/*
browser.storage.local.onChanged.addListener( async () => {

	console.log('onStorageChanged');

  let results = await browser.storage.local.get();

  let interaction = results.interaction || {
    dblClick: { key: DEFAULT_TRIGGER_KEY },
  };

  const LANGUAGE = results.language || DEFAULT_LANGUAGE;
  const TRIGGER_KEY = interaction.dblClick.key;

	const tabs = await browser.tabs.query({});
	for(const t of tabs){
		try {
		await browser.tabs.sendMessage(t.id, {LANGUAGE, TRIGGER_KEY });
		}catch(e){
			// noop
		}
	}
});
*/

// setInterval or setTimeout ... to sync cached definitions into storage 
// later: remove elements from the cache/storage, which have not been used for a while
