> ## Documentation Index
>
> Fetch the complete documentation index at: https://www.cashfree.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Cashfree MCP Server

The Cashfree MCP server enables AI tools and agents to integrate with Cashfree Payment Gateway, Payouts, and SecureID APIs using the Model Context Protocol (MCP). This guide explains how to set up and configure both local and remote MCP servers.

Cashfree offers two methods for merchants to set up the MCP server:

- **Local MCP server**: Use the local MCP server when you need complete control over the runtime environment. You must clone the repository, install dependencies, and configure the client manually. This setup is suitable for offline development, debugging, and custom testing scenarios.

- **Remote MCP server**: Use the remote MCP server to reduce setup time and infrastructure overhead. Cashfree hosts the server and provides access over HTTPS using streamable HTTP transport. You only need to configure endpoint URLs and authentication headers. Use this option for production environments and teams that prefer a cloud-hosted solution.

<Tabs>
  <Tab title="Local MCP">
    Use the following steps to set up the MCP server locally on your machine:

    ### Clone the repository

    Use the following steps to clone the MCP repository to your local system:

    1. Open a terminal window.
    2. Run the following command to clone the repository:

       ```bash theme={"dark"}
       git clone https://github.com/cashfree/cashfree-mcp.git
       ```
    3. Navigate to the project directory:

       ```bash theme={"dark"}
       cd cashfree-mcp
       ```

    ### Install dependencies

    Install the following project dependencies:

    1. Install **Node.js version 14.x or later** on your system if it's not already installed.
    2. Run the following command to install the project dependencies:

       ```bash theme={"dark"}
       npm install
       ```

    ### Configure the client

    You can configure the MCP server in your preferred MCP client. The following examples show how to configure Claude and Visual Studio Code (VS Code).

    #### Configure Claude

    Follow these steps to configure Claude with the Cashfree MCP server:

    1. Open the `claude_desktop_config.json` file.
    2. Add the following configuration block:

       ```json theme={"dark"}
       {
         "mcpServers": {
           "cashfree": {
             "command": "node",
             "args": ["/path/to/cashfree-mcp/src/index.js"],
             "env": {
               "PAYMENTS_APP_ID": "YOUR_PG_CLIENT_ID",
               "PAYMENTS_APP_SECRET": "YOUR_PG_CLIENT_SECRET",
               "PAYOUTS_APP_ID": "YOUR_PAYOUTS_CLIENT_ID",
               "PAYOUTS_APP_SECRET": "YOUR_PAYOUTS_CLIENT_SECRET",
               "TWO_FA_PUBLIC_KEY_PEM_PATH": "/path/to/public_key.pem",
               "SECUREID_APP_ID": "YOUR_SECUREID_CLIENT_ID",
               "SECUREID_APP_SECRET": "YOUR_SECUREID_CLIENT_SECRET",
               "TOOLS": "pg,payouts,secureid",
               "ENV": "sandbox"
             }
           }
         }
       }
       ```

    #### Configure Visual Studio Code

    Follow these steps to configure Visual Studio Code with the Cashfree MCP server:

    1. Open the `settings.json` file in Visual Studio Code.
    2. Add the following configuration block:

       ```json theme={"dark"}
       {
         "mcp": {
           "inputs": [],
           "servers": {
             "cashfree": {
               "command": "node",
               "args": ["/path/to/cashfree-mcp/src/index.js"],
               "env": {
                 "PAYMENTS_APP_ID": "YOUR_PG_CLIENT_ID",
                 "PAYMENTS_APP_SECRET": "YOUR_PG_CLIENT_SECRET",
                 "PAYOUTS_APP_ID": "YOUR_PAYOUTS_CLIENT_ID",
                 "PAYOUTS_APP_SECRET": "YOUR_PAYOUTS_CLIENT_SECRET",
                 "TWO_FA_PUBLIC_KEY_PEM_PATH": "/path/to/public_key.pem",
                 "SECUREID_APP_ID": "YOUR_SECUREID_CLIENT_ID",
                 "SECUREID_APP_SECRET": "YOUR_SECUREID_CLIENT_SECRET",
                 "TOOLS": "pg,payouts,secureid",
                 "ENV": "sandbox"
               }
             }
           }
         }
       }
       ```

  </Tab>

  <Tab title="Remote MCP">
    Use the following steps to connect to Cashfree’s hosted MCP server using HTTP:

    ### Configure the client

    Connect to the hosted MCP server if your client supports streamable HTTP. Add the following configuration block to your client settings:

    ```json theme={"dark"}
    "mcp": {
      "servers": {
        "Cashfree": {
          "url": "https://mcp.cashfree.com/mcp",
          "type": "http",
          "headers": {
            "PAYMENTS_APP_ID": "<your-payments-app-id>",
            "PAYMENTS_APP_SECRET": "<your-payments-app-secret>",
            "PAYOUTS_APP_ID": "<your-payouts-app-id>",
            "PAYOUTS_APP_SECRET": "<your-payouts-app-secret>",
            "PAYOUTS_APP_PUBLIC_KEY": "<base64-encoded PEM public key>",
            "SECUREID_APP_ID": "<your-secureid-app-id>",
            "SECUREID_APP_SECRET": "<your-secureid-app-secret>",
            "SECUREID_APP_PUBLIC_KEY": "<base64-encoded PEM public key>"
          }
        }
      }
    }
    ```

    ### Encode public keys

    You must base64-encode the public keys for Payouts and SecureID. Run the following command:

    ```bash theme={"dark"}
    base64 -i <public_key.pem>
    ```

    ### Use a proxy (optional)

    If your client doesn't support streamable HTTP, use the `mcp-remote` proxy tool. Add the following configuration block:

    ```json theme={"dark"}
    "mcpServers": {
      "Cashfree": {
        "command": "npx",
        "args": [
          "mcp-remote",
          "https://mcp.cashfree.com/mcp",
          "--header", "PAYMENTS_APP_ID: <your-id>",
          "--header", "PAYMENTS_APP_SECRET: <your-secret>",
          "--header", "PAYOUTS_APP_ID: <payouts-id>",
          "--header", "PAYOUTS_APP_SECRET: <payouts-secret>",
          "--header", "PAYOUTS_APP_PUBLIC_KEY: <base64-pem>",
          "--header", "SECUREID_APP_ID: <secureid-id>",
          "--header", "SECUREID_APP_SECRET: <secureid-secret>",
          "--header", "SECUREID_APP_PUBLIC_KEY: <base64-pem>"
        ]
      }
    }
    ```

  </Tab>
</Tabs>

## Configuration details

Set the following environment variables to authenticate your MCP server.

**Payment Gateway**

- `PAYMENTS_APP_ID`: Specify your Payment Gateway client ID.
- `PAYMENTS_APP_SECRET`: Specify your Payment Gateway client secret.

**Payouts**

- `PAYOUTS_APP_ID`: Specify your Payouts client ID.
- `PAYOUTS_APP_SECRET`: Specify your Payouts client secret.
- `TWO_FA_PUBLIC_KEY_PEM_PATH`: Provide the path to your 2FA public key.

**Secure ID**

- `SECUREID_APP_ID`: Specify your SecureID client ID.
- `SECUREID_APP_SECRET`: Specify your SecureID client secret.
- `TWO_FA_PUBLIC_KEY_PEM_PATH`: Provide the path to your 2FA public key.

**Environment**

This configuration is applicable only for the local MCP server.

- `ENV`: Set to `sandbox` for testing or `production` for live environments. Default is `sandbox`.

**Tools**

This configuration is applicable only for the local MCP server.

- `TOOLS`: Provide a comma-separated list of modules to enable:
  - `pg`: Payment Gateway
  - `payouts`: Payouts
  - `secureid`: SecureID

## Verify the configuration

To verify the setup:

1. Restart the MCP client to apply your configuration.

2. Check that the tools are loaded successfully.

3. Use the tools for tasks such as:
   - Creating a payment link
   - Checking payout transfer status
   - Generating KYC links

### Use cases

The following examples show how you can use Cashfree MCP with large language models (LLMs) to automate payments and identity verification using natural language.

- **Process invoices from PDFs using Claude**: Upload invoice PDFs directly to Claude. Claude extracts the payment details and triggers payouts using Cashfree MCP. You don’t need to set up complex workflows.

- **Convert natural language into payment or KYC links**: Ask an LLM: “Create a ₹2,000 payment link for mobile 9999999999.”
  Cashfree MCP generates the link instantly. You don’t need to write code or configure the setup manually.

- **Automate KYC from onboarding emails**: When onboarding requests arrive by email, use Gmail with Cashfree MCP to generate KYC verification links automatically. Your LLM generates the response in real time.

- **Combine Cashfree MCP with other tools**: Use Cashfree MCP with other MCP-compatible tools such as WhatsApp, Gmail, or GitHub to automate workflows. You can generate payment or KYC links, process invoices, and trigger actions using natural language. You don’t need to do any additional setup.

### Tool reference

The Cashfree MCP server supports a variety of tools, grouped by product category. Use these tools to interact with Payment Gateway, Payouts, and SecureID APIs from your AI agent or development environment.

#### Payment Gateway tools

| Tool name                                              | Description                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `search`                                               | Search across the Cashfree Payments developer documentation.               |
| `create-payment-link`                                  | Create a new payment link.                                                 |
| `fetch-payment-link-details`                           | View details and the current status of a payment link.                     |
| `cancel-payment-link`                                  | Cancel an active payment link. You can't make payments after cancellation. |
| `get-orders-for-a-payment-link`                        | View all orders associated with a payment link.                            |
| `create-order`                                         | Create an order to obtain a `payment_session_id`.                          |
| `get-order`                                            | Fetch details of an order using the order ID.                              |
| `get-order-extended`                                   | Get additional order data, such as address, cart, and customer details.    |
| `get-eligible-payment-methods`                         | Retrieve available payment methods for a specific order and amount.        |
| `get-payments-for-an-order`                            | View all payment attempts associated with an order.                        |
| `get-payment-by-id`                                    | View payment details using a payment ID.                                   |
| `create-refund`                                        | Initiate a refund for a payment.                                           |
| `get-all-refunds-for-an-order`                         | Fetch all refunds processed for an order.                                  |
| `get-refund`                                           | Retrieve details of a specific refund.                                     |
| `get-all-settlements`                                  | Retrieve settlement details using ID, UTR, or a date range.                |
| `get-split-and-settlement-details-by-order-id-v2-0`    | Get vendor split and settlement data for an order.                         |
| `get-settlements-by-order-id`                          | View all settlement records for a specific order.                          |
| `get-disputes-by-order-id`                             | Retrieve all disputes raised for an order.                                 |
| `get-disputes-by-payment-id`                           | Retrieve all disputes associated with a payment.                           |
| `get-disputes-by-dispute-id`                           | Retrieve details of a dispute using its dispute ID.                        |
| `accept-dispute-by-dispute-id`                         | Accept a dispute and resolve it in favour of the customer.                 |
| `submit-evidence-to-contest-the-dispute-by-dispute-id` | Submit supporting documents to contest a dispute.                          |
| `simulate-payment`                                     | Simulate a payment (requires a valid pre-created order).                   |
| `fetch-simulation`                                     | Retrieve details of a simulated payment.                                   |

#### Payouts

| Tool name                      | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| `standard-transfer-v2`         | Initiate a single fund transfer using Cashfree Payouts.         |
| `get-transfer-status-v2`       | Check the status of a transfer.                                 |
| `batch-transfer-v2`            | Initiate a batch of transfers in one request.                   |
| `get-batch-transfer-status-v2` | Check the status of a batch transfer.                           |
| `authorize`                    | Authenticate and obtain a bearer token for subsequent requests. |
| `create-cashgram`              | Create a new Cashgram to transfer money to recipients.          |
| `deactivate-cashgram`          | Deactivate an existing Cashgram.                                |
| `get-cashgram-status`          | Retrieve the status of a Cashgram.                              |

#### Secure ID

| Tool name                    | Description                                                         |
| ---------------------------- | ------------------------------------------------------------------- |
| `verify-name-match`          | Verify name match, including common variations and spelling errors. |
| `generate-kyc-link`          | Generate a link for users to submit KYC information.                |
| `get-kyc-link-status`        | Check the status of a KYC link.                                     |
| `generate-static-kyc-link`   | Create a reusable KYC link that doesn't expire after one use.       |
| `deactivate-static-kyc-link` | Disable a previously generated static KYC link.                     |
