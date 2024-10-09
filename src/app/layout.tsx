import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import "../css/variables.css";
import "../css/globals.css";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "Bilan Carbone +",
  description: "Découvrez le logiciel Bilan Carbone +",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
