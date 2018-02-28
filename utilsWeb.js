var moment = require("moment-timezone");
var utils = require('./utils');
var rp = require('request-promise');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports = {
    
    getYahooShareDataBeforeWantedDate : async (function (symbol, nNumOfDays, wantedDate) {
        
        if (symbol == "RDS.A")
        var a=3;

        const url = "https://finance.yahoo.com/quote/" + symbol + "/history?"
        var arrToReturn = [];
        var numOfTrys = 0;
        var dayRows = [];
        var strToFind = "\"HistoricalPriceStore\":{\"prices\":";
        var a = "{\"date\":";
        var b = "\"open\":";
        var c = "\"close\":";
        var d = "\"volume\":";
        var e = "\"high\":";
        var f = "\"low\":";

        while (arrToReturn.length == 0 && numOfTrys < 3) {

            var currDate    = utils.clearFormatedTZDate(moment.tz("2100-01-01", "America/New_York")).substring(0,10);
            var startDate   = utils.clearFormatedTZDate(moment.tz("1970-01-01", "America/New_York")).substring(0,10);

            try {

                var html = await (rp({url, method: 'GET'}));
                var nStartIndex = html.indexOf(strToFind);
                if (nStartIndex == -1)
                    throw "index not found";
                html = html.substring(strToFind.length + nStartIndex);
                var nEndIndex = html.indexOf(']');
                if (nEndIndex == -1)
                    throw "index not found";
                html = html.substring(0, nEndIndex);
                dayRows = html.split('}');

                for (var nDayIndex = 0; nDayIndex < dayRows.length; nDayIndex++) {

                    var arrValues;
                    try {
                        arrValues   = dayRows[nDayIndex].substring(1).split(',');
                        var lDate   = parseInt(arrValues[0].substring(a.length));
                        currDate    = utils.clearFormatedTZDate(moment.tz(moment(startDate).milliseconds() + (lDate * 1000), "America/New_York"));
                    }
                    catch (err) { };

                    if (currDate < wantedDate) {

                        for (var nIndex = 0; (nIndex < nNumOfDays) && (nIndex + nDayIndex < dayRows.length - 1); nIndex++) {

                            try {

                                arrValues       = dayRows[nIndex + nDayIndex].substring(1).split(',');
                                var lcurrDate   = parseInt(arrValues[0].substring(a.length));
                                var dOpen       = parseFloat(arrValues[1].substring(b.length));
                                var dHigh       = parseFloat(arrValues[2].substring(e.length));
                                var dLow        = parseFloat(arrValues[3].substring(f.length));
                                var dClose      = parseFloat(arrValues[4].substring(c.length));
                                var lVolume     = parseInt(arrValues[5].substring(d.length));
                                currDate        = utils.clearFormatedTZDate(moment.tz(moment(startDate).milliseconds() + (lcurrDate * 1000), "America/New_York")).substring(0,10); 
                                let selectedPlus = null;

                                if (arrToReturn.length == 0) {
                                    selectedPlus = { 
                                        wantedDate : wantedDate,
                                        plus : nNumOfDays,
                                    }
                                }

                                if (isNaN(lcurrDate) || isNaN(dOpen) || isNaN(dHigh) || isNaN(dLow) || isNaN(dClose) || isNaN(lVolume))
                                    nNumOfDays++;
                                else 
                                    arrToReturn.push({
                                        wantedDate : selectedPlus,
                                        date : currDate,
                                        close : dClose, 
                                        high : dHigh, 
                                        low : dLow, 
                                        open : dOpen, 
                                        volume : lVolume,
                                        symbol : symbol
                                    });
                            }
                            catch (err) {
                                if (dayRows[nIndex + nDayIndex].startsWith("DIVIDEND") == -1)
                                    console.log(err);
                            }
                        }

                        break;
                    }
                }
            }
            catch (err) {
                var strErr = String(err);
                if (err.indexOf("Our engineers") != -1) 
                    console.log("We've been blocked!, they thing we did D-DOS-!-!-!-!-!-!-!-!-!-!-!-!")
                else
                    console.log(err);
            }

            numOfTrys++;
            if (numOfTrys == 3 && arrToReturn.length == 0)
                console.log(dayRows.length + " Lines for :    " + symbol); 
        }

        return arrToReturn;
    }),

    getZacksEarningsCalendar : async (function(selectedDate, indicator, arrToReturn) {

        var startDate   = moment.tz("1970-01-01", "America/New_York");
        try {

            var longDate = ((moment.tz(selectedDate, "America/New_York")) - startDate) / 1000 + 22000;
            const url = "https://www.zacks.com/includes/classes/z2_class_calendarfunctions_data.php?calltype=eventscal&date=" + longDate + "&type=1";
            var html = await (rp({url, method: 'GET'}));
            var lines = html.split('[');

            console.log(selectedDate.substring(0,10) + ": " + (lines.length - 2) + " zacks earnings");
            lines.forEach(currShareLine => {

                var nStartIndex = currShareLine.indexOf("alt=\\\"");
                if (nStartIndex != -1) {

                    let nSymbolIndex = nStartIndex + "alt=\\\"".length;
                    let nEndSymbolIndex = currShareLine.indexOf(" ", nSymbolIndex);
                    let symbol = currShareLine.substring(nSymbolIndex, nEndSymbolIndex);
                    let nOffset = currShareLine.indexOf("\"amc\"") != -1 ? 1 : (currShareLine.indexOf("\"bmo\"") != -1 ? 0 : 0);
                    let nStart = currShareLine.indexOf("<div class");
                    let estimate = -999;

                    if (nStart != -1)
                    {
                        var split = currShareLine.substring(0, nStart).split(',');
                        var offset = 0;

                        for (var i = 0; i < split.length - 2; i++)
                            offset += split[i].replace(" ", "").startsWith("\"") ? 0 : 1;

                        var strEstimate = split[4 + offset].substring(2);
                        strEstimate = strEstimate.substring(0, strEstimate.length - 1);
                        estimate = parseFloat(strEstimate);
                        if (estimate == undefined || (estimate != 0 && !estimate) || isNaN(estimate))
                            estimate = -999;
                    }

                    if ((nOffset == 1 && indicator == "amc") ||
                        (nOffset == 0 && indicator == "bmo"))
                        arrToReturn.push({symbol, estimate});
                }
            });
        }
        catch (err) {
            console.log(err);
        }

        return arrToReturn;
    })
}