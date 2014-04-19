var controllers = angular.module('controllers', []);

controllers.controller('IndexCtrl', ['$scope',
  function ($scope) {
  }]);

controllers.controller('InfoCtrl', ['$scope',
  function ($scope) {
  }]);

controllers.controller('OpenUrlCtrl', ['$scope', 'passwordStore',
  function ($scope, passwordStore) {
    $scope.openPasswordStore = function() {
      var oReq = new XMLHttpRequest();
      oReq.open('GET', $scope.url, true);
      oReq.responseType = 'arraybuffer';

      oReq.onloadend = function() {
        if (oReq.status != 200) {
          return showError('Could not load KeePass file from ' + $scope.url);
        }

        passwordStore.decrypt(this.response, $scope.password);
        window.location.hash = '/passwordstore';
      };

      oReq.onerror = function() {
        return showError('Could not load KeePass file from ' + $scope.url);
      };

      oReq.send();
    };
  }]);

controllers.controller('OpenFileCtrl', ['$scope', 'passwordStore',
  function ($scope, passwordStore) {
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
          passwordStore.decrypt(this.result, $scope.password);
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
