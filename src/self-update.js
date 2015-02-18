var StringDecoder = require('string_decoder').StringDecoder;
var request = require('request');

var runIfLatest = function(run) {

    process.stdout.write("****** Checking for Thunderbird updates... ");

    var localVersion = require("./../package.json")["version"];
    request.get("http://registry.npmjs.org/thunderbird/latest", function(err, body) {
        if (err) {
            process.stdout.write("Error!", err);
            process.exit(1);
        }
        else {
            console.log("Response from npm", body.body);
            process.exit(0);
        }

    });
}

module.exports = runIfLatest;
