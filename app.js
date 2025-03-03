const express = require("express");
const readline = require("readline");
const axios = require("axios");
const app = express();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let cep;

app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000");
  rl.question("Digite o CEP: ", (resposta) => {
    cep = resposta;
    console.log(`Pesquisando CEP ${cep}`);
    rl.close();
  });
});

app.get("/", async (req, res) => {
  const url = `https://viacep.com.br/ws/${cep}/json/`;
  try {
    res.send(
      `<body style="background-color: black"><p style="color: white">Consultando CEP: ${cep}</p></body>`
    );
    const response = await axios.get(url);
    const endereco = response.data;
    console.log(cep);
    console.log(endereco);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Erro ao buscar endereço" });
  }
});
