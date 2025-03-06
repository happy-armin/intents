const port = process.env.HOST_PORT || 9090;

module.exports = {
  networks: {
    bttc: {
      privateKey: process.env.PRIVATE_KEY_BTTC,
      fullHost: "https://rpc.bt.io",
      network_id: "1",
    },
    donau: {
      privateKey: process.env.PRIVATE_KEY_DONAU,
      fullHost: "https://pre-rpc.bt.io",
      network_id: "2",
    },
    development: {
      privateKey: process.env.PRIVATE_KEY_DEV,
      fullHost: "http://127.0.0.1:" + port,
      network_id: "9",
    },
  },
  compilers: {
    solc: {
      version: "0.8.22",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "istanbul",
        viaIR: true,
      },
    },
  },
};
