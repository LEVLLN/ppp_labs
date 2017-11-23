#!/usr/bin/env node
"use strict";

let wf4node = require("workflow-4-node");
let WorkflowHost = wf4node.hosting.WorkflowHost;
let MemoryPersistence = wf4node.hosting.MemoryPersistence;
let Bluebird = require("bluebird");
let _ = require("lodash");
let ActivityExecutionEngine = require("workflow-4-node/lib/es6/activities/activityExecutionEngine.js")

let albumsCount = null;
let audiosCount = null;
let photosCount = null;
let friendsCount = null;
let followersCount = null;
let mutualFriendsCount = null;
let credibility = null;
let COEFFICIENT = 3;
let manifestVersion = "";
let manifestAppName = "";
let manifestAppType = "";
let manifestURL = "";
let credibilityResult = 0;
let amqp = require('amqplib/callback_api');
let counters = null;
amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
        let q = 'counters';

        ch.assertQueue(q, {durable: false});
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
        ch.consume(q, function (msg) {
            console.log(" [x] Received %s", msg.content.toString());
            counters = JSON.parse(msg.content.toString());
            //let calculator = loadCalculator();
            let engine = new ActivityExecutionEngine({
                "@workflow": {
                    a: "Wor",
                    b: "rld",
                    albumsCount: counters.albums,
                    audiosCount: counters.audios,
                    photosCount: counters.photos,
                    friendsCount: counters.friends,
                    followersCount: counters.followers,
                    videosCount: counters.videos,
                    mutualFriendsCount: counters.mutual_friends,
                    result: 0,

                    args: [{
                        "@if": {
                            condition: "= this.albumsCount != 0 || this.photosCount != 0 ",
                            then: {
                                "@func": {
                                    code: function () {
                                        if (this.albumsCount >= this.photosCount) {
                                            this.result += parseInt(this.albumsCount / (this.photosCount + 1));
                                        }
                                        else {
                                            this.result += parseInt(this.photosCount / (this.albumsCount + 1));
                                        }

                                    }
                                }
                            }
                        }
                    },
                        {
                            "@if": {
                                condition: "= this.audiosCount != 0",
                                then: {
                                    "@func": {
                                        code: function () {
                                            this.audiosCount *= COEFFICIENT;
                                            this.result += parseInt(this.audiosCount);
                                        }

                                    }
                                }
                            }
                        },
                        {
                            "@if": {
                                condition: "= this.videosCount != 0",
                                then: {
                                    "@func": {
                                        code: function () {
                                            this.videosCount *= COEFFICIENT;
                                            this.result += parseInt(this.videosCount);
                                        }

                                    }
                                }
                            }
                        },
                        {
                            "@if": {
                                condition: "= this.friendsCount >= this.followersCount",
                                then: {
                                    "@func": {
                                        code: function () {
                                            this.followersCount /= COEFFICIENT;
                                            this.result += parseInt(this.followersCount + this.friendsCount);
                                        }

                                    }
                                },
                                else: {
                                    "@func": {
                                        code: function () {
                                            this.friendsCount /= COEFFICIENT;
                                            this.result += parseInt(this.followersCount + this.friendsCount);
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "@while": {
                                condition: "= this.friendsCount <= this.mutualFriendsCount",
                                then: {
                                    "@func": {
                                        code: function () {
                                            this.result += 1;
                                            this.friendsCount -= 1;
                                        }

                                    }
                                }
                            }
                        },
                        {
                            "@func":{
                                code: function () {
                                    return this.result;
                                }
                            }
                        }
                    ]
                }
            });
            engine.invoke().then(function (result) {
                credibility = result;//getCredibility(counters);
                conn.createChannel(function (err, ch) {
                    let p = 'credibility';
                    ch.assertQueue(p, {durable: false});
                    ch.sendToQueue(p, new Buffer(credibility.toString()));
                    console.log(" [x] Sent %s", credibility.toString());
                });
            });

        }, {noAck: true});
    });
});

function loadCalculator() {
    let mainmanifest = require('./mainmanifest.json')
    let p = checkManifest(mainmanifest);

    return require(p);
}

function checkManifest(mainmanifest_obj) {
    manifestAppName = mainmanifest_obj.app_name;
    manifestAppType = mainmanifest_obj.app_type;
    manifestURL = mainmanifest_obj.url;
    manifestVersion = mainmanifest_obj.version;

    let manifest = require("./calculateModule/plugin_manifest.json");
    let secondManifest = require("./simpleCalculateModule/plugin_manifest.json");

    if (manifest.app_name === manifestAppName && manifest.app_type === manifestAppType && manifest.url === manifestURL && manifest.version === manifestVersion) {
        let pluginPath = manifestURL + manifestAppName + manifestAppType;
        console.log('Plugin ' + pluginPath + ' (' + manifestVersion + ') loaded');
        console.log(manifest.description);

        return pluginPath;
    }
    else {
        let pluginPath = secondManifest.url + secondManifest.app_name + secondManifest.app_type;

        console.log('Plugin ' + manifestURL + manifestAppName + manifestAppType + ' (' + manifestVersion + ') not found');
        console.log('Plugin ' + pluginPath + ' (' + secondManifest.version + ') loaded by default');
        return pluginPath;
    }

}
