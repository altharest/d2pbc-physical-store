const express = require("express");
const Database = require("better-sqlite3");
const axios = require("axios");
const readline = require("readline");
const app = express();
const db = new Database("./lojas.db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000");
  // console.log("DATABASE");
  // const tabela = db.prepare("SELECT * FROM lojas").all();
  // console.log(tabela);
  // console.log(tabela.map((x, index) => tabela[index].cep));
});

app.get("/", async (req, res) => {
  try {
    console.log("APP.GET");
    rl.question("Digite o CEP (apenas números): ", (resposta) => {
      let url = `https://brasilapi.com.br/api/cep/v2/${resposta}`;
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
