(function() {
  angular
    .module('clientApp')
    .directive('inputError', inputError);

  function inputError() {

    return {
      restrict: 'E',
      template: '<div class="arrow-up"></div><div class="error-tooltip" ng-bind="error"></div>',
      scope: {
        error: '='
      }
    };
  }
})();
