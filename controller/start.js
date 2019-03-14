var path = require('path');
var fs = require('fs');
var Q = require('q');

function classify() {
    var deferred = Q.defer();
    var myPythonScriptPath = __dirname + '/tflow/scripts/classify.py';

    // Use python shell
    const {PythonShell} = require("python-shell");
    var pyshell = new PythonShell(myPythonScriptPath);

    pyshell.on('message', function (message) {
        console.log(message);
    });

    pyshell.end(function (err) {
        if (err){
            throw err;
        }
        console.log(">> Classifier Finished <<");
        fs.readFile(path.join(__dirname, '../server/src/followers/classification.txt'), 'utf8', function(err, contents) {
            if(err) {
                return deferred.reject("Error reading classification.txt - " + JSON.stringify(err));
            }
            deferred.resolve(contents);
        });
       
    });

    return deferred.promise;
}

module.exports = {classify};