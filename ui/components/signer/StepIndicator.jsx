import React from "react";
import { Box, Typography } from "@mui/material";

const StepIndicator = ({ currentStep, stepsCompleted }) => {
  const steps = ["Signing", "Status"];

  return (
    <Box sx={{ width: "100%", py: 1 }}>
      <Box
        component="ol"
        sx={{
          display: "flex",
          justifyContent: "center",
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}
      >
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepsCompleted[stepNum];

          return (
            <Box
              component="li"
              key={step}
              sx={{
                display: "flex",
                alignItems: "center",
                px: 5,
              }}
            >
              <Box
                sx={{
                  width: "2rem",
                  height: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: isActive
                    ? "#f7931a"
                    : isCompleted
                    ? "#f7931a"
                    : "#e9ecef",
                  color: isActive || isCompleted ? "#fff" : "#6c757d",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  mx: 2,
                }}
              >
                {isCompleted ? "✔" : stepNum}
              </Box>
              <Typography
                sx={{
                  textAlign: "center",
                  fontWeight: isActive ? "bold" : "normal",
                  color: isActive
                    ? "#f7931a"
                    : isCompleted
                    ? "#f7931a"
                    : "#e9ecef",
                  fontSize: isActive ? "1.2rem" : "1rem",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {step}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default StepIndicator;
