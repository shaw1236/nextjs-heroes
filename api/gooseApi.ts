// TS-Node/MongoDb Micro Service for Hero  
//
// Purpose: provide restful web api (CRUD) 
//
// Author : Simon Li  July 2019
//
'use strict';

import * as express from 'express';

////////////////////////////////////////////////////////////////////////////
// appRoute.ts
import * as goose from 'mongoose';
import * as path from 'path';
import * as chalk from 'chalk';

import { config }  from 'dotenv';
config();

// Easy handling in docker and other runtime
const mongo_host: string     = process.env.MONGO_HOST || 'localhost';
const mongo_port: string     = process.env.MONGO_PORT || '27017';
const mongo_database: string = process.env.MONGO_DATABASE || 'mydatabase';
const mongo_url: string      = `mongodb://${mongo_host}:${mongo_port}/${mongo_database}`;

//const mongo_url = 'mongodb://<username>:<password>@<endpoint>.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';

const options = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true };

//Schema options at https://mongoosejs.com/docs/2.7.x/docs/schema-options.html
//The schema constructor takes a second options argument. There are currently three available options:

// safe
// strict
// shardkey

// Strict
// The strict option makes it possible to ensure that values added to our model instance that were not 
// specified in our schema do not get saved to the db.

// Shardkey (new in v2.5.3)
// The shardkey option is used when we have a sharded MongoDB architecture. Each sharded collection 
// is given a shard key which must be present in all insert/update operations. We just need to 
// set this schema option to the same shard key and we’ll be all set.
// Simple schema for hero data
const HeroSchema = new goose.Schema({
    id:   { 
        type: Number, 
        required: "\"id\" field is required", // true,
        unique: "The id already exists" 
    },
    name: { 
        type: String, 
        required: true 
    }
}, { strict: true, shardKey: { id: 1 } });

// Connect to the mongo db
const response = goose.connect(mongo_url, options, (err) => {  // (err, response)
    if (err) throw err;
    console.dir("connect to MongoDB");
    //console.log(response);
});

// compile schema to model
const HeroModel = goose.model('Hero', HeroSchema, "heroes");    

// Request routers
export default function appRoute(app: express.Application): void {

    // Http headers and cors - middleware
    app.use((req: express.Request, res: express.Response, next: any) => {
        // Handle cors, https://livebook.manning.com/book/cors-in-action/chapter-3/138
        // The value of the Access-Control-Allow-Origin header can be either a wildcard or an origin value. 
        // The wildcard value says that clients from any origin can access the resource, while the origin value 
        // only gives access to a specific client. Here is an example of both header values.
        // Access-Control-Allow-Origin: *
        // Access-Control-Allow-Origin: http://localhost:1111
        //res.setHeader('Access-Control-Allow-Origin', '*');
        //res.set('Access-Control-Allow-Origin', 'http://localhost:1111');
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
    app.get("/", (req: express.Request, res: express.Response) => {
        console.log("root router");
        res.send({data: "Welcome to the rest service of Heroes powered by ts-node/MongoDb."});
    });
    */
    const api = express.Router();
    app.use('/api', api);

    let clientSite = express.static('../dist');
    app.use('/', clientSite);   
    app.use('**', clientSite);

    // List all (GET), support /api/heros?name=Dr
    api.get("/heroes", async (req: express.Request, res: express.Response) => {
        try {
            let query = {};
            let term = req.query.name;
            if (term) {
                let pattern = { '$regex': `^${term}` };
                query = { 'name': pattern };
                //console.log("Search Term: ", term, query);
            }
                
            let data = await HeroModel.find(query, "-_id -__v").exec(); 
            res.send(data);
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    });

    // Get an individual (GET)
    api.get("/heroes/:id", async (req: express.Request, res: express.Response) => {
	    try {
            let data = await HeroModel.findOne({id: req.params.id}, "-_id -__v").exec();
            if (!data)
                throw new Error(`id ${req.params.id} does not exist`);
            res.send(data);
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })

    // Insert/new one/many (POST)
    api.post("/heroes", async (req: express.Request, res: express.Response) => {
        try {
            if (Array.isArray(req.body)) { // insertMany()
                let data = await HeroModel.insertMany(req.body); 
                res.send({data});
            }
            else { // insertOne()
                let {name, id} = req.body;
                if (!id) 
                    id = await HeroModel.countDocuments({}).exec() + 1;
                console.log({id, name});

                let hero = new HeroModel({id, name});
                let data = await hero.save(); 
                res.send(data);
            }   
        }    
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })

    // Update (PUT)
    api.put("/heroes", async (req: express.Request, res: express.Response) => {
        console.log(req.body);
	    try {
            let data = await HeroModel.updateOne({ id: req.body.id }, { "$set": req.body}).exec();
            res.send({data});
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })

    // Upadte (PATCH)
    api.patch("/heroes", async (req: express.Request, res: express.Response) => {
        console.log(req.body);
	    try {
            let data = await HeroModel.updateOne({ id: req.body.id }, { "$set": req.body}).exec();
            res.send({data});
        }
        catch(ex) {
            res.status(408).send({message: "" + ex });
        }
    })

    // Delete (DELETE)
    api.delete("/heroes/:id", async (req: express.Request, res: express.Response) => {
        console.log("ID to be deleted: " + req.params.id); // req.body.id)
	    try {
            let data = await HeroModel.deleteOne({ id: req.params.id }).exec();
            res.send({data});
        }
        catch(ex) {
            res.status(408).send({message: "" + ex});
        }
    })
}

///////////////////////////////////////////////////////////////////////////////////////////
const port: number = +process.env.API_PORT || 8080;

// Auto starter
(async () => {
    try {
        const app = express();

        // Parse JSON bodies (as sent by API clients)
        app.use(express.json());

        appRoute(app);
        
        (() => {
            //let pkg = require(path.resolve(path.join(__dirname, 'package.json')));
            let pkg = require(path.resolve('./package.json'));
            const ver = version => version.replace(/^~|^\^|=/, '');  // "~, ^"
            console.log();  
            console.log('--');
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
