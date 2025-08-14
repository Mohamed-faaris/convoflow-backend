# ConvoFlow Backend

This is the backend server for the ConvoFlow application, built with Node.js and Express. It handles interactions with MongoDB, and external services like Brevo, Zoho Mail, and WhatsApp.

## Prerequisites

- Node.js (v14 or later)
- npm or pnpm
- MongoDB

## Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd convoflow-backend
    ```

2.  Install the dependencies:
    ```bash
    pnpm install
    ```
    or
    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root of the project and add the following environment variables:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
BREVO_API_KEY=your_brevo_api_key
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token
```

A `config.txt` file is also used to store the Zoho authorization token and account details. This file is created and updated automatically by the application.

## Running the Server

To start the server, run:

```bash
node index.js
```

The server will start on the port specified in your `.env` file (default is 5000).

## API Endpoints

### Product Routes

- `GET /product`: Get a list of all products.
- `GET /product/:id`: Get a specific product by ID.
- `PATCH /product/:id`: Update a product by ID.
- `POST /product/:id`: Create or update a product by ID.

### Lead Routes

- `GET /lead`: Get a list of all leads.
- `GET /lead/:id`: Get a specific lead by ID.
- `PATCH /lead/:id`: Update a lead by ID.
- `POST /lead/:id`: Create or update a lead by ID.

### Email Routes

- `POST /sendMailBravo`: Send an email using the Brevo API.
- `POST /sendZohoMail`: Send an email using the Zoho Mail API.
- `GET /email/:emailid`: Get a list of emails for a specific email address from Zoho.
- `GET /emailId/:id`: Get the original content of a specific email from Zoho by its ID.

### Zoho Account Routes

- `GET /account`: Get Zoho account information and save it to `config.txt`.

### Company Config Routes

- `POST /company-config`: Create or update a company configuration.
- `GET /company-config`: Get all company configurations.

### WhatsApp Routes

- `GET /oauth`: Handle WhatsApp OAuth flow.
- `GET /webhook`: Verify the WhatsApp webhook.
- `POST /webhook`: Receive webhook events from WhatsApp.

### Other Routes

- `GET /`: Welcome message.
- `ALL /log`: A route for logging request bodies.
