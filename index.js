const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.RESTURANT_SECRET_NAME}:${process.env.RESTURANT_SECRET_PASSWORD}@cluster0.2xcsswz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // COLLECTIONS DECLARATIONS

    const foodItemCollections = client
      .db("restruantDB")
      .collection("foodCollections");

    // GET FOOD ITEMS
    app.get("/resturant/api/v1/fooditems", async (req, res) => {
      const cursor = await foodItemCollections.find().toArray();
      res.send(cursor);
    });

    // JWT TOKEN SET
    app.post("/resturant/api/v1/auth/access-token", async (req, res) => {
      const user = req.body;
      const token = await jwt.sign(user, process.env.RESTURANT_ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Resturant-Server is Currently Running");
});

app.listen(port, () => {
  console.log(`Resturan-Server is Currently Running On:- ${port}`);
});
