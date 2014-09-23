"use strict";

var plExtensions = [
    "css", "js", "cpp", "c", "objc", "scala", "java",
    "swift", "xcodeproj", "lproj", "torrent", "plist", "sks",
    "xkcd", "py", "rb", "r", "matlab", "ml", "processing",
    "asm", "sql", "ejs", "erb", "jade", "hbs", "handlebars"
];

var assetsExtensions = [
    "csv", "gif",  "jpg", "jpeg", "json",
    "jpeg", "m4a", "mov", "mp3", "mp4",
    "mkv",  "ogg", "otf", "png", "psd",
    "svg",  "tar", "ttf", "wav", "webm",
    "webp", "woff", "xml", "zip"
];

module.exports = [].concat(plExtensions, assetsExtensions);

