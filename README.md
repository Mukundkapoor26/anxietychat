# AnxietyChat

AnxietyChat is a free AI assistant for anxiety support that helps users manage anxiety, stress, and overwhelming thoughts through compassionate conversations.

## Features

- Conversational AI support for anxiety
- Message limiting to prevent overuse
- Local storage for saving conversations
- Relaxing UI with background music
- Fully responsive design

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- OpenAI API

## Deployment to Cloudflare Pages

### Prerequisites

- A Cloudflare account
- An OpenAI API key

### Setup on Cloudflare Pages

1. Login to your Cloudflare Dashboard
2. Navigate to Pages
3. Click "Create a project" > "Connect to Git"
4. Select your repository and follow the setup wizard
5. Set the following build settings:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Root directory: `/`

6. Add the following environment variables in the Cloudflare Pages settings:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - Any other environment variables you may need

7. Deploy your application

### Important Notes for Cloudflare Pages Deployment

- Ensure your OpenAI API key is securely added to the environment variables
- The application uses client-side local storage for saving messages and conversations
- The message limit functionality is handled entirely client-side using localStorage

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env.local` and add your OpenAI API key
3. Install dependencies:
   ```
   npm install
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## License

[MIT](LICENSE) 