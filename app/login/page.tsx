import LoginForm from "./login-form";
import { Notice } from "@/components/ui";

const ERRORS: Record<string, string> = {
  "no-participant":
    "That email has a login but no participant record yet. Ask Sylvia to add you, then try again.",
  "link-expired":
    "That sign-in link has expired or was already used. Request a new one below.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  const errorKey = typeof params.error === "string" ? params.error : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <p className="text-accent text-xs font-semibold tracking-widest uppercase">
          E-commerce Park of Scandinavia
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">FRI Hub</h1>
        <p className="text-muted mt-2 text-sm">
          What&apos;s next, who&apos;s in your group, and where the material lives.
        </p>
      </div>

      {errorKey && ERRORS[errorKey] ? (
        <div className="mb-4">
          <Notice tone="error">{ERRORS[errorKey]}</Notice>
        </div>
      ) : null}

      <LoginForm next={next} />

      <p className="text-muted mt-8 text-xs">
        The hub is invite-only — there is no sign-up. If your address is not
        recognised, contact{" "}
        <a className="text-accent underline" href="mailto:info@ecommercepark.se">
          info@ecommercepark.se
        </a>
        .
      </p>
    </main>
  );
}
