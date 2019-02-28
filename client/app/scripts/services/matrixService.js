(function() {
  'use-strict';

  angular
    .module('clientApp')
    .service('MatrixService', MatrixService);

  function MatrixService() {

    return {
      getMatrix: getMatrix
    };

    function getMatrix(criterio, real, predicted) {
      var matrix = {
        tp: 0,
        tn: 0,
        fp: 0,
        fn: 0
      };

      _.forEach(real, function(r, username) {
        if(r[criterio]) {
          if(predicted[username][criterio]) matrix.tp += 1;
          if(!predicted[username][criterio]) matrix.fp += 1;
        } else {
          if(predicted[username][criterio]) matrix.fp += 1;
          if(!predicted[username][criterio]) matrix.tn += 1;
        }
      });
      matrix.error = (matrix.fp + matrix.fn) / (matrix.tp + matrix.fp + matrix.tn + matrix.fn);
      matrix.accuracy = (matrix.tp + matrix.tn) / (matrix.tp + matrix.fp + matrix.tn + matrix.fn);
      matrix.precision =  matrix.tp + matrix.fp > 0 ? (matrix.tp) / (matrix.tp + matrix.fp) : 0;
      matrix.recall =  matrix.tp + matrix.fn > 0 ? (matrix.tp) / (matrix.tp + matrix.fn) : 0;
      matrix.fmeasure = matrix.precision + matrix.recall > 0 ? 2 * (matrix.precision * matrix.recall / (matrix.precision + matrix.recall)) : 0;
      return matrix;
    }
  }

})();

