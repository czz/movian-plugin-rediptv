/**
 *  librediptv is a module for movian
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



/*
 * JavaScript uses prototypes and does't have classes (or methods for that matter) like Object Oriented languages.
 * JavaScript developer need to think in JavaScript.
 *  Wikipedia quote:
 *  Unlike many object-oriented languages, there is no distinction between a function definition and a method definition.
 *  Rather, the distinction occurs during function calling; when a function is called as a method of an object,
 *  the function's local this keyword is bound to that object for that invocation.
 */


var http = require('movian/http');
var XmlTv = require('./libxmltv');
var html = require('movian/html');

var Rediptv = (function () {

    var _BASE_URL = {
                     rediptv: "https://android.rediptv2.com",
                     richtv: "http://access.richtv1.com",
                     current: null,
                    };

    var _OPTIONS =  {
                     usercode: '0000000000',
                     mac: false,
                     debug : false,
                    };


    /* construct */
    function Rediptv(options) {

        // movian doesn't have mac function to get mac address from javascript
        // untill we implement it we will make a mac from serial
        // P.S. we don't really need this, because is for stalker portal and mag devices on second server
        //this._SN = Core.deviceId;
        //this._MAC = this._SN.substring(0, 16);
        // mac is done by hand


        if (options === Object(options) && Object.prototype.toString.call(options) !== '[object Array]') {
            this.options = function () {
                return  {
                          usercode: options.usercode ? options.usercode : _OPTIONS.usercode,
                          mac : options.mac ? options.mac : _OPTIONS.mac,
                          debug : options.debug ? options.debug : _OPTIONS.debug,
                        };
            }
        }

        this.baseUrl = function () {

                  return {
                           richtv: _BASE_URL.richtv + "/ch.php?usercode=" + this.options().usercode + "&mac=" + this.options().mac,
                           rediptv: _BASE_URL.rediptv + "/ch.php?usercode=" + this.options().usercode + "&mac=" + this.options().mac,
                           current: _BASE_URL.current,
                         };
        };


        this.setCurrentUrl = function(url) {
            _BASE_URL.current = url;
        };


    }



    /******* Methods ********/

    /*
     * Private method Debug
     */
    function _debug(message, tag, force) {
        if(typeof(force) == 'undefined' || force !== true) force = false;
        if(this.options().debug || force ) console.log(message, tag);
    }


    /*
     * Private method req
     */
    function _req(url, statuscode) {

        switch(statuscode) {
            case true:
        }

        var res = false;

        var s = { method: "GET",
                  debug: this.options().debug,
                  //headers: { 'User-Agent' : this.userAgent() },
                  noFail:true,
                 };

        try {
            var v = http.request(url, s);
            switch(statuscode) {
                case true:
                    return v.statuscode;
                    break;
                default:
                    return JSON.parse(v.toString());
                    break;
            }

        }
        catch (e) {
            _debug.call(this,  e.toString().replace('\n', ''), 'RedIpTv' );
        }


        return res;

    }


    function _reqEpg() {

    }


    function _verifyLoginServer(url){

         var res = _req.call(this,url,true);
        _debug.call(this, JSON.stringify(res), "RedIpTv:verifyLoginServer")

        switch(res) {

            case 200:
                  return {status : 200, error: ''};
                break;
            case 502:
                return {status : 502, error: "Bad Gateway" };
                break;
            case 503:
                return {status : 503, error: "Service Anavailable" };
                break;
            case 403:
                return {status : 403, error: "login failed" };
                break;
            default:
                return {status : res, error: "Something went wrong, maybe wrong credentials or expired"};
                break;
        }
        return {status : 'unknown', error: "Something went wrong, maybe wrong credentials or expired"};

    }


    /*
     *  Get infos of your account
     *  returns oject data
     *
     */
    Rediptv.prototype.login = function () {

        var url = this.baseUrl().rediptv;
        var res= _verifyLoginServer.call(this,url);

        if(res.status != 200) {
            url = this.baseUrl().richtv;
            var res2= _verifyLoginServer.call(this,url);
            if(res2.status != 200) {
               return { status: res2.status , status_firt_server: res.status, error: res2.error, error_first_call: res.error}

            }
        }

        this.setCurrentUrl(url);
        return {status : 200, error: ''};

    };


    Rediptv.prototype.getLive = function (){

        var url = this.baseUrl().current;
        var res = _req.call(this,url,false);
        var live=[];

        if(res) {
           for(var i in res) {
console.log("UUURRRRLLL"+ res[i].link);
              live.push({ id: res[i].id ?  res[i].id :  0,
                             genre: res[i].category ?  res[i].category :  0,   // maybe we could devide channels by category and save them in a db for faster ui
                             title: res[i].name ? res[i].name :  'Unknown',
                             icon: (res[i].logo && res[i].logo != '') ? res[i].logo : Plugin.path + 'images/livetv.png',
                             source:{url: res[i].link }
                           });
           }
        }

        return live;

    }



    /*
     *  Get infos of your account
     *  returns oject data
     *
     */
/*    Rediptv.prototype.getInfo = function (action) {

        var res = _req.call(this);
        _debug.call(this, JSON.stringify(res), "Xtream:getInfo")

        if(!res) return false;

        }

        return res;

    }
*/




    return Rediptv;

})();


module.exports = Rediptv;
