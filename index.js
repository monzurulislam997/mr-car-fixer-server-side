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