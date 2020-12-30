const express = require('express')
const fetch = require('node-fetch');
const cors = require('cors')
const port = 8081;
const server = express();
const token = '1c3d478c9b89c2b1cc5cb1500028fd08';
const baseUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=ru&appid=" + token + "&";
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose()

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));


let db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error(err.message)
        throw err
    } else {
        console.log('Connected to database');
        db.run('CREATE TABLE cities (id INTEGER PRIMARY KEY UNIQUE, name varchar(64));'
            , (err) => {
                if (err) {
                }
            });
    }
});

server.use(cors())

server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    res.setHeader('Accept-Charset', 'utf-8')
    next();
});

server.get('/weather/city', (req, res) => {
    let city = req.query.q;
    city = encodeURI(city);
    const url = baseUrl + 'q=' + city;
    fetch(url).then(function (resp) {
        if (resp.status === 200) {
            return resp.json()
        } else {
            return 404
        }
    }).then(function (data) {
        res.send(data)
    })
})

server.get('/weather/coordinates', (req, res) => {
    if (!(req.query.lat && req.query.lon)) {
        res.status(400).send("Latitude and/or longitude are not specified");
        return;
    }
    let lat = req.query.lat;
    let lon = req.query.lon;
    fetch(baseUrl + 'lat=' + lat + '&lon=' + lon)
        .then(function (resp) {
            return resp.json()
        })
        .then(function (data) {
            res.send(data)
        })
})

server.get('/favorites', (req, res) => {

    const query = 'SELECT * FROM cities';

    db.all(query, function (err, rows) {

        let cities_data = rows;
        let cities = []
        for (let i = 0; i < cities_data.length; i++) {
            cities.push(cities_data[i].name)
        }
        res.send({cities});
    });
})

server.post('/favorites', (req, res) => {
    let city_name = req.body.name;
    let city_id = req.body.id;
    let textType = typeof city_name;

    res.setHeader('Content-Type', `text/${textType}; charset=UTF-8`)

    let query = `INSERT INTO cities (id, name) VALUES ('${city_id}', '${city_name}')`;
    db.run(query, function (err) {
        if (err) {
            return res.sendStatus(400);
        }
        return res.sendStatus(200);
    });
})

server.options('*', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS, POST');
    res.send('ok');
});

server.delete('/favorites', (req, res) => {
    let city_id = req.body.id;
    let query = `DELETE FROM "cities" WHERE id='${city_id}'`;

    db.run(query, function (err) {
        if (err) {
            return res.sendStatus(400);
        } else {
            return res.sendStatus(200);
        }
    });
});

server.listen(port, () => {
    console.log(`App listening at http://localhost:${port}/`)
})

module.exports = server