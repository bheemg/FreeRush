import { AuthForm } from "@/components/auth-form";
import { logIn } from "@/server/auth/actions";

export default function LoginPage() {
  return <AuthForm mode="login" action={logIn} />;
}
