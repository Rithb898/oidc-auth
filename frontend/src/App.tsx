import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { ApplicationList } from "@/pages/applications/List";
import { ApplicationForm } from "@/pages/applications/Form";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/o/authenticate", element: <SignIn /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/o/verify-email", element: <VerifyEmail /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  {
    path: "/applications",
    element: (
      <ProtectedRoute>
        <ApplicationList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/applications/new",
    element: (
      <ProtectedRoute>
        <ApplicationForm />
      </ProtectedRoute>
    ),
  },
  {
    path: "/applications/:clientId/edit",
    element: (
      <ProtectedRoute>
        <ApplicationForm />
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <SignIn /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
