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


angular.module('koolkartAngularjs').directive('kkRating', function() {
  return {
    restrict: 'E',
    scope: {},
    link: function(scope, element, attr) {
      var rating = Number(attr['score']) / 5 * 100;
      scope.perScore = rating;
    },
    template: '<div class="star">' +
    '<div class="mask-bg">' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '</div>' +
    '<div class="mask" style="width:{{perScore}}%;">' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '<span class="glyphicon glyphicon-star"></span>' +
    '</div>' +
    '</div>'
  }

});


angular.module('koolkartAngularjs').
  filter('truncate', function() {
    return function(text, length, end) {
      if (isNaN(length)) {
        length = 10;
      }
      if (end === undefined) {
        end = "...";
      }
      if (text.length <= length || text.length - end.length <= length) {
        return text;
      } else {
        return String(text).substring(0, length - end.length) + end;
      }

    };
  });
