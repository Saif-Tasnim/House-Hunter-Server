const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
// hashing tools
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ectfhk2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const userCollection = client.db('house-hunter').collection('users');

        app.get('/', (req, res) => {
            res.send("House Hunter Server is set up")
        })

        // users data
       
        app.get('/users', async (req, res) => {
            // console.log(req.query);
            const email = req.query.email;
            const password = req.query.password;
            
            console.log(email, password);
            if (email && password) {
                const hashedPass = bcrypt.hash(password, 10);
                const query = { email: email, password: hashedPass };
                console.log(query);
                const result = await userCollection.findOne(query);
                console.log(result);
                res.send(result);
            }
            else {
                const result = await userCollection.find().toArray();
                res.send(result);
            }
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const { name, phone, email, password, role } = req.body;
            const hashedPass = await bcrypt.hash(password, 10);

            const data = { name, email, role, phone, password: hashedPass };
            // console.log(data);

            const query = { email: user?.email };

            const find = await userCollection.findOne(query);

            if (find) {
                return res.status(400).json({ message: 'User already exist' });
            }

            const result = await userCollection.insertOne(data);
            res.send(result);
        })

        // jwt token
        app.post('/jwt' , (req,res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JSON_TOKEN , {expiresIn: '1h'});
            res.send({token});
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`${port} is used for running server`);
})