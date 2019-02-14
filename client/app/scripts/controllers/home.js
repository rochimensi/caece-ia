(function() {
  'use-strict';

  angular
    .module('clientApp')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$localStorage', '$http', 'Utils'];

  function HomeController($scope, $localStorage, $http, Utils) {

    $scope.username = $localStorage.data.username;
    $scope.profileImg = $localStorage.data.profileImg;

    $scope.controls = {
      isLoading: false,
      reachedEnd: true, //TODO initialize as false
      step: 'results'
    };

    $scope.audienceSelection = ['generico', 'hombres', 'mujeres'];
    $scope.infoSelection = [];
    $scope.audience = {
      mujeres: 176,
      hombres: 120,
      generico: 0
    };

    $scope.downloadCSV = downloadCSV;
    $scope.scan = scan;
    $scope.animateBars = animateBars;
    $scope.toggleSelection = toggleSelection;
    $scope.refreshAudience = refreshAudience;

    refreshAudience();
    //scan();

    function downloadCSV() {
      // TODO: populate with usernames from scan
      Utils.jsonToCSV([{
        'Username': 'rosario.mensi',
        'Mujer': '1',
        'Hombre': '',
        'Genérico': '',
        'Animales': '',
        'Musica': '1',
        'Deporte': '',
        'Tecnologia': '1'
      }, {
        'Username': 'follower_username',
        'Mujer': '',
        'Hombre': '1',
        'Genérico': '',
        'Animales': '',
        'Musica': '1',
        'Deporte': '1',
        'Tecnologia': ''
      }], true, 'followers_clasificacion_manual' + (new Date().toISOString()).split('T')[0]);
    }

    function toggleSelection(filters, filter) {
      const idx = filters.indexOf(filter);
      if (idx > -1) {
        filters.splice(idx, 1);
      } else {
        filters.push(filter);
      }

      filters.sort();
    }

    function refreshAudience() {
      var newData = [];
      $scope.audienceSelection.forEach(function(audience) {
        newData.push($scope.audience[audience]);
      });
      $scope.pieChart = newData;
    }

    function scan() {
      $scope.controls.isLoading = true;
      $http.get($scope.host + "/api/crawl")
        .then(function (results) {
          console.log(results);
        })
        .catch(function (error, response) {
          if(error.status === 401) {
            $scope.loginError = 'Credenciales inválidas';
          }
        })
        .finally(function() {
          $scope.controls.isLoading = false;
        });
    }

    function animateBars() {
      $.each($(".bar-chart"), function() {
        var $this = $(this),
          total = $this.data("total"),
          $targetBar = $this.find(".bar-chart--inner");
        $targetBar.css("width", "0%");
        setTimeout(function() {
          $targetBar.css("width", total + "%");
        }, 400);
      });
    }
  }

})();
