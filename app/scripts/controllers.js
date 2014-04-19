var controllers = angular.module('controllers', []);

controllers.controller('IndexCtrl', ['$scope',
  function ($scope) {
  }]);

controllers.controller('InfoCtrl', ['$scope',
  function ($scope) {
  }]);

controllers.controller('OpenUrlCtrl', ['$scope',
  function ($scope) {
  }]);

controllers.controller('OpenFileCtrl', ['$scope', '$location', 'passwordStore',
  function ($scope, $location, passwordStore) {
    $scope.chooseFile = function() {
      chrome.fileSystem.chooseEntry({ type : 'openFile'}, function(fileEntry) {
        if (!fileEntry) {
          return;
        }

        $scope.path = fileEntry;
        $scope.filename = fileEntry.name;
        $scope.$apply();
      });
    };

    $scope.openPasswordStore = function() {
      $scope.path.file(function(file) {
        var reader = new FileReader();

        reader.onloadend = function() {
          var entries = passwordStore.decrypt(this.result, $scope.password);

          //$location.path('/passwordstore');
          //$location.path('/passwords');
          window.location.hash = '/passwordstore';
        };

        reader.readAsArrayBuffer(file);
      }, function() {
        console.log('error');
        // TODO: Error handling
        //return showError('Could not load KeePass file from ' + $scope.url);
      });
    };
  }]);

controllers.controller('ListCtrl', ['$scope', 'passwordStore',
  function ($scope, passwordStore) {
    $scope.entries = passwordStore.getEntries();
  }]);
