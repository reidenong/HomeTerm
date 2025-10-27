/* =============================================================================
 * List / Navigation / FS Mutations / UI / Utilities
 * ---------------------------------------------------------------------------
 * ========================================================================== */

/* -----------------------------------------------------------------------------
 * LIST
 * Show directory contents. Supports:
 *  - flag -t : delegate to `tree` view
 *  - alphabetical sort by key
 *  - prefix "/" for dirs
 * -------------------------------------------------------------------------- */
// Add flag on ls to show actual links with names
function list(input) {
  const { command, flags } = extractFlags(input, { t: "boolean" });

  // ls -t => tree
  if (flags.t) {
    return tree(command);
  }

  const path = command[0] && command[0].split("/");

  try {
    const cursor = path ? locatePath(path) : getCurrentCursor();

    if (locationType(cursor) === types.DIR) {
      return Object.entries(cursor)
        .sort(([aKey], [bKey]) => aKey.localeCompare(bKey)) // alphabetical
        .map(([key, value]) => {
          const type = locationType(value);
          return {
            key: type === types.DIR ? `/${key}` : key, // prefix "/" for dirs
            type,
          };
        });
    }
  } catch (err) {
    return err;
  }

  return COMMANDS.ls.help;
}

/* -----------------------------------------------------------------------------
 * CD
 * Change current position. Supports ".." and nested "a/b/c".
 * Returns error strings for non-existent targets or non-dirs.
 * -------------------------------------------------------------------------- */
function cd(input) {
  if (input.length) {
    const movement = input[0].split("/");
    let newPosition = [...position];

    for (let m of movement) {
      if (m === "..") {
        newPosition.pop();
      } else {
        const cursor = getCursor(newPosition);
        if (!cursor[m]) {
          return `no such link or directory: ${m}`;
        }
        if (locationType(cursor[m]) !== types.DIR) {
          return `not a directory: ${m}`;
        }
        newPosition.push(m);
      }
    }

    position = newPosition;
    return;
  }

  // No args => go to root
  position = [];
}

/* -----------------------------------------------------------------------------
 * OPEN (alias redirect)
 * Keep as passthrough to help text for compatibility.
 * -------------------------------------------------------------------------- */
function openRedirect(input) {
  return COMMANDS.open.help;
}

/* -----------------------------------------------------------------------------
 * OPEN LINK
 * Open a link at path in a new tab. Errors if path points to a directory.
 * -------------------------------------------------------------------------- */
function openLink(input) {
  if (input.length) {
    try {
      const path = input[0].split("/");
      const target = locatePath(path);

      if (locationType(target) === types.DIR) {
        return `not a link: ${path[path.length - 1]}`;
      }

      window.open(target, "_blank");
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.open.help;
}

/* -----------------------------------------------------------------------------
 * TOUCH
 * Create or overwrite a link at path with a formatted URL.
 * -------------------------------------------------------------------------- */
function touch(input) {
  if (input.length == 2) {
    try {
      const path = input[0].split("/");
      const url = formatUrl(input[1]);
      const parent = locateParentPath(path);
      const target = path[path.length - 1];

      parent[target] = url;
      return writeLinks();
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.touch.help;
}

/* -----------------------------------------------------------------------------
 * MKDIR
 * Create a nested directory by path. Creates only the final segment.
 * -------------------------------------------------------------------------- */
function mkdir(input) {
  if (input.length) {
    const path = input[0].split("/");
    try {
      const target = locatePath(path.slice(0, path.length - 1));
      target[path[path.length - 1]] = {};
      writeLinks();
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.mkdir.help;
}

/* -----------------------------------------------------------------------------
 * THEME
 * Set or list themes.
 *  - theme <name> : apply and persist
 *  - theme        : list available themes
 * -------------------------------------------------------------------------- */
function theme(input) {
  if (input.length) {
    if (!THEMES.includes(input[0])) {
      return `no such theme: ${input[0]}`;
    }
    document.body.className = "";
    document.body.classList.add(input[0]);
    writeTheme(input[0]);
    return;
  }
  return { title: "Available themes:", items: THEMES };
}

/* -----------------------------------------------------------------------------
 * RM
 * Remove a link at path. Validates existence and type.
 * -------------------------------------------------------------------------- */
function rm(input) {
  if (input.length) {
    const path = input[0].split("/");
    try {
      const parent = locateParentPath(path);
      const target = path[path.length - 1];

      if (!parent[target]) {
        return `no such link: ${target}`;
      }
      if (locationType(parent[target]) !== types.LINK) {
        return `not a link: ${target}`;
      }

      delete parent[target];
      writeLinks();
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.rm.help;
}

/* -----------------------------------------------------------------------------
 * RMDIR
 * Remove a directory at path. Validates existence and type.
 * -------------------------------------------------------------------------- */
function rmdir(input) {
  if (input.length) {
    const path = input[0].split("/");
    try {
      const parent = locateParentPath(path);
      const target = path[path.length - 1];

      if (!parent[target]) {
        return `no such dir: ${target}`;
      }
      if (locationType(parent[target]) !== types.DIR) {
        return `not a dir: ${target}`;
      }

      delete parent[target];
      writeLinks();
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.rmdir.help;
}

/* -----------------------------------------------------------------------------
 * CLEAR
 * Clear terminal content and write a fresh prompt.
 * -------------------------------------------------------------------------- */
function clear() {
  const terminal = document.getElementById("terminal-content");
  while (terminal.firstChild) {
    terminal.removeChild(terminal.lastChild);
  }
  writePrompt();
  return true;
}

/* -----------------------------------------------------------------------------
 * HELP
 * With no args: list commands. With command: show usage string.
 * -------------------------------------------------------------------------- */
function help(input) {
  if (!input || !input.length) {
    return Object.keys(COMMANDS).map((cmd) => ({ key: cmd, type: types.LINK }));
  }
  return COMMANDS[input[0]].help;
}

/* -----------------------------------------------------------------------------
 * SEARCH
 * Search via current or overridden engine.
 *  - search "<q>"
 *  - search -e google "<q>"
 *  - search -e google        => set default engine
 * -------------------------------------------------------------------------- */
function search(input) {
  const { command, flags } = extractFlags(input, { e: "string" });
  let currentSearchUrl = searchUrl;

  // Override engine per-call or set default engine when no query is passed
  if (flags.e) {
    currentSearchUrl = ENGINES[flags.e] ? ENGINES[flags.e] : flags.e;

    if (!command[0]) {
      searchUrl = currentSearchUrl; // persist new default
      writeEngine(currentSearchUrl);
      return `Updated search engine to: ${currentSearchUrl}`;
    }
  }

  // Execute search if query present
  if (command && command[0]) {
    const searchString = command[0];
    window.open(currentSearchUrl + searchString, "_blank");
    return;
  }

  return COMMANDS.search.help;
}

/* -----------------------------------------------------------------------------
 * TREE
 * Return the directory object at path or current cursor.
 * Errors if path is not a directory.
 * -------------------------------------------------------------------------- */
function tree(input) {
  try {
    const path = input[0] && input[0].split("/");
    const cursor = path ? locatePath(path) : getCurrentCursor();

    if (locationType(cursor) !== types.DIR) {
      return `no such dir: ${input[0]}`;
    }

    return cursor;
  } catch (err) {
    return err;
  }
}

/* -----------------------------------------------------------------------------
 * MV
 * Move or rename an entry.
 * mv <src> <dst>  (dst may include a new leaf name)
 * -------------------------------------------------------------------------- */
function mv(input) {
  try {
    if (input.length < 2) {
      return COMMANDS.mv.help;
    }

    const sourcePath = input[0].split("/");
    const targetPath = input[1].split("/");

    // Resolve source and target parents
    const sourceParent = locateParentPath(sourcePath);
    const sourceName = sourcePath[sourcePath.length - 1];

    const target = locateParentPath(targetPath);
    const targetName = targetPath[targetPath.length - 1];

    // Assign new target
    target[targetName] = sourceParent[sourceName];

    // Remove old source
    delete sourceParent[sourceName];

    return writeLinks();
  } catch (err) {
    return err;
  }
}

/* -----------------------------------------------------------------------------
 * EDIT
 * Update a link's URL in place.
 * -------------------------------------------------------------------------- */
function edit(input) {
  try {
    if (input.length < 2) {
      return COMMANDS.edit.help;
    }

    const path = input[0].split("/");
    const target = path[path.length - 1];
    const parent = locateParentPath(path);

    if (locationType(parent[target]) !== types.LINK) {
      // Note: kept original string formatting exactly (no functional change).
      throw "not a link: ${target}";
    }

    const url = formatUrl(input[1]);
    parent[target] = url;

    return writeLinks();
  } catch (err) {
    return err;
  }
}
