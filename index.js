const express = require('express')
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5500

// cors && middleware
app.use(express.json())
const cors = require('cors')
app.use(cors())




// mongo client
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zo2yn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// connect mongodb 
async function connect() {
    await client.connect() ? console.log('connected') : console.log('not connected');
    // collections
    const servicesCollection = client.db('manufacturer').collection('services');
    const newsletterCollection = client.db('manufacturer').collection('subscribers');
    const ordersCollection = client.db('manufacturer').collection('orders');
    const usersCollection = client.db('manufacturer').collection('users');
    const paymentDetailsCollection = client.db('manufacturer').collection('payments');
    const blogsCollection = client.db('manufacturer').collection('blogs');
    const reviewsCollection = client.db('manufacturer').collection('reviews');




    // get api
    app.get('/api/services', async (req, res) => {
        const services = await servicesCollection.find({}).sort({ $natural: -1 }).toArray();
        res.send(services);
    })

    // get specific services
    app.get('/api/service/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const service = await servicesCollection.findOne({ _id: ObjectId(id) });
        res.send(service);
    });

    // services insert api
    app.post('/api/services/', verifyToken, verifyAdmin, async (req, res) => {
        const service = req.body;
        const result = await servicesCollection.insertOne(service);
        res.send(result);
    });

    // services patch api 
    app.patch('/api/service/:id', verifyToken, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        const service = req.body;
        await servicesCollection.updateOne({ _id: ObjectId(id) }, { $set: service });
        res.send(service);
    });

    // services put api
    app.put('/api/services/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const service = req.body;
        await servicesCollection.updateOne({ _id: ObjectId(id) }, { $set: service });
        res.send(service);
    });

    // services delete api
    app.delete('/api/services/:id', verifyToken, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        await servicesCollection.deleteOne({ _id: ObjectId(id) });
        res.send({ success: true, message: 'Service deleted' });
    });


    // get all orders
    app.get('/api/orders', verifyToken, verifyAdmin, async (req, res) => {
        const orders = await ordersCollection.find({}).sort({ $natural: -1 }).toArray();
        res.send(orders);
    });