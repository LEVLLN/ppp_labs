#!/usr/bin/env node
var albumsCount = null;
var audiosCount = null;
var photosCount = null;
var friendsCount = null;
var followersCount = null;
var mutualFriendsCount = null;
var credibility = null;
var COEFFICIENT = 3;

var manifestVersion = "";
var manifestAppName = "";
var manifestAppType = "";
var manifestURL = "";

var amqp = require('amqplib/callback_api');
var counters = null;
amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
        var q = 'counters';

        ch.assertQueue(q, {durable: false});
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
        ch.consume(q, function (msg) {
            console.log(" [x] Received %s", msg.content.toString());
            counters = JSON.parse(msg.content.toString());
            var calculator = loadCalculator();
            credibility = calculator.getCredibility(counters);//getCredibility(counters);
            conn.createChannel(function (err, ch) {
                p = 'credibility';
                ch.assertQueue(p, {durable: false});
                ch.sendToQueue(p, new Buffer(credibility.toString()));
                console.log(" [x] Sent %s", credibility.toString());
            });
        }, {noAck: true});
    });
});

function loadCalculator(){
    var mainmanifest = require('./mainmanifest.json')
    var p = checkManifest(mainmanifest);
    
    var loadedCalc = require(p);  
    
        
    return loadedCalc;
}

function checkManifest(mainmanifest_obj){
    manifestAppName = mainmanifest_obj.app_name;
    manifestAppType = mainmanifest_obj.app_type;
    manifestURL = mainmanifest_obj.url;
    manifestVersion = mainmanifest_obj.version;
  
    var manifest = require("./calculateModule/plugin_manifest.json");
    var secondManifest =require("./simpleCalculateModule/plugin_manifest.json"); 

   if (manifest.app_name === manifestAppName && manifest.app_type === manifestAppType && manifest.url === manifestURL && manifest.version === manifestVersion){
    var pluginPath = manifestURL + manifestAppName + manifestAppType;
    console.log('Plugin '+pluginPath+' ('+manifestVersion+') loaded');
    console.log(manifest.description)
    
    return pluginPath;
    }
   else {
    var pluginPath = secondManifest.url + secondManifest.app_name + secondManifest.app_type;
    
    console.log('Plugin '+manifestURL + manifestAppName + manifestAppType+' ('+manifestVersion+ ') not found');
    console.log('Plugin '+pluginPath+' ('+secondManifest.version+') loaded by default');
    return pluginPath;
   }

}
