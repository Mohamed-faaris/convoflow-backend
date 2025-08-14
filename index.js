import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import Product from "./models/product.js";
import Lead from "./models/lead.js";
import CompanyConfig from "./models/company-config.js";
import cors from "cors";
import axios from "axios";
import fs from "fs";

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
  if (req.headers.authorization) {
    const token = req.headers.authorization;
    console.log("Authorization Token:", token);
    let config = {};
    try {
      if (fs.existsSync("config.txt")) {
        const fileContent = fs.readFileSync("config.txt", "utf8");
        if (fileContent) {
          config = JSON.parse(fileContent);
        }
      }
    } catch (e) {
      console.error("Error parsing config.txt, starting fresh.", e);
      config = {};
    }
    config.token = token;
    fs.writeFileSync("config.txt", JSON.stringify(config, null, 2));
  }
  console.log("Request body:", req.body);
  next();
});

// MongoDB connection

let companyConfig = {};

async function loadConfig() {
  try {
    const config = await CompanyConfig.findOne();
    if (config) {
      companyConfig = config.configData;
      fs.writeFileSync("config.txt", JSON.stringify(companyConfig, null, 2));
      console.log("Company config loaded and written to config.txt");
    }
  } catch (error) {
    console.error("Error loading company config:", error);
  }
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    loadConfig();
  })
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

app.all("/log", (req, res) => {
  console.log("Log entry:", req.body);
  res.sendStatus(200);
});

app.post("/sendMailBrevo", async (req, res) => {
  const { to, subject, htmlContent } = req.body;

  if (!to || !subject || !htmlContent) {
    return res.status(400).json({
      message: "Missing required fields: to, subject, htmlContent",
    });
  }

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Sender Alex",
          email: "senderalex@example.com",
        },
        to: [
          {
            email: to,
            name: "John Doe",
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.post("/sendZohoMail", async (req, res) => {
  try {
    let config = {};
    if (fs.existsSync("config.txt")) {
      const fileContent = fs.readFileSync("config.txt", "utf8");
      if (fileContent) {
        config = JSON.parse(fileContent);
      }
    }

    const token = config.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token not found." });
    }

    const { toAddress, subject, content } = req.body;
    const { accountId, fromAddress } = config;

    if (!toAddress || !subject || !content) {
      return res
        .status(400)
        .json({ message: "Missing required fields in body" });
    }

    const zohoApiUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages`;

    const response = await axios.post(
      zohoApiUrl,
      {
        fromAddress,
        toAddress,
        subject,
        content,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error sending Zoho mail:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to send Zoho mail" });
  }
});

app.get("/account", async (req, res) => {
  try {
    let config = {};
    if (fs.existsSync("config.txt")) {
      const fileContent = fs.readFileSync("config.txt", "utf8");
      if (fileContent) {
        config = JSON.parse(fileContent);
      }
    }

    const token = config.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token not found." });
    }

    const response = await axios.get("https://mail.zoho.com/api/accounts", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    console.log("Zoho Account Info:", response.data);

    if (response.data && response.data.data && response.data.data.length > 0) {
      const account = response.data.data[0];
      const accountId = account.accountId;
      const fromAddress =
        account.sendMailDetails && account.sendMailDetails.length > 0
          ? account.sendMailDetails[0].fromAddress
          : null;

      if (accountId && fromAddress) {
        config.accountId = accountId;
        config.fromAddress = fromAddress;
        fs.writeFileSync("config.txt", JSON.stringify(config, null, 2));
        console.log("Saved Zoho account info to config.txt:", {
          accountId,
          fromAddress,
        });
        if (fs.existsSync("zoho_account.json")) {
          fs.unlinkSync("zoho_account.json");
        }
      }
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error fetching Zoho accounts:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to fetch Zoho accounts" });
  }
});

app.get("/email/:emailid", async (req, res) => {
  try {
    let config = {};
    if (fs.existsSync("config.txt")) {
      const fileContent = fs.readFileSync("config.txt", "utf8");
      if (fileContent) {
        config = JSON.parse(fileContent);
      }
    }

    const token = config.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token not found." });
    }

    const { accountId } = config;
    const { emailid } = req.params;

    if (!accountId) {
      return res
        .status(400)
        .json({ message: "Account ID not found in config." });
    }

    const zohoApiUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages/search`;

    const response = await axios.get(zohoApiUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
      },
      params: {
        searchKey: `sender:${emailid}::or:to:${emailid}`,
        limit: 5,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error fetching Zoho emails:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to fetch Zoho emails" });
  }
});

app.get("/emailId/:id", async (req, res) => {
  try {
    let config = {};
    if (fs.existsSync("config.txt")) {
      const fileContent = fs.readFileSync("config.txt", "utf8");
      if (fileContent) {
        config = JSON.parse(fileContent);
      }
    }

    const token = config.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token not found." });
    }

    const { accountId } = config;
    const { id: messageId } = req.params;

    if (!accountId) {
      return res
        .status(400)
        .json({ message: "Account ID not found in config." });
    }

    const zohoApiUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages/${messageId}/originalmessage`;

    const response = await axios.get(zohoApiUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    res.status(200).send(response.data);
  } catch (error) {
    console.error(
      "Error fetching Zoho original email:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to fetch Zoho original email" });
  }
});

// Company Config routes
app.post("/company-config", async (req, res) => {
  try {
    const { companyName, configData } = req.body;
    if (!companyName || !configData) {
      return res
        .status(400)
        .json({ message: "Missing required fields: companyName, configData" });
    }

    const updatedConfig = await CompanyConfig.findOneAndUpdate(
      { companyName },
      { configData },
      { new: true, upsert: true }
    );

    await loadConfig(); // Reload config after update

    res.status(201).json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/company-config", async (req, res) => {
  try {
    const configs = await CompanyConfig.find();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
