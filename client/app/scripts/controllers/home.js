(function() {
  'use-strict';

  angular
    .module('clientApp')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$localStorage', '$http', '$window', '$q', 'Utils', 'MatrixService'];

  function HomeController($scope, $localStorage, $http, $window, $q, Utils, MatrixService) {

    $scope.username = $localStorage.data.username;

    $scope.controls = {
      isLoading: false,
      reachedEnd: true, //TODO initialize as false
      step: 'validate'
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
    $scope.submitCSV = submitCSV;
    $scope.setCSVFilename = setCSVFilename;
    $scope.scan = scan;
    $scope.toggleSelection = toggleSelection;
    $scope.refreshAudience = refreshAudience;
    $scope.scrollToTop = scrollToTop;
    $scope.quit = quit;

    var classifiedFollowers = { // TODO populate with classified
      "follower_username": {
        "mujer": false,
        "hombre": true,
        "generico": false,
        "animales": false,
        "deporte": true,
        "musica": true,
        "tecnologia": false
      },
      "follower_username2": {
        "mujer": false,
        "hombre": true,
        "generico": false,
        "animales": false,
        "deporte": true,
        "musica": true,
        "tecnologia": false
      }
    };

    //refreshAudience();
    //scan();

    function scrollToTop() {
      $window.scrollTo(0, 0);
    }

    function quit() {
      delete $localStorage.data;
      $scope.go('login');
    }

    function setCSVFilename(name) {
      $scope.csvFileName = name.replace(/.*[\/\\]/, '');
    }

    function submitCSV() {
      var $fileInputElement = $('#csv-file');
      parseCSV($fileInputElement)
        .then(function (results) {
          $scope.csvFileName = results.name;
          $scope.uploadedFollowers = results.followers;
          $scope.matrices = {
            mujeres: MatrixService.getMatrix("mujer", $scope.uploadedFollowers, classifiedFollowers),
            hombres: MatrixService.getMatrix("hombre", $scope.uploadedFollowers, classifiedFollowers),
            generico: MatrixService.getMatrix("generico", $scope.uploadedFollowers, classifiedFollowers),
            animales: MatrixService.getMatrix("animales", $scope.uploadedFollowers, classifiedFollowers),
            deporte: MatrixService.getMatrix("deporte", $scope.uploadedFollowers, classifiedFollowers),
            musica: MatrixService.getMatrix("musica", $scope.uploadedFollowers, classifiedFollowers),
            tecnologia: MatrixService.getMatrix("tecnologia", $scope.uploadedFollowers, classifiedFollowers)
          };
        }, function (err) {
          if (err.type === 'extension') return $scope.parseError = "Extensión de archivo inválida.";
          $scope.parseError = err;
        })
    }

    function parseCSV(fileInputElement) {
      var deferred = $q.defer();
      fileInputElement.parse({
        config: {
          delimiter: '',
          header: true,
          dynamicTyping: false,
          preview: 0,
          step: undefined,
          encoding: 'UTF-8'
        },
        error: function (err, file, inputElem) {
          deferred.reject(err);
        },
        complete: function (results, file, inputElem, event) {
          if (!Utils.isValidCSVFile(file.name)) {
            deferred.reject({type: 'extension'});
          } else {
            //Parse promotions details
            parse(results.results.rows)
              .then(function (followers) {
                deferred.resolve({followers: followers, name: file.name});
              })
              .catch(function (err) {
                deferred.reject(err);
              });
          }
        }
      });

      return deferred.promise;
    }

    function parse(array) {
      var deferred = $q.defer();
      var results = array;
      var followers = {};

      try {
        for (var i = 0; i < results.length; i++) {
          var keys = Object.keys(results[i]);
          followers[results[i][keys[0]]] = {
            'mujer': results[i][keys[1]] ? true : false,
            'hombre': results[i][keys[2]] ? true : false,
            'generico': results[i][keys[3]] ? true : false,
            'animales': results[i][keys[4]] ? true : false,
            'deporte': results[i][keys[5]] ? true : false,
            'musica': results[i][keys[6]] ? true : false,
            'tecnologia': results[i][keys[7]] ? true : false
          };
        }

      } catch (err) {
        err.message = 'CSV malformado. Por favor, descargar el ejemplo y completarlo.';
        deferred.reject(err);
        return deferred.promise;
      }
      deferred.resolve(followers);
      return deferred.promise;
    }

    function downloadCSV() {
      let sample = [{
        'Username': 'follower_username',
        'Mujer': '',
        'Hombre': '1',
        'Generico': '',
        'Animales': '',
        'Deporte': '1',
        'Musica': '1',
        'Tecnologia': ''
      }];
      let rows = [];
      if($scope.followers) {
        rows = Object.keys($scope.followers).map(function (f) {
          return {
            'Username': f,
            'Mujer': '',
            'Hombre': '',
            'Generico': '',
            'Animales': '',
            'Deporte': '',
            'Musica': '',
            'Tecnologia': ''
          };
        });
      }

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

    /*{
     "mujer": false,
     "hombre": true,
     "generico": false,
     "animales": false,
     "deporte": true,
     "musica": true,
     "tecnologia": false
     }*/
  }

})();
