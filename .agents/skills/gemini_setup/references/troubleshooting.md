# Gemini CLI & Google Cloud / AI Studio Setup Troubleshooting Guide

This guide compiles common issues encountered during hackathons when configuring Google AI Studio, Google Cloud, Vertex AI, and the Gemini CLI, specifically focusing on billing, credits, and environment variables.

---

## 1. Google Cloud Billing & Free Credits Issues

Vertex AI requires an active billing account linked to your project. Standard hackathon coupons or Google Cloud Free Trials must be explicitly linked to your project.

### Issue: "Billing not enabled" or "Project is not linked to a billing account"
- **Symptom**: Vertex AI API requests fail with a billing-related error, even if you have signed up for a Free Trial or redeemed a coupon.
- **Cause**: Google Cloud projects are created without billing enabled by default. You must manually link the project to your billing account.
- **Solution**:
  1. Open the [Google Cloud Billing Console](https://console.cloud.google.com/billing).
  2. If you see a warning that your project is not linked, click **Link a billing account**.
  3. Select your active billing account (e.g., "My Billing Account" or the account associated with your free trial/coupon credits) and click **Set Account**.
  4. You can check the linked project billing status using the `gcloud` CLI:
     ```bash
     gcloud beta billing projects describe YOUR_PROJECT_ID
     ```
     Ensure `billingEnabled` is `true`.

### Issue: Free Trial / Coupon Credits Not Applied
- **Symptom**: Your credit card is being charged, or you see errors indicating insufficient quota/funds despite having a coupon.
- **Cause**: Hackathon coupons or promo codes might not be selected as the active billing account for the project.
- **Solution**:
  1. Redeem your hackathon coupon at the provided link (usually redirects to the Google Cloud Console Billing page).
  2. Create a *new* billing account or check if a promotional billing account was created during redemption.
  3. Change the billing account of your project to this promotional account:
     - Go to **Billing** -> **Projects** tab.
     - Find your project, click the three dots actions menu, and select **Change billing**.
     - Choose the promotional billing account.

---

## 2. Vertex AI API Enablement

### Issue: "Vertex AI API has not been used in project..."
- **Symptom**: Requests return a 403 error saying the API `aiplatform.googleapis.com` is not enabled.
- **Solution**:
  - **Option A (CLI - Recommended)**: Enable the API using `gcloud`:
    ```bash
    gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
    ```
  - **Option B (Console)**: Visit the [Vertex AI API Console Library page](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com) and click **Enable**.

---

## 3. Authentication & Credentials (ADC)

The Gemini CLI uses Application Default Credentials (ADC) when communicating with Vertex AI.

### Issue: "Permission Denied" / "Could not find Application Default Credentials"
- **Symptom**: CLI fails to authenticating when trying to connect to Vertex AI.
- **Cause**: Active gcloud credentials have expired or the ADC file hasn't been generated.
- **Solution**:
  1. Generate new Application Default Credentials:
     ```bash
     gcloud auth application-default login
     ```
     This opens a browser tab. Log in with the Google account that has owner/editor access to your GCP project.
  2. Make sure your active project is set:
     ```bash
     gcloud config set project YOUR_PROJECT_ID
     ```
  3. Verify permissions. Ensure your account has the **Vertex AI User** role in your project:
     ```bash
     gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member="user:YOUR_EMAIL@gmail.com" \
       --role="roles/aiplatform.user"
     ```

---

## 4. Google AI Studio (Gemini API) API Key Issues

Google AI Studio uses simple API keys, which is often easier for rapid hackathon development than GCP IAM setup.

### Issue: API Key not detected or invalid
- **Symptom**: Error message stating `API_KEY_INVALID` or API key not found.
- **Solution**:
  1. Go to [Google AI Studio](https://aistudio.google.com/) and click **Get API key**.
  2. Generate a key and copy it.
  3. Set it as an environment variable in your terminal session:
     - **Windows PowerShell**:
       ```powershell
       $env:GEMINI_API_KEY="AIzaSy..."
       ```
     - **Linux / macOS / Git Bash**:
       ```bash
       export GEMINI_API_KEY="AIzaSy..."
       ```
  4. To persist it, add it to a local `.env` file in your project directory:
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```
     The Gemini CLI will automatically load it if run from the same directory containing `.env`.

### Issue: "User location is not supported"
- **Symptom**: API request fails indicating your geographic region is not supported.
- **Solution**:
  - Google AI Studio is available in most regions, but some EU and other territories may have restrictions or require specific consent.
  - If you encounter this, either:
    1. Switch your location/VPN to a supported region (e.g., US).
    2. Use **Vertex AI** (Google Cloud) instead, which allows selecting a specific region (like `us-central1` or `europe-west4`) and is usually available in more enterprise environments.

### Issue: "Your prepayment credits are depleted" (RESOURCE_EXHAUSTED / 429)
- **Symptom**: Requests return a 429 error stating `"Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay."`
- **Cause**: Google AI Studio has changed paid project accounts to a "Prepay" credit model. If the balance of prepay funds associated with your active developer project/model drops to zero, calls are blocked with a 429.
- **Solution**:
  1. Open [Google AI Studio Projects](https://aistudio.google.com/projects).
  2. Navigate to **Billing** / **Settings** of your connected project.
  3. Either:
     - Switch/downgrade your project back to the **Free Tier** (subject to rate limits but doesn't require prepay balance).
     - Add a small prepay fund balance (e.g., $5) via credit card to unlock pay-as-you-go high-quota limits.
     - Generate a new API key scoped to a different active project that is on the Free Tier.

---

## 5. Gemini CLI Usage Tips

- **Update CLI**: Make sure you are using the latest version:
  ```bash
  npm install -g @google/gemini-cli@latest
  ```
- **Force Vertex AI**: If you want to force the CLI to use Vertex AI rather than AI Studio API Key, set:
  ```bash
  export GOOGLE_GENAI_USE_VERTEXAI=true
  export GOOGLE_CLOUD_PROJECT="your-project-id"
  ```
- **Force AI Studio**: If you want to ensure it only uses the AI Studio API Key, clear the GCP env variables and set `GEMINI_API_KEY`.
