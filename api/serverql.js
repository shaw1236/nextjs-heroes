// TS-Node/MongoDb Micro Graphql Service for Hero  
//
// Purpose: provide graphql web api (CRUD)  
//
// Author : Simon Li  August 2020
//
// Prerequisite packages: 
//        dotenv, mongo, express, express-graphql, graphql
// 
// Tested with GraphiQL, postman GraphQL and curl
'use strict';

//-----------------------------------------
// Part 1 - database
//-----------------------------------------
// Load the enviroment variables to process from .env
require('dotenv').config()

const mongo = require('mongodb');

const path = require('path');
const chalk = require('chalk');

// Easy handling in docker and other runtime
const mongo_host = process.env.MONGO_HOST || 'localhost';
const mongo_port = process.env.MONGO_PORT || '27017';

const mongo_url  = `mongodb://${mongo_host}:${mongo_port}`;

const mongo_database = process.env.MONGO_DATABASE || 'mydatabase';
const collectionName   = 'heroes';

const options = {useNewUrlParser: true, useUnifiedTopology: true};
const mongoClient = new mongo.MongoClient(mongo_url, options);

let HeroModel = null;
mongoClient.connect().then(client => {
    console.log("connected to database")
    let db = client.db(mongo_database);
    HeroModel = db.collection(collectionName);
    console.log("Hero Model has been loaded");
}).catch(console.error);

//---------------------------
// Part 2 - graphql
//---------------------------
const graphql = require('graphql');
const express = require('express');
const { graphqlHTTP } = require('express-graphql');

//construct a schema programmatically.
// src/data/types/CountryType.js
const heroType = new graphql.GraphQLObjectType({
    name: 'Hero',
    fields: {
                id:   { type: graphql.GraphQLInt },
                name: { type: graphql.GraphQLString }
    }
});

const heroInputType = new graphql.GraphQLInputObjectType({
    name: 'HeroInput',
    description: 'Input payload for creating hero',
    fields: () => ({
      id: { type: graphql.GraphQLInt },
      name: { type: graphql.GraphQLString }
    })
});

// Define the Query type
// src/data/queries/getCountries.js
const getHero = {
    type: heroType,
    args: {
        id: { type: graphql.GraphQLInt }
    },
    async resolve(_, {id}) {
        return await HeroModel.findOne({"id": id}, {"_id": 0, "__v": 0});
    }
};

const searchHeroes = {
    type: new graphql.GraphQLList(heroType),
    args: {
        name: { type: graphql.GraphQLString }
    },
    async resolve(_, {name}) {
        let query = { "name": { '$regex': `^${name}` } };
        return await HeroModel.find(query, { projection: {_id: 0, __v: 0} }).toArray();
    }
};

const getHeroList = {
    type: new graphql.GraphQLList(heroType),
    async resolve() {
        return await HeroModel.find({}, { projection: {_id: 0, __v: 0} }).toArray(); 
    }
};

// src/data/mutations/updateMessage.js
const createHero = {
    type: heroType,
    args: {
        //id: { type: graphql.GraphQLInt },
        name: { type: graphql.GraphQLString }
    },
    async resolve(_, {name}) {
        let id = await HeroModel.countDocuments({}) + 1;
        let newDoc = { id, name };

        //console.log(newDoc);
        await HeroModel.insertOne(Object.assign({}, newDoc)); 
        return newDoc;
    }
};

const createHeroes = {
    type: graphql.GraphQLString,
    args: { 
            input: { type: new graphql.GraphQLNonNull(new graphql.GraphQLList(heroInputType)) } 
    },
    async resolve(_, {input}) {
        //console.log(input);
        const heroes = JSON.parse(JSON.stringify(input));
        //console.log(heroes);
        let { result } = await HeroModel.insertMany(heroes);
        // {"result":{"ok":1,"n":2}}
        return `Number of documents inserted: ${result.n}`; 
    }
};

const updateHero = {
    type: graphql.GraphQLString,
    args: { 
        id: { type: graphql.GraphQLInt },
        name: { type: graphql.GraphQLString }
    },
    async resolve(_, {id, name}) {
        const  { result } = await HeroModel.updateOne({ "id": id }, { "$set": {"name": name} });
        // result: { ok: 1, nModified: 1/0, n: 1/0 },
        return `${result.nModified} document(s) patched - ${id}`;
    }
};

const deleteHero = {
    type: graphql.GraphQLString,
    args: {
        id: { type: graphql.GraphQLInt }
    },
    async resolve(_, {id}) {
        let { result } = await HeroModel.removeOne({ "id": id })
        //result: { ok: 1, n: 1 }
        return `Number of documents deleted: ${result.n}`;
    }
};

// src/data/schema.js
const schema = new graphql.GraphQLSchema({
    query: new graphql.GraphQLObjectType({
        name: 'Query',
        fields: {
            getHero,
            getHeroList,
            searchHeroes
        }
    }),
    mutation: new graphql.GraphQLObjectType({
        name: 'Mutation',
        fields: {
            createHero,
            createHeroes,
            updateHero,
            deleteHero
        }
    })
});

//---------------------------
// Part 3 - server.js
//---------------------------
// src/server.js
const port = +process.env.API_PORT || 8080;

const app = express();

// Http headers and cors
app.use((req, res, next) => {
    const allowedOrigins = [
                            'http://localhost:3000', 'http://localhost:4000', 'http://localhost:5000',
                            'http://127.0.0.1:3000', 'http://127.0.0.1:4000', 'http://127.0.0.1:5000',
                            'http://127.0.0.1:8081', 'http://192.168.2.227:8081',
                            `http://localhost:${port}`, `http://127.0.0.1:${port}`
                           ];
    let clientOrigin = req.headers.origin;
    //console.log("Origin", req.headers.origin);    
    if (allowedOrigins.indexOf(clientOrigin) >= 0) 
        res.setHeader('Access-Control-Allow-Origin', clientOrigin);
    else 
        console.log("Client Origin", clientOrigin);

    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.header('Access-Control-Allow-Credentials', '1');
    return next();
});

// Dummy root request
app.get("/", (req, res) => {
    res.send({data: "Welcome to the api service of Heroes powered by node/graphql/MongoDb."});
})

const graphqlMiddleware = graphqlHTTP({
    schema: schema,
    graphiql: true,  // GrapgiQL UI will be launched
    pretty: true
});
app.use('/graphql', graphqlMiddleware);

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
})();

//console.log(`${__dirname}/index.html`);
//app.get('/', (req, res) => res.sendFile(`${__dirname}/index.html`))
app.listen(port, () => {
    console.log(chalk.green(`Running a GraphQL API server at http://localhost:${port}/graphql`));
    console.log(chalk.green(`dbServer listening on port ${port}.`));
});

//-------------------------------
// Part 4 - GraphiQL test samples
//-------------------------------
/* 
======================================================================
query {
  getHero(id: 1) {
    id name
  }
}
======================================================================
{
  searchHeroes(name: "Dr.") {
    id name
  }
}
======================================================================
{
  getHeroList {
    id
    name
  }
}
======================================================================
mutation {
  createHero(name: "Local Torontonian") {
    id name
  }
}
======================================================================
mutation {
  createHeroes(input: [
    { id: 1, name: "Dr. Nice" },
    { id: 2, name: "Narco" },
    { id: 3, name: "Bombasto" },
    { id: 4, name: "Celeritas" },
    { id: 5, name: "Magneta" },
    { id: 6, name: "RubberMan" },
    { id: 7, name: "Dynama" },
    { id: 8, name: "Dr. IQ" },
    { id: 9, name: "Magma" },
    { id: 10, name: "Tornado" }])
}

mutation {
  createHeroes(input: [
    { id: 11, name: "Test 11" },
    { id: 12, name: "Test 12" }]) 
}
=======================================================================
mutation {
  updateHero(id: 11, name: "Torontonianandy")
}
======================================================================
mutation {
  deleteHero(id: 11)
}
*/

//-------------------------------
// Part 5 - curl test samples
//-------------------------------
/*
curl -i -H 'Content-Type: application/json' -X POST -d '{"query": "query {getHeroList{id name}}"}' http://localhost:8080/graphql
curl -i -H 'Content-Type: application/json' -X POST -d '{"query": "query {getHero(id: 1) {id name}}"}' http://localhost:8080/graphql
curl -i -H 'Content-Type: application/json' -X POST -d '{"query": "query {searchHeroes(name: \"Dr.\") {id name}}"}' http://localhost:8080/graphql
curl -i -H 'Content-Type: application/json' -X POST -d '{"query": "mutation {createHero(name: \"curl\") {id name}}"}' http://localhost:8080/graphql
curl -i -H 'Content-Type: application/json' -X POST -d '{"query": "mutation {updateHero(id: 11, name: \"curl test\")}"}' http://localhost:8080/graphql
curl -i -H 'Content-Type: application/json' -X POST -d '{"query": "mutation {deleteHero(id: 11)}"}' http://localhost:8080/graphql
*/