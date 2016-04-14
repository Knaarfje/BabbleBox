var app = angular.module('babbleBoxApp', [])

app.filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}])

app.service('UserMedia', ['$q', function($q) {

    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;


    var deferred = $q.defer();

    var get = function(constraints) {
        navigator.getUserMedia(
            constraints,
            function(stream) { deferred.resolve(stream); },
            function errorCallback(error) {
                console.log('navigator.getUserMedia error: ', error);
                deferred.reject(error);
            }
        );

        return deferred.promise;
    }

    return {
        get: get
    }

}]);

var BabbleBoxState = {
    LOADING: -1,
    READY: 0,
    RECORDING: 1,
    PLAYBACK: 2,
    SAVING: 3,
    SAVED: 4
}


app.controller("babbleBoxController", function($scope, $sce, UserMedia, $http, $interval, $timeout) {
    $scope.state = BabbleBoxState.LOADING;
    $scope.playing = false;

    // countdown interval props    
    $scope.countdownPromise;
    $scope.countdown;

    // recording duration props
    $scope.durationPromise;
    $scope.recordingDuration = 0;

    $scope.user = {
        name: null,
        email: null
    }

    var hdConstraints = {
        audio: true,
        video: {
            mandatory: {
                minWidth: 1280,
                minHeight: 720
            }
        }
    };
    var v = document.getElementById("mainVideo");
    $scope.videoSrc = "";

    $scope.init = () => {
        $scope.state = BabbleBoxState.LOADING;

        UserMedia.get(hdConstraints).then((stream) => {
            console.log('starting video', stream);
            window.stream = stream; // stream available to console for dev
            if (window.URL) {
                console.log('using window.URL');
                $scope.videoSrc = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));
            } else {
                $scope.videoSrc = $sce.trustAsResourceUrl(stream);
            }

            $scope.initRecorder(stream);
        });
    }

    $scope.initRecorder = (stream) => {
        $scope.recorder = new MRecordRTC();
        $scope.recorder.addStream(stream);
        $scope.recorder.mediaType = {
            audio: true, // or StereoAudioRecorder
            video: true, // or WhammyRecorder
        };
        $scope.state = BabbleBoxState.READY;

    };

    $scope.record = () => {
        $scope.state = BabbleBoxState.RECORDING;
        $scope.recorder.startRecording();
        $scope.recordingDuration = 0;
        //Start the timer
        if ($scope.durationPromise) {
            $interval.cancel($scope.durationPromise);
        }

        $scope.durationPromise = $interval(() => {
            $scope.recordingDuration++;
        }, 1000);
    };

    $scope.stopRecord = () => {
        $scope.recorder.stopRecording(function(url, type) {
            if (type === 'video') {
                $scope.videoSrc = $sce.trustAsResourceUrl(url);
                $scope.state = BabbleBoxState.PLAYBACK;
                $scope.playing = !v.paused;
                //stop the timer
                if ($scope.durationPromise) {
                    $interval.cancel($scope.durationPromise);
                }
                $scope.$apply();
            }
        });
    };

    $scope.initCountdown = (from, callback) => {
        $scope.state = BabbleBoxState.RECORDING;
        if ($scope.countdownPromise) {
            $interval.cancel($scope.countdownPromise);
        }

        $scope.countdown = from;

        $scope.countdownPromise = $interval(() => {
            $scope.countdown--;
            if ($scope.countdown == 0) {
                $interval.cancel($scope.countdownPromise);
                if (callback) {
                    callback();
                }
            }
        }, 1000);
    }

    $scope.play = () => {
        if (!v.paused) {
            v.pause();
        }
        else {
            v.play();
        }
        $scope.playing = !v.paused;
    }

    $scope.cycleStates = () => {
        if ($scope.state == 4) {
            $scope.state = 0;
        }
        else {
            $scope.state++;
        }
    }
    
        

        
    

    $scope.save = () => {
        $scope.state = BabbleBoxState.SAVING;
        $scope.recorder.getBlob(function(blob) {
            var d = new FormData();
            d.append('files[]', blob.video, 'video.webm');
            d.append("Name", $scope.user.name);
            d.append("Email", $scope.user.email);

            $http({
                url: 'api/file/post',
                method: "POST",
                data: d,
                headers: { 'Content-Type': undefined },
                transformRequest: function(data) { return data; }
            }).success(function(response) {
                $scope.state = BabbleBoxState.SAVED;
                $scope.user = {
                    name: null,
                    email: null
                };
                
                $timeout(function(){
                    if ($scope.state = BabbleBoxState.SAVED) $scope.state = BabbleBoxState.READY;
                },10000)
            });
        });
    }

    $scope.reset = () => {
        $scope.init();
    }
});




// var a;




//         var recorder = new MRecordRTC();
//         recorder.addStream(MediaStream);
//         recorder.mediaType = {
//             audio: true, // or StereoAudioRecorder
//             video: true, // or WhammyRecorder
//         };

//         recorder.startRecording();
// recorder.stopRecording(function(url, type) {
//     document.querySelector(type).src = url;
// });
