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
  var entries = [];

  return {
    // TODO: wrap jDataView, readPassword, readKeePassFile in angular services
    decrypt : function(inputBinary, password, keyfile) {
        var data = new jDataView(inputBinary, 0, inputBinary.length, true);

        var passes = [];

      if (password) {
        passes.push(readPassword(password));
      }

      if (keyfile) {
        var keyfileData = new jDataView(keyfile, 0, keyfile.length, true);
        passes.push(readKeyfile(keyfileData));
      }

        entries = readKeePassFile(data, passes);

        return entries;
      },
    getEntries : function() {
      return entries;
    }
  };
});
