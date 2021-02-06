/**
 *  XCtv plugin for Movian Media Center
 *
 *  Copyright (C) 2017 czz78
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var html = require('movian/html');
var Rediptv = require('./libs/librediptv');
var page = require('movian/page');
var store = require('movian/store');
var service =require('movian/service');
var plugin = JSON.parse(Plugin.manifest);
var popup = require('native/popup');

var logo = Plugin.path + plugin.icon;

function setPageHeader(page, title) {

    if (page.metadata) {
        page.metadata.title = title;
        page.metadata.logo = logo;
    }

}


function login(page, credentials){

    page.options.createAction('Login', 'Login', function() {

        var result = popup.textDialog('Enter usercode:\n' , true, true);

        if (!result.rejected && result.input) {

            var usercode = result.input;

            if (!result.rejected && result.input) {
                result = popup.textDialog('Enter mac without colon:\n' , true, true);
                credentials.usercode = encodeURIComponent(usercode);
                credentials.mac = encodeURIComponent(result.input);
                popup.notify("usercode have been set", 2);
                page.flush();
                page.redirect(plugin.id + ':start');
            }
        }
    });

}


// Istances
service.create(plugin.id, plugin.id + ":start", "tv", true, logo);
var rediptv;


var credentials = store.create('credentials');
if (!credentials.usercode) credentials.usercode = '';
if (!credentials.mac) credentials.mac = '';


/*
 * Play
 */
new page.Route(plugin.id + ":play:(.*):(.*)", function(page, title, url) {

    page.loading = false;
    no_subtitle_scan = true;
    page.type = 'video';
    page.source = "videoparams:" + JSON.stringify({
        title: decodeURIComponent(title),
        canonicalUrl: plugin.id + ':play:' + decodeURIComponent(title) + ':' + decodeURIComponent(url),
        sources: [{url:  rediptv.getLink(decodeURIComponent(url))}],

        no_subtitle_scan: no_subtitle_scan
    });

});




/*
 *  First page
 *  It shows the menu
 */
new page.Route(plugin.id + ":start", function(page) {

    setPageHeader(page, 'RedIpTv');
    page.type = "directory";
    page.loading = true;

    rediptv = new Rediptv( {usercode: decodeURIComponent(credentials.usercode), mac: decodeURIComponent(credentials.mac), debug: true});

    var checkLogin = rediptv.login();

    if(checkLogin.status == 200) {
        var live = rediptv.getLive();
        if(live) {
            for (var i in live) {
                page.appendItem(plugin.id + ':play:'+encodeURIComponent(live[i].title)+':' + encodeURIComponent(live[i].source.url) , 'video', live[i]);
                setPageHeader(page,'Live channels ('+ i.toString()+ ' results)');
            }
        }
    }
    else {

        page.model.contents = "list";
        page.appendItem(plugin.id + ':start' , 'directory', {title:'reload', icon: Plugin.path+ "images/livetv.png"} );
        if(!checkLogin.status){
            page.appendPassiveItem('separator','',{title: checkLogin.error});
        }
        page.appendPassiveItem('separator','',{title: 'Not Logged in, use login button on right menu.'});


    }

    login(page, credentials);
    page.loading = false;

});
