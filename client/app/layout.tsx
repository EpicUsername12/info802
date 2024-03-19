import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "TP Info 802",
    description: "Crée par CHETTIBI Tarik",
    authors: [{ name: "CHETTIBI Tarik" }],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
            <body className={inter.className}>{children}</body>
        </html>
    );
}
