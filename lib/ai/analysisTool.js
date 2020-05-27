const settings = require('../settings');

let testList = [
    [
        [0,1],
        [1,2],
        [8,8],
        [6,9],
    ],
    [
        [1,2],
        [2,3],
        [8,8],
        [6,9],
    ],
    [
        [2,3],
        [2,3],
        [8,8],
        [6,9],
    ],
    [
        [3,3],
        [3,4],
        [8,8],
        [6,9],
    ],
]

function calcDegrees(x,y){
    if(x == 0 && y == 0){
        return -1;
    } else {
        return (360 - (Math.atan2(y,x) * (180 / Math.PI)) + 90) % 360;
    }
}

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

function calculateAverages(list){
    let total = 0;
    let frequency = 0;
    let averages = [];
    for(columns = 0; columns < list[0].length; columns++){
        total = 0;
        frequency = 0;
        averages.push(
            roundDegreesCircle(
                calcDegrees(list[list.length-1][columns].x - list[0][columns].x, list[list.length-1][columns].y - list[0][columns].y)
            )
        );
    }
    return averages;
}

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
