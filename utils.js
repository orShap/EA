var moment = require("moment-timezone");
var rp = require('request-promise');


module.exports = {
    
    decisionsTime : {
        hour : 15,
        minute: 35
    },

    params : {
        withQuantilesCheck : true,
        withWindowReturnsCheck : false,
        countOfQuantiles : 20,
        windowSize : 5,
        minimumPrice : 5,
        minimumWindowReturn : 10,
        minimumVolume : 250000,
    },

    dateToCheck : function (date) {

        var wantedTimeET;
        var validTimeCheck = true;
        
        if (date) 
            wantedTimeET = this.clearFormatedTZDate(moment.tz(date, "America/New_York"));
        else {
            var timeCheckET = moment.tz('America/New_York');
            if (timeCheckET.day() == 0 || timeCheckET.day() == 6)
                validTimeCheck = false;
                
            if ((timeCheckET.hour() != this.decisionsTime.hour) || 
                (timeCheckET.minute() < this.decisionsTime.minute))
                validTimeCheck = false;

            wantedTimeET = this.clearFormatedTZDate(moment.tz(moment(timeCheckET).milliseconds() + (86400000), "America/New_York"));
        }
        
        return ({ wantedTimeET, validTimeCheck });
        
        
    },

    clearFormatedTZDate : function(tzDate) {

        var format = tzDate.format();
        return (format.substring(0,11) + "00:00:00" + format.substring(19))
    }
}

