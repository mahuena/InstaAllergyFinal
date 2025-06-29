# AllergySafe

This is a Next.js application built with Firebase Studio to help users identify potential allergens in food.

## Getting Started

### 1. Set Up Your API Key

The AI features in this app are powered by Google Gemini. To enable them, you need to provide an API key.

1.  Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Open the `.env` file in the project root.
3.  Replace the placeholder `"YOUR_API_KEY_HERE"` with your actual API key.

The line in your `.env` file should look like this:
`GOOGLE_API_KEY="xxxxxxxxxxxxxxxxxxxx"`


### 2. Run the App

Once the API key is set, you can run the app. The necessary packages from `package.json` will be installed automatically.

To get started, take a look at `src/app/page.tsx`.
