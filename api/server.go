// Go/MongoDb Micro Service for Hero
//
// Purpose: provide restful web api (CRUD)
//
// Author : Simon Li  July 2019
//
// ref: https://tutorialedge.net/golang/creating-restful-api-with-golang/
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Must start with a upper case character
type Hero struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

// Data from a database(sql, no-sql)
// Notice: the hero data will be cached within the server !!
var Heroes []Hero

// Set the http header to control the contents and cors
func setHeader(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	// cors handling
	allowedOrigins := []string{"http://localhost:3000", "http://localhost:4000", "http://localhost:5000",
		"http://127.0.0.1:3000", "http://127.0.0.1:4000", "http://127.0.0.1:5000",
		"http://127.0.0.1:8081", "http://192.168.2.227:8081"}
	clientOrigin := r.Header.Get("Origin")
	//fmt.Println("Origin", clientOrigin)

	isAllowedOrigin := false
	for _, allowed := range allowedOrigins {
		if allowed == clientOrigin {
			isAllowedOrigin = true
			break
		}
	}
	if isAllowedOrigin {
		w.Header().Set("Access-Control-Allow-Origin", clientOrigin)
	} else {
		if clientOrigin == "" || clientOrigin == "null" { // allow local test
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}
		fmt.Println("Client Origin", clientOrigin)
	}
	//w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "X-Requested-With,content-type")
	w.Header().Set("Access-Control-Allow-Credentials", "1")
}

// strings.ReplaceAll implementation for a lower golang version (< 1.12)
func strings_ReplaceAll(input string, orgs string, news string) string {
	replacer := strings.NewReplacer(orgs, news)
	return replacer.Replace(input)
}

// Method: PUT (PATCH?. MERGE)
func handleApiUpdate(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Endpoint Hit: api update")

	reqBody, _ := ioutil.ReadAll(r.Body)

	//fmt.Fprintf(w, "%+v", string(reqBody))  // check the data
	var myHero Hero
	json.Unmarshal(reqBody, &myHero)

	// update our global hero
	for index, hero := range Heroes {
		// if our id path parameter matches one of our
		// articles
		if hero.Id == myHero.Id {
			// updates our Heroes array
			var message string
			if hero == myHero {
				message = fmt.Sprintf("{\"status\": %d,\"message\": \"hero %d has not been changed\"}", 200, myHero.Id)
			} else {
				Heroes[index] = myHero
				go dbUpdate(myHero)
				message = fmt.Sprintf("{\"status\": %d,\"message\": \"hero %d has been update\"}", 200, myHero.Id)
			}

			fmt.Fprintf(w, message)
			break // dummy code
		}
	}
}

// Method: DELETE
func handleApiDelete(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Endpoint Hit: api delete")

	// once again, we will need to parse the path parameters
	vars := mux.Vars(r)
	// we will need to extract the `id` of the article we
	// wish to delete
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		error := strings_ReplaceAll(err.Error(), "\"", "'")
		message := fmt.Sprintf("{\"status\": %d,\"message\": \"%s\"}", 409, error)
		fmt.Fprintf(w, message)
		//fmt.Println(message)
		return
	}

	// we then need to loop through all our articles
	for index, hero := range Heroes {
		// if our id path parameter matches one of our
		// articles
		if hero.Id == id {
			// updates our Heroes array to remove the hero
			Heroes = append(Heroes[:index], Heroes[index+1:]...)
			go dbDelete(id)
			message := fmt.Sprintf("{\"status\": %d,\"message\": \"hero %d has been removed\"}", 200, id)
			fmt.Fprintf(w, message)
			break // dummy code
		}
	}
}

// Method: POST
func handleApiCreate(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Endpoint Hit: api create")

	// get the body of our POST request
	// return the string response containing the request body
	reqBody, _ := ioutil.ReadAll(r.Body)
	//fmt.Println("reqBody", reqBody)

	//rt := reflect.TypeOf(reqBody)
	//dtype := rt.Kind()
	//fmt.Println("dtype", dtype)
	var heroes []Hero
	var hero Hero
	err := json.Unmarshal(reqBody, &heroes)
	if err != nil {
		json.Unmarshal(reqBody, &hero)
	}

	if len(heroes) > 0 {
		fmt.Println("Endpoint Hit: insertMany")

		// update our global array to include
		// our new element
		Heroes = append(Heroes, heroes...)

		go dbInsertMany(heroes)

		json.NewEncoder(w).Encode(heroes)
	} else {
		fmt.Println("Endpoint Hit: insertOne")
		//fmt.Fprintf(w, "%+v", string(reqBody))  // check the data

		if hero.Id < 1 { // adjust the id if not provided
			hero.Id = len(Heroes) + 1
		}

		// update our global array to include
		// our new element
		Heroes = append(Heroes, hero)

		go dbInsert(hero)

		json.NewEncoder(w).Encode(hero)
	}
}

// Method: GET
func handleApiGet(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Endpoint Hit: returnSingle")
	vars := mux.Vars(r)
	//key := strconv.Atoi(vars["id"])
	key, err := strconv.Atoi(vars["id"])
	if err != nil {
		error := strings_ReplaceAll(err.Error(), "\"", "'")
		message := fmt.Sprintf("{\"status\": %d,\"message\": \"%s\"}", 409, error)
		fmt.Fprintf(w, message)
		//fmt.Println(message)
		return
	}

	//fmt.Fprintf(w, "Key: " + key)
	//fmt.Println("Key: ", key)
	for _, hero := range Heroes {
		if hero.Id == key {
			json.NewEncoder(w).Encode(hero)
			return
		}
	}

	message := fmt.Sprintf("{\"status\": %d, \"message\": \"Not found data with id: %d\"}", 404, key)
	fmt.Fprintf(w, message)
}

// Method: GET
func handleApiGetDb(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Endpoint Hit: returnDbSingle")
	vars := mux.Vars(r)
	//key := strconv.Atoi(vars["id"])
	key, err := strconv.Atoi(vars["id"])
	if err != nil {
		error := strings_ReplaceAll(err.Error(), "\"", "'")
		message := fmt.Sprintf("{\"status\": %d,\"message\": \"%s\"}", 409, error)
		fmt.Fprintf(w, message)
		//fmt.Println(message)
		return
	}

	hero, err := dbFind(key)
	if err == nil {
		json.NewEncoder(w).Encode(hero)
		//w.WriteHeader(http.StatusOK)
		return
	}

	message := fmt.Sprintf("{\"status\": %d, \"message\": \"Not found data with id: %d\"}", 404, key)
	fmt.Fprintf(w, message)
}

// Method: GET (Query)
func handleApiQuery(w http.ResponseWriter, r *http.Request) {
	//w.Header().Set("Access-Control-Allow-Origin", "*")
	//if r.Method == http.MethodOptions {
	//    return
	//}
	fmt.Println("Endpoint Hit: returnAll")

	//fmt.Println("GET params were:", r.URL.Query())
	term := r.URL.Query().Get("name")
	if term != "" {
		//fmt.Println("Term:", term)
		//lowerCaseTerm := strings.ToLower(term)
		vslice := make([]Hero, 0)
		for _, hero := range Heroes {
			//if strings.HasPrefix(strings.ToLower(hero.Name), lowerCaseTerm) { // case-insensitive search
			if strings.HasPrefix(hero.Name, term) { // case sensitive
				vslice = append(vslice, hero)
			}
		}
		json.NewEncoder(w).Encode(vslice)
	} else {
		json.NewEncoder(w).Encode(Heroes)
	}

	w.Header().Set("Content-Type", "application/json")
	//w.WriteHeader(http.StatusOK)
}

// Dummy home page
func homePage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Welcome to the API Home Page powered by go & mongoDb!")
	fmt.Println("Endpoint Hit: homePage")
}

// handle requests for list query, creation, update
func handleAll(w http.ResponseWriter, r *http.Request) {
	setHeader(w, r)
	fmt.Println("Method:", r.Method)

	switch r.Method {
	case http.MethodGet:
		handleApiQuery(w, r)
	case http.MethodPost:
		handleApiCreate(w, r)
	case http.MethodPut:
		handleApiUpdate(w, r)
	}
}

// handle requests for individual query, deletion
func handleSingle(w http.ResponseWriter, r *http.Request) {
	setHeader(w, r)

	fmt.Println("Method:", r.Method)
	switch r.Method {
	case http.MethodGet:
		handleApiGet(w, r)
	case http.MethodDelete:
		handleApiDelete(w, r)
	}
}

// Handle the http requests
func handleRequests(port string) {
	// creates a new instance of a mux router
	myRouter := mux.NewRouter().StrictSlash(true)

	// Router: root /
	myRouter.HandleFunc("/", homePage)

	// Router: /api/heroes - get, post, put/patch
	myRouter.HandleFunc("/api/heroes", handleAll).Methods(http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodOptions)

	// Router: /api/heroe/{id}  -- get and delete
	myRouter.HandleFunc("/api/heroes/{id}", handleSingle).Methods(http.MethodGet, http.MethodDelete, http.MethodOptions)

	// handle the cors
	myRouter.Use(mux.CORSMethodMiddleware(myRouter))

	// Launch the server to listen a defined port
	//log.Fatal(http.ListenAndServe(":10000", myRouter))
	log.Fatal(http.ListenAndServe(":"+port, myRouter))
}

// MongoDb connection
func dbConnect() (*mongo.Client, *mongo.Collection) {
	// Set client options
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")

	// Connect to MongoDB
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	// Check the connection
	err = client.Ping(context.TODO(), nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connected to MongoDB!")

	dbo := client.Database("mydatabase")
	collection := dbo.Collection("heroes")

	return client, collection
}

// Close the db connection
func dbClose(client *mongo.Client) {
	err := client.Disconnect(context.TODO())

	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connection to MongoDB closed.")
}

// Query the full list from the database
func getFromDatabase() {
	// Open up our database connection.
	client, collection := dbConnect()

	// defer the close till after the main function has finished executing
	defer dbClose(client)

	// Execute the query
	// Passing bson.D{{}} as the filter matches all documents in the collection
	// Pass these options to the Find method
	findOptions := options.Find()
	cur, err := collection.Find(context.TODO(), bson.D{{}}, findOptions)
	if err != nil {
		log.Fatal(err)
	}

	// Iterating through the cursor allows us to decode documents one at a time
	for cur.Next(context.TODO()) {
		// create a value into which the single document can be decoded
		var elem Hero
		err := cur.Decode(&elem)
		if err != nil {
			log.Fatal(err)
		}

		Heroes = append(Heroes, elem)
	}

	if err := cur.Err(); err != nil {
		log.Fatal(err)
	}

	// Close the cursor once finished
	cur.Close(context.TODO())

	//fmt.Printf("Found multiple documents (array of pointers): %+v\n", Heroes)
}

// Query an individual document/record
func dbFind(id int) (Hero, error) {
	// Open up our database connection.
	client, collection := dbConnect()

	// defer the close till after the function has finished executing
	defer dbClose(client)

	filter := bson.D{{"id", id}}
	//fmt.Println("filer", filter)
	// create a value into which the result can be decoded
	var hero Hero

	err := collection.FindOne(context.TODO(), filter).Decode(&hero)
	fmt.Printf("Found a single document: %+v\n", hero)

	return hero, err
}

// Insert a document/record to the collection/table
func dbInsert(hero Hero) {
	// Open up our database connection.
	client, collection := dbConnect()

	// defer the close till after the function has finished executing
	defer dbClose(client)

	//timestamp := time.Now().Format("2006-01-02 15:04:05")
	//fmt.Println("Timestamp: ", timestamp)

	insertResult, err := collection.InsertOne(context.TODO(), hero)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Inserted a single document: ", insertResult.InsertedID)
}

// Insert many a list of documents/records to the collection/table
func dbInsertMany(heroes []Hero) {
	// Open up our database connection.
	client, collection := dbConnect()

	// defer the close till after the function has finished executing
	defer dbClose(client)

	//timestamp := time.Now().Format("2006-01-02 15:04:05")
	//fmt.Println("Timestamp: ", timestamp)

	for _, hero := range heroes {
		insertResult, err := collection.InsertOne(context.TODO(), hero)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println("Inserted a single document: ", insertResult.InsertedID)
	}
}

// Update a document/record in the collection/table
func dbUpdate(hero Hero) {
	// Open up our database connection.
	client, collection := dbConnect()

	// defer the close till after the function has finished executing
	defer dbClose(client)

	filter := bson.D{{"id", hero.Id}}

	update := bson.D{
		{"$set", bson.D{
			{"name", hero.Name},
		},
		},
	}

	updateResult, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Matched %v documents and updated %v documents.\n", updateResult.MatchedCount,
		updateResult.ModifiedCount)
}

// Delete a document/record from the collection/table
func dbDelete(id int) {
	// Open up our database connection.
	client, collection := dbConnect()

	// defer the close till after the function has finished executing
	defer dbClose(client)

	filter := bson.D{{"id", id}}

	deleteResult, err := collection.DeleteOne(context.TODO(), filter)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Deleted %v documents in the heroes collection\n", deleteResult.DeletedCount)
}

// Main
func main() {
	fmt.Println("Rest API - Mongo")
	go getFromDatabase() // no wait, an asynchronous run to load our global hero list
	//fmt.Println(Heroes)

	// Set up the server port
	port := os.Getenv("API_PORT")
	if len(port) == 0 {
		port = "8080" // use the default port 8080 if no env found
	}

	fmt.Println("Server starts at port: ", port)
	handleRequests(port)
}
