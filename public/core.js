
(function () {
    angular
    .module('app', ['ngCookies'])
    .controller('mainController', ['$scope', '$location', '$http', '$cookies', '$window', main])
    .directive('loader', loader);
    var access_token = '2303dad0e4609b0147381ac6d01e830a41b5c3b9a14ec748f250d29c7b934fc7923ba339cac03727e14ba';
    function loader() {
        return {
        restrict: 'E',
        replace:true,
        templateUrl: 'loader/loader.html',
        link: function (scope, element, attr) {
              scope.$watch('inProgress', function (val) {
                  if (val)
                      $(element).show();
                  else
                      $(element).hide();
              });
        }
      }
    }
    
    function main($scope, $location, $http, $cookies, $window) {
        $scope.showFriendsList = false;
        
        var today = new Date();
        
        $scope.isAuth = false;
        
        var vkOptionsFromRedirectUri = getUrlParameters($location.absUrl());
        
        $scope.versusView = false;
        $scope.showSecondStepView = false;
        
        if (vkOptionsFromRedirectUri.code) {
            $scope.inProgress = true;
            setAuth().then(function() {
                $window.location.href="/";
            }).finally(function(){
                $scope.inProgress = false;
            });
        } else {
            var token = access_token;//$cookies.get('access_token');
            var user_id = $cookies.get('user_id');
            $scope.inProgress = true;
            if (token) {
                    $scope.isAuth = true;
                }
            getUserInfo(token, user_id).then(function(user) {
                getFriends(token);
                $scope.authenticatedUser = user;
            }).finally(function(){
                $scope.inProgress = false;
            });
        }
        
        function getUrlParameters(url) { 
            var parameters = {};
            
            url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                parameters[key] = value;
            });
            return parameters;
        }
        
        function getToken() {
            return $http.get('/auth?code='+ vkOptionsFromRedirectUri.code).then(function(response) {
                return response.data;
            });
        }

        function setAuth() {
            return getToken().then(function(response) {
                setCookies('access_token', response.access_token, response.expires_in);
                setCookies('user_id', response.user_id, response.expires_in);
            });
        }
        
        function getUserInfo(token, user_id) {
            return $http.get('/user?access_token='+token+'&'+user_id).then(function(response) {
                console.log(response.data[0]);
                return response.data[0];
            });
        }
        
        function getFriends(access_token) {
            $scope.showFriendsList = true;
            $http.get('/users?access_token='+access_token)
            .then(function(response) {
                console.log(response.data);
                $scope.friends = response.data;
            });
        }
        
        function getCredibilityOfUser(user_id) {
            return $http.get('/get_credibility?access_token='+token+'&user_id='+user_id)
            .then(function(response) {
                console.log(response.data);
                return response.data;
            });
        };
        
        function setCookies(key, value, expires) {
            var expiresValue = new Date(today);
            expiresValue.setSeconds(today.getSeconds() + expires);
            $cookies.put(key, value, {'expires' : expiresValue})
        }
        
        $scope.changeLocation = function (path) {
            $location.url(path);
        };
        
        $scope.logout = function () {
            $cookies.remove('access_token');
            $cookies.remove('user_id');
            $scope.isAuth = false;
            $window.location.reload();
        };
        
        function showSecondChoiceView(userData) {
            var index = $scope.friends.indexOf(userData.id);
                if (index >= 0) {
                  $scope.friends.splice( index, 1 );
                }
            $scope.showSecondStepView = true;
        }
            

        $scope.getFirstUserCredibility = function (user_id) {
            $scope.inProgress = true;
            getCredibilityOfUser(user_id).then(function (response) {
                $scope.firstUser = response
                console.log(response);
                showSecondChoiceView($scope.firstUser);
            }).finally(function(){
                $scope.inProgress = false;
            });
        };

        $scope.getSecondUserCredibility = function (user_id) {
            $scope.inProgress = true;
            getCredibilityOfUser(user_id).then(function (response) {
                $scope.secondUser = response;
                console.log(response);
                if ($scope.secondUser.credibility > $scope.firstUser.credibility) {
                    $scope.secondUser.isWin = true;
                } else {
                    $scope.firstUser.isWin = true;
                }
                $scope.showSecondStepView = false;
                $scope.versusView = true;
            }).finally(function(){
                $scope.inProgress = false;
            });
        };
    }
})();