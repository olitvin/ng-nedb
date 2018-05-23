/*
  ng-nedb - v0.0.3 
  2018-05-23
*/

(function() {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) {
                    var c = "function" == typeof require && require;
                    if (!f && c) return c(i, !0);
                    if (u) return u(i, !0);
                    var a = new Error("Cannot find module '" + i + "'");
                    throw a.code = "MODULE_NOT_FOUND", a;
                }
                var p = n[i] = {
                    exports: {}
                };
                e[i][0].call(p.exports, function(r) {
                    var n = e[i][1][r];
                    return o(n || r);
                }, p, p.exports, r, e, n, t);
            }
            return n[i].exports;
        }
        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o;
    }
    return r;
})()({
    1: [ function(require, module, exports) {
        (function(process, setImmediate) {
            (function() {
                var async = {};
                var root, previous_async;
                root = this;
                if (root != null) {
                    previous_async = root.async;
                }
                async.noConflict = function() {
                    root.async = previous_async;
                    return async;
                };
                function only_once(fn) {
                    var called = false;
                    return function() {
                        if (called) throw new Error("Callback was already called.");
                        called = true;
                        fn.apply(root, arguments);
                    };
                }
                var _each = function(arr, iterator) {
                    if (arr.forEach) {
                        return arr.forEach(iterator);
                    }
                    for (var i = 0; i < arr.length; i += 1) {
                        iterator(arr[i], i, arr);
                    }
                };
                var _map = function(arr, iterator) {
                    if (arr.map) {
                        return arr.map(iterator);
                    }
                    var results = [];
                    _each(arr, function(x, i, a) {
                        results.push(iterator(x, i, a));
                    });
                    return results;
                };
                var _reduce = function(arr, iterator, memo) {
                    if (arr.reduce) {
                        return arr.reduce(iterator, memo);
                    }
                    _each(arr, function(x, i, a) {
                        memo = iterator(memo, x, i, a);
                    });
                    return memo;
                };
                var _keys = function(obj) {
                    if (Object.keys) {
                        return Object.keys(obj);
                    }
                    var keys = [];
                    for (var k in obj) {
                        if (obj.hasOwnProperty(k)) {
                            keys.push(k);
                        }
                    }
                    return keys;
                };
                if (typeof process === "undefined" || !process.nextTick) {
                    if (typeof setImmediate === "function") {
                        async.nextTick = function(fn) {
                            setImmediate(fn);
                        };
                        async.setImmediate = async.nextTick;
                    } else {
                        async.nextTick = function(fn) {
                            setTimeout(fn, 0);
                        };
                        async.setImmediate = async.nextTick;
                    }
                } else {
                    async.nextTick = process.nextTick;
                    if (typeof setImmediate !== "undefined") {
                        async.setImmediate = function(fn) {
                            setImmediate(fn);
                        };
                    } else {
                        async.setImmediate = async.nextTick;
                    }
                }
                async.each = function(arr, iterator, callback) {
                    callback = callback || function() {};
                    if (!arr.length) {
                        return callback();
                    }
                    var completed = 0;
                    _each(arr, function(x) {
                        iterator(x, only_once(function(err) {
                            if (err) {
                                callback(err);
                                callback = function() {};
                            } else {
                                completed += 1;
                                if (completed >= arr.length) {
                                    callback(null);
                                }
                            }
                        }));
                    });
                };
                async.forEach = async.each;
                async.eachSeries = function(arr, iterator, callback) {
                    callback = callback || function() {};
                    if (!arr.length) {
                        return callback();
                    }
                    var completed = 0;
                    var iterate = function() {
                        iterator(arr[completed], function(err) {
                            if (err) {
                                callback(err);
                                callback = function() {};
                            } else {
                                completed += 1;
                                if (completed >= arr.length) {
                                    callback(null);
                                } else {
                                    iterate();
                                }
                            }
                        });
                    };
                    iterate();
                };
                async.forEachSeries = async.eachSeries;
                async.eachLimit = function(arr, limit, iterator, callback) {
                    var fn = _eachLimit(limit);
                    fn.apply(null, [ arr, iterator, callback ]);
                };
                async.forEachLimit = async.eachLimit;
                var _eachLimit = function(limit) {
                    return function(arr, iterator, callback) {
                        callback = callback || function() {};
                        if (!arr.length || limit <= 0) {
                            return callback();
                        }
                        var completed = 0;
                        var started = 0;
                        var running = 0;
                        (function replenish() {
                            if (completed >= arr.length) {
                                return callback();
                            }
                            while (running < limit && started < arr.length) {
                                started += 1;
                                running += 1;
                                iterator(arr[started - 1], function(err) {
                                    if (err) {
                                        callback(err);
                                        callback = function() {};
                                    } else {
                                        completed += 1;
                                        running -= 1;
                                        if (completed >= arr.length) {
                                            callback();
                                        } else {
                                            replenish();
                                        }
                                    }
                                });
                            }
                        })();
                    };
                };
                var doParallel = function(fn) {
                    return function() {
                        var args = Array.prototype.slice.call(arguments);
                        return fn.apply(null, [ async.each ].concat(args));
                    };
                };
                var doParallelLimit = function(limit, fn) {
                    return function() {
                        var args = Array.prototype.slice.call(arguments);
                        return fn.apply(null, [ _eachLimit(limit) ].concat(args));
                    };
                };
                var doSeries = function(fn) {
                    return function() {
                        var args = Array.prototype.slice.call(arguments);
                        return fn.apply(null, [ async.eachSeries ].concat(args));
                    };
                };
                var _asyncMap = function(eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function(x, i) {
                        return {
                            index: i,
                            value: x
                        };
                    });
                    eachfn(arr, function(x, callback) {
                        iterator(x.value, function(err, v) {
                            results[x.index] = v;
                            callback(err);
                        });
                    }, function(err) {
                        callback(err, results);
                    });
                };
                async.map = doParallel(_asyncMap);
                async.mapSeries = doSeries(_asyncMap);
                async.mapLimit = function(arr, limit, iterator, callback) {
                    return _mapLimit(limit)(arr, iterator, callback);
                };
                var _mapLimit = function(limit) {
                    return doParallelLimit(limit, _asyncMap);
                };
                async.reduce = function(arr, memo, iterator, callback) {
                    async.eachSeries(arr, function(x, callback) {
                        iterator(memo, x, function(err, v) {
                            memo = v;
                            callback(err);
                        });
                    }, function(err) {
                        callback(err, memo);
                    });
                };
                async.inject = async.reduce;
                async.foldl = async.reduce;
                async.reduceRight = function(arr, memo, iterator, callback) {
                    var reversed = _map(arr, function(x) {
                        return x;
                    }).reverse();
                    async.reduce(reversed, memo, iterator, callback);
                };
                async.foldr = async.reduceRight;
                var _filter = function(eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function(x, i) {
                        return {
                            index: i,
                            value: x
                        };
                    });
                    eachfn(arr, function(x, callback) {
                        iterator(x.value, function(v) {
                            if (v) {
                                results.push(x);
                            }
                            callback();
                        });
                    }, function(err) {
                        callback(_map(results.sort(function(a, b) {
                            return a.index - b.index;
                        }), function(x) {
                            return x.value;
                        }));
                    });
                };
                async.filter = doParallel(_filter);
                async.filterSeries = doSeries(_filter);
                async.select = async.filter;
                async.selectSeries = async.filterSeries;
                var _reject = function(eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function(x, i) {
                        return {
                            index: i,
                            value: x
                        };
                    });
                    eachfn(arr, function(x, callback) {
                        iterator(x.value, function(v) {
                            if (!v) {
                                results.push(x);
                            }
                            callback();
                        });
                    }, function(err) {
                        callback(_map(results.sort(function(a, b) {
                            return a.index - b.index;
                        }), function(x) {
                            return x.value;
                        }));
                    });
                };
                async.reject = doParallel(_reject);
                async.rejectSeries = doSeries(_reject);
                var _detect = function(eachfn, arr, iterator, main_callback) {
                    eachfn(arr, function(x, callback) {
                        iterator(x, function(result) {
                            if (result) {
                                main_callback(x);
                                main_callback = function() {};
                            } else {
                                callback();
                            }
                        });
                    }, function(err) {
                        main_callback();
                    });
                };
                async.detect = doParallel(_detect);
                async.detectSeries = doSeries(_detect);
                async.some = function(arr, iterator, main_callback) {
                    async.each(arr, function(x, callback) {
                        iterator(x, function(v) {
                            if (v) {
                                main_callback(true);
                                main_callback = function() {};
                            }
                            callback();
                        });
                    }, function(err) {
                        main_callback(false);
                    });
                };
                async.any = async.some;
                async.every = function(arr, iterator, main_callback) {
                    async.each(arr, function(x, callback) {
                        iterator(x, function(v) {
                            if (!v) {
                                main_callback(false);
                                main_callback = function() {};
                            }
                            callback();
                        });
                    }, function(err) {
                        main_callback(true);
                    });
                };
                async.all = async.every;
                async.sortBy = function(arr, iterator, callback) {
                    async.map(arr, function(x, callback) {
                        iterator(x, function(err, criteria) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, {
                                    value: x,
                                    criteria: criteria
                                });
                            }
                        });
                    }, function(err, results) {
                        if (err) {
                            return callback(err);
                        } else {
                            var fn = function(left, right) {
                                var a = left.criteria, b = right.criteria;
                                return a < b ? -1 : a > b ? 1 : 0;
                            };
                            callback(null, _map(results.sort(fn), function(x) {
                                return x.value;
                            }));
                        }
                    });
                };
                async.auto = function(tasks, callback) {
                    callback = callback || function() {};
                    var keys = _keys(tasks);
                    if (!keys.length) {
                        return callback(null);
                    }
                    var results = {};
                    var listeners = [];
                    var addListener = function(fn) {
                        listeners.unshift(fn);
                    };
                    var removeListener = function(fn) {
                        for (var i = 0; i < listeners.length; i += 1) {
                            if (listeners[i] === fn) {
                                listeners.splice(i, 1);
                                return;
                            }
                        }
                    };
                    var taskComplete = function() {
                        _each(listeners.slice(0), function(fn) {
                            fn();
                        });
                    };
                    addListener(function() {
                        if (_keys(results).length === keys.length) {
                            callback(null, results);
                            callback = function() {};
                        }
                    });
                    _each(keys, function(k) {
                        var task = tasks[k] instanceof Function ? [ tasks[k] ] : tasks[k];
                        var taskCallback = function(err) {
                            var args = Array.prototype.slice.call(arguments, 1);
                            if (args.length <= 1) {
                                args = args[0];
                            }
                            if (err) {
                                var safeResults = {};
                                _each(_keys(results), function(rkey) {
                                    safeResults[rkey] = results[rkey];
                                });
                                safeResults[k] = args;
                                callback(err, safeResults);
                                callback = function() {};
                            } else {
                                results[k] = args;
                                async.setImmediate(taskComplete);
                            }
                        };
                        var requires = task.slice(0, Math.abs(task.length - 1)) || [];
                        var ready = function() {
                            return _reduce(requires, function(a, x) {
                                return a && results.hasOwnProperty(x);
                            }, true) && !results.hasOwnProperty(k);
                        };
                        if (ready()) {
                            task[task.length - 1](taskCallback, results);
                        } else {
                            var listener = function() {
                                if (ready()) {
                                    removeListener(listener);
                                    task[task.length - 1](taskCallback, results);
                                }
                            };
                            addListener(listener);
                        }
                    });
                };
                async.waterfall = function(tasks, callback) {
                    callback = callback || function() {};
                    if (tasks.constructor !== Array) {
                        var err = new Error("First argument to waterfall must be an array of functions");
                        return callback(err);
                    }
                    if (!tasks.length) {
                        return callback();
                    }
                    var wrapIterator = function(iterator) {
                        return function(err) {
                            if (err) {
                                callback.apply(null, arguments);
                                callback = function() {};
                            } else {
                                var args = Array.prototype.slice.call(arguments, 1);
                                var next = iterator.next();
                                if (next) {
                                    args.push(wrapIterator(next));
                                } else {
                                    args.push(callback);
                                }
                                async.setImmediate(function() {
                                    iterator.apply(null, args);
                                });
                            }
                        };
                    };
                    wrapIterator(async.iterator(tasks))();
                };
                var _parallel = function(eachfn, tasks, callback) {
                    callback = callback || function() {};
                    if (tasks.constructor === Array) {
                        eachfn.map(tasks, function(fn, callback) {
                            if (fn) {
                                fn(function(err) {
                                    var args = Array.prototype.slice.call(arguments, 1);
                                    if (args.length <= 1) {
                                        args = args[0];
                                    }
                                    callback.call(null, err, args);
                                });
                            }
                        }, callback);
                    } else {
                        var results = {};
                        eachfn.each(_keys(tasks), function(k, callback) {
                            tasks[k](function(err) {
                                var args = Array.prototype.slice.call(arguments, 1);
                                if (args.length <= 1) {
                                    args = args[0];
                                }
                                results[k] = args;
                                callback(err);
                            });
                        }, function(err) {
                            callback(err, results);
                        });
                    }
                };
                async.parallel = function(tasks, callback) {
                    _parallel({
                        map: async.map,
                        each: async.each
                    }, tasks, callback);
                };
                async.parallelLimit = function(tasks, limit, callback) {
                    _parallel({
                        map: _mapLimit(limit),
                        each: _eachLimit(limit)
                    }, tasks, callback);
                };
                async.series = function(tasks, callback) {
                    callback = callback || function() {};
                    if (tasks.constructor === Array) {
                        async.mapSeries(tasks, function(fn, callback) {
                            if (fn) {
                                fn(function(err) {
                                    var args = Array.prototype.slice.call(arguments, 1);
                                    if (args.length <= 1) {
                                        args = args[0];
                                    }
                                    callback.call(null, err, args);
                                });
                            }
                        }, callback);
                    } else {
                        var results = {};
                        async.eachSeries(_keys(tasks), function(k, callback) {
                            tasks[k](function(err) {
                                var args = Array.prototype.slice.call(arguments, 1);
                                if (args.length <= 1) {
                                    args = args[0];
                                }
                                results[k] = args;
                                callback(err);
                            });
                        }, function(err) {
                            callback(err, results);
                        });
                    }
                };
                async.iterator = function(tasks) {
                    var makeCallback = function(index) {
                        var fn = function() {
                            if (tasks.length) {
                                tasks[index].apply(null, arguments);
                            }
                            return fn.next();
                        };
                        fn.next = function() {
                            return index < tasks.length - 1 ? makeCallback(index + 1) : null;
                        };
                        return fn;
                    };
                    return makeCallback(0);
                };
                async.apply = function(fn) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    return function() {
                        return fn.apply(null, args.concat(Array.prototype.slice.call(arguments)));
                    };
                };
                var _concat = function(eachfn, arr, fn, callback) {
                    var r = [];
                    eachfn(arr, function(x, cb) {
                        fn(x, function(err, y) {
                            r = r.concat(y || []);
                            cb(err);
                        });
                    }, function(err) {
                        callback(err, r);
                    });
                };
                async.concat = doParallel(_concat);
                async.concatSeries = doSeries(_concat);
                async.whilst = function(test, iterator, callback) {
                    if (test()) {
                        iterator(function(err) {
                            if (err) {
                                return callback(err);
                            }
                            async.whilst(test, iterator, callback);
                        });
                    } else {
                        callback();
                    }
                };
                async.doWhilst = function(iterator, test, callback) {
                    iterator(function(err) {
                        if (err) {
                            return callback(err);
                        }
                        if (test()) {
                            async.doWhilst(iterator, test, callback);
                        } else {
                            callback();
                        }
                    });
                };
                async.until = function(test, iterator, callback) {
                    if (!test()) {
                        iterator(function(err) {
                            if (err) {
                                return callback(err);
                            }
                            async.until(test, iterator, callback);
                        });
                    } else {
                        callback();
                    }
                };
                async.doUntil = function(iterator, test, callback) {
                    iterator(function(err) {
                        if (err) {
                            return callback(err);
                        }
                        if (!test()) {
                            async.doUntil(iterator, test, callback);
                        } else {
                            callback();
                        }
                    });
                };
                async.queue = function(worker, concurrency) {
                    if (concurrency === undefined) {
                        concurrency = 1;
                    }
                    function _insert(q, data, pos, callback) {
                        if (data.constructor !== Array) {
                            data = [ data ];
                        }
                        _each(data, function(task) {
                            var item = {
                                data: task,
                                callback: typeof callback === "function" ? callback : null
                            };
                            if (pos) {
                                q.tasks.unshift(item);
                            } else {
                                q.tasks.push(item);
                            }
                            if (q.saturated && q.tasks.length === concurrency) {
                                q.saturated();
                            }
                            async.setImmediate(q.process);
                        });
                    }
                    var workers = 0;
                    var q = {
                        tasks: [],
                        concurrency: concurrency,
                        saturated: null,
                        empty: null,
                        drain: null,
                        push: function(data, callback) {
                            _insert(q, data, false, callback);
                        },
                        unshift: function(data, callback) {
                            _insert(q, data, true, callback);
                        },
                        process: function() {
                            if (workers < q.concurrency && q.tasks.length) {
                                var task = q.tasks.shift();
                                if (q.empty && q.tasks.length === 0) {
                                    q.empty();
                                }
                                workers += 1;
                                var next = function() {
                                    workers -= 1;
                                    if (task.callback) {
                                        task.callback.apply(task, arguments);
                                    }
                                    if (q.drain && q.tasks.length + workers === 0) {
                                        q.drain();
                                    }
                                    q.process();
                                };
                                var cb = only_once(next);
                                worker(task.data, cb);
                            }
                        },
                        length: function() {
                            return q.tasks.length;
                        },
                        running: function() {
                            return workers;
                        }
                    };
                    return q;
                };
                async.cargo = function(worker, payload) {
                    var working = false, tasks = [];
                    var cargo = {
                        tasks: tasks,
                        payload: payload,
                        saturated: null,
                        empty: null,
                        drain: null,
                        push: function(data, callback) {
                            if (data.constructor !== Array) {
                                data = [ data ];
                            }
                            _each(data, function(task) {
                                tasks.push({
                                    data: task,
                                    callback: typeof callback === "function" ? callback : null
                                });
                                if (cargo.saturated && tasks.length === payload) {
                                    cargo.saturated();
                                }
                            });
                            async.setImmediate(cargo.process);
                        },
                        process: function process() {
                            if (working) return;
                            if (tasks.length === 0) {
                                if (cargo.drain) cargo.drain();
                                return;
                            }
                            var ts = typeof payload === "number" ? tasks.splice(0, payload) : tasks.splice(0);
                            var ds = _map(ts, function(task) {
                                return task.data;
                            });
                            if (cargo.empty) cargo.empty();
                            working = true;
                            worker(ds, function() {
                                working = false;
                                var args = arguments;
                                _each(ts, function(data) {
                                    if (data.callback) {
                                        data.callback.apply(null, args);
                                    }
                                });
                                process();
                            });
                        },
                        length: function() {
                            return tasks.length;
                        },
                        running: function() {
                            return working;
                        }
                    };
                    return cargo;
                };
                var _console_fn = function(name) {
                    return function(fn) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        fn.apply(null, args.concat([ function(err) {
                            var args = Array.prototype.slice.call(arguments, 1);
                            if (typeof console !== "undefined") {
                                if (err) {
                                    if (console.error) {
                                        console.error(err);
                                    }
                                } else if (console[name]) {
                                    _each(args, function(x) {
                                        console[name](x);
                                    });
                                }
                            }
                        } ]));
                    };
                };
                async.log = _console_fn("log");
                async.dir = _console_fn("dir");
                async.memoize = function(fn, hasher) {
                    var memo = {};
                    var queues = {};
                    hasher = hasher || function(x) {
                        return x;
                    };
                    var memoized = function() {
                        var args = Array.prototype.slice.call(arguments);
                        var callback = args.pop();
                        var key = hasher.apply(null, args);
                        if (key in memo) {
                            callback.apply(null, memo[key]);
                        } else if (key in queues) {
                            queues[key].push(callback);
                        } else {
                            queues[key] = [ callback ];
                            fn.apply(null, args.concat([ function() {
                                memo[key] = arguments;
                                var q = queues[key];
                                delete queues[key];
                                for (var i = 0, l = q.length; i < l; i++) {
                                    q[i].apply(null, arguments);
                                }
                            } ]));
                        }
                    };
                    memoized.memo = memo;
                    memoized.unmemoized = fn;
                    return memoized;
                };
                async.unmemoize = function(fn) {
                    return function() {
                        return (fn.unmemoized || fn).apply(null, arguments);
                    };
                };
                async.times = function(count, iterator, callback) {
                    var counter = [];
                    for (var i = 0; i < count; i++) {
                        counter.push(i);
                    }
                    return async.map(counter, iterator, callback);
                };
                async.timesSeries = function(count, iterator, callback) {
                    var counter = [];
                    for (var i = 0; i < count; i++) {
                        counter.push(i);
                    }
                    return async.mapSeries(counter, iterator, callback);
                };
                async.compose = function() {
                    var fns = Array.prototype.reverse.call(arguments);
                    return function() {
                        var that = this;
                        var args = Array.prototype.slice.call(arguments);
                        var callback = args.pop();
                        async.reduce(fns, args, function(newargs, fn, cb) {
                            fn.apply(that, newargs.concat([ function() {
                                var err = arguments[0];
                                var nextargs = Array.prototype.slice.call(arguments, 1);
                                cb(err, nextargs);
                            } ]));
                        }, function(err, results) {
                            callback.apply(that, [ err ].concat(results));
                        });
                    };
                };
                var _applyEach = function(eachfn, fns) {
                    var go = function() {
                        var that = this;
                        var args = Array.prototype.slice.call(arguments);
                        var callback = args.pop();
                        return eachfn(fns, function(fn, cb) {
                            fn.apply(that, args.concat([ cb ]));
                        }, callback);
                    };
                    if (arguments.length > 2) {
                        var args = Array.prototype.slice.call(arguments, 2);
                        return go.apply(this, args);
                    } else {
                        return go;
                    }
                };
                async.applyEach = doParallel(_applyEach);
                async.applyEachSeries = doSeries(_applyEach);
                async.forever = function(fn, callback) {
                    function next(err) {
                        if (err) {
                            if (callback) {
                                return callback(err);
                            }
                            throw err;
                        }
                        fn(next);
                    }
                    next();
                };
                if (typeof define !== "undefined" && define.amd) {
                    define([], function() {
                        return async;
                    });
                } else if (typeof module !== "undefined" && module.exports) {
                    module.exports = async;
                } else {
                    root.async = async;
                }
            })();
        }).call(this, require("_process"), require("timers").setImmediate);
    }, {
        _process: 18,
        timers: 19
    } ],
    2: [ function(require, module, exports) {
        module.exports.BinarySearchTree = require("./lib/bst");
        module.exports.AVLTree = require("./lib/avltree");
    }, {
        "./lib/avltree": 3,
        "./lib/bst": 4
    } ],
    3: [ function(require, module, exports) {
        var BinarySearchTree = require("./bst"), customUtils = require("./customUtils"), util = require("util"), _ = require("underscore");
        function AVLTree(options) {
            this.tree = new _AVLTree(options);
        }
        function _AVLTree(options) {
            options = options || {};
            this.left = null;
            this.right = null;
            this.parent = options.parent !== undefined ? options.parent : null;
            if (options.hasOwnProperty("key")) {
                this.key = options.key;
            }
            this.data = options.hasOwnProperty("value") ? [ options.value ] : [];
            this.unique = options.unique || false;
            this.compareKeys = options.compareKeys || customUtils.defaultCompareKeysFunction;
            this.checkValueEquality = options.checkValueEquality || customUtils.defaultCheckValueEquality;
        }
        util.inherits(_AVLTree, BinarySearchTree);
        AVLTree._AVLTree = _AVLTree;
        _AVLTree.prototype.checkHeightCorrect = function() {
            var leftH, rightH;
            if (!this.hasOwnProperty("key")) {
                return;
            }
            if (this.left && this.left.height === undefined) {
                throw new Error("Undefined height for node " + this.left.key);
            }
            if (this.right && this.right.height === undefined) {
                throw new Error("Undefined height for node " + this.right.key);
            }
            if (this.height === undefined) {
                throw new Error("Undefined height for node " + this.key);
            }
            leftH = this.left ? this.left.height : 0;
            rightH = this.right ? this.right.height : 0;
            if (this.height !== 1 + Math.max(leftH, rightH)) {
                throw new Error("Height constraint failed for node " + this.key);
            }
            if (this.left) {
                this.left.checkHeightCorrect();
            }
            if (this.right) {
                this.right.checkHeightCorrect();
            }
        };
        _AVLTree.prototype.balanceFactor = function() {
            var leftH = this.left ? this.left.height : 0, rightH = this.right ? this.right.height : 0;
            return leftH - rightH;
        };
        _AVLTree.prototype.checkBalanceFactors = function() {
            if (Math.abs(this.balanceFactor()) > 1) {
                throw new Error("Tree is unbalanced at node " + this.key);
            }
            if (this.left) {
                this.left.checkBalanceFactors();
            }
            if (this.right) {
                this.right.checkBalanceFactors();
            }
        };
        _AVLTree.prototype.checkIsAVLT = function() {
            _AVLTree.super_.prototype.checkIsBST.call(this);
            this.checkHeightCorrect();
            this.checkBalanceFactors();
        };
        AVLTree.prototype.checkIsAVLT = function() {
            this.tree.checkIsAVLT();
        };
        _AVLTree.prototype.rightRotation = function() {
            var q = this, p = this.left, b, ah, bh, ch;
            if (!p) {
                return this;
            }
            b = p.right;
            if (q.parent) {
                p.parent = q.parent;
                if (q.parent.left === q) {
                    q.parent.left = p;
                } else {
                    q.parent.right = p;
                }
            } else {
                p.parent = null;
            }
            p.right = q;
            q.parent = p;
            q.left = b;
            if (b) {
                b.parent = q;
            }
            ah = p.left ? p.left.height : 0;
            bh = b ? b.height : 0;
            ch = q.right ? q.right.height : 0;
            q.height = Math.max(bh, ch) + 1;
            p.height = Math.max(ah, q.height) + 1;
            return p;
        };
        _AVLTree.prototype.leftRotation = function() {
            var p = this, q = this.right, b, ah, bh, ch;
            if (!q) {
                return this;
            }
            b = q.left;
            if (p.parent) {
                q.parent = p.parent;
                if (p.parent.left === p) {
                    p.parent.left = q;
                } else {
                    p.parent.right = q;
                }
            } else {
                q.parent = null;
            }
            q.left = p;
            p.parent = q;
            p.right = b;
            if (b) {
                b.parent = p;
            }
            ah = p.left ? p.left.height : 0;
            bh = b ? b.height : 0;
            ch = q.right ? q.right.height : 0;
            p.height = Math.max(ah, bh) + 1;
            q.height = Math.max(ch, p.height) + 1;
            return q;
        };
        _AVLTree.prototype.rightTooSmall = function() {
            if (this.balanceFactor() <= 1) {
                return this;
            }
            if (this.left.balanceFactor() < 0) {
                this.left.leftRotation();
            }
            return this.rightRotation();
        };
        _AVLTree.prototype.leftTooSmall = function() {
            if (this.balanceFactor() >= -1) {
                return this;
            }
            if (this.right.balanceFactor() > 0) {
                this.right.rightRotation();
            }
            return this.leftRotation();
        };
        _AVLTree.prototype.rebalanceAlongPath = function(path) {
            var newRoot = this, rotated, i;
            if (!this.hasOwnProperty("key")) {
                delete this.height;
                return this;
            }
            for (i = path.length - 1; i >= 0; i -= 1) {
                path[i].height = 1 + Math.max(path[i].left ? path[i].left.height : 0, path[i].right ? path[i].right.height : 0);
                if (path[i].balanceFactor() > 1) {
                    rotated = path[i].rightTooSmall();
                    if (i === 0) {
                        newRoot = rotated;
                    }
                }
                if (path[i].balanceFactor() < -1) {
                    rotated = path[i].leftTooSmall();
                    if (i === 0) {
                        newRoot = rotated;
                    }
                }
            }
            return newRoot;
        };
        _AVLTree.prototype.insert = function(key, value) {
            var insertPath = [], currentNode = this;
            if (!this.hasOwnProperty("key")) {
                this.key = key;
                this.data.push(value);
                this.height = 1;
                return this;
            }
            while (true) {
                if (currentNode.compareKeys(currentNode.key, key) === 0) {
                    if (currentNode.unique) {
                        var err = new Error("Can't insert key " + key + ", it violates the unique constraint");
                        err.key = key;
                        err.errorType = "uniqueViolated";
                        throw err;
                    } else {
                        currentNode.data.push(value);
                    }
                    return this;
                }
                insertPath.push(currentNode);
                if (currentNode.compareKeys(key, currentNode.key) < 0) {
                    if (!currentNode.left) {
                        insertPath.push(currentNode.createLeftChild({
                            key: key,
                            value: value
                        }));
                        break;
                    } else {
                        currentNode = currentNode.left;
                    }
                } else {
                    if (!currentNode.right) {
                        insertPath.push(currentNode.createRightChild({
                            key: key,
                            value: value
                        }));
                        break;
                    } else {
                        currentNode = currentNode.right;
                    }
                }
            }
            return this.rebalanceAlongPath(insertPath);
        };
        AVLTree.prototype.insert = function(key, value) {
            var newTree = this.tree.insert(key, value);
            if (newTree) {
                this.tree = newTree;
            }
        };
        _AVLTree.prototype.delete = function(key, value) {
            var newData = [], replaceWith, self = this, currentNode = this, deletePath = [];
            if (!this.hasOwnProperty("key")) {
                return this;
            }
            while (true) {
                if (currentNode.compareKeys(key, currentNode.key) === 0) {
                    break;
                }
                deletePath.push(currentNode);
                if (currentNode.compareKeys(key, currentNode.key) < 0) {
                    if (currentNode.left) {
                        currentNode = currentNode.left;
                    } else {
                        return this;
                    }
                } else {
                    if (currentNode.right) {
                        currentNode = currentNode.right;
                    } else {
                        return this;
                    }
                }
            }
            if (currentNode.data.length > 1 && value) {
                currentNode.data.forEach(function(d) {
                    if (!currentNode.checkValueEquality(d, value)) {
                        newData.push(d);
                    }
                });
                currentNode.data = newData;
                return this;
            }
            if (!currentNode.left && !currentNode.right) {
                if (currentNode === this) {
                    delete currentNode.key;
                    currentNode.data = [];
                    delete currentNode.height;
                    return this;
                } else {
                    if (currentNode.parent.left === currentNode) {
                        currentNode.parent.left = null;
                    } else {
                        currentNode.parent.right = null;
                    }
                    return this.rebalanceAlongPath(deletePath);
                }
            }
            if (!currentNode.left || !currentNode.right) {
                replaceWith = currentNode.left ? currentNode.left : currentNode.right;
                if (currentNode === this) {
                    replaceWith.parent = null;
                    return replaceWith;
                } else {
                    if (currentNode.parent.left === currentNode) {
                        currentNode.parent.left = replaceWith;
                        replaceWith.parent = currentNode.parent;
                    } else {
                        currentNode.parent.right = replaceWith;
                        replaceWith.parent = currentNode.parent;
                    }
                    return this.rebalanceAlongPath(deletePath);
                }
            }
            deletePath.push(currentNode);
            replaceWith = currentNode.left;
            if (!replaceWith.right) {
                currentNode.key = replaceWith.key;
                currentNode.data = replaceWith.data;
                currentNode.left = replaceWith.left;
                if (replaceWith.left) {
                    replaceWith.left.parent = currentNode;
                }
                return this.rebalanceAlongPath(deletePath);
            }
            while (true) {
                if (replaceWith.right) {
                    deletePath.push(replaceWith);
                    replaceWith = replaceWith.right;
                } else {
                    break;
                }
            }
            currentNode.key = replaceWith.key;
            currentNode.data = replaceWith.data;
            replaceWith.parent.right = replaceWith.left;
            if (replaceWith.left) {
                replaceWith.left.parent = replaceWith.parent;
            }
            return this.rebalanceAlongPath(deletePath);
        };
        AVLTree.prototype.delete = function(key, value) {
            var newTree = this.tree.delete(key, value);
            if (newTree) {
                this.tree = newTree;
            }
        };
        [ "getNumberOfKeys", "search", "betweenBounds", "prettyPrint", "executeOnEveryNode" ].forEach(function(fn) {
            AVLTree.prototype[fn] = function() {
                return this.tree[fn].apply(this.tree, arguments);
            };
        });
        module.exports = AVLTree;
    }, {
        "./bst": 4,
        "./customUtils": 5,
        underscore: 20,
        util: 23
    } ],
    4: [ function(require, module, exports) {
        var customUtils = require("./customUtils");
        function BinarySearchTree(options) {
            options = options || {};
            this.left = null;
            this.right = null;
            this.parent = options.parent !== undefined ? options.parent : null;
            if (options.hasOwnProperty("key")) {
                this.key = options.key;
            }
            this.data = options.hasOwnProperty("value") ? [ options.value ] : [];
            this.unique = options.unique || false;
            this.compareKeys = options.compareKeys || customUtils.defaultCompareKeysFunction;
            this.checkValueEquality = options.checkValueEquality || customUtils.defaultCheckValueEquality;
        }
        BinarySearchTree.prototype.getMaxKeyDescendant = function() {
            if (this.right) {
                return this.right.getMaxKeyDescendant();
            } else {
                return this;
            }
        };
        BinarySearchTree.prototype.getMaxKey = function() {
            return this.getMaxKeyDescendant().key;
        };
        BinarySearchTree.prototype.getMinKeyDescendant = function() {
            if (this.left) {
                return this.left.getMinKeyDescendant();
            } else {
                return this;
            }
        };
        BinarySearchTree.prototype.getMinKey = function() {
            return this.getMinKeyDescendant().key;
        };
        BinarySearchTree.prototype.checkAllNodesFullfillCondition = function(test) {
            if (!this.hasOwnProperty("key")) {
                return;
            }
            test(this.key, this.data);
            if (this.left) {
                this.left.checkAllNodesFullfillCondition(test);
            }
            if (this.right) {
                this.right.checkAllNodesFullfillCondition(test);
            }
        };
        BinarySearchTree.prototype.checkNodeOrdering = function() {
            var self = this;
            if (!this.hasOwnProperty("key")) {
                return;
            }
            if (this.left) {
                this.left.checkAllNodesFullfillCondition(function(k) {
                    if (self.compareKeys(k, self.key) >= 0) {
                        throw new Error("Tree with root " + self.key + " is not a binary search tree");
                    }
                });
                this.left.checkNodeOrdering();
            }
            if (this.right) {
                this.right.checkAllNodesFullfillCondition(function(k) {
                    if (self.compareKeys(k, self.key) <= 0) {
                        throw new Error("Tree with root " + self.key + " is not a binary search tree");
                    }
                });
                this.right.checkNodeOrdering();
            }
        };
        BinarySearchTree.prototype.checkInternalPointers = function() {
            if (this.left) {
                if (this.left.parent !== this) {
                    throw new Error("Parent pointer broken for key " + this.key);
                }
                this.left.checkInternalPointers();
            }
            if (this.right) {
                if (this.right.parent !== this) {
                    throw new Error("Parent pointer broken for key " + this.key);
                }
                this.right.checkInternalPointers();
            }
        };
        BinarySearchTree.prototype.checkIsBST = function() {
            this.checkNodeOrdering();
            this.checkInternalPointers();
            if (this.parent) {
                throw new Error("The root shouldn't have a parent");
            }
        };
        BinarySearchTree.prototype.getNumberOfKeys = function() {
            var res;
            if (!this.hasOwnProperty("key")) {
                return 0;
            }
            res = 1;
            if (this.left) {
                res += this.left.getNumberOfKeys();
            }
            if (this.right) {
                res += this.right.getNumberOfKeys();
            }
            return res;
        };
        BinarySearchTree.prototype.createSimilar = function(options) {
            options = options || {};
            options.unique = this.unique;
            options.compareKeys = this.compareKeys;
            options.checkValueEquality = this.checkValueEquality;
            return new this.constructor(options);
        };
        BinarySearchTree.prototype.createLeftChild = function(options) {
            var leftChild = this.createSimilar(options);
            leftChild.parent = this;
            this.left = leftChild;
            return leftChild;
        };
        BinarySearchTree.prototype.createRightChild = function(options) {
            var rightChild = this.createSimilar(options);
            rightChild.parent = this;
            this.right = rightChild;
            return rightChild;
        };
        BinarySearchTree.prototype.insert = function(key, value) {
            if (!this.hasOwnProperty("key")) {
                this.key = key;
                this.data.push(value);
                return;
            }
            if (this.compareKeys(this.key, key) === 0) {
                if (this.unique) {
                    var err = new Error("Can't insert key " + key + ", it violates the unique constraint");
                    err.key = key;
                    err.errorType = "uniqueViolated";
                    throw err;
                } else {
                    this.data.push(value);
                }
                return;
            }
            if (this.compareKeys(key, this.key) < 0) {
                if (this.left) {
                    this.left.insert(key, value);
                } else {
                    this.createLeftChild({
                        key: key,
                        value: value
                    });
                }
            } else {
                if (this.right) {
                    this.right.insert(key, value);
                } else {
                    this.createRightChild({
                        key: key,
                        value: value
                    });
                }
            }
        };
        BinarySearchTree.prototype.search = function(key) {
            if (!this.hasOwnProperty("key")) {
                return [];
            }
            if (this.compareKeys(this.key, key) === 0) {
                return this.data;
            }
            if (this.compareKeys(key, this.key) < 0) {
                if (this.left) {
                    return this.left.search(key);
                } else {
                    return [];
                }
            } else {
                if (this.right) {
                    return this.right.search(key);
                } else {
                    return [];
                }
            }
        };
        BinarySearchTree.prototype.getLowerBoundMatcher = function(query) {
            var self = this;
            if (!query.hasOwnProperty("$gt") && !query.hasOwnProperty("$gte")) {
                return function() {
                    return true;
                };
            }
            if (query.hasOwnProperty("$gt") && query.hasOwnProperty("$gte")) {
                if (self.compareKeys(query.$gte, query.$gt) === 0) {
                    return function(key) {
                        return self.compareKeys(key, query.$gt) > 0;
                    };
                }
                if (self.compareKeys(query.$gte, query.$gt) > 0) {
                    return function(key) {
                        return self.compareKeys(key, query.$gte) >= 0;
                    };
                } else {
                    return function(key) {
                        return self.compareKeys(key, query.$gt) > 0;
                    };
                }
            }
            if (query.hasOwnProperty("$gt")) {
                return function(key) {
                    return self.compareKeys(key, query.$gt) > 0;
                };
            } else {
                return function(key) {
                    return self.compareKeys(key, query.$gte) >= 0;
                };
            }
        };
        BinarySearchTree.prototype.getUpperBoundMatcher = function(query) {
            var self = this;
            if (!query.hasOwnProperty("$lt") && !query.hasOwnProperty("$lte")) {
                return function() {
                    return true;
                };
            }
            if (query.hasOwnProperty("$lt") && query.hasOwnProperty("$lte")) {
                if (self.compareKeys(query.$lte, query.$lt) === 0) {
                    return function(key) {
                        return self.compareKeys(key, query.$lt) < 0;
                    };
                }
                if (self.compareKeys(query.$lte, query.$lt) < 0) {
                    return function(key) {
                        return self.compareKeys(key, query.$lte) <= 0;
                    };
                } else {
                    return function(key) {
                        return self.compareKeys(key, query.$lt) < 0;
                    };
                }
            }
            if (query.hasOwnProperty("$lt")) {
                return function(key) {
                    return self.compareKeys(key, query.$lt) < 0;
                };
            } else {
                return function(key) {
                    return self.compareKeys(key, query.$lte) <= 0;
                };
            }
        };
        function append(array, toAppend) {
            var i;
            for (i = 0; i < toAppend.length; i += 1) {
                array.push(toAppend[i]);
            }
        }
        BinarySearchTree.prototype.betweenBounds = function(query, lbm, ubm) {
            var res = [];
            if (!this.hasOwnProperty("key")) {
                return [];
            }
            lbm = lbm || this.getLowerBoundMatcher(query);
            ubm = ubm || this.getUpperBoundMatcher(query);
            if (lbm(this.key) && this.left) {
                append(res, this.left.betweenBounds(query, lbm, ubm));
            }
            if (lbm(this.key) && ubm(this.key)) {
                append(res, this.data);
            }
            if (ubm(this.key) && this.right) {
                append(res, this.right.betweenBounds(query, lbm, ubm));
            }
            return res;
        };
        BinarySearchTree.prototype.deleteIfLeaf = function() {
            if (this.left || this.right) {
                return false;
            }
            if (!this.parent) {
                delete this.key;
                this.data = [];
                return true;
            }
            if (this.parent.left === this) {
                this.parent.left = null;
            } else {
                this.parent.right = null;
            }
            return true;
        };
        BinarySearchTree.prototype.deleteIfOnlyOneChild = function() {
            var child;
            if (this.left && !this.right) {
                child = this.left;
            }
            if (!this.left && this.right) {
                child = this.right;
            }
            if (!child) {
                return false;
            }
            if (!this.parent) {
                this.key = child.key;
                this.data = child.data;
                this.left = null;
                if (child.left) {
                    this.left = child.left;
                    child.left.parent = this;
                }
                this.right = null;
                if (child.right) {
                    this.right = child.right;
                    child.right.parent = this;
                }
                return true;
            }
            if (this.parent.left === this) {
                this.parent.left = child;
                child.parent = this.parent;
            } else {
                this.parent.right = child;
                child.parent = this.parent;
            }
            return true;
        };
        BinarySearchTree.prototype.delete = function(key, value) {
            var newData = [], replaceWith, self = this;
            if (!this.hasOwnProperty("key")) {
                return;
            }
            if (this.compareKeys(key, this.key) < 0) {
                if (this.left) {
                    this.left.delete(key, value);
                }
                return;
            }
            if (this.compareKeys(key, this.key) > 0) {
                if (this.right) {
                    this.right.delete(key, value);
                }
                return;
            }
            if (!this.compareKeys(key, this.key) === 0) {
                return;
            }
            if (this.data.length > 1 && value !== undefined) {
                this.data.forEach(function(d) {
                    if (!self.checkValueEquality(d, value)) {
                        newData.push(d);
                    }
                });
                self.data = newData;
                return;
            }
            if (this.deleteIfLeaf()) {
                return;
            }
            if (this.deleteIfOnlyOneChild()) {
                return;
            }
            if (Math.random() >= .5) {
                replaceWith = this.left.getMaxKeyDescendant();
                this.key = replaceWith.key;
                this.data = replaceWith.data;
                if (this === replaceWith.parent) {
                    this.left = replaceWith.left;
                    if (replaceWith.left) {
                        replaceWith.left.parent = replaceWith.parent;
                    }
                } else {
                    replaceWith.parent.right = replaceWith.left;
                    if (replaceWith.left) {
                        replaceWith.left.parent = replaceWith.parent;
                    }
                }
            } else {
                replaceWith = this.right.getMinKeyDescendant();
                this.key = replaceWith.key;
                this.data = replaceWith.data;
                if (this === replaceWith.parent) {
                    this.right = replaceWith.right;
                    if (replaceWith.right) {
                        replaceWith.right.parent = replaceWith.parent;
                    }
                } else {
                    replaceWith.parent.left = replaceWith.right;
                    if (replaceWith.right) {
                        replaceWith.right.parent = replaceWith.parent;
                    }
                }
            }
        };
        BinarySearchTree.prototype.executeOnEveryNode = function(fn) {
            if (this.left) {
                this.left.executeOnEveryNode(fn);
            }
            fn(this);
            if (this.right) {
                this.right.executeOnEveryNode(fn);
            }
        };
        BinarySearchTree.prototype.prettyPrint = function(printData, spacing) {
            spacing = spacing || "";
            console.log(spacing + "* " + this.key);
            if (printData) {
                console.log(spacing + "* " + this.data);
            }
            if (!this.left && !this.right) {
                return;
            }
            if (this.left) {
                this.left.prettyPrint(printData, spacing + "  ");
            } else {
                console.log(spacing + "  *");
            }
            if (this.right) {
                this.right.prettyPrint(printData, spacing + "  ");
            } else {
                console.log(spacing + "  *");
            }
        };
        module.exports = BinarySearchTree;
    }, {
        "./customUtils": 5
    } ],
    5: [ function(require, module, exports) {
        function getRandomArray(n) {
            var res, next;
            if (n === 0) {
                return [];
            }
            if (n === 1) {
                return [ 0 ];
            }
            res = getRandomArray(n - 1);
            next = Math.floor(Math.random() * n);
            res.splice(next, 0, n - 1);
            return res;
        }
        module.exports.getRandomArray = getRandomArray;
        function defaultCompareKeysFunction(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            if (a === b) {
                return 0;
            }
            var err = new Error("Couldn't compare elements");
            err.a = a;
            err.b = b;
            throw err;
        }
        module.exports.defaultCompareKeysFunction = defaultCompareKeysFunction;
        function defaultCheckValueEquality(a, b) {
            return a === b;
        }
        module.exports.defaultCheckValueEquality = defaultCheckValueEquality;
    }, {} ],
    6: [ function(require, module, exports) {
        var objectCreate = Object.create || objectCreatePolyfill;
        var objectKeys = Object.keys || objectKeysPolyfill;
        var bind = Function.prototype.bind || functionBindPolyfill;
        function EventEmitter() {
            if (!this._events || !Object.prototype.hasOwnProperty.call(this, "_events")) {
                this._events = objectCreate(null);
                this._eventsCount = 0;
            }
            this._maxListeners = this._maxListeners || undefined;
        }
        module.exports = EventEmitter;
        EventEmitter.EventEmitter = EventEmitter;
        EventEmitter.prototype._events = undefined;
        EventEmitter.prototype._maxListeners = undefined;
        var defaultMaxListeners = 10;
        var hasDefineProperty;
        try {
            var o = {};
            if (Object.defineProperty) Object.defineProperty(o, "x", {
                value: 0
            });
            hasDefineProperty = o.x === 0;
        } catch (err) {
            hasDefineProperty = false;
        }
        if (hasDefineProperty) {
            Object.defineProperty(EventEmitter, "defaultMaxListeners", {
                enumerable: true,
                get: function() {
                    return defaultMaxListeners;
                },
                set: function(arg) {
                    if (typeof arg !== "number" || arg < 0 || arg !== arg) throw new TypeError('"defaultMaxListeners" must be a positive number');
                    defaultMaxListeners = arg;
                }
            });
        } else {
            EventEmitter.defaultMaxListeners = defaultMaxListeners;
        }
        EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
            if (typeof n !== "number" || n < 0 || isNaN(n)) throw new TypeError('"n" argument must be a positive number');
            this._maxListeners = n;
            return this;
        };
        function $getMaxListeners(that) {
            if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
            return that._maxListeners;
        }
        EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
            return $getMaxListeners(this);
        };
        function emitNone(handler, isFn, self) {
            if (isFn) handler.call(self); else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i) listeners[i].call(self);
            }
        }
        function emitOne(handler, isFn, self, arg1) {
            if (isFn) handler.call(self, arg1); else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i) listeners[i].call(self, arg1);
            }
        }
        function emitTwo(handler, isFn, self, arg1, arg2) {
            if (isFn) handler.call(self, arg1, arg2); else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2);
            }
        }
        function emitThree(handler, isFn, self, arg1, arg2, arg3) {
            if (isFn) handler.call(self, arg1, arg2, arg3); else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2, arg3);
            }
        }
        function emitMany(handler, isFn, self, args) {
            if (isFn) handler.apply(self, args); else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i) listeners[i].apply(self, args);
            }
        }
        EventEmitter.prototype.emit = function emit(type) {
            var er, handler, len, args, i, events;
            var doError = type === "error";
            events = this._events;
            if (events) doError = doError && events.error == null; else if (!doError) return false;
            if (doError) {
                if (arguments.length > 1) er = arguments[1];
                if (er instanceof Error) {
                    throw er;
                } else {
                    var err = new Error('Unhandled "error" event. (' + er + ")");
                    err.context = er;
                    throw err;
                }
                return false;
            }
            handler = events[type];
            if (!handler) return false;
            var isFn = typeof handler === "function";
            len = arguments.length;
            switch (len) {
              case 1:
                emitNone(handler, isFn, this);
                break;

              case 2:
                emitOne(handler, isFn, this, arguments[1]);
                break;

              case 3:
                emitTwo(handler, isFn, this, arguments[1], arguments[2]);
                break;

              case 4:
                emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
                break;

              default:
                args = new Array(len - 1);
                for (i = 1; i < len; i++) args[i - 1] = arguments[i];
                emitMany(handler, isFn, this, args);
            }
            return true;
        };
        function _addListener(target, type, listener, prepend) {
            var m;
            var events;
            var existing;
            if (typeof listener !== "function") throw new TypeError('"listener" argument must be a function');
            events = target._events;
            if (!events) {
                events = target._events = objectCreate(null);
                target._eventsCount = 0;
            } else {
                if (events.newListener) {
                    target.emit("newListener", type, listener.listener ? listener.listener : listener);
                    events = target._events;
                }
                existing = events[type];
            }
            if (!existing) {
                existing = events[type] = listener;
                ++target._eventsCount;
            } else {
                if (typeof existing === "function") {
                    existing = events[type] = prepend ? [ listener, existing ] : [ existing, listener ];
                } else {
                    if (prepend) {
                        existing.unshift(listener);
                    } else {
                        existing.push(listener);
                    }
                }
                if (!existing.warned) {
                    m = $getMaxListeners(target);
                    if (m && m > 0 && existing.length > m) {
                        existing.warned = true;
                        var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + ' "' + String(type) + '" listeners ' + "added. Use emitter.setMaxListeners() to " + "increase limit.");
                        w.name = "MaxListenersExceededWarning";
                        w.emitter = target;
                        w.type = type;
                        w.count = existing.length;
                        if (typeof console === "object" && console.warn) {
                            console.warn("%s: %s", w.name, w.message);
                        }
                    }
                }
            }
            return target;
        }
        EventEmitter.prototype.addListener = function addListener(type, listener) {
            return _addListener(this, type, listener, false);
        };
        EventEmitter.prototype.on = EventEmitter.prototype.addListener;
        EventEmitter.prototype.prependListener = function prependListener(type, listener) {
            return _addListener(this, type, listener, true);
        };
        function onceWrapper() {
            if (!this.fired) {
                this.target.removeListener(this.type, this.wrapFn);
                this.fired = true;
                switch (arguments.length) {
                  case 0:
                    return this.listener.call(this.target);

                  case 1:
                    return this.listener.call(this.target, arguments[0]);

                  case 2:
                    return this.listener.call(this.target, arguments[0], arguments[1]);

                  case 3:
                    return this.listener.call(this.target, arguments[0], arguments[1], arguments[2]);

                  default:
                    var args = new Array(arguments.length);
                    for (var i = 0; i < args.length; ++i) args[i] = arguments[i];
                    this.listener.apply(this.target, args);
                }
            }
        }
        function _onceWrap(target, type, listener) {
            var state = {
                fired: false,
                wrapFn: undefined,
                target: target,
                type: type,
                listener: listener
            };
            var wrapped = bind.call(onceWrapper, state);
            wrapped.listener = listener;
            state.wrapFn = wrapped;
            return wrapped;
        }
        EventEmitter.prototype.once = function once(type, listener) {
            if (typeof listener !== "function") throw new TypeError('"listener" argument must be a function');
            this.on(type, _onceWrap(this, type, listener));
            return this;
        };
        EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
            if (typeof listener !== "function") throw new TypeError('"listener" argument must be a function');
            this.prependListener(type, _onceWrap(this, type, listener));
            return this;
        };
        EventEmitter.prototype.removeListener = function removeListener(type, listener) {
            var list, events, position, i, originalListener;
            if (typeof listener !== "function") throw new TypeError('"listener" argument must be a function');
            events = this._events;
            if (!events) return this;
            list = events[type];
            if (!list) return this;
            if (list === listener || list.listener === listener) {
                if (--this._eventsCount === 0) this._events = objectCreate(null); else {
                    delete events[type];
                    if (events.removeListener) this.emit("removeListener", type, list.listener || listener);
                }
            } else if (typeof list !== "function") {
                position = -1;
                for (i = list.length - 1; i >= 0; i--) {
                    if (list[i] === listener || list[i].listener === listener) {
                        originalListener = list[i].listener;
                        position = i;
                        break;
                    }
                }
                if (position < 0) return this;
                if (position === 0) list.shift(); else spliceOne(list, position);
                if (list.length === 1) events[type] = list[0];
                if (events.removeListener) this.emit("removeListener", type, originalListener || listener);
            }
            return this;
        };
        EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
            var listeners, events, i;
            events = this._events;
            if (!events) return this;
            if (!events.removeListener) {
                if (arguments.length === 0) {
                    this._events = objectCreate(null);
                    this._eventsCount = 0;
                } else if (events[type]) {
                    if (--this._eventsCount === 0) this._events = objectCreate(null); else delete events[type];
                }
                return this;
            }
            if (arguments.length === 0) {
                var keys = objectKeys(events);
                var key;
                for (i = 0; i < keys.length; ++i) {
                    key = keys[i];
                    if (key === "removeListener") continue;
                    this.removeAllListeners(key);
                }
                this.removeAllListeners("removeListener");
                this._events = objectCreate(null);
                this._eventsCount = 0;
                return this;
            }
            listeners = events[type];
            if (typeof listeners === "function") {
                this.removeListener(type, listeners);
            } else if (listeners) {
                for (i = listeners.length - 1; i >= 0; i--) {
                    this.removeListener(type, listeners[i]);
                }
            }
            return this;
        };
        EventEmitter.prototype.listeners = function listeners(type) {
            var evlistener;
            var ret;
            var events = this._events;
            if (!events) ret = []; else {
                evlistener = events[type];
                if (!evlistener) ret = []; else if (typeof evlistener === "function") ret = [ evlistener.listener || evlistener ]; else ret = unwrapListeners(evlistener);
            }
            return ret;
        };
        EventEmitter.listenerCount = function(emitter, type) {
            if (typeof emitter.listenerCount === "function") {
                return emitter.listenerCount(type);
            } else {
                return listenerCount.call(emitter, type);
            }
        };
        EventEmitter.prototype.listenerCount = listenerCount;
        function listenerCount(type) {
            var events = this._events;
            if (events) {
                var evlistener = events[type];
                if (typeof evlistener === "function") {
                    return 1;
                } else if (evlistener) {
                    return evlistener.length;
                }
            }
            return 0;
        }
        EventEmitter.prototype.eventNames = function eventNames() {
            return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
        };
        function spliceOne(list, index) {
            for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) list[i] = list[k];
            list.pop();
        }
        function arrayClone(arr, n) {
            var copy = new Array(n);
            for (var i = 0; i < n; ++i) copy[i] = arr[i];
            return copy;
        }
        function unwrapListeners(arr) {
            var ret = new Array(arr.length);
            for (var i = 0; i < ret.length; ++i) {
                ret[i] = arr[i].listener || arr[i];
            }
            return ret;
        }
        function objectCreatePolyfill(proto) {
            var F = function() {};
            F.prototype = proto;
            return new F();
        }
        function objectKeysPolyfill(obj) {
            var keys = [];
            for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
                keys.push(k);
            }
            return k;
        }
        function functionBindPolyfill(context) {
            var fn = this;
            return function() {
                return fn.apply(context, arguments);
            };
        }
    }, {} ],
    7: [ function(require, module, exports) {
        (function(global) {
            (function(f) {
                if (typeof exports === "object" && typeof module !== "undefined") {
                    module.exports = f();
                } else if (typeof define === "function" && define.amd) {
                    define([], f);
                } else {
                    var g;
                    if (typeof window !== "undefined") {
                        g = window;
                    } else if (typeof global !== "undefined") {
                        g = global;
                    } else if (typeof self !== "undefined") {
                        g = self;
                    } else {
                        g = this;
                    }
                    g.localforage = f();
                }
            })(function() {
                var define, module, exports;
                return function e(t, n, r) {
                    function s(o, u) {
                        if (!n[o]) {
                            if (!t[o]) {
                                var a = typeof require == "function" && require;
                                if (!u && a) return a(o, !0);
                                if (i) return i(o, !0);
                                var f = new Error("Cannot find module '" + o + "'");
                                throw f.code = "MODULE_NOT_FOUND", f;
                            }
                            var l = n[o] = {
                                exports: {}
                            };
                            t[o][0].call(l.exports, function(e) {
                                var n = t[o][1][e];
                                return s(n ? n : e);
                            }, l, l.exports, e, t, n, r);
                        }
                        return n[o].exports;
                    }
                    var i = typeof require == "function" && require;
                    for (var o = 0; o < r.length; o++) s(r[o]);
                    return s;
                }({
                    1: [ function(_dereq_, module, exports) {
                        (function(global) {
                            "use strict";
                            var Mutation = global.MutationObserver || global.WebKitMutationObserver;
                            var scheduleDrain;
                            {
                                if (Mutation) {
                                    var called = 0;
                                    var observer = new Mutation(nextTick);
                                    var element = global.document.createTextNode("");
                                    observer.observe(element, {
                                        characterData: true
                                    });
                                    scheduleDrain = function() {
                                        element.data = called = ++called % 2;
                                    };
                                } else if (!global.setImmediate && typeof global.MessageChannel !== "undefined") {
                                    var channel = new global.MessageChannel();
                                    channel.port1.onmessage = nextTick;
                                    scheduleDrain = function() {
                                        channel.port2.postMessage(0);
                                    };
                                } else if ("document" in global && "onreadystatechange" in global.document.createElement("script")) {
                                    scheduleDrain = function() {
                                        var scriptEl = global.document.createElement("script");
                                        scriptEl.onreadystatechange = function() {
                                            nextTick();
                                            scriptEl.onreadystatechange = null;
                                            scriptEl.parentNode.removeChild(scriptEl);
                                            scriptEl = null;
                                        };
                                        global.document.documentElement.appendChild(scriptEl);
                                    };
                                } else {
                                    scheduleDrain = function() {
                                        setTimeout(nextTick, 0);
                                    };
                                }
                            }
                            var draining;
                            var queue = [];
                            function nextTick() {
                                draining = true;
                                var i, oldQueue;
                                var len = queue.length;
                                while (len) {
                                    oldQueue = queue;
                                    queue = [];
                                    i = -1;
                                    while (++i < len) {
                                        oldQueue[i]();
                                    }
                                    len = queue.length;
                                }
                                draining = false;
                            }
                            module.exports = immediate;
                            function immediate(task) {
                                if (queue.push(task) === 1 && !draining) {
                                    scheduleDrain();
                                }
                            }
                        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
                    }, {} ],
                    2: [ function(_dereq_, module, exports) {
                        "use strict";
                        var immediate = _dereq_(1);
                        function INTERNAL() {}
                        var handlers = {};
                        var REJECTED = [ "REJECTED" ];
                        var FULFILLED = [ "FULFILLED" ];
                        var PENDING = [ "PENDING" ];
                        module.exports = Promise;
                        function Promise(resolver) {
                            if (typeof resolver !== "function") {
                                throw new TypeError("resolver must be a function");
                            }
                            this.state = PENDING;
                            this.queue = [];
                            this.outcome = void 0;
                            if (resolver !== INTERNAL) {
                                safelyResolveThenable(this, resolver);
                            }
                        }
                        Promise.prototype["catch"] = function(onRejected) {
                            return this.then(null, onRejected);
                        };
                        Promise.prototype.then = function(onFulfilled, onRejected) {
                            if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) {
                                return this;
                            }
                            var promise = new this.constructor(INTERNAL);
                            if (this.state !== PENDING) {
                                var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
                                unwrap(promise, resolver, this.outcome);
                            } else {
                                this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
                            }
                            return promise;
                        };
                        function QueueItem(promise, onFulfilled, onRejected) {
                            this.promise = promise;
                            if (typeof onFulfilled === "function") {
                                this.onFulfilled = onFulfilled;
                                this.callFulfilled = this.otherCallFulfilled;
                            }
                            if (typeof onRejected === "function") {
                                this.onRejected = onRejected;
                                this.callRejected = this.otherCallRejected;
                            }
                        }
                        QueueItem.prototype.callFulfilled = function(value) {
                            handlers.resolve(this.promise, value);
                        };
                        QueueItem.prototype.otherCallFulfilled = function(value) {
                            unwrap(this.promise, this.onFulfilled, value);
                        };
                        QueueItem.prototype.callRejected = function(value) {
                            handlers.reject(this.promise, value);
                        };
                        QueueItem.prototype.otherCallRejected = function(value) {
                            unwrap(this.promise, this.onRejected, value);
                        };
                        function unwrap(promise, func, value) {
                            immediate(function() {
                                var returnValue;
                                try {
                                    returnValue = func(value);
                                } catch (e) {
                                    return handlers.reject(promise, e);
                                }
                                if (returnValue === promise) {
                                    handlers.reject(promise, new TypeError("Cannot resolve promise with itself"));
                                } else {
                                    handlers.resolve(promise, returnValue);
                                }
                            });
                        }
                        handlers.resolve = function(self, value) {
                            var result = tryCatch(getThen, value);
                            if (result.status === "error") {
                                return handlers.reject(self, result.value);
                            }
                            var thenable = result.value;
                            if (thenable) {
                                safelyResolveThenable(self, thenable);
                            } else {
                                self.state = FULFILLED;
                                self.outcome = value;
                                var i = -1;
                                var len = self.queue.length;
                                while (++i < len) {
                                    self.queue[i].callFulfilled(value);
                                }
                            }
                            return self;
                        };
                        handlers.reject = function(self, error) {
                            self.state = REJECTED;
                            self.outcome = error;
                            var i = -1;
                            var len = self.queue.length;
                            while (++i < len) {
                                self.queue[i].callRejected(error);
                            }
                            return self;
                        };
                        function getThen(obj) {
                            var then = obj && obj.then;
                            if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") {
                                return function appyThen() {
                                    then.apply(obj, arguments);
                                };
                            }
                        }
                        function safelyResolveThenable(self, thenable) {
                            var called = false;
                            function onError(value) {
                                if (called) {
                                    return;
                                }
                                called = true;
                                handlers.reject(self, value);
                            }
                            function onSuccess(value) {
                                if (called) {
                                    return;
                                }
                                called = true;
                                handlers.resolve(self, value);
                            }
                            function tryToUnwrap() {
                                thenable(onSuccess, onError);
                            }
                            var result = tryCatch(tryToUnwrap);
                            if (result.status === "error") {
                                onError(result.value);
                            }
                        }
                        function tryCatch(func, value) {
                            var out = {};
                            try {
                                out.value = func(value);
                                out.status = "success";
                            } catch (e) {
                                out.status = "error";
                                out.value = e;
                            }
                            return out;
                        }
                        Promise.resolve = resolve;
                        function resolve(value) {
                            if (value instanceof this) {
                                return value;
                            }
                            return handlers.resolve(new this(INTERNAL), value);
                        }
                        Promise.reject = reject;
                        function reject(reason) {
                            var promise = new this(INTERNAL);
                            return handlers.reject(promise, reason);
                        }
                        Promise.all = all;
                        function all(iterable) {
                            var self = this;
                            if (Object.prototype.toString.call(iterable) !== "[object Array]") {
                                return this.reject(new TypeError("must be an array"));
                            }
                            var len = iterable.length;
                            var called = false;
                            if (!len) {
                                return this.resolve([]);
                            }
                            var values = new Array(len);
                            var resolved = 0;
                            var i = -1;
                            var promise = new this(INTERNAL);
                            while (++i < len) {
                                allResolver(iterable[i], i);
                            }
                            return promise;
                            function allResolver(value, i) {
                                self.resolve(value).then(resolveFromAll, function(error) {
                                    if (!called) {
                                        called = true;
                                        handlers.reject(promise, error);
                                    }
                                });
                                function resolveFromAll(outValue) {
                                    values[i] = outValue;
                                    if (++resolved === len && !called) {
                                        called = true;
                                        handlers.resolve(promise, values);
                                    }
                                }
                            }
                        }
                        Promise.race = race;
                        function race(iterable) {
                            var self = this;
                            if (Object.prototype.toString.call(iterable) !== "[object Array]") {
                                return this.reject(new TypeError("must be an array"));
                            }
                            var len = iterable.length;
                            var called = false;
                            if (!len) {
                                return this.resolve([]);
                            }
                            var i = -1;
                            var promise = new this(INTERNAL);
                            while (++i < len) {
                                resolver(iterable[i]);
                            }
                            return promise;
                            function resolver(value) {
                                self.resolve(value).then(function(response) {
                                    if (!called) {
                                        called = true;
                                        handlers.resolve(promise, response);
                                    }
                                }, function(error) {
                                    if (!called) {
                                        called = true;
                                        handlers.reject(promise, error);
                                    }
                                });
                            }
                        }
                    }, {
                        1: 1
                    } ],
                    3: [ function(_dereq_, module, exports) {
                        (function(global) {
                            "use strict";
                            if (typeof global.Promise !== "function") {
                                global.Promise = _dereq_(2);
                            }
                        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
                    }, {
                        2: 2
                    } ],
                    4: [ function(_dereq_, module, exports) {
                        "use strict";
                        var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
                            return typeof obj;
                        } : function(obj) {
                            return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
                        };
                        function _classCallCheck(instance, Constructor) {
                            if (!(instance instanceof Constructor)) {
                                throw new TypeError("Cannot call a class as a function");
                            }
                        }
                        function getIDB() {
                            try {
                                if (typeof indexedDB !== "undefined") {
                                    return indexedDB;
                                }
                                if (typeof webkitIndexedDB !== "undefined") {
                                    return webkitIndexedDB;
                                }
                                if (typeof mozIndexedDB !== "undefined") {
                                    return mozIndexedDB;
                                }
                                if (typeof OIndexedDB !== "undefined") {
                                    return OIndexedDB;
                                }
                                if (typeof msIndexedDB !== "undefined") {
                                    return msIndexedDB;
                                }
                            } catch (e) {
                                return;
                            }
                        }
                        var idb = getIDB();
                        function isIndexedDBValid() {
                            try {
                                if (!idb) {
                                    return false;
                                }
                                var isSafari = typeof openDatabase !== "undefined" && /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/BlackBerry/.test(navigator.platform);
                                var hasFetch = typeof fetch === "function" && fetch.toString().indexOf("[native code") !== -1;
                                return (!isSafari || hasFetch) && typeof indexedDB !== "undefined" && typeof IDBKeyRange !== "undefined";
                            } catch (e) {
                                return false;
                            }
                        }
                        function createBlob(parts, properties) {
                            parts = parts || [];
                            properties = properties || {};
                            try {
                                return new Blob(parts, properties);
                            } catch (e) {
                                if (e.name !== "TypeError") {
                                    throw e;
                                }
                                var Builder = typeof BlobBuilder !== "undefined" ? BlobBuilder : typeof MSBlobBuilder !== "undefined" ? MSBlobBuilder : typeof MozBlobBuilder !== "undefined" ? MozBlobBuilder : WebKitBlobBuilder;
                                var builder = new Builder();
                                for (var i = 0; i < parts.length; i += 1) {
                                    builder.append(parts[i]);
                                }
                                return builder.getBlob(properties.type);
                            }
                        }
                        if (typeof Promise === "undefined") {
                            _dereq_(3);
                        }
                        var Promise$1 = Promise;
                        function executeCallback(promise, callback) {
                            if (callback) {
                                promise.then(function(result) {
                                    callback(null, result);
                                }, function(error) {
                                    callback(error);
                                });
                            }
                        }
                        function executeTwoCallbacks(promise, callback, errorCallback) {
                            if (typeof callback === "function") {
                                promise.then(callback);
                            }
                            if (typeof errorCallback === "function") {
                                promise["catch"](errorCallback);
                            }
                        }
                        function normalizeKey(key) {
                            if (typeof key !== "string") {
                                console.warn(key + " used as a key, but it is not a string.");
                                key = String(key);
                            }
                            return key;
                        }
                        function getCallback() {
                            if (arguments.length && typeof arguments[arguments.length - 1] === "function") {
                                return arguments[arguments.length - 1];
                            }
                        }
                        var DETECT_BLOB_SUPPORT_STORE = "local-forage-detect-blob-support";
                        var supportsBlobs = void 0;
                        var dbContexts = {};
                        var toString = Object.prototype.toString;
                        var READ_ONLY = "readonly";
                        var READ_WRITE = "readwrite";
                        function _binStringToArrayBuffer(bin) {
                            var length = bin.length;
                            var buf = new ArrayBuffer(length);
                            var arr = new Uint8Array(buf);
                            for (var i = 0; i < length; i++) {
                                arr[i] = bin.charCodeAt(i);
                            }
                            return buf;
                        }
                        function _checkBlobSupportWithoutCaching(idb) {
                            return new Promise$1(function(resolve) {
                                var txn = idb.transaction(DETECT_BLOB_SUPPORT_STORE, READ_WRITE);
                                var blob = createBlob([ "" ]);
                                txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, "key");
                                txn.onabort = function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    resolve(false);
                                };
                                txn.oncomplete = function() {
                                    var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
                                    var matchedEdge = navigator.userAgent.match(/Edge\//);
                                    resolve(matchedEdge || !matchedChrome || parseInt(matchedChrome[1], 10) >= 43);
                                };
                            })["catch"](function() {
                                return false;
                            });
                        }
                        function _checkBlobSupport(idb) {
                            if (typeof supportsBlobs === "boolean") {
                                return Promise$1.resolve(supportsBlobs);
                            }
                            return _checkBlobSupportWithoutCaching(idb).then(function(value) {
                                supportsBlobs = value;
                                return supportsBlobs;
                            });
                        }
                        function _deferReadiness(dbInfo) {
                            var dbContext = dbContexts[dbInfo.name];
                            var deferredOperation = {};
                            deferredOperation.promise = new Promise$1(function(resolve, reject) {
                                deferredOperation.resolve = resolve;
                                deferredOperation.reject = reject;
                            });
                            dbContext.deferredOperations.push(deferredOperation);
                            if (!dbContext.dbReady) {
                                dbContext.dbReady = deferredOperation.promise;
                            } else {
                                dbContext.dbReady = dbContext.dbReady.then(function() {
                                    return deferredOperation.promise;
                                });
                            }
                        }
                        function _advanceReadiness(dbInfo) {
                            var dbContext = dbContexts[dbInfo.name];
                            var deferredOperation = dbContext.deferredOperations.pop();
                            if (deferredOperation) {
                                deferredOperation.resolve();
                                return deferredOperation.promise;
                            }
                        }
                        function _rejectReadiness(dbInfo, err) {
                            var dbContext = dbContexts[dbInfo.name];
                            var deferredOperation = dbContext.deferredOperations.pop();
                            if (deferredOperation) {
                                deferredOperation.reject(err);
                                return deferredOperation.promise;
                            }
                        }
                        function _getConnection(dbInfo, upgradeNeeded) {
                            return new Promise$1(function(resolve, reject) {
                                dbContexts[dbInfo.name] = dbContexts[dbInfo.name] || createDbContext();
                                if (dbInfo.db) {
                                    if (upgradeNeeded) {
                                        _deferReadiness(dbInfo);
                                        dbInfo.db.close();
                                    } else {
                                        return resolve(dbInfo.db);
                                    }
                                }
                                var dbArgs = [ dbInfo.name ];
                                if (upgradeNeeded) {
                                    dbArgs.push(dbInfo.version);
                                }
                                var openreq = idb.open.apply(idb, dbArgs);
                                if (upgradeNeeded) {
                                    openreq.onupgradeneeded = function(e) {
                                        var db = openreq.result;
                                        try {
                                            db.createObjectStore(dbInfo.storeName);
                                            if (e.oldVersion <= 1) {
                                                db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
                                            }
                                        } catch (ex) {
                                            if (ex.name === "ConstraintError") {
                                                console.warn('The database "' + dbInfo.name + '"' + " has been upgraded from version " + e.oldVersion + " to version " + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
                                            } else {
                                                throw ex;
                                            }
                                        }
                                    };
                                }
                                openreq.onerror = function(e) {
                                    e.preventDefault();
                                    reject(openreq.error);
                                };
                                openreq.onsuccess = function() {
                                    resolve(openreq.result);
                                    _advanceReadiness(dbInfo);
                                };
                            });
                        }
                        function _getOriginalConnection(dbInfo) {
                            return _getConnection(dbInfo, false);
                        }
                        function _getUpgradedConnection(dbInfo) {
                            return _getConnection(dbInfo, true);
                        }
                        function _isUpgradeNeeded(dbInfo, defaultVersion) {
                            if (!dbInfo.db) {
                                return true;
                            }
                            var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
                            var isDowngrade = dbInfo.version < dbInfo.db.version;
                            var isUpgrade = dbInfo.version > dbInfo.db.version;
                            if (isDowngrade) {
                                if (dbInfo.version !== defaultVersion) {
                                    console.warn('The database "' + dbInfo.name + '"' + " can't be downgraded from version " + dbInfo.db.version + " to version " + dbInfo.version + ".");
                                }
                                dbInfo.version = dbInfo.db.version;
                            }
                            if (isUpgrade || isNewStore) {
                                if (isNewStore) {
                                    var incVersion = dbInfo.db.version + 1;
                                    if (incVersion > dbInfo.version) {
                                        dbInfo.version = incVersion;
                                    }
                                }
                                return true;
                            }
                            return false;
                        }
                        function _encodeBlob(blob) {
                            return new Promise$1(function(resolve, reject) {
                                var reader = new FileReader();
                                reader.onerror = reject;
                                reader.onloadend = function(e) {
                                    var base64 = btoa(e.target.result || "");
                                    resolve({
                                        __local_forage_encoded_blob: true,
                                        data: base64,
                                        type: blob.type
                                    });
                                };
                                reader.readAsBinaryString(blob);
                            });
                        }
                        function _decodeBlob(encodedBlob) {
                            var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
                            return createBlob([ arrayBuff ], {
                                type: encodedBlob.type
                            });
                        }
                        function _isEncodedBlob(value) {
                            return value && value.__local_forage_encoded_blob;
                        }
                        function _fullyReady(callback) {
                            var self = this;
                            var promise = self._initReady().then(function() {
                                var dbContext = dbContexts[self._dbInfo.name];
                                if (dbContext && dbContext.dbReady) {
                                    return dbContext.dbReady;
                                }
                            });
                            executeTwoCallbacks(promise, callback, callback);
                            return promise;
                        }
                        function _tryReconnect(dbInfo) {
                            _deferReadiness(dbInfo);
                            var dbContext = dbContexts[dbInfo.name];
                            var forages = dbContext.forages;
                            for (var i = 0; i < forages.length; i++) {
                                var forage = forages[i];
                                if (forage._dbInfo.db) {
                                    forage._dbInfo.db.close();
                                    forage._dbInfo.db = null;
                                }
                            }
                            dbInfo.db = null;
                            return _getOriginalConnection(dbInfo).then(function(db) {
                                dbInfo.db = db;
                                if (_isUpgradeNeeded(dbInfo)) {
                                    return _getUpgradedConnection(dbInfo);
                                }
                                return db;
                            }).then(function(db) {
                                dbInfo.db = dbContext.db = db;
                                for (var i = 0; i < forages.length; i++) {
                                    forages[i]._dbInfo.db = db;
                                }
                            })["catch"](function(err) {
                                _rejectReadiness(dbInfo, err);
                                throw err;
                            });
                        }
                        function createTransaction(dbInfo, mode, callback, retries) {
                            if (retries === undefined) {
                                retries = 1;
                            }
                            try {
                                var tx = dbInfo.db.transaction(dbInfo.storeName, mode);
                                callback(null, tx);
                            } catch (err) {
                                if (retries > 0 && (!dbInfo.db || err.name === "InvalidStateError" || err.name === "NotFoundError")) {
                                    return Promise$1.resolve().then(function() {
                                        if (!dbInfo.db || err.name === "NotFoundError" && !dbInfo.db.objectStoreNames.contains(dbInfo.storeName) && dbInfo.version <= dbInfo.db.version) {
                                            if (dbInfo.db) {
                                                dbInfo.version = dbInfo.db.version + 1;
                                            }
                                            return _getUpgradedConnection(dbInfo);
                                        }
                                    }).then(function() {
                                        return _tryReconnect(dbInfo).then(function() {
                                            createTransaction(dbInfo, mode, callback, retries - 1);
                                        });
                                    })["catch"](callback);
                                }
                                callback(err);
                            }
                        }
                        function createDbContext() {
                            return {
                                forages: [],
                                db: null,
                                dbReady: null,
                                deferredOperations: []
                            };
                        }
                        function _initStorage(options) {
                            var self = this;
                            var dbInfo = {
                                db: null
                            };
                            if (options) {
                                for (var i in options) {
                                    dbInfo[i] = options[i];
                                }
                            }
                            var dbContext = dbContexts[dbInfo.name];
                            if (!dbContext) {
                                dbContext = createDbContext();
                                dbContexts[dbInfo.name] = dbContext;
                            }
                            dbContext.forages.push(self);
                            if (!self._initReady) {
                                self._initReady = self.ready;
                                self.ready = _fullyReady;
                            }
                            var initPromises = [];
                            function ignoreErrors() {
                                return Promise$1.resolve();
                            }
                            for (var j = 0; j < dbContext.forages.length; j++) {
                                var forage = dbContext.forages[j];
                                if (forage !== self) {
                                    initPromises.push(forage._initReady()["catch"](ignoreErrors));
                                }
                            }
                            var forages = dbContext.forages.slice(0);
                            return Promise$1.all(initPromises).then(function() {
                                dbInfo.db = dbContext.db;
                                return _getOriginalConnection(dbInfo);
                            }).then(function(db) {
                                dbInfo.db = db;
                                if (_isUpgradeNeeded(dbInfo, self._defaultConfig.version)) {
                                    return _getUpgradedConnection(dbInfo);
                                }
                                return db;
                            }).then(function(db) {
                                dbInfo.db = dbContext.db = db;
                                self._dbInfo = dbInfo;
                                for (var k = 0; k < forages.length; k++) {
                                    var forage = forages[k];
                                    if (forage !== self) {
                                        forage._dbInfo.db = dbInfo.db;
                                        forage._dbInfo.version = dbInfo.version;
                                    }
                                }
                            });
                        }
                        function getItem(key, callback) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    createTransaction(self._dbInfo, READ_ONLY, function(err, transaction) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        try {
                                            var store = transaction.objectStore(self._dbInfo.storeName);
                                            var req = store.get(key);
                                            req.onsuccess = function() {
                                                var value = req.result;
                                                if (value === undefined) {
                                                    value = null;
                                                }
                                                if (_isEncodedBlob(value)) {
                                                    value = _decodeBlob(value);
                                                }
                                                resolve(value);
                                            };
                                            req.onerror = function() {
                                                reject(req.error);
                                            };
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function iterate(iterator, callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    createTransaction(self._dbInfo, READ_ONLY, function(err, transaction) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        try {
                                            var store = transaction.objectStore(self._dbInfo.storeName);
                                            var req = store.openCursor();
                                            var iterationNumber = 1;
                                            req.onsuccess = function() {
                                                var cursor = req.result;
                                                if (cursor) {
                                                    var value = cursor.value;
                                                    if (_isEncodedBlob(value)) {
                                                        value = _decodeBlob(value);
                                                    }
                                                    var result = iterator(value, cursor.key, iterationNumber++);
                                                    if (result !== void 0) {
                                                        resolve(result);
                                                    } else {
                                                        cursor["continue"]();
                                                    }
                                                } else {
                                                    resolve();
                                                }
                                            };
                                            req.onerror = function() {
                                                reject(req.error);
                                            };
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function setItem(key, value, callback) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = new Promise$1(function(resolve, reject) {
                                var dbInfo;
                                self.ready().then(function() {
                                    dbInfo = self._dbInfo;
                                    if (toString.call(value) === "[object Blob]") {
                                        return _checkBlobSupport(dbInfo.db).then(function(blobSupport) {
                                            if (blobSupport) {
                                                return value;
                                            }
                                            return _encodeBlob(value);
                                        });
                                    }
                                    return value;
                                }).then(function(value) {
                                    createTransaction(self._dbInfo, READ_WRITE, function(err, transaction) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        try {
                                            var store = transaction.objectStore(self._dbInfo.storeName);
                                            if (value === null) {
                                                value = undefined;
                                            }
                                            var req = store.put(value, key);
                                            transaction.oncomplete = function() {
                                                if (value === undefined) {
                                                    value = null;
                                                }
                                                resolve(value);
                                            };
                                            transaction.onabort = transaction.onerror = function() {
                                                var err = req.error ? req.error : req.transaction.error;
                                                reject(err);
                                            };
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function removeItem(key, callback) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    createTransaction(self._dbInfo, READ_WRITE, function(err, transaction) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        try {
                                            var store = transaction.objectStore(self._dbInfo.storeName);
                                            var req = store["delete"](key);
                                            transaction.oncomplete = function() {
                                                resolve();
                                            };
                                            transaction.onerror = function() {
                                                reject(req.error);
                                            };
                                            transaction.onabort = function() {
                                                var err = req.error ? req.error : req.transaction.error;
                                                reject(err);
                                            };
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function clear(callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    createTransaction(self._dbInfo, READ_WRITE, function(err, transaction) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        try {
                                            var store = transaction.objectStore(self._dbInfo.storeName);
                                            var req = store.clear();
                                            transaction.oncomplete = function() {
                                                resolve();
                                            };
                                            transaction.onabort = transaction.onerror = function() {
                                                var err = req.error ? req.error : req.transaction.error;
                                                reject(err);
                                            };
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function length(callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    createTransaction(self._dbInfo, READ_ONLY, function(err, transaction) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        try {
                                            var store = transaction.objectStore(self._dbInfo.storeName);
                                            var req = store.count();
                                            req.onsuccess = function() {
                                                resolve(req.result);
                                            };
                                            req.onerror = function() {
                                                reject(req.error);
                                            };
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function key(n, callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                if (n < 0) {
                                    resolve(null);
                                    return;
                                }
                                self.ready().then(function() {
                                    createTransaction(self._dbInfo, READ_ONLY, function(err, transaction) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        try {
                                            var store = transaction.objectStore(self._dbInfo.storeName);
                                            var advanced = false;
                                            var req = store.openCursor();
                                            req.onsuccess = function() {
                                                var cursor = req.result;
                                                if (!cursor) {
                                                    resolve(null);
                                                    return;
                                                }
                                                if (n === 0) {
                                                    resolve(cursor.key);
                                                } else {
                                                    if (!advanced) {
                                                        advanced = true;
                                                        cursor.advance(n);
                                                    } else {
                                                        resolve(cursor.key);
                                                    }
                                                }
                                            };
                                            req.onerror = function() {
                                                reject(req.error);
                                            };
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function keys(callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    createTransaction(self._dbInfo, READ_ONLY, function(err, transaction) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        try {
                                            var store = transaction.objectStore(self._dbInfo.storeName);
                                            var req = store.openCursor();
                                            var keys = [];
                                            req.onsuccess = function() {
                                                var cursor = req.result;
                                                if (!cursor) {
                                                    resolve(keys);
                                                    return;
                                                }
                                                keys.push(cursor.key);
                                                cursor["continue"]();
                                            };
                                            req.onerror = function() {
                                                reject(req.error);
                                            };
                                        } catch (e) {
                                            reject(e);
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function dropInstance(options, callback) {
                            callback = getCallback.apply(this, arguments);
                            var currentConfig = this.config();
                            options = typeof options !== "function" && options || {};
                            if (!options.name) {
                                options.name = options.name || currentConfig.name;
                                options.storeName = options.storeName || currentConfig.storeName;
                            }
                            var self = this;
                            var promise;
                            if (!options.name) {
                                promise = Promise$1.reject("Invalid arguments");
                            } else {
                                var isCurrentDb = options.name === currentConfig.name && self._dbInfo.db;
                                var dbPromise = isCurrentDb ? Promise$1.resolve(self._dbInfo.db) : _getOriginalConnection(options).then(function(db) {
                                    var dbContext = dbContexts[options.name];
                                    var forages = dbContext.forages;
                                    dbContext.db = db;
                                    for (var i = 0; i < forages.length; i++) {
                                        forages[i]._dbInfo.db = db;
                                    }
                                    return db;
                                });
                                if (!options.storeName) {
                                    promise = dbPromise.then(function(db) {
                                        _deferReadiness(options);
                                        var dbContext = dbContexts[options.name];
                                        var forages = dbContext.forages;
                                        db.close();
                                        for (var i = 0; i < forages.length; i++) {
                                            var forage = forages[i];
                                            forage._dbInfo.db = null;
                                        }
                                        var dropDBPromise = new Promise$1(function(resolve, reject) {
                                            var req = idb.deleteDatabase(options.name);
                                            req.onerror = req.onblocked = function(err) {
                                                var db = req.result;
                                                if (db) {
                                                    db.close();
                                                }
                                                reject(err);
                                            };
                                            req.onsuccess = function() {
                                                var db = req.result;
                                                if (db) {
                                                    db.close();
                                                }
                                                resolve(db);
                                            };
                                        });
                                        return dropDBPromise.then(function(db) {
                                            dbContext.db = db;
                                            for (var i = 0; i < forages.length; i++) {
                                                var _forage = forages[i];
                                                _advanceReadiness(_forage._dbInfo);
                                            }
                                        })["catch"](function(err) {
                                            (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function() {});
                                            throw err;
                                        });
                                    });
                                } else {
                                    promise = dbPromise.then(function(db) {
                                        if (!db.objectStoreNames.contains(options.storeName)) {
                                            return;
                                        }
                                        var newVersion = db.version + 1;
                                        _deferReadiness(options);
                                        var dbContext = dbContexts[options.name];
                                        var forages = dbContext.forages;
                                        db.close();
                                        for (var i = 0; i < forages.length; i++) {
                                            var forage = forages[i];
                                            forage._dbInfo.db = null;
                                            forage._dbInfo.version = newVersion;
                                        }
                                        var dropObjectPromise = new Promise$1(function(resolve, reject) {
                                            var req = idb.open(options.name, newVersion);
                                            req.onerror = function(err) {
                                                var db = req.result;
                                                db.close();
                                                reject(err);
                                            };
                                            req.onupgradeneeded = function() {
                                                var db = req.result;
                                                db.deleteObjectStore(options.storeName);
                                            };
                                            req.onsuccess = function() {
                                                var db = req.result;
                                                db.close();
                                                resolve(db);
                                            };
                                        });
                                        return dropObjectPromise.then(function(db) {
                                            dbContext.db = db;
                                            for (var j = 0; j < forages.length; j++) {
                                                var _forage2 = forages[j];
                                                _forage2._dbInfo.db = db;
                                                _advanceReadiness(_forage2._dbInfo);
                                            }
                                        })["catch"](function(err) {
                                            (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function() {});
                                            throw err;
                                        });
                                    });
                                }
                            }
                            executeCallback(promise, callback);
                            return promise;
                        }
                        var asyncStorage = {
                            _driver: "asyncStorage",
                            _initStorage: _initStorage,
                            _support: isIndexedDBValid(),
                            iterate: iterate,
                            getItem: getItem,
                            setItem: setItem,
                            removeItem: removeItem,
                            clear: clear,
                            length: length,
                            key: key,
                            keys: keys,
                            dropInstance: dropInstance
                        };
                        function isWebSQLValid() {
                            return typeof openDatabase === "function";
                        }
                        var BASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                        var BLOB_TYPE_PREFIX = "~~local_forage_type~";
                        var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;
                        var SERIALIZED_MARKER = "__lfsc__:";
                        var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;
                        var TYPE_ARRAYBUFFER = "arbf";
                        var TYPE_BLOB = "blob";
                        var TYPE_INT8ARRAY = "si08";
                        var TYPE_UINT8ARRAY = "ui08";
                        var TYPE_UINT8CLAMPEDARRAY = "uic8";
                        var TYPE_INT16ARRAY = "si16";
                        var TYPE_INT32ARRAY = "si32";
                        var TYPE_UINT16ARRAY = "ur16";
                        var TYPE_UINT32ARRAY = "ui32";
                        var TYPE_FLOAT32ARRAY = "fl32";
                        var TYPE_FLOAT64ARRAY = "fl64";
                        var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;
                        var toString$1 = Object.prototype.toString;
                        function stringToBuffer(serializedString) {
                            var bufferLength = serializedString.length * .75;
                            var len = serializedString.length;
                            var i;
                            var p = 0;
                            var encoded1, encoded2, encoded3, encoded4;
                            if (serializedString[serializedString.length - 1] === "=") {
                                bufferLength--;
                                if (serializedString[serializedString.length - 2] === "=") {
                                    bufferLength--;
                                }
                            }
                            var buffer = new ArrayBuffer(bufferLength);
                            var bytes = new Uint8Array(buffer);
                            for (i = 0; i < len; i += 4) {
                                encoded1 = BASE_CHARS.indexOf(serializedString[i]);
                                encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
                                encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
                                encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);
                                bytes[p++] = encoded1 << 2 | encoded2 >> 4;
                                bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
                                bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
                            }
                            return buffer;
                        }
                        function bufferToString(buffer) {
                            var bytes = new Uint8Array(buffer);
                            var base64String = "";
                            var i;
                            for (i = 0; i < bytes.length; i += 3) {
                                base64String += BASE_CHARS[bytes[i] >> 2];
                                base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
                                base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
                                base64String += BASE_CHARS[bytes[i + 2] & 63];
                            }
                            if (bytes.length % 3 === 2) {
                                base64String = base64String.substring(0, base64String.length - 1) + "=";
                            } else if (bytes.length % 3 === 1) {
                                base64String = base64String.substring(0, base64String.length - 2) + "==";
                            }
                            return base64String;
                        }
                        function serialize(value, callback) {
                            var valueType = "";
                            if (value) {
                                valueType = toString$1.call(value);
                            }
                            if (value && (valueType === "[object ArrayBuffer]" || value.buffer && toString$1.call(value.buffer) === "[object ArrayBuffer]")) {
                                var buffer;
                                var marker = SERIALIZED_MARKER;
                                if (value instanceof ArrayBuffer) {
                                    buffer = value;
                                    marker += TYPE_ARRAYBUFFER;
                                } else {
                                    buffer = value.buffer;
                                    if (valueType === "[object Int8Array]") {
                                        marker += TYPE_INT8ARRAY;
                                    } else if (valueType === "[object Uint8Array]") {
                                        marker += TYPE_UINT8ARRAY;
                                    } else if (valueType === "[object Uint8ClampedArray]") {
                                        marker += TYPE_UINT8CLAMPEDARRAY;
                                    } else if (valueType === "[object Int16Array]") {
                                        marker += TYPE_INT16ARRAY;
                                    } else if (valueType === "[object Uint16Array]") {
                                        marker += TYPE_UINT16ARRAY;
                                    } else if (valueType === "[object Int32Array]") {
                                        marker += TYPE_INT32ARRAY;
                                    } else if (valueType === "[object Uint32Array]") {
                                        marker += TYPE_UINT32ARRAY;
                                    } else if (valueType === "[object Float32Array]") {
                                        marker += TYPE_FLOAT32ARRAY;
                                    } else if (valueType === "[object Float64Array]") {
                                        marker += TYPE_FLOAT64ARRAY;
                                    } else {
                                        callback(new Error("Failed to get type for BinaryArray"));
                                    }
                                }
                                callback(marker + bufferToString(buffer));
                            } else if (valueType === "[object Blob]") {
                                var fileReader = new FileReader();
                                fileReader.onload = function() {
                                    var str = BLOB_TYPE_PREFIX + value.type + "~" + bufferToString(this.result);
                                    callback(SERIALIZED_MARKER + TYPE_BLOB + str);
                                };
                                fileReader.readAsArrayBuffer(value);
                            } else {
                                try {
                                    callback(JSON.stringify(value));
                                } catch (e) {
                                    console.error("Couldn't convert value into a JSON string: ", value);
                                    callback(null, e);
                                }
                            }
                        }
                        function deserialize(value) {
                            if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
                                return JSON.parse(value);
                            }
                            var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
                            var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);
                            var blobType;
                            if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
                                var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
                                blobType = matcher[1];
                                serializedString = serializedString.substring(matcher[0].length);
                            }
                            var buffer = stringToBuffer(serializedString);
                            switch (type) {
                              case TYPE_ARRAYBUFFER:
                                return buffer;

                              case TYPE_BLOB:
                                return createBlob([ buffer ], {
                                    type: blobType
                                });

                              case TYPE_INT8ARRAY:
                                return new Int8Array(buffer);

                              case TYPE_UINT8ARRAY:
                                return new Uint8Array(buffer);

                              case TYPE_UINT8CLAMPEDARRAY:
                                return new Uint8ClampedArray(buffer);

                              case TYPE_INT16ARRAY:
                                return new Int16Array(buffer);

                              case TYPE_UINT16ARRAY:
                                return new Uint16Array(buffer);

                              case TYPE_INT32ARRAY:
                                return new Int32Array(buffer);

                              case TYPE_UINT32ARRAY:
                                return new Uint32Array(buffer);

                              case TYPE_FLOAT32ARRAY:
                                return new Float32Array(buffer);

                              case TYPE_FLOAT64ARRAY:
                                return new Float64Array(buffer);

                              default:
                                throw new Error("Unkown type: " + type);
                            }
                        }
                        var localforageSerializer = {
                            serialize: serialize,
                            deserialize: deserialize,
                            stringToBuffer: stringToBuffer,
                            bufferToString: bufferToString
                        };
                        function createDbTable(t, dbInfo, callback, errorCallback) {
                            t.executeSql("CREATE TABLE IF NOT EXISTS " + dbInfo.storeName + " " + "(id INTEGER PRIMARY KEY, key unique, value)", [], callback, errorCallback);
                        }
                        function _initStorage$1(options) {
                            var self = this;
                            var dbInfo = {
                                db: null
                            };
                            if (options) {
                                for (var i in options) {
                                    dbInfo[i] = typeof options[i] !== "string" ? options[i].toString() : options[i];
                                }
                            }
                            var dbInfoPromise = new Promise$1(function(resolve, reject) {
                                try {
                                    dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
                                } catch (e) {
                                    return reject(e);
                                }
                                dbInfo.db.transaction(function(t) {
                                    createDbTable(t, dbInfo, function() {
                                        self._dbInfo = dbInfo;
                                        resolve();
                                    }, function(t, error) {
                                        reject(error);
                                    });
                                }, reject);
                            });
                            dbInfo.serializer = localforageSerializer;
                            return dbInfoPromise;
                        }
                        function tryExecuteSql(t, dbInfo, sqlStatement, args, callback, errorCallback) {
                            t.executeSql(sqlStatement, args, callback, function(t, error) {
                                if (error.code === error.SYNTAX_ERR) {
                                    t.executeSql("SELECT name FROM sqlite_master " + "WHERE type='table' AND name = ?", [ name ], function(t, results) {
                                        if (!results.rows.length) {
                                            createDbTable(t, dbInfo, function() {
                                                t.executeSql(sqlStatement, args, callback, errorCallback);
                                            }, errorCallback);
                                        } else {
                                            errorCallback(t, error);
                                        }
                                    }, errorCallback);
                                } else {
                                    errorCallback(t, error);
                                }
                            }, errorCallback);
                        }
                        function getItem$1(key, callback) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    var dbInfo = self._dbInfo;
                                    dbInfo.db.transaction(function(t) {
                                        tryExecuteSql(t, dbInfo, "SELECT * FROM " + dbInfo.storeName + " WHERE key = ? LIMIT 1", [ key ], function(t, results) {
                                            var result = results.rows.length ? results.rows.item(0).value : null;
                                            if (result) {
                                                result = dbInfo.serializer.deserialize(result);
                                            }
                                            resolve(result);
                                        }, function(t, error) {
                                            reject(error);
                                        });
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function iterate$1(iterator, callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    var dbInfo = self._dbInfo;
                                    dbInfo.db.transaction(function(t) {
                                        tryExecuteSql(t, dbInfo, "SELECT * FROM " + dbInfo.storeName, [], function(t, results) {
                                            var rows = results.rows;
                                            var length = rows.length;
                                            for (var i = 0; i < length; i++) {
                                                var item = rows.item(i);
                                                var result = item.value;
                                                if (result) {
                                                    result = dbInfo.serializer.deserialize(result);
                                                }
                                                result = iterator(result, item.key, i + 1);
                                                if (result !== void 0) {
                                                    resolve(result);
                                                    return;
                                                }
                                            }
                                            resolve();
                                        }, function(t, error) {
                                            reject(error);
                                        });
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function _setItem(key, value, callback, retriesLeft) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    if (value === undefined) {
                                        value = null;
                                    }
                                    var originalValue = value;
                                    var dbInfo = self._dbInfo;
                                    dbInfo.serializer.serialize(value, function(value, error) {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            dbInfo.db.transaction(function(t) {
                                                tryExecuteSql(t, dbInfo, "INSERT OR REPLACE INTO " + dbInfo.storeName + " " + "(key, value) VALUES (?, ?)", [ key, value ], function() {
                                                    resolve(originalValue);
                                                }, function(t, error) {
                                                    reject(error);
                                                });
                                            }, function(sqlError) {
                                                if (sqlError.code === sqlError.QUOTA_ERR) {
                                                    if (retriesLeft > 0) {
                                                        resolve(_setItem.apply(self, [ key, originalValue, callback, retriesLeft - 1 ]));
                                                        return;
                                                    }
                                                    reject(sqlError);
                                                }
                                            });
                                        }
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function setItem$1(key, value, callback) {
                            return _setItem.apply(this, [ key, value, callback, 1 ]);
                        }
                        function removeItem$1(key, callback) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    var dbInfo = self._dbInfo;
                                    dbInfo.db.transaction(function(t) {
                                        tryExecuteSql(t, dbInfo, "DELETE FROM " + dbInfo.storeName + " WHERE key = ?", [ key ], function() {
                                            resolve();
                                        }, function(t, error) {
                                            reject(error);
                                        });
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function clear$1(callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    var dbInfo = self._dbInfo;
                                    dbInfo.db.transaction(function(t) {
                                        tryExecuteSql(t, dbInfo, "DELETE FROM " + dbInfo.storeName, [], function() {
                                            resolve();
                                        }, function(t, error) {
                                            reject(error);
                                        });
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function length$1(callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    var dbInfo = self._dbInfo;
                                    dbInfo.db.transaction(function(t) {
                                        tryExecuteSql(t, dbInfo, "SELECT COUNT(key) as c FROM " + dbInfo.storeName, [], function(t, results) {
                                            var result = results.rows.item(0).c;
                                            resolve(result);
                                        }, function(t, error) {
                                            reject(error);
                                        });
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function key$1(n, callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    var dbInfo = self._dbInfo;
                                    dbInfo.db.transaction(function(t) {
                                        tryExecuteSql(t, dbInfo, "SELECT key FROM " + dbInfo.storeName + " WHERE id = ? LIMIT 1", [ n + 1 ], function(t, results) {
                                            var result = results.rows.length ? results.rows.item(0).key : null;
                                            resolve(result);
                                        }, function(t, error) {
                                            reject(error);
                                        });
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function keys$1(callback) {
                            var self = this;
                            var promise = new Promise$1(function(resolve, reject) {
                                self.ready().then(function() {
                                    var dbInfo = self._dbInfo;
                                    dbInfo.db.transaction(function(t) {
                                        tryExecuteSql(t, dbInfo, "SELECT key FROM " + dbInfo.storeName, [], function(t, results) {
                                            var keys = [];
                                            for (var i = 0; i < results.rows.length; i++) {
                                                keys.push(results.rows.item(i).key);
                                            }
                                            resolve(keys);
                                        }, function(t, error) {
                                            reject(error);
                                        });
                                    });
                                })["catch"](reject);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function getAllStoreNames(db) {
                            return new Promise$1(function(resolve, reject) {
                                db.transaction(function(t) {
                                    t.executeSql("SELECT name FROM sqlite_master " + "WHERE type='table' AND name <> '__WebKitDatabaseInfoTable__'", [], function(t, results) {
                                        var storeNames = [];
                                        for (var i = 0; i < results.rows.length; i++) {
                                            storeNames.push(results.rows.item(i).name);
                                        }
                                        resolve({
                                            db: db,
                                            storeNames: storeNames
                                        });
                                    }, function(t, error) {
                                        reject(error);
                                    });
                                }, function(sqlError) {
                                    reject(sqlError);
                                });
                            });
                        }
                        function dropInstance$1(options, callback) {
                            callback = getCallback.apply(this, arguments);
                            var currentConfig = this.config();
                            options = typeof options !== "function" && options || {};
                            if (!options.name) {
                                options.name = options.name || currentConfig.name;
                                options.storeName = options.storeName || currentConfig.storeName;
                            }
                            var self = this;
                            var promise;
                            if (!options.name) {
                                promise = Promise$1.reject("Invalid arguments");
                            } else {
                                promise = new Promise$1(function(resolve) {
                                    var db;
                                    if (options.name === currentConfig.name) {
                                        db = self._dbInfo.db;
                                    } else {
                                        db = openDatabase(options.name, "", "", 0);
                                    }
                                    if (!options.storeName) {
                                        resolve(getAllStoreNames(db));
                                    } else {
                                        resolve({
                                            db: db,
                                            storeNames: [ options.storeName ]
                                        });
                                    }
                                }).then(function(operationInfo) {
                                    return new Promise$1(function(resolve, reject) {
                                        operationInfo.db.transaction(function(t) {
                                            function dropTable(storeName) {
                                                return new Promise$1(function(resolve, reject) {
                                                    t.executeSql("DROP TABLE IF EXISTS " + storeName, [], function() {
                                                        resolve();
                                                    }, function(t, error) {
                                                        reject(error);
                                                    });
                                                });
                                            }
                                            var operations = [];
                                            for (var i = 0, len = operationInfo.storeNames.length; i < len; i++) {
                                                operations.push(dropTable(operationInfo.storeNames[i]));
                                            }
                                            Promise$1.all(operations).then(function() {
                                                resolve();
                                            })["catch"](function(e) {
                                                reject(e);
                                            });
                                        }, function(sqlError) {
                                            reject(sqlError);
                                        });
                                    });
                                });
                            }
                            executeCallback(promise, callback);
                            return promise;
                        }
                        var webSQLStorage = {
                            _driver: "webSQLStorage",
                            _initStorage: _initStorage$1,
                            _support: isWebSQLValid(),
                            iterate: iterate$1,
                            getItem: getItem$1,
                            setItem: setItem$1,
                            removeItem: removeItem$1,
                            clear: clear$1,
                            length: length$1,
                            key: key$1,
                            keys: keys$1,
                            dropInstance: dropInstance$1
                        };
                        function isLocalStorageValid() {
                            try {
                                return typeof localStorage !== "undefined" && "setItem" in localStorage && !!localStorage.setItem;
                            } catch (e) {
                                return false;
                            }
                        }
                        function _getKeyPrefix(options, defaultConfig) {
                            var keyPrefix = options.name + "/";
                            if (options.storeName !== defaultConfig.storeName) {
                                keyPrefix += options.storeName + "/";
                            }
                            return keyPrefix;
                        }
                        function checkIfLocalStorageThrows() {
                            var localStorageTestKey = "_localforage_support_test";
                            try {
                                localStorage.setItem(localStorageTestKey, true);
                                localStorage.removeItem(localStorageTestKey);
                                return false;
                            } catch (e) {
                                return true;
                            }
                        }
                        function _isLocalStorageUsable() {
                            return !checkIfLocalStorageThrows() || localStorage.length > 0;
                        }
                        function _initStorage$2(options) {
                            var self = this;
                            var dbInfo = {};
                            if (options) {
                                for (var i in options) {
                                    dbInfo[i] = options[i];
                                }
                            }
                            dbInfo.keyPrefix = _getKeyPrefix(options, self._defaultConfig);
                            if (!_isLocalStorageUsable()) {
                                return Promise$1.reject();
                            }
                            self._dbInfo = dbInfo;
                            dbInfo.serializer = localforageSerializer;
                            return Promise$1.resolve();
                        }
                        function clear$2(callback) {
                            var self = this;
                            var promise = self.ready().then(function() {
                                var keyPrefix = self._dbInfo.keyPrefix;
                                for (var i = localStorage.length - 1; i >= 0; i--) {
                                    var key = localStorage.key(i);
                                    if (key.indexOf(keyPrefix) === 0) {
                                        localStorage.removeItem(key);
                                    }
                                }
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function getItem$2(key, callback) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = self.ready().then(function() {
                                var dbInfo = self._dbInfo;
                                var result = localStorage.getItem(dbInfo.keyPrefix + key);
                                if (result) {
                                    result = dbInfo.serializer.deserialize(result);
                                }
                                return result;
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function iterate$2(iterator, callback) {
                            var self = this;
                            var promise = self.ready().then(function() {
                                var dbInfo = self._dbInfo;
                                var keyPrefix = dbInfo.keyPrefix;
                                var keyPrefixLength = keyPrefix.length;
                                var length = localStorage.length;
                                var iterationNumber = 1;
                                for (var i = 0; i < length; i++) {
                                    var key = localStorage.key(i);
                                    if (key.indexOf(keyPrefix) !== 0) {
                                        continue;
                                    }
                                    var value = localStorage.getItem(key);
                                    if (value) {
                                        value = dbInfo.serializer.deserialize(value);
                                    }
                                    value = iterator(value, key.substring(keyPrefixLength), iterationNumber++);
                                    if (value !== void 0) {
                                        return value;
                                    }
                                }
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function key$2(n, callback) {
                            var self = this;
                            var promise = self.ready().then(function() {
                                var dbInfo = self._dbInfo;
                                var result;
                                try {
                                    result = localStorage.key(n);
                                } catch (error) {
                                    result = null;
                                }
                                if (result) {
                                    result = result.substring(dbInfo.keyPrefix.length);
                                }
                                return result;
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function keys$2(callback) {
                            var self = this;
                            var promise = self.ready().then(function() {
                                var dbInfo = self._dbInfo;
                                var length = localStorage.length;
                                var keys = [];
                                for (var i = 0; i < length; i++) {
                                    var itemKey = localStorage.key(i);
                                    if (itemKey.indexOf(dbInfo.keyPrefix) === 0) {
                                        keys.push(itemKey.substring(dbInfo.keyPrefix.length));
                                    }
                                }
                                return keys;
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function length$2(callback) {
                            var self = this;
                            var promise = self.keys().then(function(keys) {
                                return keys.length;
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function removeItem$2(key, callback) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = self.ready().then(function() {
                                var dbInfo = self._dbInfo;
                                localStorage.removeItem(dbInfo.keyPrefix + key);
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function setItem$2(key, value, callback) {
                            var self = this;
                            key = normalizeKey(key);
                            var promise = self.ready().then(function() {
                                if (value === undefined) {
                                    value = null;
                                }
                                var originalValue = value;
                                return new Promise$1(function(resolve, reject) {
                                    var dbInfo = self._dbInfo;
                                    dbInfo.serializer.serialize(value, function(value, error) {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            try {
                                                localStorage.setItem(dbInfo.keyPrefix + key, value);
                                                resolve(originalValue);
                                            } catch (e) {
                                                if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
                                                    reject(e);
                                                }
                                                reject(e);
                                            }
                                        }
                                    });
                                });
                            });
                            executeCallback(promise, callback);
                            return promise;
                        }
                        function dropInstance$2(options, callback) {
                            callback = getCallback.apply(this, arguments);
                            options = typeof options !== "function" && options || {};
                            if (!options.name) {
                                var currentConfig = this.config();
                                options.name = options.name || currentConfig.name;
                                options.storeName = options.storeName || currentConfig.storeName;
                            }
                            var self = this;
                            var promise;
                            if (!options.name) {
                                promise = Promise$1.reject("Invalid arguments");
                            } else {
                                promise = new Promise$1(function(resolve) {
                                    if (!options.storeName) {
                                        resolve(options.name + "/");
                                    } else {
                                        resolve(_getKeyPrefix(options, self._defaultConfig));
                                    }
                                }).then(function(keyPrefix) {
                                    for (var i = localStorage.length - 1; i >= 0; i--) {
                                        var key = localStorage.key(i);
                                        if (key.indexOf(keyPrefix) === 0) {
                                            localStorage.removeItem(key);
                                        }
                                    }
                                });
                            }
                            executeCallback(promise, callback);
                            return promise;
                        }
                        var localStorageWrapper = {
                            _driver: "localStorageWrapper",
                            _initStorage: _initStorage$2,
                            _support: isLocalStorageValid(),
                            iterate: iterate$2,
                            getItem: getItem$2,
                            setItem: setItem$2,
                            removeItem: removeItem$2,
                            clear: clear$2,
                            length: length$2,
                            key: key$2,
                            keys: keys$2,
                            dropInstance: dropInstance$2
                        };
                        var sameValue = function sameValue(x, y) {
                            return x === y || typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y);
                        };
                        var includes = function includes(array, searchElement) {
                            var len = array.length;
                            var i = 0;
                            while (i < len) {
                                if (sameValue(array[i], searchElement)) {
                                    return true;
                                }
                                i++;
                            }
                            return false;
                        };
                        var isArray = Array.isArray || function(arg) {
                            return Object.prototype.toString.call(arg) === "[object Array]";
                        };
                        var DefinedDrivers = {};
                        var DriverSupport = {};
                        var DefaultDrivers = {
                            INDEXEDDB: asyncStorage,
                            WEBSQL: webSQLStorage,
                            LOCALSTORAGE: localStorageWrapper
                        };
                        var DefaultDriverOrder = [ DefaultDrivers.INDEXEDDB._driver, DefaultDrivers.WEBSQL._driver, DefaultDrivers.LOCALSTORAGE._driver ];
                        var OptionalDriverMethods = [ "dropInstance" ];
                        var LibraryMethods = [ "clear", "getItem", "iterate", "key", "keys", "length", "removeItem", "setItem" ].concat(OptionalDriverMethods);
                        var DefaultConfig = {
                            description: "",
                            driver: DefaultDriverOrder.slice(),
                            name: "localforage",
                            size: 4980736,
                            storeName: "keyvaluepairs",
                            version: 1
                        };
                        function callWhenReady(localForageInstance, libraryMethod) {
                            localForageInstance[libraryMethod] = function() {
                                var _args = arguments;
                                return localForageInstance.ready().then(function() {
                                    return localForageInstance[libraryMethod].apply(localForageInstance, _args);
                                });
                            };
                        }
                        function extend() {
                            for (var i = 1; i < arguments.length; i++) {
                                var arg = arguments[i];
                                if (arg) {
                                    for (var _key in arg) {
                                        if (arg.hasOwnProperty(_key)) {
                                            if (isArray(arg[_key])) {
                                                arguments[0][_key] = arg[_key].slice();
                                            } else {
                                                arguments[0][_key] = arg[_key];
                                            }
                                        }
                                    }
                                }
                            }
                            return arguments[0];
                        }
                        var LocalForage = function() {
                            function LocalForage(options) {
                                _classCallCheck(this, LocalForage);
                                for (var driverTypeKey in DefaultDrivers) {
                                    if (DefaultDrivers.hasOwnProperty(driverTypeKey)) {
                                        var driver = DefaultDrivers[driverTypeKey];
                                        var driverName = driver._driver;
                                        this[driverTypeKey] = driverName;
                                        if (!DefinedDrivers[driverName]) {
                                            this.defineDriver(driver);
                                        }
                                    }
                                }
                                this._defaultConfig = extend({}, DefaultConfig);
                                this._config = extend({}, this._defaultConfig, options);
                                this._driverSet = null;
                                this._initDriver = null;
                                this._ready = false;
                                this._dbInfo = null;
                                this._wrapLibraryMethodsWithReady();
                                this.setDriver(this._config.driver)["catch"](function() {});
                            }
                            LocalForage.prototype.config = function config(options) {
                                if ((typeof options === "undefined" ? "undefined" : _typeof(options)) === "object") {
                                    if (this._ready) {
                                        return new Error("Can't call config() after localforage " + "has been used.");
                                    }
                                    for (var i in options) {
                                        if (i === "storeName") {
                                            options[i] = options[i].replace(/\W/g, "_");
                                        }
                                        if (i === "version" && typeof options[i] !== "number") {
                                            return new Error("Database version must be a number.");
                                        }
                                        this._config[i] = options[i];
                                    }
                                    if ("driver" in options && options.driver) {
                                        return this.setDriver(this._config.driver);
                                    }
                                    return true;
                                } else if (typeof options === "string") {
                                    return this._config[options];
                                } else {
                                    return this._config;
                                }
                            };
                            LocalForage.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
                                var promise = new Promise$1(function(resolve, reject) {
                                    try {
                                        var driverName = driverObject._driver;
                                        var complianceError = new Error("Custom driver not compliant; see " + "https://mozilla.github.io/localForage/#definedriver");
                                        if (!driverObject._driver) {
                                            reject(complianceError);
                                            return;
                                        }
                                        var driverMethods = LibraryMethods.concat("_initStorage");
                                        for (var i = 0, len = driverMethods.length; i < len; i++) {
                                            var driverMethodName = driverMethods[i];
                                            var isRequired = !includes(OptionalDriverMethods, driverMethodName);
                                            if ((isRequired || driverObject[driverMethodName]) && typeof driverObject[driverMethodName] !== "function") {
                                                reject(complianceError);
                                                return;
                                            }
                                        }
                                        var configureMissingMethods = function configureMissingMethods() {
                                            var methodNotImplementedFactory = function methodNotImplementedFactory(methodName) {
                                                return function() {
                                                    var error = new Error("Method " + methodName + " is not implemented by the current driver");
                                                    var promise = Promise$1.reject(error);
                                                    executeCallback(promise, arguments[arguments.length - 1]);
                                                    return promise;
                                                };
                                            };
                                            for (var _i = 0, _len = OptionalDriverMethods.length; _i < _len; _i++) {
                                                var optionalDriverMethod = OptionalDriverMethods[_i];
                                                if (!driverObject[optionalDriverMethod]) {
                                                    driverObject[optionalDriverMethod] = methodNotImplementedFactory(optionalDriverMethod);
                                                }
                                            }
                                        };
                                        configureMissingMethods();
                                        var setDriverSupport = function setDriverSupport(support) {
                                            if (DefinedDrivers[driverName]) {
                                                console.info("Redefining LocalForage driver: " + driverName);
                                            }
                                            DefinedDrivers[driverName] = driverObject;
                                            DriverSupport[driverName] = support;
                                            resolve();
                                        };
                                        if ("_support" in driverObject) {
                                            if (driverObject._support && typeof driverObject._support === "function") {
                                                driverObject._support().then(setDriverSupport, reject);
                                            } else {
                                                setDriverSupport(!!driverObject._support);
                                            }
                                        } else {
                                            setDriverSupport(true);
                                        }
                                    } catch (e) {
                                        reject(e);
                                    }
                                });
                                executeTwoCallbacks(promise, callback, errorCallback);
                                return promise;
                            };
                            LocalForage.prototype.driver = function driver() {
                                return this._driver || null;
                            };
                            LocalForage.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
                                var getDriverPromise = DefinedDrivers[driverName] ? Promise$1.resolve(DefinedDrivers[driverName]) : Promise$1.reject(new Error("Driver not found."));
                                executeTwoCallbacks(getDriverPromise, callback, errorCallback);
                                return getDriverPromise;
                            };
                            LocalForage.prototype.getSerializer = function getSerializer(callback) {
                                var serializerPromise = Promise$1.resolve(localforageSerializer);
                                executeTwoCallbacks(serializerPromise, callback);
                                return serializerPromise;
                            };
                            LocalForage.prototype.ready = function ready(callback) {
                                var self = this;
                                var promise = self._driverSet.then(function() {
                                    if (self._ready === null) {
                                        self._ready = self._initDriver();
                                    }
                                    return self._ready;
                                });
                                executeTwoCallbacks(promise, callback, callback);
                                return promise;
                            };
                            LocalForage.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
                                var self = this;
                                if (!isArray(drivers)) {
                                    drivers = [ drivers ];
                                }
                                var supportedDrivers = this._getSupportedDrivers(drivers);
                                function setDriverToConfig() {
                                    self._config.driver = self.driver();
                                }
                                function extendSelfWithDriver(driver) {
                                    self._extend(driver);
                                    setDriverToConfig();
                                    self._ready = self._initStorage(self._config);
                                    return self._ready;
                                }
                                function initDriver(supportedDrivers) {
                                    return function() {
                                        var currentDriverIndex = 0;
                                        function driverPromiseLoop() {
                                            while (currentDriverIndex < supportedDrivers.length) {
                                                var driverName = supportedDrivers[currentDriverIndex];
                                                currentDriverIndex++;
                                                self._dbInfo = null;
                                                self._ready = null;
                                                return self.getDriver(driverName).then(extendSelfWithDriver)["catch"](driverPromiseLoop);
                                            }
                                            setDriverToConfig();
                                            var error = new Error("No available storage method found.");
                                            self._driverSet = Promise$1.reject(error);
                                            return self._driverSet;
                                        }
                                        return driverPromiseLoop();
                                    };
                                }
                                var oldDriverSetDone = this._driverSet !== null ? this._driverSet["catch"](function() {
                                    return Promise$1.resolve();
                                }) : Promise$1.resolve();
                                this._driverSet = oldDriverSetDone.then(function() {
                                    var driverName = supportedDrivers[0];
                                    self._dbInfo = null;
                                    self._ready = null;
                                    return self.getDriver(driverName).then(function(driver) {
                                        self._driver = driver._driver;
                                        setDriverToConfig();
                                        self._wrapLibraryMethodsWithReady();
                                        self._initDriver = initDriver(supportedDrivers);
                                    });
                                })["catch"](function() {
                                    setDriverToConfig();
                                    var error = new Error("No available storage method found.");
                                    self._driverSet = Promise$1.reject(error);
                                    return self._driverSet;
                                });
                                executeTwoCallbacks(this._driverSet, callback, errorCallback);
                                return this._driverSet;
                            };
                            LocalForage.prototype.supports = function supports(driverName) {
                                return !!DriverSupport[driverName];
                            };
                            LocalForage.prototype._extend = function _extend(libraryMethodsAndProperties) {
                                extend(this, libraryMethodsAndProperties);
                            };
                            LocalForage.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
                                var supportedDrivers = [];
                                for (var i = 0, len = drivers.length; i < len; i++) {
                                    var driverName = drivers[i];
                                    if (this.supports(driverName)) {
                                        supportedDrivers.push(driverName);
                                    }
                                }
                                return supportedDrivers;
                            };
                            LocalForage.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
                                for (var i = 0, len = LibraryMethods.length; i < len; i++) {
                                    callWhenReady(this, LibraryMethods[i]);
                                }
                            };
                            LocalForage.prototype.createInstance = function createInstance(options) {
                                return new LocalForage(options);
                            };
                            return LocalForage;
                        }();
                        var localforage_js = new LocalForage();
                        module.exports = localforage_js;
                    }, {
                        3: 3
                    } ]
                }, {}, [ 4 ])(4);
            });
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {} ],
    8: [ function(require, module, exports) {
        function randomBytes(size) {
            var bytes = new Array(size);
            var r;
            for (var i = 0, r; i < size; i++) {
                if ((i & 3) == 0) r = Math.random() * 4294967296;
                bytes[i] = r >>> ((i & 3) << 3) & 255;
            }
            return bytes;
        }
        function byteArrayToBase64(uint8) {
            var lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", extraBytes = uint8.length % 3, output = "", temp, length, i;
            function tripletToBase64(num) {
                return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
            }
            for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
                temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
                output += tripletToBase64(temp);
            }
            switch (extraBytes) {
              case 1:
                temp = uint8[uint8.length - 1];
                output += lookup[temp >> 2];
                output += lookup[temp << 4 & 63];
                output += "==";
                break;

              case 2:
                temp = (uint8[uint8.length - 2] << 8) + uint8[uint8.length - 1];
                output += lookup[temp >> 10];
                output += lookup[temp >> 4 & 63];
                output += lookup[temp << 2 & 63];
                output += "=";
                break;
            }
            return output;
        }
        function uid(len) {
            return byteArrayToBase64(randomBytes(Math.ceil(Math.max(8, len * 2)))).replace(/[+\/]/g, "").slice(0, len);
        }
        module.exports.uid = uid;
    }, {} ],
    9: [ function(require, module, exports) {
        var localforage = require("localforage");
        localforage.config({
            name: "NeDB",
            storeName: "nedbdata"
        });
        var noSerialize = false;
        function exists(filename, callback) {
            localforage.getItem(filename, function(err, value) {
                if (value !== null) {
                    return callback(true);
                } else {
                    return callback(false);
                }
            });
        }
        function rename(filename, newFilename, callback) {
            localforage.getItem(filename, function(err, value) {
                if (value === null) {
                    localforage.removeItem(newFilename, function() {
                        return callback();
                    });
                } else {
                    localforage.setItem(newFilename, value, function() {
                        localforage.removeItem(filename, function() {
                            return callback();
                        });
                    });
                }
            });
        }
        function writeFile(filename, contents, options, callback) {
            if (typeof options === "function") {
                callback = options;
            }
            localforage.setItem(filename, contents, function() {
                return callback();
            });
        }
        function appendFile(filename, toAppend, options, callback) {
            if (typeof options === "function") {
                callback = options;
            }
            localforage.getItem(filename, function(err, contents) {
                if (noSerialize) {
                    contents = contents || [];
                    contents = contents.concat(toAppend);
                } else {
                    contents = contents || "";
                    contents += toAppend;
                }
                localforage.setItem(filename, contents, function() {
                    return callback();
                });
            });
        }
        function readFile(filename, options, callback) {
            if (typeof options === "function") {
                callback = options;
            }
            localforage.getItem(filename, function(err, contents) {
                return callback(null, contents || "");
            });
        }
        function unlink(filename, callback) {
            localforage.removeItem(filename, function() {
                return callback();
            });
        }
        function mkdirp(dir, callback) {
            return callback();
        }
        function ensureDatafileIntegrity(filename, callback) {
            return callback(null);
        }
        function setNoSerialize(status) {
            noSerialize = status;
        }
        module.exports.exists = exists;
        module.exports.rename = rename;
        module.exports.writeFile = writeFile;
        module.exports.crashSafeWriteFile = writeFile;
        module.exports.appendFile = appendFile;
        module.exports.readFile = readFile;
        module.exports.unlink = unlink;
        module.exports.mkdirp = mkdirp;
        module.exports.ensureDatafileIntegrity = ensureDatafileIntegrity;
        module.exports.forage = localforage;
        module.exports.setNoSerialize = setNoSerialize;
    }, {
        localforage: 7
    } ],
    10: [ function(require, module, exports) {
        var Datastore = require("./lib/datastore");
        module.exports = Datastore;
    }, {
        "./lib/datastore": 12
    } ],
    11: [ function(require, module, exports) {
        var model = require("./model"), _ = require("underscore");
        function Cursor(db, query, execFn) {
            this.db = db;
            this.query = query || {};
            if (execFn) {
                this.execFn = execFn;
            }
        }
        Cursor.prototype.limit = function(limit) {
            this._limit = limit;
            return this;
        };
        Cursor.prototype.skip = function(skip) {
            this._skip = skip;
            return this;
        };
        Cursor.prototype.sort = function(sortQuery) {
            this._sort = sortQuery;
            return this;
        };
        Cursor.prototype.projection = function(projection) {
            this._projection = projection;
            return this;
        };
        Cursor.prototype.project = function(candidates) {
            var res = [], self = this, keepId, action, keys;
            if (this._projection === undefined || Object.keys(this._projection).length === 0) {
                return candidates;
            }
            keepId = this._projection._id === 0 ? false : true;
            this._projection = _.omit(this._projection, "_id");
            keys = Object.keys(this._projection);
            keys.forEach(function(k) {
                if (action !== undefined && self._projection[k] !== action) {
                    throw new Error("Can't both keep and omit fields except for _id");
                }
                action = self._projection[k];
            });
            candidates.forEach(function(candidate) {
                var toPush;
                if (action === 1) {
                    toPush = {
                        $set: {}
                    };
                    keys.forEach(function(k) {
                        toPush.$set[k] = model.getDotValue(candidate, k);
                        if (toPush.$set[k] === undefined) {
                            delete toPush.$set[k];
                        }
                    });
                    toPush = model.modify({}, toPush);
                } else {
                    toPush = {
                        $unset: {}
                    };
                    keys.forEach(function(k) {
                        toPush.$unset[k] = true;
                    });
                    toPush = model.modify(candidate, toPush);
                }
                if (keepId) {
                    toPush._id = candidate._id;
                } else {
                    delete toPush._id;
                }
                res.push(toPush);
            });
            return res;
        };
        Cursor.prototype._exec = function(_callback) {
            var res = [], added = 0, skipped = 0, self = this, error = null, i, keys, key;
            function callback(error, res) {
                if (self.execFn) {
                    return self.execFn(error, res, _callback);
                } else {
                    return _callback(error, res);
                }
            }
            this.db.getCandidates(this.query, function(err, candidates) {
                if (err) {
                    return callback(err);
                }
                try {
                    for (i = 0; i < candidates.length; i += 1) {
                        if (model.match(candidates[i], self.query)) {
                            if (!self._sort) {
                                if (self._skip && self._skip > skipped) {
                                    skipped += 1;
                                } else {
                                    res.push(candidates[i]);
                                    added += 1;
                                    if (self._limit && self._limit <= added) {
                                        break;
                                    }
                                }
                            } else {
                                res.push(candidates[i]);
                            }
                        }
                    }
                } catch (err) {
                    return callback(err);
                }
                if (self._sort) {
                    keys = Object.keys(self._sort);
                    var criteria = [];
                    for (i = 0; i < keys.length; i++) {
                        key = keys[i];
                        criteria.push({
                            key: key,
                            direction: self._sort[key]
                        });
                    }
                    res.sort(function(a, b) {
                        var criterion, compare, i;
                        for (i = 0; i < criteria.length; i++) {
                            criterion = criteria[i];
                            compare = criterion.direction * model.compareThings(model.getDotValue(a, criterion.key), model.getDotValue(b, criterion.key), self.db.compareStrings);
                            if (compare !== 0) {
                                return compare;
                            }
                        }
                        return 0;
                    });
                    var limit = self._limit || res.length, skip = self._skip || 0;
                    res = res.slice(skip, skip + limit);
                }
                try {
                    res = self.project(res);
                } catch (e) {
                    error = e;
                    res = undefined;
                }
                return callback(error, res);
            });
        };
        Cursor.prototype.exec = function() {
            this.db.executor.push({
                this: this,
                fn: this._exec,
                arguments: arguments
            });
        };
        module.exports = Cursor;
    }, {
        "./model": 15,
        underscore: 20
    } ],
    12: [ function(require, module, exports) {
        var customUtils = require("./customUtils"), model = require("./model"), async = require("async"), Executor = require("./executor"), Index = require("./indexes"), util = require("util"), _ = require("underscore"), Persistence = require("./persistence"), Cursor = require("./cursor");
        function Datastore(options) {
            var filename;
            if (typeof options === "string") {
                filename = options;
                this.inMemoryOnly = false;
            } else {
                options = options || {};
                filename = options.filename;
                this.inMemoryOnly = options.inMemoryOnly || false;
                this.autoload = options.autoload || false;
                this.timestampData = options.timestampData || false;
            }
            if (!filename || typeof filename !== "string" || filename.length === 0) {
                this.filename = null;
                this.inMemoryOnly = true;
            } else {
                this.filename = filename;
            }
            this.compareStrings = options.compareStrings;
            this.persistence = new Persistence({
                db: this,
                nodeWebkitAppName: options.nodeWebkitAppName,
                afterSerialization: options.afterSerialization,
                beforeDeserialization: options.beforeDeserialization,
                corruptAlertThreshold: options.corruptAlertThreshold
            });
            this.executor = new Executor();
            if (this.inMemoryOnly) {
                this.executor.ready = true;
            }
            this.indexes = {};
            this.indexes._id = new Index({
                fieldName: "_id",
                unique: true
            });
            this.ttlIndexes = {};
            if (this.autoload) {
                this.loadDatabase(options.onload || function(err) {
                    if (err) {
                        throw err;
                    }
                });
            }
        }
        util.inherits(Datastore, require("events").EventEmitter);
        Datastore.prototype.loadDatabase = function() {
            this.executor.push({
                this: this.persistence,
                fn: this.persistence.loadDatabase,
                arguments: arguments
            }, true);
        };
        Datastore.prototype.getAllData = function() {
            return this.indexes._id.getAll();
        };
        Datastore.prototype.resetIndexes = function(newData) {
            var self = this;
            Object.keys(this.indexes).forEach(function(i) {
                self.indexes[i].reset(newData);
            });
        };
        Datastore.prototype.ensureIndex = function(options, cb) {
            var err, callback = cb || function() {};
            options = options || {};
            if (!options.fieldName) {
                err = new Error("Cannot create an index without a fieldName");
                err.missingFieldName = true;
                return callback(err);
            }
            if (this.indexes[options.fieldName]) {
                return callback(null);
            }
            this.indexes[options.fieldName] = new Index(options);
            if (options.expireAfterSeconds !== undefined) {
                this.ttlIndexes[options.fieldName] = options.expireAfterSeconds;
            }
            try {
                this.indexes[options.fieldName].insert(this.getAllData());
            } catch (e) {
                delete this.indexes[options.fieldName];
                return callback(e);
            }
            this.persistence.persistNewState([ {
                $$indexCreated: options
            } ], function(err) {
                if (err) {
                    return callback(err);
                }
                return callback(null);
            });
        };
        Datastore.prototype.removeIndex = function(fieldName, cb) {
            var callback = cb || function() {};
            delete this.indexes[fieldName];
            this.persistence.persistNewState([ {
                $$indexRemoved: fieldName
            } ], function(err) {
                if (err) {
                    return callback(err);
                }
                return callback(null);
            });
        };
        Datastore.prototype.addToIndexes = function(doc) {
            var i, failingIndex, error, keys = Object.keys(this.indexes);
            for (i = 0; i < keys.length; i += 1) {
                try {
                    this.indexes[keys[i]].insert(doc);
                } catch (e) {
                    failingIndex = i;
                    error = e;
                    break;
                }
            }
            if (error) {
                for (i = 0; i < failingIndex; i += 1) {
                    this.indexes[keys[i]].remove(doc);
                }
                throw error;
            }
        };
        Datastore.prototype.removeFromIndexes = function(doc) {
            var self = this;
            Object.keys(this.indexes).forEach(function(i) {
                self.indexes[i].remove(doc);
            });
        };
        Datastore.prototype.updateIndexes = function(oldDoc, newDoc) {
            var i, failingIndex, error, keys = Object.keys(this.indexes);
            for (i = 0; i < keys.length; i += 1) {
                try {
                    this.indexes[keys[i]].update(oldDoc, newDoc);
                } catch (e) {
                    failingIndex = i;
                    error = e;
                    break;
                }
            }
            if (error) {
                for (i = 0; i < failingIndex; i += 1) {
                    this.indexes[keys[i]].revertUpdate(oldDoc, newDoc);
                }
                throw error;
            }
        };
        Datastore.prototype.getCandidates = function(query, dontExpireStaleDocs, callback) {
            var indexNames = Object.keys(this.indexes), self = this, usableQueryKeys;
            if (typeof dontExpireStaleDocs === "function") {
                callback = dontExpireStaleDocs;
                dontExpireStaleDocs = false;
            }
            async.waterfall([ function(cb) {
                usableQueryKeys = [];
                Object.keys(query).forEach(function(k) {
                    if (typeof query[k] === "string" || typeof query[k] === "number" || typeof query[k] === "boolean" || util.isDate(query[k]) || query[k] === null) {
                        usableQueryKeys.push(k);
                    }
                });
                usableQueryKeys = _.intersection(usableQueryKeys, indexNames);
                if (usableQueryKeys.length > 0) {
                    return cb(null, self.indexes[usableQueryKeys[0]].getMatching(query[usableQueryKeys[0]]));
                }
                usableQueryKeys = [];
                Object.keys(query).forEach(function(k) {
                    if (query[k] && query[k].hasOwnProperty("$in")) {
                        usableQueryKeys.push(k);
                    }
                });
                usableQueryKeys = _.intersection(usableQueryKeys, indexNames);
                if (usableQueryKeys.length > 0) {
                    return cb(null, self.indexes[usableQueryKeys[0]].getMatching(query[usableQueryKeys[0]].$in));
                }
                usableQueryKeys = [];
                Object.keys(query).forEach(function(k) {
                    if (query[k] && (query[k].hasOwnProperty("$lt") || query[k].hasOwnProperty("$lte") || query[k].hasOwnProperty("$gt") || query[k].hasOwnProperty("$gte"))) {
                        usableQueryKeys.push(k);
                    }
                });
                usableQueryKeys = _.intersection(usableQueryKeys, indexNames);
                if (usableQueryKeys.length > 0) {
                    return cb(null, self.indexes[usableQueryKeys[0]].getBetweenBounds(query[usableQueryKeys[0]]));
                }
                return cb(null, self.getAllData());
            }, function(docs) {
                if (dontExpireStaleDocs) {
                    return callback(null, docs);
                }
                var expiredDocsIds = [], validDocs = [], ttlIndexesFieldNames = Object.keys(self.ttlIndexes);
                docs.forEach(function(doc) {
                    var valid = true;
                    ttlIndexesFieldNames.forEach(function(i) {
                        if (doc[i] !== undefined && util.isDate(doc[i]) && Date.now() > doc[i].getTime() + self.ttlIndexes[i] * 1e3) {
                            valid = false;
                        }
                    });
                    if (valid) {
                        validDocs.push(doc);
                    } else {
                        expiredDocsIds.push(doc._id);
                    }
                });
                async.eachSeries(expiredDocsIds, function(_id, cb) {
                    self._remove({
                        _id: _id
                    }, {}, function(err) {
                        if (err) {
                            return callback(err);
                        }
                        return cb();
                    });
                }, function(err) {
                    return callback(null, validDocs);
                });
            } ]);
        };
        Datastore.prototype._insert = function(newDoc, cb) {
            var callback = cb || function() {}, preparedDoc;
            try {
                preparedDoc = this.prepareDocumentForInsertion(newDoc);
                this._insertInCache(preparedDoc);
            } catch (e) {
                return callback(e);
            }
            this.persistence.persistNewState(util.isArray(preparedDoc) ? preparedDoc : [ preparedDoc ], function(err) {
                if (err) {
                    return callback(err);
                }
                return callback(null, model.deepCopy(preparedDoc));
            });
        };
        Datastore.prototype.createNewId = function() {
            var tentativeId = customUtils.uid(16);
            if (this.indexes._id.getMatching(tentativeId).length > 0) {
                tentativeId = this.createNewId();
            }
            return tentativeId;
        };
        Datastore.prototype.prepareDocumentForInsertion = function(newDoc) {
            var preparedDoc, self = this;
            if (util.isArray(newDoc)) {
                preparedDoc = [];
                newDoc.forEach(function(doc) {
                    preparedDoc.push(self.prepareDocumentForInsertion(doc));
                });
            } else {
                preparedDoc = model.deepCopy(newDoc);
                if (preparedDoc._id === undefined) {
                    preparedDoc._id = this.createNewId();
                }
                var now = new Date();
                if (this.timestampData && preparedDoc.createdAt === undefined) {
                    preparedDoc.createdAt = now;
                }
                if (this.timestampData && preparedDoc.updatedAt === undefined) {
                    preparedDoc.updatedAt = now;
                }
                model.checkObject(preparedDoc);
            }
            return preparedDoc;
        };
        Datastore.prototype._insertInCache = function(preparedDoc) {
            if (util.isArray(preparedDoc)) {
                this._insertMultipleDocsInCache(preparedDoc);
            } else {
                this.addToIndexes(preparedDoc);
            }
        };
        Datastore.prototype._insertMultipleDocsInCache = function(preparedDocs) {
            var i, failingI, error;
            for (i = 0; i < preparedDocs.length; i += 1) {
                try {
                    this.addToIndexes(preparedDocs[i]);
                } catch (e) {
                    error = e;
                    failingI = i;
                    break;
                }
            }
            if (error) {
                for (i = 0; i < failingI; i += 1) {
                    this.removeFromIndexes(preparedDocs[i]);
                }
                throw error;
            }
        };
        Datastore.prototype.insert = function() {
            this.executor.push({
                this: this,
                fn: this._insert,
                arguments: arguments
            });
        };
        Datastore.prototype.count = function(query, callback) {
            var cursor = new Cursor(this, query, function(err, docs, callback) {
                if (err) {
                    return callback(err);
                }
                return callback(null, docs.length);
            });
            if (typeof callback === "function") {
                cursor.exec(callback);
            } else {
                return cursor;
            }
        };
        Datastore.prototype.find = function(query, projection, callback) {
            switch (arguments.length) {
              case 1:
                projection = {};
                break;

              case 2:
                if (typeof projection === "function") {
                    callback = projection;
                    projection = {};
                }
                break;
            }
            var cursor = new Cursor(this, query, function(err, docs, callback) {
                var res = [], i;
                if (err) {
                    return callback(err);
                }
                for (i = 0; i < docs.length; i += 1) {
                    res.push(model.deepCopy(docs[i]));
                }
                return callback(null, res);
            });
            cursor.projection(projection);
            if (typeof callback === "function") {
                cursor.exec(callback);
            } else {
                return cursor;
            }
        };
        Datastore.prototype.findOne = function(query, projection, callback) {
            switch (arguments.length) {
              case 1:
                projection = {};
                break;

              case 2:
                if (typeof projection === "function") {
                    callback = projection;
                    projection = {};
                }
                break;
            }
            var cursor = new Cursor(this, query, function(err, docs, callback) {
                if (err) {
                    return callback(err);
                }
                if (docs.length === 1) {
                    return callback(null, model.deepCopy(docs[0]));
                } else {
                    return callback(null, null);
                }
            });
            cursor.projection(projection).limit(1);
            if (typeof callback === "function") {
                cursor.exec(callback);
            } else {
                return cursor;
            }
        };
        Datastore.prototype._update = function(query, updateQuery, options, cb) {
            var callback, self = this, numReplaced = 0, multi, upsert, i;
            if (typeof options === "function") {
                cb = options;
                options = {};
            }
            callback = cb || function() {};
            multi = options.multi !== undefined ? options.multi : false;
            upsert = options.upsert !== undefined ? options.upsert : false;
            async.waterfall([ function(cb) {
                if (!upsert) {
                    return cb();
                }
                var cursor = new Cursor(self, query);
                cursor.limit(1)._exec(function(err, docs) {
                    if (err) {
                        return callback(err);
                    }
                    if (docs.length === 1) {
                        return cb();
                    } else {
                        var toBeInserted;
                        try {
                            model.checkObject(updateQuery);
                            toBeInserted = updateQuery;
                        } catch (e) {
                            try {
                                toBeInserted = model.modify(model.deepCopy(query, true), updateQuery);
                            } catch (err) {
                                return callback(err);
                            }
                        }
                        return self._insert(toBeInserted, function(err, newDoc) {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, 1, newDoc, true);
                        });
                    }
                });
            }, function() {
                var modifiedDoc, modifications = [], createdAt;
                self.getCandidates(query, function(err, candidates) {
                    if (err) {
                        return callback(err);
                    }
                    try {
                        for (i = 0; i < candidates.length; i += 1) {
                            if (model.match(candidates[i], query) && (multi || numReplaced === 0)) {
                                numReplaced += 1;
                                if (self.timestampData) {
                                    createdAt = candidates[i].createdAt;
                                }
                                modifiedDoc = model.modify(candidates[i], updateQuery);
                                if (self.timestampData) {
                                    modifiedDoc.createdAt = createdAt;
                                    modifiedDoc.updatedAt = new Date();
                                }
                                modifications.push({
                                    oldDoc: candidates[i],
                                    newDoc: modifiedDoc
                                });
                            }
                        }
                    } catch (err) {
                        return callback(err);
                    }
                    try {
                        self.updateIndexes(modifications);
                    } catch (err) {
                        return callback(err);
                    }
                    var updatedDocs = _.pluck(modifications, "newDoc");
                    self.persistence.persistNewState(updatedDocs, function(err) {
                        if (err) {
                            return callback(err);
                        }
                        if (!options.returnUpdatedDocs) {
                            return callback(null, numReplaced);
                        } else {
                            var updatedDocsDC = [];
                            updatedDocs.forEach(function(doc) {
                                updatedDocsDC.push(model.deepCopy(doc));
                            });
                            if (!multi) {
                                updatedDocsDC = updatedDocsDC[0];
                            }
                            return callback(null, numReplaced, updatedDocsDC);
                        }
                    });
                });
            } ]);
        };
        Datastore.prototype.update = function() {
            this.executor.push({
                this: this,
                fn: this._update,
                arguments: arguments
            });
        };
        Datastore.prototype._remove = function(query, options, cb) {
            var callback, self = this, numRemoved = 0, removedDocs = [], multi;
            if (typeof options === "function") {
                cb = options;
                options = {};
            }
            callback = cb || function() {};
            multi = options.multi !== undefined ? options.multi : false;
            this.getCandidates(query, true, function(err, candidates) {
                if (err) {
                    return callback(err);
                }
                try {
                    candidates.forEach(function(d) {
                        if (model.match(d, query) && (multi || numRemoved === 0)) {
                            numRemoved += 1;
                            removedDocs.push({
                                $$deleted: true,
                                _id: d._id
                            });
                            self.removeFromIndexes(d);
                        }
                    });
                } catch (err) {
                    return callback(err);
                }
                self.persistence.persistNewState(removedDocs, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, numRemoved);
                });
            });
        };
        Datastore.prototype.remove = function() {
            this.executor.push({
                this: this,
                fn: this._remove,
                arguments: arguments
            });
        };
        module.exports = Datastore;
    }, {
        "./cursor": 11,
        "./customUtils": 8,
        "./executor": 13,
        "./indexes": 14,
        "./model": 15,
        "./persistence": 16,
        async: 1,
        events: 6,
        underscore: 20,
        util: 23
    } ],
    13: [ function(require, module, exports) {
        (function(process, setImmediate) {
            var async = require("async");
            function Executor() {
                this.buffer = [];
                this.ready = false;
                this.queue = async.queue(function(task, cb) {
                    var newArguments = [];
                    for (var i = 0; i < task.arguments.length; i += 1) {
                        newArguments.push(task.arguments[i]);
                    }
                    var lastArg = task.arguments[task.arguments.length - 1];
                    if (typeof lastArg === "function") {
                        newArguments[newArguments.length - 1] = function() {
                            if (typeof setImmediate === "function") {
                                setImmediate(cb);
                            } else {
                                process.nextTick(cb);
                            }
                            lastArg.apply(null, arguments);
                        };
                    } else if (!lastArg && task.arguments.length !== 0) {
                        newArguments[newArguments.length - 1] = function() {
                            cb();
                        };
                    } else {
                        newArguments.push(function() {
                            cb();
                        });
                    }
                    task.fn.apply(task.this, newArguments);
                }, 1);
            }
            Executor.prototype.push = function(task, forceQueuing) {
                if (this.ready || forceQueuing) {
                    this.queue.push(task);
                } else {
                    this.buffer.push(task);
                }
            };
            Executor.prototype.processBuffer = function() {
                var i;
                this.ready = true;
                for (i = 0; i < this.buffer.length; i += 1) {
                    this.queue.push(this.buffer[i]);
                }
                this.buffer = [];
            };
            module.exports = Executor;
        }).call(this, require("_process"), require("timers").setImmediate);
    }, {
        _process: 18,
        async: 1,
        timers: 19
    } ],
    14: [ function(require, module, exports) {
        var BinarySearchTree = require("binary-search-tree").AVLTree, model = require("./model"), _ = require("underscore"), util = require("util");
        function checkValueEquality(a, b) {
            return a === b;
        }
        function projectForUnique(elt) {
            if (elt === null) {
                return "$null";
            }
            if (typeof elt === "string") {
                return "$string" + elt;
            }
            if (typeof elt === "boolean") {
                return "$boolean" + elt;
            }
            if (typeof elt === "number") {
                return "$number" + elt;
            }
            if (util.isArray(elt)) {
                return "$date" + elt.getTime();
            }
            return elt;
        }
        function Index(options) {
            this.fieldName = options.fieldName;
            this.unique = options.unique || false;
            this.sparse = options.sparse || false;
            this.treeOptions = {
                unique: this.unique,
                compareKeys: model.compareThings,
                checkValueEquality: checkValueEquality
            };
            this.reset();
        }
        Index.prototype.reset = function(newData) {
            this.tree = new BinarySearchTree(this.treeOptions);
            if (newData) {
                this.insert(newData);
            }
        };
        Index.prototype.insert = function(doc) {
            var key, self = this, keys, i, failingI, error;
            if (util.isArray(doc)) {
                this.insertMultipleDocs(doc);
                return;
            }
            key = model.getDotValue(doc, this.fieldName);
            if (key === undefined && this.sparse) {
                return;
            }
            if (!util.isArray(key)) {
                this.tree.insert(key, doc);
            } else {
                keys = _.uniq(key, projectForUnique);
                for (i = 0; i < keys.length; i += 1) {
                    try {
                        this.tree.insert(keys[i], doc);
                    } catch (e) {
                        error = e;
                        failingI = i;
                        break;
                    }
                }
                if (error) {
                    for (i = 0; i < failingI; i += 1) {
                        this.tree.delete(keys[i], doc);
                    }
                    throw error;
                }
            }
        };
        Index.prototype.insertMultipleDocs = function(docs) {
            var i, error, failingI;
            for (i = 0; i < docs.length; i += 1) {
                try {
                    this.insert(docs[i]);
                } catch (e) {
                    error = e;
                    failingI = i;
                    break;
                }
            }
            if (error) {
                for (i = 0; i < failingI; i += 1) {
                    this.remove(docs[i]);
                }
                throw error;
            }
        };
        Index.prototype.remove = function(doc) {
            var key, self = this;
            if (util.isArray(doc)) {
                doc.forEach(function(d) {
                    self.remove(d);
                });
                return;
            }
            key = model.getDotValue(doc, this.fieldName);
            if (key === undefined && this.sparse) {
                return;
            }
            if (!util.isArray(key)) {
                this.tree.delete(key, doc);
            } else {
                _.uniq(key, projectForUnique).forEach(function(_key) {
                    self.tree.delete(_key, doc);
                });
            }
        };
        Index.prototype.update = function(oldDoc, newDoc) {
            if (util.isArray(oldDoc)) {
                this.updateMultipleDocs(oldDoc);
                return;
            }
            this.remove(oldDoc);
            try {
                this.insert(newDoc);
            } catch (e) {
                this.insert(oldDoc);
                throw e;
            }
        };
        Index.prototype.updateMultipleDocs = function(pairs) {
            var i, failingI, error;
            for (i = 0; i < pairs.length; i += 1) {
                this.remove(pairs[i].oldDoc);
            }
            for (i = 0; i < pairs.length; i += 1) {
                try {
                    this.insert(pairs[i].newDoc);
                } catch (e) {
                    error = e;
                    failingI = i;
                    break;
                }
            }
            if (error) {
                for (i = 0; i < failingI; i += 1) {
                    this.remove(pairs[i].newDoc);
                }
                for (i = 0; i < pairs.length; i += 1) {
                    this.insert(pairs[i].oldDoc);
                }
                throw error;
            }
        };
        Index.prototype.revertUpdate = function(oldDoc, newDoc) {
            var revert = [];
            if (!util.isArray(oldDoc)) {
                this.update(newDoc, oldDoc);
            } else {
                oldDoc.forEach(function(pair) {
                    revert.push({
                        oldDoc: pair.newDoc,
                        newDoc: pair.oldDoc
                    });
                });
                this.update(revert);
            }
        };
        Index.prototype.getMatching = function(value) {
            var self = this;
            if (!util.isArray(value)) {
                return self.tree.search(value);
            } else {
                var _res = {}, res = [];
                value.forEach(function(v) {
                    self.getMatching(v).forEach(function(doc) {
                        _res[doc._id] = doc;
                    });
                });
                Object.keys(_res).forEach(function(_id) {
                    res.push(_res[_id]);
                });
                return res;
            }
        };
        Index.prototype.getBetweenBounds = function(query) {
            return this.tree.betweenBounds(query);
        };
        Index.prototype.getAll = function() {
            var res = [];
            this.tree.executeOnEveryNode(function(node) {
                var i;
                for (i = 0; i < node.data.length; i += 1) {
                    res.push(node.data[i]);
                }
            });
            return res;
        };
        module.exports = Index;
    }, {
        "./model": 15,
        "binary-search-tree": 2,
        underscore: 20,
        util: 23
    } ],
    15: [ function(require, module, exports) {
        var util = require("util"), _ = require("underscore"), modifierFunctions = {}, lastStepModifierFunctions = {}, comparisonFunctions = {}, logicalOperators = {}, arrayComparisonFunctions = {};
        function checkKey(k, v) {
            if (typeof k === "number") {
                k = k.toString();
            }
            if (k[0] === "$" && !(k === "$$date" && typeof v === "number") && !(k === "$$deleted" && v === true) && !(k === "$$indexCreated") && !(k === "$$indexRemoved")) {
                throw new Error("Field names cannot begin with the $ character");
            }
            if (k.indexOf(".") !== -1) {
                throw new Error("Field names cannot contain a .");
            }
        }
        function checkObject(obj) {
            if (util.isArray(obj)) {
                obj.forEach(function(o) {
                    checkObject(o);
                });
            }
            if (typeof obj === "object" && obj !== null) {
                Object.keys(obj).forEach(function(k) {
                    checkKey(k, obj[k]);
                    checkObject(obj[k]);
                });
            }
        }
        function serialize(obj) {
            var res;
            res = JSON.stringify(obj, function(k, v) {
                checkKey(k, v);
                if (v === undefined) {
                    return undefined;
                }
                if (v === null) {
                    return null;
                }
                if (typeof this[k].getTime === "function") {
                    return {
                        $$date: this[k].getTime()
                    };
                }
                return v;
            });
            return res;
        }
        function deserialize(rawData) {
            return JSON.parse(rawData, function(k, v) {
                if (k === "$$date") {
                    return new Date(v);
                }
                if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
                    return v;
                }
                if (v && v.$$date) {
                    return v.$$date;
                }
                return v;
            });
        }
        function deepCopy(obj, strictKeys) {
            var res;
            if (typeof obj === "boolean" || typeof obj === "number" || typeof obj === "string" || obj === null || util.isDate(obj)) {
                return obj;
            }
            if (util.isArray(obj)) {
                res = [];
                obj.forEach(function(o) {
                    res.push(deepCopy(o, strictKeys));
                });
                return res;
            }
            if (typeof obj === "object") {
                var toString = Object.prototype.toString;
                switch (toString.call(obj)) {
                  case "[object Blob]":
                  case "[object ArrayBuffer]":
                  case "[object Int8Array]":
                  case "[object Uint8Array]":
                  case "[object Uint8ClampedArray]":
                  case "[object Int16Array]":
                  case "[object Uint16Array]":
                  case "[object Int32Array]":
                  case "[object Uint32Array]":
                  case "[object Float32Array]":
                  case "[object Float64Array]":
                    {
                        return obj;
                    }
                    break;
                }
                res = {};
                Object.keys(obj).forEach(function(k) {
                    if (!strictKeys || k[0] !== "$" && k.indexOf(".") === -1) {
                        res[k] = deepCopy(obj[k], strictKeys);
                    }
                });
                return res;
            }
            return undefined;
        }
        function isPrimitiveType(obj) {
            return typeof obj === "boolean" || typeof obj === "number" || typeof obj === "string" || obj === null || util.isDate(obj) || util.isArray(obj);
        }
        function compareNSB(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        }
        function compareArrays(a, b) {
            var i, comp;
            for (i = 0; i < Math.min(a.length, b.length); i += 1) {
                comp = compareThings(a[i], b[i]);
                if (comp !== 0) {
                    return comp;
                }
            }
            return compareNSB(a.length, b.length);
        }
        function compareThings(a, b, _compareStrings) {
            var aKeys, bKeys, comp, i, compareStrings = _compareStrings || compareNSB;
            if (a === undefined) {
                return b === undefined ? 0 : -1;
            }
            if (b === undefined) {
                return a === undefined ? 0 : 1;
            }
            if (a === null) {
                return b === null ? 0 : -1;
            }
            if (b === null) {
                return a === null ? 0 : 1;
            }
            if (typeof a === "number") {
                return typeof b === "number" ? compareNSB(a, b) : -1;
            }
            if (typeof b === "number") {
                return typeof a === "number" ? compareNSB(a, b) : 1;
            }
            if (typeof a === "string") {
                return typeof b === "string" ? compareStrings(a, b) : -1;
            }
            if (typeof b === "string") {
                return typeof a === "string" ? compareStrings(a, b) : 1;
            }
            if (typeof a === "boolean") {
                return typeof b === "boolean" ? compareNSB(a, b) : -1;
            }
            if (typeof b === "boolean") {
                return typeof a === "boolean" ? compareNSB(a, b) : 1;
            }
            if (util.isDate(a)) {
                return util.isDate(b) ? compareNSB(a.getTime(), b.getTime()) : -1;
            }
            if (util.isDate(b)) {
                return util.isDate(a) ? compareNSB(a.getTime(), b.getTime()) : 1;
            }
            if (util.isArray(a)) {
                return util.isArray(b) ? compareArrays(a, b) : -1;
            }
            if (util.isArray(b)) {
                return util.isArray(a) ? compareArrays(a, b) : 1;
            }
            aKeys = Object.keys(a).sort();
            bKeys = Object.keys(b).sort();
            for (i = 0; i < Math.min(aKeys.length, bKeys.length); i += 1) {
                comp = compareThings(a[aKeys[i]], b[bKeys[i]]);
                if (comp !== 0) {
                    return comp;
                }
            }
            return compareNSB(aKeys.length, bKeys.length);
        }
        lastStepModifierFunctions.$set = function(obj, field, value) {
            obj[field] = value;
        };
        lastStepModifierFunctions.$unset = function(obj, field, value) {
            delete obj[field];
        };
        lastStepModifierFunctions.$push = function(obj, field, value) {
            if (!obj.hasOwnProperty(field)) {
                obj[field] = [];
            }
            if (!util.isArray(obj[field])) {
                throw new Error("Can't $push an element on non-array values");
            }
            if (value !== null && typeof value === "object" && value.$slice && value.$each === undefined) {
                value.$each = [];
            }
            if (value !== null && typeof value === "object" && value.$each) {
                if (Object.keys(value).length >= 3 || Object.keys(value).length === 2 && value.$slice === undefined) {
                    throw new Error("Can only use $slice in cunjunction with $each when $push to array");
                }
                if (!util.isArray(value.$each)) {
                    throw new Error("$each requires an array value");
                }
                value.$each.forEach(function(v) {
                    obj[field].push(v);
                });
                if (value.$slice === undefined || typeof value.$slice !== "number") {
                    return;
                }
                if (value.$slice === 0) {
                    obj[field] = [];
                } else {
                    var start, end, n = obj[field].length;
                    if (value.$slice < 0) {
                        start = Math.max(0, n + value.$slice);
                        end = n;
                    } else if (value.$slice > 0) {
                        start = 0;
                        end = Math.min(n, value.$slice);
                    }
                    obj[field] = obj[field].slice(start, end);
                }
            } else {
                obj[field].push(value);
            }
        };
        lastStepModifierFunctions.$addToSet = function(obj, field, value) {
            var addToSet = true;
            if (!obj.hasOwnProperty(field)) {
                obj[field] = [];
            }
            if (!util.isArray(obj[field])) {
                throw new Error("Can't $addToSet an element on non-array values");
            }
            if (value !== null && typeof value === "object" && value.$each) {
                if (Object.keys(value).length > 1) {
                    throw new Error("Can't use another field in conjunction with $each");
                }
                if (!util.isArray(value.$each)) {
                    throw new Error("$each requires an array value");
                }
                value.$each.forEach(function(v) {
                    lastStepModifierFunctions.$addToSet(obj, field, v);
                });
            } else {
                obj[field].forEach(function(v) {
                    if (compareThings(v, value) === 0) {
                        addToSet = false;
                    }
                });
                if (addToSet) {
                    obj[field].push(value);
                }
            }
        };
        lastStepModifierFunctions.$pop = function(obj, field, value) {
            if (!util.isArray(obj[field])) {
                throw new Error("Can't $pop an element from non-array values");
            }
            if (typeof value !== "number") {
                throw new Error(value + " isn't an integer, can't use it with $pop");
            }
            if (value === 0) {
                return;
            }
            if (value > 0) {
                obj[field] = obj[field].slice(0, obj[field].length - 1);
            } else {
                obj[field] = obj[field].slice(1);
            }
        };
        lastStepModifierFunctions.$pull = function(obj, field, value) {
            var arr, i;
            if (!util.isArray(obj[field])) {
                throw new Error("Can't $pull an element from non-array values");
            }
            arr = obj[field];
            for (i = arr.length - 1; i >= 0; i -= 1) {
                if (match(arr[i], value)) {
                    arr.splice(i, 1);
                }
            }
        };
        lastStepModifierFunctions.$inc = function(obj, field, value) {
            if (typeof value !== "number") {
                throw new Error(value + " must be a number");
            }
            if (typeof obj[field] !== "number") {
                if (!_.has(obj, field)) {
                    obj[field] = value;
                } else {
                    throw new Error("Don't use the $inc modifier on non-number fields");
                }
            } else {
                obj[field] += value;
            }
        };
        lastStepModifierFunctions.$max = function(obj, field, value) {
            if (typeof obj[field] === "undefined") {
                obj[field] = value;
            } else if (value > obj[field]) {
                obj[field] = value;
            }
        };
        lastStepModifierFunctions.$min = function(obj, field, value) {
            if (typeof obj[field] === "undefined") {
                obj[field] = value;
            } else if (value < obj[field]) {
                obj[field] = value;
            }
        };
        function createModifierFunction(modifier) {
            return function(obj, field, value) {
                var fieldParts = typeof field === "string" ? field.split(".") : field;
                if (fieldParts.length === 1) {
                    lastStepModifierFunctions[modifier](obj, field, value);
                } else {
                    if (obj[fieldParts[0]] === undefined) {
                        if (modifier === "$unset") {
                            return;
                        }
                        obj[fieldParts[0]] = {};
                    }
                    modifierFunctions[modifier](obj[fieldParts[0]], fieldParts.slice(1), value);
                }
            };
        }
        Object.keys(lastStepModifierFunctions).forEach(function(modifier) {
            modifierFunctions[modifier] = createModifierFunction(modifier);
        });
        function modify(obj, updateQuery) {
            var keys = Object.keys(updateQuery), firstChars = _.map(keys, function(item) {
                return item[0];
            }), dollarFirstChars = _.filter(firstChars, function(c) {
                return c === "$";
            }), newDoc, modifiers;
            if (keys.indexOf("_id") !== -1 && updateQuery._id !== obj._id) {
                throw new Error("You cannot change a document's _id");
            }
            if (dollarFirstChars.length !== 0 && dollarFirstChars.length !== firstChars.length) {
                throw new Error("You cannot mix modifiers and normal fields");
            }
            if (dollarFirstChars.length === 0) {
                newDoc = deepCopy(updateQuery);
                newDoc._id = obj._id;
            } else {
                modifiers = _.uniq(keys);
                newDoc = deepCopy(obj);
                modifiers.forEach(function(m) {
                    var keys;
                    if (!modifierFunctions[m]) {
                        throw new Error("Unknown modifier " + m);
                    }
                    if (typeof updateQuery[m] !== "object") {
                        throw new Error("Modifier " + m + "'s argument must be an object");
                    }
                    keys = Object.keys(updateQuery[m]);
                    keys.forEach(function(k) {
                        modifierFunctions[m](newDoc, k, updateQuery[m][k]);
                    });
                });
            }
            checkObject(newDoc);
            if (obj._id !== newDoc._id) {
                throw new Error("You can't change a document's _id");
            }
            return newDoc;
        }
        function getDotValue(obj, field) {
            var fieldParts = typeof field === "string" ? field.split(".") : field, i, objs;
            if (!obj) {
                return undefined;
            }
            if (fieldParts.length === 0) {
                return obj;
            }
            if (fieldParts.length === 1) {
                return obj[fieldParts[0]];
            }
            if (util.isArray(obj[fieldParts[0]])) {
                i = parseInt(fieldParts[1], 10);
                if (typeof i === "number" && !isNaN(i)) {
                    return getDotValue(obj[fieldParts[0]][i], fieldParts.slice(2));
                }
                objs = new Array();
                for (i = 0; i < obj[fieldParts[0]].length; i += 1) {
                    objs.push(getDotValue(obj[fieldParts[0]][i], fieldParts.slice(1)));
                }
                return objs;
            } else {
                return getDotValue(obj[fieldParts[0]], fieldParts.slice(1));
            }
        }
        function areThingsEqual(a, b) {
            var aKeys, bKeys, i;
            if (a === null || typeof a === "string" || typeof a === "boolean" || typeof a === "number" || b === null || typeof b === "string" || typeof b === "boolean" || typeof b === "number") {
                return a === b;
            }
            if (util.isDate(a) || util.isDate(b)) {
                return util.isDate(a) && util.isDate(b) && a.getTime() === b.getTime();
            }
            if (!(util.isArray(a) && util.isArray(b)) && (util.isArray(a) || util.isArray(b)) || a === undefined || b === undefined) {
                return false;
            }
            try {
                aKeys = Object.keys(a);
                bKeys = Object.keys(b);
            } catch (e) {
                return false;
            }
            if (aKeys.length !== bKeys.length) {
                return false;
            }
            for (i = 0; i < aKeys.length; i += 1) {
                if (bKeys.indexOf(aKeys[i]) === -1) {
                    return false;
                }
                if (!areThingsEqual(a[aKeys[i]], b[aKeys[i]])) {
                    return false;
                }
            }
            return true;
        }
        function areComparable(a, b) {
            if (typeof a !== "string" && typeof a !== "number" && !util.isDate(a) && typeof b !== "string" && typeof b !== "number" && !util.isDate(b)) {
                return false;
            }
            if (typeof a !== typeof b) {
                return false;
            }
            return true;
        }
        comparisonFunctions.$lt = function(a, b) {
            return areComparable(a, b) && a < b;
        };
        comparisonFunctions.$lte = function(a, b) {
            return areComparable(a, b) && a <= b;
        };
        comparisonFunctions.$gt = function(a, b) {
            return areComparable(a, b) && a > b;
        };
        comparisonFunctions.$gte = function(a, b) {
            return areComparable(a, b) && a >= b;
        };
        comparisonFunctions.$ne = function(a, b) {
            if (a === undefined) {
                return true;
            }
            return !areThingsEqual(a, b);
        };
        comparisonFunctions.$in = function(a, b) {
            var i;
            if (!util.isArray(b)) {
                throw new Error("$in operator called with a non-array");
            }
            for (i = 0; i < b.length; i += 1) {
                if (areThingsEqual(a, b[i])) {
                    return true;
                }
            }
            return false;
        };
        comparisonFunctions.$nin = function(a, b) {
            if (!util.isArray(b)) {
                throw new Error("$nin operator called with a non-array");
            }
            return !comparisonFunctions.$in(a, b);
        };
        comparisonFunctions.$regex = function(a, b) {
            if (!util.isRegExp(b)) {
                throw new Error("$regex operator called with non regular expression");
            }
            if (typeof a !== "string") {
                return false;
            } else {
                return b.test(a);
            }
        };
        comparisonFunctions.$exists = function(value, exists) {
            if (exists || exists === "") {
                exists = true;
            } else {
                exists = false;
            }
            if (value === undefined) {
                return !exists;
            } else {
                return exists;
            }
        };
        comparisonFunctions.$size = function(obj, value) {
            if (!util.isArray(obj)) {
                return false;
            }
            if (value % 1 !== 0) {
                throw new Error("$size operator called without an integer");
            }
            return obj.length == value;
        };
        comparisonFunctions.$elemMatch = function(obj, value) {
            if (!util.isArray(obj)) {
                return false;
            }
            var i = obj.length;
            var result = false;
            while (i--) {
                if (match(obj[i], value)) {
                    result = true;
                    break;
                }
            }
            return result;
        };
        arrayComparisonFunctions.$size = true;
        arrayComparisonFunctions.$elemMatch = true;
        logicalOperators.$or = function(obj, query) {
            var i;
            if (!util.isArray(query)) {
                throw new Error("$or operator used without an array");
            }
            for (i = 0; i < query.length; i += 1) {
                if (match(obj, query[i])) {
                    return true;
                }
            }
            return false;
        };
        logicalOperators.$and = function(obj, query) {
            var i;
            if (!util.isArray(query)) {
                throw new Error("$and operator used without an array");
            }
            for (i = 0; i < query.length; i += 1) {
                if (!match(obj, query[i])) {
                    return false;
                }
            }
            return true;
        };
        logicalOperators.$not = function(obj, query) {
            return !match(obj, query);
        };
        logicalOperators.$where = function(obj, fn) {
            var result;
            if (!_.isFunction(fn)) {
                throw new Error("$where operator used without a function");
            }
            result = fn.call(obj);
            if (!_.isBoolean(result)) {
                throw new Error("$where function must return boolean");
            }
            return result;
        };
        function match(obj, query) {
            var queryKeys, queryKey, queryValue, i;
            if (isPrimitiveType(obj) || isPrimitiveType(query)) {
                return matchQueryPart({
                    needAKey: obj
                }, "needAKey", query);
            }
            queryKeys = Object.keys(query);
            for (i = 0; i < queryKeys.length; i += 1) {
                queryKey = queryKeys[i];
                queryValue = query[queryKey];
                if (queryKey[0] === "$") {
                    if (!logicalOperators[queryKey]) {
                        throw new Error("Unknown logical operator " + queryKey);
                    }
                    if (!logicalOperators[queryKey](obj, queryValue)) {
                        return false;
                    }
                } else {
                    if (!matchQueryPart(obj, queryKey, queryValue)) {
                        return false;
                    }
                }
            }
            return true;
        }
        function matchQueryPart(obj, queryKey, queryValue, treatObjAsValue) {
            var objValue = getDotValue(obj, queryKey), i, keys, firstChars, dollarFirstChars;
            if (util.isArray(objValue) && !treatObjAsValue) {
                if (util.isArray(queryValue)) {
                    return matchQueryPart(obj, queryKey, queryValue, true);
                }
                if (queryValue !== null && typeof queryValue === "object" && !util.isRegExp(queryValue)) {
                    keys = Object.keys(queryValue);
                    for (i = 0; i < keys.length; i += 1) {
                        if (arrayComparisonFunctions[keys[i]]) {
                            return matchQueryPart(obj, queryKey, queryValue, true);
                        }
                    }
                }
                for (i = 0; i < objValue.length; i += 1) {
                    if (matchQueryPart({
                        k: objValue[i]
                    }, "k", queryValue)) {
                        return true;
                    }
                }
                return false;
            }
            if (queryValue !== null && typeof queryValue === "object" && !util.isRegExp(queryValue) && !util.isArray(queryValue)) {
                keys = Object.keys(queryValue);
                firstChars = _.map(keys, function(item) {
                    return item[0];
                });
                dollarFirstChars = _.filter(firstChars, function(c) {
                    return c === "$";
                });
                if (dollarFirstChars.length !== 0 && dollarFirstChars.length !== firstChars.length) {
                    throw new Error("You cannot mix operators and normal fields");
                }
                if (dollarFirstChars.length > 0) {
                    for (i = 0; i < keys.length; i += 1) {
                        if (!comparisonFunctions[keys[i]]) {
                            throw new Error("Unknown comparison function " + keys[i]);
                        }
                        if (!comparisonFunctions[keys[i]](objValue, queryValue[keys[i]])) {
                            return false;
                        }
                    }
                    return true;
                }
            }
            if (util.isRegExp(queryValue)) {
                return comparisonFunctions.$regex(objValue, queryValue);
            }
            if (!areThingsEqual(objValue, queryValue)) {
                return false;
            }
            return true;
        }
        module.exports.serialize = serialize;
        module.exports.deserialize = deserialize;
        module.exports.deepCopy = deepCopy;
        module.exports.checkObject = checkObject;
        module.exports.isPrimitiveType = isPrimitiveType;
        module.exports.modify = modify;
        module.exports.getDotValue = getDotValue;
        module.exports.match = match;
        module.exports.areThingsEqual = areThingsEqual;
        module.exports.compareThings = compareThings;
    }, {
        underscore: 20,
        util: 23
    } ],
    16: [ function(require, module, exports) {
        (function(process) {
            var storage = require("./storage"), path = require("path"), model = require("./model"), async = require("async"), customUtils = require("./customUtils"), Index = require("./indexes");
            if (storage.forage && storage.forage.supports("asyncStorage")) {
                model.serialize = function(d) {
                    return d;
                };
                oldDeserialize = model.deserialize;
                model.deserialize = function(d) {
                    if (typeof d == "string") {
                        return oldDeserialize(d);
                    }
                    return d;
                };
                if (storage) {
                    model.noSerialize = true;
                    storage.setNoSerialize(true);
                }
            }
            function Persistence(options) {
                var i, j, randomString;
                this.db = options.db;
                this.inMemoryOnly = this.db.inMemoryOnly;
                this.filename = this.db.filename;
                this.corruptAlertThreshold = options.corruptAlertThreshold !== undefined ? options.corruptAlertThreshold : .1;
                if (!this.inMemoryOnly && this.filename && this.filename.charAt(this.filename.length - 1) === "~") {
                    throw new Error("The datafile name can't end with a ~, which is reserved for crash safe backup files");
                }
                if (options.afterSerialization && !options.beforeDeserialization) {
                    throw new Error("Serialization hook defined but deserialization hook undefined, cautiously refusing to start NeDB to prevent dataloss");
                }
                if (!options.afterSerialization && options.beforeDeserialization) {
                    throw new Error("Serialization hook undefined but deserialization hook defined, cautiously refusing to start NeDB to prevent dataloss");
                }
                this.afterSerialization = options.afterSerialization || function(s) {
                    return s;
                };
                this.beforeDeserialization = options.beforeDeserialization || function(s) {
                    return s;
                };
                for (i = 1; i < 30; i += 1) {
                    for (j = 0; j < 10; j += 1) {
                        randomString = customUtils.uid(i);
                        if (this.beforeDeserialization(this.afterSerialization(randomString)) !== randomString) {
                            throw new Error("beforeDeserialization is not the reverse of afterSerialization, cautiously refusing to start NeDB to prevent dataloss");
                        }
                    }
                }
                if (this.filename && options.nodeWebkitAppName) {
                    console.log("==================================================================");
                    console.log("WARNING: The nodeWebkitAppName option is deprecated");
                    console.log("To get the path to the directory where Node Webkit stores the data");
                    console.log("for your app, use the internal nw.gui module like this");
                    console.log("require('nw.gui').App.dataPath");
                    console.log("See https://github.com/rogerwang/node-webkit/issues/500");
                    console.log("==================================================================");
                    this.filename = Persistence.getNWAppFilename(options.nodeWebkitAppName, this.filename);
                }
            }
            Persistence.ensureDirectoryExists = function(dir, cb) {
                var callback = cb || function() {};
                storage.mkdirp(dir, function(err) {
                    return callback(err);
                });
            };
            Persistence.getNWAppFilename = function(appName, relativeFilename) {
                var home;
                switch (process.platform) {
                  case "win32":
                  case "win64":
                    home = process.env.LOCALAPPDATA || process.env.APPDATA;
                    if (!home) {
                        throw new Error("Couldn't find the base application data folder");
                    }
                    home = path.join(home, appName);
                    break;

                  case "darwin":
                    home = process.env.HOME;
                    if (!home) {
                        throw new Error("Couldn't find the base application data directory");
                    }
                    home = path.join(home, "Library", "Application Support", appName);
                    break;

                  case "linux":
                    home = process.env.HOME;
                    if (!home) {
                        throw new Error("Couldn't find the base application data directory");
                    }
                    home = path.join(home, ".config", appName);
                    break;

                  default:
                    throw new Error("Can't use the Node Webkit relative path for platform " + process.platform);
                    break;
                }
                return path.join(home, "nedb-data", relativeFilename);
            };
            Persistence.prototype.addToPersist = function(persist, data) {
                if (model.noSerialize) {
                    persist.push(data);
                } else {
                    persist += data + "\n";
                }
                return persist;
            };
            Persistence.prototype.persistCachedDatabase = function(cb) {
                var callback = cb || function() {}, toPersist = "", self = this;
                if (this.inMemoryOnly) {
                    return callback(null);
                }
                if (!!model.noSerialize) {
                    toPersist = [];
                }
                this.db.getAllData().forEach(function(doc) {
                    toPersist = self.addToPersist(toPersist, self.afterSerialization(model.serialize(doc)));
                });
                Object.keys(this.db.indexes).forEach(function(fieldName) {
                    if (fieldName != "_id") {
                        toPersist = self.addToPersist(toPersist, self.afterSerialization(model.serialize({
                            $$indexCreated: {
                                fieldName: fieldName,
                                unique: self.db.indexes[fieldName].unique,
                                sparse: self.db.indexes[fieldName].sparse
                            }
                        })));
                    }
                });
                storage.crashSafeWriteFile(this.filename, toPersist, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    self.db.emit("compaction.done");
                    return callback(null);
                });
            };
            Persistence.prototype.compactDatafile = function() {
                this.db.executor.push({
                    this: this,
                    fn: this.persistCachedDatabase,
                    arguments: []
                });
            };
            Persistence.prototype.setAutocompactionInterval = function(interval) {
                var self = this, minInterval = 5e3, realInterval = Math.max(interval || 0, minInterval);
                this.stopAutocompaction();
                this.autocompactionIntervalId = setInterval(function() {
                    self.compactDatafile();
                }, realInterval);
            };
            Persistence.prototype.stopAutocompaction = function() {
                if (this.autocompactionIntervalId) {
                    clearInterval(this.autocompactionIntervalId);
                }
            };
            Persistence.prototype.persistNewState = function(newDocs, cb) {
                var self = this, toPersist = "", callback = cb || function() {};
                if (self.inMemoryOnly) {
                    return callback(null);
                }
                if (!!model.noSerialize) {
                    toPersist = [];
                }
                newDocs.forEach(function(doc) {
                    toPersist = self.addToPersist(toPersist, self.afterSerialization(model.serialize(doc)));
                });
                if (toPersist.length === 0) {
                    return callback(null);
                }
                storage.appendFile(self.filename, toPersist, "utf8", function(err) {
                    return callback(err);
                });
            };
            Persistence.prototype.split = function(data) {
                if (model.noSerialize) {
                    if (typeof data == "string") {
                        return data.split("\n");
                    }
                    return data;
                }
                if (typeof data == "string") {
                    return data.split("\n");
                }
                return data;
            };
            Persistence.prototype.treatRawData = function(rawData) {
                var data = this.split(rawData), dataById = {}, tdata = [], i, indexes = {}, corruptItems = -1;
                for (i = 0; i < data.length; i += 1) {
                    var doc;
                    try {
                        doc = model.deserialize(this.beforeDeserialization(data[i]));
                        if (doc._id) {
                            if (doc.$$deleted === true) {
                                delete dataById[doc._id];
                            } else {
                                dataById[doc._id] = doc;
                            }
                        } else if (doc.$$indexCreated && doc.$$indexCreated.fieldName != undefined) {
                            indexes[doc.$$indexCreated.fieldName] = doc.$$indexCreated;
                        } else if (typeof doc.$$indexRemoved === "string") {
                            delete indexes[doc.$$indexRemoved];
                        }
                    } catch (e) {
                        corruptItems += 1;
                    }
                }
                if (data.length > 0 && corruptItems / data.length > this.corruptAlertThreshold) {
                    throw new Error("More than " + Math.floor(100 * this.corruptAlertThreshold) + "% of the data file is corrupt, the wrong beforeDeserialization hook may be used. Cautiously refusing to start NeDB to prevent dataloss");
                }
                Object.keys(dataById).forEach(function(k) {
                    tdata.push(dataById[k]);
                });
                return {
                    data: tdata,
                    indexes: indexes
                };
            };
            Persistence.prototype.loadDatabase = function(cb) {
                var callback = cb || function() {}, self = this;
                self.db.resetIndexes();
                if (self.inMemoryOnly) {
                    return callback(null);
                }
                async.waterfall([ function(cb) {
                    Persistence.ensureDirectoryExists(path.dirname(self.filename), function(err) {
                        storage.ensureDatafileIntegrity(self.filename, function(err) {
                            storage.readFile(self.filename, "utf8", function(err, rawData) {
                                if (err) {
                                    return cb(err);
                                }
                                try {
                                    var treatedData = self.treatRawData(rawData);
                                } catch (e) {
                                    return cb(e);
                                }
                                Object.keys(treatedData.indexes).forEach(function(key) {
                                    self.db.indexes[key] = new Index(treatedData.indexes[key]);
                                });
                                try {
                                    self.db.resetIndexes(treatedData.data);
                                } catch (e) {
                                    self.db.resetIndexes();
                                    return cb(e);
                                }
                                self.db.persistence.persistCachedDatabase(cb);
                            });
                        });
                    });
                } ], function(err) {
                    if (err) {
                        return callback(err);
                    }
                    self.db.executor.processBuffer();
                    return callback(null);
                });
            };
            module.exports = Persistence;
        }).call(this, require("_process"));
    }, {
        "./customUtils": 8,
        "./indexes": 14,
        "./model": 15,
        "./storage": 9,
        _process: 18,
        async: 1,
        path: 17
    } ],
    17: [ function(require, module, exports) {
        (function(process) {
            function normalizeArray(parts, allowAboveRoot) {
                var up = 0;
                for (var i = parts.length - 1; i >= 0; i--) {
                    var last = parts[i];
                    if (last === ".") {
                        parts.splice(i, 1);
                    } else if (last === "..") {
                        parts.splice(i, 1);
                        up++;
                    } else if (up) {
                        parts.splice(i, 1);
                        up--;
                    }
                }
                if (allowAboveRoot) {
                    for (;up--; up) {
                        parts.unshift("..");
                    }
                }
                return parts;
            }
            var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
            var splitPath = function(filename) {
                return splitPathRe.exec(filename).slice(1);
            };
            exports.resolve = function() {
                var resolvedPath = "", resolvedAbsolute = false;
                for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                    var path = i >= 0 ? arguments[i] : process.cwd();
                    if (typeof path !== "string") {
                        throw new TypeError("Arguments to path.resolve must be strings");
                    } else if (!path) {
                        continue;
                    }
                    resolvedPath = path + "/" + resolvedPath;
                    resolvedAbsolute = path.charAt(0) === "/";
                }
                resolvedPath = normalizeArray(filter(resolvedPath.split("/"), function(p) {
                    return !!p;
                }), !resolvedAbsolute).join("/");
                return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
            };
            exports.normalize = function(path) {
                var isAbsolute = exports.isAbsolute(path), trailingSlash = substr(path, -1) === "/";
                path = normalizeArray(filter(path.split("/"), function(p) {
                    return !!p;
                }), !isAbsolute).join("/");
                if (!path && !isAbsolute) {
                    path = ".";
                }
                if (path && trailingSlash) {
                    path += "/";
                }
                return (isAbsolute ? "/" : "") + path;
            };
            exports.isAbsolute = function(path) {
                return path.charAt(0) === "/";
            };
            exports.join = function() {
                var paths = Array.prototype.slice.call(arguments, 0);
                return exports.normalize(filter(paths, function(p, index) {
                    if (typeof p !== "string") {
                        throw new TypeError("Arguments to path.join must be strings");
                    }
                    return p;
                }).join("/"));
            };
            exports.relative = function(from, to) {
                from = exports.resolve(from).substr(1);
                to = exports.resolve(to).substr(1);
                function trim(arr) {
                    var start = 0;
                    for (;start < arr.length; start++) {
                        if (arr[start] !== "") break;
                    }
                    var end = arr.length - 1;
                    for (;end >= 0; end--) {
                        if (arr[end] !== "") break;
                    }
                    if (start > end) return [];
                    return arr.slice(start, end - start + 1);
                }
                var fromParts = trim(from.split("/"));
                var toParts = trim(to.split("/"));
                var length = Math.min(fromParts.length, toParts.length);
                var samePartsLength = length;
                for (var i = 0; i < length; i++) {
                    if (fromParts[i] !== toParts[i]) {
                        samePartsLength = i;
                        break;
                    }
                }
                var outputParts = [];
                for (var i = samePartsLength; i < fromParts.length; i++) {
                    outputParts.push("..");
                }
                outputParts = outputParts.concat(toParts.slice(samePartsLength));
                return outputParts.join("/");
            };
            exports.sep = "/";
            exports.delimiter = ":";
            exports.dirname = function(path) {
                var result = splitPath(path), root = result[0], dir = result[1];
                if (!root && !dir) {
                    return ".";
                }
                if (dir) {
                    dir = dir.substr(0, dir.length - 1);
                }
                return root + dir;
            };
            exports.basename = function(path, ext) {
                var f = splitPath(path)[2];
                if (ext && f.substr(-1 * ext.length) === ext) {
                    f = f.substr(0, f.length - ext.length);
                }
                return f;
            };
            exports.extname = function(path) {
                return splitPath(path)[3];
            };
            function filter(xs, f) {
                if (xs.filter) return xs.filter(f);
                var res = [];
                for (var i = 0; i < xs.length; i++) {
                    if (f(xs[i], i, xs)) res.push(xs[i]);
                }
                return res;
            }
            var substr = "ab".substr(-1) === "b" ? function(str, start, len) {
                return str.substr(start, len);
            } : function(str, start, len) {
                if (start < 0) start = str.length + start;
                return str.substr(start, len);
            };
        }).call(this, require("_process"));
    }, {
        _process: 18
    } ],
    18: [ function(require, module, exports) {
        var process = module.exports = {};
        var cachedSetTimeout;
        var cachedClearTimeout;
        function defaultSetTimout() {
            throw new Error("setTimeout has not been defined");
        }
        function defaultClearTimeout() {
            throw new Error("clearTimeout has not been defined");
        }
        (function() {
            try {
                if (typeof setTimeout === "function") {
                    cachedSetTimeout = setTimeout;
                } else {
                    cachedSetTimeout = defaultSetTimout;
                }
            } catch (e) {
                cachedSetTimeout = defaultSetTimout;
            }
            try {
                if (typeof clearTimeout === "function") {
                    cachedClearTimeout = clearTimeout;
                } else {
                    cachedClearTimeout = defaultClearTimeout;
                }
            } catch (e) {
                cachedClearTimeout = defaultClearTimeout;
            }
        })();
        function runTimeout(fun) {
            if (cachedSetTimeout === setTimeout) {
                return setTimeout(fun, 0);
            }
            if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                cachedSetTimeout = setTimeout;
                return setTimeout(fun, 0);
            }
            try {
                return cachedSetTimeout(fun, 0);
            } catch (e) {
                try {
                    return cachedSetTimeout.call(null, fun, 0);
                } catch (e) {
                    return cachedSetTimeout.call(this, fun, 0);
                }
            }
        }
        function runClearTimeout(marker) {
            if (cachedClearTimeout === clearTimeout) {
                return clearTimeout(marker);
            }
            if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                cachedClearTimeout = clearTimeout;
                return clearTimeout(marker);
            }
            try {
                return cachedClearTimeout(marker);
            } catch (e) {
                try {
                    return cachedClearTimeout.call(null, marker);
                } catch (e) {
                    return cachedClearTimeout.call(this, marker);
                }
            }
        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;
        function cleanUpNextTick() {
            if (!draining || !currentQueue) {
                return;
            }
            draining = false;
            if (currentQueue.length) {
                queue = currentQueue.concat(queue);
            } else {
                queueIndex = -1;
            }
            if (queue.length) {
                drainQueue();
            }
        }
        function drainQueue() {
            if (draining) {
                return;
            }
            var timeout = runTimeout(cleanUpNextTick);
            draining = true;
            var len = queue.length;
            while (len) {
                currentQueue = queue;
                queue = [];
                while (++queueIndex < len) {
                    if (currentQueue) {
                        currentQueue[queueIndex].run();
                    }
                }
                queueIndex = -1;
                len = queue.length;
            }
            currentQueue = null;
            draining = false;
            runClearTimeout(timeout);
        }
        process.nextTick = function(fun) {
            var args = new Array(arguments.length - 1);
            if (arguments.length > 1) {
                for (var i = 1; i < arguments.length; i++) {
                    args[i - 1] = arguments[i];
                }
            }
            queue.push(new Item(fun, args));
            if (queue.length === 1 && !draining) {
                runTimeout(drainQueue);
            }
        };
        function Item(fun, array) {
            this.fun = fun;
            this.array = array;
        }
        Item.prototype.run = function() {
            this.fun.apply(null, this.array);
        };
        process.title = "browser";
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = "";
        process.versions = {};
        function noop() {}
        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;
        process.prependListener = noop;
        process.prependOnceListener = noop;
        process.listeners = function(name) {
            return [];
        };
        process.binding = function(name) {
            throw new Error("process.binding is not supported");
        };
        process.cwd = function() {
            return "/";
        };
        process.chdir = function(dir) {
            throw new Error("process.chdir is not supported");
        };
        process.umask = function() {
            return 0;
        };
    }, {} ],
    19: [ function(require, module, exports) {
        (function(setImmediate, clearImmediate) {
            var nextTick = require("process/browser.js").nextTick;
            var apply = Function.prototype.apply;
            var slice = Array.prototype.slice;
            var immediateIds = {};
            var nextImmediateId = 0;
            exports.setTimeout = function() {
                return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
            };
            exports.setInterval = function() {
                return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
            };
            exports.clearTimeout = exports.clearInterval = function(timeout) {
                timeout.close();
            };
            function Timeout(id, clearFn) {
                this._id = id;
                this._clearFn = clearFn;
            }
            Timeout.prototype.unref = Timeout.prototype.ref = function() {};
            Timeout.prototype.close = function() {
                this._clearFn.call(window, this._id);
            };
            exports.enroll = function(item, msecs) {
                clearTimeout(item._idleTimeoutId);
                item._idleTimeout = msecs;
            };
            exports.unenroll = function(item) {
                clearTimeout(item._idleTimeoutId);
                item._idleTimeout = -1;
            };
            exports._unrefActive = exports.active = function(item) {
                clearTimeout(item._idleTimeoutId);
                var msecs = item._idleTimeout;
                if (msecs >= 0) {
                    item._idleTimeoutId = setTimeout(function onTimeout() {
                        if (item._onTimeout) item._onTimeout();
                    }, msecs);
                }
            };
            exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
                var id = nextImmediateId++;
                var args = arguments.length < 2 ? false : slice.call(arguments, 1);
                immediateIds[id] = true;
                nextTick(function onNextTick() {
                    if (immediateIds[id]) {
                        if (args) {
                            fn.apply(null, args);
                        } else {
                            fn.call(null);
                        }
                        exports.clearImmediate(id);
                    }
                });
                return id;
            };
            exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
                delete immediateIds[id];
            };
        }).call(this, require("timers").setImmediate, require("timers").clearImmediate);
    }, {
        "process/browser.js": 18,
        timers: 19
    } ],
    20: [ function(require, module, exports) {
        (function() {
            var root = this;
            var previousUnderscore = root._;
            var breaker = {};
            var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
            var push = ArrayProto.push, slice = ArrayProto.slice, concat = ArrayProto.concat, toString = ObjProto.toString, hasOwnProperty = ObjProto.hasOwnProperty;
            var nativeForEach = ArrayProto.forEach, nativeMap = ArrayProto.map, nativeReduce = ArrayProto.reduce, nativeReduceRight = ArrayProto.reduceRight, nativeFilter = ArrayProto.filter, nativeEvery = ArrayProto.every, nativeSome = ArrayProto.some, nativeIndexOf = ArrayProto.indexOf, nativeLastIndexOf = ArrayProto.lastIndexOf, nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeBind = FuncProto.bind;
            var _ = function(obj) {
                if (obj instanceof _) return obj;
                if (!(this instanceof _)) return new _(obj);
                this._wrapped = obj;
            };
            if (typeof exports !== "undefined") {
                if (typeof module !== "undefined" && module.exports) {
                    exports = module.exports = _;
                }
                exports._ = _;
            } else {
                root._ = _;
            }
            _.VERSION = "1.4.4";
            var each = _.each = _.forEach = function(obj, iterator, context) {
                if (obj == null) return;
                if (nativeForEach && obj.forEach === nativeForEach) {
                    obj.forEach(iterator, context);
                } else if (obj.length === +obj.length) {
                    for (var i = 0, l = obj.length; i < l; i++) {
                        if (iterator.call(context, obj[i], i, obj) === breaker) return;
                    }
                } else {
                    for (var key in obj) {
                        if (_.has(obj, key)) {
                            if (iterator.call(context, obj[key], key, obj) === breaker) return;
                        }
                    }
                }
            };
            _.map = _.collect = function(obj, iterator, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
                each(obj, function(value, index, list) {
                    results[results.length] = iterator.call(context, value, index, list);
                });
                return results;
            };
            var reduceError = "Reduce of empty array with no initial value";
            _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
                var initial = arguments.length > 2;
                if (obj == null) obj = [];
                if (nativeReduce && obj.reduce === nativeReduce) {
                    if (context) iterator = _.bind(iterator, context);
                    return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
                }
                each(obj, function(value, index, list) {
                    if (!initial) {
                        memo = value;
                        initial = true;
                    } else {
                        memo = iterator.call(context, memo, value, index, list);
                    }
                });
                if (!initial) throw new TypeError(reduceError);
                return memo;
            };
            _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
                var initial = arguments.length > 2;
                if (obj == null) obj = [];
                if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
                    if (context) iterator = _.bind(iterator, context);
                    return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
                }
                var length = obj.length;
                if (length !== +length) {
                    var keys = _.keys(obj);
                    length = keys.length;
                }
                each(obj, function(value, index, list) {
                    index = keys ? keys[--length] : --length;
                    if (!initial) {
                        memo = obj[index];
                        initial = true;
                    } else {
                        memo = iterator.call(context, memo, obj[index], index, list);
                    }
                });
                if (!initial) throw new TypeError(reduceError);
                return memo;
            };
            _.find = _.detect = function(obj, iterator, context) {
                var result;
                any(obj, function(value, index, list) {
                    if (iterator.call(context, value, index, list)) {
                        result = value;
                        return true;
                    }
                });
                return result;
            };
            _.filter = _.select = function(obj, iterator, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
                each(obj, function(value, index, list) {
                    if (iterator.call(context, value, index, list)) results[results.length] = value;
                });
                return results;
            };
            _.reject = function(obj, iterator, context) {
                return _.filter(obj, function(value, index, list) {
                    return !iterator.call(context, value, index, list);
                }, context);
            };
            _.every = _.all = function(obj, iterator, context) {
                iterator || (iterator = _.identity);
                var result = true;
                if (obj == null) return result;
                if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
                each(obj, function(value, index, list) {
                    if (!(result = result && iterator.call(context, value, index, list))) return breaker;
                });
                return !!result;
            };
            var any = _.some = _.any = function(obj, iterator, context) {
                iterator || (iterator = _.identity);
                var result = false;
                if (obj == null) return result;
                if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
                each(obj, function(value, index, list) {
                    if (result || (result = iterator.call(context, value, index, list))) return breaker;
                });
                return !!result;
            };
            _.contains = _.include = function(obj, target) {
                if (obj == null) return false;
                if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
                return any(obj, function(value) {
                    return value === target;
                });
            };
            _.invoke = function(obj, method) {
                var args = slice.call(arguments, 2);
                var isFunc = _.isFunction(method);
                return _.map(obj, function(value) {
                    return (isFunc ? method : value[method]).apply(value, args);
                });
            };
            _.pluck = function(obj, key) {
                return _.map(obj, function(value) {
                    return value[key];
                });
            };
            _.where = function(obj, attrs, first) {
                if (_.isEmpty(attrs)) return first ? null : [];
                return _[first ? "find" : "filter"](obj, function(value) {
                    for (var key in attrs) {
                        if (attrs[key] !== value[key]) return false;
                    }
                    return true;
                });
            };
            _.findWhere = function(obj, attrs) {
                return _.where(obj, attrs, true);
            };
            _.max = function(obj, iterator, context) {
                if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
                    return Math.max.apply(Math, obj);
                }
                if (!iterator && _.isEmpty(obj)) return -Infinity;
                var result = {
                    computed: -Infinity,
                    value: -Infinity
                };
                each(obj, function(value, index, list) {
                    var computed = iterator ? iterator.call(context, value, index, list) : value;
                    computed >= result.computed && (result = {
                        value: value,
                        computed: computed
                    });
                });
                return result.value;
            };
            _.min = function(obj, iterator, context) {
                if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
                    return Math.min.apply(Math, obj);
                }
                if (!iterator && _.isEmpty(obj)) return Infinity;
                var result = {
                    computed: Infinity,
                    value: Infinity
                };
                each(obj, function(value, index, list) {
                    var computed = iterator ? iterator.call(context, value, index, list) : value;
                    computed < result.computed && (result = {
                        value: value,
                        computed: computed
                    });
                });
                return result.value;
            };
            _.shuffle = function(obj) {
                var rand;
                var index = 0;
                var shuffled = [];
                each(obj, function(value) {
                    rand = _.random(index++);
                    shuffled[index - 1] = shuffled[rand];
                    shuffled[rand] = value;
                });
                return shuffled;
            };
            var lookupIterator = function(value) {
                return _.isFunction(value) ? value : function(obj) {
                    return obj[value];
                };
            };
            _.sortBy = function(obj, value, context) {
                var iterator = lookupIterator(value);
                return _.pluck(_.map(obj, function(value, index, list) {
                    return {
                        value: value,
                        index: index,
                        criteria: iterator.call(context, value, index, list)
                    };
                }).sort(function(left, right) {
                    var a = left.criteria;
                    var b = right.criteria;
                    if (a !== b) {
                        if (a > b || a === void 0) return 1;
                        if (a < b || b === void 0) return -1;
                    }
                    return left.index < right.index ? -1 : 1;
                }), "value");
            };
            var group = function(obj, value, context, behavior) {
                var result = {};
                var iterator = lookupIterator(value || _.identity);
                each(obj, function(value, index) {
                    var key = iterator.call(context, value, index, obj);
                    behavior(result, key, value);
                });
                return result;
            };
            _.groupBy = function(obj, value, context) {
                return group(obj, value, context, function(result, key, value) {
                    (_.has(result, key) ? result[key] : result[key] = []).push(value);
                });
            };
            _.countBy = function(obj, value, context) {
                return group(obj, value, context, function(result, key) {
                    if (!_.has(result, key)) result[key] = 0;
                    result[key]++;
                });
            };
            _.sortedIndex = function(array, obj, iterator, context) {
                iterator = iterator == null ? _.identity : lookupIterator(iterator);
                var value = iterator.call(context, obj);
                var low = 0, high = array.length;
                while (low < high) {
                    var mid = low + high >>> 1;
                    iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
                }
                return low;
            };
            _.toArray = function(obj) {
                if (!obj) return [];
                if (_.isArray(obj)) return slice.call(obj);
                if (obj.length === +obj.length) return _.map(obj, _.identity);
                return _.values(obj);
            };
            _.size = function(obj) {
                if (obj == null) return 0;
                return obj.length === +obj.length ? obj.length : _.keys(obj).length;
            };
            _.first = _.head = _.take = function(array, n, guard) {
                if (array == null) return void 0;
                return n != null && !guard ? slice.call(array, 0, n) : array[0];
            };
            _.initial = function(array, n, guard) {
                return slice.call(array, 0, array.length - (n == null || guard ? 1 : n));
            };
            _.last = function(array, n, guard) {
                if (array == null) return void 0;
                if (n != null && !guard) {
                    return slice.call(array, Math.max(array.length - n, 0));
                } else {
                    return array[array.length - 1];
                }
            };
            _.rest = _.tail = _.drop = function(array, n, guard) {
                return slice.call(array, n == null || guard ? 1 : n);
            };
            _.compact = function(array) {
                return _.filter(array, _.identity);
            };
            var flatten = function(input, shallow, output) {
                each(input, function(value) {
                    if (_.isArray(value)) {
                        shallow ? push.apply(output, value) : flatten(value, shallow, output);
                    } else {
                        output.push(value);
                    }
                });
                return output;
            };
            _.flatten = function(array, shallow) {
                return flatten(array, shallow, []);
            };
            _.without = function(array) {
                return _.difference(array, slice.call(arguments, 1));
            };
            _.uniq = _.unique = function(array, isSorted, iterator, context) {
                if (_.isFunction(isSorted)) {
                    context = iterator;
                    iterator = isSorted;
                    isSorted = false;
                }
                var initial = iterator ? _.map(array, iterator, context) : array;
                var results = [];
                var seen = [];
                each(initial, function(value, index) {
                    if (isSorted ? !index || seen[seen.length - 1] !== value : !_.contains(seen, value)) {
                        seen.push(value);
                        results.push(array[index]);
                    }
                });
                return results;
            };
            _.union = function() {
                return _.uniq(concat.apply(ArrayProto, arguments));
            };
            _.intersection = function(array) {
                var rest = slice.call(arguments, 1);
                return _.filter(_.uniq(array), function(item) {
                    return _.every(rest, function(other) {
                        return _.indexOf(other, item) >= 0;
                    });
                });
            };
            _.difference = function(array) {
                var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
                return _.filter(array, function(value) {
                    return !_.contains(rest, value);
                });
            };
            _.zip = function() {
                var args = slice.call(arguments);
                var length = _.max(_.pluck(args, "length"));
                var results = new Array(length);
                for (var i = 0; i < length; i++) {
                    results[i] = _.pluck(args, "" + i);
                }
                return results;
            };
            _.object = function(list, values) {
                if (list == null) return {};
                var result = {};
                for (var i = 0, l = list.length; i < l; i++) {
                    if (values) {
                        result[list[i]] = values[i];
                    } else {
                        result[list[i][0]] = list[i][1];
                    }
                }
                return result;
            };
            _.indexOf = function(array, item, isSorted) {
                if (array == null) return -1;
                var i = 0, l = array.length;
                if (isSorted) {
                    if (typeof isSorted == "number") {
                        i = isSorted < 0 ? Math.max(0, l + isSorted) : isSorted;
                    } else {
                        i = _.sortedIndex(array, item);
                        return array[i] === item ? i : -1;
                    }
                }
                if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
                for (;i < l; i++) if (array[i] === item) return i;
                return -1;
            };
            _.lastIndexOf = function(array, item, from) {
                if (array == null) return -1;
                var hasIndex = from != null;
                if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
                    return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
                }
                var i = hasIndex ? from : array.length;
                while (i--) if (array[i] === item) return i;
                return -1;
            };
            _.range = function(start, stop, step) {
                if (arguments.length <= 1) {
                    stop = start || 0;
                    start = 0;
                }
                step = arguments[2] || 1;
                var len = Math.max(Math.ceil((stop - start) / step), 0);
                var idx = 0;
                var range = new Array(len);
                while (idx < len) {
                    range[idx++] = start;
                    start += step;
                }
                return range;
            };
            _.bind = function(func, context) {
                if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                var args = slice.call(arguments, 2);
                return function() {
                    return func.apply(context, args.concat(slice.call(arguments)));
                };
            };
            _.partial = function(func) {
                var args = slice.call(arguments, 1);
                return function() {
                    return func.apply(this, args.concat(slice.call(arguments)));
                };
            };
            _.bindAll = function(obj) {
                var funcs = slice.call(arguments, 1);
                if (funcs.length === 0) funcs = _.functions(obj);
                each(funcs, function(f) {
                    obj[f] = _.bind(obj[f], obj);
                });
                return obj;
            };
            _.memoize = function(func, hasher) {
                var memo = {};
                hasher || (hasher = _.identity);
                return function() {
                    var key = hasher.apply(this, arguments);
                    return _.has(memo, key) ? memo[key] : memo[key] = func.apply(this, arguments);
                };
            };
            _.delay = function(func, wait) {
                var args = slice.call(arguments, 2);
                return setTimeout(function() {
                    return func.apply(null, args);
                }, wait);
            };
            _.defer = function(func) {
                return _.delay.apply(_, [ func, 1 ].concat(slice.call(arguments, 1)));
            };
            _.throttle = function(func, wait) {
                var context, args, timeout, result;
                var previous = 0;
                var later = function() {
                    previous = new Date();
                    timeout = null;
                    result = func.apply(context, args);
                };
                return function() {
                    var now = new Date();
                    var remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0) {
                        clearTimeout(timeout);
                        timeout = null;
                        previous = now;
                        result = func.apply(context, args);
                    } else if (!timeout) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };
            };
            _.debounce = function(func, wait, immediate) {
                var timeout, result;
                return function() {
                    var context = this, args = arguments;
                    var later = function() {
                        timeout = null;
                        if (!immediate) result = func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) result = func.apply(context, args);
                    return result;
                };
            };
            _.once = function(func) {
                var ran = false, memo;
                return function() {
                    if (ran) return memo;
                    ran = true;
                    memo = func.apply(this, arguments);
                    func = null;
                    return memo;
                };
            };
            _.wrap = function(func, wrapper) {
                return function() {
                    var args = [ func ];
                    push.apply(args, arguments);
                    return wrapper.apply(this, args);
                };
            };
            _.compose = function() {
                var funcs = arguments;
                return function() {
                    var args = arguments;
                    for (var i = funcs.length - 1; i >= 0; i--) {
                        args = [ funcs[i].apply(this, args) ];
                    }
                    return args[0];
                };
            };
            _.after = function(times, func) {
                if (times <= 0) return func();
                return function() {
                    if (--times < 1) {
                        return func.apply(this, arguments);
                    }
                };
            };
            _.keys = nativeKeys || function(obj) {
                if (obj !== Object(obj)) throw new TypeError("Invalid object");
                var keys = [];
                for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
                return keys;
            };
            _.values = function(obj) {
                var values = [];
                for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
                return values;
            };
            _.pairs = function(obj) {
                var pairs = [];
                for (var key in obj) if (_.has(obj, key)) pairs.push([ key, obj[key] ]);
                return pairs;
            };
            _.invert = function(obj) {
                var result = {};
                for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
                return result;
            };
            _.functions = _.methods = function(obj) {
                var names = [];
                for (var key in obj) {
                    if (_.isFunction(obj[key])) names.push(key);
                }
                return names.sort();
            };
            _.extend = function(obj) {
                each(slice.call(arguments, 1), function(source) {
                    if (source) {
                        for (var prop in source) {
                            obj[prop] = source[prop];
                        }
                    }
                });
                return obj;
            };
            _.pick = function(obj) {
                var copy = {};
                var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
                each(keys, function(key) {
                    if (key in obj) copy[key] = obj[key];
                });
                return copy;
            };
            _.omit = function(obj) {
                var copy = {};
                var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
                for (var key in obj) {
                    if (!_.contains(keys, key)) copy[key] = obj[key];
                }
                return copy;
            };
            _.defaults = function(obj) {
                each(slice.call(arguments, 1), function(source) {
                    if (source) {
                        for (var prop in source) {
                            if (obj[prop] == null) obj[prop] = source[prop];
                        }
                    }
                });
                return obj;
            };
            _.clone = function(obj) {
                if (!_.isObject(obj)) return obj;
                return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
            };
            _.tap = function(obj, interceptor) {
                interceptor(obj);
                return obj;
            };
            var eq = function(a, b, aStack, bStack) {
                if (a === b) return a !== 0 || 1 / a == 1 / b;
                if (a == null || b == null) return a === b;
                if (a instanceof _) a = a._wrapped;
                if (b instanceof _) b = b._wrapped;
                var className = toString.call(a);
                if (className != toString.call(b)) return false;
                switch (className) {
                  case "[object String]":
                    return a == String(b);

                  case "[object Number]":
                    return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;

                  case "[object Date]":
                  case "[object Boolean]":
                    return +a == +b;

                  case "[object RegExp]":
                    return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
                }
                if (typeof a != "object" || typeof b != "object") return false;
                var length = aStack.length;
                while (length--) {
                    if (aStack[length] == a) return bStack[length] == b;
                }
                aStack.push(a);
                bStack.push(b);
                var size = 0, result = true;
                if (className == "[object Array]") {
                    size = a.length;
                    result = size == b.length;
                    if (result) {
                        while (size--) {
                            if (!(result = eq(a[size], b[size], aStack, bStack))) break;
                        }
                    }
                } else {
                    var aCtor = a.constructor, bCtor = b.constructor;
                    if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor)) {
                        return false;
                    }
                    for (var key in a) {
                        if (_.has(a, key)) {
                            size++;
                            if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
                        }
                    }
                    if (result) {
                        for (key in b) {
                            if (_.has(b, key) && !size--) break;
                        }
                        result = !size;
                    }
                }
                aStack.pop();
                bStack.pop();
                return result;
            };
            _.isEqual = function(a, b) {
                return eq(a, b, [], []);
            };
            _.isEmpty = function(obj) {
                if (obj == null) return true;
                if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
                for (var key in obj) if (_.has(obj, key)) return false;
                return true;
            };
            _.isElement = function(obj) {
                return !!(obj && obj.nodeType === 1);
            };
            _.isArray = nativeIsArray || function(obj) {
                return toString.call(obj) == "[object Array]";
            };
            _.isObject = function(obj) {
                return obj === Object(obj);
            };
            each([ "Arguments", "Function", "String", "Number", "Date", "RegExp" ], function(name) {
                _["is" + name] = function(obj) {
                    return toString.call(obj) == "[object " + name + "]";
                };
            });
            if (!_.isArguments(arguments)) {
                _.isArguments = function(obj) {
                    return !!(obj && _.has(obj, "callee"));
                };
            }
            if (typeof /./ !== "function") {
                _.isFunction = function(obj) {
                    return typeof obj === "function";
                };
            }
            _.isFinite = function(obj) {
                return isFinite(obj) && !isNaN(parseFloat(obj));
            };
            _.isNaN = function(obj) {
                return _.isNumber(obj) && obj != +obj;
            };
            _.isBoolean = function(obj) {
                return obj === true || obj === false || toString.call(obj) == "[object Boolean]";
            };
            _.isNull = function(obj) {
                return obj === null;
            };
            _.isUndefined = function(obj) {
                return obj === void 0;
            };
            _.has = function(obj, key) {
                return hasOwnProperty.call(obj, key);
            };
            _.noConflict = function() {
                root._ = previousUnderscore;
                return this;
            };
            _.identity = function(value) {
                return value;
            };
            _.times = function(n, iterator, context) {
                var accum = Array(n);
                for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
                return accum;
            };
            _.random = function(min, max) {
                if (max == null) {
                    max = min;
                    min = 0;
                }
                return min + Math.floor(Math.random() * (max - min + 1));
            };
            var entityMap = {
                escape: {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;",
                    "/": "&#x2F;"
                }
            };
            entityMap.unescape = _.invert(entityMap.escape);
            var entityRegexes = {
                escape: new RegExp("[" + _.keys(entityMap.escape).join("") + "]", "g"),
                unescape: new RegExp("(" + _.keys(entityMap.unescape).join("|") + ")", "g")
            };
            _.each([ "escape", "unescape" ], function(method) {
                _[method] = function(string) {
                    if (string == null) return "";
                    return ("" + string).replace(entityRegexes[method], function(match) {
                        return entityMap[method][match];
                    });
                };
            });
            _.result = function(object, property) {
                if (object == null) return null;
                var value = object[property];
                return _.isFunction(value) ? value.call(object) : value;
            };
            _.mixin = function(obj) {
                each(_.functions(obj), function(name) {
                    var func = _[name] = obj[name];
                    _.prototype[name] = function() {
                        var args = [ this._wrapped ];
                        push.apply(args, arguments);
                        return result.call(this, func.apply(_, args));
                    };
                });
            };
            var idCounter = 0;
            _.uniqueId = function(prefix) {
                var id = ++idCounter + "";
                return prefix ? prefix + id : id;
            };
            _.templateSettings = {
                evaluate: /<%([\s\S]+?)%>/g,
                interpolate: /<%=([\s\S]+?)%>/g,
                escape: /<%-([\s\S]+?)%>/g
            };
            var noMatch = /(.)^/;
            var escapes = {
                "'": "'",
                "\\": "\\",
                "\r": "r",
                "\n": "n",
                "\t": "t",
                "\u2028": "u2028",
                "\u2029": "u2029"
            };
            var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
            _.template = function(text, data, settings) {
                var render;
                settings = _.defaults({}, settings, _.templateSettings);
                var matcher = new RegExp([ (settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source ].join("|") + "|$", "g");
                var index = 0;
                var source = "__p+='";
                text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                    source += text.slice(index, offset).replace(escaper, function(match) {
                        return "\\" + escapes[match];
                    });
                    if (escape) {
                        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
                    }
                    if (interpolate) {
                        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
                    }
                    if (evaluate) {
                        source += "';\n" + evaluate + "\n__p+='";
                    }
                    index = offset + match.length;
                    return match;
                });
                source += "';\n";
                if (!settings.variable) source = "with(obj||{}){\n" + source + "}\n";
                source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
                try {
                    render = new Function(settings.variable || "obj", "_", source);
                } catch (e) {
                    e.source = source;
                    throw e;
                }
                if (data) return render(data, _);
                var template = function(data) {
                    return render.call(this, data, _);
                };
                template.source = "function(" + (settings.variable || "obj") + "){\n" + source + "}";
                return template;
            };
            _.chain = function(obj) {
                return _(obj).chain();
            };
            var result = function(obj) {
                return this._chain ? _(obj).chain() : obj;
            };
            _.mixin(_);
            each([ "pop", "push", "reverse", "shift", "sort", "splice", "unshift" ], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    var obj = this._wrapped;
                    method.apply(obj, arguments);
                    if ((name == "shift" || name == "splice") && obj.length === 0) delete obj[0];
                    return result.call(this, obj);
                };
            });
            each([ "concat", "join", "slice" ], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    return result.call(this, method.apply(this._wrapped, arguments));
                };
            });
            _.extend(_.prototype, {
                chain: function() {
                    this._chain = true;
                    return this;
                },
                value: function() {
                    return this._wrapped;
                }
            });
        }).call(this);
    }, {} ],
    21: [ function(require, module, exports) {
        if (typeof Object.create === "function") {
            module.exports = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor;
                ctor.prototype = Object.create(superCtor.prototype, {
                    constructor: {
                        value: ctor,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    }
                });
            };
        } else {
            module.exports = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor;
                var TempCtor = function() {};
                TempCtor.prototype = superCtor.prototype;
                ctor.prototype = new TempCtor();
                ctor.prototype.constructor = ctor;
            };
        }
    }, {} ],
    22: [ function(require, module, exports) {
        module.exports = function isBuffer(arg) {
            return arg && typeof arg === "object" && typeof arg.copy === "function" && typeof arg.fill === "function" && typeof arg.readUInt8 === "function";
        };
    }, {} ],
    23: [ function(require, module, exports) {
        (function(process, global) {
            var formatRegExp = /%[sdj%]/g;
            exports.format = function(f) {
                if (!isString(f)) {
                    var objects = [];
                    for (var i = 0; i < arguments.length; i++) {
                        objects.push(inspect(arguments[i]));
                    }
                    return objects.join(" ");
                }
                var i = 1;
                var args = arguments;
                var len = args.length;
                var str = String(f).replace(formatRegExp, function(x) {
                    if (x === "%%") return "%";
                    if (i >= len) return x;
                    switch (x) {
                      case "%s":
                        return String(args[i++]);

                      case "%d":
                        return Number(args[i++]);

                      case "%j":
                        try {
                            return JSON.stringify(args[i++]);
                        } catch (_) {
                            return "[Circular]";
                        }

                      default:
                        return x;
                    }
                });
                for (var x = args[i]; i < len; x = args[++i]) {
                    if (isNull(x) || !isObject(x)) {
                        str += " " + x;
                    } else {
                        str += " " + inspect(x);
                    }
                }
                return str;
            };
            exports.deprecate = function(fn, msg) {
                if (isUndefined(global.process)) {
                    return function() {
                        return exports.deprecate(fn, msg).apply(this, arguments);
                    };
                }
                if (process.noDeprecation === true) {
                    return fn;
                }
                var warned = false;
                function deprecated() {
                    if (!warned) {
                        if (process.throwDeprecation) {
                            throw new Error(msg);
                        } else if (process.traceDeprecation) {
                            console.trace(msg);
                        } else {
                            console.error(msg);
                        }
                        warned = true;
                    }
                    return fn.apply(this, arguments);
                }
                return deprecated;
            };
            var debugs = {};
            var debugEnviron;
            exports.debuglog = function(set) {
                if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || "";
                set = set.toUpperCase();
                if (!debugs[set]) {
                    if (new RegExp("\\b" + set + "\\b", "i").test(debugEnviron)) {
                        var pid = process.pid;
                        debugs[set] = function() {
                            var msg = exports.format.apply(exports, arguments);
                            console.error("%s %d: %s", set, pid, msg);
                        };
                    } else {
                        debugs[set] = function() {};
                    }
                }
                return debugs[set];
            };
            function inspect(obj, opts) {
                var ctx = {
                    seen: [],
                    stylize: stylizeNoColor
                };
                if (arguments.length >= 3) ctx.depth = arguments[2];
                if (arguments.length >= 4) ctx.colors = arguments[3];
                if (isBoolean(opts)) {
                    ctx.showHidden = opts;
                } else if (opts) {
                    exports._extend(ctx, opts);
                }
                if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
                if (isUndefined(ctx.depth)) ctx.depth = 2;
                if (isUndefined(ctx.colors)) ctx.colors = false;
                if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
                if (ctx.colors) ctx.stylize = stylizeWithColor;
                return formatValue(ctx, obj, ctx.depth);
            }
            exports.inspect = inspect;
            inspect.colors = {
                bold: [ 1, 22 ],
                italic: [ 3, 23 ],
                underline: [ 4, 24 ],
                inverse: [ 7, 27 ],
                white: [ 37, 39 ],
                grey: [ 90, 39 ],
                black: [ 30, 39 ],
                blue: [ 34, 39 ],
                cyan: [ 36, 39 ],
                green: [ 32, 39 ],
                magenta: [ 35, 39 ],
                red: [ 31, 39 ],
                yellow: [ 33, 39 ]
            };
            inspect.styles = {
                special: "cyan",
                number: "yellow",
                boolean: "yellow",
                undefined: "grey",
                null: "bold",
                string: "green",
                date: "magenta",
                regexp: "red"
            };
            function stylizeWithColor(str, styleType) {
                var style = inspect.styles[styleType];
                if (style) {
                    return "[" + inspect.colors[style][0] + "m" + str + "[" + inspect.colors[style][1] + "m";
                } else {
                    return str;
                }
            }
            function stylizeNoColor(str, styleType) {
                return str;
            }
            function arrayToHash(array) {
                var hash = {};
                array.forEach(function(val, idx) {
                    hash[val] = true;
                });
                return hash;
            }
            function formatValue(ctx, value, recurseTimes) {
                if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== exports.inspect && !(value.constructor && value.constructor.prototype === value)) {
                    var ret = value.inspect(recurseTimes, ctx);
                    if (!isString(ret)) {
                        ret = formatValue(ctx, ret, recurseTimes);
                    }
                    return ret;
                }
                var primitive = formatPrimitive(ctx, value);
                if (primitive) {
                    return primitive;
                }
                var keys = Object.keys(value);
                var visibleKeys = arrayToHash(keys);
                if (ctx.showHidden) {
                    keys = Object.getOwnPropertyNames(value);
                }
                if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
                    return formatError(value);
                }
                if (keys.length === 0) {
                    if (isFunction(value)) {
                        var name = value.name ? ": " + value.name : "";
                        return ctx.stylize("[Function" + name + "]", "special");
                    }
                    if (isRegExp(value)) {
                        return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
                    }
                    if (isDate(value)) {
                        return ctx.stylize(Date.prototype.toString.call(value), "date");
                    }
                    if (isError(value)) {
                        return formatError(value);
                    }
                }
                var base = "", array = false, braces = [ "{", "}" ];
                if (isArray(value)) {
                    array = true;
                    braces = [ "[", "]" ];
                }
                if (isFunction(value)) {
                    var n = value.name ? ": " + value.name : "";
                    base = " [Function" + n + "]";
                }
                if (isRegExp(value)) {
                    base = " " + RegExp.prototype.toString.call(value);
                }
                if (isDate(value)) {
                    base = " " + Date.prototype.toUTCString.call(value);
                }
                if (isError(value)) {
                    base = " " + formatError(value);
                }
                if (keys.length === 0 && (!array || value.length == 0)) {
                    return braces[0] + base + braces[1];
                }
                if (recurseTimes < 0) {
                    if (isRegExp(value)) {
                        return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
                    } else {
                        return ctx.stylize("[Object]", "special");
                    }
                }
                ctx.seen.push(value);
                var output;
                if (array) {
                    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
                } else {
                    output = keys.map(function(key) {
                        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
                    });
                }
                ctx.seen.pop();
                return reduceToSingleString(output, base, braces);
            }
            function formatPrimitive(ctx, value) {
                if (isUndefined(value)) return ctx.stylize("undefined", "undefined");
                if (isString(value)) {
                    var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                    return ctx.stylize(simple, "string");
                }
                if (isNumber(value)) return ctx.stylize("" + value, "number");
                if (isBoolean(value)) return ctx.stylize("" + value, "boolean");
                if (isNull(value)) return ctx.stylize("null", "null");
            }
            function formatError(value) {
                return "[" + Error.prototype.toString.call(value) + "]";
            }
            function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
                var output = [];
                for (var i = 0, l = value.length; i < l; ++i) {
                    if (hasOwnProperty(value, String(i))) {
                        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
                    } else {
                        output.push("");
                    }
                }
                keys.forEach(function(key) {
                    if (!key.match(/^\d+$/)) {
                        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
                    }
                });
                return output;
            }
            function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
                var name, str, desc;
                desc = Object.getOwnPropertyDescriptor(value, key) || {
                    value: value[key]
                };
                if (desc.get) {
                    if (desc.set) {
                        str = ctx.stylize("[Getter/Setter]", "special");
                    } else {
                        str = ctx.stylize("[Getter]", "special");
                    }
                } else {
                    if (desc.set) {
                        str = ctx.stylize("[Setter]", "special");
                    }
                }
                if (!hasOwnProperty(visibleKeys, key)) {
                    name = "[" + key + "]";
                }
                if (!str) {
                    if (ctx.seen.indexOf(desc.value) < 0) {
                        if (isNull(recurseTimes)) {
                            str = formatValue(ctx, desc.value, null);
                        } else {
                            str = formatValue(ctx, desc.value, recurseTimes - 1);
                        }
                        if (str.indexOf("\n") > -1) {
                            if (array) {
                                str = str.split("\n").map(function(line) {
                                    return "  " + line;
                                }).join("\n").substr(2);
                            } else {
                                str = "\n" + str.split("\n").map(function(line) {
                                    return "   " + line;
                                }).join("\n");
                            }
                        }
                    } else {
                        str = ctx.stylize("[Circular]", "special");
                    }
                }
                if (isUndefined(name)) {
                    if (array && key.match(/^\d+$/)) {
                        return str;
                    }
                    name = JSON.stringify("" + key);
                    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                        name = name.substr(1, name.length - 2);
                        name = ctx.stylize(name, "name");
                    } else {
                        name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
                        name = ctx.stylize(name, "string");
                    }
                }
                return name + ": " + str;
            }
            function reduceToSingleString(output, base, braces) {
                var numLinesEst = 0;
                var length = output.reduce(function(prev, cur) {
                    numLinesEst++;
                    if (cur.indexOf("\n") >= 0) numLinesEst++;
                    return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
                }, 0);
                if (length > 60) {
                    return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
                }
                return braces[0] + base + " " + output.join(", ") + " " + braces[1];
            }
            function isArray(ar) {
                return Array.isArray(ar);
            }
            exports.isArray = isArray;
            function isBoolean(arg) {
                return typeof arg === "boolean";
            }
            exports.isBoolean = isBoolean;
            function isNull(arg) {
                return arg === null;
            }
            exports.isNull = isNull;
            function isNullOrUndefined(arg) {
                return arg == null;
            }
            exports.isNullOrUndefined = isNullOrUndefined;
            function isNumber(arg) {
                return typeof arg === "number";
            }
            exports.isNumber = isNumber;
            function isString(arg) {
                return typeof arg === "string";
            }
            exports.isString = isString;
            function isSymbol(arg) {
                return typeof arg === "symbol";
            }
            exports.isSymbol = isSymbol;
            function isUndefined(arg) {
                return arg === void 0;
            }
            exports.isUndefined = isUndefined;
            function isRegExp(re) {
                return isObject(re) && objectToString(re) === "[object RegExp]";
            }
            exports.isRegExp = isRegExp;
            function isObject(arg) {
                return typeof arg === "object" && arg !== null;
            }
            exports.isObject = isObject;
            function isDate(d) {
                return isObject(d) && objectToString(d) === "[object Date]";
            }
            exports.isDate = isDate;
            function isError(e) {
                return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
            }
            exports.isError = isError;
            function isFunction(arg) {
                return typeof arg === "function";
            }
            exports.isFunction = isFunction;
            function isPrimitive(arg) {
                return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
            }
            exports.isPrimitive = isPrimitive;
            exports.isBuffer = require("./support/isBuffer");
            function objectToString(o) {
                return Object.prototype.toString.call(o);
            }
            function pad(n) {
                return n < 10 ? "0" + n.toString(10) : n.toString(10);
            }
            var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
            function timestamp() {
                var d = new Date();
                var time = [ pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds()) ].join(":");
                return [ d.getDate(), months[d.getMonth()], time ].join(" ");
            }
            exports.log = function() {
                console.log("%s - %s", timestamp(), exports.format.apply(exports, arguments));
            };
            exports.inherits = require("inherits");
            exports._extend = function(origin, add) {
                if (!add || !isObject(add)) return origin;
                var keys = Object.keys(add);
                var i = keys.length;
                while (i--) {
                    origin[keys[i]] = add[keys[i]];
                }
                return origin;
            };
            function hasOwnProperty(obj, prop) {
                return Object.prototype.hasOwnProperty.call(obj, prop);
            }
        }).call(this, require("_process"), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {
        "./support/isBuffer": 22,
        _process: 18,
        inherits: 21
    } ],
    24: [ function(require, module, exports) {
        angular.module("ng-nedb", [ "olitvin.nedb" ]);
    }, {} ],
    25: [ function(require, module, exports) {
        "use strict";
        var Datastore = require("nedb");
        angular.module("olitvin.nedb", []).factory("$neDB", function() {
            return function(options) {
                var db = null;
                if (!options) {
                    db = new Datastore();
                } else {
                    db = new Datastore(options);
                }
                return db;
            };
        });
    }, {
        nedb: 10
    } ]
}, {}, [ 24, 25 ]);