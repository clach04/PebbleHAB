var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var configURL = 'http://trusk89.github.io/PebbleHAB/';
var URL = 'http://bartis.asuscomm.com:7070/rest/items';
var username = 'alex.bartis@gmail.com';
var password = 'marinaru89';
var items = [];
var itemsArray = [];

var splashWindow = new UI.Window();

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

var errorText = new UI.Text({
    position: new Vector2(0, 0),
    size: new Vector2(144, 168),
    text: 'An error has occurred',
    font: 'GOTHIC_28_BOLD',
    color: 'black',
    textOverflow: 'wrap',
    textAlign: 'center',
    backgroundColor: 'white'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

var parseFeed = function (data, quantity) {
    var i;
    var array = JSON.parse(data);
    var len = array.item.length;
    for (i = 0; i < len; i++) {
        var item = array.item[i];
        if (item.type === 'SwitchItem' && item.state != 'Uninitialized') {
            // Add to menu items array
            items.push({
                title: item.name,
                subtitle: item.state
            });
        } else if (item.name.indexOf("temp") > -1 || item.name.indexOf("Temp") > -1) {
            console.log('Temeperature items are ' + item.name);
            items.push({
                title: item.name,
                subtitle: item.state
            });
        }
    }

    // Finally return whole array
    itemsArray = items;
    return items;
};


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

            output = output + Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) + Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);

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
    }
};

var createToken = function () {
    var string = username + ':' + password;
    var toBase64 = Base64.encode(string);
    return toBase64;
};

ajax({
    type: "GET",
    url: URL,
    headers: {
        Accept: "application/json; charset=utf-8",
            "Content-Type": "application/json; charset=utf-8",
        Authorization: "Basic " + createToken()
    }
},

function (data) {
    // Success!
    var currentdate = new Date();
    var datetime = currentdate.getDate() + "/" + (currentdate.getMonth() + 1) + "/" + currentdate.getFullYear() + " @ " + currentdate.getHours() + ":" + currentdate.getMinutes();
    console.log(datetime);
    console.log('Successfully fetched OpenHAB data!' + data);
    // Construct Menu to show to user
    var menuItems = parseFeed(data);
    console.log('Menu Items number ' + menuItems.length);
    var resultsMenu = new UI.Menu({
        sections: [{
            title: 'Items',
            items: menuItems
        }]
    });

    // Show the Menu, hide the splash
    resultsMenu.show();
    splashWindow.hide();
},

function (error) {
    // Failure!
    var currentdate = new Date();
    var datetime = currentdate.getDate() + "/" + (currentdate.getMonth() + 1) + "/" + currentdate.getFullYear() + " @ " + currentdate.getHours() + ":" + currentdate.getMinutes();
    console.log(datetime);
    console.log('Failed fetching weather data: ' + error);

    splashWindow.add(errorText);
    splashWindow.show();
});

Pebble.addEventListener('showConfiguration', function (e) {
    // Show config page
    Pebble.openURL(configURL);
});

Pebble.addEventListener('webviewclosed',

function (e) {
    console.log('Configuration window returned: ' + e.response);
    console.log(JSON.stringify(e.options));
});