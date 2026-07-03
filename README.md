# Court is in Session: Hon'ble Judge Kanika's Birthday

A cinematic judicial celebration website for the future Judge Kanika. Happy Birthday, Future Judge Saheba!

This website has been configured for easy deployment on **Vercel** and local development using **Vite**.

## 🚀 How to Deploy on Vercel

### Option 1: Deploy with Git Integration (Recommended)
This is the easiest option and automatically deploys your updates every time you push to your Git repository:

1. Push this project to a new repository on **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
3. Import your repository.
4. Vercel will automatically detect that this is a **Vite** project and configure the build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (or `vite build`)
   - **Output Directory:** `dist`
5. Click **Deploy**!

### Option 2: Deploy using Vercel CLI
If you prefer deploying directly from your command line:

1. Install the Vercel CLI if you haven't already:
   ```bash
   npm install -g vercel
   ```
2. Run the deployment command in the project directory:
   ```bash
   vercel
   ```
3. Follow the prompts to log in and set up your project. Vercel will detect Vite and deploy it automatically.
4. For production deployment, run:
   ```bash
   vercel --prod
   ```

---

## 💻 Local Development

To run the project locally on your machine:

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the local development server:**
   ```bash
   npm run dev
   ```
   This will start a hot-reloading development server (usually at `http://localhost:5173`).

3. **Build for production:**
   ```bash
   npm run build
   ```
   This compiles and optimizes all assets into the `dist/` directory, ready to be served.
