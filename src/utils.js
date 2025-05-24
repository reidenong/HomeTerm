function safeParse(input) {
  try {
    return JSON.parse(input) || {};
  } catch {
    return {};
  }
}

function locationType(val) {
  if (typeof val === "string") return types.LINK;
  return types.DIR;
}

function joinWriter(command, writer) {
  return (input) => {
    writer(command(input));
  };
}

function focusPrompt() {
  const input = document.getElementById("prompt-input");
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function getCursor(pos) {
  let cursor = links;
  pos.forEach((p) => {
    // TODO: handle bad positions
    cursor = cursor[p];
  });
  return cursor;
}

function getCurrentCursor() {
  return getCursor(position);
}

function pushCommand(cmd) {
  const prompt = document.getElementById("prompt-input");
  prompt.value = cmd;
  focusPrompt();
}

function completeToken(pref) {
  const prompt = document.getElementById("prompt-input");

  // TODO: Autocomplete on commands
  let commands = pref.split(' ')
  if (commands.length == 1) {
    focusPrompt();
    return;
  }
  
  // Extract out correct pathPrefix and incomplete pathSuffix
  let pathPrefix = (pref.split(' ')[1] + 'a').split('/');
  let pathSuffix = pathPrefix.pop().slice(0, -1);  // Remove the last character
  pathPrefix = pathPrefix.join('/');

  // Find possible autocomplete targets
  let targets = list([pathPrefix]);
  if (!Array.isArray(targets)) {
    focusPrompt();
    return;
  }

  // Initialize possible match variable
  let possible = '';

  // Iterate over targets to find matching keys
  for (let i = 0; i < targets.length; i++) {
    let { key, _ } = targets[i];

    // Have found unique (so far) match
    if (key.includes(pathSuffix) && !possible) {
      possible = key;
    }
    // Multiple options, pass
    else if (key.startsWith(pathSuffix)) {
      focusPrompt();
      return;
    }
  }

  // Construct final prompt value
  const result = `${pref.split(' ')[0]} ${pathPrefix}${pathPrefix ? '/' : ''}${possible}`;
  prompt.value = result;
  focusPrompt();
}


// Returns link url if link or cursor if directory
// Throw error if bad path
function locatePath(path) {
  let cursor = locateParentPath(path);
  if (path.length) {
    const final = path[path.length - 1];
    if (!cursor[final]) {
      throw `no such link or directory: ${final}`;
    }
    return cursor[final];
  }
  return cursor;
}

function locateParentPath(fullPath) {
  const path = fullPath.slice(0, fullPath.length - 1);
  let cursor = getCurrentCursor();
  const newPosition = [...position];
  for (let i = 0; i < path.length; i++) {
    const m = path[i];
    if (m === "..") {
      newPosition.pop();
      cursor = getCursor(newPosition);
    } else {
      if (!cursor[m]) {
        throw `no such link or directory: ${m}`;
      }
      if (locationType(cursor[m]) === types.LINK) {
        throw `not a directory: ${m}`;
      }
      newPosition.push(m);
      cursor = getCursor(newPosition);
    }
  }
  return cursor;
}

// Write out functions
function writePrompt() {
  const terminal = document.getElementById("terminal-content");
  const prompt = document.createElement("div");
  prompt.classList.add("prompt");
  prompt.innerHTML = `
  <p class='prompt-title'>~${position.length ? "/" : ""}${position.join(
    "/"
  )}<span class='prompt-cursor'>${promptSymbol}</span></p>
  <input id='prompt-input' type='text' />
  `;
  terminal.appendChild(prompt);
}

function replacePrompt() {
  const oldPrompt = document.getElementById("prompt-input");
  const value = oldPrompt.value;
  const promptText = document.createElement("p");
  promptText.innerText = value;
  promptText.classList.add("prompt-text");
  oldPrompt.replaceWith(promptText);
  writePrompt();
}

// Parse command input by keeping strings in "" together as an single item
function parseCommand(input) {
  const re = /"([^"]+)"|([^\s]+)/g;
  const parsedCmd = [];
  let temp;
  while ((temp = re.exec(input)) !== null) {
    const val = temp[1] || temp[2]; // Get the correct capture group
    parsedCmd.push(val);
  }
  return parsedCmd;
}

// Parse command array to extract flags
function extractFlags(command, flagMap = {}) {
  const finalCommand = [];
  const flags = {};
  for (let i = 0; i < command.length; i++) {
    const arg = command[i];
    const isFlag = /^(-|--)(\w+)/.exec(arg);
    if (isFlag) {
      const flag = isFlag[2];
      // If flag marked boolean, don't capture input
      // TODO: throw error if not found in map?
      if (flagMap[flag] !== "boolean") {
        flags[flag] = command[i + 1];
        i++;
      } else {
        flags[flag] = true;
      }
    } else {
      finalCommand.push(arg);
    }
  }

  return { command: finalCommand, flags };
}

function formatUrl(url) {
  let finalUrl = url;
  if (!/^http|https:\/\//.test(finalUrl)) {
    finalUrl = "https://" + finalUrl;
  }
  return finalUrl;
}
