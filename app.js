var express = require('express');
var app = express();
var firebase = require("firebase");
var moment = require("moment-timezone");
var utils = require('./utils');
var utilsWeb = require('./utilsWeb');
var utilsStrategy = require('./utilsStrategy');
var bodyParser = require('body-parser');
const rp = require('request-promise');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
firebase.initializeApp({
    apiKey: "AIzaSyAPxVY9M579OhCfjHPTP834q7w4xPiLLns",
    authDomain: "shapira-pro.firebaseapp.com",
    databaseURL: "https://shapira-pro.firebaseio.com",
    projectId: "shapira-pro",
    storageBucket: "shapira-pro.appspot.com",
    messagingSenderId: "813284272810"
});
 
var port = process.env.PORT || 8080; 
var database = firebase.database();
var cachedSharesData;
var cachedEarningsCalendar;
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
var server = app.listen(port, function () {
  console.log('EA - listening on port ' + port + '!');
});
server.setTimeout(600000);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// // git push heroku master 
// // heroku logs -t
// // herolu restart -a shapira
//
// firebase ruls
// {
//  "rules": {
//    ".read": "auth != null",
//    ".write": "auth != null"
//  }
//}
//

var getPositionReturns = async(function(symbol, date, callback) {
    var wantedDate = utils.clearFormatedTZDate(moment.tz(date, "America/New_York")).substring(0,10);
    var dataStart = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, 1, wantedDate, true, false));
    var dataEnd = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, 1, wantedDate, false, true));

    if (dataStart.length == 1 && dataEnd.length == 1) {
        return ({ 
            positionReturn: (dataEnd[0].close / dataStart[0].close), 
            open: dataStart[0].close, 
            close: dataEnd[0].close, 
            dateOpen : dataStart[0].date, 
            dateClose : dataEnd[0].date, 
         });
    }

    if (callback) callback({ positionReturn: 1});
    return ({ positionReturn: 1});
});

var predictInvestmentsByDate = async(function(date, callback) {

    var ET = utils.dateToCheck(date);
    var updates = {};
    var paramsValues = [];
    for(var key in utils.params) paramsValues.push(utils.params[key]);       
    var paramsPath = paramsValues.join('/');
    var dbPath = '/eaSymbolsToBuy/' + paramsPath + '/' + ET.wantedTimeET.substring(0,10);

    // Not a valid time
    if (!ET.validTimeCheck) {
        var now = moment.tz('America/New_York');
        var notActionTime = { message: "Not a time for any action", timeET : moment.tz(ET.wantedTimeET, 'America/New_York').format('DD.MM.YYYY HH:mm') };

        // Update DB only before decisions time 
        if ((now.hour() < utils.decisionsTime.hour) || 
            (now.hour() == utils.decisionsTime.hour && now.minute() < utils.decisionsTime.minute)) {
            updates[dbPath] = notActionTime;
            database.ref().update(updates);
        }

        return (notActionTime);  
    }
    else {

        var arrEarningAnnouncements = [];

        // if there are values in db return them! 
        var snapshot = await (database.ref(dbPath).once('value'));
        var earnings = snapshot.val();

        if (earnings && !earnings.message)
            arrEarningAnnouncements = earnings;
        else {
            arrEarningAnnouncements = await (getEarningsCalendar(ET.wantedTimeET));
            arrEarningAnnouncements = await (addDataLayer(arrEarningAnnouncements, utils.params.windowSize, ET.wantedTimeET));
            arrEarningAnnouncements = utilsStrategy.minimizeSharesList(arrEarningAnnouncements, utils.params);
            arrEarningAnnouncements = utilsStrategy.addInvestmentDataLayer(arrEarningAnnouncements);
            arrEarningAnnouncements.forEach(element => { if (element.data) delete element.data; });
            updates[dbPath] = arrEarningAnnouncements;
            database.ref().update(updates);
        }

        if (callback) callback(arrEarningAnnouncements);
        return (arrEarningAnnouncements);
    }
});

var addDataLayer = async (function(arrEarningAnnouncements, nNumOfDays, wantedDate) {

    arrEarningAnnouncements.forEach(element => {
    //await (Promise.all(arrEarningAnnouncements.map(async ((element) => {

        try {
            var data = await (getShareDataBeforeWantedDate(element.symbol, nNumOfDays, wantedDate.substring(0,10)));
            element.data = data;
        }
        catch (err) {
            var strErr = String(err);
            if (strErr.indexOf("Our engineers") != -1) 
                console.log("We've been blocked!, they thing we did D-DOS-!-!-!-!-!-!-!-!-!-!-!-!")
            else
                console.log(err);
        }
    })

    //)));

    return arrEarningAnnouncements;
});

var getShareDataBeforeWantedDate = async (function(symbol, nNumOfDays, wantedDate) {

    var arrToReturn = [];
    var dbPath = '/eaSharesData/' + symbol.replace('.','-');
    var shareData;
    var retriveDataFromWeb = true;
    var index;

    
    if (cachedSharesData) {
        shareData = cachedSharesData[symbol];
    }
    if (shareData) {
        console.log("Had " + symbol + " in Cashe!");
    }
    else {
        var snapshot = await (database.ref(dbPath).once('value'));
        shareData = snapshot.val();
        cachedSharesData = {};
        cachedSharesData[symbol] = shareData;
    }

    // If data exists
    if (!shareData) 
        shareData = [];
    else {

        // Find the wandetd date index
        for (index = 0; index < shareData.length; index++) {
            if (shareData[index].wantedDate && 
                shareData[index].wantedDate.wantedDate == wantedDate) 
                break;
        }

        // If data in DB contains all the transaction request - no need to retrive the data from the web
        if ((index < shareData.length) &&
            (shareData[index].wantedDate) &&
            (shareData[index].wantedDate.wantedDate == wantedDate) && 
            (shareData[index].wantedDate.plus >= nNumOfDays))
            retriveDataFromWeb = false;
    }

    // If there is no need to retrive the data from the web
    if (!retriveDataFromWeb) {
        arrToReturn = shareData.slice(index, index + nNumOfDays );
        console.log("Had " + symbol + " relevant dates in DB!");
    }
    else {
        var arrNewData = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, nNumOfDays, wantedDate, true, false)); 

        // Add the new data
        arrNewData.forEach(element => {
            shareData.push(element);
        });

        // Sort data by date (from new to old)
        shareData.sort((a, b) => { return moment(b.date).diff(moment(a.date)) });

        // Remove all duplicate data
        for (var removeIndex = shareData.length - 2; removeIndex >= 0; removeIndex--) {
            if (shareData[removeIndex].date == shareData[removeIndex + 1].date) {
                var curr = shareData[removeIndex].wantedDate ? shareData[removeIndex].wantedDate.plus : 0;
                var next = shareData[removeIndex + 1].wantedDate ? shareData[removeIndex + 1].wantedDate.plus : 0;
                if (curr < next)
                    shareData[removeIndex] = shareData[removeIndex + 1];
                
                shareData.splice(removeIndex + 1, 1);
            }
        }

        arrToReturn = shareData;
        var updates = {};
        updates[dbPath] = arrToReturn;
        database.ref().update(updates);
        console.log("Took " + symbol + " from YAHOO-FINANCE-WEB and save it to DB!");
    }

    return arrToReturn;
})

var getEarningsCalendar = async (function(wantedDate, isBatch) {

    var arrToReturn = [];
    var formatedWandedDate = wantedDate.substring(0,10);
    var dbPath = '/eaCalendar/' + formatedWandedDate;
    var snapshot;
    var currEarningsCalendar;
    
    // If not a batch request
    if (!isBatch) {
        snapshot = await (database.ref(dbPath).once('value'));
        if (snapshot.exists()) {
            currEarningsCalendar = snapshot.val();
            console.log("Try take relevant EA-Calendar data form DB");
        }
    }
    else {
        if (!cachedEarningsCalendar) {
            snapshot = await (database.ref('/eaCalendar/').once('value'));
            cachedEarningsCalendar = snapshot.val();
            console.log("Take all EA-Calendar data for BATCH-REQUEST!");
        }

        if (cachedEarningsCalendar) 
            currEarningsCalendar = cachedEarningsCalendar[formatedWandedDate];
    }

    // Check if exists in db
    if (currEarningsCalendar) { 
        arrToReturn = currEarningsCalendar;
    }
    else {

        var sameDay = moment.tz(formatedWandedDate, "America/New_York");
        var dayBefore = moment.tz(sameDay - (86400000), "America/New_York");
        if (sameDay.day() == 6)
            sameDay = moment.tz(moment(sameDay) + (86400000), "America/New_York");
        if (sameDay.day() == 0)
            sameDay = moment.tz(moment(sameDay) + (86400000), "America/New_York");
        if (dayBefore.day() == 0)
            dayBefore = moment.tz(moment(dayBefore) - (86400000), "America/New_York");
        if (dayBefore.day() == 6)
            dayBefore = moment.tz(moment(dayBefore) - (86400000), "America/New_York");

        sameDay = utils.clearFormatedTZDate(sameDay);
        dayBefore = utils.clearFormatedTZDate(dayBefore);
        arrToReturn = await (utilsWeb.getZacksEarningsCalendar(dayBefore, "amc", arrToReturn));
        arrToReturn = await (utilsWeb.getZacksEarningsCalendar(sameDay, "bmo", arrToReturn));

        var updates = {};
        updates[dbPath] = arrToReturn;
        database.ref().update(updates);
        console.log("Took rlevant calendar from ZACKS-WEB and save it to DB!");
    }

    return arrToReturn;
})



app.get('/predictInvestmentsByDate', async ((req, res) => {
    try {
        //res.send(await(predictInvestmentsByDate()));
        predictInvestmentsByDate();
        res.sendStatus(200);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
}));
app.post('/predictInvestmentsByDate', async ((req, res) => {
    var { date } = req.body;
    try {
        //res.send(await(predictInvestmentsByDate(date)));
        predictInvestmentsByDate(date);
        res.sendStatus(200);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
}));
app.post('/getPositionReturns', async ((req, res) => {
    var { date, symbol } = req.body;
    if (!date || !symbol)
        res.sendStatus(400);
    try {
        var goOn = true;
        //res.send(await(getPositionReturns(symbol, date)));
        getPositionReturns(symbol,date);
        res.sendStatus(200);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
}));
app.post('/getProxy', async ((req, res) => {
    var { url } = req.body;
    try {
        var body = await (request({url : 'https://www.zacks.com', method: 'GET'})); 
        res.send(body);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
}));

