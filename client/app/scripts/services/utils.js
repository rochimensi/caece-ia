(function() {
  'use-strict';

  angular
    .module('clientApp')
    .factory('Utils', Utils);

  Utils.$inject = ['$timeout'];

  function Utils($timeout) {

    return {
      jsonToCSV: jsonToCSV,
      isValidCSVFile: isValidCSVFile
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
  }

})();
