(function() {
  'use-strict';

  angular
    .module('clientApp')
    .factory('Utils', Utils);

  Utils.$inject = ['$timeout'];

  function Utils($timeout) {

    return {
      jsonToCSV: jsonToCSV,
      isValidCSVFile: isValidCSVFile,
      pieChartOptions: pieChartOptions,
      columnsChartOptions: columnsChartOptions,
      columnsChartCols: columnsChartCols,
      getColumnsColors: getColumnsColors,
      getColumnsCols: getColumnsCols
    };

    function isValidCSVFile(fileName) {
      var fileExtension = fileName.split('.').pop().toLowerCase();
      return _.includes(['csv'], fileExtension);
    }

    function clickLink(url, keepWindow, options) {
      var config = {
        style:'display:none',
        href: url
      };
      if(options) angular.extend(config, options);
      var a = $('<a/>', config).appendTo('body');
      $timeout(function () {
        a[0].click();
        a.remove();
      }, null);

      if(keepWindow) return;

      setTimeout(function() {
        window.close();
      }, 3000);
    }

    function jsonToCSV(JSONData, showLabel, filename, returnData) {
      var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
      var CSV = '';

      if (showLabel) {
        var row = "";
        for (var index in arrData[0]) {
          row += index + ';';
        }
        row = row.slice(0, -1);
        CSV += row + '\r\n';
      }

      for (var i = 0; i < arrData.length; i++) {
        var row = "";
        for (var index in arrData[i]) {
          if(typeof arrData[i][index] === 'string' && (arrData[i][index]).indexOf(';') > -1) row += '"' + arrData[i][index] + '";';
          else row += arrData[i][index] + ';';
        }
        row = row.slice(0, row.length - 1);
        CSV += row + '\r\n';
      }

      if (CSV == '') return {error: 'Invalid Data'};

      if(returnData) return CSV;

      var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
      clickLink(uri, true, {download: filename + '.csv'});
    }

    function columnsChartCols() {
      return [{
        "label": "Información",
        "type": "string"
      }, {
        "id": "Genérico",
        "label": "Genérico",
        "type": "number"
      }, {
        "id": "Hombre",
        "label": "Hombre",
        "type": "number"
      }, {
        "id": "Mujer",
        "label": "Mujer",
        "type": "number"
      }];
    }

    function getColumnsCols(audience) {
      var cols = [{
        "label": "Información",
        "type": "string"
      }];
      if(audience.indexOf("generico") > -1) {
        cols.push({
          "id": "Genérico",
          "label": "Genérico",
          "type": "number"
        });
      }

      if(audience.indexOf("hombre") > -1) {
        cols.push({
          "id": "Hombre",
          "label": "Hombre",
          "type": "number"
        });
      }

      if(audience.indexOf("mujer") > -1) {
        cols.push({
          "id": "Mujer",
          "label": "Mujer",
          "type": "number"
        });
      }

      return cols;
    }

    function columnsChartOptions() {
      return {
        "isStacked": "true",
        "fill": 20,
        "is3D": false,
        "colors":["#797979","#a2c0e2", "#e29fb5"], // G, H, M
        "animation": {
          "startup": true,
          "duration": 500,
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
      };
    }

    function getColumnsColors(audience) {
      var colors = [];
      if(audience.indexOf("generico") > -1) {
        colors.push("#797979");
      }

      if(audience.indexOf("hombre") > -1) {
        colors.push("#a2c0e2");
      }

      if(audience.indexOf("mujer") > -1) {
        colors.push("#e29fb5");
      }

      return colors;
    }

    function pieChartOptions() {
      return {
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
      };
    }
  }

})();
