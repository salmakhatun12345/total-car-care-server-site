const express = require('express')
const jwt = require('jsonwebtoken')
const ObjectId = require('mongodb').ObjectId
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require("cors")
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9nqbm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db("totalCare").collection("tools")
        const reviewCollection = client.db("totalCare").collection("reviews")
        const userCollection = client.db("totalCare").collection("users")
        const ordersCollection = client.db("totalCare").collection("orders")

        app.get('/get-tool', async (req, res) => {
            const tools = await toolsCollection.find({}).toArray()
            res.send(tools)
        })

        app.post('/add-tool', async (req, res) => {
            const data = req.body
            const result = await toolsCollection.insertOne(data)
            res.send(result)
        })

        app.get('/get-tool/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await toolsCollection.findOne(query);
            res.send(result);
        });

        app.get('/get-review', async (req, res) => {
            const reviews = await reviewCollection.find({}).toArray()
            res.send(reviews)
        })

        app.post('/add-review', async (req, res) => {
            const data = req.body
            const result = await reviewCollection.insertOne(data)
            res.send(result)
        })


        app.put('/users', async (req, res) => {
            const doc = req.body;
            const email = req.body.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    email: doc.email
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        app.get('/users', verifyJWT, async (req, res) => {
            const users = await userCollection.find({}).toArray()
            res.send(users)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email)
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        app.patch('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        // JwtToken
        app.put('/users/:email', async (req, res) => {
            const doc = req.body;
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: doc,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const access = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, access });
        })

        app.post('/orders', verifyJWT, async (req, res) => {
            const data = req.body
            const result = await ordersCollection.insertOne(data)
            res.send(result)
        })






        // app.patch('/users', async (req, res) => {
        //     const doc = req.body;
        //     const email = req.body.email;
        //     const filter = { email: email };
        //     const updateDoc = {
        //         $set: {
        //             email: doc.email
        //         },
        //     };
        //     const result = await usersCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // })
    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})