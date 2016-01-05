var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var configURL = 'http://trusk89.github.io/PebbleHAB/';
var URL;
var user;
var password;
var items = [];
var splashWindow = new UI.Window();
var resultsMenu = new UI.Menu();
var errorTitle = 'Error';
var currentdate = new Date();
var datetime = currentdate.getDate() + "/" + (currentdate.getMonth() + 1) + "/" + currentdate.getFullYear() + " @ " + currentdate.getHours() + ":" + currentdate.getMinutes();
var dimmerWindow;
var titleText;
var stateText;

var Base64 = {
    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    _utf8_encode: function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },
};

function getCredentials() {
    if (localStorage.getItem('user')) {
        user = localStorage.getItem('user');
    } else {
        user = '';
    }

    if (localStorage.getItem('password')) {
        password = localStorage.getItem('password');
    } else {
        password = '';
    }

    if (localStorage.getItem('server')) {
        URL = localStorage.getItem('server');
        getStatus();
    } else {
        URL = 'http://demo.openhab.org:8080/rest/items';
        getStatus();
    }
}

getCredentials();

var parseSwitchItems = function (data, quantity) {
    items = [];
    var i;
    var array = JSON.parse(data);
    var len = array.item.length;
    for (i = 0; i < len; i++) {
        var item = array.item[i];

        if (item.type === 'SwitchItem') {
            // Add to menu items array
            items.push({
                title: item.name,
                subtitle: item.state
            });
        }
    }

    // Finally return whole array
    return items;
};

var parseTempItems = function (data, quantity) {
    items = [];
    var i;
    var array = JSON.parse(data);
    var len = array.item.length;
    for (i = 0; i < len; i++) {
        var item = array.item[i];
        if (item.name.indexOf('temp') > -1 || item.name.indexOf('Temp') > -1) {
            // Add to menu items array
            items.push({
                title: item.name,
                subtitle: item.state
            });
        }
    }

    // Finally return whole array
    return items;
};

var parseContactItems = function (data, quantity) {
    items = [];
    var i;
    var array = JSON.parse(data);
    var len = array.item.length;
    for (i = 0; i < len; i++) {
        var item = array.item[i];
        if (item.type === 'ContactItem') {
            // Add to menu items array
            items.push({
                title: item.name,
                subtitle: item.state
            });
        }
    }

    // Finally return whole array
    return items;
};

var parseDimmerItems = function (data, quantity) {
    items = [];
    var i;
    var array = JSON.parse(data);
    var len = array.item.length;
    for (i = 0; i < len; i++) {
        var item = array.item[i];
        if (item.type === 'DimmerItem') {
            // Add to menu items array
            items.push({
                title: item.name,
                subtitle: item.state
            });
        }
    }

    // Finally return whole array
    return items;
};

function sendUpdate(url, command) {
    ajax({
        method: 'POST',
        type: 'text',
        url: url,
        data: command,
        headers: {
            "Content-Type": "text/plain",
            Authorization: "Basic " + Base64.encode(user + ':' + password)
        }
    },

    function (data) {
        console.log(datetime + ' ' + 'Succesfully posted data');
        console.log(datetime + ' ' + 'command: ' + command);
        if (isNaN(command)) {
						console.log ('isNan');
           getStatus();
				}
    },

    function (error) {
        // Failure!
        console.log(datetime + ' ' +'Failed posting data: ' + error);
        var errorSubtitle = 'Command send failed';
        createErrorCardWithTitleAndSubtitle(errorTitle, errorSubtitle);
        splashWindow.hide();
    });
}

function getStatus() {
    console.log(datetime + ' ' + 'getStatus() URL: ' + URL);
    ajax({
        type: "GET",
        url: URL,
        headers: {
            Accept: "application/json; charset=utf-8",
                "Content-Type": "application/json; charset=utf-8",
            Authorization: "Basic " + Base64.encode(user + ':' + password)
        }
    },

    function (data) {
        // Success!
        console.log(datetime + ' ' + 'Successfully fetched OpenHAB data!' + data);
        // Construct Menu to show to user

        if ((typeof resultsMenu == "undefined")) {
            createMenu(data);
            resultsMenu.on('select', function (e) {
            console.log(datetime + ' ' + 'The item is titled "' + e.item.title + '"');
                setState(e.item.title, e.item.subtitle);
            });
        } else {
            resultsMenu.hide();
            createMenu(data);
            resultsMenu.on('select', function (e) {
            console.log(datetime + ' ' + 'The item is titled "' + e.item.title + '"');
                setState(e.item.title, e.item.subtitle);
            });
        }
        // Show the Menu, hide the splash
        splashWindow.hide();
			
				if (typeof dimmerWindow != "undefined") {
					dimmerWindow.hide();
				}
    },

    function (error) {
        // Failure!
        console.log(datetime + ' ' + 'Failed fetching data: ' + error);

        var errorSubtitle = 'Server connection could not be made';
        createErrorCardWithTitleAndSubtitle(errorTitle, errorSubtitle);
        splashWindow.hide();
    });
}

function createMenu(data) {
    var switchItems = parseSwitchItems(data);
    var tempItems = parseTempItems(data);
    var contactItems = parseContactItems(data);
    var dimmerItems = parseDimmerItems(data);
    resultsMenu = new UI.Menu({
        sections: [{
            title: 'Switches',
            items: switchItems
        }, {
            title: 'Dimmers',
            items: dimmerItems
        }, {
            title: 'Contact Items',
            items: contactItems
        }, {
            title: 'Temperature',
            items: tempItems
        }]
    });
    resultsMenu.show();
}

function setState(itemTitle, currentState) {
    var postURL = URL + '/' + itemTitle;
    if (currentState == 'ON') {
        sendUpdate(postURL, 'OFF');
    } else if (currentState == 'OFF') {
        sendUpdate(postURL, 'ON');
    } else if (currentState == 'Uninitialized') {
        sendUpdate(postURL, 'ON');
    } else if (!isNaN(currentState)) {
        if (!(itemTitle.indexOf('temp') > -1 || itemTitle.indexOf('Temp') > -1)) {
            console.log(datetime + ' ' + 'Item is valid number and not temp');
            createDimmerWindow(itemTitle, currentState);
        }
    }
}

function createDimmerWindow(itemTitle, currentState) {
    dimmerWindow = new UI.Window({
        fullscreen: true,
				action: {
				up: 'IMAGES_ACTION_ICON_UP_PNG',
				down: 'IMAGES_ACTION_ICON_DOWN_PNG',
				backgroundColor: 'white'
				}
    });
				titleText = new UI.Text({
        position: new Vector2(0, 15),
        size: new Vector2(114, 84),
        font: 'gothic-28-bold',
				textOverflow: 'wrap',
        text: itemTitle,
    });
				stateText = new UI.Text({
        position: new Vector2(0, 105),
        size: new Vector2(114, 84),
        font: 'gothic-24-bold',
        text: currentState
    });
    dimmerWindow.add(titleText);
    dimmerWindow.add(stateText);
    dimmerWindow.show();

    dimmerWindow.on('click', 'up', function (event) {
        getDimmerStatus(itemTitle, 'up');
    });

    dimmerWindow.on('click', 'down', function (event) {
				getDimmerStatus(itemTitle, 'down');
    });
	
		dimmerWindow.on('click', 'back', function (event) {
				getStatus();
    });
}

function getDimmerStatus(itemTitle, command) {
    ajax({
        type: "GET",
        url: URL + '/' + itemTitle,
        headers: {
            Accept: "application/json; charset=utf-8",
                "Content-Type": "application/json; charset=utf-8",
            Authorization: "Basic " + Base64.encode(user + ':' + password)
        }
    },

    function (data) {
		console.log(data);
		var array = JSON.parse(data);
			dimItem(itemTitle, array.state, command);
    },

    function (error) {
			console.log(datetime + ' ' + 'Failed fetching data: ' + error);
			var errorSubtitle = 'Server connection could not be made';
      createErrorCardWithTitleAndSubtitle(errorTitle, errorSubtitle);
    });
}

function dimItem(itemTitle, currentState, command) {
    var postURL = URL + '/' + itemTitle;
		var newState;
    if (command == 'up') {
        var increasedValue = parseInt(currentState) + 10;
        if (increasedValue <= 100) {
            sendUpdate(postURL, increasedValue.toString());
						newState = increasedValue.toString();
        } else {
            sendUpdate(postURL, '100');
						newState = '100';
        }

    } else if (command == 'down') {
        var decreasedValue = parseInt(currentState) - 10;
        if (decreasedValue >= 0) {
						sendUpdate(postURL, decreasedValue.toString());
						newState = decreasedValue.toString();
        } else {
            sendUpdate(postURL, '0');
						newState = '0';
        }
    }
		stateText.text (newState);
		dimmerWindow.add(stateText);
}

function setCredentials(jsonString) {
    var myObject = JSON.parse(jsonString);

    URL = myObject.server + '/rest/items';
    user = myObject.username;
    password = myObject.password;

    localStorage.setItem('server', myObject.server + '/rest/items');
    localStorage.setItem('user', myObject.username);
    localStorage.setItem('password', myObject.password);

    getStatus();
}

// Text element to inform user
var text = new UI.Text({
    position: new Vector2(0, 0),
    size: new Vector2(144, 168),
    text: 'Downloading OpenHAB data...',
    font: 'GOTHIC_28_BOLD',
    color: 'black',
    textOverflow: 'wrap',
    textAlign: 'center',
    backgroundColor: 'white'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

Pebble.addEventListener('showConfiguration', function (e) {
    // Show config page
    Pebble.openURL(configURL);
});

Pebble.addEventListener('webviewclosed', function (e) {
		console.log(datetime + ' ' + 'Configuration window returned: ' + e.response);
    setCredentials(e.response);
    splashWindow.add(text);
    splashWindow.show();
    getStatus();
});

function createErrorCardWithTitleAndSubtitle(title, subtitle) {
    var card = new UI.Card({
        title: title,
        subtitle: subtitle
    });

    // Display the Card
    card.show();
}
