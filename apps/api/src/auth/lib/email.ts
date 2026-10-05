export async function sendWelcomeEmail(email: string, name: string) {
  console.log(`[EMAIL-SIMULATOR] Welcome email sent to ${email} (Name: ${name})`);
}

export async function sendPasswordResetEmail(email: string, url: string) {
  console.log(`[EMAIL-SIMULATOR] Password reset for ${email}: ${url}`);
}

export async function sendMagicLinkEmail(email: string, url: string) {
  console.log(`[EMAIL-SIMULATOR] Magic link for ${email}: ${url}`);
}

export async function sendChangeEmailConfirmation(oldEmail: string, newEmail: string, url: string) {
  console.log(`[EMAIL-SIMULATOR] Change email from ${oldEmail} to ${newEmail}: ${url}`);
}
