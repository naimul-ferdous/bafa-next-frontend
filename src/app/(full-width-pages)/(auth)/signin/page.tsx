import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Bangladesh Air Force Academy",
  description: "Sign in to the Bangladesh Air Force Academy (BAFA) Management System.",
};

export default function SignIn() {
  return <SignInForm />;
}
