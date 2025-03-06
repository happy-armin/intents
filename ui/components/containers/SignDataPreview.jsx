import React, { useState } from "react";
// import mui components
import { Container, Box, Typography } from "@mui/material";
// import necessary objects
import { quicksand } from "@/utils/fontHelper";

const SignDataPreview = ({ orderData, permitData }) => {
  // console.log(permitData);

  return (
    <Container
      maxWidth="md"
      sx={{
        border: "none",
        borderRadius: 4,
        background: "rgb(255 , 255 , 255)",
        p: 3,
      }}
    >
      <Box display="flex" flexDirection="column" gap={3}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="start"
        >
          <Typography
            variant="h4"
            className={quicksand.className}
            sx={{
              fontSize: "1.25rem",
              fontWeight: "800",
            }}
          >
            Sign data preview
          </Typography>
          <Typography
            variant="h4"
            className={quicksand.className}
            sx={{
              fontSize: "1rem",
            }}
          >
            Order data and permit data will be seen here
          </Typography>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="start"
          textAlign="start"
          gap="1"
          ml={1}
        >
          <Typography
            variant="h5"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "700" }}
          >
            - Order Data
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            intentAddress :{" "}
            {orderData.intentAddress ? orderData.intentAddress : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            user : {orderData.user ? orderData.user : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            nonce : {orderData.nonce ? orderData.nonce : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            sourceChainId :{" "}
            {orderData.sourceChainId ? orderData.sourceChainId : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            openDeadline :{" "}
            {orderData.openDeadline ? orderData.openDeadline : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            fillDeadline :{" "}
            {orderData.fillDeadline ? orderData.fillDeadline : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            bridgeDataType :{" "}
            {orderData.orderDataType ? orderData.orderDataType : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{
              fontSize: "1rem",
              fontWeight: "500",
              width: "100%",
              wordWrap: "normal",
              overflowWrap: "anywhere",
            }}
          >
            bridgeData : {orderData.orderData ? orderData.orderData : "unknown"}
          </Typography>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="start"
          textAlign="start"
          gap="1"
          ml={1}
        >
          <Typography
            variant="h5"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "700" }}
          >
            - Permit Data
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            owner : {permitData.owner ? permitData.owner : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            spender : {permitData.spender ? permitData.spender : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            value : {permitData.value ? permitData.value : "unknown"}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            nonce : {permitData.nonce}
          </Typography>
          <Typography
            variant="s"
            className={quicksand.className}
            sx={{ fontSize: "1rem", fontWeight: "500" }}
          >
            deadline : {permitData.deadline ? permitData.deadline : "unknown"}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default SignDataPreview;
