'use strict';
angular
  .module('clientApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ui.router',
    'ngSanitize',
    'angular-jwt',
    'ngStorage',
    'ngDialog',
    'angularTrix',
    'checklist-model'
  ])
  .config(statesConfig)
  .config(angularJWTConfig)
  .run(run);

function angularJWTConfig($httpProvider, jwtOptionsProvider) {
  jwtOptionsProvider.config({
    whiteListedDomains: [/^localhost$/i],
    tokenGetter: ['$localStorage', function ($localStorage) {
      return $localStorage.data && $localStorage.data.session;
    }]
  });

  $httpProvider.interceptors.push('jwtInterceptor');
}

function statesConfig($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state('login', {
      url: '/',
      views: {
        'content@': {
          templateUrl: 'views/login.html',
          controller: 'LoginController'
        }
      }
    })
    .state('home', {
      url: '/home',
      controller: 'HomeController',
      views: {
        'content@': {
          templateUrl: 'views/home.html',
          controller: 'HomeController'
        }
      },
      data: {
        authorization: true
      }
    })
}

function run($rootScope, $state, $localStorage, $location, $window) {
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    $window.scrollTo(0, 0);
  });
}
