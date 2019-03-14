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
      var errors = {
        fp: [],
        fn: []
      };

      _.forEach(real, function(r, username) {
        if(!predicted[username]) {
          console.log(username, " no fue escaneado");
        } else {
          if (r[criterio]) {
            if (predicted[username][criterio]) {
              matrix.tp += 1;
            } else {
              matrix.fn += 1;
              errors.fn.push(username);
            }
          } else {
            if (predicted[username][criterio]) {
              matrix.fp += 1;
              errors.fp.push(username);
            }
            if (!predicted[username][criterio]) matrix.tn += 1;
          }
        }
      });
      matrix.error = (100*(matrix.fp + matrix.fn) / (matrix.tp + matrix.fp + matrix.tn + matrix.fn)).toFixed(2);
      matrix.accuracy = (100*(matrix.tp + matrix.tn) / (matrix.tp + matrix.fp + matrix.tn + matrix.fn)).toFixed(2);
      var precision = matrix.tp + matrix.fp > 0 ? (matrix.tp) / (matrix.tp + matrix.fp) : 0;
      var recall = matrix.tp + matrix.fn > 0 ? (matrix.tp) / (matrix.tp + matrix.fn) : 0;
      matrix.precision =  matrix.tp + matrix.fp > 0 ? (100*(matrix.tp) / (matrix.tp + matrix.fp)).toFixed(2) : 0;
      matrix.recall =  matrix.tp + matrix.fn > 0 ? (100*(matrix.tp) / (matrix.tp + matrix.fn)).toFixed(2) : 0;
      matrix.fmeasure = precision + recall > 0 ? (100* 2 * (precision * recall / (precision + recall))).toFixed(2) : 0;
      console.log("Errores para ", criterio);
      console.log(errors);
      return matrix;
    }
  }

})();

