const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectID, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

const app = express();


//middleware
app.use(cors());
app.use(express.json());


//MOngoDB connections

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ Message: 'unauthorized access!' })
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ Message: 'Forbidden access!' })
        }
        console.log('decoded:', decoded)
        req.decoded = decoded;
        next();
    });

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.emmtc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();
        const serviceCollection = client.db('AutocareService').collection('service');
        const orderCollection = client.db('AutocareService').collection('order');


        //Auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })


        // Services Api 
        //read all data
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        //read specific data
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        //Add Service
        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        });

        // DELETE
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });


        // Modify
        app.put('/service/:id', async (req, res) => {
            const id = req.params.id;
            const updatedService = req.body;
            console.log(updatedService);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: updatedService
            };
            const result = await serviceCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        //Order Collection 

        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })


    } finally {

    }

}

run().catch(console.dir);


//
app.get('/', (req, res) => {
    res.send('Running Aqaline Autocare Server')
})


app.listen(port, () => {
    console.log('Listening to port: ', port)
})

app.get('/hero', (req, res) => {
    res.send('Hero meets hero ku')
})
