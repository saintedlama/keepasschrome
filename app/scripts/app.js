var app = angular.module('keepasschrome', [
  'ngRoute',
  'controllers'
]);

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'views/index.html',
        controller: 'IndexCtrl'
      }).
      when('/open/url', {
        templateUrl: 'views/url.html',
        controller: 'OpenUrlCtrl'
      }).
      when('/open/file', {
        templateUrl: 'views/file.html',
        controller: 'OpenFileCtrl'
      }).
      when('/info', {
        templateUrl: 'views/info.html',
        controller: 'InfoCtrl'
      }).
      when('/passwordstore', {
        templateUrl: 'views/list.html',
        controller: 'ListCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);

app.factory('passwordStore', function() {
  console.log('factory passwordStore called');

  var entries = [];

  return {
    // TODO: wrap jDataView, readPassword, readKeePassFile in angular services
    decrypt : function(inputBinary, password) {
        var data = new jDataView(inputBinary, 0, inputBinary.length, true);

        var passes = [];
        passes.push(readPassword(password));

        entries = readKeePassFile(data, passes);

        return entries;
      },
    getEntries : function() {
      return entries;
    }
  };
});
