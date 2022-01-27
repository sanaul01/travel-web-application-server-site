const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hcshw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true, });

async function run() {
  try {
        await client.connect();
        const database = client.db("travel_blogs");
        const blogsCollection = database.collection("blogs");
        const usersCollection = database.collection("users");

    // added blogs in database 
    app.post("/blogs", async (req, res) => {
        const blog = req.body;
        const result = await blogsCollection.insertOne(blog);
        res.json(result);
    });

    // added users in database 
    app.post("/users", async (req, res) =>{
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result)
      res.json(result);
    });

    // update users in database 
    app.put('/users', async (req, res) =>{
      const user = req.body;
      const filter = {email: user.email};
      const options = {upsert: true };
      const updateDoc = {$set: user};
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    })

  } 
  finally {
    //   await client.close();
  }

};
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Travelers!");
});

app.listen(port, () => {
  console.log(`listening ${port}`);
});
