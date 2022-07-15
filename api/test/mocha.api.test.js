// Mocha Api Test
//
// Purpose: Test the restful api (CRUD)
//
// Author : Simon Li  August 2020
//
// Prerequisite: mocha, supertest, assert
// Run         : ..[/|\\]mocha
// 
const assert   = require('assert');
const request  = require('supertest');
const timeout  = process.env.TIMEOUT || 120 * 1000;   // ms, default 2 minutes

const host     = process.env.API_HOST || "localhost";
const port     = process.env.API_PORT || "8080";

const domain   = `http://${host}:${port}`;
const endpoint = "/api/heroes";

describe(`Check hero restful api - ${domain}${endpoint}`, function() {
    this.timeout(timeout);  // 10 seconds 
    
    let hero       = {};
    let searchTerm = "";

    before(function() {
        // Initialization
	    hero       = {id: Infinity, name: "Local"};   // id here is just a dummy for place holder
		searchTerm = hero.name.substring(0, 3);       // For search term test
    });	
	
	after(function() {
		// Clearup
        searchTerm = "";   // dummy, just for an example
        hero = null;       // dummy, just for an example
        console.dir("   ** Api CRUD test is done! **");
    });	

    // Test the root 
    it('1. Test api host and port', done => {
		request(domain)
        .get('/')
		.expect(200)
		.end((err, res) => {
	    	if (err) throw err;
            console.dir("   " + res.text);
	    	done();
		});
    });
	
    // Get the list 
    it('2. List/Query', done => {
		request(domain)
        .get(endpoint)
		.expect(200)
        .expect('Content-Type', /json/)
		.end((err, res) => {
	    	if (err) throw err;
	    	done();
		});
    });

	// Create 
    it('3. New/(C)REATE', done => {
		request(domain)
        .post(endpoint)
		.send({name: hero.name})
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
        .expect(res => { 
             // Notice: python server returns status 201 for creation and others response 200
             //         either 200 or 201 is considered to be a valid status
             assert.equal([200, 201].includes(res.status), true);

             //console.log(res.body);
             hero = res.body;  // a real hero
		})
		.end((err, res) => {
	    	if (err) throw err;
	    	done();
		});
    });

    // Find an individual 
	it('4. Individual/(R)EAD', done => {
		request(domain)
        .get(endpoint + `/${hero.id}`)
		.expect(200)
        .expect('Content-Type', /json/)
		.end((err, res) => {
	    	if (err) throw err;
	    	done();
		});
    });

    // Search term
	it('5. Search term by name', done => {
		request(domain)
        .get(endpoint + `?name=${searchTerm}`)
		.expect(200)
        .expect('Content-Type', /json/)
		.end((err, res) => {
	    	if (err) throw err;
	    	done();
		});
    });

	// Change
    it('6. Change/(U)PDATE', done => {
        assert.equal(!!hero.id, true);
		request(domain)
        .put(endpoint)
		.send({id: hero.id, name: hero.name + " change here"})
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
    	.expect(200)
		.end((err, res) => {
	    	if (err) throw err;
	    	done();
		});
    });

    // Remove our dummy test data
	it('7. Remove/(D)ELETE', done => {
		request(domain)
        .delete(endpoint + `/${hero.id}`)
		.expect(200)
        .expect('Content-Type', /json/)
		.end((err, res) => {
	    	if (err) throw err;
	    	done();
		});
    });

    // ...
});
