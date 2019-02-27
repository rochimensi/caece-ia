var express = require('express'); 
var path = require('path');
var app = express(); 
  
app.listen(3000, function() { 
    console.log('server running on port 3000'); 
} ) 
  
app.get('/classify', classify); 

function classify(req, res) { 

    var myPythonScriptPath = 'tflow/scripts/classify.py';

    // Use python shell
    const {PythonShell} = require("python-shell");
    var pyshell = new PythonShell(myPythonScriptPath);

    pyshell.on('message', function (message) {
        console.log(message);
    });

    pyshell.end(function (err) {
        if (err){
            throw err;
        };
    });
}