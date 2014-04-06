var app = angular.module('keepasschrome', []);

// TODO: using fileSystem permission is a litle bit too much rights  - we only need to read!

function PasswordStoreCtrl($scope) {
    $scope.showOpenDialog = true;

    $scope.chooseFile = function() {
        chrome.fileSystem.chooseEntry({ type : 'openFile'}, function(fileEntry) {
            if (!fileEntry) {
                return;
            }

            $scope.path = fileEntry;
            $scope.url = fileEntry.name;
            $scope.$apply();
        });
    }

    $scope.openPasswordStore = function() {
        if (!$scope.url && !$scope.path) {
            return showError('Please specify a url or choose a local file');
        }

        if ($scope.path) {
            $scope.path.file(function(file) {
                var reader = new FileReader();

                reader.onloadend = function() {
                    showEntries(this.result);
                };

                reader.readAsArrayBuffer(file);
            }, function() {
                return showError('Could not load KeePass file from ' + $scope.url);
            });
        }
        else {
            var oReq = new XMLHttpRequest();
            oReq.open('GET', $scope.url, true);
            oReq.responseType = 'arraybuffer';

            oReq.onloadend = function() {
                if (oReq.status != 200) {
                    return showError('Could not load KeePass file from ' + $scope.url);
                }

                showEntries(oReq.result);
            };
            oReq.onerror = function() {
                return showError('Could not load KeePass file from ' + $scope.url);
            };

            oReq.send();
        }
    };

    $scope.toggleShowPassword = function(entry) {
        entry.showPassword = !entry.showPassword;
    };

    function showEntries(inputBinary) {
        var data = new jDataView(inputBinary, 0, inputBinary.length, true);

        var passes = [];
        passes.push(readPassword($scope.password));

        try {
            var entries = readKeePassFile(data, passes);
            $scope.entries = entries;
            delete $scope.path;
            delete $scope.password;

            $scope.showOpenDialog = false;
            $scope.openErrorMessage = '';

            $scope.$apply();
        } catch (e) {
            return showError('KeePass file loaded from ' + $scope.url + ' does not seem valid! We support only KeePass 2.x file format. Sorry :(');
        }
    }
    function showError(message) {
        $scope.openErrorMessage = message;
        $scope.$apply();
    }
}