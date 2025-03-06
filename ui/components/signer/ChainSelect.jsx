import React, { useState, useRef, useEffect } from "react";
import { Box, Button, MenuItem, Typography, Avatar } from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import { quicksand } from "@/utils/fontHelper";
import { ChainIconLink } from "@/config/networks";

const ChainSelect = ({ chain, setChain, chains }) => {
  const [menuDropped, setMenuDropped] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelectClick = () => {
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

  const handleItemClick = (chainInfo) => {
    setChain(chainInfo);
    setMenuDropped(false);
  };

  return (
    <Box ref={dropdownRef} width="100%">
      <Button
        sx={{
          height: "50px",
          border: "1px solid #bbc0c566",
          borderRadius: "6px",
          paddingInline: "0.75rem",
          width: "100%",
        }}
        onClick={handleSelectClick}
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
            {chain ? (
              <>
                <Avatar
                  src={ChainIconLink(chain.id)}
                  alt={chain.name}
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
                  {chain.name}
                </Typography>
              </>
            ) : (
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
                  Select a network
                </Typography>
              </>
            )}
          </Typography>
          <ExpandMoreOutlinedIcon
            sx={{ fill: "gray" }}
          ></ExpandMoreOutlinedIcon>
        </Box>
      </Button>

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
          {chains.map((chain) => (
            <MenuItem
              key={chain.id}
              value={chain.id}
              onClick={() => handleItemClick(chain)}
              sx={{
                borderRadius: "0.25rem",
                height: "50px",
              }}
            >
              <Avatar
                src={ChainIconLink(chain.id)}
                alt={chain.name}
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
                {chain.name}
              </Typography>
            </MenuItem>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ChainSelect;
