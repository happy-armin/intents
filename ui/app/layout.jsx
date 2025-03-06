import React from "react";
import { Box, CssBaseline, Container } from "@mui/material";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Providers from "./Providers";
import Header from "../components/layouts/Header";
import Footer from "../components/layouts/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "usd.sv",
  description: "The absolutely fastest most secure cross-chain bridge possible",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <CssBaseline />
          {/* Outer layout container */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh", // Full screen height
              background: "rgba(242 , 244 , 246);",
            }}
          >
            {/* Navbar */}
            <Box
              component="header"
              sx={{
                textAlign: "center",
                py: 2,
              }}
            >
              <Header />
            </Box>

            {/* Main content */}
            <Box
              component="main"
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 3,
              }}
            >
              <Container maxWidth="lg">{children}</Container>
            </Box>

            {/* Footer */}
            <Box
              component="footer"
              sx={{
                py: 3,
              }}
            >
              <Footer />
            </Box>
          </Box>
        </Providers>
      </body>
    </html>
  );
}
