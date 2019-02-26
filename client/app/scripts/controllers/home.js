(function() {
  'use-strict';

  angular
    .module('clientApp')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$localStorage', '$http', '$window', 'Utils'];

  function HomeController($scope, $localStorage, $http, $window, Utils) {

    $scope.username = $localStorage.data.username;
    $scope.profileImg = $localStorage.data.profileImg;

    $scope.controls = {
      isLoading: false,
      reachedEnd: true, //TODO initialize as false
      step: 'scan'
    };

    $scope.audienceSelection = ['generico', 'hombres', 'mujeres'];
    $scope.infoSelection = [];
    $scope.audience = {
      mujeres: 176,
      hombres: 120,
      generico: 0
    };
    $scope.total = 365; // TODO get from classifier results
    $scope.filtersTotal = 231; // TODO update when filtering

    $scope.columnChartData = {
      "type": "ColumnChart",
      "cssStyle": "height:400px; width: 700px",
      "data": {
        "cols": [{
          "label": "Información",
          "type": "string"
        }, {
          "label": "Mujer",
          "type": "number"
        }, {

          "id": "Hombre",
          "label": "Hombre",
          "type": "number"
        }, {

          "id": "Genérico",
          "label": "Genérico",
          "type": "number"
        }],
        "rows": [{
          "c": [{
            "v": "Animales"

          }, {
            "v": 19000
          }, {
            "v": 15000
          }, {
            "v": 12000
          }]
        }/*, {
          "c": [{
            "v": "Deporte"
          }, {
            "v": 10000
          }, {
            "v": 12000
          }, {
            "v": 12000
          }]
        }, {
          "c": [{
            "v": "Música"
          }, {
            "v": 15000
          }, {
            "v": 12000
          }, {
            "v": 12000
          }]
        }, {
          "c": [{
            "v": "Tecnología"
          }, {
            "v": 19000
          }, {
            "v": 12000
          }, {
            "v": 12000
          }]
        }*/]
      },
      "options": {
        "isStacked": "true",
        "fill": 20,
        "is3D": false,
        "colors":["#e29fb5","#a2c0e2", "#797979"],
        "animation": {
          "startup": true,
          "duration": 2000,
          "easing": "inAndOut"
        },
        "displayExactValues": false,
        "vAxis": {
          "title": "Seguidores",
          "gridlines": {
            "count": 10
          }
        },
        "hAxis": {
          "title": "Información"
        }
      }
    };

    $scope.pieChartData = {
      "type": "PieChart",
      "cssStyle": "height:600px;width: 100%",
      "options": {
        "chartArea.left": 0,
        "chartArea.top": 0,
        "fontName": "Gudea",
        "legend": {
          "alignment": "center",
          "position": "bottom"
        },
        "legend.textStyle": {
          "fontName": "Gudea"
        },
        "colors": ["#e29fb5", "#a2c0e2", "#797979", "#dfdfdf"]
      },
      "data": {
        "cols": [{
          "label": "Audience",
          "type": "string"
        }, {
          "label": "Count",
          "type": "number"
        }],
        "rows": [{
          "c": [{
            "v": "Mujeres"
          }, {
            "v": 176
          }]
        }, {
          "c": [{
            "v": "Hombres"
          }, {
            "v": 100
          }]
        }, {
          "c": [{
            "v": "Genérico"
          }, {
            "v": 76
          }]
        }, {
          "c": [{
            "v": "No Aplica"
          }, {
            "v": 13
          }]
        }]
      }
    };

    $scope.selected = function(selectedItem){
      alert("You selected " + $scope.chart.data.cols[selectedItem.column].label + " in " +
        $scope.chart.data.rows[selectedItem.row].c[0].v);
    };

    $scope.downloadCSV = downloadCSV;
    $scope.scan = scan;
    $scope.animateBars = animateBars;
    $scope.toggleSelection = toggleSelection;
    $scope.refreshAudience = refreshAudience;
    $scope.scrollToTop = scrollToTop;
    $scope.quit = quit;

    //refreshAudience();
    scan();

    function scrollToTop() {
      $window.scrollTo(0, 0);
    }

    function quit() {
      delete $localStorage.data;
      $scope.go('login');
    }

    function downloadCSV() {
      let sample = [{
        'Username': 'follower_username',
        'Mujer': '',
        'Hombre': '1',
        'Genérico': '',
        'Animales': '',
        'Musica': '1',
        'Deporte': '1',
        'Tecnologia': ''
      }];
      let rows = Object.keys($scope.followers).map(function(f) {
        return {
          'Username': f,
          'Mujer': '',
          'Hombre': '',
          'Genérico': '',
          'Animales': '',
          'Musica': '',
          'Deporte': '',
          'Tecnologia': ''
        };
      });

      sample = sample.concat(rows);
      Utils.jsonToCSV(sample, true, 'followers_clasificacion_manual' + (new Date().toISOString()).split('T')[0]);
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
      $scope.audienceSelection.forEach(function(audience) {
        newData.push($scope.audience[audience]);
      });
    }

    function scan() {
      $scope.controls.isLoading = true;
      $http.get($scope.host + "/api/crawl")
        .then(function (results) {
          $scope.scanFollowersTotal = Object.keys(results.followers).length;
          $scope.followers = results.followers;
          $scope.scanImagesTotal = results.imagenes;
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
  }

})();
