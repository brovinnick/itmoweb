const chai = require('chai');
const fetchMock = require('fetch-mock');
const fs = require('fs');
const jsdom = require('jsdom');
const path = require('path');
const jest = require('jest-mock');
const mockdate = require('mockdate');
let htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'));
let weatherData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/weatherResponse.json')));

const mockGeolocation = {
    getCurrentPosition: jest.fn().mockImplementation((success) =>
        Promise.resolve(
            success({
                coords: {
                    latitude: 0.11,
                    longitude: 0.11
                }
            })
        )
    )
}

describe('Frontend', () => {
    const favouritesUrl = /http:\/\/localhost:8081\/favorites*/;
    let client = null;

    beforeEach(() => {
        let dom = new jsdom.JSDOM(htmlContent, {
            contentType: "text/html",
            includeNodeLocations: true
        });

        global.window = dom.window;
        global.document = dom.window.document;
        global.navigator = {geolocation: mockGeolocation};

        client = require('../../script');

        fetchMock.get(
            /http\:\/\/localhost\:8081\/weather\/coordinates\?lat=0\.11&lon=0\.11*/,
            weatherData
        );

        fetchMock.get(
            favouritesUrl,
            weatherData
        );
    });

    describe('Utils: Get Wind Direction', () => {
        it('should return north wind description', () => {
            let res = client.getWindDirection(1);
            chai.expect(res).to.be.equal("Северный");
        });
        it('should return north-northeast wind description', () => {
            let res = client.getWindDirection(25);
            chai.expect(res).to.be.equal("Северо-северовосточный");
        });
    });

    describe('Utils: Get Wind Speed Direction', () => {
        it('should return calm name', () => {
            let res = client.getWindName(0);
            chai.expect(res).to.be.equal("Штиль");
        });
        it('should return silent name', () => {
            let res = client.getWindName(0.35);
            chai.expect(res).to.be.equal("Тихий");
        });
    });

    describe('Utils: Daytime check', () => {
        it('should return true for day time', () => {
            mockdate.set(1609331800412);
            let res = client.isDaytime(10800);
            mockdate.reset();
            chai.expect(res).to.true;
        });
        it('should return false for night time', () => {
            mockdate.set(1609331800412);
            let res = client.isDaytime(36000);
            mockdate.reset();
            chai.expect(res).to.false;
        });
    });

    describe('Weather Here', () => {

        it('should init weather here', async () => {
            client.geoUpdate();

            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector(".local-weather-info h2");
            chai.expect(here.textContent).to.be.equal('Новая деревня');
        });
    });

    describe('Favorites', () => {

        it('should add new city', async () => {
            city = "London";
            fetchMock.get(
                /http\:\/\/localhost\:8081\/weather\/city\?q=London*/,
                weatherData
            )
            await client.addCity(city, false);
            await new Promise(r => setTimeout(r, 10));

            let bookmark = document.getElementById('519711').querySelector("h3");
            chai.expect(bookmark).to.not.be.null;

            chai.expect(bookmark.textContent).to.be.equal('Новая деревня');
        });

        it('should delete bookmark',  async () => {
            city = "London";
            fetchMock.get(
                /http\:\/\/localhost\:8081\/weather\/city\?q=London*/,
                weatherData
            )
            fetchMock.delete(
                /http\:\/\/localhost\:8081\/favorites*/,
                200
            )
            await client.addCity(city, false);
            await new Promise(r => setTimeout(r, 10));

            let removeButton = document.getElementById('519711').querySelector("button");
            await removeButton.click();
            await new Promise(r => setTimeout(r, 10));
            let bookmark = document.getElementById("519711");
            chai.expect(bookmark).to.be.null;
        });
    });

    afterEach(() => {
        global.window = undefined;
        global.document = undefined;
        global.GeolocationPosition = undefined;
        global.navigator = undefined;

        client = null;

        fetchMock.restore();
    });
});