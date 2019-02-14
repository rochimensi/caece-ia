(function() {
  'use-strict';

  angular
    .module('clientApp')
    .service('MessageService', MessageService);

  MessageService.$inject = ['$http', '$q'];

  function MessageService($http, $q) {

    let host = "http://localhost:4000";

    return {
      getInbox: getInbox,
      getSent: getSent,
      getFolder: getFolder,
      getEmail: getEmail,
      deleteMany: deleteMany,
      deleteOne: deleteOne,
      isValidEmailFormat: isValidEmailFormat
    };

    function getEmail(id) {
      return $http.get(host + "/messages/" + id);
    }

    function getInbox() {
      let deferred = $q.defer();
      $http.get(host + "/messages/inbox")
        .then(function (results) {
          deferred.resolve(results.data);
        }, deferred.reject);
      return deferred.promise;
    }

    function getSent() {
      let deferred = $q.defer();
      $http.get(host + "/messages/sent")
        .then(function (results) {
          deferred.resolve(results.data);
        }, deferred.reject);
      return deferred.promise;
    }

    function getFolder(folderId) {
      let deferred = $q.defer();
      $http.get(host + "/folders/" + folderId)
        .then(function (results) {
          deferred.resolve(results.data);
        }, deferred.reject);
      return deferred.promise;
    }

    function deleteMany(messages) {
      let promises = [];
      messages.forEach(function(m) {
        promises.push(deleteOne(m));
      });
      return $q.all(promises);
    }

    function deleteOne(messageId) {
      return $http.delete(host + "/messages/" + messageId);
    }

    function isValidEmailFormat(email) {
      if (!email) return false;
      const REGEX_STRING_REGEXP = /^(?:(?:[\w`~!#$%^&*\-=+;:{}'|,?\/]+(?:(?:\.(?:"(?:\\?[\w`~!#$%^&*\-=+;:{}'|,?\/\.()<>\[\] @]|\\"|\\\\)*"|[\w`~!#$%^&*\-=+;:{}'|,?\/]+))*\.[\w`~!#$%^&*\-=+;:{}'|,?\/]+)?)|(?:"(?:\\?[\w`~!#$%^&*\-=+;:{}'|,?\/\.()<>\[\] @]|\\"|\\\\)+"))@(?:[a-zA-Z\d\-]+(?:\.[a-zA-Z\d\-]+)+|\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\])$/gm;
      return email.match(REGEX_STRING_REGEXP);
    }
  }

})();

