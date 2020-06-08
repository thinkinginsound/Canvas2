/**
 @module analysisTool
 @description
  Calculates herdig behaviour by comparing users
*/

const settings = require('../settings');

/**
	@description Function that calculates x and y coordinates to degrees with north as 0
  @param {number} x X Coordinate
  @param {number} y Y Coordinate
  @return {number}
*/
function calcDegrees(x,y){
    if(x == 0 && y == 0){
        return -1;
    } else {
        return (360 - (Math.atan2(y,x) * (180 / Math.PI)) + 90) % 360;
    }
}

/**
	@description Function that maps degrees to north or south
  @param {number} Degrees Input to be converted
  @return {number}
*/
function roundDegreesCircle(Degrees){
    if(Degrees !== -1){
        let roundedDegrees = Degrees+45;
        while(roundedDegrees > 45){
            roundedDegrees -= 45;
        }
        if(roundedDegrees > 45/2){
            roundedDegrees = 45 - roundedDegrees;
        } else {
            roundedDegrees = roundedDegrees * -1;
        }
        Degrees += roundedDegrees;
    }
    return Degrees;
}

/**
	@description Calculates the average by comparing the coordinates of first frame to the last.
  @param {UserInput[]} list Input to be converted
  @return {number[]}
*/
function calculateAverages(list){
    let averages = [];
    for(columns = 0; columns < list[0].length; columns++){
        averages.push(
            roundDegreesCircle(
                calcDegrees(list[list.length-1][columns].x - list[0][columns].x, list[list.length-1][columns].y - list[0][columns].y)
            )
        );
    }
    return averages;
}

/**
	@description Calculates herdig behaviour by comparing users
  @param {number} list Input to be converted
  @return {number}
*/
function findSheep(list){
    averagesList = calculateAverages(list);
    let sheep = new Array(settings.maxusers).fill(0); //set to global user amount
    averagesList.forEach((degree,index)=>{
        for(herder = 0; herder < averagesList.length; herder++){
            if(herder != index && degree == averagesList[herder]) sheep[herder] = 1;
        }
    });
    return sheep;
}

module.exports = {
    findSheep : findSheep
}
