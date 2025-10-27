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

## How to use
The main reason why I adopted HomeTerm was to reduce my mouse reliance. HomeTerm is designed like a file system
-  files are like executables that take you to your page
-  folders are like organizers that you can use to group your links together
and this really makes the user experience very intuitable and straightforward.

 Hometerm has also made the no mouse journey more enjoyable than ever before: create, view, organize and navigate your links all from the comfort of the command line! To get started is very simple:

1. Save some links using `touch`.
2. View your links using `ls`.
3. Go to your pages with `./`.

The key reasons HomeTerm is preferable over other solutions (or at least why I like it): 
1. Completely pointer free interface: never touch your mouse!
2. Really, really fast to navigate with tab-autocomplete and history (up/down arrows).
3. Allows you to organize many many links with nested directories.

## How to setup
As of the time of writing this, it is currently waiting review to be uploaded into the Chrome Web Store.

However, to use from git:
1. Clone this repo anywhere
2. See [Google Chrome support — Manage app or extension folders](https://support.google.com/chrome/a/answer/2714278?hl=en#:~:text=Go%20to%20chrome%3A%2F%2Fextensions,the%20app%20or%20extension%20folder.) on how to load an unpacked extension -- the /HomeTerm directory is the file you point to.


## Available Commands

Here are the currently available commands that can be run on the terminal.

| Command  | usage                             | description                                                                                                                                                                          |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ls`     | `ls [<path to dir>]`              | List children of current working directory or given directory.                                                                                                                       |
| `tree`   | `tree [<path to dir>]`            | Lists all children of current working directory or given directory in tree format                                                                                                    |
| `cd`     | `cd [<path>]`                     | Move into given directory. If no path given move to root.                                                                                                                            |
| `touch`  | `touch <path to link> <url>`      | Create a new link                                                                                                                                                                    |
| `mkdir`  | `mkdir <path to dir>`             | Create a new directory                                                                                                                                                               |
| `rm`     | `rm <path to link>`               | Delete link                                                                                                                                                                          |
| `rmdir`  | `rmdir <path to dir>`             | Delete dir and all contents                                                                                                                                                          |
| `search` | `search [-e] ["<search string>"]` | Search with given search string (Must be in quotes to capture multiple words). Supply `-e` with a search URL or pre-defined engine (`ddg`, `google`, `bing`) to change search engine |
| `clear`  | `clear`                           | Clear the terminal of past commands.                                                                                                                                                 |
| `mv`     | `mv <source path> <target path>`  | "Move" file or directory. Allows for renaming/moving resources within the file tree.                                                                                                 |
| `edit`   | `edit <link path> <url>`          | Change the URL value for a given link.                                                                                                                                               |
| `help`   | `help [<command>]`                | Get information on commands.              

Privacy Policy for HomeTerm
HomeTerm does not collect, store, or transmit any personal data.
All processing occurs locally within your browser. No information
is sent to external servers or third parties.

If you have any questions, contact me.
