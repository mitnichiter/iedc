from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Listen for console messages
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    try:
        # 1. Login as admin
        page.goto("http://localhost:3000/register/login")

        # Wait for the login form to be visible after session check
        email_input = page.get_by_label("Email")
        expect(email_input).to_be_visible(timeout=15000)

        email_input.fill("admin@example.com")
        page.get_by_label("Password").fill("password")
        page.get_by_role("button", name="Login").click()

        # Wait for navigation to the admin dashboard (or wherever login redirects)
        expect(page).to_have_url("http://localhost:3000/admin/events")

        # 2. Navigate to the first event
        page.get_by_role("row").nth(1).get_by_role("cell").nth(0).click()
        expect(page).to_have_url(lambda url: "/admin/events/" in url)

        # 3. Go to registrations tab
        page.get_by_role("tab", name="Registrations").click()

        # 4. Find a pending registration and open the modal
        # This assumes there is at least one pending registration
        page.get_by_role("row").filter(has_text="pending").first.get_by_role("button", name="View & Verify").click()

        # Wait for the modal to appear
        expect(page.get_by_role("dialog")).to_be_visible()

        # 5. Click the "Approve" button and capture loading state
        approve_button = page.get_by_role("button", name="Approve")

        # Click the button
        approve_button.click()

        # Expect the button to be in loading state
        expect(approve_button).to_have_text("Approving...")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/loading_state.png")

        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")


    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
