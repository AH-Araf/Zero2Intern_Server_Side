const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xbkhg1t.mongodb.net/z2i_db?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



async function run() {
    try {
        await client.connect();
        const usersCollection = client.db("ZtoI").collection("users");
        const internCollection = client.db("ZtoI").collection("allInterns");

        //Users----------------------------------------------------------------

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
            res.send({ token })
        })

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }


        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        // add and get interns ------------------------------------------------------------------------------
        app.post('/interns', async (req, res) => {
            const review = req.body;
            const c = await internCollection.insertOne(review);
            res.send(c);
        });
        app.get('/interns', async (req, res) => {
            let query = {};
            const cursor = internCollection.find(query).limit(0).sort({$natural:-1});
            const a = await cursor.toArray();
            res.send(a); 
        });
        app.get('/internLimit', async (req, res) => {
            let query = {};
            const cursor = internCollection.find(query).limit(3).sort({$natural:-1}) ;
            const serve = await cursor.toArray();
            res.send(serve);
        });
        // app.get('/interns/:id', async (req, res) => {
        //     // const id = req.params.id;
        //     // const query = { _id: ObjectId(id) };
        //     let id = arg.query.id
        //     const nid = new BSON.ObjectId(id)
        //     const a = await internCollection.findOne({ _id:  id});
        //     res.send(a);
        // });




        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('z2i')
})

app.listen(port, () => {
    console.log(`z2i on port ${port}`)
})