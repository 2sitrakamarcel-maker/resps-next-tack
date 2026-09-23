import "./globals.css";

export const metadata = {
  title: "Reps Tracker",
  description: "Suivi de séances et surcharge progressive",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}