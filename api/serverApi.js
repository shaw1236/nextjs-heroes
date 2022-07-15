// Node/MongoDb Service for tasks 
//
// Purpose: provide restful web api 
//
// Author : Simon Li  July 2020
//
'use strict';

// Commonjs
const express = require('express');
const goose = require('mongoose');
const {Promise} = require('bluebird');
const path = require('path');
const chalk = require('chalk');

const HeroSchema = new goose.Schema({
    id:   { type: Number, required: true },
    name: { type: String, required: true }
});

// Easy handling in docker and other runtime
const mongo_host     = process.env.MONGO_HOST || 'localhost';
const mongo_port     = process.env.MONGO_PORT || '27017';
const mongo_database = process.env.MONGO_DATABASE || 'mydatabase';
const mongo_url      = `mongodb://${mongo_host}:${mongo_port}/${mongo_database}`;

const options = {useNewUrlParser: true, useUnifiedTopology: true};

const port = +process.env.PORT || 8080;

// Request routers
const appRoute = (app, HeroModel) => {
    // Http headers
    app.use((req, res, next) => {
        const allowedOrigins = [
                                'http://localhost:3000', 'http://localhost:4000', 'http://localhost:5000',
                                'http://127.0.0.1:3000', 'http://127.0.0.1:4000', 'http://127.0.0.1:5000',
                                'http://127.0.0.1:8081', 'http://192.168.2.227:8081'
                               ];
        let clientOrigin = req.headers.origin;
        //console.log("Origin", req.headers.origin);    
        if (allowedOrigins.indexOf(clientOrigin) >= 0) 
            res.setHeader('Access-Control-Allow-Origin', clientOrigin);
        else if (!clientOrigin || clientOrigin === 'null') // allow local test
            res.setHeader('Access-Control-Allow-Origin', '*');   
        else 
            console.log("Client Origin", clientOrigin);

        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.header('Access-Control-Allow-Credentials', '1');
        return next();
    });

    /*
    // Dummy root request
    app.get("/", (req, res) => {
        console.log("root router");
        res.send({data: "Welcome to the rest service of Heroes powered by Nodejs/MongoDb."});
    });
    */
    const api = express.Router();
    app.use('/api', api);

    //let clientSite = express.static(path.join(__dirname, '/', "dist"));
    let clientSite = express.static('../dist');
    app.use('/', clientSite);   
    app.use('**', clientSite);

    // List all (GET)
    api.get("/heroes", async (req, res) => {
        try {
            let query = {};
            let term = req.query.name;
            if (term) {
                let pattern = { '$regex': `^${term}` };
                query = { 'name': pattern };
                //console.log("Search Term: ", term, query);
            }
    	    let data = await HeroModel.findAsync(query, {_id: 0, __v: 0}); 
            res.send(data);
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    });

    // Get an individual (GET)
    api.get("/heroes/:id", async (req, res) => {
	    try {
    	    let data = await HeroModel.findAsync({id: req.params.id}, {_id: 0, __v: 0}); 
            if (Array.isArray(data))  // Is this one-element array?
                res.send(data[0]);    // direct return the object
            else 
                res.send(data);
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })

    // Insert (POST)
    api.post("/heroes", async (req, res) => {
        try {
            if (Array.isArray(req.body)) { // insertMany()
                let data = await HeroModel.insertMany(req.body); 
                res.send({data});
            }
            else { // insertOne()   
                let {name, id} = req.body;
                if (!id) id = await HeroModel.countDocumentsAsync({}) + 1;
                console.log({id, name});

                let data = await HeroModel.createAsync({id, name}); 
                res.send({id: data.id, name: data.name});
            }   
        }    
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })

    // Update (PUT)
    api.put("/heroes", async (req, res) => {
        console.log(req.body);
	    try {
            let data = await HeroModel.updateOneAsync({ id: req.body.id }, { "$set": req.body});
            res.send({data});
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })

    api.patch("/heroes", async (req, res) => {
        console.log(req.body);
	    try {
            let data = await HeroModel.updateOneAsync({ id: req.body.id }, { "$set": req.body});
            res.send({data});
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })

    // Delete (DELETE)
    api.delete("/heroes/:id", async (req, res) => {
        console.log("ID to be deleted: " + req.params.id); // req.body.id)
	    try {
            let data = await HeroModel.deleteOneAsync({ id: req.params.id })
            res.send({data});
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })
}

// starter
(async () => {
    try {
        const response = await Promise.promisify(goose.connect)(mongo_url, options); 
        console.dir("connect to MongoDB");
        
        // compile schema to model
        const HeroModel = Promise.promisifyAll(goose.model('Heroes', HeroSchema));
        //console.log("HeroModel", HeroModel);

        const app = express();

        // Parse JSON bodies (as sent by API clients)
        app.use(express.json());

        appRoute(app, HeroModel);
        
        (() => {
            //let pkg = require(path.resolve(path.join(__dirname, 'package.json')));
            let pkg = require(path.resolve('./package.json'));
            const ver = version => version.replace(/^~|^\^|=/, '');  // "~, ^"
            console.log();  
            console.log('--');
            console.log(chalk.green('Application version : ' + pkg["version"]));
            console.log(chalk.green('(M)ongoose version  : ' + ver(pkg["dependencies"]["mongoose"])));
            console.log(chalk.green('(E)xpress version   : ' + ver(pkg["dependencies"]["express"])));
            console.log(chalk.green('(A)ngularJS version : ' + ver(pkg["dependencies"]["@angular/common"])));
            console.log(chalk.green('(N)ode version      : ' + ver(process.versions.node)));
            console.log('--');
            console.log();
            app.listen(port, () => console.log(chalk.inverse(`dbServer app listening on port ${port}.`)));  
        })();
    }
    catch(ex) {
        console.error(ex);
    }
})();