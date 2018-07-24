const utils         = require('./utils');
const utilsWeb      = require('./utilsWeb');
const utilsStrategy = require('./utilsStrategy');
const functions     = require('firebase-functions');
const admin         = require('firebase-admin');
const moment        = require("moment-timezone");
const rp            = require('request-promise');
const async         = require('asyncawait/async');
const await         = require('asyncawait/await');
const cors          = require('cors');
admin.initializeApp({
  credential: admin.credential.cert({
    "type": "service_account",
    "project_id": "shapira-pro",
    "private_key_id": "0a537495b4a7ff81d307339a4befea9347b42776",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDBjDp9RRLOBbhn\nywVrNBacII2IW6WfEq71Ue+7XztWtfNE5iJ2ViqPOCgSIM/KJFf/xfb3STIQ+kXe\nLDywtgAmuzsevXI0jGmkrYddaJBGt5U88pGJ7x3fitT8kyaDTVB+mYI3v1WGwl2r\nY56s3MuAKwGaSE83qvgdpf8RZxIiiyZDrzMIZz7jsXQemmm77N2GyHAD2UFoGyC6\nEQ8AgLs1SCuZhZ4eQaIfk3LkyaIxHbeOvf4uzPJb4dDCCVY/UTsYw60gB1sftL+/\naAkYfXA7R5du/hoyTzatp2l120YN3ZL35Kmrdk/qyH9cLJGr4dGC7qAXhV8TEG3l\nVeu89MsnAgMBAAECggEABdzhKkl2jlyuzB+vcSKv/j65ZGrSRrh8Kdyd7gd7Q3jA\nS7mYGNmQ8UThAduSL8XC3KT66Pa3C4icdGRtDWh8WXzM1HUmPOB1lF8LsKqpyo3M\nRkv0WKdKBZF6oV2bvXJ3TVgJ3ijV+f6jpvA3lQ9P75Jd7alIrQXPlwy5ZnLAbxQw\nBmvbDNycak0zREDPqpltGdzi8/sXk8Reh+vgwaFSnSLPGNznszkurTmuQU5Khpqw\nMWlZBtPRIfZ7dOGnI5c871qp9XtXkwDt/DMI7IO28RAPTxzDrAfFH+gfH9lukzbW\nT6TyHZwo27rw6CYMjjKdT7xQhWxlTB/QxCznhxZGsQKBgQD2qz1Az53AhRMV/8/C\nijDcp9tbCmLFfS1se+7bvRuMy5T72mlweTBbHzkMl+PbgPm10a6qB3u3h87jRWNS\nMc8yigUqOZ/RhjccllCdEHullR1IjMloZ5AimumiDv8OV3VbJAIR3S8DaWmK9HOj\nlXn36CwZq0j0Mt/LP8KqI9NruwKBgQDI3o9dQ7bqDsSlOAFJ2xdKQpVkF5SqLckK\n6gCwGlN1En+F7ib9S9INEvrIVUlZvDV+S6OsO4geLWlZryieOY/KHnNyA5YvmLQi\nhl/aRJWx5I2bR5sjRbzQivjpz3/U5t3VgJ/6+jDM6AtcnUuxPanIfF/4jilk4HWJ\nbKvmJRjJhQKBgQC5BnOY1OMo0OkjHFK0Q0IpkcOJg73ZE29qK4Bc1Xn/34lubUOf\n+VebUk1Rs/FX6mPkzVbt9VUIstcuRRMeSXx5FWyQYs8NtFZMnDf1yLJm3vYrQGen\nZ9+HBZpwVD1ffZzq85SV38pvDbf8YicHsozdtwq1anT7r9mMtNQJGXxyFwKBgQC7\nCkqSvLf5MHE5q3G/tOv18RQslKyQ3nti10x2rrzhuazXKFBT8iMQm4i7vHbFwTRK\neuJYQULZXs3HfgujcdQLj9lN5DsX7OhncZqVouGFOV4GpmG2MXzE73MiPF47ABK2\neMP/LrL8SmIyBiHyU4niLrYquy2eSkgIBBH5BrgTBQKBgQCgPArpCZI8sTu0GaW9\nF9P2PowmtbNfIpKA98o/P9arRrgMWNkc0JVpee4gsIaKqzY/IXsMYGgO8VSBA5Cz\nPRmFhW73xVi9v/1YhlAKwKPm4c8mWd5qAnWj/E2GQwC6Yzt0YE/oDF2AlRN3z1XU\nUvVe3Opf/b5CbmhC58kAm/qZ/w==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-7wreq@shapira-pro.iam.gserviceaccount.com",
    "client_id": "106617783788084276411",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-7wreq%40shapira-pro.iam.gserviceaccount.com"
  }),
  databaseURL: "https://shapira-pro.firebaseio.com"
});
 
var database = admin.database();
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
                    if (!currDateReturn) 
                        currDateReturn = await (getDailyReturns(curr)) 
                    Object.keys(currSymbolsToBuy).forEach(k => {
                        let currShare = currSymbolsToBuy[k];
                        if (currShare && currShare.symbol) {
                            currShare.data = currDateReturn[currShare.symbol];
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
            if (currElement.symbol) {
                currElement.data = await (getPositionReturns(currElement.symbol, wantedDate, updates))
                arrInfo.push(currElement);
            }
        }
            
        await (database.ref().update(updates));
    }

    return arrInfo;
});

var getPositionReturns = async(function(symbol, date, updates) {
    var wantedDate = utils.clearFormatedTZDate(moment.tz(date, "America/New_York")).substring(0,10);
    var dbPath = '/eaPositionsInfo/' + wantedDate + '/' + symbol;
    
    // if there are values in db return them! 
    var snapshot = await (database.ref(dbPath).once('value'));

    if (snapshot.exists()) 
        return (snapshot.val());
    
    var dataStart = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, 1, wantedDate, true, false));
    var dataEnd = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, 1, wantedDate, false, true));
        
    if (dataStart.length == 1 && dataEnd.length == 1) {
            
        var positionInfo = { 
            positionReturn: (dataEnd[0].close / dataStart[0].close), 
            open: dataStart[0].close, 
            spreadOpen: dataEnd[0].open, 
            close: dataEnd[0].close, 
            low: dataEnd[0].low,
            high: dataEnd[0].high,
            volumeD0: dataStart[0].volume, 
            volumeD1: dataEnd[0].volume, 
            dateOpen : dataStart[0].date, 
            dateClose : dataEnd[0].date, 
        };

        if (updates)
            updates[dbPath] = positionInfo;
        else {
            var updates = {};
            updates[dbPath] = positionInfo;
            await (database.ref().update(updates));
        }
        
        return (positionInfo);
    }

    return ({ positionReturn: 1, close: 1, open: 1 });
});

var predictInvestmentsByDate = async(function(date) {

    var ET = utils.dateToCheck(date);
    var updates = {};
    var paramsValues = [];
    for(var key in utils.params) paramsValues.push(utils.params[key]);       
    var paramsPath = paramsValues.join('/');
    var dbPath = '/eaSymbolsToBuy/' + paramsPath + '/' + ET.wantedTimeET;

    // Not a valid time
    if (!ET.validTimeCheck) {
        var now = moment.tz('America/New_York');
        var notActionTime = { message: "Waiting for end of trading day...", timeET : moment.tz(ET.wantedTimeET, 'America/New_York').format('DD.MM.YYYY HH:mm'), isWeekend: ET.isWeekend};
        if (!ET.isWeekend) {
            // Update DB only before decisions time 
            if ((now.hour() < utils.decisionsTime.hour) || (now.hour() == utils.decisionsTime.hour && now.minute() < utils.decisionsTime.minute)) {
                updates[dbPath] = notActionTime;
                await (database.ref().update(updates));
            }
        }
        return (notActionTime);  
    }
    else {

        var mapEarningAnnouncementsToBuy = {};

        // if there are values in db return them! 
        var snapshot = await (database.ref(dbPath).once('value'));
        var earnings = snapshot.val();

        if (earnings && !earnings.message)
            mapEarningAnnouncementsToBuy = earnings;
        else {
            mapEarningAnnouncementsToBuy = await (getEarningsCalendar(ET.wantedTimeET));
            mapEarningAnnouncementsToBuy = await (addDataLayer(mapEarningAnnouncementsToBuy, utils.params.windowSize, ET.wantedTimeET));
            mapEarningAnnouncementsToBuy = utilsStrategy.minimizeSharesList(mapEarningAnnouncementsToBuy, utils.params);
            mapEarningAnnouncementsToBuy = utilsStrategy.addInvestmentDataLayer(mapEarningAnnouncementsToBuy);
            Object.keys(mapEarningAnnouncementsToBuy).forEach(k => { if (mapEarningAnnouncementsToBuy[k].data) delete mapEarningAnnouncementsToBuy[k].data; });
            updates[dbPath] = mapEarningAnnouncementsToBuy;
            await (database.ref().update(updates));
        }

        console.log("FINISH PREDICT!")
        return (mapEarningAnnouncementsToBuy);
    }
});

var getReportedEarnings = async(function(date) {

    var paramsValues = [];
    for(let key in utils.params) paramsValues.push(utils.params[key]);

    var today = utils.clearFormatedTZDate(moment.tz(new Date(), "America/New_York")).substring(0,10);
    var tomorrow = moment.tz(moment(utils.clearFormatedTZDate(moment.tz(today, "America/New_York"))) + (60000 * 60 * 25), "America/New_York");
    if (tomorrow.day() == 6) tomorrow = moment.tz(moment(utils.clearFormatedTZDate(tomorrow)) + (60000 * 60 * 25), "America/New_York");
    if (tomorrow.day() == 0) tomorrow = moment.tz(moment(utils.clearFormatedTZDate(tomorrow)) + (60000 * 60 * 25), "America/New_York");
    tomorrow = utils.clearFormatedTZDate(tomorrow).substring(0,10);


    var todaysEarningsCalendar = await (utilsWeb.getZacksEarningsCalendar(today, null, {}));
    var updates = {};
    var pathesMap = {};
    pathesMap['eaCalendar/' + today + '/'] = 1;
    pathesMap['eaCalendar/' + tomorrow + '/'] = 1;
    pathesMap['/eaSymbolsToBuy/' + paramsValues.join('/') + today + '/'] = 1;
    pathesMap['/eaSymbolsToBuy/' + paramsValues.join('/') + tomorrow + '/'] = 1;
    Object.keys(pathesMap).forEach(path => {
        let snapshotVal = (await (database.ref(path).once('value'))).val();
        Object.keys(todaysEarningsCalendar).forEach(symbol => {
            if (snapshotVal && snapshotVal[symbol] && todaysEarningsCalendar[symbol].reported != null)
                updates[path + symbol + '/reported'] = todaysEarningsCalendar[symbol].reported;
        });
    })
    
    await (database.ref().update(updates));
});

var addDataLayer = async (function(mapEarningAnnouncementsToBuy, nNumOfDays, wantedDate) {

    var updates = {};
    var asyncInChunk = 5;
    var arrEarningAnnouncements = [];
    Object.keys(mapEarningAnnouncementsToBuy).forEach(k => arrEarningAnnouncements.push(mapEarningAnnouncementsToBuy[k]));
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
    await (database.ref().update(updates));
    return mapEarningAnnouncementsToBuy;
});

var getShareDataBeforeWantedDate = async (function(symbol, nNumOfDays, wantedDate, updates) {

    var mapToReturn = {};
    var dbPath = '/eaSharesData/' + symbol;
    var arrShareData;
    var retriveDataFromWeb = true;
    var index;

    
    if (cachedSharesData) {
        arrShareData = cachedSharesData[symbol];
    }
    if (arrShareData) {
        //console.log("Had " + symbol + " in Cashe!");
    }
    else {
        var snapshot = await (database.ref(dbPath).once('value'));
        arrShareData = [];
        shareDataMap = snapshot.val() || {};
        Object.keys(shareDataMap).forEach(k => arrShareData.push(shareDataMap[k]));
        cachedSharesData = {};
        cachedSharesData[symbol] = arrShareData;
    }

    // If data exists
    if (!arrShareData) 
        arrShareData = [];
    else {
        arrShareData = arrShareData.sort((a, b) => { return moment(b.date).diff(moment(a.date)) });

        // Find the wandetd date index
        for (index = 0; index < arrShareData.length; index++) {
            if (arrShareData[index].wantedDate && 
                arrShareData[index].wantedDate.wantedDate == wantedDate) 
                break;
        }

        // If data in DB contains all the transaction request - no need to retrive the data from the web
        if ((index < arrShareData.length) &&
            (arrShareData[index].wantedDate) &&
            (arrShareData[index].wantedDate.wantedDate == wantedDate) && 
            (arrShareData[index].wantedDate.plus >= nNumOfDays))
            retriveDataFromWeb = false;
    }

    // If there is no need to retrive the data from the web
    if (!retriveDataFromWeb) {
        let temp = arrShareData.slice(index, index + nNumOfDays );
        temp.forEach(e => mapToReturn[e.symbol] = e);
        //console.log("Had " + symbol + " relevant dates in DB!");
    }
    else {
        var arrNewData = await (utilsWeb.getYahooShareDataBeforeWantedDate(symbol, nNumOfDays, wantedDate, true, false)); 

        // Add the new data
        arrNewData.forEach(element => {
            arrShareData.push(element);
        });

        // Sort data by date (from new to old)
        arrShareData.sort((a, b) => { return moment(b.date).diff(moment(a.date)) });

        // Remove all duplicate data
        for (var removeIndex = arrShareData.length - 2; removeIndex >= 0; removeIndex--) {
            if (arrShareData[removeIndex].date == arrShareData[removeIndex + 1].date) {
                var curr = arrShareData[removeIndex].wantedDate ? arrShareData[removeIndex].wantedDate.plus : 0;
                var next = arrShareData[removeIndex + 1].wantedDate ? arrShareData[removeIndex + 1].wantedDate.plus : 0;
                if (curr < next)
                    arrShareData[removeIndex] = arrShareData[removeIndex + 1];
                
                arrShareData.splice(removeIndex + 1, 1);
            }
        }

        arrShareData.forEach(e => mapToReturn[e.date] = e);
        updates[dbPath] = mapToReturn;
        return (arrNewData);
    }

    return arrShareData;
})

var getEarningsCalendar = async (function(wantedDate, isBatch) {

    var mapToReturn = {};
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
        mapToReturn = currEarningsCalendar;
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

        var zacsMapCalendar = {};
        sameDay = utils.clearFormatedTZDate(sameDay).substring(0,10);
        dayBefore = utils.clearFormatedTZDate(dayBefore).substring(0,10);
        zacsMapCalendar = await (utilsWeb.getZacksEarningsCalendar(dayBefore, "amc", zacsMapCalendar));
        zacsMapCalendar = await (utilsWeb.getZacksEarningsCalendar(sameDay, "bmo", zacsMapCalendar));
        mapToReturn = zacsMapCalendar

        var updates = {};
        updates[dbPath] = zacsMapCalendar;
        await (database.ref().update(updates));
        //console.log("Took rlevant calendar from ZACKS-WEB and save it to DB!");
    }

    return mapToReturn;
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
exports.getReportedEarnings = functions.https.onRequest(async ((fbReq, fbRes) => {
    try {
        fbRes.send(await(getReportedEarnings()));
    }
    catch (err) {
        console.error(err);
        fbRes.sendStatus(400);
    }
}));
exports.getEarningsCalendar = functions.https.onRequest(async ((fbReq, fbRes) => {
    var { date } = fbReq.body;
    try {
        fbRes.send(await(getEarningsCalendar(date)));
    }
    catch (err) {
        console.error(err);
        fbRes.sendStatus(400);
    }
}));

const gcs = require('@google-cloud/storage')({keyFilename: './serviceAccount.json'});
const gcsBucket = gcs.bucket('shapira-pro.appspot.com');
exports.getPublicURI = functions.storage.object().onFinalize(async ((object) => {
    
    if (object) {
        var fileBucket = object.bucket;
        var filePath = object.name;
        var file = gcsBucket.file(filePath);
        var signedUrls = await (file.getSignedUrl({ action: 'read', expires: '01-01-2400' }));
        var snapshot = await (database.ref('/eaWebInfo/gallery').once('value'));
        shareData = snapshot.val();
        shareData = shareData ? shareData : {};
        updates = {};
        updates['/eaWebInfo/gallery/' +  Object.keys(shareData).length] = signedUrls[0]
        return database.ref().update(updates);
    }
    return null;
}));
exports.symbolsToBuyListener = functions.database.ref('/eaSymbolsToBuy/{withQuantilesCheck}/{withWindowReturnsCheck}/{countOfQuantiles}/{windowSize}/{minimumPrice}/{minimumWindowReturn}/{minimumVolume}/{date}').onWrite(async ((change, context) => {
    const { withQuantilesCheck, withWindowReturnsCheck, countOfQuantiles, windowSize, minimumPrice, minimumWindowReturn, minimumVolume } = context.params;
    var updates = {};
    var previous = change.before.val();
    var current = change.after.val();
  
    if (current) {
        updates['/eaWebInfo/todoActions/'] = current
        return database.ref().update(updates);
    }
    return null;
}));














//var getAllDataBetweenDates = async(function(start, end) {
//    
//    var iter = start;
//    while (iter <= end) {
//        try {
//            var html = await (rp({
//                url : 'https://us-central1-shapira-pro.cloudfunctions.net/predictInvestmentsByDate', 
//                method: 'POST',  
//                headers: { 'Content-Type' : 'application/json', 'Accept' : 'application/json' }, 
//                body: JSON.stringify({date : iter})}));
//            //await (predictInvestmentsByDate("2017-07-27"))
//            await (getDailyReturns(iter));
//            console.log("FINISH DATE - " + iter)
//            iter = moment.tz(moment(utils.clearFormatedTZDate(moment.tz(iter, "America/New_York"))) + (60000 * 60 * 25), "America/New_York");
//            iter = utils.clearFormatedTZDate(iter).substring(0,10);
//        }
//        catch (e) {
//            console.error("error - " + iter)
//            console.error(e);
//        }
//    }
//
//    await (getRangeReturns(start, end));
//});


//getAllDataBetweenDates("2017-07-29", "2018-07-21");
//getRangeReturns("2017-07-18", "2018-07-21");































//var express = require('express');
//var app = express();
//var bodyParser = require('body-parser');
//var port = process.env.PORT || 8080; 
//app.use(bodyParser.json()); // support json encoded bodies
//app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
//var server = app.listen(port, function () {
//  console.log('EA - listening on port ' + port + '!');
//});
//server.setTimeout(600000);
//
//// // git push heroku master
//// // heroku logs -t
//// // herolu restart -a shapira
//
//var ams = 0;
//var ainvocations = 0;
//app.post('/getPositionReturns', async ((req, res) => {
//
//    var { date, symbol } = req.body;
//    if (!date || !symbol)
//        res.sendStatus(400);
//    try {
//        var start = (new Date()).getTime();
//        var result = await(getPositionReturns(symbol,date));
//        var end = (new Date()).getTime();
//        ams += (end - start);
//        ainvocations++;
//        var delta = ams / ainvocations;
//        console.log(date + ': getPositionReturns ' + delta + 'ms');
//        res.send(result);
//    }
//    catch (err) {
//        console.error(err);
//        res.sendStatus(400);
//    }
//}));
//
//var bms = 0;
//var binvocations = 0;
//app.post('/predictInvestmentsByDate', async ((req, res) => {
//
//    var { date } = req.body;
//    try {
//        var start = (new Date()).getTime();
//        var result = await(predictInvestmentsByDate(date));
//        var end = (new Date()).getTime();
//        bms += (end - start);
//        binvocations++;
//        var delta = bms / binvocations;
//        console.log(date + ': predictInvestmentsByDate ' + delta + 'ms');
//        res.send(result);
//    }
//    catch (err) {
//        console.error(err);
//        res.sendStatus(400);
//    }
//}));

//predictInvestmentsByDate("2017-04-26")
//getDailyReturns("2017-04-04")
//predictInvestmentsByDate("2017-08-03")




var aaaaa = async(function(date) {

    var snapshot = await (database.ref('/eaSymbolsToBuy/true/false/20/5/5/10/250000/').once('value'));
    var snapshota = await (database.ref('/eaPositionsInfo/').once('value'));
    var snapshotb = await (database.ref('/eaSharesData/').once('value'));
    var eaSymbolsToBuy = snapshot.val();
    var eaPositionsInfo = snapshota.val();
    var eaSharesInfo = snapshotb.val();
    var str = "";
    Object.keys(eaSymbolsToBuy).forEach(currD => {
        let cPositionsInfo = eaPositionsInfo[currD];
        
        if (cPositionsInfo)
            Object.keys(eaSymbolsToBuy[currD]).forEach(i => {
                let e = eaSymbolsToBuy[currD][i];
                let share = eaSharesInfo[e.symbol] || {};
                let position = cPositionsInfo[e.symbol]
                let volumes = "";
                let changes = "";
                let index = null;

                if (position && share) {

                    let wdate = moment.tz(currD, "America/New_York");
                    wdate = moment.tz(moment(utils.clearFormatedTZDate(wdate)) - (60000 * 60 * 1), "America/New_York");
                    if (wdate.day() == 0) wdate = moment.tz(moment(utils.clearFormatedTZDate(wdate)) - (60000 * 60 * 1), "America/New_York");
                    if (wdate.day() == 6) wdate = moment.tz(moment(utils.clearFormatedTZDate(wdate)) - (60000 * 60 * 1), "America/New_York");
                    wdate = utils.clearFormatedTZDate(wdate).substring(0,10);
                    
                    Object.keys(share).forEach(si=> { 
                        if (share[si].date == wdate) 
                            index = si;
                    })
                    if (index != null) {
                        for (let x = parseInt(index); x < parseInt(index) + 4 && x < Object.keys(share).length; x++) 
                            volumes += (share[x].volume && share[x + 1].volume ? 
                                        share[x].volume / share[x + 1].volume : "") + ',';
                        for (let x = parseInt(index); x < parseInt(index) + 4 && x < Object.keys(share).length; x++) 
                            changes += (share[x].close / share[x].open) + ',' + 
                                (share[x].open / share[x + 1].close) + ',' + 
                                (share[x].close / share[x + 1].close) + ',';
                    }
                    else 
                        return null;

                    if (e.estimate == -999)
                        return null;

                    let a = position.open;
                    let b = position.spreadOpen;
                    let c = position.close;
                    let wr = e.windowReturn;
                    let lables = "";
                    if (a<b) lables += '1,0,';
                    else  lables += '0,1,';
                    if (b<c) lables += '1,0,';
                    else  lables += '0,1,';
                    if (a<c) lables += '1,0,';
                    else  lables += '0,1,';
                    if (wr<1) lables += '1,0';
                    else  lables += '0,1';

                    str += 
                    //currD + ',' +
                    //e.symbol + ',' +
                    //e.direction + ',' +
                    //e.quantile + ',' +
                    e.estimate + ',' +
                    e.windowReturn + ',' +
                    volumes + 
                    changes + 
                    //position.open + ',' +
                    //position.spreadOpen + ',' +
                    //position.high + ',' +
                    //position.low + ',' +
                    //position.close + ',' +
                    //position.positionReturn  + ',' +
                    lables
                    + '\n';
                }
            });
    });
    console.log(str);
});


//aaaaa();
//getReportedEarnings();