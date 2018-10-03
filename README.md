# 🌩💥🐦 Thunderbird

Converts a curriculum from a `structure.xml` file and a bunch of folders
into a curriculum.json. Adds UUIDs, merges metadata, and creates the
curriculum tree.

## Installation

```bash
npm install -g thunderbird
```

## Usage

```bash
thunderbird --help
```

In most cases, you just need to run the default `thunderbird` in a curriculum directory.

## Updating

`thunderbird` checks for new versions of itself on `npm` every time it runs.

## Development

To run `thunderbird` locally, you'll need gulp to be installed globally:

```sh
npm install -g gulp
```

You can run the local, development version of `thunderbird` by running:

```sh
node -v # 6.10
node thunderbird.js
```

You'll probably want to run `thunderbird` from inside a curriclum directory. From inside a curriculum root directory, you can build that curriculum by running:

```sh
node [~/path/to/thunderbird.js] --build-dir=content
```

It may be useful to `alias` `node [~/path/to/thunderbird.js]` in your shell's rc file, so you can run it easily from anywhere:

```sh
alias tbird="node [~/path/to/thunderbird.js]"
```

You shouldn't alias it to `thunderbird` to avoid a conflict with the published version.

![YAAAAAAAAASS](https://cloud.githubusercontent.com/assets/297455/4094915/97958bd4-2fad-11e4-9e94-64d06a5f7e1f.jpg)
