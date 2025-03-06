import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  MenuItem,
  Typography,
  Avatar,
  Input,
} from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import { quicksand } from "@/utils/fontHelper";

const TokenSelect = ({
  token,
  setToken,
  tokens,
  tokenAmount,
  setTokenAmount,
  disabler,
  placeHolder,
  readOnly,
}) => {
  const [menuDropped, setMenuDropped] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelectClick = () => {
    if (disabler === null) return;
    setMenuDropped(!menuDropped);
  };

  // ---------------------------------------------------------------
  // start - use Ref handlers for hide dropdown when clicked outside
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setMenuDropped(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // end - use Ref handlers for hide dropdown when clicked outside
  // -------------------------------------------------------------

  const handleItemClick = (tokenInfo) => {
    setToken(tokenInfo);
    setMenuDropped(false);
  };

  const disabledColor =
    disabler === null ? "rgb(235 , 235 , 235)" : "rgb(255 , 255 , 255)";

  const buttonWidth = token && !menuDropped ? "50%" : "100%";

  return (
    <Box
      ref={dropdownRef}
      width="100%"
      display="flex"
      sx={{
        border: "1px solid #bbc0c566",
        borderRadius: "6px",
      }}
    >
      <Button
        sx={{
          height: "50px",
          border: "none",
          borderRadius: "6px",
          paddingInline: "0.75rem",
          width: `${buttonWidth}`,
          backgroundColor: `${disabledColor}`,
        }}
        onClick={handleSelectClick}
        disabled={!disabler}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Typography
            variant="s"
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap="0.75rem"
            mr="0.5rem"
          >
            {token ? (
              <>
                <Avatar
                  src={token.icon}
                  alt={token.name}
                  sx={{ width: 28, height: 28 }}
                />
                <Typography
                  variant="s"
                  textTransform="capitalize"
                  className={quicksand.className}
                  fontSize="1rem"
                  fontWeight="600"
                  color="rgb(55 , 55 , 55)"
                >
                  {token.symbol}
                </Typography>
              </>
            ) : (
              disabler && (
                <>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      backgroundColor: "rgb(235 , 235 , 235)",
                      borderRadius: 14,
                    }}
                  />
                  <Typography
                    variant="s"
                    textTransform="none"
                    className={quicksand.className}
                    fontSize="1rem"
                    fontWeight="600"
                    color="rgb(55 , 55 , 55)"
                  >
                    Select a token
                  </Typography>
                </>
              )
            )}
          </Typography>
          {disabler !== null && (
            <ExpandMoreOutlinedIcon
              sx={{ fill: "gray" }}
            ></ExpandMoreOutlinedIcon>
          )}
        </Box>
      </Button>
      {token && !menuDropped && (
        <>
          <Typography
            variant="s"
            sx={{
              backgroundColor: "rgba(0 , 0 , 0, 0.05)",
              width: "1px",
              height: "26px",
              marginBlock: "12px",
            }}
          ></Typography>
          <Input
            placeholder={placeHolder}
            type="number"
            className={quicksand.className}
            disableUnderline="true"
            readOnly={readOnly}
            sx={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "rgb(55 , 55 , 55)",
              paddingInline: "0.5rem",
              backgroundColor: "white",
              borderRadius: "10px",
              paddingInline: "1rem",
              caretColor: "rgb(155 , 155 , 155)",
            }}
            value={tokenAmount}
            onChange={(e) => {
              if (!!setTokenAmount) {
                const newValue = e.target.value;

                // prevent negative numbers
                if (newValue === "" || parseFloat(newValue) >= 0) {
                  setTokenAmount(newValue);
                }
              }
            }}
          />
        </>
      )}

      {menuDropped && (
        <Box
          position="absolute"
          sx={{
            width: "100%",
            top: "5rem",
            outline: "2px solid transparent",
            outlineOffset: "2px",
            backgroundColor: "white",
            border: "1px solid #848c96",
            borderRadius: "0.375rem",
            padding: "0.25rem",
            zIndex: "9999",
          }}
        >
          {tokens.map((token) => (
            <MenuItem
              key={token.symbol}
              value={token.symbol}
              onClick={() => handleItemClick(token)}
              sx={{
                borderRadius: "0.25rem",
                height: "50px",
              }}
            >
              <Avatar
                src={token.icon}
                alt={token.name}
                sx={{ width: 28, height: 28, mr: 1 }}
              />
              <Typography
                variant="s"
                textTransform="capitalize"
                className={quicksand.className}
                fontSize="1rem"
                fontWeight="600"
                color="rgb(55 , 55 , 55)"
              >
                {token.symbol}
              </Typography>
            </MenuItem>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TokenSelect;
