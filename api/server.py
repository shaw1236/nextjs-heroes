## Python/flask/MongoDb Service for micro service 
##
## Purpose: provide restful web api (CRUD)
##
##  Author : Simon Li  Nov 2019
##
# ref: https://code.visualstudio.com/Docs/editor/debugging
###############################################################
# pip install pymongo
import pymongo        
from bson.objectid import ObjectId  # python native

# Use package flask   ($pip install flask flask_cors)
from flask import Flask, jsonify

from flask import abort, make_response
from flask import request
from flask import url_for

from flask_cors import CORS, cross_origin  # cors

import os

class MongoService:
    def __init__(self, host = 'localhost', port = 27017, dbname = 'mydatabase'):
        '''
        myclient = pymongo.MongoClient('mongodb://localhost:27017/')
        mydb = myclient['mydatabase']
        mycol = mydb["customers"]
        '''
        if host == 'localhost':
            host = os.getenv('MONGO_HOST', 'localhost')

        self.__client = pymongo.MongoClient("mongodb://%s:%d/" % (host, port))
        self.__dbo = self.__client[dbname]
        
    @property
    def dbo(self):
        return self.__dbo 
   
    @dbo.setter
    def dbo(self, dbname):
        self.__dbo = self.__client[dbname]

    @property
    def collection(self):
        return self.__collection 
   
    @collection.setter
    def collection(self, collectionName):
       self.__collection = self.__dbo[collectionName]    

    # Drop the collection
    def drop(self):
        self.__collection.drop()

    # List all the documents
    def display(self, query = {}):
        for doc in self.__collection.find(query, {'_id': False}):
            print(doc)

    # Return an array of documents
    def list(self, query = {}):
        arrDocs = []
        for doc in self.__collection.find(query, {'_id': False}):
            arrDocs.append(doc)
        return arrDocs

    # Insert a new document 
    def add(self, doc):
        result = self.__collection.insert_one(doc.copy())
        return result.inserted_id

    # Insert many documents 
    def addMany(self, docs):
        result = self.__collection.insert_many(docs)
        return [str(id) for id in result.inserted_ids]

    # Update the existing one
    def updateOne(self, query, valueSet):
        newvalues = { "$set": valueSet }
        self.__collection.update_one(query, newvalues)
        
    # Update the existing many
    def update(self, query, valueSet):
        newvalues = { "$set": valueSet }
        x = self.__collection.update_many(query, newvalues)
        return x.modified_count

    # Remove a document
    def removeOne(self, query):
        self.__collection.delete_one(query)

    # Remove all the documents       
    def remove(self, query):    
        x = self.__collection.delete_many(query)
        return x.deleted_count

    def clean(self):
        self.__collection.delete_many({})

    @property
    def ObjectId(self):
        return ObjectId

###############################################################
app = Flask(__name__)

cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

allowedOrigins = [
                    'http://localhost:3000', 'http://localhost:4000', 'http://localhost:5000',
                    'http://127.0.0.1:3000', 'http://127.0.0.1:4000', 'http://127.0.0.1:5000',
                    'http://127.0.0.1:8081', 'http://192.168.2.227:8081'
                ]

print("app: %s" % app)

###############################################################
# Database service
mongo = MongoService()
mongo.collection = "heroes"  

#############################################################
# Error: error handler, 404
@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)

#############################################################
# Api - Dummy   
@app.route('/', methods=['GET'])
@cross_origin()   # open to public
def get_dummy():
    return "Welcome Rest API powered by python/MongoDB."

#############################################################
# Api 1: R[get], get full data   
@app.route('/api/heroes', methods=['GET'])
@cross_origin(origins=allowedOrigins)
def get_all():
    query = {}
    term = request.args.get('name')
    if term:
        pattern = { "$regex": "^{0}".format(term) }
        query = { "name": pattern }
    return jsonify(mongo.list(query))

#############################################################
# Api 2: R[get], get a list per id
@app.route('/api/heroes/<int:id>', methods=['GET'])
@cross_origin(origins=allowedOrigins)
def get_single(id):
    itemSel = [hero for hero in mongo.list() if hero['id'] == id]
    if len(itemSel) == 0:
        abort(404)
    return jsonify(itemSel[0])


#############################################################
# Api 3: C[post], create 
@app.route('/api/heroes', methods=['POST'])
@cross_origin(origins=allowedOrigins)
def create():
    body = request.json

    if isinstance(body, list):
        # Persistence - insert
        #print("InsertMany")
        result = []
        for elem in body:
            hero = {'id': elem['id'], 'name': elem['name']}
            result.append(mongo.add(hero))
        #return jsonify(result), 201
        return {'result': 'total {0} documents added'.format(len(result))}, 201
    else:
        #print("InsertOne")        
        if not request.json or not 'name' in request.json:
            abort(400)
        
        id = 0
        if 'id' in body:
            id = body['id']
        else:
            id = mongo.list()[-1]['id'] + 1

        hero = {
            'id': id,
            'name': request.json['name']
        }
    
        # Persistence - insert
        mongo.add(hero)

        return jsonify(hero), 201
        
#############################################################
# Api 4: U[put], update
@app.route('/api/heroes', methods=['PUT'])
@cross_origin(origins=allowedOrigins)
def update_one():
    hero = {  
            'id': request.json['id'],
            'name': request.json['name']
    }

    if hero['id'] <= 0:
        abort(404)
    
    # Persistence - update
    mongo.updateOne({"id": hero['id']}, hero)

    return jsonify(hero)


#############################################################
# Api 5: D[delete], delete
@app.route('/api/heroes/<int:id>', methods=['DELETE'])
@cross_origin(origins=allowedOrigins)
def delete_one(id):
    itemSel = [hero for hero in mongo.list() if hero['id'] == id]
    if len(itemSel) == 0:
        abort(404)
    
    # Persistence - delete
    mongo.removeOne({"id": itemSel[0]['id']})

    return jsonify({'result': True})

#############################################################
if __name__ == '__main__':
    #app.run(debug=True)
    port = int(os.getenv('API_PORT', '8080'))   
    app.run(host = '0.0.0.0', port = port)
 