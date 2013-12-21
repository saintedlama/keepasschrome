var app = angular.module('keepasschrome', []);

// TODO: using fileSystem permission is a litle bit too much rights  - we only need to read!

function PasswordStoreController($scope) {
    $scope.showOpenDialog = true;

    $scope.chooseFile = function() {
        chrome.fileSystem.chooseEntry({ type : 'openFile'}, function(fileEntry) {
            if (!fileEntry) {
                return;
            }

            $scope.path = fileEntry;
            $scope.$apply();
        });
    }

    $scope.openPasswordStore = function() {
        console.log('opening', $scope.password, $scope.path);

        if (!$scope.path) {
            // TODO: Error message
            return;
        }

        $scope.path.file(function(file) {
            var reader = new FileReader();

            reader.onloadend = function() {
                var data = new jDataView(this.result, 0, this.result.length, true);

                var passes = [];
                passes.push(readPassword($scope.password));

                var entries = readKeePassFile(data, passes);

                $scope.entries = entries;
                $scope.path = '';
                $scope.password ='';
                $scope.showOpenDialog = false;

                $scope.$apply();
            };

            reader.readAsArrayBuffer(file);
        }, function() {
            // TODO: Error message
            console.log(arguments);
        });
    };

    $scope.toggleShowPassword = function(entry) {
        entry.showPassword = !entry.showPassword;
    }
}