class OpenWeatherMapApi {
    constructor(token) {
        this.baseUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=ru&appid=" + token + "&";
    }

    timeout(ms, promise) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                reject(new Error("timeout"))
            }, ms)
            promise.then(resolve, reject)
        })
    }

    getWeatherByCoordinates(lat, lon) {
        this.timeout(
            3000,
            fetch(this.baseUrl + "lat=" + lat + "&lon=" + lon)
        ).then(function (response) {
            return response.json();
        }).catch(function () {
            alert("Network failure");
        }).then(function (json) {
            loadLocalWeather(json)
        })
    }

    getWeatherByCity(city) {
        return this.timeout(
            3000,
            fetch(this.baseUrl + "q=" + city)
        ).catch(function (error) {
            alert("Network failure");
            return Promise.reject(error);
        }).then(function (response) {
            return response.json();
        })
    }
}

api = new OpenWeatherMapApi("1c3d478c9b89c2b1cc5cb1500028fd08");

document.body.onload = function () {
    document.querySelector("#button-geo-update").addEventListener("click", geoUpdate);
    document.querySelector("#add-city").addEventListener("submit", evt => addFavorite(evt));
    geoUpdate();
    loadFavorites();
}

function geoUpdate() {
    // Default city: Saint-Petersburg
    let lat = 30.316667;
    let lon = 59.95;
    let geolocation = navigator.geolocation;

    geolocation.getCurrentPosition(position => {
        api.getWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
    }, () => {
        api.getWeatherByCoordinates(lat, lon);
    })
}

function addFavorite(event) {
    event.preventDefault();
    let city = event.target.querySelector("input").value;
    if (!city || city.trim().length === 0) {
        alert("City name is empty");
        return;
    }
    if (cityAlreadyExists(city.toLowerCase())) {
        alert("City already exists");
        return;
    }
    addCity(city, true);
}

function cityAlreadyExists(city) {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (localStorage.getItem(key) === city) {
            return true;
        }
    }
    return false;
}

function addCity(city, cityCheck) {

    let favorites = document.querySelector(".favorites-weather-content");
    let template = document.querySelector("#template-weather");
    let cont = document.importNode(template.content, true);

    let response = api.getWeatherByCity(city);
    response.then(json => {
        if (json["cod"] !== 200) {
            alert("Город не найден");
            return;
        }
        if (cityCheck && cityAlreadyExists(json["name"].toLowerCase())) {
            alert("City already exists");
            return;
        }

        favorites.appendChild(cont);
        let newCity = favorites.lastElementChild;
        newCity.querySelector("h3").textContent = city;
        localStorage.setItem(json["id"], json["name"].toLowerCase());
        newCity.id = json["id"];
        newCity.querySelector(".button-remove-favorite").id = newCity.id;
        newCity.querySelector(".city-temperature").textContent = Math.floor(json["main"]["temp"]).toString() + "\u00B0" + "C";
        newCity.querySelector("h3").textContent = json["name"];

        fillCityData(newCity, json);

        newCity.querySelector(".button-remove-favorite").addEventListener("click", removeCity);
    });

    document.querySelector("#add-city").querySelector("input").value = "";
}

function removeCity() {
    localStorage.removeItem(this.id);
    document.getElementById(this.id).remove();
}

function loadLocalWeather(json) {
    let info = document.getElementById("local-weather");

    info.querySelector("h2").textContent = json["name"];
    info.querySelector("span").textContent = Math.floor(json["main"]["temp"]).toString() + "\u00B0" + "C";

    fillCityData(info, json);
}

function fillCityData(element, json) {
    if (isDaytime(json["timezone"])) {
        element.querySelector("i").classList.add("wi-owm-day-" + json["weather"][0]["id"]);
    } else {
        element.querySelector("i").classList.add("wi-owm-night-" + json["weather"][0]["id"]);
    }
    element.querySelector(".wind").querySelector(".value")
        .textContent = getWindName(json["wind"]["speed"]) +
        ", " + json["wind"]["speed"] + " м/с, " +
        getWindDirection(json["wind"]["deg"]);
    element.querySelector(".clouds").querySelector(".value")
        .textContent = json["weather"][0]["description"];
    element.querySelector(".pressure").querySelector(".value")
        .textContent = json["main"]["pressure"] + " hpa";
    element.querySelector(".humidity").querySelector(".value")
        .textContent = json["main"]["humidity"] + "%";
    element.querySelector(".coords").querySelector(".value")
        .textContent = json["coord"]["lon"] + ", " + json["coord"]["lat"];
}

function loadFavorites() {
    for (let i = 0; i < localStorage.length; i++) {
        let id = localStorage.key(i);
        addCity(localStorage.getItem(id));
    }
}

function isDaytime(timeZoneShift) {
    let hours = new Date().getUTCHours();
    let shift = timeZoneShift / 3600;
    hours += shift;
    return hours > 6 && hours < 20;
}

function getWindName(speed) {
    let names = [
        "Штиль", "Тихий", "Лёгкий", "Слабый", "Умеренный", "Свежий",
        "Сильный", "Крепкий", "Очень крепкий", "Шторм", "Сильный шторм", "Жестокий шторм", "Ураган"
    ];

    let speeds = [0, 0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 33];
    let index = 0;
    speeds.forEach(function (el, idx) {
        if (el < speed) {
            index = idx;
        }
    });

    return names[index];
}

function getWindDirection(direction) {
    let directions = [
        "Северный", "Северо-северовосточный", "Северовосточный", "Восточно-северовосточный", "Восточный", "Восточно-юговосточный",
        "Юговосточный", "Юго-юговосточный", "Южный", "Южно-южнозападный", "Южнозападный",
        "Западно-югозападный", "Западный", "Западно-северозападный", "Северозападный", "Северо-северозападный"
    ];
    return directions[(Math.floor((direction / 22.5) + 0.5) % 16)];
}