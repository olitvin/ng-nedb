(function () {
    'use strict';
    var Datastore = require('nedb');

    angular.module('olitvin.nedb', [])
        .factory('$neDB', function () {
            return function (options) {
                var db = null;
                if (!options) {
                    db = new Datastore();
                } else {
                    db = new Datastore(options);
                }
                return db;
            }
        });
});