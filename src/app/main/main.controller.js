'use strict';

function chunk( array , chunkSize) {
  return [].concat.apply([],
    array.map(function(elem, i) {
      return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
    })
  );
}

angular.module('koolkartAngularjs')
  .controller('MainCtrl', function($scope, $http) {
    $scope.productsPromise = $http.get('/mock/data.json').then(function(res) {
     // $scope.products = res.data;
      $scope.products = chunk(res.data, 3);
    })
  });
