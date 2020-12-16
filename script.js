class OpenWeatherMapApi {
    constructor(token) {
        this.apiToken = token;
        this.baseUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=ru&"
    }

    timeout(ms, promise) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                reject(new Error("timeout"))
            }, ms)
            promise.then(resolve, reject)
        })
    }

    getWeatherByCoordinates(lat, lon) {
        this.timeout(
            3000,
            fetch(this.baseUrl + "lat=" + lat + "&lon=" + lon + "&appid=" + this.apiToken)
        ).then(function(response) {
            return response.json();
        }).catch(function() {
            alert("Network failure");
        }).then(function (json) {
            loadLocalWeather(json)
        })
    }

    getWeatherByCity(city) {
        fetch(+"q=" + city + this.apiToken)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);
            });
    }
}

api = new OpenWeatherMapApi("1c3d478c9b89c2b1cc5cb1500028fd08");

document.body.onload = function () {
    document.querySelector("#button-geo-update").addEventListener("click", geoUpdate);
    document.querySelector("#add-city").addEventListener("submit", evt => addCity(evt));
    geoUpdate();
}

function geoUpdate() {
    // Default city: Saint-Petersburg 59°57′ с. ш. 30°19′
    let lat = 30.316667;
    let lon = 59.95;
    let geolocation = navigator.geolocation;

    geolocation.getCurrentPosition(position => {
        api.getWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
    }, () => {
        api.getWeatherByCoordinates(lat, lon);
    })
}

function addCity() {

}

function loadLocalWeather(json) {
    let info = document.getElementById("local-weather");

    info.querySelector("h2").textContent = json["name"];

    if (isDaytime(json["timezone"])) {
        info.querySelector("i").classList.add("wi-owm-day-" + json["weather"][0]["id"]);
    } else {
        info.querySelector("i").classList.add("wi-owm-night-" + json["weather"][0]["id"]);
    }
    info.querySelector("span").textContent = Math.floor(json["main"]["temp"]).toString() + "\u00B0" + "C";
    info.querySelector(".wind").querySelector(".value")
        .textContent = getWindName(json["wind"]["speed"]) +
        ", " + json["wind"]["speed"] + " м/с, " +
        getWindDirection(json["wind"]["deg"]);
    info.querySelector(".clouds").querySelector(".value")
        .textContent = json["weather"][0]["description"];
    info.querySelector(".pressure").querySelector(".value")
        .textContent = json["main"]["pressure"] + " hpa";
    info.querySelector(".humidity").querySelector(".value")
        .textContent = json["main"]["humidity"] + "%";
    info.querySelector(".coords").querySelector(".value")
        .textContent = json["coord"]["lon"] + ", " + json["coord"]["lat"];
}

function isDaytime(timeZoneShift) {
    let hours = new Date().getUTCHours();
    let shift = timeZoneShift / 3600;
    hours += shift;
    return hours > 6 && hours < 20;
}

let names = [
    "Штиль", "Тихий", "Лёгкий", "Слабый", "Умеренный", "Свежий",
    "Сильный", "Крепкий", "Очень крепкий", "Шторм", "Сильный шторм", "Жестокий шторм", "Ураган"
];

let speeds = [0, 0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 33];

function getWindName(speed) {
    let index = 0;
    speeds.forEach(function(el, idx) {
        if (el < speed) {
            index = idx;
        }
    });

    return names[index];
}

function getWindId(speed) {
    let index = 0;
    speeds.forEach(function(el, idx) {
        if (el < speed) {
            index = idx;
        }
    });

    return index;
}

function getWindDirection(direction) {
    let directions = [
        "Северный", "Северо-северовосточный", "Северовосточный", "Восточно-северовосточный", "Восточный", "Восточно-юговосточный",
        "Юговосточный", "Юго-юговосточный", "Южный", "Южно-южнозападный", "Южнозападный",
        "Западно-югозападный", "Западный", "Западно-северозападный", "Северозападный", "Северо-северозападный"
    ];
    return directions[(Math.floor((direction / 22.5) + 0.5) % 16)];
}