// Generated by CoffeeScript 1.6.3
(function() {
  var APP_NAME, DIRECTIVE_MODULE, SERVICE_MODULE, app;

  APP_NAME = 'lintblame';

  DIRECTIVE_MODULE = "" + APP_NAME + ".directives";

  SERVICE_MODULE = "" + APP_NAME + ".services";

  angular.module(DIRECTIVE_MODULE, []);

  angular.module(SERVICE_MODULE, []);

  _.mixin({
    dget: function(obj, key, default_) {
      if (_.has(obj, key)) {
        return obj[key];
      }
      return default_;
    }
  });

  angular.module(SERVICE_MODULE).service('Api', function($q, $http, $rootScope) {
    var Api;
    Api = (function() {
      function Api() {}

      Api.prototype.lastUpdate = Date.now();

      Api.prototype.pendingPoll = false;

      Api.prototype.scan = function() {
        return 'blah';
      };

      Api.prototype.testPath = function(path, branchMode) {
        var config, deferred, request;
        if (branchMode == null) {
          branchMode = false;
        }
        $rootScope.setLoading(true);
        deferred = $q.defer();
        config = {
          url: "/api/testpath",
          params: {
            path: path
          },
          method: 'get',
          cache: false
        };
        if (branchMode) {
          console.log('branchMode:', branchMode);
          config.params.branch = branchMode;
        }
        request = $http(config);
        request.success(function(response) {
          deferred.resolve(response);
          return $rootScope.setLoading(false);
        });
        return deferred.promise;
      };

      Api.prototype.fullScan = function(paths) {
        var deferred, pathsParam, request;
        $rootScope.setLoading(true);
        this.lastUpdate = Date.now();
        deferred = $q.defer();
        pathsParam = paths.join(',');
        request = $http({
          url: "/api/fullscan",
          params: {
            paths: pathsParam
          },
          method: 'get',
          cache: false
        });
        request.success(function(response) {
          deferred.resolve(response);
          return $rootScope.setLoading(false);
        });
        return deferred.promise;
      };

      Api.prototype.poll = function(paths, branchMode, fullScan) {
        var deferred, params, request,
          _this = this;
        if (branchMode == null) {
          branchMode = false;
        }
        if (fullScan == null) {
          fullScan = false;
        }
        deferred = $q.defer();
        if (this.pendingPoll) {
          deferred.resolve({});
        } else {
          this.pendingPoll = true;
          params = {
            since: this.lastUpdate,
            paths: paths.join(','),
            branch: branchMode
          };
          if (fullScan) {
            params.fullScan = true;
          }
          request = $http({
            url: '/api/poll',
            method: 'get',
            params: params,
            cache: false
          });
          request.success(function(response) {
            if (!_.isEmpty(response)) {
              _this.lastUpdate = Date.now();
            }
            deferred.resolve(response);
            return _this.pendingPoll = false;
          });
        }
        return deferred.promise;
      };

      return Api;

    })();
    return new Api();
  });

  angular.module(SERVICE_MODULE).service('Lints', function($rootScope) {
    var Lints;
    Lints = (function() {
      function Lints() {}

      Lints.prototype.issueCount = function(lintData) {
        return lintData.issues.length;
      };

      return Lints;

    })();
    return new Lints();
  });

  angular.module(SERVICE_MODULE).service('LocalStorage', function() {
    var LocalStorage;
    LocalStorage = (function() {
      function LocalStorage() {}

      LocalStorage.prototype.STORAGE_KEY = 'lintblame';

      LocalStorage.prototype.SAVED_BUNDLES_KEY = 'saves';

      LocalStorage.prototype.listeners = [];

      LocalStorage.prototype.set = function(val) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(val));
        return _.each(this.listeners, function(listener) {
          return listener();
        });
      };

      LocalStorage.prototype.setAttr = function(key, val) {
        var all;
        all = this.get();
        all[key] = val;
        return this.set(all);
      };

      LocalStorage.prototype.get = function(key) {
        var all;
        if (key == null) {
          key = null;
        }
        all = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        if (!key) {
          return all;
        }
        return all[key];
      };

      LocalStorage.prototype._setSavedLintBundles = function(saved) {
        return this.setAttr(this.SAVED_BUNDLES_KEY, saved);
      };

      LocalStorage.prototype.savedLintBundles = function() {
        return this.get(this.SAVED_BUNDLES_KEY);
      };

      LocalStorage.prototype.saveLintBundle = function(lintBundle) {
        var currentSaved, path, saveBundle;
        currentSaved = this.get(this.SAVED_BUNDLES_KEY);
        path = lintBundle.fullPath;
        if (!path) {
          throw "LocalStorage.saveLintBundle(): Bad path: " + path;
        }
        lintBundle.updated = Date.now();
        saveBundle = _.extend({}, lintBundle);
        delete saveBundle['lints'];
        currentSaved[path] = lintBundle;
        return this._setSavedLintBundles(currentSaved);
      };

      LocalStorage.prototype.savedLintBundle = function(path) {
        return this.savedLintBundles()[path];
      };

      LocalStorage.prototype.setSaveName = function(path, name) {
        var bundle;
        bundle = this.savedLintBundle(path);
        bundle.saveName = name;
        return this.saveLintBundle(bundle);
      };

      LocalStorage.prototype.deleteSave = function(path) {
        var saved;
        saved = this.savedLintBundles();
        if (_.has(saved, path)) {
          delete saved[path];
        }
        return this._setSavedLintBundles(saved);
      };

      LocalStorage.prototype.resetAppStorage = function() {
        var defaultState;
        console.log('resetting app storage');
        defaultState = {};
        defaultState[this.SAVED_BUNDLES_KEY] = {};
        return this.set(defaultState);
      };

      LocalStorage.prototype.initIfNecessary = function() {
        if (!this.get()) {
          return this.resetAppStorage();
        }
      };

      LocalStorage.prototype.addListener = function(listener) {
        return this.listeners.push(listener);
      };

      return LocalStorage;

    })();
    return new LocalStorage();
  });

  angular.module(DIRECTIVE_MODULE).directive('lintIssues', function($rootScope) {
    var directive;
    return directive = {
      replace: true,
      template: "        <div class=\"lint-issues\" ng-class=\"{demoted: demotions[path]}\">\n            <div class=\"path hover-parent\">\n                \n                <span class=\"label {{countClass}}\">\n                    <span class=\"glyphicon {{countIcon}}\"></span>\n                </span>\n                \n                &nbsp;\n                \n                <span class=\"path-parts\">\n                    <span class=\"head\">{{pathHead}}/</span><span class=\"tail\">{{pathTail}}</span>\n                </span>\n                    \n                &nbsp;\n\n                <a ng-click=\"copyPath()\" class=\"hover-target-inbl\">\n                    <span class=\"glyphicon glyphicon-open\"></span>\n                </a>\n\n                <div class=\"pull-right demotion-options hover-target\">\n                    <a ng-click=\"demote(path)\">\n                        <span ng-show=\"!demotions[path]\"\n                            class=\"glyphicon glyphicon-minus-sign dim hover-bright\">\n                        </span>\n                        <span ng-show=\"demotions[path]\"\n                            class=\"glyphicon glyphicon-plus-sign dim hover-bright\">\n                        </span>\n                    </a>\n                </div>\n            </div>\n            <div ng-repeat=\"line in sortedLines\" class=\"line-wrapper\" ng-show=\"!demotions[path]\">\n                <div class=\"label label-warning line\">\n                    {{line}}\n                </div>\n                <div class=\"detail\">\n                    <code class=\"code\">\n                        {{data.lines[line - 1]}}\n                    </code>\n                    <table>\n                        <tr ng-repeat=\"issue in issuesByLine[line]\" class=\"issue\">\n                            <td class=\"{{blameClass(line)}}\">\n                                [{{blameLine(issue.line)}}]\n                            </td>\n                            <td class=\"reporter\">\n                                {{issue.reporter}}\n                                {{issue.code}}\n                            </td>\n                            <td>\n                                {{issue.message}}\n                            </td>\n                        </tr>\n                    </table>\n                </div>\n            </div>\n        </div>",
      link: function(scope) {
        scope.update = function() {
          var issue, issuesByLine, line, lineInts, lintData, parts, relPath, splitStr, totalCount, _i, _len, _ref;
          lintData = scope.lintBundle.lints;
          if (!_.has(lintData, scope.path)) {
            return;
          }
          scope.data = lintData[scope.path];
          issuesByLine = {};
          totalCount = 0;
          _ref = scope.data.issues;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            issue = _ref[_i];
            line = issue.line;
            if (!_.has(issuesByLine, line)) {
              issuesByLine[line] = [];
            }
            issuesByLine[line].push(issue);
            totalCount += 1;
          }
          scope.issuesByLine = issuesByLine;
          scope.totalCount = totalCount;
          if (totalCount) {
            scope.countClass = 'label-danger';
            scope.countIcon = 'glyphicon-thumbs-down';
          } else {
            scope.countClass = 'label-success';
            scope.countIcon = 'glyphicon-thumbs-up';
          }
          lineInts = _.map(issuesByLine, function(issue, line) {
            return parseInt(line, 10);
          });
          scope.sortedLines = lineInts.sort(function(a, b) {
            return a - b;
          });
          splitStr = lintData.fullPath;
          relPath = scope.path.split(splitStr).pop();
          if (relPath.charAt(0) === '/') {
            relPath = relPath.substr(1);
          }
          parts = relPath.split('/');
          scope.pathTail = parts.pop();
          return scope.pathHead = parts.join('/');
        };
        scope.blameLine = function(line) {
          return scope.data.blame[line - 1];
        };
        scope.blameClass = function(line) {
          var cls, lineBlame;
          cls = 'blame';
          lineBlame = scope.blameLine(line);
          if (lineBlame === $rootScope.vcsName || lineBlame === 'Not Committed Yet') {
            cls += ' blame-me';
          }
          return cls;
        };
        scope.$watch('lastRefresh', function() {
          return scope.update();
        });
        scope.demote = function(path) {
          return scope.$emit('demote', path);
        };
        return scope.copyPath = function() {
          return window.prompt("Copy to clipboard: Ctrl+C, Enter", scope.lintBundle.fullPath + '/' + scope.pathTail);
        };
      }
    };
  });

  angular.module(DIRECTIVE_MODULE).directive('savedTarget', function($rootScope, LocalStorage) {
    var directive;
    return directive = {
      replace: true,
      template: "<div class=\"saved-target\">\n    <input type=\"text\"\n        class=\"form-control code\"\n        ng-model=\"m.saveName\"\n        ng-change=\"saveNameChange()\"\n        placeholder=\"Save Name\">\n\n    <div class=\"tiny save-details\">\n        <span class=\"dim\">\n            {{m.path}}\n        </span>\n        <div class=\"pull-right highlight\" ng-show=\"m.bundle.branchMode\">\n            Br\n        </div>\n    </div>\n    <div class=\"small actions\">\n        <a class=\"danger\" ng-click=\"deleteSave()\">\n            <span class=\"glyphicon glyphicon-remove-circle\"></span>\n        </a>\n        <div class=\"pull-right\">\n            <a ng-click=\"loadSavePath(path)\">\n                <span class=\"glyphicon glyphicon-arrow-right\"></span>\n            </a>\n        </div>\n    </div>\n</div>",
      link: function(scope) {
        var frag, update;
        scope.m = {
          path: scope.path
        };
        if (scope.path.length > 20) {
          frag = scope.path.substr(17);
          scope.m.path = "..." + frag;
        }
        if (_.has(scope.data, 'saveName')) {
          scope.m.saveName = scope.data.saveName;
        }
        update = function() {
          scope.m.bundle = LocalStorage.savedLintBundle(scope.path);
          if (!scope.m.bundle) {
            throw "Unable to get saved bundle for path " + scope.path;
          }
        };
        scope.saveNameChange = function() {
          return LocalStorage.setSaveName(scope.path, scope.m.saveName);
        };
        scope.deleteSave = function() {
          return LocalStorage.deleteSave(scope.path);
        };
        update();
        return LocalStorage.addListener(function() {
          return update();
        });
      }
    };
  });

  angular.module(DIRECTIVE_MODULE).directive('userFeedback', function() {
    var directive;
    return directive = {
      template: "<div class=\"row-fluid\" ng-show=\"fbModel.html\">\n    <div class=\"span12 alert {{fbModel.alertClass}}\">\n        <span class=\"{{fbModel.iconClass}}\" ng-show=\"fbModel.iconClass\"></span>\n        <span ng-bind-html-unsafe=\"fbModel.html\"></span>\n    </div>\n</div>",
      link: function(scope) {
        var setFeedback;
        scope.fbModel = {};
        setFeedback = function(html, alertClass, iconClass) {
          scope.fbModel.html = html;
          scope.fbModel.alertClass = alertClass;
          return scope.fbModel.iconClass = iconClass;
        };
        scope.$on('feedback', function(html, alertClass, iconClass) {
          return setFeedback(html, alertClass, iconClass);
        });
        scope.$on('successFeedback', function(e, html) {
          return setFeedback(html, 'alert-success', 'icon-thumbs-up');
        });
        scope.$on('errorFeedback', function(e, html) {
          return setFeedback(html, 'alert-error', 'icon-exclamation-sign');
        });
        scope.$on('warnFeedback', function(e, html) {
          return setFeedback(html, '', 'icon-info-sign');
        });
        return scope.$on('clearFeedback', function(e) {
          return setFeedback(null, '', '');
        });
      }
    };
  });

  app = angular.module(APP_NAME, ["" + APP_NAME + ".services", "" + APP_NAME + ".directives"]).run(function($rootScope, Api, Lints, LocalStorage) {
    var updateFavicon;
    $rootScope.appName = "lintblame";
    $rootScope.lintResults = {};
    LocalStorage.initIfNecessary();
    $rootScope.loadingSpinner = new Spinner({
      lines: 10,
      length: 5,
      width: 2,
      radius: 5,
      corners: 1,
      rotate: 0,
      direction: 1,
      color: '#fff',
      speed: 1,
      trail: 60,
      shadow: false,
      hwaccel: false,
      className: 'spinner',
      zIndex: 2e9,
      top: '0',
      left: '0'
    });
    $rootScope.isLoading = false;
    $rootScope.setLoading = function(val) {
      var target;
      if (val) {
        if (!$rootScope.isLoading) {
          target = document.getElementById('loading');
          $rootScope.loadingSpinner.spin(target);
        }
      } else {
        $rootScope.loadingSpinner.stop();
      }
      return $rootScope.isLoading = val;
    };
    $rootScope.activePaths = function() {
      if (!$rootScope.lintBundle.fullPath) {
        return [];
      }
      return _.keys($rootScope.lintBundle.lints);
    };
    updateFavicon = function() {
      var count, data, path, _ref, _results;
      count = 0;
      _ref = $rootScope.lintResults;
      _results = [];
      for (path in _ref) {
        data = _ref[path];
        _results.push(count += Lints.issueCount(data));
      }
      return _results;
    };
    $rootScope.updateResults = function(pathsAndData) {
      var data, lastRefresh, mins, now, path, paths, secs;
      console.log('pathsAndData:', pathsAndData);
      for (path in pathsAndData) {
        data = pathsAndData[path];
        $rootScope.lintBundle.lints[path] = data;
      }
      paths = _.keys($rootScope.lintBundle.lints);
      $rootScope.sortedPaths = paths.sort(function(a, b) {
        return Lints.issueCount($rootScope.lintBundle.lints[b]) - Lints.issueCount($rootScope.lintBundle.lints[a]);
      });
      now = new Date();
      lastRefresh = now.getHours() + ':';
      mins = now.getMinutes();
      if (mins < 10) {
        lastRefresh += '0';
      }
      lastRefresh += mins + ':';
      secs = now.getSeconds();
      if (secs < 10) {
        lastRefresh += '0';
      }
      lastRefresh += secs;
      return $rootScope.lastRefresh = lastRefresh;
    };
    $rootScope.loadSavePath = function(path) {
      return $rootScope.loadedSavePath = path;
    };
    $rootScope.resetLintBundle = function() {
      return $rootScope.lintBundle = {
        lints: {},
        branchMode: false
      };
    };
    $rootScope.saveCurrentBundle = function() {
      return LocalStorage.saveLintBundle($rootScope.lintBundle);
    };
    return $rootScope.updateLintBundle = function(properties) {
      var key, value;
      console.log('updatelintbundle properties:', properties);
      for (key in properties) {
        value = properties[key];
        $rootScope.lintBundle[key] = value;
      }
      return $rootScope.saveCurrentBundle();
    };
  });

  angular.module(APP_NAME).controller('MenuCtrl', function($scope, $rootScope, $q, Api, LocalStorage) {
    var hideSaveBtn, loadSave, showSaveBtn, stopPolling, targetPathChange, testPath;
    $scope.showSubmitBtn = true;
    $scope.isPolling = false;
    $scope.pollCount = 0;
    $rootScope.acceptedLintPath = null;
    $scope.pendingPaths = [];
    $rootScope.resetLintBundle();
    testPath = function(andAccept) {
      var deferred, path;
      if (andAccept == null) {
        andAccept = false;
      }
      deferred = $q.defer();
      path = $scope.targetPathInput;
      Api.testPath(path, $rootScope.lintBundle.branchMode).then(function(response) {
        $scope.pathExists = response.exists;
        $scope.fullPath = response.path;
        $scope.targets = response.targets;
        if (!_.isUndefined(response.vcs)) {
          $scope.vcs = response.vcs;
          $scope.branch = response.branch;
          $rootScope.vcsName = response.name;
        }
        if (andAccept) {
          $scope.acceptPath();
        }
        return deferred.resolve();
      });
      return deferred.promise;
    };
    stopPolling = function() {
      if ($scope.pollInterval) {
        clearInterval($scope.pollInterval);
      }
      return $scope.isPolling = false;
    };
    showSaveBtn = function() {
      $scope.showSaveBtn = true;
      return $scope.showSubmitBtn = false;
    };
    hideSaveBtn = function() {
      return $scope.showSaveBtn = false;
    };
    $scope.startPolling = function() {
      stopPolling();
      $scope.isPolling = true;
      return $scope.pollInterval = setInterval(function() {
        var fullScan, thresholdPaths;
        thresholdPaths = $scope.targets;
        fullScan = thresholdPaths.length && !$rootScope.activePaths().length;
        if (thresholdPaths.length > 0) {
          $rootScope.noPaths = false;
          Api.poll([$rootScope.lintBundle.fullPath], $rootScope.lintBundle.branchMode, fullScan).then(function(response) {
            if (!_.isEmpty(response)) {
              return $rootScope.updateResults(response.changed);
            }
          });
          return $scope.pollCount += 1;
        } else {
          $rootScope.noPaths = true;
          return console.log('not polling because no paths');
        }
      }, 2000);
    };
    $scope.togglePolling = function() {
      if ($scope.isPolling) {
        stopPolling();
      } else {
        $scope.startPolling();
      }
      return $rootScope.updateLintBundle({
        'isPolling': $scope.isPolling
      });
    };
    $scope.acceptPath = function() {
      if (!$scope.targets || $scope.targets.length === 0) {
        console.log('no targets; aborting');
        return;
      }
      showSaveBtn();
      $rootScope.updateLintBundle({
        'inputPath': $scope.targetPathInput,
        'fullPath': $scope.fullPath
      });
      return $scope.startPolling();
    };
    targetPathChange = function() {
      var path;
      stopPolling();
      path = $scope.targetPathInput;
      if (path) {
        $rootScope.resetLintBundle();
        $scope.showSubmitBtn = true;
        return testPath();
      }
    };
    $scope.targetPathChange = _.throttle(targetPathChange, 1000);
    $scope.toggleBranchMode = function() {
      $rootScope.lintBundle.branchMode = !$rootScope.lintBundle.branchMode;
      $rootScope.saveCurrentBundle();
      return testPath(true);
    };
    $scope.saveState = function() {
      var properties, save;
      properties = {
        path: $rootScope.acceptedLintPath,
        branchMode: $rootScope.branchMode
      };
      save = new SavedTarget(properties);
      LocalStorage.saveLintTarget(save);
      return hideSaveBtn();
    };
    loadSave = function(path) {
      var savedBundle;
      if (!path) {
        return;
      }
      $rootScope.resetLintBundle();
      savedBundle = LocalStorage.savedLintBundle(path);
      console.log('savedBundle:', savedBundle);
      $rootScope.lintBundle = savedBundle;
      $scope.targetPathInput = path;
      $rootScope.acceptedLintPath = path;
      testPath(true);
      return $scope.showSaveBtn = false;
    };
    return $scope.$watch('loadedSavePath', function() {
      return loadSave($rootScope.loadedSavePath);
    });
  });

  angular.module(APP_NAME).controller('ResultsCtrl', function($scope, $rootScope, $interval, Api) {
    $scope.demotions = {};
    return $scope.$on('demote', function(e, path) {
      if (!_.has($scope.demotions, path)) {
        return $scope.demotions[path] = true;
      } else {
        return $scope.demotions[path] = !$scope.demotions[path];
      }
    });
  });

  angular.module(APP_NAME).controller('SavesCtrl', function($scope, $rootScope, LocalStorage) {
    var update;
    update = function() {
      return $scope.saves = LocalStorage.savedLintBundles();
    };
    update();
    return LocalStorage.addListener(function() {
      return update();
    });
  });

}).call(this);
