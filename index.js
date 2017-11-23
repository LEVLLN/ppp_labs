var express = require('express');
var app = express();
var vk = require('api.vk.com')
var request = require('superagent');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var methodOverride = require('method-override');
var amqp = require('amqplib/callback_api');


var url = 'https://oauth.vk.com/access_token?client_id=6193011&client_secret=lZEYwFyZuV4EWBWAAM8R&redirect_uri=http://node-vk-api-jaxonyo.c9users.io/&code=';

var friendList = null;
var userID = null;
var counters = null;
var accessToken = null;
var message = null;


app.listen(8080, function () {
    console.log('Example app listening on port 3000!');
});

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended': 'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride());


app.get('/auth', function (req, router_response) {
    request
        .get(url + req.query.code)
        .end(function (err, res) {
            res = res.text;
            router_response.send(res);
            if (err) {
                console.log(err);
            }
        });
});


app.get('/user', function (req, res) {

    accessToken = req.query.access_token;
    userID = req.query.user_id;
    console.log(accessToken);
    userID = req.query.user_id;
    vk('users.get', {
        user_id: userID,
        access_token: accessToken,
        fields: ["name", 'photo_400_orig', 'photo_100']
    }, function (error, response) {

        if (error) {
            res.send(error);
        }
        else {
            res.send(response);

        }
    });
});

app.get('/users', function (req, res) {

    accessToken = req.query.access_token;
    console.log(accessToken);
    userID = req.query.user_id;
    vk('friends.get', {access_token: accessToken, fields: ["name", 'photo_400_orig']}, function (error, response) {
        friendList = response;
        if (error) {
            res.send(error);
        }
        else {
            res.send(friendList);
        }
    });
});

app.get('/get_credibility', function (req, res) {
    var userObject = {};
    var credentails = {};
    userID = req.query.user_id;
    accessToken = req.query.access_token;
    vk('users.get', {
        user_id: userID,
        access_token: accessToken,
        fields: ['photo_100,photo_400_orig,id,counters']
    }, function (error, response) {

        if (error) {
            res.send(error);
        }
        else {
            counters = response[0].counters;
            message = JSON.stringify(counters);
            userObject.firstName = response[0].first_name;
            userObject.lastName = response[0].last_name;
            userObject.id = response[0].uid;
            userObject.photo_min = response[0].photo_100;
            userObject.photo_max = response[0].photo_400_orig;
            amqp.connect('amqp://localhost', function (err, conn) {
                conn.createChannel(function (err, ch) {
                    q = 'counters';
                    ch.assertQueue(q, {durable: false});
                    ch.sendToQueue(q, new Buffer(message));
                    console.log(" [x] Sent %s", message);
                });
                setTimeout(function () {
                    conn.close();
                }, 500);
                conn.createChannel(function (err, ch) {
                    var p = 'credibility';

                    ch.assertQueue(p, {durable: false});
                    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", p);
                    ch.consume(p, function (credibilityMessage) {
                        console.log(" [x] Received %s", credibilityMessage.content.toString());
                        userObject.credibility = parseInt(credibilityMessage.content.toString());
                        if (counters.albums) {
                            credentails.albums = counters.albums;
                        }
                        credentails.audios = counters.audios;
                        credentails.photos = counters.photos;
                        credentails.friends = counters.friends;
                        credentails.followers = counters.followers;
                        credentails.mutualFriends = counters.mutual_friends;
                        userObject.credentails = credentails;
                        res.send(userObject);
                    }, {noAck: true});
                });
            });
        }
    });
});


