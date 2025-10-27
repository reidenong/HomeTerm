# (Reiden's) HomeTerm

> Welcome to reiden's fork of the original HomeTerm!
>
> This repo is a fork of Jared's HomeTerm project, but with huge changes that makes it extremely different visually.
>
>
> Enjoy!

A homepage with terminal utilities!

![alt text](/media/image.png)
![alt text](/media/image2.png)

- Mouse free link navigation and management
- Command autocomplete
- Beautiful wallpapers
- Command history for repeating commands easily
- Stores bookmarks on your machine so they persist past your session

## Available Commands

Here are the currently available commands that can be run on the terminal.

| Command  | usage                             | description                                                                                                                                                                          |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ls`     | `ls [<path to dir>]`              | List children of current working directory or given directory.                                                                                                                       |
| `tree`   | `tree [<path to dir>]`            | Lists all children of current working directory or given directory in tree format                                                                                                    |
| `cd`     | `cd [<path>]`                     | Move into given directory. If no path given move to root.                                                                                                                            |
| `open`   | `./<path to link>`                | Open a link in a new tab.                                                                                                                                                            |
| `touch`  | `touch <path to link> <url>`      | Create a new link                                                                                                                                                                    |
| `mkdir`  | `mkdir <path to dir>`             | Create a new directory                                                                                                                                                               |
| `rm`     | `rm <path to link>`               | Delete link                                                                                                                                                                          |
| `rmdir`  | `rmdir <path to dir>`             | Delete dir and all contents                                                                                                                                                          |
| `search` | `search [-e] ["<search string>"]` | Search with given search string (Must be in quotes to capture multiple words). Supply `-e` with a search URL or pre-defined engine (`ddg`, `google`, `bing`) to change search engine |
| `clear`  | `clear`                           | Clear the terminal of past commands.                                                                                                                                                 |
| `theme`  | `theme [<theme name>]`            | Change theme.                                                                                                                                                                        |
| `mv`     | `mv <source path> <target path>`  | "Move" file or directory. Allows for renaming/moving resources within the file tree.                                                                                                 |
| `edit`   | `edit <link path> <url>`          | Change the URL value for a given link.                                                                                                                                               |
| `help`   | `help [<command>]`                | Get information on commands.                                                                                                                                                         |
