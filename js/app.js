;(function(window, angular) {

  'use strict';

  // Application module
  angular.module('app', [
    'ui.router', 
    'app.common',
    'app.language', 
    'app.form'
  ])

  // Application config
  .config([
    '$stateProvider', 
    '$urlRouterProvider', 
    ($stateProvider, $urlRouterProvider) => {

      $stateProvider
        .state('home', {
          url: '/',
          templateUrl: './html/home.html',
          controller: 'homeController',
        })
        .state('page1', {
          url: '/page1',
          templateUrl: './html/page1.html'
        })
        .state('page2', {
          url: '/page2',
          templateUrl: './html/page2.html'
        })
        .state('page3', {
          url: '/page3',
          templateUrl: './html/page3.html'
        })
        .state('kepzes1', {
          url: '/kepzes1',
          templateUrl: './html/kepzes1.html',
        })
        .state('kepzes2', {
          url: '/kepzes2',
          templateUrl: './html/kepzes2.html',
        })
        .state('kepzes3', {
          url: '/kepzes3',
          templateUrl: './html/kepzes3.html',
        })
        .state('user', {
          url: '/user',
          templateUrl: './html/user.html',
          controller: 'userController',
          params: {
            type: null
          }
        })
        .state('login', {
          url: '/login',
          templateUrl: './html/user.html',
					controller: 'userController'
        })
        .state('register', {
          url: '/register',
          templateUrl: './html/user.html',
					controller: 'userController'
        })
        .state('profile', {
          url: '/profile',
          templateUrl: './html/user.html',
					controller: 'userController'
        })
        .state('email', {
          url: '/email',
          templateUrl: './html/user.html',
					controller: 'userController'
        })
        .state('password', {
          url: '/password',
          templateUrl: './html/user.html',
					controller: 'userController'
        });
        

      $urlRouterProvider.otherwise('/');
    }
  ])

  // User factory
  .factory('user', [
    '$rootScope',
    '$timeout',
    'util',
    ($rootScope, $timeout, util) => {

      // Set user default properties
      let user = {
        base: {
          id          : null,
          type        : null,
          prefix_name : null,
          first_name  : null,
          middle_name : null,
          last_name   : null,
          suffix_name : null,
          nick_name   : null,
          gender      : null,
          img         : null,
          img_type    : null,
          email       : null
        },
        rest: {
          born        : null,
          country     : null,
          country_code: null, 
          phone       : null,
          city        : null,
          postcode    : null,
          address     : null
        }
      };

      // Set service
      let service = {

        // Initialize 
        init: () => {
          service.set(util.objMerge(user.base, {
            email: window.localStorage.getItem($rootScope.app.id + '_user_email')
          }, true), false);
        },
        
        // Set
        set: (data, isSave=true) => {
          $rootScope.user = util.objMerge(user.base, data, true);
          if(util.isBoolean(isSave) && isSave) service.save();
          $timeout(() => {
            $rootScope.$applyAsync();
          });
        },

        // Get
        get: (filter=null) => { 
          if (util.isArray(filter))
                return Object.keys($rootScope.user)
                             .filter((k) => !filter.includes(k))
                             .reduce((o, k) => { 
                                return Object.assign(o, {[k]:$rootScope.user[k]})
                              }, {});
          else  return $rootScope.user;
        },
        
        // Default
        def: (filter=null , key=null) => {
          let prop  = util.isObjectHasKey(user, key) ? user[key] : 
                      util.objMerge(user.base, user.rest);
          if (util.isArray(filter))
                return Object.keys(prop)
                             .filter((k) => !filter.includes(k))
                             .reduce((o, k) => { 
                                return Object.assign(o, {[k]:prop[k]})
                              }, {});
          else  return prop;
        },

        // Reset
        reset: () => {
          return new Promise((resolve) => {
            Object.keys(user.base).forEach((k) => {
              if (k !== 'email') $rootScope.user[k] = null;
            });
            $timeout(() => {
              $rootScope.$applyAsync();
              resolve();
            });
          });
        },

        // Save
        save: () => {
          window.localStorage.setItem(
            $rootScope.app.id + '_user_email', 
            $rootScope.user.email
          );
        }
      };

      // Return service
      return service;
  }])

  // Application run
  .run([
    '$state',
    '$rootScope',
    '$timeout',
    'trans',
    'lang',
    'user',
    ($state, $rootScope, $timeout, trans, lang, user) => {

      // Transaction events
			trans.events('home,page1,page2');

      // Initialize language 
      lang.init();

      // Initialize user
      user.init();

      // Get current date
      $rootScope.currentDay = new Date();

      // Logout
      $rootScope.logout = () => {

        // Confirm
        if (confirm('Biztosan kijelentkezik?')) {

          // Reset user
          user.reset().then(() => {

            // Go to login
            $state.go('login');
          });
        }
      };
    }
  ])

  // Home controller
  .controller('homeController', [
    '$scope',
    'http',
    function($scope, http) {

      // Http request
      http.request('./php/carousel.php')
      .then(response => {
        $scope.carousel = response;
        $scope.$applyAsync();
      })
      .catch(e => console.log(e));
    }
  ])

  // User controller
  .controller('userController', [
    '$rootScope',
    '$scope',
    '$state',
    '$stateParams',
    '$timeout',
    '$q',
    '$window',
    'util',
    'http',
    'user',
    function($rootScope, $scope, $state, $stateParams, $timeout, $q, $window, util, http, user) {

      // Get/Check parameters
      $scope.userParamsType = $stateParams.type;
      if (!$scope.userParamsType) {
        $state.go($rootScope.state.prev);
        return;
      }

      // Set methods
      $scope.methods = {
        
        // Initialize
        init: (isFirst=true) => {

          // Check parameters
          if (!util.isBoolean(isFirst)) isFirst = true;

          // Set model
          $scope.methods.set().then(() => {

            // Set events
            $scope.methods.events(isFirst);

            // Call first time input changed
            $scope.methods.changed().then(() => {

              // Set focused element
              $scope.methods.setFocusedElement();
            });
          });
        },

        // Set model
        set: () => {

          // Create promise
					return new Promise((resolve) => {

            // Create new deffered objects
            let set = util.deferredObj(),
                all = util.deferredObj();

            // Set helper
            $scope.helper = { 
              element : null,
              code    : util.getTestCode(),
              isEdit  : true
            };
          
            // Set model
            $scope.model = {testcode: null};

            // Switch user parameters type, renews model
            switch($scope.userParamsType) {

              // Login
              case 'login':
                $scope.model.email    = $rootScope.user.email;
                $scope.model.password = null;
                $scope.helper.isForgotPasswordEnabled = false;
                break;

              // Register
              case 'register':
                $scope.model.email2     = null;
                $scope.model.password   = null;
                $scope.model.password2  = null;
                $scope.model = util.objMerge(user.def(['id', 'type']), $scope.model);
                break;

              // Profile
              case 'profile':
                $scope.model = util.objMerge(user.get(), $scope.model);
                $scope.helper.isEdit = false;
                break;
            }

            // When user parameters type is not login, then renews model
            if ($scope.userParamsType !== 'login') {

              // Renews helper
              $scope.helper = util.objMerge({
                maxBorn     : moment().subtract( 18, 'years').format('YYYY-MM-DD'),
                minBorn     : moment().subtract(120, 'years').format('YYYY-MM-DD'),
                image       : null,
                countryCodes: null
              }, $scope.helper);

              // When user parameters type is profile, and user has image properties, then crete image
              if ($scope.userParamsType === 'profile' &&
                  $scope.model.img_type && 
                  $scope.model.img) {
                util.base64Tofile(
                  $scope.model.img_type,
                  $scope.model.img
                ).then(file => {
                  $scope.helper.image = file;
                });
              }

              // Create new deffered objects
              let countries = util.deferredObj(),
                  user      = util.deferredObj();

              // Http request
              http.request($rootScope.app.commonPath+`data/countries.json`)
              .then(response => {
                $scope.helper.countries = response;
                countries.promise.resolve();
              })
              .catch(e => {

                // Resolve completed, reset asynchronous, and show error
                countries.promise.resolve();
                $timeout(() => alert(e), 50);
              });

              // When user parameters type is profile, then get rest user data
              if ($scope.userParamsType === 'profile') {

                // Http request
                http.request({
                  url : `./php/user.php`,
                  data: {id: $rootScope.user.id}
                })
                .then(response => {
                  if (response) {
                    response.born = moment(response.born).toDate();
                    $scope.model  = util.objMerge($scope.model, response);
                    user.promise.resolve();
                  }
                })
                .catch(e => {

                  // Resolve completed, reset asynchronous, and show error
                  user.promise.resolve();
                  $timeout(() => alert(e), 50);
                });
              } else user.promise.resolve();

              // Whait for all completed
              $q.all([countries.completed, user.completed]).then(() => {
                set.promise.resolve();
              });
            } else set.promise.resolve();

            // Whait for set completed
            set.completed.then(() => {

              // Reset asynchronous
              $timeout(() => {

                // When user parameters type is not login
                if ($scope.userParamsType !== 'login') {

                  // Find input image element
                  $scope.helper.fileInput = document.querySelector('input#image[type="file"]');

                  // When user parameters type is profile
                  if ($scope.userParamsType === 'profile') {

                          // Get user country index from contries
                          let index = util.indexByKeyValue(
                                        $scope.helper.countries, 
                                        'country', 
                                        $scope.model.country
                                      );

                          // Check exist
                          if (index !== -1) {
                            $scope.model.country        = $scope.helper.countries[index];
                            $scope.helper.countryCodes  = $scope.helper.countries[index].code;
                          } else {
                            $scope.helper.countryCodes  = null;
                            $scope.model.country        = null;
                            $scope.model.country_code   = null;
                          }

                          // Resolve all completed
                          all.promise.resolve();
                  } else  all.promise.resolve();
                } else {

                  // Find link forgot password
                  $scope.helper.forgotPassword = document.getElementById('forgot_password');

                  // Resolve all completed
                  all.promise.resolve();
                }

                // Whait for all completed
                all.completed.then(() => {

                  // Apply change, and resolve
                  $scope.$applyAsync();
                  resolve();
                });
              });
            });
          });
        },

        // Events
        events: (isFirst) => {

          // When allredy set or user parameters type is login, then break
          if (!isFirst || $scope.userParamsType === 'login') return;

          // Watch user image changed
          $scope.$watch('helper.image', (newValue, oldValue) => {

            // Check is changed
            if(!angular.equals(newValue, oldValue)) {

              // Restore value, apply change, and show error when exist
              let restore = (error=null) => {
                $scope.helper.image = oldValue;
                $scope.$applyAsync();
                if (error) $timeout(() => alert(error), 50);
              };

              // Check has property
              if (newValue) {

                // Check accept file types property
                util.fileAllowedTypes(newValue, $scope.helper.fileInput.accept).then(() => {

                  // File reader
                  util.fileReader(newValue, {
                    method  : 'readAsDataURL',
                    limit   : 64
                  }).then((data) => {

                    // Set image
                    $scope.model.img      = util.getBase64UrlData(data);
                    $scope.model.img_type = newValue.type;
                    $scope.$applyAsync();

                  // Restore
                  }).catch(error => restore(error));
                }).catch(error => restore(error));

              } else {

                // Get/Check input file data attribute file-choice-cancel property
                let isCanceled = $scope.helper.fileInput.getAttribute('data-file-choice-cancel');
                $scope.helper.fileInput.removeAttribute('data-file-choice-cancel');
                if (!isCanceled) {

                  // Reset image
                  $scope.model.img      = null;
                  $scope.model.img_type = null;
                  $scope.$applyAsync();

                // Restore
                } else restore();
              }
            }
          });
        },

        // Input changed
        changed: () => {

          // Create promise
					return new Promise((resolve) => {

            // Reset asynchronous
            $timeout(() => {

              // Get required input elements, accept button. and define variable is disabled
            let inputs      = document.querySelectorAll(
                              'form input[required], form textarea[required], form select[required]'),
                acceptBtn   = document.getElementById('accept'),
                isDisabled  = false;

              // Each required input elements
              inputs.forEach((element) => {

                // Get element identifier as key, belonging to it check mark, define variable is valid
                let key		    = element.id,
                    checkMark = element.closest('.input-row').querySelector('.check-mark'),
                    isValid   = false;

                // Switch model key		
                switch(key) {
                  case 'email':
                  case 'email2':
                    isValid = util.isEmail($scope.model[key]) &&
                              (key === 'email' || $scope.model.email === $scope.model[key]);
                    break;
                  case 'password':
                  case 'password2':
                    isValid = util.isPassword($scope.model[key]) &&
                              (key === 'password' || $scope.model.password === $scope.model[key]);
                    break;
                  case 'testcode':
                    isValid = $scope.model[key] === $scope.helper.code;
                    break;
                  case 'phone':
                    isValid = /^[0-9]{7,14}$/.test($scope.model[key]);
                    break;
                  case 'born':
                    isValid = moment($scope.model[key]).isValid() &&
                            (moment($scope.model[key]).isSame($scope.helper.maxBorn) ||
                              moment($scope.model[key]).isBefore($scope.helper.maxBorn)) &&
                            (moment($scope.model[key]).isSame($scope.helper.minBorn) ||
                              moment($scope.model[key]).isAfter($scope.helper.minBorn));       
                    break;
                  case 'female':
                  case 'male':
                    isValid = $scope.model.gender && "FM".includes($scope.model.gender);
                    break;
                  case 'country':
                    isValid = $scope.model[key] && util.isObject($scope.model[key]);
                    if ($scope.helper.element && $scope.helper.element.id === key) {
                      if (isValid) {
                        $scope.helper.countryCodes  = $scope.model[key].code;
                        $scope.model.country_code   = $scope.helper.countryCodes[0];
                      } else {
                        $scope.helper.countryCodes  = null;
                        $scope.model.country_code   = null;
                      }
                    }
                    break;
                  case 'country_code':
                    isValid = $scope.helper.countryCodes && 
                              $scope.helper.countryCodes.includes($scope.model[key]);
                    break;
                  default:
                    isValid = $scope.model[key] && $scope.model[key].trim().length;
                }

                // Check mark
                if (checkMark) {
                  if (isValid && $scope.helper.isEdit)
                        checkMark.classList.add('show');
                  else  checkMark.classList.remove('show');
                }

                // Check is disabled 
                isDisabled = isDisabled || !isValid;
              });

              // Set accept button 
              acceptBtn.disabled = isDisabled;

              // Reset asynchronous
              $timeout(() => {

                // When user parameters type is login
                if ($scope.userParamsType === 'login') {

                  // Set link password frogot enabled/disabled
                  $scope.helper.isForgotPasswordEnabled = 
                      util.isEmail($scope.model.email) &&
                      $scope.model.testcode === $scope.helper.code &&
                     (util.isNull($scope.model.password) ||
                      util.isUndefined($scope.model.password));
                  $scope.$applyAsync();
                }
                // Resolve
                resolve();
              });
            });
          });
        },

        // Cancel
        cancel: () => {

          // Check suser parameters type is profile
          if ($scope.userParamsType === 'profile') {

            // Remove event on before unload
            window.onbeforeunload = null;

            // Reset data, and unset scope data key
            $scope.model = util.objMerge({}, $scope.data.model);
            $scope.helper.countryCodes  = $scope.data.countryCodes;
            $scope.helper.image         = $scope.data.image;
            delete $scope.data;

            // Disable edit mode, and apply change
            $scope.helper.isEdit = false;
            $scope.$broadcast('SetVisibility');
            $scope.$applyAsync();

            // Call input changed
            $scope.methods.changed().then(() => {

              $window.scrollTo(0, 0);
            });

          // Go prevent state or to home
          } else if (['login','register','profile'].includes($rootScope.state.prev))
                $state.go('home');
          else  $state.go($scope.state.prev);
        },

        // Accept
        accept: () => {

          // Check user parameters type is profile
          if ($scope.userParamsType === 'profile') {

            // Remove event on before unload
            window.onbeforeunload = null;

            // Disable edit mode, and apply change
            $scope.helper.isEdit = false;
            $scope.$broadcast('SetVisibility');
            $scope.$applyAsync();
          }

          // Get only necessary properties
          let data = Object.keys($scope.model)
                           .filter((key) => !['typeName','testcode','email2','password2'].includes(key))
                           .reduce((obj, key) => { 
                              return Object.assign(obj, { [key]: $scope.model[key] })
                            }, {});

          // When user parameters type is not login, then convert data properties 
          if ($scope.userParamsType !== 'login') {
            data.born     = moment(data.born).format('YYYY-MM-DD');
            data.country  = data.country.country;
          }

          // Http request
          http.request({
            url   : `./php/${$scope.userParamsType}.php`,
            method: $scope.userParamsType === 'login' ? 'GET' : 'POST',
            data  : data
          })
          .then(response => {

            // Switch user parameters type
            switch($scope.userParamsType) {

              // Register
              case 'register':
                if (response.affectedRows) {
                        data.id = response.lastInsertId;
                        user.set(data);
                } else  alert('Registration failed!');
                break;
              
              // Profile
              case 'profile':
                if (response.affectedRows) {
                        data.email = $rootScope.user.email;
                        user.set(data, false);
                } else  alert('Modify data failed!');
                break;

              // Login
              default:
                response.email = $scope.model.email;
                user.set(response);
            }
            
            // Check user parameters type is profile
            if ($scope.userParamsType !== 'profile') {

              // Go prevent state or to home
              if (['login', 'register', 'profile'].includes($rootScope.state.prev))
                    $state.go('home');
              else  $state.go($scope.state.prev);
            } else  $window.scrollTo(0, 0);
          })

          // Error
          .catch(e => {

            // Initialize
            $scope.methods.init(false);

            // Reset asynchronous, and show error
            $timeout(() => alert(e), 50);
          });
        },

        // Edit
        edit: () => {

          // Set event on before unload
          window.onbeforeunload = (event) => {
            event.preventDefault();
            return event.returnValue = 'Are you sure you want to leave?';
          }

          // Enable edit mode, and apply change
          $scope.helper.isEdit = true;
          $scope.$broadcast('SetVisibility');
          $scope.$applyAsync();

          // Reset asynchronous
          $timeout(() => {

            // Call input changed
            $scope.methods.changed().then(() => {

              // Set focused element
              $scope.methods.setFocusedElement();

              // Save data
              $scope.data = {
                model       : util.objMerge({}, $scope.model),
                countryCodes: $scope.helper.countryCodes,
                image       : $scope.helper.image
              }
            });
          });
        },

        // Forgot password
        forgotPassword: () => {
          alert(util.capitalize($rootScope.lang.data.under_construction) + '!');
        },

        // Refresh testcode
        testcodeRefresh: (event) => {
          event.preventDefault();
          $scope.helper.code = util.getTestCode();
          $scope.model.testcode = null;
          $scope.$applyAsync();
          event.currentTarget.closest('.input-row')
                             .querySelector('input').focus();
          $timeout(() => $scope.methods.changed());
        },

        // Initialize testcode
        testcodeInit: (event) => {
          if (event.ctrlKey && event.altKey && event.key.toUpperCase() === 'T') {
            $scope.model.testcode = $scope.helper.code;
            event.currentTarget.parentElement.querySelector('.clear-icon').classList.add('show');
            $scope.$applyAsync();
            $timeout(() => $scope.methods.changed());
          }
        },

        // Set focused element
        setFocusedElement: (event) => {

          // Check is not call from html
          if (!event) {

            // Get all input elements, and set variable is found
            let inputs  = document.querySelectorAll('form input, form textarea, form select'),
                isFound = false;

            // Each input elements
            for (let i=0; i < inputs.length; i++) {
              
              // Get input identifier key
              let key = inputs[i].id;

              // Check is not disabled, has model, and has not value
              if (!inputs[i].disabled &&
                  util.isObjectHasKey($scope.model, key) &&
                  !$scope.model[key]) {
                
                // Set input element focus, mark is fouund, and break
                inputs[i].focus();
                isFound = true;
                break;
              }
            }
          
            // When is not found, then set first input focus
            if (!isFound) inputs[0].focus();
          
          // Set helper element
          } else $scope.helper.element = event.currentTarget;
        }
      };

      // Initialize
      $scope.methods.init();
    }
  ]);

})(window, angular);