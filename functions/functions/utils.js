var moment = require("moment-timezone");
var rp = require('request-promise');
var logger = require('logzio-nodejs').createLogger({
    token: 'ROwipFGjEqNIgCGxbmPxbdYAbsAWRXbi',
    host: 'listener.logz.io',
    type: 'YourLogType'     // OPTIONAL (If none is set, it will be 'nodejs')
});

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
        var isWeekend = false;
        if (date) 
            wantedTimeET = this.clearFormatedTZDate(moment.tz(date, "America/New_York"));
        else {
            var timeCheckET = moment.tz('America/New_York');
            isWeekend = timeCheckET.day() == 0 || timeCheckET.day() == 6;
            validTimeCheck = !isWeekend
                
            if ((timeCheckET.hour() != this.decisionsTime.hour) || 
                (timeCheckET.minute() < this.decisionsTime.minute))
                validTimeCheck = false;

            wantedTimeET = this.clearFormatedTZDate(moment.tz(moment(timeCheckET) + (60000 * 60 * 25), "America/New_York"));
        }
        
        return ({ wantedTimeET, validTimeCheck, isWeekend });
        
        
    },

    clearFormatedTZDate : function(tzDate) {

        var format = tzDate.format();
        return (format.substring(0,11) + "00:00:00" + format.substring(19))
    },

    writeLog : function(level, message, extraInfo) {
  
        try {
      
          var env = process.env.ENV || 'Test';
          if (level != 'error' && level != 'info' && level != 'debug')
            level = 'error';
      
          var error
          if (extraInfo) {
            error = extraInfo.error;
            delete extraInfo.error;
          }
      
          var obj = { 
            env,
            level,
            message,
            error : error,
            extraInfo : extraInfo
          };
      
          console.log(env + " " + level + ": " + message + (error ? ("\n" + error) : ""))
          logger.log(obj);
        } catch (err) {
          console.error(err);
        }
      }
}

