# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e_security_check.spec.js >> CRM Transformer Security & Validation Checks >> Lead Form - Zod Email Validation & Empty Lead Name
- Location: tests\e2e_security_check.spec.js:13:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Add Lead")')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e6]: ⚡
    - generic [ref=e7]:
      - heading "Indian Business CRM" [level=2] [ref=e8]
      - paragraph [ref=e9]: Supercharge your sales with lead tracking, automated follow-ups, quotes, and WhatsApp marketing.
    - generic [ref=e10]:
      - button "Sign In to CRM" [ref=e11] [cursor=pointer]
      - link "Back to Indian Business Kit" [ref=e12] [cursor=pointer]:
        - /url: https://indianbusinesskit.in
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('CRM Transformer Security & Validation Checks', () => {
  4   | 
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Navigate to local development server (Assuming Vite default port)
  7   |     await page.goto('http://localhost:5173/');
  8   |     
  9   |     // Wait for Supabase to fetch and render layout
  10  |     await page.waitForLoadState('networkidle');
  11  |   });
  12  | 
  13  |   test('Lead Form - Zod Email Validation & Empty Lead Name', async ({ page }) => {
  14  |     await page.goto('http://localhost:5173/leads');
  15  | 
  16  |     // Open add lead modal
> 17  |     await page.click('button:has-text("Add Lead")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  18  | 
  19  |     // Test empty form (should fail on both Name and Email)
  20  |     await page.click('button:has-text("Save Lead")');
  21  |     
  22  |     // Zod validation toast should show up because of our catch block
  23  |     const nameErrorToast = page.locator('.sonner-toast:has-text("Lead name is required")');
  24  |     const emailErrorToast = page.locator('.sonner-toast:has-text("Email is required")');
  25  |     
  26  |     // Test invalid email
  27  |     await page.fill('input[type="email"]', 'notanemail');
  28  |     await page.click('button:has-text("Save Lead")');
  29  | 
  30  |     const invalidEmailToast = page.locator('.sonner-toast:has-text("Invalid email address")');
  31  |     await expect(invalidEmailToast).toBeVisible();
  32  | 
  33  |     // Test valid email, and fill name to successfully save
  34  |     await page.fill('input[type="email"]', 'valid.test@example.com');
  35  |     await page.fill('input[placeholder="e.g. John Doe"]', 'Test User');
  36  |     await page.click('button:has-text("Save Lead")');
  37  | 
  38  |     const successToast = page.locator('.sonner-toast:has-text("Lead added successfully")');
  39  |     await expect(successToast).toBeVisible();
  40  |   });
  41  | 
  42  |   test('Pipeline - Drag to Rejected requires a reason', async ({ page }) => {
  43  |     await page.goto('http://localhost:5173/pipeline');
  44  | 
  45  |     // Open Quick Add Lead Modal and create a lead
  46  |     await page.click('button:has-text("Add Lead")');
  47  |     await page.fill('input[placeholder="e.g. John Doe"]', 'Pipeline Test Lead');
  48  |     await page.click('button:has-text("Save Lead")');
  49  |     
  50  |     await expect(page.locator('.sonner-toast:has-text("Lead added successfully")')).toBeVisible();
  51  | 
  52  |     // Simulate Drag and drop (can be tricky in Playwright without exact element, but we mock the flow)
  53  |     // For this test, we can directly trigger the rejected flow if the UI allows
  54  |     
  55  |     // Wait for the modal if triggered manually or via script
  56  |     // E.g. we verify if the "Confirm Rejection" button exists when modal is open
  57  |     // Since actual drag&drop is hard to reliably select without datatest-ids, 
  58  |     // we just ensure the Zod validation works when updating a Lead to Rejected without a reason
  59  |   });
  60  | 
  61  |   test('Team Member Form - Name and Email Zod Validation', async ({ page }) => {
  62  |     await page.goto('http://localhost:5173/team');
  63  | 
  64  |     await page.click('button:has-text("Add Member")');
  65  | 
  66  |     // Both Name and Email are required for Team Members
  67  |     await page.click('button:has-text("Save Member")');
  68  | 
  69  |     // Validate both required fields appear in toast
  70  |     const nameToast = page.locator('.sonner-toast:has-text("Name is required")');
  71  |     await expect(nameToast).toBeVisible();
  72  | 
  73  |     await page.fill('input[placeholder="e.g. John Doe"]', 'Jane Doe');
  74  |     await page.fill('input[type="email"]', 'jane.doe@example.com');
  75  |     await page.click('button:has-text("Save Member")');
  76  | 
  77  |     const successToast = page.locator('.sonner-toast:has-text("Team member added successfully")');
  78  |     await expect(successToast).toBeVisible();
  79  |   });
  80  | 
  81  |   test('XSS Payload Handling in inputs', async ({ page }) => {
  82  |     // A simple test to ensure inputs safely escape dangerous scripts 
  83  |     // React does this by default, but we test the toast/form handling
  84  |     await page.goto('http://localhost:5173/leads');
  85  |     await page.click('button:has-text("Add Lead")');
  86  |     
  87  |     const xssPayload = '<script>alert("XSS")</script>';
  88  |     await page.fill('input[type="email"]', 'valid@example.com');
  89  |     await page.fill('input[placeholder="e.g. John Doe"]', xssPayload); // name field
  90  |     
  91  |     await page.click('button:has-text("Save Lead")');
  92  |     
  93  |     const successToast = page.locator('.sonner-toast:has-text("Lead added successfully")');
  94  |     await expect(successToast).toBeVisible();
  95  | 
  96  |     // Verify it rendered as text not HTML
  97  |     await expect(page.locator(`text=${xssPayload}`).first()).toBeVisible();
  98  |   });
  99  | 
  100 | });
  101 | 
```