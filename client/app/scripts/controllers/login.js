(function() {
  'use-strict';

  angular
    .module('clientApp')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$http', '$localStorage'];

  function LoginController($scope, $http, $localStorage) {

    $scope.submitted = false;
    $scope.login = login;

    function login() {
      $scope.submitted = true;
      $scope.loginError = false;

      $http.post($scope.host + "/api/login", {username: $scope.username, password: $scope.password})
        .then(function (results) {
          $localStorage.data = {
            username: $scope.username,
            profileImg: results.profile_image
          };
          $scope.go('home');
        })
        .catch(function (error, response) {
          if(error.status === 401) {
            $scope.loginError = 'Credenciales inválidas';
          }
        })
        .finally(function() {
          $scope.submitted = false;
        });
    }
  }

})();
