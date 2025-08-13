import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import Product from "./models/product.js";
import Lead from "./models/lead.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cors());

// Middleware to log requests and responses
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  next();
});

// MongoDB connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Product routes

app.get("/product", async (req, res) => {
  try {
    const products = await Product.find({}, "id name -_id");
    res.json(products);
  } catch (err) {
    console.error("Error fetching product list:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    console.log("Fetched product:", product);
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/product/:id", async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/product/:id", async (req, res) => {
  try {
    const { name, context } = req.body;
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { id: req.params.id, name, context },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating/updating product:", err);
    res.status(500).json({ error: err.message });
  }
});

// Lead routes

app.get("/lead", async (req, res) => {
  try {
    const leads = await Lead.find({}, "id -_id");
    res.json(leads);
  } catch (err) {
    console.error("Error fetching lead list:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/lead/:id", async (req, res) => {
  try {
    const lead = await Lead.findOne({ id: req.params.id });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    console.log("Fetched lead:", lead);
    res.json(lead);
  } catch (err) {
    console.error("Error fetching lead:", err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/lead/:id", async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (err) {
    console.error("Error updating lead:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/lead/:id", async (req, res) => {
  try {
    const { context, whatsappMsgs } = req.body;
    const lead = await Lead.findOneAndUpdate(
      { id: req.params.id },
      { id: req.params.id, context, whatsappMsgs },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(lead);
  } catch (err) {
    console.error("Error creating/updating lead:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the ConvoFlow API server");
});

// WhatsApp OAuth
app.get("/oauth", (req, res) => {
  const { code, state } = req.query;
  console.log("OAuth code:", code);
  console.log("OAuth state:", state);

  // Here you would typically exchange the code for an access token
  // with the WhatsApp API, using your client ID and client secret.

  // For now, let's just return a success message
  if (code && state) {
    res.send("OAuth successful");
  } else {
    res.status(500).send("OAuth failed");
  }
});

// WhatsApp Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("Webhook verified!");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// WhatsApp Webhook to receive messages
app.post("/webhook", (req, res) => {
  const body = req.body;
  console.log("Received webhook event:", JSON.stringify(body, null, 2));

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      console.log("Message from:", message.from);
      console.log("Message text:", message.text?.body);
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Basic Express setup with no routes
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
