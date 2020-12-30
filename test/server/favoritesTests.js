const server = require('../../server/server');


const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

describe('Favourites API', () => {
    describe('GET /favourites', () => {
        it('should GET all favourites, list of cities should be empty', async () => {
            let res = await chai
                .request(server)
                .get('/favorites');
            chai.expect(res.body.cities).to.empty;
            chai.expect(res.status).to.equal(200);
        });
    });

    describe('POST /favorites', () => {
        it('should add new favourite', async () => {
            let res = await chai
                .request(server)
                .post('/favorites')
                .send({name: 'Moscow', id: '12312834123'});
            chai.expect(res.status).to.equal(200);

            res = await chai
                .request(server)
                .get('/favorites');
            chai.expect(res.status).to.equal(200);
        });

        it('should return 400 if city already in favorites', async () => {
            let res = await chai
                .request(server)
                .post('/favorites')
                .send({name: 'Moscow', id: '12312834123'});

            chai.expect(res.status).to.equal(400);
        });

        it('should return 400 if request is invalid', async () => {
            let res = await chai
                .request(server)
                .post('/favorites')
                .send({});

            chai.expect(res.status).to.equal(400);
        });
    });

    describe('GET /favourites', () => {
        it('should GET all favourites, list of city should not be empty', async () => {
            let res = await chai
                .request(server)
                .get('/favorites');
            chai.expect(res.body.cities).not.to.empty;
            chai.expect(res.status).to.equal(200);
        });
    });

    describe('DELETE /favourites', () => {
        it('should DELETE favourite', async () => {
            let resBefore = await chai
                .request(server)
                .get('/favorites');

            let res = await chai
                .request(server)
                .delete('/favorites')
                .send({id: '12312834123'});

            let resAfter = await chai
                .request(server)
                .get('/favorites');

            chai.expect(resBefore.body.cities).not.to.empty;
            chai.expect(resAfter.body.cities).to.empty;
            chai.expect(res.status).to.equal(200);
        });
    });
});