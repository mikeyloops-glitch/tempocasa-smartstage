export function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  return Boolean(
    publishableKey &&
      publishableKey.startsWith("pk_") &&
      !publishableKey.includes("replace_me") &&
      (!secretKey || (secretKey.startsWith("sk_") && !secretKey.includes("replace_me")))
  );
}
