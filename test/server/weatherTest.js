const server = require('../../server/server');

const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const path = require('path');
const request = require('request');
const rewire = require('rewire');
const sinon = require('sinon');

chai.use(chaiHttp);

let weatherData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/weatherResponse.json')));

describe('Weather API', () => {
    beforeEach(() => {
        this.getStub = sinon.stub(request, 'get');
    });

    describe('GET /weather/city', () => {
        it('should fetch correct weather data', async () => {
            this.getStub.yields(
                null,
                {statusCode: 200, headers: {'content-type': 'application/json'}},
                weatherData
            );

            let res = await chai
                .request(server)
                .get('/weather/city?q=Moscow');

            chai.expect(res.status).to.equal(200);
            chai.expect(res.body.name).to.equal('Москва');
        });

        it('should return 404 error without city specified', async () => {
            let res = await chai
                .request(server)
                .get('/weather/city');

            chai.expect(res.status).to.equal(404);
        });

        it('should return 404 error with invalidcity specified', async () => {
            this.getStub.yields(
                null,
                {statusCode: 404},
            );

            let res = await chai
                .request(server)
                .get('/weather/city?q=totallynotexistingcity');

            chai.expect(res.status).to.equal(404);
        });
    });

    describe('GET /weather/coordinates', () => {
        it('should fetch correct weather data by coords', async () => {
            this.getStub.yields(
                null,
                {statusCode: 200, headers: {'content-type': 'application/json'}},
                weatherData
            );

            let res = await chai
                .request(server)
                .get('/weather/coordinates?lat=11.11&lon=11.11');

            chai.expect(res.status).to.equal(200);
        });
        it('should return error if latitude is not specified', async () => {
            this.getStub.yields(
                null,
                {statusCode: 400}
            );

            let res = await chai
                .request(server)
                .get('/weather/coordinates?lon=11.11');

            chai.expect(res.status).to.equal(400);
        });
        it('should return error if longitude is not specified', async () => {

            this.getStub.yields(
                null,
                {statusCode: 400},
            );

            let res = await chai
                .request(server)
                .get('/weather/coordinates?lat=11.11');

            chai.expect(res.status).to.equal(400);
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});