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
    $scope.audience = {
      mujer: 176,
      hombre: 120,
      generico: 0
    };

    $scope.downloadCSV = downloadCSV;
    $scope.submitCSV = submitCSV;
    $scope.setCSVFilename = setCSVFilename;
    $scope.scan = scan;
    $scope.classify = classify;
    $scope.showResults = showResults;
    $scope.toggleSelection = toggleSelection;
    $scope.refreshAudience = refreshAudience;
    $scope.refreshInformation = refreshInformation;
    $scope.refreshWithFilters = refreshWithFilters;
    $scope.scrollToTop = scrollToTop;
    $scope.selected = selected;
    $scope.quit = quit;

    $scope.table = {};
    $scope.table.filteredFollowers = [
      "follower_username", "follower_username2"
    ];
    $scope.followers = {
      "follower_username": {
        image: "https://instagram.faep8-1.fna.fbcdn.net/vp/aad7befce6a1c56c204fc8faa20f5fa0/5D01A9D6/t51.2885-19/s150x150/51159077_1883771945067218_3109802741757640704_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net"
      },
      "follower_username2": {
        image: "https://instagram.faep8-1.fna.fbcdn.net/vp/12bb01b835b0d6260124d32eef76c609/5CF3E7B1/t51.2885-19/s150x150/33399791_247091415853900_2832956348222668800_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net"
      },
      "follower_username3": {
        image: "https://instagram.faep8-1.fna.fbcdn.net/vp/00a0165f192303febc26abeb495efb0e/5CF61168/t51.2885-19/s150x150/38220722_1810154722383029_8561986432351076352_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net"
      }
    };

    $scope.classifiedFollowers = {// TODO populate with classified
      followers: {
        "follower_username": {
          "mujer": true,
          "hombre": false,
          "generico": false,
          "animales": false,
          "deporte": true,
          "musica": true,
          "tecnologia": false,
          "porcMujer": 0.8,
          "porcHombre": 0.2,
          "porcGenerico": 0,
          "porcAnimales": 0,
          "porcDeporte": 0.7,
          "porcMusica": 0.65,
          "porcTecnologia": 0.01
        },
        "follower_username2": {
          "mujer": false,
          "hombre": true,
          "generico": false,
          "animales": false,
          "deporte": true,
          "musica": false,
          "tecnologia": true,
          "porcMujer": 0.2,
          "porcHombre": 0.8,
          "porcGenerico": 0,
          "porcAnimales": 0,
          "porcDeporte": 0.7,
          "porcMusica": 0.01,
          "porcTecnologia": 0.65
        },
        "follower_username3": {
          "mujer": false,
          "hombre": false,
          "generico": true,
          "animales": false,
          "deporte": true,
          "musica": false,
          "tecnologia": true,
          "porcMujer": 0,
          "porcHombre": 0,
          "porcGenerico": 1,
          "porcAnimales": 0,
          "porcDeporte": 0.7,
          "porcMusica": 0.01,
          "porcTecnologia": 0.65
        }
      },
      results: {
        mujer: 40,
        hombre: 60,
        generico: 30
      }
    };

    scan();
    //showResults();

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

    }

    function showResults() {
      $scope.totalClassified = 140;//TODO Object.keys($scope.classifiedFollowers).length;
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
              "v": $scope.classifiedFollowers.results.mujeres
            }]
          }, {
            "c": [{
              "v": "Hombres"
            }, {
              "v": $scope.classifiedFollowers.results.hombres
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
              "v": $scope.totalClassified - $scope.classifiedFollowers.results.mujeres - $scope.classifiedFollowers.results.hombres - $scope.classifiedFollowers.results.generico
            }]
          }]
        }
      };

      refreshAudience();
    }

    function refreshWithFilters() {
      refreshAudience();
      $scope.table = {};

      var filteredUsernames = {};
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
        _.forEach($scope.infoSelection, function(segment) { // For table & Columns Chart
          _.forEach($scope.audienceSelection, function(audience) {
            if (follower[segment]) {
              filteredUsernames[username] = {};
              if (follower[audience]) {
                counters[segment][audience] += 1;
              }
            }
          });
        });

        _.forEach($scope.audienceSelection, function(audience) { // For table
          if (follower[audience]) {
            filteredUsernames[username] = {};
          }
        });
      });

      $scope.table.filteredFollowers = _.union(Object.keys(filteredUsernames));

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

    function refreshInformation() {

    }

    var scanned = { // TODO use scanned JSON data
      "dr.agustinmatia": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/63f5b479dcbfe43fe6de36755eafa52f/5CFA2406/t51.2885-19/s150x150/46881047_2212718498970151_6654511599870541824_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net"
      },
      "roberdemichele": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/12bb01b835b0d6260124d32eef76c609/5CF3E7B1/t51.2885-19/s150x150/33399791_247091415853900_2832956348222668800_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "Roberto Demichele"
      },
      "nacrewatches": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/dda0acbb85ec82dc40c5fdb920c2b068/5CF9A19F/t51.2885-19/s150x150/25011775_522526368130644_2444458027810553856_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net"
      },
      "parrillalacabana": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/a976d75022862a05da300c86813d0702/5CEA8A59/t51.2885-19/s150x150/19228506_1706830572757543_2567002356822573056_a.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "La Cabaña Parrilla"
      },
      "selvaa.ar": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/e3800ccbaefcb22add0716474813cf09/5D078B98/t51.2885-19/s150x150/45831885_399973760799814_4346934562035597312_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "SELVAA.AR"
      },
      "hieisrestaurant": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/0a979751cd38af037dd48040ee3fe181/5D24682A/t51.2885-19/s150x150/47581162_221228505478500_1564802490266812416_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "Hiei's Sushi & Wine"
      },
      "paoluccisantiago": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/d5a2551445526288ca6a283b5c5d0b68/5CF26027/t51.2885-19/s150x150/50012305_779151955771618_4318588057054871552_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "Santiago Paolucci"
      },
      "binariarock": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/cb45e26c5643838ad09cdf949157a4f3/5CF9F386/t51.2885-19/s150x150/44726834_299825987531257_1238422122942955520_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "Binaria Rock"
      },
      "gfontanella": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/c73c76c01346138e2e4f0f6cf19b0290/5CEAEC39/t51.2885-19/11925799_918031171595844_1561845268_a.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "Gonzalo Fontanella"
      },
      "dave.mdq": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/1aa8a3906a8555d08edb1a1a76bab053/5CE33DC0/t51.2885-19/s150x150/17494326_215265575645816_150887651421978624_a.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "Dave"
      },
      "gabrieldellepiane": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/4f711d57f00afcf70ed9b753c13a528a/5CF4E6A0/t51.2885-19/s150x150/49858442_2458369594432134_2269730876944285696_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "gabrieldellepiane"
      },
      "ivanmdell": {
        "image": "https://instagram.faep8-1.fna.fbcdn.net/vp/dc7bbc4af7caa0cc1f3b977575a7d19b/5D2514A0/t51.2885-19/s150x150/22639102_147607629185070_8625320784602071040_n.jpg?_nc_ht=instagram.faep8-1.fna.fbcdn.net",
        "fullName": "Ivan Dell"
      }
    };

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
            mujeres: MatrixService.getMatrix("mujer", $scope.uploadedFollowers, $scope.classifiedFollowers),
            hombres: MatrixService.getMatrix("hombre", $scope.uploadedFollowers, $scope.classifiedFollowers),
            generico: MatrixService.getMatrix("generico", $scope.uploadedFollowers, $scope.classifiedFollowers),
            animales: MatrixService.getMatrix("animales", $scope.uploadedFollowers, $scope.classifiedFollowers),
            deporte: MatrixService.getMatrix("deporte", $scope.uploadedFollowers, $scope.classifiedFollowers),
            musica: MatrixService.getMatrix("musica", $scope.uploadedFollowers, $scope.classifiedFollowers),
            tecnologia: MatrixService.getMatrix("tecnologia", $scope.uploadedFollowers, $scope.classifiedFollowers)
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
            'animales': !!results[i][keys[4]],
            'deporte': !!results[i][keys[5]],
            'musica': !!results[i][keys[6]],
            'tecnologia': !!results[i][keys[7]]
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
  }

})();
