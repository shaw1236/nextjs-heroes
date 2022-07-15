import axios  from "axios";
import * as jwt from 'jsonwebtoken';
import * as assert from 'assert';

const home_url: string = "http://localhost:8080";
const api: string = "http://localhost:8080/api/heroes";
const Headers: object = { 'Content-Type': 'application/json' };

async function home(): Promise<any> {
   let res = await axios.get(home_url);
   return res.data; 
}

async function list(): Promise<any>  {
   let res = await axios.get(api, Headers);
   return res.data; 
}

async function get(id): Promise<any> {
   let url = api + '/' + id;
   let res = await axios.get(url, Headers);
   return res.data; 
}

async function post(data): Promise<any> {
   let res = await axios.post(api, data, Headers);
   return res.data; 
}

async function put(data): Promise<any> {
   let res = await axios.put(api, data, Headers);
   return res.data; 
}

async function deleteOne(id): Promise<any> {
   let url = api + '/' + id;
   let res = await axios.delete(url, Headers);
   return res.data; 
}

async function test(): Promise<any> {
    let res = await home();
    if (typeof res === 'object')
        res = res.data; 
    
    assert.ok(res.startsWith("Welcome"));

	let heroes1 = await list();
	assert.ok(Array.isArray(heroes1));

    let hero = await post({id: 11, name: 'Local people'});
    assert.equal(hero.name, 'Local people');
 
    let heroes = await list();
    assert.ok(heroes.length > heroes1.length);

    assert.ok(await put({id: 11, name: 'Hero'}));
	hero = await get(11);
    assert.equal(hero.name, 'Hero')
     
    assert.ok(await deleteOne(11));
    hero = await get(11);
    assert.equal(hero.status, 404);

    return "All passed";
}

async function testJWT(): Promise<any> {
    //let res: string = await home();    
    // .cs
    // using JWT.Algorithms;
    // using JWT.Builder;
    // using System.Collections.Generic;
    // var token = new JwtBuilder()
    // .WithAlgorithm(new HMACSHA256Algorithm())
    // .WithSecret("Product_Key_Secret")
    // .AddClaim("ProductKey", TheKey)
    // .Build();

    const secret = 'myHeroes';
    let hero = {id: 11, name: 'Encrypted'};
    let token = await jwt.sign({ hero }, secret, { expiresIn: 60 * 5 }) // expires in 5 mins
    try {
        let res = await post({ token });
        return res;
    }
    catch(ex) {
        throw ex.response.data;    
    }
}

// test()
// .then(console.log)
// .catch(console.error)
// .finally(() => console.log("test"))

testJWT()

.then(console.log)
.catch(console.error)
.finally(() => console.log("done"))

