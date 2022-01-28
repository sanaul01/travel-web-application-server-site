const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const serviceAccount = require("./travel-web-application-418e8-firebase-adminsdk-y62wj-7b1de6864c (1).json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hcshw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }

  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("travel_blogs");
    const blogsCollection = database.collection("blogs");
    const usersCollection = database.collection("users");

   

    app.get("/blogs", async (req, res) => {
      const cursor = blogsCollection.find({});
      const page  = req.query.page;
      const size = parseInt(req.query.size);
      let blogs;
      const count = await cursor.count();
      if(page){
        blogs = await cursor.skip(page*size).limit(size).toArray();
      }
      else{
        blogs = await cursor.toArray();
    }
      // const result = await cursor.toArray();
      res.json({count, blogs});
    });

    app.get('/blogs/:id', async (req, res)=>{
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const result = await blogsCollection.findOne(query);
      res.json(result);
    });

    app.put('/blogs/:id', async (req, res) =>{
      const id = req.params.id;
      const updateBlog = req.body;
      const filter = { _id: ObjectId(id)};
      const options = { upsert: true };
      const updateDoc = { 
        $set: {
          image: updateBlog.image,
          title: updateBlog.title,
          info: updateBlog.info,
          description: updateBlog.description,
          category: updateBlog.category, 
          location: updateBlog.location,
          cost: updateBlog.cost, 
        } };
      const result = await blogsCollection.updateOne(filter, options, updateDoc);
      console.log(result)
      res.json(result)

    })

    // added blogs in database
    app.post("/blogs", async (req, res) => {
      const blog = req.body;
      const result = await blogsCollection.insertOne(blog);
      res.json(result);
    });

    // Get a specifiqe user
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // added users in database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    // update users in database
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // make a admin
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
        else{
          res.status(403).json({messege: 'you do not have access to make admin'})
        }
      }
    });
  } 
  
  finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Travelers!");
});

app.listen(port, () => {
  console.log(`listening ${port}`);
});
