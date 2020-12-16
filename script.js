class OpenWeatherMapApi {
    constructor(token) {
        this.apiToken = token;
        this.baseUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&"
    }

    getWeatherByCoordinates(lat, lon) {
        fetch( + "lat=" + lat + "&lon=" + lon + "&appid=" + this.apiToken)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);
            });
    }

    getWeatherByCity(city) {
        fetch( + "q=" + city + this.apiToken)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);
            });
    }
}

api = new OpenWeatherMapApi("1c3d478c9b89c2b1cc5cb1500028fd08");