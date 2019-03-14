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
      step: 'scan'
    };

    $scope.audienceSelection = ['generico', 'hombre', 'mujer'];
    $scope.infoSelection = [];
    /*  $scope.audience = {
     mujer: 176,
     hombre: 120,
     generico: 0
     };
     */
    $scope.downloadCSV = downloadCSV;
    $scope.submitCSV = submitCSV;
    $scope.setCSVFilename = setCSVFilename;
    $scope.scan = scan;
    $scope.classify = classify;
    $scope.showResults = showResults;
    $scope.toggleSelection = toggleSelection;
    $scope.refreshAudience = refreshAudience;
    $scope.refreshWithFilters = refreshWithFilters;
    $scope.scrollToTop = scrollToTop;
    $scope.selected = selected;
    $scope.quit = quit;

    scan();

    function selected(selectedItem){
      alert("You selected " + $scope.chart.data.cols[selectedItem.column].label + " in " +
        $scope.chart.data.rows[selectedItem.row].c[0].v);
    }

    function scrollToTop() {
      $window.scrollTo(0, 0);
    }

    function quit() {
      delete $localStorage.data;
      $scope.go('login');
    }

    function scan() {
      $scope.controls.isLoading = true;
      $http.get($scope.host + "/api/crawl")
        .then(function (results) {
          $scope.scanFollowersTotal = Object.keys(results.data.followers).length;
          $scope.followers = results.data.followers;
          $scope.scanImagesTotal = results.data.imagenes;
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

    function classify() {
      if(!$scope.classifiedFollowers || !$scope.classifiedFollowers.followers || !$scope.classifiedFollowers.followers.length) {
        $scope.controls.isLoading = true;
        $http.get($scope.host + "/api/classify")
          .then(function (results) {
            console.log(results);
            var allFollowers = {};
            _.forEach(results.data.followers, function(follower) {
              allFollowers[Object.keys(follower)[0]] = follower[Object.keys(follower)[0]];
            });
            $scope.classifiedFollowers = {
              results: results.data.results[0],
              followers: allFollowers
            };
            $scope.totalClassified = Object.keys($scope.classifiedFollowers.followers).length;

          })
          .catch(function (error, response) {
            console.log(error);
          })
          .finally(function() {
            $scope.controls.isLoading = false;
          });
      }
    }

    function showResults() {
      $scope.pieChartData = {
        "type": "PieChart",
        "cssStyle": "height:600px;width: 100%",
        "options": Utils.pieChartOptions(),
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
              "v": $scope.classifiedFollowers.results.mujer
            }]
          }, {
            "c": [{
              "v": "Hombres"
            }, {
              "v": $scope.classifiedFollowers.results.hombre
            }]
          }, {
            "c": [{
              "v": "Genérico"
            }, {
              "v": $scope.classifiedFollowers.results.generico
            }]
          }, {
            "c": [{
              "v": "No Aplica"
            }, {
              "v": $scope.totalClassified - $scope.classifiedFollowers.results.mujer - $scope.classifiedFollowers.results.hombre - $scope.classifiedFollowers.results.generico
            }]
          }]
        }
      };

      refreshAudience();
      refreshWithFilters();
    }

    function refreshWithFilters() {
      refreshAudience();
      $scope.table = {};

      var filteredUsernames = [];
      var counters = {};
      _.forEach($scope.infoSelection, function(segment) {
        counters[segment] = { row: [
          {
            "v": segment[0].toUpperCase() + segment.substring(1)
          }
        ],
          mujer: 0,
          hombre: 0,
          generico: 0
        };
      });
      _.forEach($scope.classifiedFollowers.followers, function(follower, username) {
        _.forEach($scope.audienceSelection, function(audience) {
          if (follower[audience]) {
            if(!$scope.infoSelection.length) filteredUsernames.push(username);
          }
          _.forEach($scope.infoSelection, function(segment) {
            if (follower[segment] && follower[audience]) {
              counters[segment][audience] += 1;
              filteredUsernames.push(username);
            }
          });
        });
      });

      $scope.table.filteredFollowers = _.union(filteredUsernames);

      $scope.columnChartData = null;

      if(!$scope.audienceSelection.length) return;
      $scope.columnChartData = {
        "type": "ColumnChart",
        "cssStyle": "height:400px; width: 800px",
        "options": Utils.columnsChartOptions(),
        "data": {
          "cols": Utils.columnsChartCols(),
          "rows": []
        }
      };

      $scope.columnChartData.options.colors = Utils.getColumnsColors($scope.audienceSelection);
      $scope.columnChartData.data.cols = Utils.getColumnsCols($scope.audienceSelection);

      _.forEach($scope.infoSelection, function(segment) {
        _.forEach($scope.audienceSelection, function(audience) {
          counters[segment].row.push({"v": counters[segment][audience]});
        });
        $scope.columnChartData.data.rows.push({"c": counters[segment].row});
      });
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
      var filtersTotal = 0;
      _.forEach($scope.audienceSelection, function(segment) {
        filtersTotal += $scope.classifiedFollowers.results[segment];
      });
      $scope.filtersTotal = filtersTotal;
    }

    function setCSVFilename(name) {
      $scope.csvFileName = name.replace(/.*[\/\\]/, '');
    }

    function submitCSV() {
      var $fileInputElement = $('#csv-file');
      parseCSV($fileInputElement)
        .then(function (results) {
          $scope.controls.csvFileName = results.name;
          $scope.uploadedFollowers = results.followers;
          $scope.controls.totalUploaded = Object.keys($scope.uploadedFollowers).length;
          $scope.matrices = {
            mujeres: MatrixService.getMatrix("mujer", $scope.uploadedFollowers, $scope.classifiedFollowers.followers),
            hombres: MatrixService.getMatrix("hombre", $scope.uploadedFollowers, $scope.classifiedFollowers.followers),
            generico: MatrixService.getMatrix("generico", $scope.uploadedFollowers, $scope.classifiedFollowers.followers),
            animales: MatrixService.getMatrix("animales", $scope.uploadedFollowers, $scope.classifiedFollowers.followers),
            deporte: MatrixService.getMatrix("deporte", $scope.uploadedFollowers, $scope.classifiedFollowers.followers),
            musica: MatrixService.getMatrix("musica", $scope.uploadedFollowers, $scope.classifiedFollowers.followers),
            tecnologia: MatrixService.getMatrix("tecnologia", $scope.uploadedFollowers, $scope.classifiedFollowers.followers)
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
            'mujer': !!results[i][keys[1]],
            'hombre': !!results[i][keys[2]],
            'generico': !!results[i][keys[3]],
            'animales': !!results[i][keys[7]],
            'deporte': !!results[i][keys[5]],
            'musica': !!results[i][keys[4]],
            'tecnologia': !!results[i][keys[6]]
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
      let sample = [];
      let rows = [];
      if($scope.classifiedFollowers.followers) {
        rows = Object.keys($scope.classifiedFollowers.followers).map(function (f) {
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
  }

})();
