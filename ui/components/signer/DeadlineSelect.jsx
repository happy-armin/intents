import { Box, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { quicksand } from "@/utils/fontHelper";
import { DeadlineData } from "@/config/constants";

const DeadlineItem = ({
  deadline,
  setDeadlineIndex,
  tokenAmount,
  tokenSymbol,
  active,
}) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        padding: "1rem",
        height: "3rem",
        cursor: "pointer",
        borderRadius: "0.375rem",
        "& + &": {
          borderTop: "1px solid #a0a0a020",
          borderRadius: "0rem",
        },
        ":hover": {
          backgroundColor: "#f7f7f7",
        },
      }}
      onClick={() => {
        setDeadlineIndex(deadline.index);
      }}
    >
      <Box display="flex" alignItems="center" gap="0.5rem">
        <Typography
          variant="c"
          component="span"
          sx={{
            position: "relative",
            width: "1rem",
            height: "1rem",
            borderRadius: "1rem",
            border: "1px solid #427BF3",
            backgroundColor: "trans",
            display: "flex",
            justifyContent: "center",
            "::after": {
              content: '""',
              position: "absolute",
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "0.25rem",
              backgroundColor: "#427BF3",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: active ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
            },
          }}
        ></Typography>
        {deadline.icon}
        <Typography
          variant="s"
          className={quicksand.className}
          sx={{
            fontSize: "1rem",
            fontWeight: "600",
          }}
        >
          {deadline.label}
        </Typography>
        <Typography
          variant="s"
          className={quicksand.className}
          sx={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#a0a0a0",
          }}
        >
          {deadline.time}
        </Typography>
      </Box>

      <Typography
        variant="s"
        className={quicksand.className}
        sx={{
          fontSize: "0.8rem",
          fontWeight: "500",
          color: "#a0a0a0",
        }}
      >
        {parseFloat(tokenAmount * deadline.fee).toFixed(5)} {tokenSymbol} (
        {deadline.fee * 100}% as a fee)
      </Typography>
    </Box>
  );
};
const DeadlineSelect = ({
  deadlineIndex,
  setDeadlineIndex,
  tokenAmount,
  tokenSymbol,
}) => {
  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      sx={{
        border: "1px solid #bbc0c566",
        borderRadius: "6px",
      }}
    >
      {DeadlineData.map((deadline) => (
        <DeadlineItem
          key={deadline.index}
          deadline={deadline}
          setDeadlineIndex={setDeadlineIndex}
          active={deadline.index === deadlineIndex}
          tokenAmount={tokenAmount}
          tokenSymbol={tokenSymbol}
        />
      ))}
    </Box>
  );
};

export default DeadlineSelect;
