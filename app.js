const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const readline = require("readline");
const app = express();
const db = new sqlite3.Database("./lojas.db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000");
});

app.get("/", async (req, res) => {
  try {
    console.log("APP.GET");
    rl.question("Digite o CEP: ", (resposta) => {
      let url = `https://viacep.com.br/ws/${resposta}/json/`;
      rl.close();
      res.send(url);
    });
  } catch (error) {
    console.log("Erro no bloco APP.GET");
    // console.log(error.message);
    res.status(500).json({ message: "Erro ao buscar endereço" });
  }
});

axios
  .get("http://localhost:3000/")
  .then((response) => {
    console.log("AXIOS");
    axios.get(response.data).then((response) => {
      console.log(response.data);
    });
  })
  .catch((error) => {
    console.log("Erro no bloco AXIOS");
    // console.log(error.message);
  });
