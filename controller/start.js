var express = require('express'); 
var path = require('path');
var app = express(); 
  
app.listen(3000, function() { 
    console.log('server running on port 3000'); 
} ) 
  
app.get('/secondClassification', secondClassification); 

app.get('/firstClassification', firstClassification); 

app.get('/nameClassifier', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
  
function secondClassification(req, res) { 

    var myPythonScriptPath = 'tflow/scripts/label_image.py';

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

        console.log('finished');
    });
} 


function firstClassification(req, res) { 

    var myPythonScriptPath = 'tflow/scripts/first-classification.py';

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

        console.log('finished');
    });
}