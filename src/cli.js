/* =============================================================================
 * Terminal Command Definitions
 * ---------------------------------------------------------------------------
 * Maps command names to their handlers and help strings.
 * ========================================================================== */

// Defined Commands
const COMMANDS = {
  ls: { func: joinWriter(list, treeWriter), help: "usage: ls [<path to dir>]" },
  cd: { func: joinWriter(cd, textWriter), help: "usage: cd [<path>]" },
  "./": { func: joinWriter(openLink, textWriter), help: "usage: ./<path>" },
  touch: {
    func: joinWriter(touch, textWriter),
    help: "usage: touch <path to link> <url>",
  },
  mkdir: {
    func: joinWriter(mkdir, textWriter),
    help: "usage: mkdir <path to dir>",
  },
  rm: { func: joinWriter(rm, textWriter), help: "usage: rm <link path>" },
  rmdir: {
    func: joinWriter(rmdir, textWriter),
    help: "usage: rmdir <dir path>",
  },
  clear: { func: clear, help: "usage: clear" },
  help: { func: joinWriter(help, listWriter), help: "usage: help [<command>]" },
  search: {
    func: joinWriter(search, textWriter),
    help: 'usage: search [-e] "<search string>"',
  },
  tree: {
    func: joinWriter(tree, treeWriter),
    help: "usage: tree",
  },
  mv: {
    func: joinWriter(mv, textWriter),
    help: "usage: mv <source path> <target path>",
  },
  edit: {
    func: joinWriter(edit, textWriter),
    help: "usage: edit <link path> <url>",
  },
};

/* =============================================================================
 * Global State
 * ---------------------------------------------------------------------------
 * Runtime configuration and session state for the terminal.
 * ========================================================================== */

let searchUrl = ENGINES.google;
let promptSymbol = "$"; // Change to customize the prompt symbol
let links = {};
let position = []; // Current path in the link tree as an array of segments
let commandHistory = [];
let commandHistoryCursor = -1;

/* =============================================================================
 * Bootstrapping (IIFE)
 * ---------------------------------------------------------------------------
 * Initialize state, theme, prompt, and event listeners on load.
 * ========================================================================== */

(() => {
  // Load persisted links
  const lsLinks = readLinks();
  if (lsLinks) {
    links = lsLinks;
  }

  // Load persisted search engine
  const savedEngine = readEngine();
  if (savedEngine) {
    searchUrl = savedEngine;
  }

  // Load and apply theme
  const currentTheme = readTheme();
  theme([currentTheme]);

  // Optional: show initial time banner (kept commented as in original)
  const d = new Date();
  const [date, time] = d.toLocaleString().split(" ");
  // textWriter(
  //   `It's ${time.slice(0, time.length - 3)} on ${date.replace(",", "")}.`
  // );

  // Initial prompt
  writePrompt();

  // Events
  document.addEventListener("keydown", handleKeyPresses);

  // Focus input
  focusPrompt();
})();

/* =============================================================================
 * Input Handling
 * ---------------------------------------------------------------------------
 * Keyboard interactions: submit, history navigation, and tab completion.
 * ========================================================================== */

/**
 * Handle key events in the terminal input.
 * - Enter: run command
 * - ArrowUp/ArrowDown: navigate history
 * - Tab: token completion
 */
function handleKeyPresses(e) {
  switch (e.key) {
    case "Enter": {
      e.preventDefault();
      const input = document.getElementById("prompt-input");
      return runCommand(input.value);
    }
    case "ArrowUp": {
      e.preventDefault();

      // Initialize cursor to last command
      if (commandHistoryCursor === -1 && commandHistory.length) {
        commandHistoryCursor = commandHistory.length - 1;
        return pushCommand(commandHistory[commandHistoryCursor]);
      }

      // Move up in history
      if (commandHistoryCursor > 0) {
        commandHistoryCursor--;
        return pushCommand(commandHistory[commandHistoryCursor]);
      }
      break;
    }
    case "ArrowDown": {
      e.preventDefault();

      // Clear when moving past the newest entry
      if (commandHistoryCursor === commandHistory.length - 1) {
        commandHistoryCursor = -1;
        return pushCommand("");
      }

      // Move down in history
      if (
        commandHistoryCursor >= 0 &&
        commandHistoryCursor < commandHistory.length
      ) {
        commandHistoryCursor++;
        return pushCommand(commandHistory[commandHistoryCursor]);
      }
      break;
    }
    case "Tab": {
      e.preventDefault();
      const curr_input = document.getElementById("prompt-input");
      if (curr_input.value == "") break; // Keep loose equality as in original
      return completeToken(curr_input.value);
    }
    default:
      break;
  }
}

/* =============================================================================
 * Command Execution
 * ---------------------------------------------------------------------------
 * Parse user input, dispatch to the appropriate command, and manage the UI.
 * ========================================================================== */

/**
 * Execute a command line string from the prompt.
 * - Records history
 * - Parses command and arguments
 * - Supports `-h` for per-command help via `help` handler
 * - Writes response and refreshes the prompt
 */
function runCommand(cmd) {
  // Track history
  commandHistory.push(cmd);

  // TODO: Expand parser to handle flags and quoted strings robustly
  const parsedCmd = parseCommand(cmd);

  let response;

  // Dispatch if command exists
  if (COMMANDS[parsedCmd[0]]) {
    if (parsedCmd.length > 1 && parsedCmd[1] === "-h") {
      // Route to help listing for a specific command
      response = COMMANDS.help.func([parsedCmd[0]]);
    } else {
      // Run command with args
      response = COMMANDS[parsedCmd[0]].func(
        parsedCmd.slice(1, parsedCmd.length),
      );
    }
  } else {
    // Unknown command
    textWriter("Command not found.");
  }

  // If command produced no writer output, restore prompt
  if (!response) {
    replacePrompt();
  }

  // Refocus prompt for next input
  focusPrompt();
}
