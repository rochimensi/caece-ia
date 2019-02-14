(function() {
  angular
    .module('clientApp')
    .directive('pieChart', pieChart);

  function pieChart() {
    return {
      restrict: 'EA',
      template: '<div class="ct-chart ct-perfect-fourth"></div>',
      scope: {
        data: '='
      },
      link: function(scope, elem, attr) {
        var chartElement = elem[0].querySelector('.ct-chart');
        var options = {
          donut: true,
          donutWidth: 80
        };

        var chart = new Chartist.Pie(chartElement, {
          labels: [],
          series: []
        }, options).on('draw', draw).on('created', created);


        scope.$watch('data', function(newValue, oldValue) {
          chart.update({
            labels: [],
            series: scope.data
          });
        }, true);

        var oldBars = [];

        var lastValues = [];
        function created() {
          lastValues = angular.copy(scope.data);
        }

        function draw(data) {
          if (angular.equals(lastValues, scope.data))
          // no animation if nothing changed
            return;
          if(data.type === 'slice') {
            // Calculate the dureation so that all slices at same speed
            var angle = data.endAngle - data.startAngle;
            var dur = angle / 360 * 1000;

            // Get the total path length in order to use for dash array animation
            var pathLength = data.element._node.getTotalLength();

            // Set a dasharray that matches the path length as prerequisite to animate dashoffset
            data.element.attr({
              'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
            });

            // Create animation definition while also assigning an ID to the animation for later sync usage
            var animationDefinition = {
              'stroke-dashoffset': {
                id: 'anim' + data.index,
                dur: dur,
                from: -pathLength + 'px',
                to:  '0px',
                // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
                fill: 'freeze'
              }
            };

            // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
            if(data.index !== 0) {
              animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
            }

            // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
            data.element.attr({
              'stroke-dashoffset': -pathLength + 'px'
            });

            data.element.animate(animationDefinition, false);
          }
        }

      }
    }
  }
})();
