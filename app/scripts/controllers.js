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
      // TODO: Move to angular services
      var oReq = new XMLHttpRequest();
      oReq.open('GET', $scope.url, true);
      oReq.responseType = 'arraybuffer';

      oReq.onloadend = function() {
        if (oReq.status !== 200) {
          return $scope.showError('Could not load KeePass file from ' + $scope.url);
        }

        try {
          passwordStore.decrypt(this.response, $scope.password);
        } catch(e) {
          return $scope.showError('Password does not match for file from ' + $scope.url + ' or file from ' + $scope.url + ' is no valid KeePass file');
        }

        window.location.hash = '/passwordstore';
      };

      oReq.onerror = function() {
        return $scope.showError('Could not load KeePass file from ' + $scope.url);
      };

      oReq.send();
    };

    $scope.showError = function(errorMessage) {
      $scope.errorMessage = errorMessage;
      $scope.$apply();
    };
  }]);

controllers.controller('OpenFileCtrl', ['$scope', 'passwordStore',
  function ($scope, passwordStore) {
    $scope.chooseFile = function() {
      // TODO: Move to angular services
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
          try {
            passwordStore.decrypt(this.result, $scope.password);
          } catch(e) {
            return $scope.showError('Password does not match for file ' + $scope.filename + ' or file ' + $scope.filename + ' is no valid KeePass file');
          }

          window.location.hash = '/passwordstore';
        };

        reader.readAsArrayBuffer(file);
      }, function() {
        return $scope.showError('Could not load KeePass file ' + $scope.filename);
      });
    };

    $scope.showError = function(errorMessage) {
      $scope.errorMessage = errorMessage;
      $scope.$apply();
    };
  }]);

controllers.controller('ListCtrl', ['$scope', 'passwordStore',
  function ($scope, passwordStore) {
    $scope.entries = passwordStore.getEntries();

    $scope.toggleShowPassword = function(entry) {
      entry.showPassword = !entry.showPassword;
    };
  }]);
