(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
  function corslite(url, callback, cors) {
      var sent = false;
  
      if (typeof window.XMLHttpRequest === 'undefined') {
          return callback(Error('Browser not supported'));
      }
  
      if (typeof cors === 'undefined') {
          var m = url.match(/^\s*https?:\/\/[^\/]*/);
          cors = m && (m[0] !== location.protocol + '//' + location.domain +
                  (location.port ? ':' + location.port : ''));
      }
  
      var x = new window.XMLHttpRequest();
  
      function isSuccessful(status) {
          return status >= 200 && status < 300 || status === 304;
      }
  
      if (cors && !('withCredentials' in x)) {
          // IE8-9
          x = new window.XDomainRequest();
  
          // Ensure callback is never called synchronously, i.e., before
          // x.send() returns (this has been observed in the wild).
          // See https://github.com/mapbox/mapbox.js/issues/472
          var original = callback;
          callback = function() {
              if (sent) {
                  original.apply(this, arguments);
              } else {
                  var that = this, args = arguments;
                  setTimeout(function() {
                      original.apply(that, args);
                  }, 0);
              }
          }
      }
  
      function loaded() {
          if (
              // XDomainRequest
              x.status === undefined ||
              // modern browsers
              isSuccessful(x.status)) callback.call(x, null, x);
          else callback.call(x, x, null);
      }
  
      // Both `onreadystatechange` and `onload` can fire. `onreadystatechange`
      // has [been supported for longer](http://stackoverflow.com/a/9181508/229001).
      if ('onload' in x) {
          x.onload = loaded;
      } else {
          x.onreadystatechange = function readystate() {
              if (x.readyState === 4) {
                  loaded();
              }
          };
      }
  
      // Call the callback with the XMLHttpRequest object as an error and prevent
      // it from ever being called again by reassigning it to `noop`
      x.onerror = function error(evt) {
          // XDomainRequest provides no evt parameter
          callback.call(this, evt || true, null);
          callback = function() { };
      };
  
      // IE9 must have onprogress be set to a unique function.
      x.onprogress = function() { };
  
      x.ontimeout = function(evt) {
          callback.call(this, evt, null);
          callback = function() { };
      };
  
      x.onabort = function(evt) {
          callback.call(this, evt, null);
          callback = function() { };
      };
  
      // GET is the only supported HTTP Verb by XDomainRequest and is the
      // only one supported here.
      x.open('GET', url, true);
  
      // Send the request. Sending data is not supported.
      x.send(null);
      sent = true;
      //alert(url)
      return x;
  }
  
  if (typeof module !== 'undefined') module.exports = corslite;
  
  },{}],2:[function(require,module,exports){
  var polyline = {};
  
  // Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
  //
  // Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
  // by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)
  
  function encode(coordinate, factor) {
      coordinate = Math.round(coordinate * factor);
      coordinate <<= 1;
      if (coordinate < 0) {
          coordinate = ~coordinate;
      }
      var output = '';
      while (coordinate >= 0x20) {
          output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
          coordinate >>= 5;
      }
      output += String.fromCharCode(coordinate + 63);
      return output;
  }
  
  // This is adapted from the implementation in Project-OSRM
  // https://github.com/DennisOSRM/Project-OSRM-Web/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
  polyline.decode = function(str, precision) {
      var index = 0,
          lat = 0,
          lng = 0,
          coordinates = [],
          shift = 0,
          result = 0,
          byte = null,
          latitude_change,
          longitude_change,
          factor = Math.pow(10, precision || 5);
  
      // Coordinates have variable length when encoded, so just keep
      // track of whether we've hit the end of the string. In each
      // loop iteration, a single coordinate is decoded.
      while (index < str.length) {
  
          // Reset shift, result, and byte
          byte = null;
          shift = 0;
          result = 0;
  
          do {
              byte = str.charCodeAt(index++) - 63;
              result |= (byte & 0x1f) << shift;
              shift += 5;
          } while (byte >= 0x20);
  
          latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
  
          shift = result = 0;
  
          do {
              byte = str.charCodeAt(index++) - 63;
              result |= (byte & 0x1f) << shift;
              shift += 5;
          } while (byte >= 0x20);
  
          longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
  
          lat += latitude_change;
          lng += longitude_change;
  
          coordinates.push([lat / factor, lng / factor]);
      }
  
      return coordinates;
  };
  
  polyline.encode = function(coordinates, precision) {
      if (!coordinates.length) return '';
  
      var factor = Math.pow(10, precision || 5),
          output = encode(coordinates[0][0], factor) + encode(coordinates[0][1], factor);
  
      for (var i = 1; i < coordinates.length; i++) {
          var a = coordinates[i], b = coordinates[i - 1];
          output += encode(a[0] - b[0], factor);
          output += encode(a[1] - b[1], factor);
      }
  
      return output;
  };
  
  if (typeof module !== undefined) module.exports = polyline;
  
  },{}],3:[function(require,module,exports){
  (function (global){
  (function() {
    'use strict';
  
    var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);
  
    L.Routing = L.Routing || {};
  
    //L.extend(L.Routing, require('./L.Routing.Localization'));  
    L.Routing.Valhalla.Formatter = L.Class.extend({
      options: {
        units: 'metric',
        unitNames: {
          meters: 'm',
          kilometers: 'km',
          yards: 'yd',
          miles: 'mi',
          hours: 'h',
          minutes: 'mín',
          seconds: 's'
        },
        language: 'en',
        roundingSensitivity: 1,
        distanceTemplate: '{value} {unit}'
      },
  
      initialize: function(options) {
        L.setOptions(this, options);
      },
  
      formatDistance: function(d /* Number (meters) */) {
        var un = this.options.unitNames,
            v,
          data;
  
        if (this.options.units === 'imperial') {
          d = d / 1.609344;
          if (d >= 1000) {
            data = {
              value: (this._round(d) / 1000),
              unit: un.miles
            };
          } else {
            data = {
              value: this._round(d / 1.760),
              unit: un.yards
            };
          }
        } else {
          v = d;
          data = {
            value: v >= 1 ? v: v*1000,
            unit: v >= 1 ? un.kilometers : un.meters
          };
        }
  
         return L.Util.template(this.options.distanceTemplate, data);
      },
  
      _round: function(d) {
        var pow10 = Math.pow(10, (Math.floor(d / this.options.roundingSensitivity) + '').length - 1),
          r = Math.floor(d / pow10),
          p = (r > 5) ? pow10 : pow10 / 2;
  
        return Math.round(d / p) * p;
      },
  
      formatTime: function(t /* Number (seconds) */) {
        if (t > 86400) {
          return Math.round(t / 3600) + ' h';
        } else if (t > 3600) {
          return Math.floor(t / 3600) + ' h ' +
            Math.round((t % 3600) / 60) + ' min';
        } else if (t > 300) {
          return Math.round(t / 60) + ' min';
        } else if (t > 60) {
          return Math.floor(t / 60) + ' min' +
            (t % 60 !== 0 ? ' ' + (t % 60) + ' s' : '');
        } else {
          return t + ' s';
        }
      },
  
      formatInstruction: function(instr, i) {
        // Valhalla returns instructions itself.
        return instr.instruction;
      },
  
      getIconName: function(instr, i) {
        // you can find all Valhalla's direction types at https://github.com/valhalla/odin/blob/master/proto/tripdirections.proto
        switch (instr.type) {
          case 1:
            return 'kStart';
          case 2:
            return 'kStartRight';
          case 3:
            return 'kStartLeft';
          case 4:
            return 'kDestination';
          case 5:
            return 'kDestinationRight';
          case 6:
            return 'kDestinationLeft';
          case 7:
            return 'kBecomes';
          case 8:
            return 'kContinue';
          case 9:
            return 'kSlightRight';
          case 10:
            return 'kRight';
          case 11:
            return 'kSharpRight';
          case 12:
            return 'kUturnRight';
          case 13:
            return 'kUturnLeft';
          case 14:
            return 'kSharpLeft';
          case 15:
            return 'kLeft';
          case 16:
            return 'kSlightLeft';
          case 17:
            return 'kRampStraight';
          case 18:
            return 'kRampRight';
          case 19:
            return 'kRampLeft';
          case 20:
            return 'kExitRight';
          case 21:
            return 'kExitLeft';
          case 22:
            return 'kStayStraight';
          case 23:
            return 'kStayRight';
          case 24:
            return 'kStayLeft';
          case 25:
            return 'kMerge';
          case 26:
            return 'kRoundaboutEnter';
          case 27:
            return 'kRoundaboutExit';
          case 28:
            return 'kFerryEnter';
          case 29:
            return 'kFerryExit';
        }
      },
  
      _getInstructionTemplate: function(instr, i) {
        return instr.instruction + " " +instr.length;
      }
    });
  
   // module.exports = L.Routing;
  })();
  }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  },{}],4:[function(require,module,exports){
  (function (global){
  (function() {
    'use strict';
  
    var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);
    var corslite = require('corslite');
    var polyline = require('polyline');
  
    L.Routing = L.Routing || {};
  
    L.Routing.Valhalla = L.Class.extend({
      options: {
        serviceUrl: 'http://localhost:8002/',
        timeout: 30 * 1000,
        transitmode: 'pedestrian',
        polygon: ''
      },
  
      initialize: function(accessToken, transitmode, polygon, options) {
        L.Util.setOptions(this, options);
        this._accessToken = accessToken;
        this._transitmode = transitmode;
        this._polygon = polygon;
        this._hints = {
          locations: {}
        };
      },
  
      route: function(waypoints, callback, context, options) {
        var timedOut = false,
          wps = [],
          url,
          timer,
          wp,
          i;
  
        options = options || {};
        //waypoints = options.waypoints || waypoints;
        url = this.buildRouteUrl(waypoints, options);
  
  
        timer = setTimeout(function() {
                  timedOut = true;
                  callback.call(context || callback, {
                    status: -1,
                    message: 'OSRM request timed out.'
                  });
                }, this.options.timeout);
  
        // Create a copy of the waypoints, since they
        // might otherwise be asynchronously modified while
        // the request is being processed.
        for (i = 0; i < waypoints.length; i++) {
          wp = waypoints[i];
          wps.push({
            latLng: wp.latLng,
            name: wp.name || "",
            options: wp.options || {}
          });
        }
  
  
        corslite(url, L.bind(function(err, resp) {
          var data;
          var data_err;
          clearTimeout(timer);
          if (!timedOut) {
            if (!err) {
              data = JSON.parse(resp.responseText);
              //(JSON.stringify(data));
              this._routeDone(data, wps, callback, context);
            } else {
              data_err = JSON.parse(err.responseText);
              //alert(JSON.stringify(data_err));
              callback.call(context || callback, {
                status: err.status,
                message: err.responseText
              });
            }
          }
        }, this), true);
  
        return this;
      },
  
      _routeDone: function(response, inputWaypoints, callback, context) {
        var coordinates,
            alts,
            actualWaypoints,
            i;
        context = context || callback;
        if (response.trip.status !== 0) {
          callback.call(context, {
            status: response.status,
            message: response.status_message
          }
          );
          return;
        }

        var insts = [];
        var coordinates = [];
        var shapeIndex =  0;
        
        for(var i = 0; i < response.trip.legs.length; i++){
          var coord = polyline.decode(response.trip.legs[i].shape, 6);
  
          for(var k = 0; k < coord.length; k++){
            coordinates.push(coord[k]);
          }
          
          for(var j =0; j < response.trip.legs[i].maneuvers.length; j++){
            
            var res = response.trip.legs[i].maneuvers[j];
            res.distance = response.trip.legs[i].maneuvers[j]["length"];
            
            res.index = shapeIndex + response.trip.legs[i].maneuvers[j]["begin_shape_index"];
            insts.push(res);
          }
  
          shapeIndex += response.trip.legs[i].maneuvers[response.trip.legs[i].maneuvers.length-1]["begin_shape_index"];
          //(JSON.stringify(coordinates))
          //alert(response.trip.legs[i].maneuvers.length)
        }
       
        actualWaypoints = this._toWaypoints(inputWaypoints, response.trip.locations);
  
  
        alts = [{
          name: this._trimLocationKey(inputWaypoints[0].latLng) + " , " + this._trimLocationKey(inputWaypoints[1].latLng) ,
          unit: response.trip.units,
          transitmode: this._transitmode,
          polygon: this._polygon,
          coordinates: coordinates,
          instructions: insts,//response.route_instructions ? this._convertInstructions(response.route_instructions) : [],
          summary: response.trip.summary ? this._convertSummary(response.trip.summary) : [],
          inputWaypoints: inputWaypoints,
          waypoints: actualWaypoints,
          waypointIndices: this._clampIndices([0,response.trip.legs[0].maneuvers.length], coordinates)
        }];
  
        // only versions <4.5.0 will support this flag
          if (response.hint_data) {
            this._saveHintData(response.hint_data, inputWaypoints);
          }
        callback.call(context, null, alts);
      },
  
      _saveHintData: function(hintData, waypoints) {
        var loc;
        this._hints = {
          checksum: hintData.checksum,
          locations: {}
        };
        for (var i = hintData.locations.length - 1; i >= 0; i--) {
          loc = waypoints[i].latLng;
          this._hints.locations[this._locationKey(loc)] = hintData.locations[i];
        }
      },
  
      _toWaypoints: function(inputWaypoints, vias) {
        var wps = [],
            i;
        for (i = 0; i < vias.length; i++) {
          wps.push(L.Routing.waypoint(L.latLng([vias[i]["lat"],vias[i]["lon"]]),
                                      "name",
                                      {}));
        }
  
        return wps;
      },
      ///mapzen example
      buildRouteUrl: function(waypoints, options) {
        var locs = [],
            locationKey,
            hint;
        var locationList = []
        var origDestExclusion = []
        var transitM = options.transitmode || this._transitmode;
        var excludePoly = structuredClone(options.polygon || this._polygon)
        this._transitmode = transitM;
        this._polygon = structuredClone(excludePoly)
  
        for (var i = 0; i < waypoints.length; i++) {
          var loc;
          locationKey = this._locationKey(waypoints[i].latLng).split(',');
          if(i === 0 || i === waypoints.length-1){
            loc = {
              lat: parseFloat(locationKey[0]),
              lon: parseFloat(locationKey[1]),
              type: "break"
            }
          }else{
            loc = {
              lat: parseFloat(locationKey[0]),
              lon: parseFloat(locationKey[1]),
              type: "through"
            }
          }
          locs.push(loc);
          locationList.push(locationKey)
        }
        
      
        for (let k = 0; k < locationList.length; k++){
          for (let l = 0; l < excludePoly.length; l++){
            var x = locationList[k][1], y = locationList[k][0];
            for (var i = 0, j = excludePoly[l].length - 1; i < excludePoly[l].length; j = i++) {
              var xi = excludePoly[l][i][0], yi = excludePoly[l][i][1];
              var xj = excludePoly[l][j][0], yj = excludePoly[l][j][1];
              var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
              if (intersect){
                //alert(excludePoly[l])
                origDestExclusion.push(l);
                break;
              }
            }
          }
        }

        origDestExclusion = [...new Set(origDestExclusion)];
        //alert(origDestExclusion.length);
        for (let i = 0; i < origDestExclusion.length; i++){
          excludePoly.splice(origDestExclusion[i], 1)
        }        

        var params = JSON.stringify(
          {
            locations: locs,
            costing: transitM,
            exclude_polygons: excludePoly
          }
        );
        
        origDestExclusion = [];
        return this.options.serviceUrl + 'route?json=' + params
      },

        
  
      _locationKey: function(location) {
        return location.lat + ',' + location.lng;
      },
  
      _trimLocationKey: function(location){
        var lat = location.lat;
        var lng = location.lng;
  
        var nameLat = Math.floor(location.lat * 1000)/1000;
        var nameLng = Math.floor(location.lng * 1000)/1000;
  
        return nameLat + ' , ' + nameLng;
  
      },
  
      _convertSummary: function(route) {
        return {
          totalDistance: route.length,
          totalTime: route.time
        };
      },
  
      _convertInstructions: function(osrmInstructions) {
        var result = [],
            i,
            instr,
            type,
            driveDir;
  
        for (i = 0; i < osrmInstructions.length; i++) {
          instr = osrmInstructions[i];
          type = this._drivingDirectionType(instr[0]);
          driveDir = instr[0].split('-');
          if (type) {
            result.push({
              type: type,
              distance: instr[2],
              time: instr[4],
              road: instr[1],
              direction: instr[6],
              exit: driveDir.length > 1 ? driveDir[1] : undefined,
              index: instr[3]
            });
          }
        }
  
        return result;
      },
  
      _clampIndices: function(indices, coords) {
        var maxCoordIndex = coords.length - 1,
          i;
        for (i = 0; i < indices.length; i++) {
          indices[i] = Math.min(maxCoordIndex, Math.max(indices[i], 0));
        }
      }
    });
  
    L.Routing.valhalla = function(accessToken, transitmode, options) {
      return new L.Routing.Valhalla(accessToken, transitmode, options);
    };
  
    module.exports = L.Routing.Valhalla;
  })();
  }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  },{"corslite":1,"polyline":2}]},{},[4,3]);
  