var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const rp = require('request-promise');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
var port = process.env.PORT || 8080; 
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
var server = app.listen(port, function () {
  console.log('EA - listening on port ' + port + '!');
});
server.setTimeout(600000);

// // git push heroku master
// // heroku logs -t
// // herolu restart -a shapira

app.post('/getProxy', async ((req, res) => {
    var { url } = req.body;
    try {
        var html = await (rp({url : url, method: 'GET'})); 
        res.send(html);
    }
    catch (err) {
        console.error(err); // err.message
        res.sendStatus(400);
    }
}));