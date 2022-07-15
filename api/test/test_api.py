'''
   Purpose: Python unit test for backend api
   Author : Simon Li
   Date   : August 7, 2020

   cli    : $python test_api.py
'''

import unittest
import requests
import os

host     = os.environ.get("API_HOST", 'localhost')
port     = os.environ.get("API_PORT", '8080')

root_url = "http://{0}:{1}".format(host, port)
endpoint = root_url + "/api/heroes"
 
class TestApi(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        unittest.TestCase.__init__(self, *args, **kwargs)
        self.hero = { "id": 1000, "name": "Dummy" }
        self.searchTerm = self.hero["name"][0:3]

    def setUp(self):
        #print("Base.setUp()")
        pass

    def tearDown(self):
        #print("Base.tearDown()")
        pass

    def test_101home(self):
        resp = requests.get(root_url)
        self.assertEqual(resp.status_code, 200)
        print(" " + resp.text + "\n")
        print(".1. Test api host and port")

    def test_102list(self):
        print("2. List/Query")
        resp = requests.get(endpoint)

        self.assertEqual(resp.status_code, 200)

        obj = resp.json()
        self.assertTrue(isinstance(obj, list))

    def test_103create(self):
        print("3. New/(C)REATE")
        resp = requests.post(endpoint, json=self.hero)

        result = resp.status_code == 200 or resp.status_code == 201
        self.assertEqual(result, True)

        hero = resp.json()
        self.assertEqual(self.hero["id"], hero["id"])
        self.assertEqual(self.hero["name"], hero["name"])

    def test_104read(self):
        print("4. Individual/(R)EAD")
        url = endpoint + "/{0}".format(self.hero["id"])
        
        resp = requests.get(url)
        self.assertEqual(resp.status_code, 200)

        hero = resp.json()
        self.assertTrue(isinstance(hero, dict))
        self.assertEqual(self.hero["id"], hero["id"])
        self.assertEqual(self.hero["name"], hero["name"])
	    
    def test_105search(self):
        print("5. Search Term")
        resp = requests.get(endpoint + "?name={0}".format(self.searchTerm))
        
        self.assertEqual(resp.status_code, 200)
        obj = resp.json()
        self.assertTrue(isinstance(obj, list))
 
    def test_106update(self):
        print("6. Change/(U)PDATE")
        self.hero["name"] = "Changed"

        resp = requests.put(endpoint, json=self.hero)
        self.assertEqual(resp.status_code, 200)
        obj = resp.json()
        self.assertTrue(isinstance(obj, dict))

    def test_107delete(self):
        print("7. Remove/(D)ELETE")
        url = endpoint + "/{0}".format(self.hero["id"])

        resp = requests.delete(url)
        self.assertEqual(resp.status_code, 200)

        obj = resp.json()
        self.assertTrue(isinstance(obj, dict))

    def test_108more(self):
        print("8. More test cases  . . .")
        pass

if __name__ == '__main__':
    unittest.main()
