'use strict';

function chunk(array, chunkSize) {
  return [].concat.apply([],
    array.map(function(elem, i) {
      return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
    })
  );
}

angular.module('koolkartAngularjs')
  .controller('MainCtrl', function($scope, $http) {
    $scope.renderView = 'TABLE_VIEW';
    $scope.dataCache = [];
    $scope.changeView = function(type) {
      $scope.renderView = type;
      $scope.render();
    };

    $scope.render = function() {
      switch ($scope.renderView) {
        case 'TABLE_VIEW':
          $scope.products = chunk($scope.dataCache, 3);
          break;
        case 'LIST_VIEW':
          $scope.products = chunk($scope.dataCache, 1);
          break;
      }
    };

    $scope.productsPromise = $http.get('/mock/data.json').then(function(res) {
      $scope.dataCache = res.data;
      $scope.render();
    })
  });
