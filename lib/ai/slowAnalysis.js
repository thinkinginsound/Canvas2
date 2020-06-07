/**
 @module slowAnalysis
 @description
  meh
*/

function createLabels(matrix,evaluationFrames,offset){
    if(evaluationFrames <= 2 || offset < 0){
        throw "Not allowed to set frames less then 2 or offset lesser then 0";
    }
    let features = matrix;
    //Similair function to the numpy.zeros(w,h) function
    let zeros = (w, h, v = 0) => Array.from(new Array(h), _ => Array(w).fill(v));
    //Prepare labels with same w and h as features but already filles with zeros
    let labels = zeros(features[0].length,features.length)
    let listToEvaluate = [];

    for(let colNum = 0; colNum < features[0].length; colNum++ ){                                //features[0].length
        for(let rowNum = 0; rowNum < features.length; rowNum++){                                //Iterate through a number of columns and rows of features list
            for(let evalListFill = 0; evalListFill < evaluationFrames; evalListFill++){     //Until number of evaluation numbers is reached dont proceed
                if(evaluationFrames <= features.slice(rowNum).length){
                    listToEvaluate.push(features[rowNum + evalListFill][colNum]);
                }
            }                                                                                   //Start evaluation process
            for(let columnIndex = 0; columnIndex < features[0].length; columnIndex++){         //features[0].length
                let evaluationIterator = 0;
                let startIndex = [];
                let offsetIterator = 0;
                for(let rowIndex = 0; rowIndex < features.length; rowIndex++){
                    if(columnIndex != colNum && rowIndex > rowNum){
                        if(features[rowIndex][columnIndex] == listToEvaluate[evaluationIterator] && offsetIterator <= offset){
                            if(startIndex.length == 0) startIndex = [rowIndex,columnIndex];
                            if(evaluationIterator == listToEvaluate.length-1){
                                for(let writer=0; writer < rowIndex-startIndex[0]+1;writer++){
                                    labels[(startIndex[0]+writer)][columnIndex] = 1;
                                }
                                evaluationIterator = 0;
                                offsetIterator = 0;
                                startIndex = [];
                            } else{
                                evaluationIterator++;
                            }
                        } else if(offsetIterator > offset){
                            evaluationIterator = 0;
                            offsetIterator = 0 ;
                            startIndex = [];
                        } else if(startIndex.length >= 1){
                            offsetIterator++;
                        }
                    }
                }
            }
            listToEvaluate = [];
        }
        listToEvaluate = [];
    }
    return labels;
}

module.exports = {createLabels}
