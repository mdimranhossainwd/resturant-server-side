require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(process.env.RESTURANT_STRIPE_API_KEY);
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      "https://foodhouse-97347.firebaseapp.com",
      "https://foodhouse-97347.web.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.RESTURANT_SECRET_NAME}:${process.env.RESTURANT_SECRET_PASSWORD}@cluster0.2xcsswz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri);

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
    const addFoodItemsCollections = client
      .db("restruantDB")
      .collection("recipiefood");
    const userCollections = client.db("restruantDB").collection("users");

    const addFoodCollections = client.db("restruantDB").collection("addfood");
    const paymentsCollections = client.db("restruantDB").collection("payment");
    const adminUserCollections = client.db("restruantDB").collection("user");

    // GATEMAN VERIFY TOKEN

    const gateman = (req, res, next) => {
      const { token } = req.cookies;

      if (!token) {
        return res.status(401).send({ message: "Your are not Authorized" });
      }

      jwt.verify(
        token,
        process.env.RESTURANT_ACCESS_TOKEN,
        function (err, decoded) {
          if (err) {
            return res.status(401).send({ message: "Your are not Authorized" });
          }
          req.user = decoded;
          next();
        }
      );
    };

    // PAYMENT OST METHOD
    app.post("/resturant/api/v1/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, "amount inside the intent");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    // ALL GET ITEMS
    // GET FOOD ITEMS
    app.get("/resturant/api/v1/fooditems", gateman, async (req, res) => {
      const cursor = await addFoodItemsCollections.find().toArray();
      res.send(cursor);
    });

    app.get("/resturant/api/v1/fooditems/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addFoodItemsCollections.findOne(query);
      res.send(result);
    });

    app.get("/resturant/api/v1/user/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const cursor = await adminUserCollections.findOne({ email });
      res.send(cursor);
    });

    app.delete("/resturant/api/v1/fooditems/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addFoodItemsCollections.deleteOne(query);
      res.send(result);
    });

    app.patch("/resturant/api/v1/fooditems/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateProduct = await req.body;
      const updateItem = {
        $set: {
          str_Name: updateProduct.str_Name,
          str_Prize: updateProduct.str_Prize,
          category: updateProduct.category,
          str_Thumb: updateProduct.str_Thumb,
          str_Introduction: updateProduct.str_Introduction,
        },
      };
      const result = await addFoodItemsCollections.updateOne(
        filter,
        updateItem
      );
      res.send(result);
    });

    app.get("/resturant/api/v1/payment", async (req, res) => {
      const result = await paymentsCollections.find().toArray();
      res.send(result);
    });

    app.post("/resturant/api/v1/payment", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollections.insertOne(payment);
      console.log("payment body", payment);

      const query = {
        _id: {
          $in: payment.singleId.map((id) => new ObjectId(id)),
        },
      };

      const deleteResult = await addFoodCollections.deleteMany(query);

      res.send({ result, deleteResult });
    });

    // GET TO CART SPECEFIC ITEMS
    app.get("/resturant/api/v1/addfood", async (req, res) => {
      const cursor = await addFoodCollections.find().toArray();
      res.send(cursor);
    });

    // GET TO SPECEFIC USER'S

    app.get("/resturant/api/v1/additem", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = await addFoodCollections.find(query).toArray();
      res.send(cursor);
    });

    // ALL POST GENERATED

    // ADD TO CART GENERATED
    app.post("/resturant/api/v1/user", async (req, res) => {
      const body = req.body;
      const result = await userCollections.insertOne(body);
      res.send(result);
    });

    // app.get("/resturant/api/v1/user/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const cursor = await userCollections.findOne({ email });
    //   res.send(cursor);
    // });

    app.patch("/resturant/api/v1/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/resturant/api/v1/user", gateman, async (req, res) => {
      const cursor = await userCollections.find().toArray();
      res.send(cursor);
    });

    app.post("/resturant/api/v1/additem", async (req, res) => {
      const body = req.body;
      const result = await addFoodCollections.insertOne(body);
      res.send(result);
    });

    // ADD RECIPIE ITEM TO ADMIN
    app.post("/resturant/api/v1/addrecipie", async (req, res) => {
      const body = req.body;
      const result = await addFoodItemsCollections.insertOne(body);
      res.send(result);
    });

    // ALL DELETE ITEM FUNCTONS
    app.delete("/resturant/api/v1/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollections.deleteOne(query);
      res.send(result);
    });
    app.delete("/resturant/api/v1/additem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addFoodCollections.deleteOne(query);
      res.send(result);
    });

    // JWT TOKEN SET
    app.post("/resturant/api/v1/auth/access-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.RESTURANT_ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
