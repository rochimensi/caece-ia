(function() {
  'use strict';

  angular
    .module('clientApp')
    .controller('MainController', MainController);

  MainController.$inject = ['$scope', '$state', '$localStorage', 'ngDialog'];

  function MainController($scope, $state, $localStorage, ngDialog) {

    $scope.go = go;
    $scope.goToDefault = goToDefault;
    $scope.host = HOST;
    $scope.logout = logout;
    $scope.closeDialog = closeDialog;

    // Redirect to state
    function go(state, params) {
      if(params) $state.go(state, params);
      else $state.go(state);
    }

    function goToDefault() {
      $state.go("home");
    }

    function logout() {
      delete $localStorage.data;
      $state.go("login");
    }

    function closeDialog() {
      ngDialog.closeAll();
    }
  }

})();
