var express = require('express');
var app = express();
var firebase = require("firebase");
var moment = require("moment-timezone");
var rp = require('request-promise');
var utils = require('./utils');
var utilsWeb = require('./utilsWeb');
var utilsStrategy = require('./utilsStrategy');
var bodyParser = require('body-parser');
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
app.listen(port, function () {
  console.log('listening on port ' + port + '!');
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// // git push heroku master
// // heroku logs -t
//
//
// firebase ruls
// {
//  "rules": {
//    ".read": "auth != null",
//    ".write": "auth != null"
//  }
//}
//

var getSymbolsByDate =  async(function(date) {

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
        if (snapshot.exists()) { 
            arrEarningAnnouncements = snapshot.val();
        }
        else {

            arrEarningAnnouncements = await (getEarningsCalendar(ET.wantedTimeET));
            arrEarningAnnouncements = await (addDataLayer(arrEarningAnnouncements, utils.params.windowSize, ET.wantedTimeET));
            arrEarningAnnouncements = utilsStrategy.minimizeSharesList(arrEarningAnnouncements, utils.params);
            arrEarningAnnouncements = utilsStrategy.addInvestmentDataLayer(arrEarningAnnouncements);
            updates[dbPath] = arrEarningAnnouncements;
            database.ref().update(updates);
        }

        return (arrEarningAnnouncements);
    }
});

var addDataLayer = async (function(arrEarningAnnouncements, nNumOfDays, wantedDate) {

    console.log("AddInfoLayer to all symbols");
    await (Promise.all(arrEarningAnnouncements.map(async ((element) => {

        try {
            var data = await (getShareDataBeforeWantedDate(element.symbol, nNumOfDays, wantedDate.substring(0,10)));
            element.data = data;
            console.log("...Add data to " + element.symbol);
        }
        catch (err) {
            console.log(err);
        }
            
    }))));
    console.log("AddInfoLayer was finished!");
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
        console.log("Took sharesData from cache!...");
    }
    if (shareData) {
        console.log("Had symbol data!");
    }
    else {
        var snapshot = await (database.ref(dbPath).once('value'));
        shareData = snapshot.val();
        cachedSharesData = {};
        cachedSharesData[symbol] = shareData;
        console.log("Didn't have symbol data in cache... try to take it from DB");
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
        console.log("Had wanted dates!");
    }
    else {
        var arrNewData = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, nNumOfDays, wantedDate)); 

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
        console.log("Didn't have wanted dates... took it from WEB");
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
            console.log("Took " + formatedWandedDate + " calendar from Cache...");
        }
    }
    else {
        if (!cachedEarningsCalendar) {
            snapshot = await (database.ref('/eaCalendar/').once('value'));
            cachedEarningsCalendar = snapshot.val();
            console.log("Read all " + formatedWandedDate + " calendar from DB to Cache!...");
        }

        if (cachedEarningsCalendar) {
            currEarningsCalendar = cachedEarningsCalendar[formatedWandedDate];
            console.log("Took " + formatedWandedDate + " calendar from Cache...");
        }
    }

    // Check if exists in db
    if (currEarningsCalendar) { 
        arrToReturn = currEarningsCalendar;
    }
    else {

        console.log("Didnt find " + formatedWandedDate + " calendar... Take calendar from WEB...");
        var sameDay = moment.tz(formatedWandedDate, "America/New_York");
        var dayBefore = moment.tz(sameDay - (86400000), "America/New_York");
        if (sameDay.day() == 0)
            dayBefore = moment.tz(moment(sameDay) + (86400000), "America/New_York");
        if (sameDay.day() == 6)
            dayBefore = moment.tz(moment(sameDay) + (86400000), "America/New_York");
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
    }

    return arrToReturn;
})



app.get('/', async ((req, res) => {
    try {
        res.send(await (getSymbolsByDate()));
    }
    catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
}));
app.post('/getSymbolsByDate', async ((req, res) => {
    var { date } = req.body;
    try {
        res.send(await (getSymbolsByDate(date)));
    }
    catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
}));