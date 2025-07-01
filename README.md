# AllergySafe

This is a Next.js application built with Firebase Studio to help users identify potential allergens in food.

## Getting Started Locally

If you have downloaded or cloned this project to your local machine, follow these steps to get it running.

### 1. Set Up Your API Key

The AI features in this app are powered by Google Gemini. To enable them, you need to provide an API key.

1.  Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Create a file named `.env` in the project root (if it doesn't exist).
3.  Add the following line to your `.env` file, replacing the placeholder with your actual key:

`GOOGLE_API_KEY="YOUR_API_KEY_HERE"`

### 2. Install Dependencies

Navigate to the project's root directory in your terminal and run the following command to install all the required packages:

```bash
npm install
```

### 3. Run the Development Server

Once the installation is complete, you can start the app:

```bash
npm run dev
```

Now, open [http://localhost:9002](http://localhost:9002) in your browser to see the application.
