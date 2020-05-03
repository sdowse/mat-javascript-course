var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    }
    else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    }
    else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};


//</editor-fold>

app.controller('ScreenshotReportController', function ($scope, $http) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
    }

    this.showSmartStackTraceHighlight = true;

    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };

    this.convertTimestamp = function (timestamp) {
        var d = new Date(timestamp),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        // ie: 2013-02-18, 8:35 AM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

        return time;
    };


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };


    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };

    this.applySmartHighlight = function (line) {
        if (this.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return true;
    };

    var results = [
    {
        "description": "should create a productmeat|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "d29b43fe6b91e7f57a7dd012b0a32c92",
        "instanceId": 14916,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b5000a-00b8-003d-00dd-007a00b4001d.png",
        "timestamp": 1551970018111,
        "duration": 3794
    },
    {
        "description": "should create a productvegetables|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "d29b43fe6b91e7f57a7dd012b0a32c92",
        "instanceId": 14916,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004100ab-0000-005f-00bf-002c004400d4.png",
        "timestamp": 1551970022627,
        "duration": 3050
    },
    {
        "description": "should create a productbread|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "d29b43fe6b91e7f57a7dd012b0a32c92",
        "instanceId": 14916,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000a0019-00fd-005c-0079-0006002600e1.png",
        "timestamp": 1551970025990,
        "duration": 2657
    },
    {
        "description": "should create a productpasta|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "d29b43fe6b91e7f57a7dd012b0a32c92",
        "instanceId": 14916,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fe0091-00c5-0079-00b5-0017008800a5.png",
        "timestamp": 1551970028983,
        "duration": 2958
    },
    {
        "description": "should create a productmeat|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4b210ee609aaaf963756e103ae5eeab8",
        "instanceId": 11712,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006700c1-0012-0037-00f1-000200810063.png",
        "timestamp": 1551970786208,
        "duration": 3143
    },
    {
        "description": "should create a productvegetables|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4b210ee609aaaf963756e103ae5eeab8",
        "instanceId": 11712,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001c0006-0001-0004-0018-00ae00b600ec.png",
        "timestamp": 1551970789967,
        "duration": 2579
    },
    {
        "description": "should create a productbread|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4b210ee609aaaf963756e103ae5eeab8",
        "instanceId": 11712,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0087008e-009e-009f-00f9-00b900f800a1.png",
        "timestamp": 1551970792848,
        "duration": 2285
    },
    {
        "description": "should create a productpasta|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4b210ee609aaaf963756e103ae5eeab8",
        "instanceId": 11712,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e300b9-0051-002d-00a2-008300c700e9.png",
        "timestamp": 1551970795412,
        "duration": 2682
    },
    {
        "description": "should create a productmeat|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "41eed62ff04ef49c8ff2605dad8df871",
        "instanceId": 6188,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006100a9-00a5-00af-00b8-00e3000d00a6.png",
        "timestamp": 1551971162739,
        "duration": 3977
    },
    {
        "description": "should create a productvegetables|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "41eed62ff04ef49c8ff2605dad8df871",
        "instanceId": 6188,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e5000d-00b1-00e8-0025-006200740022.png",
        "timestamp": 1551971167448,
        "duration": 3318
    },
    {
        "description": "should create a productbread|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "41eed62ff04ef49c8ff2605dad8df871",
        "instanceId": 6188,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009200e8-004f-00d8-0096-006000b80062.png",
        "timestamp": 1551971171126,
        "duration": 2650
    },
    {
        "description": "should create a productpasta|productTests",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "41eed62ff04ef49c8ff2605dad8df871",
        "instanceId": 6188,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.119"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0061005e-0082-0001-001c-00b5000b00e8.png",
        "timestamp": 1551971174100,
        "duration": 2697
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    }
                    else
                    {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.sortSpecs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.sortSpecs();
    }


});

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

