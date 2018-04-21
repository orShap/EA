const utils         = require('./utils');
const utilsWeb      = require('./utilsWeb');
const utilsStrategy = require('./utilsStrategy');
const firebase      = require("firebase");
const functions     = require('firebase-functions');
const moment        = require("moment-timezone");
const rp            = require('request-promise');
const async         = require('asyncawait/async');
const await         = require('asyncawait/await');
const cors          = require('cors');
firebase.initializeApp({
    apiKey: "AIzaSyAPxVY9M579OhCfjHPTP834q7w4xPiLLns",
    authDomain: "shapira-pro.firebaseapp.com",
    databaseURL: "https://shapira-pro.firebaseio.com",
    projectId: "shapira-pro",
    storageBucket: "shapira-pro.appspot.com",
    messagingSenderId: "813284272810"
});
 
var database = firebase.database();
var cachedSharesData;
var cachedEarningsCalendar;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// firebase ruls
// {
//  "rules": {
//    ".read": "auth != null",
//    ".write": "auth != null"
//  }
//}
//

var getRangeReturns = async(function(start, end) {
    var rangeToReturn = {};
    if (start < end) {
        var curr = moment(start).format().substring(0,10);
        var arrAllDates = [];
        var paramsValues = [];
        for(let key in utils.params) paramsValues.push(utils.params[key]);
        var symbolsToBuy = await (database.ref('/eaSymbolsToBuy/' + paramsValues.join('/')).once('value'));
        var positionReturns = await (database.ref('/eaPositionsInfo').once('value'));

        if (symbolsToBuy.exists() && positionReturns.exists()) {

            symbolsToBuy = symbolsToBuy.val();
            positionReturns = positionReturns.val();
            
            while (curr <= end) {
                let arrInfo = [];
                let currSymbolsToBuy = symbolsToBuy[curr];
                let currDateReturn = positionReturns[curr]
                if (currSymbolsToBuy) {
                    Object.keys(currSymbolsToBuy).forEach(k => {
                        let currShare = currSymbolsToBuy[k];
                        if (currShare && currShare.symbol) {
                            currShare.data = currDateReturn[currShare.symbol.replace('.','-')];
                            arrInfo.push(currShare);
                        }
                    });
                }
                rangeToReturn[curr] = arrInfo;
                curr = moment(moment(curr) + (60000 * 60 * 25)).format().substring(0,10);
            }
        }
    }
    return (rangeToReturn);
})

var getDailyReturns = async(function(date) {
    var wantedDate = utils.clearFormatedTZDate(moment.tz(date, "America/New_York")).substring(0,10);
    var paramsValues = [];
    var arrInfo = [];
    var updates = {};
    for(var key in utils.params) paramsValues.push(utils.params[key]);
    var paramsPath = paramsValues.join('/');
    var dbPath = '/eaSymbolsToBuy/' + paramsPath + '/' + wantedDate;
    var snapshot = await (database.ref(dbPath).once('value'));
    
    if (snapshot.exists()) {

        var symbolsToBuy = snapshot.val();
        var keys = Object.keys(symbolsToBuy);
        for (var k = 0; k < keys.length; k++) {
            var currElement = symbolsToBuy[keys[k]];
            currElement.data = await (getPositionReturns(currElement.symbol, wantedDate, updates))
            arrInfo.push(currElement);
        }
            
        database.ref().update(updates);
    }

    return arrInfo;
});

var getPositionReturns = async(function(symbol, date, updates) {
    var wantedDate = utils.clearFormatedTZDate(moment.tz(date, "America/New_York")).substring(0,10);
    var dbPath = '/eaPositionsInfo/' + wantedDate + '/' + symbol.replace('.','-');
    
    // if there are values in db return them! 
    var snapshot = await (database.ref(dbPath).once('value'));

    if (snapshot.exists())
        return (snapshot.val());
    else {
        var dataStart = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, 1, wantedDate, true, false));
        var dataEnd = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, 1, wantedDate, false, true));
        
        if (dataStart.length == 1 && dataEnd.length == 1) {
            
            var positionInfo = { 
                positionReturn: (dataEnd[0].close / dataStart[0].close), 
                open: dataStart[0].close, 
                close: dataEnd[0].close, 
                low: dataEnd[0].low,
                high: dataEnd[0].high,
                dateOpen : dataStart[0].date, 
                dateClose : dataEnd[0].date, 
            };

            if (updates)
                updates[dbPath] = positionInfo;
            else {
                var updates = {};
                updates[dbPath] = positionInfo;
                database.ref().update(updates);
            }
            
            return (positionInfo);
        }

        return ({ positionReturn: 1, close: 1, open: 1 });
    }
});

var predictInvestmentsByDate = async(function(date) {

    var ET = utils.dateToCheck(date);
    var updates = {};
    var paramsValues = [];
    for(var key in utils.params) paramsValues.push(utils.params[key]);       
    var paramsPath = paramsValues.join('/');
    var dbPath = '/eaSymbolsToBuy/' + paramsPath + '/' + ET.wantedTimeET.substring(0,10);

    // Not a valid time
    if (!ET.validTimeCheck && !ET.isWeekend) {
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

        return (arrEarningAnnouncements);
    }
});

var addDataLayer = async (function(arrEarningAnnouncements, nNumOfDays, wantedDate) {

    var updates = {};
    var asyncInChunk = 5;

    //arrEarningAnnouncements.forEach(element => {
    for (var index = 0; index < arrEarningAnnouncements.length; index+=asyncInChunk) {
        
        let chunk = arrEarningAnnouncements.slice(index,index+asyncInChunk)
        await (Promise.all(chunk.map(async ((element) => {

            try {
                element.data = await (getShareDataBeforeWantedDate(element.symbol, nNumOfDays, wantedDate.substring(0,10), updates));
            }
            catch (err) {
                var strErr = String(err);
                if (strErr.indexOf("Our engineers") != -1)  {
                    //console.log("We've been blocked!, they thing we did D-DOS-!-!-!-!-!-!-!-!-!-!-!-!")
                }
                else
                    console.error(err);
            }

        }))));
    }
    //});

    arrEarningAnnouncements.forEach(element => {if (!element.data) console.error(element.symbol + " didn't get DataLayer - " + wantedDate)});
    database.ref().update(updates);
    return arrEarningAnnouncements;
});

var getShareDataBeforeWantedDate = async (function(symbol, nNumOfDays, wantedDate, updates) {

    var arrToReturn = [];
    var dbPath = '/eaSharesData/' + symbol.replace('.','-');
    var shareData;
    var retriveDataFromWeb = true;
    var index;

    
    if (cachedSharesData) {
        shareData = cachedSharesData[symbol];
    }
    if (shareData) {
        //console.log("Had " + symbol + " in Cashe!");
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

        shareData.sort((a, b) => { return moment(b.date).diff(moment(a.date)) });

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
        //console.log("Had " + symbol + " relevant dates in DB!");
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
        updates[dbPath] = arrToReturn;
        return (arrNewData);
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
            //console.log("Try take relevant EA-Calendar data form DB");
        }
    }
    else {
        if (!cachedEarningsCalendar) {
            snapshot = await (database.ref('/eaCalendar/').once('value'));
            cachedEarningsCalendar = snapshot.val();
            //console.log("Take all EA-Calendar data for BATCH-REQUEST!");
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
        var dayBefore = moment.tz(moment(utils.clearFormatedTZDate(sameDay)) - (60000 * 60 * 1), "America/New_York");
        if (sameDay.day() == 6)
            sameDay = moment.tz(moment(utils.clearFormatedTZDate(sameDay)) + (60000 * 60 * 25), "America/New_York");
        if (sameDay.day() == 0)
            sameDay = moment.tz(moment(utils.clearFormatedTZDate(sameDay)) + (60000 * 60 * 25), "America/New_York");
        if (dayBefore.day() == 0)
            dayBefore = moment.tz(moment(utils.clearFormatedTZDate(dayBefore)) - (60000 * 60 * 1), "America/New_York");
        if (dayBefore.day() == 6)
            dayBefore = moment.tz(moment(utils.clearFormatedTZDate(dayBefore)) - (60000 * 60 * 1), "America/New_York");

        sameDay = utils.clearFormatedTZDate(sameDay);
        dayBefore = utils.clearFormatedTZDate(dayBefore);
        arrToReturn = await (utilsWeb.getZacksEarningsCalendar(dayBefore, "amc", arrToReturn));
        arrToReturn = await (utilsWeb.getZacksEarningsCalendar(sameDay, "bmo", arrToReturn));

        var updates = {};
        updates[dbPath] = arrToReturn;
        database.ref().update(updates);
        //console.log("Took rlevant calendar from ZACKS-WEB and save it to DB!");
    }

    return arrToReturn;
})












var getRangeReturnsFN = async (function(fbReq, fbRes) {
    const { start, end } = fbReq.body;
    if (!start || !end || start > end)
        fbRes.sendStatus(400);

    try {
        fbRes.send(await(getRangeReturns(start, end)));
    }
    catch (err) {
        console.error(err);
        fbRes.sendStatus(400);
    }
});
var getDailyReturnsFn = async (function(fbReq, fbRes) {
    
    const { date } = fbReq.body;
    if (!date)
        fbRes.sendStatus(400);

    try {
        fbRes.send(await(getDailyReturns(date)));
    }
    catch (err) {
        console.error(err);
        fbRes.sendStatus(400);
    }
});
exports.getRangeReturns = functions.https.onRequest(async ((fbReq, fbRes) => {
    var corsFn = cors({origin: true});
    corsFn(fbReq, fbRes, function() {
        getRangeReturnsFN(fbReq, fbRes);
    });
}));
exports.getDailyReturns = functions.https.onRequest(async ((fbReq, fbRes) => {
    var corsFn = cors({origin: true});
    corsFn(fbReq, fbRes, function() {
        getDailyReturnsFn(fbReq, fbRes);
    });
}));
exports.getPositionReturns = functions.https.onRequest(async ((fbReq, fbRes) => {

    var { date, symbol } = fbReq.body;
    if (!date || !symbol)
        res.sendStatus(400);

    try {
        fbRes.send(await(getPositionReturns(symbol,date)));
    }
    catch (err) {
        console.error(err);
        fbRes.sendStatus(400);
    }
}));
exports.predictInvestmentsByDate = functions.https.onRequest(async ((fbReq, fbRes) => {
    var { date } = fbReq.body;
    try {
        fbRes.send(await(predictInvestmentsByDate(date)));
    }
    catch (err) {
        console.error(err);
        fbRes.sendStatus(400);
    }
}));

const gcs = require('@google-cloud/storage')();
const gcsBucket = gcs.bucket('shapira-pro.appspot.com');
exports.getPublicURI = functions.storage.object().onChange(async ((event) => {
    
    if (event.data) {
        var fileBucket = event.data.bucket;
        var filePath = event.data.name;
        //var gcsBucket = gcs.bucket(fileBucket);
        var file = gcsBucket.file(filePath);
        var signedUrls = await (file.getSignedUrl({ action: 'read', expires: '01-01-2400' }));
        console.log(signedUrls[0]);
        updates['/eaWebInfo/' +  filePath] = signedUrls[0]
        return database.ref().update(updates);
    }
    return null;
}));
exports.symbolsToBuyListener = functions.database.ref('/eaSymbolsToBuy/{withQuantilesCheck}/{withWindowReturnsCheck}/{countOfQuantiles}/{windowSize}/{minimumPrice}/{minimumWindowReturn}/{minimumVolume}/{date}').onWrite(async (event => {
    const { withQuantilesCheck, withWindowReturnsCheck, countOfQuantiles, windowSize, minimumPrice, minimumWindowReturn, minimumVolume } = event.params;
    var updates = {};
    var previous = event.data.previous.val();
    var current = event.data.val();
  
    if (!previous && current) {
        updates['/eaWebInfo/todoActions/'] = current
        return database.ref().update(updates);
    }
    return null;
  }));














































var express = require('express');
var app = express();
var bodyParser = require('body-parser');
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

var ams = 0;
var ainvocations = 0;
app.post('/getPositionReturns', async ((req, res) => {

    var { date, symbol } = req.body;
    if (!date || !symbol)
        res.sendStatus(400);
    try {
        var start = (new Date()).getTime();
        var result = await(getPositionReturns(symbol,date));
        var end = (new Date()).getTime();
        ams += (end - start);
        ainvocations++;
        var delta = ams / ainvocations;
        console.log(date + ': getPositionReturns ' + delta + 'ms');
        res.send(result);
    }
    catch (err) {
        console.error(err);
        res.sendStatus(400);
    }
}));

var bms = 0;
var binvocations = 0;
app.post('/predictInvestmentsByDate', async ((req, res) => {

    var { date } = req.body;
    try {
        var start = (new Date()).getTime();
        var result = await(predictInvestmentsByDate(date));
        var end = (new Date()).getTime();
        bms += (end - start);
        binvocations++;
        var delta = bms / binvocations;
        console.log(date + ': predictInvestmentsByDate ' + delta + 'ms');
        res.send(result);
    }
    catch (err) {
        console.error(err);
        res.sendStatus(400);
    }
}));

//predictInvestmentsByDate("2017-04-26")
//getDailyReturns("2017-04-04")
//predictInvestmentsByDate("2017-08-03")