var moment = require("moment-timezone");
var utils = require('./utils');

module.exports = {
    
    addInvestmentDataLayer : function(arrEarningAnnouncements) {

        var windowsReturnInterval = 0;
        arrEarningAnnouncements.forEach(curr => { windowsReturnInterval += Math.abs(curr.windowReturn * 100 - 100)});
        arrEarningAnnouncements.forEach(curr => {
            curr.direction = curr.data[0].close > curr.data[curr.data.length - 1].open ? -1 : 1;
            curr.investmentRatio = (Math.abs(curr.windowReturn * 100 - 100) / windowsReturnInterval);
        })

        return arrEarningAnnouncements;
    },
    minimizeSharesList : function(arrEarningAnnouncements, params) {

        var minimizedVolumeArray = [];
        var minimizedFinalArray = [];
        
        arrEarningAnnouncements.forEach(share => {
            if (share.data[0].volume >= params.minimumVolume) 
                minimizedVolumeArray.push(share);
        });

        minimizedFinalArray = this.minimizePriceWindowAndQuantiles(
            minimizedVolumeArray, 
            params.withQuantilesCheck, 
            params.withWindowReturnsCheck, 
            false, 
            params.minimumPrice, 
            params.minimumWindowReturn, 
            params.countOfQuantiles);

        return minimizedFinalArray;
    },


    minimizePriceWindowAndQuantiles : function(arrEarningAnnouncements, bWitQuantilesCheck, bWithWindowReturnsCheck, bWithWindowReturnsCheckWhenSingle, minPirce, upperThanReturn, countOfQuantiles) {
        
        const COUNT_OF_DISTRIBUTION_SLICES = 20;
        arrValues = [];
        arrDestrebutions = []; 
        for (let i = 0; i < COUNT_OF_DISTRIBUTION_SLICES + 1; i++) {
            arrValues.push(0);
            arrDestrebutions.push(0);
        }
        var dMin = Number.MAX_VALUE;
        var dMax = Number.MIN_VALUE;
        upperThanReturn = upperThanReturn / 100;

        // Set returns in window
        arrEarningAnnouncements.forEach(curr => {
            curr.windowReturn = curr.data[0].close / curr.data[curr.data.length - 1].open;
            if (curr.windowReturn < dMin) dMin = curr.windowReturn;
            if (curr.windowReturn > dMax) dMax = curr.windowReturn;
        });

        // Set values ranges
        arrValues[0] = dMin;
        for (let i = 1; i < arrValues.length; i++)
            arrValues[i] = arrValues[i - 1] + ((dMax - dMin) / COUNT_OF_DISTRIBUTION_SLICES);

        // Find value range cell
        arrEarningAnnouncements.forEach(curr => {
            let i;
            for (i = 0; ((i < arrValues.length) && (curr.windowReturn >= arrValues[i])); i++) ;
            arrDestrebutions[i - 1]++;
            curr.quantile = i - 1;
        });

        // Set destribution and quantiles
        arrDestrebutions[0] = arrDestrebutions[0] / arrEarningAnnouncements.length;
        for (let i = 1; i < arrDestrebutions.length; i++) {
            arrDestrebutions[i] = arrDestrebutions[i - 1] + (arrDestrebutions[i] / arrEarningAnnouncements.length);
            arrDestrebutions[i - 1] = Math.floor((arrDestrebutions[i - 1] / (1.0 / countOfQuantiles)) - 0.0001);
        }
        arrDestrebutions[arrDestrebutions.length - 1] = Math.floor((arrDestrebutions[arrDestrebutions.length - 1] / (1.0 / countOfQuantiles)) - 0.0001);

        // Set final quantils
        arrEarningAnnouncements.forEach(curr => { curr.quantile = Math.floor(arrDestrebutions[curr.quantile]); });

        // Upper than
        minimizedFinalArray = [];
        arrEarningAnnouncements.forEach(curr => {
            if ((curr.data[0].close < minPirce) || 
                (curr.windowReturn == 1) ||
                ((bWitQuantilesCheck) && (curr.quantile != 0) && (curr.quantile != countOfQuantiles - 1)) ||
                ((bWithWindowReturnsCheck) && (curr.windowReturn < 1 + upperThanReturn) && (curr.windowReturn > 1 - upperThanReturn))) {
                console.log(curr.symbol + " minimized with volume: " + curr.data[0].volume + " windowReturn: " + curr.windowReturn + " quantile: " + curr.quantile + " lastPrice: " + curr.data[0].close);
            }
            else {
                minimizedFinalArray.push(curr);
            }
            

            //if ((curr.windowReturn == 1) ||
            //    ((bWithWindowReturnsCheckWhenSingle) && (curr.length == 1) && (curr.windowReturn < 1 + upperThanReturn) && (curr.windowReturn > 1 - upperThanReturn))) {
            //    console.log(curr.symbol + " minimized with volume: " + curr.volume + " windowReturn: " + curr.windowReturn + " quantile: " + curr.quantile + " lastPrice: " + curr.data[0].close);
            //}
            //else {
            //    minimizedFinalArray.push(curr);
            //}
        });

        return minimizedFinalArray;
    }
}