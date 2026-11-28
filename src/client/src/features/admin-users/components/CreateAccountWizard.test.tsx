import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CreateAccountWizard } from "@/features/admin-users/components/CreateAccountWizard";
import { server } from "@/mocks/node";
import { readDb, setMockFailures } from "@/mocks/db/store";
import {
  expectNoA11yViolations,
  mockRouter,
  renderWithProviders,
  screen,
  signInAs,
  waitFor,
  within,
} from "../../../../tests/test-utils";

async function setup() {
  signInAs("admin@example.invalid");
  const user = userEvent.setup();
  const view = renderWithProviders(<CreateAccountWizard />, { route: "/admin/users/new" });
  await screen.findByRole("combobox", { name: /faculty/i });
  return { user, ...view };
}

async function fillStudent(user: ReturnType<typeof userEvent.setup>, overrides: { email?: string; studentNumber?: string } = {}) {
  await user.type(screen.getByLabelText(/^email/i), overrides.email ?? "an.nguyen@example.invalid");
  await user.type(screen.getByLabelText(/full name/i), "Nguyễn Văn An");
  await user.type(screen.getByLabelText(/student number/i), overrides.studentNumber ?? "23127555");
  await user.selectOptions(screen.getByRole("combobox", { name: /faculty/i }), "120");
}

const review = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Review" }));
const confirmButton = () => screen.getByRole("button", { name: /^(confirm|retry)$/i });

describe("CreateAccountWizard (UC-29 subset)", () => {
  it("form → review shows values, role permissions and the generated password; nothing is saved", async () => {
    const { user, container } = await setup();
    await fillStudent(user);
    await review(user);

    expect(await screen.findByText("an.nguyen@example.invalid")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(await screen.findByText(/register for activities/i)).toBeInTheDocument();
    expect(screen.getByTestId("generated-password")).toHaveTextContent("KHTN@NVA7555");
    expect(readDb().users.some((u) => u.email === "an.nguyen@example.invalid")).toBe(false);
    await expectNoA11yViolations(container);
  });

  it("confirm → result with a copyable temporary password; one request on double click", async () => {
    let posts = 0;
    server.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/admin/users")) posts += 1;
    });
    const { user } = await setup();
    await fillStudent(user);
    await review(user);
    await screen.findByTestId("generated-password");
    await user.dblClick(confirmButton());

    expect(await screen.findByText("Account created")).toBeInTheDocument();
    expect(screen.getByLabelText("Temporary password")).toHaveValue("KHTN@NVA7555");
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(posts).toBe(1);
    expect(readDb().users.find((u) => u.email === "an.nguyen@example.invalid")?.passwordPlain).toBe("KHTN@NVA7555");
    server.events.removeAllListeners();
  });

  it("override: < 8 characters blocks confirm; overrides survive edits; clearing restores the generated value", async () => {
    const { user } = await setup();
    await fillStudent(user);
    await review(user);
    await user.click(await screen.findByRole("button", { name: "Change" }));
    const input = screen.getByRole("textbox", { name: /^temporary password/i });
    await user.clear(input);
    await user.type(input, "short");
    expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();

    await user.clear(input);
    await user.type(input, "MyOwnPass1");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.type(screen.getByLabelText(/full name/i), " B");
    await review(user);
    expect(screen.getByRole("textbox", { name: /^temporary password/i })).toHaveValue("MyOwnPass1");

    await user.click(screen.getByRole("button", { name: /use generated password/i }));
    expect(screen.getByTestId("generated-password")).toHaveTextContent("KHTN@NVAB7555");
  });

  it("A2: cancel on a dirty form asks first and saves nothing", async () => {
    const { user } = await setup();
    await user.type(screen.getByLabelText(/^email/i), "x@example.invalid");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    const dialog = screen.getByRole("dialog", { name: /discard this account/i, hidden: true });
    await user.click(within(dialog).getByRole("button", { name: "Discard", hidden: true }));
    expect(mockRouter.push).toHaveBeenCalledWith("/admin/users");
    expect(readDb().users).toHaveLength(6);
  });

  it("A6: a policy violation keeps the input and explains it", async () => {
    const { user } = await setup();
    await fillStudent(user);
    await review(user);
    await screen.findByTestId("generated-password");
    const { http, HttpResponse } = await import("msw");
    server.use(
      http.post("http://localhost:8080/api/v1/admin/users", () =>
        HttpResponse.json({ success: false, code: "ROLE_POLICY_VIOLATION", message: "x" }, { status: 400 }),
      ),
    );
    await user.click(confirmButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(/role assignment is not allowed/i);
    expect(screen.getByText("an.nguyen@example.invalid")).toBeInTheDocument();
  });

  it("A9: a failure keeps all input and the retry succeeds", async () => {
    const { user } = await setup();
    await fillStudent(user);
    await review(user);
    await screen.findByTestId("generated-password");
    setMockFailures(["createUser"]);
    await user.click(confirmButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("The service is unavailable. Please try again.");
    expect(readDb().users).toHaveLength(6);

    setMockFailures([]);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Account created")).toBeInTheDocument();
  });

  it("duplicate email goes back to the form with the field marked", async () => {
    const { user } = await setup();
    await fillStudent(user, { email: "student1@example.invalid" });
    await review(user);
    await screen.findByTestId("generated-password");
    await user.click(confirmButton());
    expect(await screen.findByText("This email is already in use")).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveValue("student1@example.invalid");
  });

  it("switching Student → Manager hides and drops the student fields", async () => {
    const { user } = await setup();
    await fillStudent(user);
    await user.click(screen.getByRole("radio", { name: /manager/i }));
    expect(screen.queryByLabelText(/student number/i)).not.toBeInTheDocument();
    await review(user);
    expect(await screen.findByText("Manager")).toBeInTheDocument();
    expect(screen.queryByText("23127555")).not.toBeInTheDocument();
    expect(screen.getByTestId("generated-password").textContent).toMatch(/^KHTN@NVA\d{4}$/);
  });

  it("a faculty load error offers retry and blocks review for students", async () => {
    signInAs("admin@example.invalid");
    setMockFailures(["listFaculties"]);
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountWizard />, { route: "/admin/users/new" });
    expect(await screen.findByText("The faculty list could not be loaded.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review" })).toBeDisabled();
    setMockFailures([]);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: /faculty/i })).toBeInTheDocument());
  });

  it("a 403 renders the shared no-permission view", async () => {
    signInAs("manager1@example.invalid");
    renderWithProviders(<CreateAccountWizard />, { route: "/admin/users/new" });
    expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument();
  });
});
