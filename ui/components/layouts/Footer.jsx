import React from "react";
import { Box, Typography, Link, Grid, Divider } from "@mui/material";

const Footer = () => {
  return (
    <Box component="footer" sx={{ color: "#555", py: 4 }}>
      {/* Top Section */}
      <Box sx={{ px: 4, pb: 4 }}>
        <Grid container spacing={4}>
          {/* Community Section */}
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              COMMUNITY
            </Typography>
            <Box>
              <Link href="#" underline="hover" color="primary">
                X
              </Link>
              <br />
              <Link href="https://github.com/usdsv/usd.sv" underline="hover" color="primary">
                Github
              </Link>
              <br />
              <Link href="https://t.me/usd_sv" underline="hover" color="primary">
                Telegram
              </Link>
            </Box>
          </Grid>
          {/* Ecosystem Section */}
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              ECOSYSTEM
            </Typography>
            <Box>
              <Link href="https://www.erc7683.org/" underline="hover" color="primary">
                ERC-7683
              </Link>
              <br />
              <Link href="https://usdt0.to/" underline="hover" color="primary">
                USDT0
              </Link>
            </Box>
          </Grid>
          {/* Resources Section */}
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              RESOURCES
            </Typography>
            <Box>
              <Link href="https://docs.usd.sv" underline="hover" color="primary">
                Docs
              </Link>
              <br />
              <Link href="https://blog.usd.sv" underline="hover" color="primary">
                Blog
              </Link>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Bottom Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 4,
          pt: 3,
        }}
      >
        {/* Footer Info */}
        <Box>
          <Typography variant="body2" color="textSecondary">
            Trustless Supercomputing S.V.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Demo UI for Cross-Chain Intent Bridging &copy; 2025
          </Typography>
        </Box>

        {/* Footer Links */}
        <Box>
          <Link href="#" underline="hover" color="inherit" sx={{ mx: 1 }}>
            Terms of Use
          </Link>
          <Link href="#" underline="hover" color="inherit" sx={{ mx: 1 }}>
            Privacy Policy
          </Link>
          <Link href="#" underline="hover" color="inherit" sx={{ mx: 1 }}>
            Cookie Policy
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
