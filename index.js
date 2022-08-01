const express = require('express')
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5500

// cors && middleware
app.use(express.json())
const cors = require('cors')
app.use(cors())

// stripe--------------- +
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// verify jwt token
function verifyToken(req, res, next) {
    const authorization = req.headers?.authorization;


    // console.log(authorization);
    if (!authorization) {
        return res.status(403).send({ success: false, message: 'Forbidden Access' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ success: false, message: 'Unauthorized access' });
        }
        req.decoded = decoded;
        // console.log(decoded);
        next();
    });
}


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
    // verify admin
    const verifyAdmin = async (req, res, next) => {
        const requester = req.decoded?.email;
        const requesterAccount = await usersCollection.findOne({ email: requester });
        // console.log(requesterAccount);
        if (requesterAccount?.role === 'admin') {
            next();
        }
        else {
            return res.status(403).send({ success: false, message: 'Forbidden Access' });
        }
    }

    // get api initial 
    app.get('/', (req, res) => res.send('Hello World!'))

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

    // specific order get api
    app.get('/api/order/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const order = await ordersCollection.findOne({ _id: ObjectId(id) });
        res.send(order);
    });

    // patch order api
    app.patch('/api/order/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const payment = req.body;
        const result = await ordersCollection.updateOne({ _id: ObjectId(id) }, { $set: { paid: true, transactionId: payment.transactionId } });
        const paymentsCollection = await paymentDetailsCollection.insertOne(payment);
        res.send(result);
    })

    // orders get api with email 
    app.get('/api/orders/:email', verifyToken, async (req, res) => {
        const email = req.params.email;
        const orders = await ordersCollection.find({ email: email }).sort({ $natural: -1 }).toArray();
        res.send(orders);
    });

    // orders delete api
    app.delete('/api/orders/:id', verifyToken, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        await ordersCollection.deleteOne({ _id: ObjectId(id) });
        res.send({ success: true });
    });


    // order post api
    app.post('/api/orders', verifyToken, async (req, res) => {
        const order = req.body;
        await ordersCollection.insertOne(order);
        res.send(order);
    });

    // user put api
    app.put('/api/user/:email', async (req, res) => {
        const email = req.params.email;
        // console.log(email);
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
            $set: user,
        };
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send({ result, token });
        // res.send(result);
    })

    //   users get api
    app.get('/api/users', verifyToken, verifyAdmin, async (req, res) => {
        const users = await usersCollection.find({}).toArray();
        res.send(users);
    });

    // admin put api
    app.put('/user/admin/:email', verifyToken, verifyAdmin, async (req, res) => {
        const email = req.params.email;
        const requester = req.decoded.email;
        const requesterAccount = await usersCollection.findOne({ email: requester });
        const filter = { email: email };
        const updateDoc = { $set: { role: 'admin' } };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
    })

    //   delete user api
    app.delete('/api/user/:email', verifyToken, verifyAdmin, async (req, res) => {
        const email = req.params.email;
        const requester = req.decoded.email;
        const requesterAccount = await usersCollection.findOne({ email: requester });
        if (requesterAccount.role === 'admin') {
            const result = await usersCollection.deleteOne({ email: email });
            res.send(result);
        } else {
            res.send({ success: false, message: 'You are not authorized to delete this user' });
        }
    })

    // admin get api
    app.get('/admin/:email', async (req, res) => {
        const email = req.params.email;
        const user = await usersCollection.findOne({ email: email });
        const isAdmin = user?.role === 'admin';
        // console.log(isAdmin);
        res.send({ admin: isAdmin })
    })


    // newsletter post api
    app.post('/api/newsletter/:email', async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const options = { upsert: true };
        const result = await newsletterCollection.findOneAndUpdate(filter, { $set: { email: email } }, options);
        res.send(result);
    })
    // blogs get api
    app.get('/api/blogs', async (req, res) => {
        const blogs = await blogsCollection.find({}).toArray();
        res.send(blogs);
    })
    // specific blog get api
    app.get('/api/blog/:id', async (req, res) => {
        const id = req.params.id;
        const blog = await blogsCollection.findOne({ _id: ObjectId(id) });
        res.send(blog);
    })

    // create payment intent
    app.post('/create-payment-intent', verifyToken, async (req, res) => {
        const { price } = req.body;
        const amount = price * 100;
        // console.log(amount);
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ['card']
        });
        res.send({ clientSecret: paymentIntent.client_secret })
    });




}
connect().catch(console.dir);

// app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))