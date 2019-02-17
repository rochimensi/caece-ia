(function() {
  angular
    .module('clientApp')
    .directive('counterUp', counterUp);

  counterUp.$inject = ['$compile'];

  function counterUp($compile) {
    return {
      scope: {
        total: '='
      },
      link: function(scope, element, attr) {
        var start = scope.total < 100 ? 0 : scope.total - 100;
        var template = '<h2 count-up startVal="' + start + '" end-val="' + scope.total + '"></h2>';
        var linkFn = $compile(template);
        var content = linkFn(scope);
        element.append(content);
  }
}
  }
})();
