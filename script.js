class WeatherApi {
    constructor() {
        this.baseUrl = "http://localhost:8081/";
    }

    request(endpoint, queryParams) {
        const base = 'http://localhost:8081/weather/';
        const url = base + endpoint + '?' + queryParams.join('&');
        return fetch(url).then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                alert('Cannot find this place');
            }
        }).catch(() => {
            alert('Connection was lost');
        });
    }

    timeout(ms, promise) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                reject(new Error("timeout"))
            }, ms)
            promise.then(resolve, reject)
        })
    }

    getFavourites() {
        return this.timeout(
            3000,
            fetch(this.baseUrl + "favorites")
        ).catch(function (error) {
            alert("Network failure");
            return Promise.reject(error);
        }).then(function (response) {
            return response.json();
        })
    }
}

api = new WeatherApi();

document.body.onload = function () {
    document.querySelector("#button-geo-update").addEventListener("click", geoUpdate);
    document.querySelector("#add-city").addEventListener("submit", evt => addFavorite(evt));
    geoUpdate();
    loadFavorites();
}

function geoUpdate() {
    document.querySelector("#local-weather-loading").style.display = "flex";
    document.querySelector("#local-weather").style.display = "none";
    // Default city: Saint-Petersburg
    let lat = 30.316667;
    let lon = 59.95;
    let geolocation = navigator.geolocation;
    geolocation.getCurrentPosition(position => {
        api.request('coordinates', [`lat=${position.coords.latitude}`, `lon=${position.coords.longitude}`]).then((jsonResult) => {
            loadLocalWeather(jsonResult);
        });
    }, () => {
        api.request('coordinates', [`lat=${lat}`, `lon=${lon}`]).then((jsonResult) => {
            loadLocalWeather(jsonResult);
        })
    });
}

function addFavorite(event) {
    event.preventDefault();
    let city = event.target.querySelector("input").value;
    if (!city || city.trim().length === 0) {
        alert("City name is empty");
        return;
    }
    addCity(city, true);
}

function addCity(city, cityCheck) {

    let favorites = document.querySelector(".favorites-weather-content");
    let template = document.querySelector("#template-weather");
    let cont = document.importNode(template.content, true);
    favorites.appendChild(cont);
    let newCity = favorites.lastElementChild;
    newCity.querySelector("h3").textContent = city;
    newCity.querySelector("#city-weather-loading").style.display = "block";
    newCity.querySelector("#weather-details").style.display = "none";

    api.request('city', ['q=' + city]).then((jsonResult) => {

        if (jsonResult === undefined) {
            newCity.remove();
            return;
        }
        if (cityCheck) {
            fetch('http://localhost:8081/favorites', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: jsonResult.name,
                    id: jsonResult.id
                })
            }).then((response) => {
                if (response.status === 200) {
                    initializeAddCity(newCity, jsonResult)
                } else {
                    newCity.remove();
                    alert('This city is already in the favorites');
                    return;
                }
            }).catch((err) => {
                newCity.remove();
                alert('Connection was lost');
                return;
            });
        } else {
            initializeAddCity(newCity, jsonResult);
        }
    });
    document.querySelector("#add-city").querySelector("input").value = "";
}

function initializeAddCity(newCity, jsonResult) {
    newCity.id = jsonResult["id"];
    newCity.querySelector(".button-remove-favorite").id = newCity.id;
    newCity.querySelector(".city-temperature").textContent = Math.floor(jsonResult["main"]["temp"]).toString() + "\u00B0" + "C";
    newCity.querySelector("h3").textContent = jsonResult["name"];

    fillCityData(newCity, jsonResult);
    newCity.querySelector("#city-weather-loading").style.display = "none";
    newCity.querySelector("#weather-details").style.display = "block";

    newCity.querySelector(".button-remove-favorite").addEventListener("click", removeCity);
}

function removeCity() {
    document.getElementById(this.id).querySelector('.button-remove-favorite').disabled = true;
    fetch('http://localhost:8081/favorites', {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: this.id
        })
    }).then((response) => {
        if (response.status === 200) {
            document.getElementById(this.id).remove();
        } else {
            document.getElementById(this.id).querySelector('.button-remove-favorite').disabled = false;
            alert('City didn\'t delete');
        }
    });

}

function loadLocalWeather(json) {
    let info = document.getElementById("local-weather");

    info.querySelector("h2").textContent = json["name"];
    info.querySelector("span").textContent = Math.floor(json["main"]["temp"]).toString() + "\u00B0" + "C";

    fillCityData(info, json);

    document.querySelector("#local-weather").style.display = "block";
    document.querySelector("#local-weather-loading").style.display = "none";
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
    fetch('http://localhost:8081/favorites', {method: 'GET',})
        .then((res) => {
        if (res.ok) {
            return res.json()
        }
    }).then((res) => {
        for (let i = 0; i < res.cities.length; i++) {
            const key = res.cities[i];
            console.log(key);
            addCity(key);
        }
    });
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