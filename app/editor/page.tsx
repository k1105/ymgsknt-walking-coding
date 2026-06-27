import AuthGate from "./AuthGate";
import EditorClient from "./EditorClient";

export const metadata = {
  title: "editor",
};

export default function EditorPage() {
  return (
    <AuthGate>
      <EditorClient />
    </AuthGate>
  );
}
