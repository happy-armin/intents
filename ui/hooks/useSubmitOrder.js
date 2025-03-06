import { useEffect } from "react";
import { ethers } from "ethers";
import { IS_TEST } from "@/config/constants";
import { apiService } from "@/services/apiService";
import { PermIdentity } from "@mui/icons-material";

export function useSubmitOrder(
  orderSignature,
  permitSignature,
  orderData,
  permitData,
  process
) {
  useEffect(() => {
    (async () => {
      if (
        orderSignature &&
        permitSignature &&
        orderData &&
        permitData &&
        process === 4
      ) {
        console.log("useSubmitOrder");
        try {
          const orderRawbytes = ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "address",
              "address",
              "uint256",
              "uint256",
              "uint32",
              "uint32",
              "bytes32",
              "bytes",
            ],
            [
              orderData.intentAddress,
              orderData.user,
              orderData.nonce,
              orderData.sourceChainId,
              orderData.openDeadline,
              orderData.fillDeadline,
              orderData.orderDataType,
              orderData.orderData,
            ]
          );

          const permitRawbytes = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "address", "uint256", "uint256", "uint256"],
            [
              permitData.owner,
              permitData.spender,
              permitData.value,
              permitData.nonce,
              permitData.deadline,
            ]
          );

          console.log("orderData: " + orderRawbytes);
          console.log("permitData: " + permitRawbytes);
          console.log("orderSignature: " + orderSignature);
          console.log("permitSignature: " + permitSignature);
          console.log(orderData);
          console.log(permitData);

          if (!IS_TEST) {
            await apiService.submitOrder({
              permitsignature: permitSignature,
              permitrawbytes: permitRawbytes,
              ordersignature: orderSignature,
              orderrawbytes: orderRawbytes,
            });
          }
        } catch (err) {
          console.log("Error posting signature:", err);
        }
      }
    })();
  }, [process]);
}
