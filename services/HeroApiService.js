//import React from 'react';
import MessageService from './MessageService';

export default class HeroApiService {
    static url = "http://localhost:8080/api/heroes";

    /** Log a HeroService message with the MessageService */
    static log(message) {
       MessageService.add(`HeroService: ${message}`); 
    }

    // Query
    static async list() {
        HeroApiService.log('fetched heroes');
        let res = await fetch(HeroApiService.url);
        let heroes = await res.json();
     
        return heroes;
    }

    // Read
    static async get(id) {
        try {
            HeroApiService.log(`fetched hero id=${id}`);
            const res = await fetch(`${HeroApiService.url}/${id}`);
            return await res.json();
        }
        catch(ex) {
            return { message: ex.message || ex };
        }
    }

    // Search term
    static async search(term) {
        try {
            HeroApiService.log(`Search heroes matching "${term}"`);
            const res = await fetch(`${HeroApiService.url}?name=${term}`);
            return await res.json();
        }
        catch(ex) {
            return { message: ex.message || ex };
        }
    }
    
    // Create
    static async post(hero) {
        try {
            console.log("post: ", hero)
            HeroApiService.log(`added hero w/o id=${hero.id}`);
            const res = await fetch(HeroApiService.url, {
                method: 'POST',
                body:    JSON.stringify(hero),
                headers: { 'Content-Type': 'application/json' },
            });
            return await res.json();
        }
        catch(ex) {
            return { message: ex.message || ex };
        }
    }

    // Update
    static async put(hero) {
        try {
            HeroApiService.log(`updated hero id=${hero.id}`);
            const res = await fetch(HeroApiService.url, {
                method: 'put',
                body:    JSON.stringify(hero),
                headers: { 'Content-Type': 'application/json' },
            });
            return await res.json();
        }
        catch(ex) {
            return { message: ex.message || ex };
        }
    }

    // Delete
    static async delete(id) {
        HeroApiService.log(`deleted hero id=${id}`);
        const res = await fetch(HeroApiService.url + "/" + id, {
            method: 'delete',
            headers: { 'Content-Type': 'application/json' },
        });
        return await res.json();
    }
}