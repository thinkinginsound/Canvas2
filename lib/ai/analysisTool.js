function calcDegrees(x,y){
    let Degrees = (360 - (Math.atan2(y,x) * (180 / Math.PI)) + 90) % 360;
    return Degrees;
}

function roundDegreesCircle(Degrees){
    let roundedDegrees = Degrees+45;
    while(roundedDegrees > 45){
        roundedDegrees -= 45
    }
    if(roundedDegrees > 45/2){
        roundedDegrees = 45 - roundedDegrees
    } else {
        roundedDegrees = roundedDegrees * -1
    }
    Degrees += roundedDegrees
    return Degrees
}

function calculateAverages(list){
    let total = 0;
    let frequency = 0;
    let averages = [];
    for(columns = 0; columns < list[0].length; columns++){
        total = 0;
        frequency = 0;
        for(rows = 0; rows < list.length-1; rows++){
            total += calcDegrees(list[rows+1][columns][0] - list[rows][columns][0], list[rows+1][columns][1] - list[rows][columns][1]);
            frequency = rows + 1;
        }
        averages.push(roundDegreesCircle(total/frequency))
    }
    return averages;
}

function findSheep(list){
    averagesList = calculateAverages(list);
    let sheep = [0,0,0,0]; //set to global user amount
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
